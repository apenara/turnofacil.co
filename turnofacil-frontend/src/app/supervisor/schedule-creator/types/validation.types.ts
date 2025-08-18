/**
 * Tipos relacionados con validación de horarios
 * @fileoverview Define las interfaces para la validación según legislación laboral colombiana
 */

/**
 * Tipos de errores de validación
 */
export type ValidationErrorType = 
  | 'overtime'          // Exceso de horas semanales
  | 'availability'      // Empleado no disponible
  | 'overlap'           // Turnos superpuestos
  | 'understaffed'      // Personal insuficiente
  | 'budget'            // Exceso de presupuesto
  | 'rest_day'          // Falta día de descanso
  | 'leave_conflict'    // Conflicto con licencia
  | 'night_shift'       // Violación normas turno nocturno
  | 'consecutive_hours' // Exceso horas consecutivas
  | 'weekly_limit'      // Límite semanal excedido

/**
 * Severidad del error de validación
 */
export type ValidationSeverity = 'error' | 'warning' | 'info'

/**
 * Error de validación del horario
 */
export interface ValidationError {
  /** Tipo de error */
  type: ValidationErrorType
  /** Mensaje descriptivo del error */
  message: string
  /** Severidad del error */
  severity: ValidationSeverity
  /** IDs de turnos afectados */
  shifts?: string[]
  /** ID del empleado afectado */
  employeeId?: string
  /** Fecha específica del problema */
  date?: string
  /** Sugerencias para resolver el error */
  suggestions?: string[]
  /** Código de error para internacionalización */
  errorCode?: string
}

/**
 * Resultado de validación completa
 */
export interface ValidationResult {
  /** Si la validación pasó completamente */
  isValid: boolean
  /** Lista de errores encontrados */
  errors: ValidationError[]
  /** Lista de advertencias */
  warnings: ValidationError[]
  /** Información adicional */
  info: ValidationError[]
  /** Resumen de la validación */
  summary: {
    totalErrors: number
    totalWarnings: number
    criticalErrors: number
    employeesAffected: string[]
  }
}

/**
 * Configuración de validación
 */
export interface ValidationConfig {
  /** Máximo de horas semanales permitidas por defecto */
  maxWeeklyHours: number
  /** Máximo de horas consecutivas sin descanso */
  maxConsecutiveHours: number
  /** Tiempo mínimo entre turnos (en horas) */
  minimumRestBetweenShifts: number
  /** Si validar cumplimiento de días de descanso */
  enforceRestDays: boolean
  /** Si validar límites de presupuesto */
  enforceBudgetLimits: boolean
  /** Umbral de advertencia de presupuesto (porcentaje) */
  budgetWarningThreshold: number
  /** Si validar disponibilidad de empleados */
  enforceAvailability: boolean
}

/**
 * Contexto de validación
 */
export interface ValidationContext {
  /** Configuración de validación */
  config: ValidationConfig
  /** Turnos actuales a validar */
  shifts: any[] // ScheduleShift[]
  /** Empleados disponibles */
  employees: any[] // Employee[]
  /** Días de descanso asignados */
  restDays: any[] // RestDay[]
  /** Licencias aprobadas */
  leaves: any[] // LeaveRequest[]
  /** Semana que se está validando */
  weekDates: Date[]
  /** Presupuesto disponible */
  budgetInfo?: {
    weeklyBudget: number
    currentSpent: number
    alertThreshold: number
  }
}