/**
 * Tipos relacionados con empleados y disponibilidad
 * @fileoverview Define las interfaces y tipos para la gestión de empleados
 */

/**
 * Disponibilidad de un empleado por día de la semana
 */
export interface DayAvailability {
  /** Día de la semana (0-6, Domingo-Sábado) */
  day: number
  /** Si el empleado está disponible este día */
  available: boolean
  /** Hora de inicio de disponibilidad (formato HH:mm) */
  startTime?: string
  /** Hora de fin de disponibilidad (formato HH:mm) */
  endTime?: string
  /** Restricciones específicas para este día */
  restrictions?: string[]
}

/**
 * Empleado del equipo de trabajo
 */
export interface Employee {
  /** ID único del empleado */
  id: string
  /** Nombre completo del empleado */
  name: string
  /** Posición/cargo del empleado */
  position: string
  /** ID de la ubicación donde trabaja */
  locationId: string
  /** Máximo de horas semanales permitidas */
  maxWeeklyHours: number
  /** Disponibilidad por días de la semana */
  availability: DayAvailability[]
  /** Tarifa por hora en COP */
  hourlyRate: number
  /** Habilidades y competencias del empleado */
  skills: string[]
}

/**
 * Estados posibles del empleado en el calendario
 */
export type EmployeeStatus = 'available' | 'on_shift' | 'on_break' | 'on_leave' | 'rest_day'

/**
 * Información del empleado para mostrar en el calendario
 */
export interface EmployeeCalendarInfo extends Employee {
  /** Estado actual del empleado */
  status: EmployeeStatus
  /** Horas trabajadas en la semana actual */
  weeklyHours: number
  /** Costo total de la semana */
  weeklyCost: number
}