/**
 * Calculadora Laboral Colombiana
 * Calcula horas extras, recargos nocturnos, dominicales y festivos
 * Basado en el Código Sustantivo del Trabajo de Colombia
 */

export interface WorkShift {
  date: string
  startTime: string // formato HH:mm
  endTime: string   // formato HH:mm
  baseSalary: number // salario básico diario
  position: string
  location: string
}

export interface LaborCalculation {
  regularHours: number
  overtimeHours: number
  nightShiftHours: number
  holidayHours: number
  sundayHours: number
  
  // Recargos
  overtimePay: number
  nightShiftPay: number
  holidayPay: number
  sundayPay: number
  
  // Totales
  totalHours: number
  totalBasePay: number
  totalExtraPay: number
  totalPay: number
  
  // Detalles
  breakdown: PayBreakdown[]
}

export interface PayBreakdown {
  type: 'regular' | 'overtime' | 'night' | 'holiday' | 'sunday' | 'overtime_night' | 'holiday_night' | 'sunday_night'
  description: string
  hours: number
  rate: number
  amount: number
}

// Constantes según ley colombiana
const LABOR_CONSTANTS = {
  REGULAR_HOURS_PER_DAY: 8,
  REGULAR_HOURS_PER_WEEK: 48,
  NIGHT_START_HOUR: 21, // 9 PM
  NIGHT_END_HOUR: 6,    // 6 AM
  
  // Recargos según ley (porcentajes sobre salario base)
  OVERTIME_RATE: 0.25,           // 25% extra por hora extra diurna
  NIGHT_RATE: 0.35,              // 35% extra por hora nocturna
  OVERTIME_NIGHT_RATE: 0.75,     // 75% extra por hora extra nocturna
  SUNDAY_RATE: 0.75,             // 75% extra por trabajo dominical
  HOLIDAY_RATE: 0.75,            // 75% extra por trabajo en festivo
  HOLIDAY_NIGHT_RATE: 1.10,      // 110% extra por trabajo nocturno en festivo
  SUNDAY_NIGHT_RATE: 1.10       // 110% extra por trabajo nocturno dominical
}

// Festivos colombianos 2024
const COLOMBIAN_HOLIDAYS = [
  '2024-01-01', // Año Nuevo
  '2024-01-08', // Día de los Reyes Magos
  '2024-03-25', // Día de San José
  '2024-03-28', // Jueves Santo
  '2024-03-29', // Viernes Santo
  '2024-05-01', // Día del Trabajo
  '2024-05-13', // Ascensión del Señor
  '2024-06-03', // Corpus Christi
  '2024-06-10', // Sagrado Corazón de Jesús
  '2024-07-01', // San Pedro y San Pablo
  '2024-07-20', // Día de la Independencia
  '2024-08-07', // Batalla de Boyacá
  '2024-08-19', // Asunción de la Virgen
  '2024-10-14', // Día de la Raza
  '2024-11-04', // Todos los Santos
  '2024-11-11', // Independencia de Cartagena
  '2024-12-08', // Inmaculada Concepción
  '2024-12-25'  // Navidad
]

export class LaborCalculator {
  /**
   * Calcula si una fecha es festivo en Colombia
   */
  static isHoliday(date: string): boolean {
    return COLOMBIAN_HOLIDAYS.includes(date)
  }

  /**
   * Calcula si una fecha es domingo
   */
  static isSunday(date: string): boolean {
    const dayOfWeek = new Date(date).getDay()
    return dayOfWeek === 0
  }

  /**
   * Calcula si una hora está en horario nocturno (9 PM - 6 AM)
   */
  static isNightHour(hour: number): boolean {
    return hour >= LABOR_CONSTANTS.NIGHT_START_HOUR || hour < LABOR_CONSTANTS.NIGHT_END_HOUR
  }

  /**
   * Convierte tiempo string a minutos desde medianoche
   */
  static timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number)
    return hours * 60 + minutes
  }

  /**
   * Convierte minutos a formato HH:mm
   */
  static minutesToTime(minutes: number): string {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`
  }

  /**
   * Calcula el salario por hora basado en el salario diario
   */
  static getHourlyRate(dailySalary: number): number {
    return dailySalary / LABOR_CONSTANTS.REGULAR_HOURS_PER_DAY
  }

  /**
   * Calcula las horas trabajadas entre dos tiempos
   */
  static calculateHoursBetween(startTime: string, endTime: string): number {
    let startMinutes = this.timeToMinutes(startTime)
    let endMinutes = this.timeToMinutes(endTime)
    
    // Si termina al día siguiente
    if (endMinutes < startMinutes) {
      endMinutes += 24 * 60
    }
    
    return (endMinutes - startMinutes) / 60
  }

  /**
   * Calcula las horas nocturnas trabajadas
   */
  static calculateNightHours(startTime: string, endTime: string): number {
    const startMinutes = this.timeToMinutes(startTime)
    let endMinutes = this.timeToMinutes(endTime)
    
    // Si termina al día siguiente
    if (endMinutes < startMinutes) {
      endMinutes += 24 * 60
    }
    
    const nightStartMinutes = LABOR_CONSTANTS.NIGHT_START_HOUR * 60 // 21:00
    const nightEndMinutes = LABOR_CONSTANTS.NIGHT_END_HOUR * 60     // 06:00
    
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
   * Calcula la liquidación laboral completa para un turno
   */
  static calculateShiftPay(shift: WorkShift): LaborCalculation {
    const hourlyRate = this.getHourlyRate(shift.baseSalary)
    const totalHours = this.calculateHoursBetween(shift.startTime, shift.endTime)
    const nightHours = this.calculateNightHours(shift.startTime, shift.endTime)
    const isHoliday = this.isHoliday(shift.date)
    const isSunday = this.isSunday(shift.date)
    
    const regularHours = Math.min(totalHours, LABOR_CONSTANTS.REGULAR_HOURS_PER_DAY)
    const overtimeHours = Math.max(0, totalHours - LABOR_CONSTANTS.REGULAR_HOURS_PER_DAY)
    const dayHours = totalHours - nightHours
    const overtimeDayHours = Math.max(0, dayHours - LABOR_CONSTANTS.REGULAR_HOURS_PER_DAY)
    const overtimeNightHours = Math.max(0, nightHours - Math.max(0, LABOR_CONSTANTS.REGULAR_HOURS_PER_DAY - dayHours))
    
    const breakdown: PayBreakdown[] = []
    let totalBasePay = 0
    let totalExtraPay = 0
    
    // Horas regulares diurnas
    if (dayHours > 0 && !isHoliday && !isSunday) {
      const hours = Math.min(dayHours, LABOR_CONSTANTS.REGULAR_HOURS_PER_DAY)
      const amount = hours * hourlyRate
      totalBasePay += amount
      breakdown.push({
        type: 'regular',
        description: 'Horas regulares diurnas',
        hours,
        rate: hourlyRate,
        amount
      })
    }
    
    // Horas nocturnas regulares
    if (nightHours > 0 && !isHoliday && !isSunday) {
      const regularNightHours = Math.min(nightHours, Math.max(0, LABOR_CONSTANTS.REGULAR_HOURS_PER_DAY - dayHours))
      if (regularNightHours > 0) {
        const rate = hourlyRate * (1 + LABOR_CONSTANTS.NIGHT_RATE)
        const amount = regularNightHours * rate
        totalBasePay += regularNightHours * hourlyRate
        totalExtraPay += regularNightHours * hourlyRate * LABOR_CONSTANTS.NIGHT_RATE
        breakdown.push({
          type: 'night',
          description: 'Horas nocturnas (21:00 - 06:00)',
          hours: regularNightHours,
          rate,
          amount
        })
      }
    }
    
    // Horas extras diurnas
    if (overtimeDayHours > 0 && !isHoliday && !isSunday) {
      const rate = hourlyRate * (1 + LABOR_CONSTANTS.OVERTIME_RATE)
      const amount = overtimeDayHours * rate
      totalBasePay += overtimeDayHours * hourlyRate
      totalExtraPay += overtimeDayHours * hourlyRate * LABOR_CONSTANTS.OVERTIME_RATE
      breakdown.push({
        type: 'overtime',
        description: 'Horas extras diurnas',
        hours: overtimeDayHours,
        rate,
        amount
      })
    }
    
    // Horas extras nocturnas
    if (overtimeNightHours > 0 && !isHoliday && !isSunday) {
      const rate = hourlyRate * (1 + LABOR_CONSTANTS.OVERTIME_NIGHT_RATE)
      const amount = overtimeNightHours * rate
      totalBasePay += overtimeNightHours * hourlyRate
      totalExtraPay += overtimeNightHours * hourlyRate * LABOR_CONSTANTS.OVERTIME_NIGHT_RATE
      breakdown.push({
        type: 'overtime_night',
        description: 'Horas extras nocturnas',
        hours: overtimeNightHours,
        rate,
        amount
      })
    }
    
    // Trabajo dominical
    if (isSunday && !isHoliday) {
      const sundayDayHours = dayHours
      const sundayNightHours = nightHours
      
      if (sundayDayHours > 0) {
        const rate = hourlyRate * (1 + LABOR_CONSTANTS.SUNDAY_RATE)
        const amount = sundayDayHours * rate
        totalBasePay += sundayDayHours * hourlyRate
        totalExtraPay += sundayDayHours * hourlyRate * LABOR_CONSTANTS.SUNDAY_RATE
        breakdown.push({
          type: 'sunday',
          description: 'Trabajo dominical diurno',
          hours: sundayDayHours,
          rate,
          amount
        })
      }
      
      if (sundayNightHours > 0) {
        const rate = hourlyRate * (1 + LABOR_CONSTANTS.SUNDAY_NIGHT_RATE)
        const amount = sundayNightHours * rate
        totalBasePay += sundayNightHours * hourlyRate
        totalExtraPay += sundayNightHours * hourlyRate * LABOR_CONSTANTS.SUNDAY_NIGHT_RATE
        breakdown.push({
          type: 'sunday_night',
          description: 'Trabajo dominical nocturno',
          hours: sundayNightHours,
          rate,
          amount
        })
      }
    }
    
    // Trabajo en festivo
    if (isHoliday) {
      const holidayDayHours = dayHours
      const holidayNightHours = nightHours
      
      if (holidayDayHours > 0) {
        const rate = hourlyRate * (1 + LABOR_CONSTANTS.HOLIDAY_RATE)
        const amount = holidayDayHours * rate
        totalBasePay += holidayDayHours * hourlyRate
        totalExtraPay += holidayDayHours * hourlyRate * LABOR_CONSTANTS.HOLIDAY_RATE
        breakdown.push({
          type: 'holiday',
          description: 'Trabajo en festivo diurno',
          hours: holidayDayHours,
          rate,
          amount
        })
      }
      
      if (holidayNightHours > 0) {
        const rate = hourlyRate * (1 + LABOR_CONSTANTS.HOLIDAY_NIGHT_RATE)
        const amount = holidayNightHours * rate
        totalBasePay += holidayNightHours * hourlyRate
        totalExtraPay += holidayNightHours * hourlyRate * LABOR_CONSTANTS.HOLIDAY_NIGHT_RATE
        breakdown.push({
          type: 'holiday_night',
          description: 'Trabajo en festivo nocturno',
          hours: holidayNightHours,
          rate,
          amount
        })
      }
    }
    
    return {
      regularHours,
      overtimeHours,
      nightShiftHours: nightHours,
      holidayHours: isHoliday ? totalHours : 0,
      sundayHours: isSunday ? totalHours : 0,
      
      overtimePay: totalExtraPay,
      nightShiftPay: 0, // Ya incluido en totalExtraPay
      holidayPay: 0,    // Ya incluido en totalExtraPay
      sundayPay: 0,     // Ya incluido en totalExtraPay
      
      totalHours,
      totalBasePay,
      totalExtraPay,
      totalPay: totalBasePay + totalExtraPay,
      
      breakdown
    }
  }

  /**
   * Calcula la liquidación semanal para múltiples turnos
   */
  static calculateWeeklyPay(shifts: WorkShift[]): LaborCalculation {
    const weeklyCalculations = shifts.map(shift => this.calculateShiftPay(shift))
    
    return weeklyCalculations.reduce((total, calc) => ({
      regularHours: total.regularHours + calc.regularHours,
      overtimeHours: total.overtimeHours + calc.overtimeHours,
      nightShiftHours: total.nightShiftHours + calc.nightShiftHours,
      holidayHours: total.holidayHours + calc.holidayHours,
      sundayHours: total.sundayHours + calc.sundayHours,
      
      overtimePay: total.overtimePay + calc.overtimePay,
      nightShiftPay: total.nightShiftPay + calc.nightShiftPay,
      holidayPay: total.holidayPay + calc.holidayPay,
      sundayPay: total.sundayPay + calc.sundayPay,
      
      totalHours: total.totalHours + calc.totalHours,
      totalBasePay: total.totalBasePay + calc.totalBasePay,
      totalExtraPay: total.totalExtraPay + calc.totalExtraPay,
      totalPay: total.totalPay + calc.totalPay,
      
      breakdown: [...total.breakdown, ...calc.breakdown]
    }), {
      regularHours: 0,
      overtimeHours: 0,
      nightShiftHours: 0,
      holidayHours: 0,
      sundayHours: 0,
      overtimePay: 0,
      nightShiftPay: 0,
      holidayPay: 0,
      sundayPay: 0,
      totalHours: 0,
      totalBasePay: 0,
      totalExtraPay: 0,
      totalPay: 0,
      breakdown: []
    })
  }
}