/**
 * Hook para Gestión de Empleados
 * @fileoverview Hook especializado para operaciones de empleados en scheduling
 */

import { useState, useCallback, useMemo } from 'react'
import {
  Employee,
  ScheduleShift,
  RestDay,
  LeaveRequest,
  EmployeeMetrics,
  SchedulingContext,
  DayAvailability,
  ServiceResponse
} from '../core/types'
import { ScheduleService } from '../services/ScheduleService'
import { PermissionManager } from '../core/permissions'
import { COLOMBIAN_LABOR_CONSTANTS } from '../core/constants'

/**
 * Estado del hook de gestión de empleados
 */
interface EmployeeManagementState {
  selectedEmployee: Employee | null
  employeeShifts: ScheduleShift[]
  employeeRestDays: RestDay[]
  employeeLeaves: LeaveRequest[]
  employeeMetrics: EmployeeMetrics | null
  isLoading: boolean
}

/**
 * Configuración del hook
 */
interface UseEmployeeManagementOptions {
  context: SchedulingContext
  employees: Employee[]
  shifts: ScheduleShift[]
  restDays?: RestDay[]
  leaves?: LeaveRequest[]
}

/**
 * Resultado del hook
 */
interface UseEmployeeManagementResult {
  // Estado
  selectedEmployee: Employee | null
  employeeShifts: ScheduleShift[]
  employeeRestDays: RestDay[]
  employeeLeaves: LeaveRequest[]
  employeeMetrics: EmployeeMetrics | null
  isLoading: boolean
  
  // Acciones
  selectEmployee: (employee: Employee | null) => void
  getEmployeeAvailability: (employeeId: string, date: string) => DayAvailability | null
  calculateEmployeeWeeklyHours: (employeeId: string) => number
  calculateEmployeeCost: (employeeId: string) => number
  getEmployeeConflicts: (employeeId: string) => Array<{
    type: 'overlap' | 'availability' | 'rest' | 'leave'
    message: string
    date?: string
    severity: 'error' | 'warning'
  }>
  
  // Utilidades
  canAssignShift: (employeeId: string, shiftData: any) => boolean
  getAvailableEmployees: (date: string, startTime: string, endTime: string) => Employee[]
  getEmployeeWorkload: (employeeId: string) => {
    currentHours: number
    maxHours: number
    utilization: number
    status: 'underutilized' | 'optimal' | 'overloaded'
  }
  
  // Recomendaciones
  suggestRestDay: (employeeId: string) => string[]
  suggestOptimalShifts: (employeeId: string) => Array<{
    date: string
    startTime: string
    endTime: string
    reason: string
  }>
}

/**
 * Hook para gestión de empleados en scheduling
 */
export function useEmployeeManagement({
  context,
  employees,
  shifts,
  restDays = [],
  leaves = []
}: UseEmployeeManagementOptions): UseEmployeeManagementResult {

  // ========== SERVICIOS ==========
  
  const scheduleService = useMemo(() => 
    new ScheduleService(context)
  , [context])
  
  const permissionManager = useMemo(() => 
    new PermissionManager(context)
  , [context])

  // ========== ESTADO ==========
  
  const [state, setState] = useState<EmployeeManagementState>({
    selectedEmployee: null,
    employeeShifts: [],
    employeeRestDays: [],
    employeeLeaves: [],
    employeeMetrics: null,
    isLoading: false
  })

  // ========== FUNCIONES PRINCIPALES ==========

  /**
   * Selecciona un empleado y carga sus datos
   */
  const selectEmployee = useCallback(async (employee: Employee | null) => {
    setState(prev => ({ ...prev, selectedEmployee: employee, isLoading: true }))
    
    if (!employee) {
      setState(prev => ({
        ...prev,
        employeeShifts: [],
        employeeRestDays: [],
        employeeLeaves: [],
        employeeMetrics: null,
        isLoading: false
      }))
      return
    }

    try {
      // Filtrar datos del empleado seleccionado
      const employeeShifts = shifts.filter(shift => shift.employeeId === employee.id)
      const employeeRestDays = restDays.filter(rest => rest.employeeId === employee.id)
      const employeeLeaves = leaves.filter(leave => leave.employeeId === employee.id)
      
      // Calcular métricas
      const metrics = calculateEmployeeMetrics(employee, employeeShifts)
      
      setState(prev => ({
        ...prev,
        employeeShifts,
        employeeRestDays,
        employeeLeaves,
        employeeMetrics: metrics,
        isLoading: false
      }))

    } catch (error) {
      console.error('Error loading employee data:', error)
      setState(prev => ({ ...prev, isLoading: false }))
    }
  }, [shifts, restDays, leaves])

  /**
   * Calcula métricas de un empleado
   */
  const calculateEmployeeMetrics = useCallback((employee: Employee, employeeShifts: ScheduleShift[]): EmployeeMetrics => {
    const weeklyHours = employeeShifts.reduce((sum, shift) => sum + shift.duration, 0)
    const weeklyCost = employeeShifts.reduce((sum, shift) => sum + shift.cost, 0)
    const overtimeHours = Math.max(0, weeklyHours - COLOMBIAN_LABOR_CONSTANTS.REGULAR_HOURS_PER_WEEK)
    const restDaysAssigned = restDays.filter(rest => rest.employeeId === employee.id).length
    const shiftsCount = employeeShifts.length
    const avgShiftDuration = shiftsCount > 0 ? weeklyHours / shiftsCount : 0
    
    // Calcular eficiencia (esto podría ser más complejo en una implementación real)
    const targetHours = employee.maxWeeklyHours || COLOMBIAN_LABOR_CONSTANTS.REGULAR_HOURS_PER_WEEK
    const efficiency = weeklyHours > 0 ? Math.min(100, (weeklyHours / targetHours) * 100) : 0

    return {
      employeeId: employee.id,
      weeklyHours,
      weeklyCost,
      efficiency,
      overtimeHours,
      restDaysAssigned,
      shiftsCount,
      avgShiftDuration
    }
  }, [restDays])

  /**
   * Obtiene disponibilidad de un empleado para una fecha específica
   */
  const getEmployeeAvailability = useCallback((employeeId: string, date: string): DayAvailability | null => {
    const employee = employees.find(emp => emp.id === employeeId)
    if (!employee) return null

    const dayOfWeek = new Date(date).getDay()
    return employee.availability.find(avail => avail.day === dayOfWeek) || null
  }, [employees])

  /**
   * Calcula horas semanales de un empleado
   */
  const calculateEmployeeWeeklyHours = useCallback((employeeId: string): number => {
    return shifts
      .filter(shift => shift.employeeId === employeeId)
      .reduce((sum, shift) => sum + shift.duration, 0)
  }, [shifts])

  /**
   * Calcula costo semanal de un empleado
   */
  const calculateEmployeeCost = useCallback((employeeId: string): number => {
    return shifts
      .filter(shift => shift.employeeId === employeeId)
      .reduce((sum, shift) => sum + shift.cost, 0)
  }, [shifts])

  /**
   * Obtiene conflictos de un empleado
   */
  const getEmployeeConflicts = useCallback((employeeId: string) => {
    const employee = employees.find(emp => emp.id === employeeId)
    if (!employee) return []

    const employeeShifts = shifts.filter(shift => shift.employeeId === employeeId)
    const employeeLeaves = leaves.filter(leave => leave.employeeId === employeeId && leave.status === 'approved')
    const conflicts: Array<{
      type: 'overlap' | 'availability' | 'rest' | 'leave'
      message: string
      date?: string
      severity: 'error' | 'warning'
    }> = []

    // Verificar solapamientos
    for (let i = 0; i < employeeShifts.length; i++) {
      for (let j = i + 1; j < employeeShifts.length; j++) {
        const shift1 = employeeShifts[i]
        const shift2 = employeeShifts[j]
        
        if (shift1.date === shift2.date) {
          const start1 = timeToMinutes(shift1.startTime)
          const end1 = timeToMinutes(shift1.endTime)
          const start2 = timeToMinutes(shift2.startTime)
          const end2 = timeToMinutes(shift2.endTime)
          
          if (start1 < end2 && end1 > start2) {
            conflicts.push({
              type: 'overlap',
              message: `Solapamiento de turnos el ${shift1.date}`,
              date: shift1.date,
              severity: 'error'
            })
          }
        }
      }
    }

    // Verificar conflictos con licencias
    employeeShifts.forEach(shift => {
      const conflictingLeave = employeeLeaves.find(leave => 
        shift.date >= leave.startDate && shift.date <= leave.endDate
      )
      
      if (conflictingLeave) {
        conflicts.push({
          type: 'leave',
          message: `Turno programado durante licencia el ${shift.date}`,
          date: shift.date,
          severity: 'error'
        })
      }
    })

    // Verificar disponibilidad
    employeeShifts.forEach(shift => {
      const dayOfWeek = new Date(shift.date).getDay()
      const availability = employee.availability.find(avail => avail.day === dayOfWeek)
      
      if (!availability || !availability.available) {
        conflicts.push({
          type: 'availability',
          message: `Turno fuera de disponibilidad el ${shift.date}`,
          date: shift.date,
          severity: 'warning'
        })
      }
    })

    return conflicts
  }, [employees, shifts, leaves])

  /**
   * Verifica si se puede asignar un turno a un empleado
   */
  const canAssignShift = useCallback((employeeId: string, shiftData: any): boolean => {
    const employee = employees.find(emp => emp.id === employeeId)
    if (!employee) return false

    // Verificar permisos
    if (!permissionManager.canAccessLocation(employee.locationId)) {
      return false
    }

    // Verificar disponibilidad
    const availability = getEmployeeAvailability(employeeId, shiftData.date)
    if (!availability || !availability.available) {
      return false
    }

    // Verificar límite de horas semanales
    const currentHours = calculateEmployeeWeeklyHours(employeeId)
    const shiftDuration = calculateShiftDuration(shiftData.startTime, shiftData.endTime)
    const maxHours = employee.maxWeeklyHours || COLOMBIAN_LABOR_CONSTANTS.REGULAR_HOURS_PER_WEEK
    
    if (currentHours + shiftDuration > maxHours) {
      return false
    }

    return true
  }, [employees, permissionManager, getEmployeeAvailability, calculateEmployeeWeeklyHours])

  /**
   * Obtiene empleados disponibles para un turno específico
   */
  const getAvailableEmployees = useCallback((date: string, startTime: string, endTime: string): Employee[] => {
    return employees.filter(employee => {
      // Verificar permisos de ubicación
      if (!permissionManager.canAccessLocation(employee.locationId)) {
        return false
      }

      // Verificar disponibilidad del día
      const availability = getEmployeeAvailability(employee.id, date)
      if (!availability || !availability.available) {
        return false
      }

      // Verificar horario de disponibilidad
      if (availability.startTime && availability.endTime) {
        const availStart = timeToMinutes(availability.startTime)
        const availEnd = timeToMinutes(availability.endTime)
        const shiftStart = timeToMinutes(startTime)
        const shiftEnd = timeToMinutes(endTime)
        
        if (shiftStart < availStart || shiftEnd > availEnd) {
          return false
        }
      }

      // Verificar que no tenga otros turnos en conflicto
      const hasConflict = shifts.some(shift => 
        shift.employeeId === employee.id &&
        shift.date === date &&
        hasTimeOverlap(startTime, endTime, shift.startTime, shift.endTime)
      )
      
      if (hasConflict) {
        return false
      }

      // Verificar límite de horas semanales
      const currentHours = calculateEmployeeWeeklyHours(employee.id)
      const shiftDuration = calculateShiftDuration(startTime, endTime)
      const maxHours = employee.maxWeeklyHours || COLOMBIAN_LABOR_CONSTANTS.REGULAR_HOURS_PER_WEEK
      
      return currentHours + shiftDuration <= maxHours
    })
  }, [employees, shifts, permissionManager, getEmployeeAvailability, calculateEmployeeWeeklyHours])

  /**
   * Obtiene la carga de trabajo de un empleado
   */
  const getEmployeeWorkload = useCallback((employeeId: string) => {
    const employee = employees.find(emp => emp.id === employeeId)
    const currentHours = calculateEmployeeWeeklyHours(employeeId)
    const maxHours = employee?.maxWeeklyHours || COLOMBIAN_LABOR_CONSTANTS.REGULAR_HOURS_PER_WEEK
    const utilization = (currentHours / maxHours) * 100

    let status: 'underutilized' | 'optimal' | 'overloaded'
    if (utilization < 70) {
      status = 'underutilized'
    } else if (utilization <= 100) {
      status = 'optimal'
    } else {
      status = 'overloaded'
    }

    return {
      currentHours,
      maxHours,
      utilization,
      status
    }
  }, [employees, calculateEmployeeWeeklyHours])

  /**
   * Sugiere días de descanso para un empleado
   */
  const suggestRestDay = useCallback((employeeId: string): string[] => {
    const employee = employees.find(emp => emp.id === employeeId)
    if (!employee) return []

    const employeeShifts = shifts.filter(shift => shift.employeeId === employeeId)
    const workDays = new Set(employeeShifts.map(shift => shift.date))
    const existingRestDays = new Set(restDays
      .filter(rest => rest.employeeId === employeeId)
      .map(rest => rest.date)
    )

    const suggestions: string[] = []
    const weekDates = context.week.dates

    // Buscar días sin turnos que podrían ser días de descanso
    weekDates.forEach(date => {
      const dateStr = date.toISOString().split('T')[0]
      if (!workDays.has(dateStr) && !existingRestDays.has(dateStr)) {
        suggestions.push(dateStr)
      }
    })

    return suggestions.slice(0, 2) // Máximo 2 sugerencias
  }, [employees, shifts, restDays, context.week.dates])

  /**
   * Sugiere turnos óptimos para un empleado
   */
  const suggestOptimalShifts = useCallback((employeeId: string) => {
    const employee = employees.find(emp => emp.id === employeeId)
    if (!employee) return []

    const currentHours = calculateEmployeeWeeklyHours(employeeId)
    const maxHours = employee.maxWeeklyHours || COLOMBIAN_LABOR_CONSTANTS.REGULAR_HOURS_PER_WEEK
    const remainingHours = Math.max(0, maxHours - currentHours)

    if (remainingHours < 4) return [] // No sugerir si quedan menos de 4 horas

    const suggestions: Array<{
      date: string
      startTime: string
      endTime: string
      reason: string
    }> = []

    // Buscar días disponibles
    context.week.dates.forEach(date => {
      const dateStr = date.toISOString().split('T')[0]
      const dayOfWeek = date.getDay()
      const availability = employee.availability.find(avail => avail.day === dayOfWeek)
      
      if (availability?.available && availability.startTime && availability.endTime) {
        // Verificar que no tenga turnos ese día
        const hasShift = shifts.some(shift => 
          shift.employeeId === employeeId && shift.date === dateStr
        )
        
        if (!hasShift) {
          suggestions.push({
            date: dateStr,
            startTime: availability.startTime,
            endTime: availability.endTime,
            reason: 'Día disponible sin turnos asignados'
          })
        }
      }
    })

    return suggestions.slice(0, 3) // Máximo 3 sugerencias
  }, [employees, shifts, context.week.dates, calculateEmployeeWeeklyHours])

  // ========== UTILIDADES ==========

  const timeToMinutes = (time: string): number => {
    const [hours, minutes] = time.split(':').map(Number)
    return hours * 60 + minutes
  }

  const hasTimeOverlap = (start1: string, end1: string, start2: string, end2: string): boolean => {
    const start1Min = timeToMinutes(start1)
    const end1Min = timeToMinutes(end1)
    const start2Min = timeToMinutes(start2)
    const end2Min = timeToMinutes(end2)
    
    return start1Min < end2Min && end1Min > start2Min
  }

  const calculateShiftDuration = (startTime: string, endTime: string): number => {
    let start = timeToMinutes(startTime)
    let end = timeToMinutes(endTime)
    
    if (end < start) {
      end += 24 * 60 // Añadir 24 horas si cruza medianoche
    }
    
    return (end - start) / 60
  }

  // ========== RETORNO ==========

  return {
    // Estado
    selectedEmployee: state.selectedEmployee,
    employeeShifts: state.employeeShifts,
    employeeRestDays: state.employeeRestDays,
    employeeLeaves: state.employeeLeaves,
    employeeMetrics: state.employeeMetrics,
    isLoading: state.isLoading,
    
    // Acciones
    selectEmployee,
    getEmployeeAvailability,
    calculateEmployeeWeeklyHours,
    calculateEmployeeCost,
    getEmployeeConflicts,
    
    // Utilidades
    canAssignShift,
    getAvailableEmployees,
    getEmployeeWorkload,
    
    // Recomendaciones
    suggestRestDay,
    suggestOptimalShifts
  }
}