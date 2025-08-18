/**
 * Utilidades para manejo de fechas
 * @fileoverview Funciones para cálculos y manipulación de fechas
 */

import { WeekConfig } from '../types'

/**
 * Nombres de los días de la semana en español
 */
export const DAY_NAMES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

/**
 * Nombres completos de los días de la semana en español
 */
export const FULL_DAY_NAMES = [
  'Domingo', 'Lunes', 'Martes', 'Miércoles', 
  'Jueves', 'Viernes', 'Sábado'
]

/**
 * Nombres de los meses en español
 */
export const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
]

/**
 * Calcula las fechas de una semana específica
 * @param weekString - Semana en formato YYYY-WXX
 * @returns Configuración de la semana con fechas
 */
export function getWeekDates(weekString: string): WeekConfig {
  const [year, week] = weekString.split('-W')
  const dates: Date[] = []
  
  // Calcular primer día del año
  const firstDayOfYear = new Date(parseInt(year), 0, 1)
  const daysOffset = (parseInt(week) - 1) * 7
  const weekStart = new Date(firstDayOfYear)
  weekStart.setDate(firstDayOfYear.getDate() + daysOffset)
  
  // Ajustar al lunes (día 1 de la semana ISO)
  const day = weekStart.getDay()
  const diff = weekStart.getDate() - day + (day === 0 ? -6 : 1)
  weekStart.setDate(diff)
  
  // Generar todas las fechas de la semana (Lunes a Domingo)
  for (let i = 0; i < 7; i++) {
    const date = new Date(weekStart)
    date.setDate(weekStart.getDate() + i)
    dates.push(date)
  }
  
  return {
    year: parseInt(year),
    week: parseInt(week),
    dates,
    weekString
  }
}

/**
 * Obtiene la semana actual en formato YYYY-WXX
 * @returns String de la semana actual
 */
export function getCurrentWeekString(): string {
  const now = new Date()
  const year = now.getFullYear()
  const week = getWeekNumber(now)
  return `${year}-W${week.toString().padStart(2, '0')}`
}

/**
 * Calcula el número de semana ISO de una fecha
 * @param date - Fecha para calcular
 * @returns Número de semana (1-53)
 */
export function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
}

/**
 * Formatea una fecha para mostrar (ej: "Lun 15 Ene")
 * @param date - Fecha a formatear
 * @returns Fecha formateada
 */
export function formatDateForDisplay(date: Date): string {
  const dayName = DAY_NAMES[date.getDay()]
  const day = date.getDate()
  const monthName = MONTH_NAMES[date.getMonth()].substring(0, 3)
  
  return `${dayName} ${day} ${monthName}`
}

/**
 * Formatea una fecha completa (ej: "Lunes, 15 de Enero de 2024")
 * @param date - Fecha a formatear
 * @returns Fecha formateada completa
 */
export function formatFullDate(date: Date): string {
  const dayName = FULL_DAY_NAMES[date.getDay()]
  const day = date.getDate()
  const monthName = MONTH_NAMES[date.getMonth()]
  const year = date.getFullYear()
  
  return `${dayName}, ${day} de ${monthName} de ${year}`
}

/**
 * Convierte una fecha a string ISO (YYYY-MM-DD)
 * @param date - Fecha a convertir
 * @returns String ISO de la fecha
 */
export function dateToISOString(date: Date): string {
  return date.toISOString().split('T')[0]
}

/**
 * Crea una fecha desde un string ISO (YYYY-MM-DD)
 * @param dateString - String ISO de la fecha
 * @returns Fecha creada
 */
export function dateFromISOString(dateString: string): Date {
  return new Date(dateString + 'T00:00:00.000Z')
}

/**
 * Verifica si dos fechas son el mismo día
 * @param date1 - Primera fecha
 * @param date2 - Segunda fecha
 * @returns true si son el mismo día
 */
export function isSameDay(date1: Date, date2: Date): boolean {
  return dateToISOString(date1) === dateToISOString(date2)
}

/**
 * Verifica si una fecha está en el rango de una semana
 * @param date - Fecha a verificar
 * @param weekDates - Fechas de la semana
 * @returns true si la fecha está en la semana
 */
export function isDateInWeek(date: Date, weekDates: Date[]): boolean {
  const dateString = dateToISOString(date)
  return weekDates.some(weekDate => dateToISOString(weekDate) === dateString)
}

/**
 * Obtiene el rango de fechas de una semana como string
 * @param weekDates - Fechas de la semana
 * @returns String del rango (ej: "15 - 21 Ene 2024")
 */
export function getWeekRangeString(weekDates: Date[]): string {
  if (weekDates.length === 0) return ''
  
  const firstDate = weekDates[0]
  const lastDate = weekDates[weekDates.length - 1]
  
  const startDay = firstDate.getDate()
  const endDay = lastDate.getDate()
  const monthName = MONTH_NAMES[firstDate.getMonth()].substring(0, 3)
  const year = firstDate.getFullYear()
  
  if (firstDate.getMonth() === lastDate.getMonth()) {
    return `${startDay} - ${endDay} ${monthName} ${year}`
  } else {
    const startMonth = MONTH_NAMES[firstDate.getMonth()].substring(0, 3)
    const endMonth = MONTH_NAMES[lastDate.getMonth()].substring(0, 3)
    return `${startDay} ${startMonth} - ${endDay} ${endMonth} ${year}`
  }
}

/**
 * Calcula la diferencia en días entre dos fechas
 * @param date1 - Primera fecha
 * @param date2 - Segunda fecha
 * @returns Diferencia en días
 */
export function daysDifference(date1: Date, date2: Date): number {
  const timeDiff = date2.getTime() - date1.getTime()
  return Math.ceil(timeDiff / (1000 * 3600 * 24))
}

/**
 * Agrega días a una fecha
 * @param date - Fecha base
 * @param days - Días a agregar
 * @returns Nueva fecha
 */
export function addDays(date: Date, days: number): Date {
  const newDate = new Date(date)
  newDate.setDate(date.getDate() + days)
  return newDate
}

/**
 * Obtiene el inicio de la semana (lunes) para una fecha
 * @param date - Fecha de referencia
 * @returns Fecha del lunes de esa semana
 */
export function getStartOfWeek(date: Date): Date {
  const day = date.getDay()
  const diff = date.getDate() - day + (day === 0 ? -6 : 1) // Ajustar para que lunes sea el primer día
  return new Date(date.setDate(diff))
}

/**
 * Obtiene el fin de la semana (domingo) para una fecha
 * @param date - Fecha de referencia
 * @returns Fecha del domingo de esa semana
 */
export function getEndOfWeek(date: Date): Date {
  const startOfWeek = getStartOfWeek(new Date(date))
  return addDays(startOfWeek, 6)
}

/**
 * Verifica si una fecha es hoy
 * @param date - Fecha a verificar
 * @returns true si es hoy
 */
export function isToday(date: Date): boolean {
  return isSameDay(date, new Date())
}

/**
 * Verifica si una fecha es en el pasado
 * @param date - Fecha a verificar
 * @returns true si es en el pasado
 */
export function isPastDate(date: Date): boolean {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return date < today
}

/**
 * Verifica si una fecha es en el futuro
 * @param date - Fecha a verificar
 * @returns true si es en el futuro
 */
export function isFutureDate(date: Date): boolean {
  const today = new Date()
  today.setHours(23, 59, 59, 999)
  return date > today
}