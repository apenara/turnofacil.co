/**
 * Hook para gestión de turnos y horarios
 * @fileoverview Maneja el estado y operaciones CRUD de turnos
 */

import { useState, useCallback, useMemo } from 'react'
import { 
  ScheduleShift, 
  ShiftTemplate, 
  Employee, 
  ScheduleMetrics,
  ValidationResult
} from '../types'
import { 
  calculateShiftCost, 
  calculateScheduleMetrics, 
  determineShiftType,
  calculateHoursBetween,
  crossesMidnight,
  generateUniqueId
} from '../utils'
import { useScheduleValidation } from './useScheduleValidation'

/**
 * Datos para crear un nuevo turno
 */
export interface CreateShiftData {
  employeeId: string
  employeeName: string
  position: string
  locationId: string
  date: string
  startTime: string
  endTime: string
  templateId?: string
  notes?: string
}

/**
 * Datos para actualizar un turno existente
 */
export interface UpdateShiftData extends Partial<CreateShiftData> {
  id: string
}

/**
 * Hook para gestión de turnos
 * @param employees - Lista de empleados disponibles
 * @param weeklyBudget - Presupuesto semanal
 * @param weekDates - Fechas de la semana actual
 * @returns Objeto con estado y funciones de gestión de turnos
 */
export function useShiftManagement(
  employees: Employee[],
  weeklyBudget: number,
  weekDates: Date[]
) {
  // Estado principal
  const [shifts, setShifts] = useState<ScheduleShift[]>([])
  const [selectedShift, setSelectedShift] = useState<ScheduleShift | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  /**
   * Genera un ID único para turnos
   */
  const generateShiftId = useCallback(() => {
    return `shift-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }, [])

  /**
   * Calcula métricas del horario actual
   */
  const metrics: ScheduleMetrics = useMemo(() => {
    return calculateScheduleMetrics(shifts, employees, weeklyBudget)
  }, [shifts, employees, weeklyBudget])

  /**
   * Validación del horario actual
   */
  const validation: ValidationResult = useScheduleValidation({
    config: {
      maxWeeklyHours: 48,
      maxConsecutiveHours: 12,
      minimumRestBetweenShifts: 12,
      budgetWarningThreshold: 80,
      enforceRestDays: true,
      enforceBudgetLimits: true,
      enforceAvailability: true
    },
    shifts,
    employees,
    restDays: [], // Se pasará desde el componente padre
    leaves: [], // Se pasará desde el componente padre
    weekDates,
    budgetInfo: {
      weeklyBudget,
      currentSpent: metrics.weeklyCost,
      alertThreshold: 85
    }
  })

  /**
   * Crea un nuevo turno
   */
  const createShift = useCallback(async (data: CreateShiftData): Promise<ScheduleShift> => {
    setIsLoading(true)
    
    try {
      const employee = employees.find(emp => emp.id === data.employeeId)
      if (!employee) {
        throw new Error('Empleado no encontrado')
      }

      const duration = calculateHoursBetween(data.startTime, data.endTime)
      const shiftType = determineShiftType(data.date, data.startTime, data.endTime, duration)
      const cost = calculateShiftCost({
        id: '',
        employeeId: data.employeeId,
        employeeName: data.employeeName,
        position: data.position,
        locationId: data.locationId,
        date: data.date,
        startTime: data.startTime,
        endTime: data.endTime,
        duration,
        type: shiftType,
        status: 'draft',
        cost: 0,
        crossesMidnight: crossesMidnight(data.startTime, data.endTime),
        notes: data.notes
      }, employee.hourlyRate)

      const newShift: ScheduleShift = {
        id: generateShiftId(),
        employeeId: data.employeeId,
        employeeName: data.employeeName,
        position: data.position,
        locationId: data.locationId,
        date: data.date,
        startTime: data.startTime,
        endTime: data.endTime,
        duration,
        type: shiftType,
        status: 'draft',
        cost,
        notes: data.notes,
        templateId: data.templateId,
        crossesMidnight: crossesMidnight(data.startTime, data.endTime)
      }

      setShifts(prevShifts => [...prevShifts, newShift])
      return newShift
    } catch (error) {
      console.error('Error creating shift:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }, [employees, generateShiftId])

  /**
   * Actualiza un turno existente
   */
  const updateShift = useCallback(async (data: UpdateShiftData): Promise<ScheduleShift> => {
    setIsLoading(true)
    
    try {
      const existingShift = shifts.find(shift => shift.id === data.id)
      if (!existingShift) {
        throw new Error('Turno no encontrado')
      }

      const employee = employees.find(emp => emp.id === (data.employeeId || existingShift.employeeId))
      if (!employee) {
        throw new Error('Empleado no encontrado')
      }

      // Crear objeto actualizado
      const updatedData = {
        ...existingShift,
        ...data
      }

      // Recalcular propiedades derivadas si cambió el tiempo
      if (data.startTime || data.endTime) {
        updatedData.duration = calculateHoursBetween(updatedData.startTime, updatedData.endTime)
        updatedData.type = determineShiftType(
          updatedData.date, 
          updatedData.startTime, 
          updatedData.endTime, 
          updatedData.duration
        )
        updatedData.crossesMidnight = crossesMidnight(updatedData.startTime, updatedData.endTime)
        updatedData.cost = calculateShiftCost(updatedData, employee.hourlyRate)
      }

      const updatedShift = updatedData as ScheduleShift

      setShifts(prevShifts => 
        prevShifts.map(shift => 
          shift.id === data.id ? updatedShift : shift
        )
      )

      return updatedShift
    } catch (error) {
      console.error('Error updating shift:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }, [shifts, employees])

  /**
   * Elimina un turno
   */
  const deleteShift = useCallback(async (shiftId: string): Promise<void> => {
    setIsLoading(true)
    
    try {
      setShifts(prevShifts => prevShifts.filter(shift => shift.id !== shiftId))
      
      // Si el turno eliminado era el seleccionado, limpiar selección
      if (selectedShift?.id === shiftId) {
        setSelectedShift(null)
      }
    } catch (error) {
      console.error('Error deleting shift:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }, [selectedShift])

  /**
   * Crea un turno desde una plantilla
   */
  const createShiftFromTemplate = useCallback(async (
    template: ShiftTemplate,
    employeeId: string,
    date: string
  ): Promise<ScheduleShift> => {
    const employee = employees.find(emp => emp.id === employeeId)
    if (!employee) {
      throw new Error('Empleado no encontrado')
    }

    return createShift({
      employeeId,
      employeeName: employee.name,
      position: employee.position,
      locationId: employee.locationId,
      date,
      startTime: template.startTime,
      endTime: template.endTime,
      templateId: template.id,
      notes: template.description
    })
  }, [employees, createShift])

  /**
   * Duplica un turno existente
   */
  const duplicateShift = useCallback(async (
    shiftId: string,
    newDate?: string,
    newEmployeeId?: string
  ): Promise<ScheduleShift> => {
    const originalShift = shifts.find(shift => shift.id === shiftId)
    if (!originalShift) {
      throw new Error('Turno original no encontrado')
    }

    const targetEmployeeId = newEmployeeId || originalShift.employeeId
    const employee = employees.find(emp => emp.id === targetEmployeeId)
    if (!employee) {
      throw new Error('Empleado no encontrado')
    }

    return createShift({
      employeeId: targetEmployeeId,
      employeeName: employee.name,
      position: employee.position,
      locationId: employee.locationId,
      date: newDate || originalShift.date,
      startTime: originalShift.startTime,
      endTime: originalShift.endTime,
      templateId: originalShift.templateId,
      notes: originalShift.notes
    })
  }, [shifts, employees, createShift])

  /**
   * Obtiene turnos de un empleado en una fecha específica
   */
  const getShiftsForEmployeeAndDate = useCallback((
    employeeId: string,
    date: string
  ): ScheduleShift[] => {
    return shifts.filter(shift => 
      shift.employeeId === employeeId && shift.date === date
    )
  }, [shifts])

  /**
   * Obtiene todos los turnos de un empleado en la semana
   */
  const getShiftsForEmployee = useCallback((employeeId: string): ScheduleShift[] => {
    return shifts.filter(shift => shift.employeeId === employeeId)
  }, [shifts])

  /**
   * Obtiene turnos de una fecha específica
   */
  const getShiftsForDate = useCallback((date: string): ScheduleShift[] => {
    return shifts.filter(shift => shift.date === date)
  }, [shifts])

  /**
   * Confirma todos los turnos (cambia status de draft a confirmed)
   */
  const confirmAllShifts = useCallback(async (): Promise<void> => {
    setIsLoading(true)
    
    try {
      setShifts(prevShifts => 
        prevShifts.map(shift => ({
          ...shift,
          status: 'confirmed' as const
        }))
      )
    } catch (error) {
      console.error('Error confirming shifts:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }, [])

  /**
   * Limpia todos los turnos
   */
  const clearAllShifts = useCallback((): void => {
    setShifts([])
    setSelectedShift(null)
  }, [])

  /**
   * Carga turnos desde datos externos
   */
  const loadShifts = useCallback((shiftsData: ScheduleShift[]): void => {
    setShifts(shiftsData)
  }, [])

  return {
    // Estado
    shifts,
    selectedShift,
    isLoading,
    metrics,
    validation,

    // Acciones CRUD
    createShift,
    updateShift,
    deleteShift,
    createShiftFromTemplate,
    duplicateShift,

    // Consultas
    getShiftsForEmployeeAndDate,
    getShiftsForEmployee,
    getShiftsForDate,

    // Operaciones en lote
    confirmAllShifts,
    clearAllShifts,
    loadShifts,

    // Selección
    setSelectedShift
  }
}