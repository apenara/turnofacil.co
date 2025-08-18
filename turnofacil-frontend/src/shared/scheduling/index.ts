/**
 * Módulo Compartido de Scheduling
 * @fileoverview Punto de entrada principal para todo el sistema de scheduling
 */

// ========== HOOKS ==========
export * from './hooks'

// ========== COMPONENTES ==========
export * from './components'

// ========== SERVICIOS ==========
export { ScheduleService } from './services/ScheduleService'
export { ValidationService } from './services/ValidationService'

// ========== SISTEMA DE PERMISOS ==========
export { 
  PermissionManager, 
  usePermissions, 
  PermissionUtils,
  type ScheduleFeature,
  type ScheduleUIConfig
} from './core/permissions'

// ========== TIPOS ==========
export type {
  // Tipos principales
  UserRole,
  ScheduleShift,
  Employee,
  ShiftTemplate,
  RestDay,
  LeaveRequest,
  Location,
  SchedulingContext,
  
  // Tipos de datos
  CreateShiftData,
  UpdateShiftData,
  CreateRestDayData,
  
  // Tipos de validación
  ValidationResult,
  ValidationError,
  ValidationConfig,
  
  // Tipos de métricas
  ScheduleMetrics,
  EmployeeMetrics,
  
  // Tipos de servicios
  ServiceResponse,
  UseScheduleResult,
  
  // Tipos de permisos
  RolePermissions
} from './core/types'

// ========== CONSTANTES ==========
export {
  COLOMBIAN_LABOR_CONSTANTS,
  SHIFT_CONFIG,
  VALIDATION_CONFIG,
  UI_CONFIG,
  DATE_CONFIG,
  BUDGET_CONFIG,
  PERFORMANCE_CONFIG
} from './core/constants'

// ========== UTILIDADES ==========
export const SchedulingUtils = {
  /**
   * Convierte tiempo HH:mm a minutos
   */
  timeToMinutes: (time: string): number => {
    const [hours, minutes] = time.split(':').map(Number)
    return hours * 60 + minutes
  },

  /**
   * Convierte minutos a formato HH:mm
   */
  minutesToTime: (minutes: number): string => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`
  },

  /**
   * Calcula duración de turno en horas
   */
  calculateShiftDuration: (startTime: string, endTime: string): number => {
    let start = SchedulingUtils.timeToMinutes(startTime)
    let end = SchedulingUtils.timeToMinutes(endTime)
    
    if (end < start) {
      end += 24 * 60 // Cruza medianoche
    }
    
    return (end - start) / 60
  },

  /**
   * Verifica si un turno cruza medianoche
   */
  crossesMidnight: (startTime: string, endTime: string): boolean => {
    return SchedulingUtils.timeToMinutes(endTime) <= SchedulingUtils.timeToMinutes(startTime)
  },

  /**
   * Verifica solapamiento entre dos turnos
   */
  hasTimeOverlap: (start1: string, end1: string, start2: string, end2: string): boolean => {
    const start1Min = SchedulingUtils.timeToMinutes(start1)
    const end1Min = SchedulingUtils.timeToMinutes(end1)
    const start2Min = SchedulingUtils.timeToMinutes(start2)
    const end2Min = SchedulingUtils.timeToMinutes(end2)
    
    return start1Min < end2Min && end1Min > start2Min
  },

  /**
   * Formatea fecha para display
   */
  formatDate: (date: string | Date): string => {
    const d = typeof date === 'string' ? new Date(date) : date
    return d.toLocaleDateString('es-CO', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  },

  /**
   * Obtiene rango de fechas de una semana
   */
  getWeekRange: (startDate: string): { startDate: string; endDate: string; dates: Date[] } => {
    const start = new Date(startDate)
    const dates: Date[] = []
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(start)
      date.setDate(start.getDate() + i)
      dates.push(date)
    }
    
    const endDate = dates[6].toISOString().split('T')[0]
    
    return {
      startDate,
      endDate,
      dates
    }
  },

  /**
   * Genera ID único para nuevos elementos
   */
  generateId: (prefix: string = 'item'): string => {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  },

  /**
   * Valida formato de tiempo HH:mm
   */
  isValidTimeFormat: (time: string): boolean => {
    const regex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
    return regex.test(time)
  },

  /**
   * Valida formato de fecha YYYY-MM-DD
   */
  isValidDateFormat: (date: string): boolean => {
    const regex = /^\d{4}-\d{2}-\d{2}$/
    return regex.test(date) && !isNaN(Date.parse(date))
  }
}

/**
 * Factory para crear contexto de scheduling
 */
export const createSchedulingContext = (
  user: { id: string; name: string; role: UserRole; locationId?: string },
  weekStartDate: string,
  availableLocations: Location[],
  settings: {
    weeklyBudgetLimit: number
    alertThreshold: number
    maxWeeklyHours: number
    enforceValidation: boolean
  }
): SchedulingContext => {
  const weekRange = SchedulingUtils.getWeekRange(weekStartDate)
  
  return {
    user: {
      ...user,
      permissions: {} as any // Se construirá con PermissionManager
    },
    week: {
      startDate: weekRange.startDate,
      endDate: weekRange.endDate,
      dates: weekRange.dates
    },
    location: {
      current: user.locationId || 'all',
      available: availableLocations
    },
    settings: {
      validation: {
        maxWeeklyHours: settings.maxWeeklyHours,
        maxConsecutiveHours: 12,
        minimumRestBetweenShifts: 12,
        enforceRestDays: true,
        enforceBudgetLimits: true,
        budgetWarningThreshold: settings.alertThreshold,
        enforceAvailability: settings.enforceValidation,
        allowOvertimeApproval: true
      },
      budget: {
        weeklyLimit: settings.weeklyBudgetLimit,
        alertThreshold: settings.alertThreshold
      }
    }
  }
}