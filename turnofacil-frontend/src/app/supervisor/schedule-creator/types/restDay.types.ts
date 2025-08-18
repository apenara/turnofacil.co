/**
 * Tipos relacionados con días de descanso según legislación laboral colombiana
 * @fileoverview Define las interfaces para el manejo de días de descanso obligatorios y compensatorios
 */

/**
 * Tipos de días de descanso según el Código Sustantivo del Trabajo
 */
export type RestDayType = 'weekly' | 'compensatory'

/**
 * Estados del día de descanso
 */
export type RestDayStatus = 'pending' | 'taken' | 'paid'

/**
 * Razones para días de descanso compensatorios
 */
export type CompensatoryReason = 'sunday_work' | 'holiday_work'

/**
 * Día de descanso según legislación laboral colombiana (CST)
 */
export interface RestDay {
  /** ID único del día de descanso */
  id: string
  /** ID del empleado */
  employeeId: string
  /** Nombre del empleado */
  employeeName: string
  /** Fecha del día de descanso (YYYY-MM-DD) */
  date: string
  /** Tipo de descanso */
  type: RestDayType
  /** Razón del compensatorio (solo para compensatorios) */
  reason?: CompensatoryReason
  /** Fecha del trabajo que genera el compensatorio */
  relatedWorkDate?: string
  /** Estado del día de descanso */
  status: RestDayStatus
  /** Fecha límite para tomar el compensatorio */
  expiryDate?: string
  /** Notas adicionales */
  notes?: string
}

/**
 * Tipos de clasificación de trabajo dominical según frecuencia
 */
export type SundayWorkType = 'occasional' | 'habitual'

/**
 * Niveles de prioridad para alertas
 */
export type AlertPriority = 'low' | 'medium' | 'high'

/**
 * Alerta de compensatorio para administrador
 */
export interface CompensatoryAlert {
  /** ID único de la alerta */
  id: string
  /** ID del empleado */
  employeeId: string
  /** Nombre del empleado */
  employeeName: string
  /** Fecha cuando trabajó domingo/festivo */
  workDate: string
  /** Tipo según cantidad en el mes (≤2 vs 3+) */
  type: SundayWorkType
  /** Si se debe un día compensatorio */
  compensatoryDue: boolean
  /** Si se debe pago adicional */
  paymentDue: boolean
  /** Días hasta expiración del compensatorio */
  daysUntilExpiry: number
  /** Prioridad de la alerta */
  priority: AlertPriority
  /** Fecha de creación de la alerta */
  createdAt: string
  /** Si la alerta ha sido resuelta */
  resolved: boolean
}

/**
 * Configuración de días de descanso
 */
export interface RestDayConfig {
  /** Mínimo de horas consecutivas de descanso semanal */
  minimumRestHours: number
  /** Día preferido para descanso semanal (0=Domingo, 6=Sábado) */
  preferredRestDay: number
  /** Días máximos para tomar compensatorio */
  compensatoryExpirationDays: number
  /** Límite de trabajos dominicales ocasionales por mes */
  occasionalSundayLimit: number
}

/**
 * Datos para crear un día de descanso
 */
export interface CreateRestDayData {
  /** ID del empleado */
  employeeId: string
  /** Nombre del empleado */
  employeeName: string
  /** Fecha del día de descanso (YYYY-MM-DD) */
  date: string
  /** Tipo de descanso */
  type: RestDayType
  /** Razón del compensatorio (solo para compensatorios) */
  reason?: CompensatoryReason
  /** Fecha del trabajo que genera el compensatorio */
  relatedWorkDate?: string
  /** Notas adicionales */
  notes?: string
}

/**
 * Información de cumplimiento de días de descanso
 */
export interface RestDayCompliance {
  /** ID del empleado */
  employeeId: string
  /** Nombre del empleado */
  employeeName: string
  /** Si el empleado tiene turnos asignados */
  hasShifts: boolean
  /** Número de días trabajados en la semana */
  workDaysCount: number
  /** Número de días de descanso asignados */
  restDaysCount: number
  /** Si necesita día de descanso obligatorio */
  needsRestDay: boolean
  /** Si tiene día de descanso semanal asignado */
  hasWeeklyRest: boolean
  /** Si cumple con la normativa */
  compliant: boolean
  /** Razón del incumplimiento si aplica */
  reason?: string
}