/**
 * Hook para gestión de días de descanso según legislación laboral colombiana
 * @fileoverview Maneja el estado y operaciones de días de descanso obligatorios
 */

import { useState, useCallback, useMemo } from 'react'
import { 
  RestDay, 
  RestDayType, 
  CompensatoryReason,
  CreateRestDayData,
  Employee, 
  ScheduleShift,
  RestDayCompliance 
} from '../types'
import { 
  validateRestDayCompliance,
  generateRestDayRecommendations,
  COLOMBIAN_LABOR_CONSTANTS,
  isDateInWeek,
  dateToISOString,
  isSunday,
  isColombianHoliday,
  generateUniqueId
} from '../utils'

/**
 * Datos para actualizar un día de descanso existente
 */
export interface UpdateRestDayData extends Partial<CreateRestDayData> {
  id: string
}

/**
 * Hook para gestión de días de descanso
 * @param employees - Lista de empleados disponibles
 * @param shifts - Turnos actuales de la semana
 * @param weekDates - Fechas de la semana actual
 * @returns Objeto con estado y funciones de gestión de días de descanso
 */
export function useRestDayManagement(
  employees: Employee[],
  shifts: ScheduleShift[],
  weekDates: Date[]
) {
  // Estado principal
  const [restDays, setRestDays] = useState<RestDay[]>([])
  const [isLoading, setIsLoading] = useState(false)

  /**
   * Calcula el cumplimiento de días de descanso para todos los empleados
   */
  const compliance = useMemo(() => {
    const employeeCompliance: Record<string, RestDayCompliance> = {}
    
    employees.forEach(employee => {
      const employeeShifts = shifts.filter(s => s.employeeId === employee.id)
      const employeeRestDays = restDays.filter(r => r.employeeId === employee.id)
      
      employeeCompliance[employee.id] = validateRestDayCompliance(
        employee.id,
        employeeShifts,
        employeeRestDays,
        employee.name
      )
    })
    
    return employeeCompliance
  }, [employees, shifts, restDays])

  /**
   * Obtiene recomendaciones automáticas de días de descanso
   */
  const recommendations = useMemo(() => {
    return generateRestDayRecommendations(employees, shifts, restDays, weekDates)
  }, [employees, shifts, restDays, weekDates])

  /**
   * Crea un nuevo día de descanso
   */
  const createRestDay = useCallback(async (data: CreateRestDayData): Promise<RestDay> => {
    setIsLoading(true)
    
    try {
      const employee = employees.find(emp => emp.id === data.employeeId)
      if (!employee) {
        throw new Error('Empleado no encontrado')
      }

      // Verificar que no haya turnos en esa fecha
      const hasShiftOnDate = shifts.some(shift => 
        shift.employeeId === data.employeeId && shift.date === data.date
      )
      
      if (hasShiftOnDate) {
        throw new Error('No se puede asignar día de descanso: el empleado tiene turnos programados')
      }

      // Verificar que no exista ya un día de descanso en esa fecha
      const existingRestDay = restDays.find(restDay => 
        restDay.employeeId === data.employeeId && restDay.date === data.date
      )
      
      if (existingRestDay) {
        throw new Error('Ya existe un día de descanso asignado para esta fecha')
      }

      const newRestDay: RestDay = {
        id: generateUniqueId('rest'),
        employeeId: data.employeeId,
        employeeName: data.employeeName,
        date: data.date,
        type: data.type,
        reason: data.type === 'compensatory' && data.reason ? data.reason as CompensatoryReason : undefined,
        notes: data.notes,
        status: 'pending'
      }

      setRestDays(prevRestDays => [...prevRestDays, newRestDay])
      return newRestDay
    } catch (error) {
      console.error('Error creating rest day:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }, [employees, shifts, restDays])

  /**
   * Actualiza un día de descanso existente
   */
  const updateRestDay = useCallback(async (data: UpdateRestDayData): Promise<RestDay> => {
    setIsLoading(true)
    
    try {
      const existingRestDay = restDays.find(restDay => restDay.id === data.id)
      if (!existingRestDay) {
        throw new Error('Día de descanso no encontrado')
      }

      // Si se cambia la fecha, verificar conflictos
      if (data.date && data.date !== existingRestDay.date) {
        const hasShiftOnNewDate = shifts.some(shift => 
          shift.employeeId === existingRestDay.employeeId && shift.date === data.date
        )
        
        if (hasShiftOnNewDate) {
          throw new Error('No se puede mover el día de descanso: el empleado tiene turnos programados en la nueva fecha')
        }
      }

      const updatedRestDay: RestDay = {
        ...existingRestDay,
        ...data,
        reason: data.type === 'compensatory' && data.reason ? data.reason as CompensatoryReason : undefined
      }

      setRestDays(prevRestDays => 
        prevRestDays.map(restDay => 
          restDay.id === data.id ? updatedRestDay : restDay
        )
      )

      return updatedRestDay
    } catch (error) {
      console.error('Error updating rest day:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }, [restDays, shifts])

  /**
   * Elimina un día de descanso
   */
  const deleteRestDay = useCallback(async (restDayId: string): Promise<void> => {
    setIsLoading(true)
    
    try {
      setRestDays(prevRestDays => prevRestDays.filter(restDay => restDay.id !== restDayId))
    } catch (error) {
      console.error('Error deleting rest day:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }, [])

  /**
   * Asigna automáticamente días de descanso basado en recomendaciones
   */
  const autoAssignRestDays = useCallback(async (): Promise<RestDay[]> => {
    setIsLoading(true)
    const newRestDays: RestDay[] = []
    
    try {
      for (const recommendation of recommendations) {
        if (recommendation.suggestedDates.length > 0) {
          const employee = employees.find(emp => emp.id === recommendation.employeeId)
          if (!employee) continue

          // Tomar la primera fecha recomendada
          const suggestedDate = recommendation.suggestedDates[0]
          
          try {
            const restDay = await createRestDay({
              employeeId: employee.id,
              employeeName: employee.name,
              date: dateToISOString(suggestedDate),
              type: 'weekly',
              notes: 'Día de descanso asignado automáticamente'
            })
            newRestDays.push(restDay)
          } catch (error) {
            console.warn(`No se pudo asignar día de descanso automático para ${employee.name}:`, error)
          }
        }
      }
      
      return newRestDays
    } catch (error) {
      console.error('Error auto-assigning rest days:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }, [recommendations, employees, createRestDay])

  /**
   * Obtiene días de descanso de un empleado específico
   */
  const getRestDaysForEmployee = useCallback((employeeId: string): RestDay[] => {
    return restDays.filter(restDay => restDay.employeeId === employeeId)
  }, [restDays])

  /**
   * Obtiene días de descanso de una fecha específica
   */
  const getRestDaysForDate = useCallback((date: string): RestDay[] => {
    return restDays.filter(restDay => restDay.date === date)
  }, [restDays])

  /**
   * Verifica si un empleado tiene día de descanso en una fecha
   */
  const hasRestDayOnDate = useCallback((employeeId: string, date: string): boolean => {
    return restDays.some(restDay => 
      restDay.employeeId === employeeId && restDay.date === date
    )
  }, [restDays])

  /**
   * Obtiene estadísticas de cumplimiento
   */
  const complianceStats = useMemo(() => {
    const totalEmployees = employees.length
    const compliantEmployees = Object.values(compliance).filter(c => c.compliant).length
    const nonCompliantEmployees = totalEmployees - compliantEmployees
    const compliancePercentage = totalEmployees > 0 ? (compliantEmployees / totalEmployees) * 100 : 0

    return {
      totalEmployees,
      compliantEmployees,
      nonCompliantEmployees,
      compliancePercentage,
      needsAttention: nonCompliantEmployees > 0
    }
  }, [employees, compliance])

  /**
   * Obtiene días no laborables (domingos y festivos) de la semana
   */
  const nonWorkingDays = useMemo(() => {
    return weekDates.filter(date => 
      isSunday(date) || isColombianHoliday(date)
    )
  }, [weekDates])

  /**
   * Limpia todos los días de descanso
   */
  const clearAllRestDays = useCallback((): void => {
    setRestDays([])
  }, [])

  /**
   * Carga días de descanso desde datos externos
   */
  const loadRestDays = useCallback((restDaysData: RestDay[]): void => {
    setRestDays(restDaysData)
  }, [])

  return {
    // Estado
    restDays,
    isLoading,
    compliance,
    recommendations,
    complianceStats,
    nonWorkingDays,

    // Acciones CRUD
    createRestDay,
    updateRestDay,
    deleteRestDay,

    // Operaciones automáticas
    autoAssignRestDays,

    // Consultas
    getRestDaysForEmployee,
    getRestDaysForDate,
    hasRestDayOnDate,

    // Operaciones en lote
    clearAllRestDays,
    loadRestDays
  }
}