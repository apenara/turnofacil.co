/**
 * Hook para cálculos y gestión de semanas
 * @fileoverview Maneja el estado de la semana, navegación y cálculos relacionados
 */

import { useState, useCallback, useMemo } from 'react'
import { WeekConfig, ScheduleShift, Employee, WeekSummary } from '../types'
import { 
  getWeekDates,
  getCurrentWeekString,
  getWeekRangeString,
  addDays,
  getStartOfWeek,
  dateToISOString,
  formatDateForDisplay,
  isSunday,
  isColombianHoliday,
  calculateScheduleMetrics
} from '../utils'

/**
 * Hook para cálculos y gestión de semanas
 * @param initialWeek - Semana inicial (opcional, por defecto la semana actual)
 * @returns Objeto con estado y funciones de gestión de semanas
 */
export function useWeekCalculations(initialWeek?: string) {
  // Estado principal
  const [currentWeekString, setCurrentWeekString] = useState(
    initialWeek || getCurrentWeekString()
  )
  const [isLoading, setIsLoading] = useState(false)

  /**
   * Configuración de la semana actual
   */
  const weekConfig: WeekConfig = useMemo(() => {
    return getWeekDates(currentWeekString)
  }, [currentWeekString])

  /**
   * Información formateada de la semana
   */
  const weekInfo = useMemo(() => {
    const { dates, year, week } = weekConfig
    const rangeString = getWeekRangeString(dates)
    const formattedDates = dates.map(date => formatDateForDisplay(date))
    
    return {
      weekString: currentWeekString,
      year,
      week,
      rangeString,
      formattedDates,
      isCurrentWeek: currentWeekString === getCurrentWeekString()
    }
  }, [weekConfig, currentWeekString])

  /**
   * Días especiales de la semana (domingos y festivos)
   */
  const specialDays = useMemo(() => {
    return weekConfig.dates.map(date => ({
      date: dateToISOString(date),
      isSunday: isSunday(date),
      isHoliday: isColombianHoliday(date),
      isSpecial: isSunday(date) || isColombianHoliday(date)
    }))
  }, [weekConfig.dates])

  /**
   * Navega a la semana anterior
   */
  const goToPreviousWeek = useCallback(() => {
    setIsLoading(true)
    try {
      const firstDayOfWeek = weekConfig.dates[0]
      const previousWeek = addDays(firstDayOfWeek, -7)
      const newWeekString = `${previousWeek.getFullYear()}-W${String(getWeekNumber(previousWeek)).padStart(2, '0')}`
      setCurrentWeekString(newWeekString)
    } finally {
      setIsLoading(false)
    }
  }, [weekConfig.dates])

  /**
   * Navega a la semana siguiente
   */
  const goToNextWeek = useCallback(() => {
    setIsLoading(true)
    try {
      const firstDayOfWeek = weekConfig.dates[0]
      const nextWeek = addDays(firstDayOfWeek, 7)
      const newWeekString = `${nextWeek.getFullYear()}-W${String(getWeekNumber(nextWeek)).padStart(2, '0')}`
      setCurrentWeekString(newWeekString)
    } finally {
      setIsLoading(false)
    }
  }, [weekConfig.dates])

  /**
   * Navega a la semana actual
   */
  const goToCurrentWeek = useCallback(() => {
    setCurrentWeekString(getCurrentWeekString())
  }, [])

  /**
   * Navega a una semana específica
   */
  const goToWeek = useCallback((weekString: string) => {
    setCurrentWeekString(weekString)
  }, [])

  /**
   * Navega a una fecha específica (va a la semana que contiene esa fecha)
   */
  const goToDate = useCallback((date: Date) => {
    const startOfWeek = getStartOfWeek(new Date(date))
    const weekNumber = getWeekNumber(startOfWeek)
    const year = startOfWeek.getFullYear()
    const weekString = `${year}-W${String(weekNumber).padStart(2, '0')}`
    setCurrentWeekString(weekString)
  }, [])

  /**
   * Calcula resumen de la semana con turnos y empleados
   */
  const calculateWeekSummary = useCallback((
    shifts: ScheduleShift[],
    employees: Employee[],
    weeklyBudget: number
  ): WeekSummary => {
    // Filtrar turnos de la semana actual
    const weekShifts = shifts.filter(shift => 
      weekConfig.dates.some(date => dateToISOString(date) === shift.date)
    )

    // Métricas básicas
    const metrics = calculateScheduleMetrics(weekShifts, employees, weeklyBudget)

    // Resumen por día
    const dailySummary = weekConfig.dates.map(date => {
      const dateString = dateToISOString(date)
      const dayShifts = weekShifts.filter(shift => shift.date === dateString)
      const dayHours = dayShifts.reduce((sum, shift) => sum + shift.duration, 0)
      const dayEmployees = new Set(dayShifts.map(shift => shift.employeeId)).size
      const dayCost = dayShifts.reduce((sum, shift) => {
        const employee = employees.find(emp => emp.id === shift.employeeId)
        const hourlyRate = employee?.hourlyRate || 0
        return sum + shift.cost
      }, 0)

      return {
        date: dateString,
        formattedDate: formatDateForDisplay(date),
        shiftsCount: dayShifts.length,
        totalHours: dayHours,
        employeesCount: dayEmployees,
        totalCost: dayCost,
        isSpecial: isSunday(date) || isColombianHoliday(date)
      }
    })

    // Resumen por empleado
    const employeeSummary = employees.map(employee => {
      const employeeShifts = weekShifts.filter(shift => shift.employeeId === employee.id)
      const totalHours = employeeShifts.reduce((sum, shift) => sum + shift.duration, 0)
      const totalCost = employeeShifts.reduce((sum, shift) => sum + shift.cost, 0)
      const workingDays = new Set(employeeShifts.map(shift => shift.date)).size

      return {
        employeeId: employee.id,
        employeeName: employee.name,
        shiftsCount: employeeShifts.length,
        totalHours,
        totalCost,
        workingDays,
        averageHoursPerDay: workingDays > 0 ? totalHours / workingDays : 0
      }
    }).filter(summary => summary.shiftsCount > 0) // Solo empleados con turnos

    return {
      weekRange: weekInfo.rangeString,
      metrics,
      dailySummary,
      employeeSummary,
      specialDays: specialDays.filter(day => day.isSpecial),
      totalShifts: weekShifts.length,
      budgetRemaining: Math.max(0, weeklyBudget - metrics.weeklyCost)
    }
  }, [weekConfig, currentWeekString, weekInfo.rangeString, specialDays])

  /**
   * Obtiene información de navegación
   */
  const navigationInfo = useMemo(() => {
    const currentWeek = getCurrentWeekString()
    const canGoBack = true // Siempre se puede ir a semanas anteriores
    const canGoForward = true // Siempre se puede ir a semanas futuras
    
    return {
      canGoBack,
      canGoForward,
      isCurrentWeek: currentWeekString === currentWeek,
      currentWeekString: currentWeek
    }
  }, [currentWeekString])

  /**
   * Genera opciones de semanas para un selector
   */
  const generateWeekOptions = useCallback((weeksCount: number = 12) => {
    const options: Array<{ value: string; label: string; isCurrent: boolean }> = []
    const currentWeek = getCurrentWeekString()
    
    // Generar semanas hacia atrás y hacia adelante
    const startWeek = addDays(weekConfig.dates[0], -weeksCount * 7 / 2)
    
    for (let i = 0; i < weeksCount; i++) {
      const weekDate = addDays(startWeek, i * 7)
      const weekNumber = getWeekNumber(weekDate)
      const year = weekDate.getFullYear()
      const weekString = `${year}-W${String(weekNumber).padStart(2, '0')}`
      const weekDates = getWeekDates(weekString)
      const label = getWeekRangeString(weekDates.dates)
      
      options.push({
        value: weekString,
        label: `Semana ${weekNumber}: ${label}`,
        isCurrent: weekString === currentWeek
      })
    }
    
    return options.sort((a, b) => a.value.localeCompare(b.value))
  }, [weekConfig.dates])

  return {
    // Estado de la semana
    weekConfig,
    weekInfo,
    specialDays,
    navigationInfo,
    isLoading,

    // Navegación
    goToPreviousWeek,
    goToNextWeek,
    goToCurrentWeek,
    goToWeek,
    goToDate,

    // Cálculos
    calculateWeekSummary,
    generateWeekOptions
  }
}

/**
 * Calcula el número de semana ISO de una fecha
 * Helper function replicada aquí para evitar dependencias circulares
 */
function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
}