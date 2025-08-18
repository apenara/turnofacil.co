/**
 * Servicio de Validación de Scheduling
 * @fileoverview Validaciones de negocio para turnos y horarios
 */

import {
  ScheduleShift,
  Employee,
  RestDay,
  LeaveRequest,
  ValidationResult,
  ValidationError,
  ValidationConfig,
  CreateShiftData,
  UpdateShiftData,
  SchedulingContext,
  ValidationType,
  ValidationSeverity
} from '../core/types'
import { COLOMBIAN_LABOR_CONSTANTS, VALIDATION_CONFIG } from '../core/constants'

/**
 * Servicio de validación para el sistema de scheduling
 */
export class ValidationService {
  private context: SchedulingContext
  private config: ValidationConfig

  constructor(context: SchedulingContext, config?: Partial<ValidationConfig>) {
    this.context = context
    this.config = {
      maxWeeklyHours: COLOMBIAN_LABOR_CONSTANTS.REGULAR_HOURS_PER_WEEK,
      maxConsecutiveHours: 12,
      minimumRestBetweenShifts: COLOMBIAN_LABOR_CONSTANTS.MIN_REST_BETWEEN_SHIFTS,
      enforceRestDays: true,
      enforceBudgetLimits: true,
      budgetWarningThreshold: 85,
      enforceAvailability: true,
      allowOvertimeApproval: true,
      ...config
    }
  }

  /**
   * Valida datos de un turno individual
   */
  async validateShiftData(data: CreateShiftData | UpdateShiftData): Promise<ValidationResult> {
    const errors: ValidationError[] = []
    
    // Validaciones básicas de formato
    this.validateTimeFormat(data, errors)
    this.validateDuration(data, errors)
    this.validateDate(data, errors)
    
    // Validaciones de negocio
    await this.validateEmployeeAvailability(data, errors)
    await this.validateShiftOverlaps(data, errors)
    await this.validateRestBetweenShifts(data, errors)
    
    return this.buildValidationResult(errors)
  }

  /**
   * Valida un horario completo
   */
  async validateFullSchedule(shifts: ScheduleShift[], employees: Employee[], restDays: RestDay[] = [], leaves: LeaveRequest[] = []): Promise<ValidationResult> {
    const errors: ValidationError[] = []
    
    // Validar cada empleado
    for (const employee of employees) {
      const employeeShifts = shifts.filter(s => s.employeeId === employee.id)
      const employeeRestDays = restDays.filter(r => r.employeeId === employee.id)
      const employeeLeaves = leaves.filter(l => l.employeeId === employee.id && l.status === 'approved')
      
      // Validaciones por empleado
      this.validateEmployeeWeeklyHours(employee, employeeShifts, errors)
      this.validateEmployeeRestDays(employee, employeeShifts, employeeRestDays, errors)
      this.validateLeaveConflicts(employee, employeeShifts, employeeLeaves, errors)
      this.validateConsecutiveShifts(employee, employeeShifts, errors)
    }
    
    // Validaciones globales
    this.validateBudgetLimits(shifts, employees, errors)
    this.validateStaffingLevels(shifts, employees, errors)
    
    return this.buildValidationResult(errors)
  }

  /**
   * Valida disponibilidad de un empleado
   */
  private async validateEmployeeAvailability(data: CreateShiftData | UpdateShiftData, errors: ValidationError[]): Promise<void> {
    if (!this.config.enforceAvailability) return

    // En una implementación real, obtendríamos el empleado de la base de datos
    const employee = await this.getEmployee(data.employeeId)
    if (!employee) {
      errors.push({
        id: `availability_${Date.now()}`,
        type: 'availability',
        severity: 'error',
        message: 'Empleado no encontrado',
        entityId: data.employeeId,
        entityType: 'employee'
      })
      return
    }

    const shiftDate = new Date(data.date)
    const dayOfWeek = shiftDate.getDay()
    const availability = employee.availability.find(a => a.day === dayOfWeek)

    if (!availability?.available) {
      errors.push({
        id: `availability_${Date.now()}`,
        type: 'availability',
        severity: 'error',
        message: `${employee.name} no está disponible los ${this.getDayName(dayOfWeek)}`,
        description: 'El empleado no tiene disponibilidad configurada para este día',
        entityId: data.employeeId,
        entityType: 'employee',
        suggestions: [
          'Seleccione otro empleado disponible',
          'Cambie la fecha del turno',
          'Actualice la disponibilidad del empleado'
        ]
      })
      return
    }

    // Validar horario dentro de disponibilidad
    if (availability.startTime && availability.endTime) {
      const availStart = this.timeToMinutes(availability.startTime)
      const availEnd = this.timeToMinutes(availability.endTime)
      const shiftStart = this.timeToMinutes(data.startTime)
      const shiftEnd = this.timeToMinutes(data.endTime)

      if (shiftStart < availStart || shiftEnd > availEnd) {
        errors.push({
          id: `availability_time_${Date.now()}`,
          type: 'availability',
          severity: 'warning',
          message: `Turno fuera del horario de disponibilidad (${availability.startTime} - ${availability.endTime})`,
          entityId: data.employeeId,
          entityType: 'shift',
          suggestions: [
            'Ajuste el horario del turno',
            'Verifique la disponibilidad del empleado'
          ]
        })
      }
    }
  }

  /**
   * Valida solapamientos de turnos
   */
  private async validateShiftOverlaps(data: CreateShiftData | UpdateShiftData, errors: ValidationError[]): Promise<void> {
    // En una implementación real, obtendríamos turnos existentes de la base de datos
    const existingShifts = await this.getEmployeeShifts(data.employeeId, data.date)
    
    const shiftStart = this.timeToMinutes(data.startTime)
    const shiftEnd = this.timeToMinutes(data.endTime)
    
    for (const existingShift of existingShifts) {
      // Skip si es el mismo turno (en caso de actualización)
      if ('id' in data && existingShift.id === data.id) continue
      
      const existingStart = this.timeToMinutes(existingShift.startTime)
      const existingEnd = this.timeToMinutes(existingShift.endTime)
      
      // Verificar solapamiento
      if (this.hasTimeOverlap(shiftStart, shiftEnd, existingStart, existingEnd)) {
        errors.push({
          id: `overlap_${Date.now()}`,
          type: 'overlap',
          severity: 'error',
          message: `Conflicto de horarios con turno existente (${existingShift.startTime} - ${existingShift.endTime})`,
          description: 'Los turnos se superponen en el tiempo',
          entityId: existingShift.id,
          entityType: 'shift',
          suggestions: [
            'Ajuste el horario del turno',
            'Elimine el turno conflictivo',
            'Asigne el turno a otro empleado'
          ]
        })
      }
    }
  }

  /**
   * Valida tiempo de descanso entre turnos
   */
  private async validateRestBetweenShifts(data: CreateShiftData | UpdateShiftData, errors: ValidationError[]): Promise<void> {
    const employeeShifts = await this.getEmployeeShifts(data.employeeId)
    
    for (const shift of employeeShifts) {
      if ('id' in data && shift.id === data.id) continue
      
      const restHours = this.calculateRestHours(data, shift)
      
      if (restHours < this.config.minimumRestBetweenShifts) {
        const severity: ValidationSeverity = restHours < 8 ? 'error' : 'warning'
        
        errors.push({
          id: `rest_${Date.now()}`,
          type: 'shift_gap',
          severity,
          message: `Tiempo de descanso insuficiente: ${restHours.toFixed(1)}h (mínimo: ${this.config.minimumRestBetweenShifts}h)`,
          description: 'No hay suficiente tiempo de descanso entre turnos consecutivos',
          entityId: shift.id,
          entityType: 'shift',
          suggestions: [
            'Aumente el tiempo entre turnos',
            'Asigne el turno a otro empleado',
            'Divida el turno en múltiples sesiones'
          ]
        })
      }
    }
  }

  /**
   * Valida horas semanales de un empleado
   */
  private validateEmployeeWeeklyHours(employee: Employee, shifts: ScheduleShift[], errors: ValidationError[]): void {
    const weeklyHours = shifts.reduce((total, shift) => total + shift.duration, 0)
    const maxHours = employee.maxWeeklyHours || this.config.maxWeeklyHours
    
    if (weeklyHours > maxHours) {
      const severity: ValidationSeverity = weeklyHours > maxHours + 8 ? 'error' : 'warning'
      
      errors.push({
        id: `weekly_hours_${employee.id}`,
        type: 'overtime',
        severity,
        message: `${employee.name} excede horas semanales: ${weeklyHours}h de ${maxHours}h`,
        description: 'El empleado supera las horas máximas permitidas por semana',
        entityId: employee.id,
        entityType: 'employee',
        suggestions: [
          'Reduzca las horas de algunos turnos',
          'Redistribuya turnos a otros empleados',
          'Solicite aprobación para horas extra'
        ],
        canAutoFix: true
      })
    }
  }

  /**
   * Valida días de descanso obligatorios
   */
  private validateEmployeeRestDays(employee: Employee, shifts: ScheduleShift[], restDays: RestDay[], errors: ValidationError[]): void {
    if (!this.config.enforceRestDays) return

    const workDays = new Set(shifts.map(s => s.date))
    const restDayDates = new Set(restDays.map(r => r.date))
    
    // Verificar si hay al menos un día de descanso
    const hasRestDay = restDayDates.size > 0 || workDays.size < 7
    
    if (!hasRestDay) {
      errors.push({
        id: `rest_day_${employee.id}`,
        type: 'rest_day',
        severity: 'error',
        message: `${employee.name} no tiene día de descanso asignado`,
        description: 'Todo empleado debe tener al menos un día de descanso semanal',
        entityId: employee.id,
        entityType: 'employee',
        suggestions: [
          'Asigne un día de descanso',
          'Elimine algún turno para crear un día libre',
          'Use la función de asignación automática'
        ],
        canAutoFix: true
      })
    }
  }

  /**
   * Valida conflictos con licencias
   */
  private validateLeaveConflicts(employee: Employee, shifts: ScheduleShift[], leaves: LeaveRequest[], errors: ValidationError[]): void {
    for (const shift of shifts) {
      for (const leave of leaves) {
        if (shift.date >= leave.startDate && shift.date <= leave.endDate) {
          errors.push({
            id: `leave_conflict_${shift.id}`,
            type: 'leave_conflict',
            severity: 'error',
            message: `${employee.name} tiene licencia aprobada en esta fecha`,
            description: `Licencia del ${leave.startDate} al ${leave.endDate}`,
            entityId: shift.id,
            entityType: 'shift',
            suggestions: [
              'Elimine el turno',
              'Asigne el turno a otro empleado',
              'Verifique las fechas de la licencia'
            ]
          })
        }
      }
    }
  }

  /**
   * Valida turnos consecutivos
   */
  private validateConsecutiveShifts(employee: Employee, shifts: ScheduleShift[], errors: ValidationError[]): void {
    const sortedShifts = shifts.sort((a, b) => a.date.localeCompare(b.date))
    let consecutiveDays = 0
    let lastDate: string | null = null
    
    for (const shift of sortedShifts) {
      if (lastDate) {
        const daysDiff = this.getDaysDifference(lastDate, shift.date)
        if (daysDiff === 1) {
          consecutiveDays++
        } else {
          consecutiveDays = 1
        }
      } else {
        consecutiveDays = 1
      }
      
      if (consecutiveDays > COLOMBIAN_LABOR_CONSTANTS.MAX_CONSECUTIVE_WORK_DAYS) {
        errors.push({
          id: `consecutive_${employee.id}_${shift.date}`,
          type: 'rest_day',
          severity: 'warning',
          message: `${employee.name} tiene más de ${COLOMBIAN_LABOR_CONSTANTS.MAX_CONSECUTIVE_WORK_DAYS} días consecutivos`,
          description: 'Se recomienda asignar un día de descanso',
          entityId: employee.id,
          entityType: 'employee',
          suggestions: [
            'Asigne un día de descanso',
            'Redistribuya algunos turnos'
          ]
        })
      }
      
      lastDate = shift.date
    }
  }

  /**
   * Valida límites de presupuesto
   */
  private validateBudgetLimits(shifts: ScheduleShift[], employees: Employee[], errors: ValidationError[]): void {
    if (!this.config.enforceBudgetLimits) return

    const totalCost = shifts.reduce((sum, shift) => sum + shift.cost, 0)
    const budgetLimit = this.context.settings.budget.weeklyLimit
    const utilization = (totalCost / budgetLimit) * 100

    if (utilization > 100) {
      errors.push({
        id: `budget_exceeded_${Date.now()}`,
        type: 'budget',
        severity: 'error',
        message: `Presupuesto excedido: ${utilization.toFixed(1)}% (${totalCost.toLocaleString()} de ${budgetLimit.toLocaleString()})`,
        description: 'El costo total de los turnos supera el presupuesto semanal',
        suggestions: [
          'Reduzca las horas de algunos turnos',
          'Elimine turnos no esenciales',
          'Solicite aprobación de presupuesto adicional'
        ]
      })
    } else if (utilization > this.config.budgetWarningThreshold) {
      errors.push({
        id: `budget_warning_${Date.now()}`,
        type: 'budget',
        severity: 'warning',
        message: `Presupuesto en riesgo: ${utilization.toFixed(1)}% utilizado`,
        description: 'Se está acercando al límite del presupuesto semanal',
        suggestions: [
          'Monitoree los costos restantes',
          'Considere optimizar la asignación de turnos'
        ]
      })
    }
  }

  /**
   * Valida niveles de cobertura
   */
  private validateStaffingLevels(shifts: ScheduleShift[], employees: Employee[], errors: ValidationError[]): void {
    // Agrupar turnos por fecha y ubicación
    const shiftsByDateLocation = new Map<string, ScheduleShift[]>()
    
    for (const shift of shifts) {
      const key = `${shift.date}_${shift.locationId}`
      if (!shiftsByDateLocation.has(key)) {
        shiftsByDateLocation.set(key, [])
      }
      shiftsByDateLocation.get(key)!.push(shift)
    }
    
    // Verificar cobertura mínima (esto sería configurable por ubicación)
    for (const [key, dayShifts] of shiftsByDateLocation.entries()) {
      const [date, locationId] = key.split('_')
      const coverage = dayShifts.length
      const minCoverage = 2 // Mínimo 2 empleados por día (configurable)
      
      if (coverage < minCoverage) {
        errors.push({
          id: `understaffed_${key}`,
          type: 'understaffed',
          severity: 'warning',
          message: `Posible falta de personal el ${date}: ${coverage} empleados (mínimo: ${minCoverage})`,
          description: 'La cobertura de personal puede ser insuficiente',
          suggestions: [
            'Asigne más empleados para este día',
            'Extienda los turnos existentes',
            'Verifique si la cobertura es adecuada para el tipo de día'
          ]
        })
      }
    }
  }

  /**
   * Construye el resultado final de validación
   */
  private buildValidationResult(errors: ValidationError[]): ValidationResult {
    const criticalErrors = errors.filter(e => e.severity === 'error')
    const warnings = errors.filter(e => e.severity === 'warning')
    
    // Contar por tipo
    const byType: Record<string, number> = {}
    for (const error of errors) {
      byType[error.type] = (byType[error.type] || 0) + 1
    }

    return {
      isValid: criticalErrors.length === 0,
      errors: criticalErrors,
      warnings: warnings,
      summary: {
        totalErrors: criticalErrors.length,
        totalWarnings: warnings.length,
        criticalErrors: criticalErrors.filter(e => e.severity === 'error').length,
        byType: byType as Record<ValidationType, number>
      }
    }
  }

  // ========== MÉTODOS DE UTILIDAD ==========

  private timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number)
    return hours * 60 + minutes
  }

  private hasTimeOverlap(start1: number, end1: number, start2: number, end2: number): boolean {
    return start1 < end2 && end1 > start2
  }

  private calculateRestHours(shift1: CreateShiftData | UpdateShiftData, shift2: ScheduleShift): number {
    const date1 = new Date(shift1.date)
    const date2 = new Date(shift2.date)
    
    // Calcular diferencia en horas entre el final de un turno y el inicio del siguiente
    const end1 = new Date(date1.getTime())
    end1.setHours(...shift1.endTime.split(':').map(Number), 0, 0)
    
    const start2 = new Date(date2.getTime())
    start2.setHours(...shift2.startTime.split(':').map(Number), 0, 0)
    
    const diffMs = Math.abs(start2.getTime() - end1.getTime())
    return diffMs / (1000 * 60 * 60)
  }

  private getDaysDifference(date1: string, date2: string): number {
    const d1 = new Date(date1)
    const d2 = new Date(date2)
    const diffTime = Math.abs(d2.getTime() - d1.getTime())
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  private getDayName(dayOfWeek: number): string {
    const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
    return days[dayOfWeek]
  }

  // ========== VALIDACIONES DE FORMATO ==========

  private validateTimeFormat(data: CreateShiftData | UpdateShiftData, errors: ValidationError[]): void {
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
    
    if (!timeRegex.test(data.startTime)) {
      errors.push({
        id: `time_format_start_${Date.now()}`,
        type: 'overlap',
        severity: 'error',
        message: 'Formato de hora de inicio inválido',
        description: 'Use el formato HH:mm (24 horas)'
      })
    }
    
    if (!timeRegex.test(data.endTime)) {
      errors.push({
        id: `time_format_end_${Date.now()}`,
        type: 'overlap',
        severity: 'error',
        message: 'Formato de hora de fin inválido',
        description: 'Use el formato HH:mm (24 horas)'
      })
    }
  }

  private validateDuration(data: CreateShiftData | UpdateShiftData, errors: ValidationError[]): void {
    const duration = this.calculateShiftDuration(data.startTime, data.endTime)
    
    if (duration < 1) {
      errors.push({
        id: `duration_min_${Date.now()}`,
        type: 'overlap',
        severity: 'error',
        message: 'Duración del turno muy corta (mínimo 1 hora)'
      })
    }
    
    if (duration > this.config.maxConsecutiveHours) {
      errors.push({
        id: `duration_max_${Date.now()}`,
        type: 'overtime',
        severity: 'warning',
        message: `Duración del turno muy larga: ${duration}h (máximo recomendado: ${this.config.maxConsecutiveHours}h)`
      })
    }
  }

  private validateDate(data: CreateShiftData | UpdateShiftData, errors: ValidationError[]): void {
    const shiftDate = new Date(data.date)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    if (shiftDate < today) {
      errors.push({
        id: `date_past_${Date.now()}`,
        type: 'overlap',
        severity: 'warning',
        message: 'La fecha del turno está en el pasado'
      })
    }
  }

  private calculateShiftDuration(startTime: string, endTime: string): number {
    const start = this.timeToMinutes(startTime)
    let end = this.timeToMinutes(endTime)
    
    if (end < start) {
      end += 24 * 60 // Cruza medianoche
    }
    
    return (end - start) / 60
  }

  // ========== MÉTODOS MOCK (EN PRODUCCIÓN SERÍAN LLAMADAS API) ==========

  private async getEmployee(employeeId: string): Promise<Employee | null> {
    // En producción, esto sería una llamada API
    return null
  }

  private async getEmployeeShifts(employeeId: string, date?: string): Promise<ScheduleShift[]> {
    // En producción, esto sería una llamada API
    return []
  }
}