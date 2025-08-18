/**
 * Utilidades para legislación laboral colombiana
 * @fileoverview Implementa las reglas del Código Sustantivo del Trabajo colombiano
 */

import { CompensatoryAlert, RestDay, SundayWorkType } from '../types'

/**
 * Constantes de la legislación laboral colombiana
 */
export const COLOMBIAN_LABOR_CONSTANTS = {
  /** Horas regulares por día */
  REGULAR_HOURS_PER_DAY: 8,
  /** Horas regulares por semana */
  REGULAR_HOURS_PER_WEEK: 48,
  /** Hora de inicio del turno nocturno (21:00) */
  NIGHT_START_HOUR: 21,
  /** Hora de fin del turno nocturno (06:00) */
  NIGHT_END_HOUR: 6,
  /** Horas mínimas de descanso semanal consecutivo */
  MINIMUM_WEEKLY_REST_HOURS: 24,
  /** Límite de trabajos dominicales ocasionales por mes */
  OCCASIONAL_SUNDAY_LIMIT: 2,
  /** Días para tomar compensatorio antes de expirar */
  COMPENSATORY_EXPIRATION_DAYS: 30,
  
  // Recargos según ley (porcentajes sobre salario base)
  /** Recargo por hora extra diurna (25%) */
  OVERTIME_RATE: 0.25,
  /** Recargo por hora nocturna (35%) */
  NIGHT_RATE: 0.35,
  /** Recargo por hora extra nocturna (75%) */
  OVERTIME_NIGHT_RATE: 0.75,
  /** Recargo por trabajo dominical (75%) */
  SUNDAY_RATE: 0.75,
  /** Recargo por trabajo en festivo (75%) */
  HOLIDAY_RATE: 0.75,
  /** Recargo por trabajo nocturno en festivo (110%) */
  HOLIDAY_NIGHT_RATE: 1.10,
  /** Recargo por trabajo nocturno dominical (110%) */
  SUNDAY_NIGHT_RATE: 1.10
} as const

/**
 * Calcula la fecha de Pascua para un año dado
 * @param year - Año para calcular
 * @returns Fecha de Pascua
 */
export function getEasterDate(year: number): Date {
  const f = Math.floor
  const G = year % 19
  const C = f(year / 100)
  const H = (C - f(C / 4) - f((8 * C + 13) / 25) + 19 * G + 15) % 30
  const I = H - f(H / 28) * (1 - f(29 / (H + 1)) * f((21 - G) / 11))
  const J = (year + f(year / 4) + I + 2 - C + f(C / 4)) % 7
  const L = I - J
  const month = 3 + f((L + 40) / 44)
  const day = L + 28 - 31 * f(month / 4)
  return new Date(year, month - 1, day)
}

/**
 * Obtiene todos los festivos colombianos para un año
 * @param year - Año para calcular festivos
 * @returns Array de fechas de festivos
 */
export function getColombianHolidays(year: number): Date[] {
  const holidays: Date[] = []
  
  // Festivos fijos
  holidays.push(new Date(year, 0, 1))   // Año Nuevo
  holidays.push(new Date(year, 4, 1))   // Día del Trabajo
  holidays.push(new Date(year, 6, 20))  // Día de la Independencia
  holidays.push(new Date(year, 7, 7))   // Batalla de Boyacá
  holidays.push(new Date(year, 11, 8))  // Inmaculada Concepción
  holidays.push(new Date(year, 11, 25)) // Navidad
  
  // Festivos móviles (se trasladan al lunes)
  const movableHolidays = [
    new Date(year, 0, 6),   // Epifanía
    new Date(year, 2, 19),  // San José
    new Date(year, 5, 29),  // San Pedro y San Pablo
    new Date(year, 7, 15),  // Asunción de la Virgen
    new Date(year, 9, 12),  // Día de la Raza
    new Date(year, 10, 1),  // Todos los Santos
    new Date(year, 10, 11), // Independencia de Cartagena
  ]
  
  movableHolidays.forEach(holiday => {
    const dayOfWeek = holiday.getDay()
    if (dayOfWeek !== 1) { // Si no es lunes
      const daysToAdd = dayOfWeek === 0 ? 1 : 8 - dayOfWeek
      holiday.setDate(holiday.getDate() + daysToAdd)
    }
    holidays.push(holiday)
  })
  
  // Festivos relacionados con Pascua
  const easter = getEasterDate(year)
  
  // Jueves Santo (3 días antes de Pascua)
  const holyThursday = new Date(easter)
  holyThursday.setDate(easter.getDate() - 3)
  holidays.push(holyThursday)
  
  // Viernes Santo (2 días antes de Pascua)
  const goodFriday = new Date(easter)
  goodFriday.setDate(easter.getDate() - 2)
  holidays.push(goodFriday)
  
  // Ascensión del Señor (39 días después de Pascua, trasladado al lunes)
  const ascension = new Date(easter)
  ascension.setDate(easter.getDate() + 39)
  const ascensionDay = ascension.getDay()
  if (ascensionDay !== 1) {
    const daysToAdd = ascensionDay === 0 ? 1 : 8 - ascensionDay
    ascension.setDate(ascension.getDate() + daysToAdd)
  }
  holidays.push(ascension)
  
  // Corpus Christi (60 días después de Pascua, trasladado al lunes)
  const corpusChristi = new Date(easter)
  corpusChristi.setDate(easter.getDate() + 60)
  const corpusDay = corpusChristi.getDay()
  if (corpusDay !== 1) {
    const daysToAdd = corpusDay === 0 ? 1 : 8 - corpusDay
    corpusChristi.setDate(corpusChristi.getDate() + daysToAdd)
  }
  holidays.push(corpusChristi)
  
  // Sagrado Corazón de Jesús (68 días después de Pascua, trasladado al lunes)
  const sacredHeart = new Date(easter)
  sacredHeart.setDate(easter.getDate() + 68)
  const sacredHeartDay = sacredHeart.getDay()
  if (sacredHeartDay !== 1) {
    const daysToAdd = sacredHeartDay === 0 ? 1 : 8 - sacredHeartDay
    sacredHeart.setDate(sacredHeart.getDate() + daysToAdd)
  }
  holidays.push(sacredHeart)
  
  return holidays.sort((a, b) => a.getTime() - b.getTime())
}

/**
 * Verifica si una fecha es festivo en Colombia
 * @param date - Fecha a verificar
 * @returns true si es festivo
 */
export function isColombianHoliday(date: Date): boolean {
  const dateString = date.toISOString().split('T')[0]
  const holidays = getColombianHolidays(date.getFullYear())
  return holidays.some(holiday => holiday.toISOString().split('T')[0] === dateString)
}

/**
 * Verifica si una fecha es domingo
 * @param date - Fecha a verificar
 * @returns true si es domingo
 */
export function isSunday(date: Date): boolean {
  return date.getDay() === 0
}

/**
 * Verifica si una hora está en horario nocturno (21:00 - 06:00)
 * @param hour - Hora en formato 24h
 * @returns true si es horario nocturno
 */
export function isNightHour(hour: number): boolean {
  return hour >= COLOMBIAN_LABOR_CONSTANTS.NIGHT_START_HOUR || 
         hour < COLOMBIAN_LABOR_CONSTANTS.NIGHT_END_HOUR
}

/**
 * Determina el tipo de trabajo dominical según frecuencia mensual
 * @param sundayWorksInMonth - Número de domingos trabajados en el mes
 * @returns Tipo de trabajo dominical
 */
export function getSundayWorkType(sundayWorksInMonth: number): SundayWorkType {
  return sundayWorksInMonth <= COLOMBIAN_LABOR_CONSTANTS.OCCASIONAL_SUNDAY_LIMIT 
    ? 'occasional' 
    : 'habitual'
}

/**
 * Verifica si un empleado necesita día de descanso semanal
 * @param shifts - Turnos del empleado en la semana
 * @param restDays - Días de descanso asignados
 * @returns true si necesita día de descanso
 */
export function needsWeeklyRestDay(
  shifts: any[], // ScheduleShift[]
  restDays: RestDay[]
): boolean {
  // Si tiene turnos asignados pero no días de descanso
  if (shifts.length > 0 && restDays.length === 0) {
    // Verificar si trabaja 6 o más días
    const workDaysCount = new Set(shifts.map(s => s.date)).size
    return workDaysCount >= 6
  }
  return false
}

/**
 * Calcula la fecha de expiración para un compensatorio
 * @param workDate - Fecha del trabajo que genera el compensatorio
 * @returns Fecha de expiración
 */
export function getCompensatoryExpirationDate(workDate: string): string {
  const date = new Date(workDate)
  date.setDate(date.getDate() + COLOMBIAN_LABOR_CONSTANTS.COMPENSATORY_EXPIRATION_DAYS)
  return date.toISOString().split('T')[0]
}

/**
 * Genera una alerta de compensatorio automáticamente
 * @param employeeId - ID del empleado
 * @param employeeName - Nombre del empleado
 * @param workDate - Fecha del trabajo dominical/festivo
 * @param monthlyWorkCount - Trabajos dominicales/festivos en el mes
 * @returns Alerta de compensatorio
 */
export function generateCompensatoryAlert(
  employeeId: string,
  employeeName: string,
  workDate: string,
  monthlyWorkCount: number
): CompensatoryAlert {
  const type = getSundayWorkType(monthlyWorkCount)
  const expirationDate = getCompensatoryExpirationDate(workDate)
  const now = new Date()
  const expiration = new Date(expirationDate)
  const daysUntilExpiry = Math.ceil((expiration.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  
  return {
    id: `alert-${Date.now()}-${employeeId}`,
    employeeId,
    employeeName,
    workDate,
    type,
    compensatoryDue: true,
    paymentDue: type === 'habitual', // Solo trabajo habitual requiere pago Y compensatorio
    daysUntilExpiry: Math.max(0, daysUntilExpiry),
    priority: type === 'habitual' ? 'high' : daysUntilExpiry <= 7 ? 'high' : 'medium',
    createdAt: now.toISOString().split('T')[0],
    resolved: false
  }
}

/**
 * Valida el cumplimiento de días de descanso según CST
 * @param employeeId - ID del empleado
 * @param weekShifts - Turnos de la semana
 * @param weekRestDays - Días de descanso de la semana
 * @returns Información de cumplimiento
 */
export function validateRestDayCompliance(
  employeeId: string,
  weekShifts: any[], // ScheduleShift[]
  weekRestDays: RestDay[],
  employeeName?: string
) {
  const employeeShifts = weekShifts.filter(s => s.employeeId === employeeId)
  const employeeRestDays = weekRestDays.filter(r => r.employeeId === employeeId)
  
  const workDaysCount = new Set(employeeShifts.map(s => s.date)).size
  const restDaysCount = employeeRestDays.length
  
  return {
    employeeId,
    employeeName: employeeName || '',
    hasShifts: employeeShifts.length > 0,
    workDaysCount,
    restDaysCount,
    needsRestDay: needsWeeklyRestDay(employeeShifts, employeeRestDays),
    hasWeeklyRest: restDaysCount > 0,
    compliant: workDaysCount === 0 || restDaysCount > 0 || workDaysCount < 6,
    reason: workDaysCount >= 6 && restDaysCount === 0 ? 'Falta día de descanso obligatorio' : ''
  }
}

/**
 * Genera recomendaciones de días de descanso para empleados
 * @param employees - Lista de empleados
 * @param shifts - Turnos de la semana
 * @param restDays - Días de descanso actuales
 * @param weekDates - Fechas de la semana
 * @returns Array de recomendaciones
 */
export function generateRestDayRecommendations(
  employees: any[],
  shifts: any[], // ScheduleShift[]
  restDays: RestDay[],
  weekDates: Date[]
): Array<{
  employeeId: string
  employeeName: string
  reason: string
  suggestedDates: Date[]
  priority: 'low' | 'medium' | 'high'
}> {
  const recommendations: Array<{
    employeeId: string
    employeeName: string
    reason: string
    suggestedDates: Date[]
    priority: 'low' | 'medium' | 'high'
  }> = []
  
  employees.forEach(employee => {
    const employeeShifts = shifts.filter(s => s.employeeId === employee.id)
    const employeeRestDays = restDays.filter(r => r.employeeId === employee.id)
    
    // Si el empleado no tiene días de descanso y tiene turnos
    if (employeeRestDays.length === 0 && employeeShifts.length > 0) {
      // Buscar días sin turnos para sugerir
      const suggestedDates = weekDates.filter(date => {
        const dateString = date.toISOString().split('T')[0]
        return !employeeShifts.some(shift => shift.date === dateString)
      })
      
      recommendations.push({
        employeeId: employee.id,
        employeeName: employee.name,
        reason: 'No tiene día de descanso semanal asignado',
        suggestedDates: suggestedDates.slice(0, 2), // Sugerir máximo 2 días
        priority: 'high'
      })
    }
    
    // Si trabaja más de 6 días
    if (employeeShifts.length >= 6 && employeeRestDays.length === 0) {
      const suggestedDates = weekDates.filter(date => {
        const dateString = date.toISOString().split('T')[0]
        return !employeeShifts.some(shift => shift.date === dateString)
      })
      
      if (suggestedDates.length > 0) {
        recommendations.push({
          employeeId: employee.id,
          employeeName: employee.name,
          reason: 'Trabaja 6 o más días sin descanso',
          suggestedDates: suggestedDates.slice(0, 1),
          priority: 'high'
        })
      }
    }
  })
  
  return recommendations
}

/**
 * Genera un ID único con prefijo
 * @param prefix - Prefijo para el ID
 * @returns ID único generado
 */
export function generateUniqueId(prefix: string = 'id'): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}