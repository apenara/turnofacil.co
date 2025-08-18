/**
 * Utilidades para cálculos de horarios y costos
 * @fileoverview Funciones para calcular costos, recargos y métricas de horarios
 */

import { COLOMBIAN_LABOR_CONSTANTS, isColombianHoliday, isSunday, isNightHour } from './colombianLaborLaw'
import { ScheduleShift, ShiftType, ScheduleMetrics } from '../types'

/**
 * Convierte tiempo en formato HH:mm a minutos desde medianoche
 * @param time - Tiempo en formato HH:mm
 * @returns Minutos desde medianoche
 */
export function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

/**
 * Convierte minutos a formato HH:mm
 * @param minutes - Minutos desde medianoche
 * @returns Tiempo en formato HH:mm
 */
export function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`
}

/**
 * Calcula las horas trabajadas entre dos tiempos
 * @param startTime - Hora de inicio (HH:mm)
 * @param endTime - Hora de fin (HH:mm)
 * @returns Horas trabajadas
 */
export function calculateHoursBetween(startTime: string, endTime: string): number {
  let startMinutes = timeToMinutes(startTime)
  let endMinutes = timeToMinutes(endTime)
  
  // Si termina al día siguiente
  if (endMinutes < startMinutes) {
    endMinutes += 24 * 60
  }
  
  return (endMinutes - startMinutes) / 60
}

/**
 * Calcula las horas nocturnas trabajadas (21:00 - 06:00)
 * @param startTime - Hora de inicio (HH:mm)
 * @param endTime - Hora de fin (HH:mm)
 * @returns Horas nocturnas trabajadas
 */
export function calculateNightHours(startTime: string, endTime: string): number {
  const startMinutes = timeToMinutes(startTime)
  let endMinutes = timeToMinutes(endTime)
  
  // Si termina al día siguiente
  if (endMinutes < startMinutes) {
    endMinutes += 24 * 60
  }
  
  const nightStartMinutes = COLOMBIAN_LABOR_CONSTANTS.NIGHT_START_HOUR * 60 // 21:00
  const nightEndMinutes = COLOMBIAN_LABOR_CONSTANTS.NIGHT_END_HOUR * 60     // 06:00
  
  let nightHours = 0
  
  // Trabajo nocturno del mismo día (21:00 - 24:00)
  if (startMinutes < 24 * 60 && endMinutes > nightStartMinutes) {
    const nightStart = Math.max(startMinutes, nightStartMinutes)
    const nightEnd = Math.min(endMinutes, 24 * 60)
    if (nightEnd > nightStart) {
      nightHours += (nightEnd - nightStart) / 60
    }
  }
  
  // Trabajo nocturno del día siguiente (00:00 - 06:00)
  if (endMinutes > 24 * 60) {
    const nextDayStart = Math.max(startMinutes, 24 * 60)
    const nextDayEnd = Math.min(endMinutes, 24 * 60 + nightEndMinutes)
    if (nextDayEnd > nextDayStart) {
      nightHours += (nextDayEnd - nextDayStart) / 60
    }
  }
  
  // Si empieza después de medianoche
  if (startMinutes < nightEndMinutes && endMinutes > 0) {
    const nightStart = Math.max(startMinutes, 0)
    const nightEnd = Math.min(endMinutes, nightEndMinutes)
    if (nightEnd > nightStart) {
      nightHours += (nightEnd - nightStart) / 60
    }
  }
  
  return nightHours
}

/**
 * Determina el tipo de turno basado en fecha y horarios
 * @param date - Fecha del turno
 * @param startTime - Hora de inicio
 * @param endTime - Hora de fin
 * @param duration - Duración en horas
 * @returns Tipo de turno
 */
export function determineShiftType(
  date: string, 
  startTime: string, 
  endTime: string, 
  duration: number
): ShiftType {
  const shiftDate = new Date(date)
  const nightHours = calculateNightHours(startTime, endTime)
  
  // Verificar si es festivo
  if (isColombianHoliday(shiftDate)) {
    return 'holiday'
  }
  
  // Verificar si es principalmente nocturno (más del 50% en horario nocturno)
  if (nightHours > duration / 2) {
    return 'night'
  }
  
  // Verificar si es overtime (más de 8 horas diarias)
  if (duration > COLOMBIAN_LABOR_CONSTANTS.REGULAR_HOURS_PER_DAY) {
    return 'overtime'
  }
  
  return 'regular'
}

/**
 * Calcula el costo de un turno aplicando recargos según legislación colombiana
 * @param shift - Turno a calcular
 * @param hourlyRate - Tarifa por hora del empleado
 * @returns Costo total del turno
 */
export function calculateShiftCost(
  shift: ScheduleShift,
  hourlyRate: number
): number {
  const shiftDate = new Date(shift.date)
  const isHoliday = isColombianHoliday(shiftDate)
  const isSundayWork = isSunday(shiftDate)
  const nightHours = calculateNightHours(shift.startTime, shift.endTime)
  const dayHours = shift.duration - nightHours
  
  let totalCost = 0
  
  // Horas regulares diurnas
  const regularDayHours = Math.min(dayHours, COLOMBIAN_LABOR_CONSTANTS.REGULAR_HOURS_PER_DAY)
  const overtimeDayHours = Math.max(0, dayHours - COLOMBIAN_LABOR_CONSTANTS.REGULAR_HOURS_PER_DAY)
  
  // Horas nocturnas regulares y extras
  const regularNightHours = Math.min(nightHours, Math.max(0, COLOMBIAN_LABOR_CONSTANTS.REGULAR_HOURS_PER_DAY - dayHours))
  const overtimeNightHours = Math.max(0, nightHours - regularNightHours)
  
  if (isHoliday) {
    // Trabajo en festivo
    totalCost += dayHours * hourlyRate * (1 + COLOMBIAN_LABOR_CONSTANTS.HOLIDAY_RATE)
    totalCost += nightHours * hourlyRate * (1 + COLOMBIAN_LABOR_CONSTANTS.HOLIDAY_NIGHT_RATE)
  } else if (isSundayWork) {
    // Trabajo dominical
    totalCost += dayHours * hourlyRate * (1 + COLOMBIAN_LABOR_CONSTANTS.SUNDAY_RATE)
    totalCost += nightHours * hourlyRate * (1 + COLOMBIAN_LABOR_CONSTANTS.SUNDAY_NIGHT_RATE)
  } else {
    // Trabajo regular
    // Horas regulares diurnas
    if (regularDayHours > 0) {
      totalCost += regularDayHours * hourlyRate
    }
    
    // Horas nocturnas regulares
    if (regularNightHours > 0) {
      totalCost += regularNightHours * hourlyRate * (1 + COLOMBIAN_LABOR_CONSTANTS.NIGHT_RATE)
    }
    
    // Horas extras diurnas
    if (overtimeDayHours > 0) {
      totalCost += overtimeDayHours * hourlyRate * (1 + COLOMBIAN_LABOR_CONSTANTS.OVERTIME_RATE)
    }
    
    // Horas extras nocturnas
    if (overtimeNightHours > 0) {
      totalCost += overtimeNightHours * hourlyRate * (1 + COLOMBIAN_LABOR_CONSTANTS.OVERTIME_NIGHT_RATE)
    }
  }
  
  return totalCost
}

/**
 * Calcula métricas del horario semanal
 * @param shifts - Turnos de la semana
 * @param employees - Empleados disponibles
 * @param weeklyBudget - Presupuesto semanal
 * @returns Métricas calculadas
 */
export function calculateScheduleMetrics(
  shifts: ScheduleShift[],
  employees: any[], // Employee[]
  weeklyBudget: number
): ScheduleMetrics {
  const weeklyHours = shifts.reduce((sum, shift) => sum + shift.duration, 0)
  
  const weeklyCost = shifts.reduce((sum, shift) => {
    const employee = employees.find(emp => emp.id === shift.employeeId)
    const hourlyRate = employee?.hourlyRate || 0
    return sum + calculateShiftCost(shift, hourlyRate)
  }, 0)
  
  const employeeCount = new Set(shifts.map(shift => shift.employeeId)).size
  const budgetUtilization = weeklyBudget > 0 ? (weeklyCost / weeklyBudget) * 100 : 0
  
  let budgetStatus: 'success' | 'warning' | 'danger' = 'success'
  if (budgetUtilization > 100) {
    budgetStatus = 'danger'
  } else if (budgetUtilization > 85) {
    budgetStatus = 'warning'
  }
  
  return {
    weeklyHours,
    weeklyCost,
    employeeCount,
    budgetUtilization,
    budgetStatus
  }
}

/**
 * Calcula las horas semanales de un empleado
 * @param employeeId - ID del empleado
 * @param shifts - Turnos de la semana
 * @returns Horas semanales trabajadas
 */
export function calculateEmployeeWeeklyHours(
  employeeId: string,
  shifts: ScheduleShift[]
): number {
  return shifts
    .filter(shift => shift.employeeId === employeeId)
    .reduce((sum, shift) => sum + shift.duration, 0)
}

/**
 * Calcula el costo semanal de un empleado
 * @param employeeId - ID del empleado
 * @param shifts - Turnos de la semana
 * @param hourlyRate - Tarifa por hora del empleado
 * @returns Costo semanal del empleado
 */
export function calculateEmployeeWeeklyCost(
  employeeId: string,
  shifts: ScheduleShift[],
  hourlyRate: number
): number {
  return shifts
    .filter(shift => shift.employeeId === employeeId)
    .reduce((sum, shift) => sum + calculateShiftCost(shift, hourlyRate), 0)
}

/**
 * Verifica si hay solapamiento entre dos turnos
 * @param shift1 - Primer turno
 * @param shift2 - Segundo turno
 * @returns true si hay solapamiento
 */
export function hasShiftOverlap(shift1: ScheduleShift, shift2: ScheduleShift): boolean {
  if (shift1.date !== shift2.date || shift1.employeeId !== shift2.employeeId) {
    return false
  }
  
  const start1 = timeToMinutes(shift1.startTime)
  const end1 = timeToMinutes(shift1.endTime)
  const start2 = timeToMinutes(shift2.startTime)
  const end2 = timeToMinutes(shift2.endTime)
  
  // Ajustar para turnos que cruzan medianoche
  let adjustedEnd1 = end1
  let adjustedEnd2 = end2
  
  if (shift1.crossesMidnight) {
    adjustedEnd1 = end1 + 24 * 60
  }
  
  if (shift2.crossesMidnight) {
    adjustedEnd2 = end2 + 24 * 60
  }
  
  return (start1 < adjustedEnd2 && adjustedEnd1 > start2) ||
         (start2 < adjustedEnd1 && adjustedEnd2 > start1)
}

/**
 * Calcula si un turno cruza la medianoche
 * @param startTime - Hora de inicio (HH:mm)
 * @param endTime - Hora de fin (HH:mm)
 * @returns true si cruza medianoche
 */
export function crossesMidnight(startTime: string, endTime: string): boolean {
  return timeToMinutes(endTime) <= timeToMinutes(startTime)
}

/**
 * Obtiene el color sugerido para un tipo de turno
 * @param shiftType - Tipo de turno
 * @returns Color hexadecimal
 */
export function getShiftTypeColor(shiftType: ShiftType): string {
  const colors = {
    regular: '#10B981',    // Verde - turno regular
    overtime: '#F59E0B',   // Ámbar - overtime
    night: '#8B5CF6',      // Púrpura - nocturno
    holiday: '#EF4444'     // Rojo - festivo
  }
  
  return colors[shiftType] || colors.regular
}

/**
 * Formatea una duración en horas a texto legible
 * @param hours - Horas (puede tener decimales)
 * @returns Texto formateado (ej: "8h 30m")
 */
export function formatDuration(hours: number): string {
  const wholeHours = Math.floor(hours)
  const minutes = Math.round((hours - wholeHours) * 60)
  
  if (minutes === 0) {
    return `${wholeHours}h`
  }
  
  return `${wholeHours}h ${minutes}m`
}

/**
 * Formatea un monto en pesos colombianos
 * @param amount - Monto a formatear
 * @returns Texto formateado (ej: "$123.456")
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0
  }).format(amount)
}