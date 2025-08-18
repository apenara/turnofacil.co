/**
 * Tipos relacionados con horarios y turnos
 * @fileoverview Define las interfaces y tipos para la gestión de horarios y turnos
 */

/**
 * Tipos de turno según legislación laboral colombiana
 */
export type ShiftType = 'regular' | 'overtime' | 'night' | 'holiday'

/**
 * Estados posibles de un turno
 */
export type ShiftStatus = 'draft' | 'confirmed' | 'in_progress' | 'completed'

/**
 * Plantilla de turno reutilizable
 */
export interface ShiftTemplate {
  /** ID único de la plantilla */
  id: string
  /** Nombre descriptivo de la plantilla */
  name: string
  /** Hora de inicio (formato HH:mm) */
  startTime: string
  /** Hora de fin (formato HH:mm) */
  endTime: string
  /** Duración en horas */
  duration: number
  /** Tipo de turno */
  type: ShiftType
  /** Color para mostrar en el calendario */
  color: string
  /** Descripción opcional */
  description?: string
  /** Si el turno cruza la medianoche */
  crossesMidnight: boolean
}

/**
 * Turno asignado en el horario
 */
export interface ScheduleShift {
  /** ID único del turno */
  id: string
  /** ID del empleado asignado */
  employeeId: string
  /** Nombre del empleado asignado */
  employeeName: string
  /** Posición del empleado */
  position: string
  /** ID de la ubicación */
  locationId: string
  /** Fecha del turno (YYYY-MM-DD) */
  date: string
  /** Hora de inicio (HH:mm) */
  startTime: string
  /** Hora de fin (HH:mm) */
  endTime: string
  /** Duración en horas */
  duration: number
  /** Tipo de turno */
  type: ShiftType
  /** Estado del turno */
  status: ShiftStatus
  /** Costo calculado del turno */
  cost: number
  /** Notas adicionales */
  notes?: string
  /** ID de la plantilla utilizada (si aplica) */
  templateId?: string
  /** Si el turno cruza la medianoche */
  crossesMidnight: boolean
  /** Fecha real de trabajo (para turnos que cruzan medianoche) */
  actualDate?: string
}

/**
 * Métricas calculadas del horario
 */
export interface ScheduleMetrics {
  /** Total de horas semanales */
  weeklyHours: number
  /** Costo total semanal */
  weeklyCost: number
  /** Número de empleados con turnos */
  employeeCount: number
  /** Utilización de presupuesto (porcentaje) */
  budgetUtilization: number
  /** Estado del presupuesto */
  budgetStatus: 'success' | 'warning' | 'danger'
}

/**
 * Configuración de la semana de trabajo
 */
export interface WeekConfig {
  /** Año */
  year: number
  /** Número de semana */
  week: number
  /** Fechas de la semana (Lunes a Domingo) */
  dates: Date[]
  /** Semana en formato string (YYYY-WXX) */
  weekString: string
}

/**
 * Datos para crear un turno
 */
export interface CreateShiftData {
  /** ID del empleado */
  employeeId: string
  /** Fecha del turno (YYYY-MM-DD) */
  date: string
  /** Hora de inicio (HH:MM) */
  startTime: string
  /** Hora de fin (HH:MM) */
  endTime: string
  /** Tipo de turno */
  type: ShiftType
  /** Notas adicionales */
  notes?: string
}

/**
 * Datos completos para crear un turno (incluye info del empleado)
 */
export interface CreateShiftFullData {
  /** ID del empleado */
  employeeId: string
  /** Nombre del empleado */
  employeeName: string
  /** Posición del empleado */
  position: string
  /** ID de ubicación */
  locationId: string
  /** Fecha del turno (YYYY-MM-DD) */
  date: string
  /** Hora de inicio (HH:MM) */
  startTime: string
  /** Hora de fin (HH:MM) */
  endTime: string
  /** Tipo de turno */
  type: ShiftType
  /** ID de plantilla (opcional) */
  templateId?: string
  /** Notas adicionales */
  notes?: string
}

/**
 * Datos para actualizar un turno
 */
export interface UpdateShiftData {
  /** ID del turno */
  id: string
  /** Fecha del turno (YYYY-MM-DD) */
  date?: string
  /** Hora de inicio (HH:MM) */
  startTime?: string
  /** Hora de fin (HH:MM) */
  endTime?: string
  /** Tipo de turno */
  type?: ShiftType
  /** Notas adicionales */
  notes?: string
}

/**
 * Datos para validación de turnos
 */
export interface ShiftValidationData {
  /** ID del empleado */
  employeeId?: string
  /** Nombre del empleado */
  employeeName?: string
  /** Posición del empleado */
  position?: string
  /** ID de ubicación */
  locationId?: string
  /** Fecha del turno (YYYY-MM-DD) */
  date?: string
  /** Hora de inicio (HH:MM) */
  startTime?: string
  /** Hora de fin (HH:MM) */
  endTime?: string
  /** Tipo de turno */
  type?: ShiftType
}

/**
 * Datos completos para actualizar un turno (incluye info del empleado)
 */
export interface UpdateShiftFullData {
  /** ID del turno */
  id: string
  /** ID del empleado */
  employeeId?: string
  /** Nombre del empleado */
  employeeName?: string
  /** Posición del empleado */
  position?: string
  /** ID de ubicación */
  locationId?: string
  /** Fecha del turno (YYYY-MM-DD) */
  date?: string
  /** Hora de inicio (HH:MM) */
  startTime?: string
  /** Hora de fin (HH:MM) */
  endTime?: string
  /** Tipo de turno */
  type?: ShiftType
  /** ID de plantilla (opcional) */
  templateId?: string
  /** Notas adicionales */
  notes?: string
}

/**
 * Resumen diario
 */
export interface DailySummary {
  /** Fecha del día */
  date: string
  /** Fecha formateada para mostrar */
  formattedDate: string
  /** Horas totales del día */
  totalHours: number
  /** Costo total del día */
  totalCost: number
  /** Número de turnos */
  shiftsCount: number
  /** Número de empleados únicos */
  employeesCount: number
  /** Si es día especial (domingo/festivo) */
  isSpecial: boolean
}

/**
 * Resumen por empleado
 */
export interface EmployeeSummary {
  /** ID del empleado */
  employeeId: string
  /** Nombre del empleado */
  employeeName: string
  /** Horas totales */
  totalHours: number
  /** Costo total */
  totalCost: number
  /** Número de turnos */
  shiftsCount: number
  /** Días trabajados */
  workingDays: number
  /** Promedio de horas por día */
  averageHoursPerDay: number
}

/**
 * Día especial
 */
export interface SpecialDay {
  /** Fecha */
  date: string
  /** Si es domingo */
  isSunday: boolean
  /** Si es festivo */
  isHoliday: boolean
  /** Nombre del festivo */
  holidayName?: string
}

/**
 * Resumen semanal completo
 */
export interface WeekSummary {
  /** Rango de la semana */
  weekRange: string
  /** Métricas generales */
  metrics: ScheduleMetrics
  /** Total de turnos */
  totalShifts: number
  /** Presupuesto restante */
  budgetRemaining: number
  /** Resumen diario */
  dailySummary: DailySummary[]
  /** Resumen por empleado */
  employeeSummary: EmployeeSummary[]
  /** Días especiales de la semana */
  specialDays: SpecialDay[]
}