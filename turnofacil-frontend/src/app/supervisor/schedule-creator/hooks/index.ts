/**
 * Exportaciones centralizadas de todos los hooks personalizados
 * @fileoverview Punto de entrada único para todos los hooks del schedule creator
 */

// Hook de validación de horarios
export * from './useScheduleValidation'
export type { ValidationResult, ValidationError, ValidationConfig, ValidationContext } from '../types'

// Hook de gestión de turnos
export * from './useShiftManagement'
export type { CreateShiftData, UpdateShiftData } from './useShiftManagement'

// Hook de gestión de días de descanso
export * from './useRestDayManagement'
export type { UpdateRestDayData } from './useRestDayManagement'

// Hook de gestión de licencias
export * from './useLeaveManagement'
export type { 
  CreateLeaveData, 
  UpdateLeaveData, 
  EmployeeLeaveStats 
} from './useLeaveManagement'

// Hook de cálculos de semana
export * from './useWeekCalculations'