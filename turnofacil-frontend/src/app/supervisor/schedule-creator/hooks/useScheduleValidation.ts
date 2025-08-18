/**
 * Hook para validación de horarios según legislación laboral colombiana
 * @fileoverview Valida horarios contra reglas del Código Sustantivo del Trabajo
 */

import { useMemo } from 'react'
import { 
  ValidationResult, 
  ValidationError, 
  ValidationConfig, 
  ValidationContext,
  ScheduleShift,
  Employee,
  DayAvailability,
  RestDay,
  LeaveRequest
} from '../types'
import { 
  validateRestDayCompliance, 
  calculateEmployeeWeeklyHours,
  hasShiftOverlap,
  isDateInWeek
} from '../utils'

/**
 * Configuración por defecto para validación
 */
const DEFAULT_VALIDATION_CONFIG: ValidationConfig = {
  maxWeeklyHours: 48,
  maxConsecutiveHours: 12,
  minimumRestBetweenShifts: 12,
  enforceRestDays: true,
  enforceBudgetLimits: true,
  budgetWarningThreshold: 85,
  enforceAvailability: true
}

/**
 * Hook para validación de horarios
 * @param context - Contexto de validación con turnos, empleados, etc.
 * @param config - Configuración personalizada de validación
 * @returns Resultado de validación completo
 */
export function useScheduleValidation(
  context: ValidationContext,
  config: Partial<ValidationConfig> = {}
): ValidationResult {
  const validationConfig = useMemo(() => ({
    ...DEFAULT_VALIDATION_CONFIG,
    ...config
  }), [config])

  const validationResult = useMemo(() => {
    const errors: ValidationError[] = []
    const warnings: ValidationError[] = []
    const info: ValidationError[] = []

    const { shifts, employees, restDays, leaves, weekDates, budgetInfo } = context

    // Validar cada empleado
    employees.forEach(employee => {
      const employeeShifts = shifts.filter(s => s.employeeId === employee.id)
      const employeeRestDays = restDays.filter(r => r.employeeId === employee.id)
      const employeeLeaves = leaves.filter(l => l.employeeId === employee.id && l.status === 'approved')

      // 1. Validar horas semanales máximas
      const weeklyHours = calculateEmployeeWeeklyHours(employee.id, employeeShifts)
      if (weeklyHours > validationConfig.maxWeeklyHours) {
        errors.push({
          type: 'overtime',
          message: `${employee.name} excede las horas máximas semanales (${weeklyHours}h / ${validationConfig.maxWeeklyHours}h)`,
          severity: 'error',
          employeeId: employee.id,
          shifts: employeeShifts.map(s => s.id),
          suggestions: [
            'Reducir la duración de algunos turnos',
            'Redistribuir turnos a otros empleados',
            'Asignar día de descanso adicional'
          ],
          errorCode: 'WEEKLY_HOURS_EXCEEDED'
        })
      } else if (weeklyHours > employee.maxWeeklyHours) {
        warnings.push({
          type: 'overtime',
          message: `${employee.name} excede sus horas máximas personales (${weeklyHours}h / ${employee.maxWeeklyHours}h)`,
          severity: 'warning',
          employeeId: employee.id,
          shifts: employeeShifts.map(s => s.id),
          errorCode: 'PERSONAL_HOURS_EXCEEDED'
        })
      }

      // 2. Validar disponibilidad
      if (validationConfig.enforceAvailability) {
        employeeShifts.forEach(shift => {
          const shiftDate = new Date(shift.date)
          const dayOfWeek = shiftDate.getDay()
          const availability = employee.availability.find((a: DayAvailability) => a.day === dayOfWeek)

          if (!availability?.available) {
            errors.push({
              type: 'availability',
              message: `${employee.name} no está disponible los ${['domingos', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábados'][dayOfWeek]}`,
              severity: 'error',
              employeeId: employee.id,
              shifts: [shift.id],
              date: shift.date,
              errorCode: 'EMPLOYEE_NOT_AVAILABLE'
            })
          } else if (availability.startTime && availability.endTime) {
            const availStart = availability.startTime
            const availEnd = availability.endTime
            
            if (shift.startTime < availStart || shift.endTime > availEnd) {
              warnings.push({
                type: 'availability',
                message: `${employee.name} trabaja fuera de su horario disponible (${availStart} - ${availEnd})`,
                severity: 'warning',
                employeeId: employee.id,
                shifts: [shift.id],
                date: shift.date,
                errorCode: 'OUTSIDE_AVAILABLE_HOURS'
              })
            }
          }
        })
      }

      // 3. Validar turnos superpuestos
      for (let i = 0; i < employeeShifts.length - 1; i++) {
        for (let j = i + 1; j < employeeShifts.length; j++) {
          const shift1 = employeeShifts[i]
          const shift2 = employeeShifts[j]
          
          if (hasShiftOverlap(shift1, shift2)) {
            errors.push({
              type: 'overlap',
              message: `${employee.name} tiene turnos superpuestos el ${new Date(shift1.date).toLocaleDateString('es-CO')}`,
              severity: 'error',
              employeeId: employee.id,
              shifts: [shift1.id, shift2.id],
              date: shift1.date,
              errorCode: 'SHIFT_OVERLAP'
            })
          }
        }
      }

      // 4. Validar días de descanso (legislación colombiana)
      if (validationConfig.enforceRestDays) {
        const weekShifts = employeeShifts.filter(s => 
          isDateInWeek(new Date(s.date), weekDates)
        )
        const weekRestDays = employeeRestDays.filter(r => 
          isDateInWeek(new Date(r.date), weekDates)
        )

        const compliance = validateRestDayCompliance(employee.id, weekShifts, weekRestDays)
        
        if (!compliance.compliant) {
          errors.push({
            type: 'rest_day',
            message: `${employee.name} necesita al menos un día de descanso semanal`,
            severity: 'error',
            employeeId: employee.id,
            suggestions: [
              'Asignar un día de descanso semanal',
              'Reducir la cantidad de días trabajados'
            ],
            errorCode: 'MISSING_WEEKLY_REST'
          })
        }
      }

      // 5. Validar conflictos con licencias
      employeeShifts.forEach(shift => {
        const conflictingLeave = employeeLeaves.find(leave => 
          shift.date >= leave.startDate && shift.date <= leave.endDate
        )
        
        if (conflictingLeave) {
          errors.push({
            type: 'leave_conflict',
            message: `${employee.name} tiene licencia ${conflictingLeave.type} aprobada el ${new Date(shift.date).toLocaleDateString('es-CO')}`,
            severity: 'error',
            employeeId: employee.id,
            shifts: [shift.id],
            date: shift.date,
            suggestions: [
              'Remover el turno conflictivo',
              'Reasignar el turno a otro empleado'
            ],
            errorCode: 'LEAVE_CONFLICT'
          })
        }
      })

      // 6. Validar horas consecutivas máximas
      // Ordenar turnos por fecha y hora
      const sortedShifts = [...employeeShifts].sort((a, b) => {
        const dateCompare = a.date.localeCompare(b.date)
        if (dateCompare !== 0) return dateCompare
        return a.startTime.localeCompare(b.startTime)
      })

      for (let i = 0; i < sortedShifts.length - 1; i++) {
        const currentShift = sortedShifts[i]
        const nextShift = sortedShifts[i + 1]
        
        // Verificar si son turnos consecutivos (mismo día o día siguiente)
        const currentDate = new Date(currentShift.date)
        const nextDate = new Date(nextShift.date)
        const daysDiff = (nextDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24)
        
        if (daysDiff <= 1) {
          const totalConsecutiveHours = currentShift.duration + nextShift.duration
          
          if (totalConsecutiveHours > validationConfig.maxConsecutiveHours) {
            warnings.push({
              type: 'consecutive_hours',
              message: `${employee.name} tiene ${totalConsecutiveHours}h consecutivas (máximo ${validationConfig.maxConsecutiveHours}h)`,
              severity: 'warning',
              employeeId: employee.id,
              shifts: [currentShift.id, nextShift.id],
              errorCode: 'EXCESSIVE_CONSECUTIVE_HOURS'
            })
          }
        }
      }
    })

    // 7. Validar presupuesto
    if (validationConfig.enforceBudgetLimits && budgetInfo) {
      const totalCost = shifts.reduce((sum, shift) => sum + shift.cost, 0)
      const utilization = (totalCost / budgetInfo.weeklyBudget) * 100
      
      if (utilization > 100) {
        errors.push({
          type: 'budget',
          message: `Presupuesto excedido: ${utilization.toFixed(1)}% del presupuesto semanal`,
          severity: 'error',
          suggestions: [
            'Reducir turnos o duración',
            'Reasignar a empleados con menor tarifa',
            'Solicitar aprobación de presupuesto adicional'
          ],
          errorCode: 'BUDGET_EXCEEDED'
        })
      } else if (utilization > validationConfig.budgetWarningThreshold) {
        warnings.push({
          type: 'budget',
          message: `Presupuesto alto: ${utilization.toFixed(1)}% del presupuesto semanal`,
          severity: 'warning',
          errorCode: 'BUDGET_WARNING'
        })
      }
    }

    // Calcular resumen
    const affectedEmployees = new Set<string>()
    errors.forEach(error => error.employeeId && affectedEmployees.add(error.employeeId))
    warnings.forEach(warning => warning.employeeId && affectedEmployees.add(warning.employeeId))

    const criticalErrors = errors.filter(e => 
      ['overlap', 'leave_conflict', 'rest_day'].includes(e.type)
    ).length

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      info,
      summary: {
        totalErrors: errors.length,
        totalWarnings: warnings.length,
        criticalErrors,
        employeesAffected: Array.from(affectedEmployees)
      }
    }
  }, [context, validationConfig])

  return validationResult
}