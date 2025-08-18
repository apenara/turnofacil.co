'use client'

import React, { useState } from 'react'
import { Card, Button, Input, Modal, Tag } from '@/components/ui'
import { useNotifications } from '@/components/shared/NotificationSystem'

interface BudgetPeriod {
  id: string
  year: number
  month?: number
  quarter?: number
  amount: number
  allocated: number
  spent: number
}

interface Location {
  id: string
  name: string
  address: string
  employeeCount: number
  activeShifts: number
  weeklyBudget: number
  weeklySpent: number
  budget?: {
    type: 'weekly' | 'monthly' | 'quarterly' | 'annual'
    periods: BudgetPeriod[]
    autoDistribute: boolean
    alertThreshold: number
  }
}

interface Employee {
  id: string
  name: string
  position: string
  locationId: string
  maxWeeklyHours: number
  availability: DayAvailability[]
  hourlyRate: number
  skills: string[]
}

interface DayAvailability {
  day: number // 0-6 (Sunday-Saturday)
  available: boolean
  startTime?: string
  endTime?: string
  restrictions?: string[]
}

interface ShiftTemplate {
  id: string
  name: string
  startTime: string
  endTime: string
  duration: number
  type: 'regular' | 'overtime' | 'night' | 'holiday'
  color: string
  description?: string
  crossesMidnight: boolean
}

interface ScheduleShift {
  id: string
  employeeId: string
  employeeName: string
  position: string
  locationId: string
  date: string
  startTime: string
  endTime: string
  duration: number
  type: 'regular' | 'overtime' | 'night' | 'holiday'
  status: 'draft' | 'confirmed' | 'published'
  cost: number
  notes?: string
  templateId?: string
  crossesMidnight: boolean
  actualDate?: string // For night shifts that end the next day
}

interface ValidationError {
  type: 'overtime' | 'availability' | 'overlap' | 'understaffed' | 'budget'
  message: string
  severity: 'error' | 'warning'
  shifts?: string[]
}

const mockLocations: Location[] = [
  {
    id: '1',
    name: 'Sede Centro',
    address: 'Cra 7 #45-23, Bogotá',
    employeeCount: 15,
    activeShifts: 8,
    weeklyBudget: 12000000,
    weeklySpent: 8500000,
    budget: {
      type: 'monthly',
      autoDistribute: true,
      alertThreshold: 80,
      periods: [
        {
          id: 'budget-2024-01',
          year: 2024,
          month: 1,
          amount: 48000000,
          allocated: 36000000,
          spent: 34000000
        }
      ]
    }
  },
  {
    id: '2',
    name: 'Sede Norte',
    address: 'Cll 140 #15-30, Bogotá',
    employeeCount: 12,
    activeShifts: 6,
    weeklyBudget: 10000000,
    weeklySpent: 7200000,
    budget: {
      type: 'quarterly',
      autoDistribute: true,
      alertThreshold: 85,
      periods: [
        {
          id: 'budget-2024-q1',
          year: 2024,
          quarter: 1,
          amount: 120000000,
          allocated: 90000000,
          spent: 86500000
        }
      ]
    }
  },
  {
    id: '3',
    name: 'Sede Chapinero',
    address: 'Cll 67 #9-45, Bogotá',
    employeeCount: 10,
    activeShifts: 5,
    weeklyBudget: 8000000,
    weeklySpent: 6100000,
    budget: {
      type: 'weekly',
      autoDistribute: false,
      alertThreshold: 90,
      periods: []
    }
  }
]

const mockEmployees: Employee[] = [
  // Sede Centro employees
  {
    id: '1',
    name: 'Carlos López',
    position: 'Cocinero',
    locationId: '1',
    maxWeeklyHours: 48,
    hourlyRate: 6250,
    skills: ['Cocina', 'Parrilla', 'Preparación'],
    availability: [
      { day: 1, available: true, startTime: '06:00', endTime: '18:00' },
      { day: 2, available: true, startTime: '06:00', endTime: '18:00' },
      { day: 3, available: true, startTime: '06:00', endTime: '18:00' },
      { day: 4, available: true, startTime: '06:00', endTime: '18:00' },
      { day: 5, available: true, startTime: '06:00', endTime: '18:00' },
      { day: 6, available: false },
      { day: 0, available: false }
    ]
  },
  {
    id: '2',
    name: 'Ana Martínez',
    position: 'Mesera',
    locationId: '1',
    maxWeeklyHours: 44,
    hourlyRate: 5729,
    skills: ['Atención al cliente', 'Caja', 'Servicio'],
    availability: [
      { day: 1, available: true, startTime: '14:00', endTime: '23:00' },
      { day: 2, available: true, startTime: '14:00', endTime: '23:00' },
      { day: 3, available: true, startTime: '14:00', endTime: '23:00' },
      { day: 4, available: true, startTime: '14:00', endTime: '23:00' },
      { day: 5, available: true, startTime: '14:00', endTime: '23:00' },
      { day: 6, available: true, startTime: '12:00', endTime: '22:00' },
      { day: 0, available: true, startTime: '12:00', endTime: '22:00' }
    ]
  },
  // Sede Norte employees
  {
    id: '3',
    name: 'Pedro García',
    position: 'Cajero',
    locationId: '2',
    maxWeeklyHours: 40,
    hourlyRate: 5989,
    skills: ['Caja', 'Atención al cliente', 'Ventas'],
    availability: [
      { day: 1, available: true, startTime: '08:00', endTime: '16:00' },
      { day: 2, available: true, startTime: '08:00', endTime: '16:00' },
      { day: 3, available: true, startTime: '08:00', endTime: '16:00' },
      { day: 4, available: true, startTime: '08:00', endTime: '16:00' },
      { day: 5, available: true, startTime: '08:00', endTime: '16:00' },
      { day: 6, available: false },
      { day: 0, available: false }
    ]
  },
  {
    id: '4',
    name: 'María Rodríguez',
    position: 'Supervisora',
    locationId: '2',
    maxWeeklyHours: 45,
    hourlyRate: 7500,
    skills: ['Liderazgo', 'Gestión', 'Servicio al cliente'],
    availability: [
      { day: 1, available: true, startTime: '07:00', endTime: '19:00' },
      { day: 2, available: true, startTime: '07:00', endTime: '19:00' },
      { day: 3, available: true, startTime: '07:00', endTime: '19:00' },
      { day: 4, available: true, startTime: '07:00', endTime: '19:00' },
      { day: 5, available: true, startTime: '07:00', endTime: '19:00' },
      { day: 6, available: true, startTime: '08:00', endTime: '14:00' },
      { day: 0, available: false }
    ]
  },
  // Sede Chapinero employees
  {
    id: '5',
    name: 'Luis Hernández',
    position: 'Barista',
    locationId: '3',
    maxWeeklyHours: 42,
    hourlyRate: 6000,
    skills: ['Café', 'Bebidas', 'Servicio'],
    availability: [
      { day: 1, available: true, startTime: '06:00', endTime: '14:00' },
      { day: 2, available: true, startTime: '06:00', endTime: '14:00' },
      { day: 3, available: true, startTime: '06:00', endTime: '14:00' },
      { day: 4, available: true, startTime: '06:00', endTime: '14:00' },
      { day: 5, available: true, startTime: '06:00', endTime: '14:00' },
      { day: 6, available: true, startTime: '06:00', endTime: '14:00' },
      { day: 0, available: false }
    ]
  }
]

const defaultShiftTemplates: ShiftTemplate[] = [
  {
    id: 'template-1',
    name: 'Turno Mañana',
    startTime: '06:00',
    endTime: '14:00',
    duration: 8,
    type: 'regular',
    color: '#10B981',
    description: 'Turno matutino estándar',
    crossesMidnight: false
  },
  {
    id: 'template-2',
    name: 'Turno Tarde',
    startTime: '14:00',
    endTime: '22:00',
    duration: 8,
    type: 'regular',
    color: '#3B82F6',
    description: 'Turno vespertino estándar',
    crossesMidnight: false
  },
  {
    id: 'template-3',
    name: 'Turno Noche',
    startTime: '22:00',
    endTime: '06:00',
    duration: 8,
    type: 'night',
    color: '#8B5CF6',
    description: 'Turno nocturno con recargo',
    crossesMidnight: true
  },
  {
    id: 'template-4',
    name: 'Medio Turno Mañana',
    startTime: '06:00',
    endTime: '10:00',
    duration: 4,
    type: 'regular',
    color: '#84CC16',
    description: 'Medio turno matutino',
    crossesMidnight: false
  },
  {
    id: 'template-5',
    name: 'Medio Turno Tarde',
    startTime: '18:00',
    endTime: '22:00',
    duration: 4,
    type: 'regular',
    color: '#06B6D4',
    description: 'Medio turno vespertino',
    crossesMidnight: false
  },
  {
    id: 'template-6',
    name: 'Turno Extendido',
    startTime: '08:00',
    endTime: '20:00',
    duration: 12,
    type: 'overtime',
    color: '#F59E0B',
    description: 'Turno extendido con horas extras',
    crossesMidnight: false
  }
]

const initialShifts: ScheduleShift[] = [
  {
    id: '1',
    employeeId: '1',
    employeeName: 'Carlos López',
    position: 'Cocinero',
    locationId: '1',
    date: '2024-01-22',
    startTime: '06:00',
    endTime: '14:00',
    duration: 8,
    type: 'regular',
    status: 'confirmed',
    cost: 50000,
    templateId: 'template-1',
    crossesMidnight: false
  },
  {
    id: '2',
    employeeId: '2',
    employeeName: 'Ana Martínez',
    position: 'Mesera',
    locationId: '1',
    date: '2024-01-22',
    startTime: '14:00',
    endTime: '22:00',
    duration: 8,
    type: 'regular',
    status: 'confirmed',
    cost: 45832,
    templateId: 'template-2',
    crossesMidnight: false
  }
]

export default function BusinessScheduler() {
  const { addNotification } = useNotifications()
  const [selectedLocation, setSelectedLocation] = useState<string>('all')
  const [selectedWeek, setSelectedWeek] = useState('2024-W04')
  const [shifts, setShifts] = useState<ScheduleShift[]>(initialShifts)
  const [shiftTemplates, setShiftTemplates] = useState<ShiftTemplate[]>(defaultShiftTemplates)
  const [selectedTemplate, setSelectedTemplate] = useState<ShiftTemplate | null>(null)
  const [showTemplateModal, setShowTemplateModal] = useState(false)
  const [showCustomTimeModal, setShowCustomTimeModal] = useState(false)
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([])
  const [draggedEmployee, setDraggedEmployee] = useState<Employee | null>(null)
  const [showPublishModal, setShowPublishModal] = useState(false)
  const [pendingShiftData, setPendingShiftData] = useState<{
    employee: Employee
    date: Date
    timeSlot: string
  } | null>(null)
  const [activeTab, setActiveTab] = useState<'calendar' | 'templates'>('calendar')
  const [showEditShiftModal, setShowEditShiftModal] = useState(false)
  const [editingShift, setEditingShift] = useState<ScheduleShift | null>(null)

  // Filter employees based on selected location
  const filteredEmployees = selectedLocation === 'all' 
    ? mockEmployees 
    : mockEmployees.filter(emp => emp.locationId === selectedLocation)

  // Filter shifts based on selected location
  const filteredShifts = selectedLocation === 'all'
    ? shifts
    : shifts.filter(shift => shift.locationId === selectedLocation)

  // Calculate week dates
  const getWeekDates = (weekString: string) => {
    const [year, week] = weekString.split('-W')
    const dates = []
    const firstDayOfYear = new Date(parseInt(year), 0, 1)
    const daysOffset = (parseInt(week) - 1) * 7
    const weekStart = new Date(firstDayOfYear)
    weekStart.setDate(firstDayOfYear.getDate() + daysOffset)
    
    // Adjust to Monday
    const day = weekStart.getDay()
    const diff = weekStart.getDate() - day + (day === 0 ? -6 : 1)
    weekStart.setDate(diff)
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStart)
      date.setDate(weekStart.getDate() + i)
      dates.push(date)
    }
    
    return dates
  }

  const weekDates = getWeekDates(selectedWeek)
  const dayNames = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']

  // Colombian holidays function
  const getColombianHolidays = (year: number): Date[] => {
    const holidays: Date[] = []
    
    // Fixed holidays
    holidays.push(new Date(year, 0, 1))   // New Year's Day
    holidays.push(new Date(year, 4, 1))   // Labor Day
    holidays.push(new Date(year, 6, 20))  // Independence Day
    holidays.push(new Date(year, 7, 7))   // Battle of Boyacá
    holidays.push(new Date(year, 11, 8))  // Immaculate Conception
    holidays.push(new Date(year, 11, 25)) // Christmas Day
    
    // Movable holidays (next Monday after specific dates)
    const movableHolidays = [
      new Date(year, 0, 6),   // Epiphany
      new Date(year, 2, 19),  // Saint Joseph's Day
      new Date(year, 5, 29),  // Saints Peter and Paul
      new Date(year, 7, 15),  // Assumption of Mary
      new Date(year, 9, 12),  // Columbus Day
      new Date(year, 10, 1),  // All Saints' Day
      new Date(year, 10, 11), // Independence of Cartagena
    ]
    
    movableHolidays.forEach(date => {
      const dayOfWeek = date.getDay()
      if (dayOfWeek === 1) {
        holidays.push(date) // Already Monday
      } else {
        const daysToAdd = dayOfWeek === 0 ? 1 : 8 - dayOfWeek
        const mondayDate = new Date(date)
        mondayDate.setDate(date.getDate() + daysToAdd)
        holidays.push(mondayDate)
      }
    })
    
    // Easter-based holidays (simplified calculation)
    const easter = getEasterDate(year)
    holidays.push(new Date(easter.getTime() - 7 * 24 * 60 * 60 * 1000))  // Palm Sunday
    holidays.push(new Date(easter.getTime() - 3 * 24 * 60 * 60 * 1000))  // Maundy Thursday
    holidays.push(new Date(easter.getTime() - 2 * 24 * 60 * 60 * 1000))  // Good Friday
    holidays.push(new Date(easter.getTime() + 43 * 24 * 60 * 60 * 1000)) // Ascension Day
    holidays.push(new Date(easter.getTime() + 64 * 24 * 60 * 60 * 1000)) // Corpus Christi
    holidays.push(new Date(easter.getTime() + 71 * 24 * 60 * 60 * 1000)) // Sacred Heart
    
    return holidays
  }

  // Simplified Easter calculation (Gregorian calendar)
  const getEasterDate = (year: number): Date => {
    const a = year % 19
    const b = Math.floor(year / 100)
    const c = year % 100
    const d = Math.floor(b / 4)
    const e = b % 4
    const f = Math.floor((b + 8) / 25)
    const g = Math.floor((b - f + 1) / 3)
    const h = (19 * a + b - d - g + 15) % 30
    const i = Math.floor(c / 4)
    const k = c % 4
    const l = (32 + 2 * e + 2 * i - h - k) % 7
    const m = Math.floor((a + 11 * h + 22 * l) / 451)
    const month = Math.floor((h + l - 7 * m + 114) / 31) - 1
    const day = ((h + l - 7 * m + 114) % 31) + 1
    return new Date(year, month, day)
  }

  // Check if a date is a Colombian holiday
  const isColombianHoliday = (date: Date): boolean => {
    const holidays = getColombianHolidays(date.getFullYear())
    return holidays.some(holiday => 
      holiday.getDate() === date.getDate() &&
      holiday.getMonth() === date.getMonth() &&
      holiday.getFullYear() === date.getFullYear()
    )
  }

  // Check if a date is Sunday
  const isSunday = (date: Date): boolean => {
    return date.getDay() === 0
  }

  // Budget utility functions
  const getCurrentBudgetPeriod = (location: Location, date: Date): BudgetPeriod | null => {
    if (!location.budget || location.budget.periods.length === 0) return null
    
    const year = date.getFullYear()
    const month = date.getMonth() + 1
    const quarter = Math.ceil(month / 3)
    
    return location.budget.periods.find(period => {
      if (period.year !== year) return false
      if (location.budget!.type === 'monthly' && period.month !== month) return false
      if (location.budget!.type === 'quarterly' && period.quarter !== quarter) return false
      return true
    }) || null
  }

  const getWeeklyBudgetFromPeriod = (location: Location, date: Date): number => {
    const period = getCurrentBudgetPeriod(location, date)
    if (!period || !location.budget?.autoDistribute) return location.weeklyBudget
    
    if (location.budget.type === 'monthly') {
      const daysInMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
      const weeksInMonth = Math.ceil(daysInMonth / 7)
      return Math.round(period.amount / weeksInMonth)
    } else if (location.budget.type === 'quarterly') {
      return Math.round(period.amount / 13) // ~13 weeks per quarter
    } else if (location.budget.type === 'annual') {
      return Math.round(period.amount / 52) // 52 weeks per year
    }
    
    return location.weeklyBudget
  }

  const getBudgetUtilization = (period: BudgetPeriod): number => {
    return (period.spent / period.amount) * 100
  }

  const getBudgetStatus = (utilization: number, threshold: number): 'success' | 'warning' | 'error' => {
    if (utilization >= 100) return 'error'
    if (utilization >= threshold) return 'warning'
    return 'success'
  }

  const formatCurrency = (amount: number): string => {
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`
    }
    if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(0)}K`
    }
    return `$${amount.toLocaleString()}`
  }

  // Utility functions for time handling
  const timeToMinutes = (time: string): number => {
    const [hours, minutes] = time.split(':').map(Number)
    return hours * 60 + minutes
  }

  const minutesToTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`
  }

  const calculateShiftDuration = (startTime: string, endTime: string, crossesMidnight: boolean): number => {
    const startMinutes = timeToMinutes(startTime)
    const endMinutes = timeToMinutes(endTime)
    
    if (crossesMidnight) {
      return (24 * 60) - startMinutes + endMinutes
    } else {
      return endMinutes - startMinutes
    }
  }

  const getShiftEndDate = (startDate: string, startTime: string, endTime: string): string => {
    const startMinutes = timeToMinutes(startTime)
    const endMinutes = timeToMinutes(endTime)
    
    if (endMinutes <= startMinutes) {
      // Shift crosses midnight
      const date = new Date(startDate)
      date.setDate(date.getDate() + 1)
      return date.toISOString().split('T')[0]
    }
    
    return startDate
  }

  const detectShiftType = (startTime: string, endTime: string, duration: number, date: Date): ScheduleShift['type'] => {
    const startMinutes = timeToMinutes(startTime)
    const endMinutes = timeToMinutes(endTime)
    const dayOfWeek = date.getDay()
    
    // Holiday work (Colombian holidays or Sundays)
    if (isColombianHoliday(date) || dayOfWeek === 0) {
      return 'holiday'
    }
    
    // Night shift: between 21:00 and 06:00
    if (startMinutes >= 21 * 60 || endMinutes <= 6 * 60 || endMinutes <= startMinutes) {
      return 'night'
    }
    
    // Overtime: more than 8 hours
    if (duration > 8 * 60) {
      return 'overtime'
    }
    
    return 'regular'
  }

  // Get shifts for a specific employee and date
  const getShiftsForEmployeeAndDate = (employeeId: string, date: string): ScheduleShift[] => {
    return filteredShifts.filter(s => s.employeeId === employeeId && s.date === date)
  }

  const calculateShiftCost = (hours: number, hourlyRate: number, type: ScheduleShift['type'], date: Date) => {
    let cost = hours * hourlyRate
    const dayOfWeek = date.getDay()
    
    // Colombian labor law surcharges
    if (type === 'night') {
      cost *= 1.35 // 35% night surcharge
    }
    if (type === 'overtime') {
      cost *= 1.25 // 25% overtime surcharge
    }
    if (type === 'holiday' || isColombianHoliday(date) || dayOfWeek === 0) {
      cost *= 2.0 // 100% holiday/Sunday surcharge
    }
    
    return Math.round(cost)
  }

  const validateShift = (employee: Employee, date: Date, startTime: string, endTime: string) => {
    const errors: ValidationError[] = []
    const dayOfWeek = date.getDay()
    const availability = employee.availability[dayOfWeek]
    
    // Check availability
    if (!availability.available) {
      errors.push({
        type: 'availability',
        message: `${employee.name} no está disponible los ${dayNames[dayOfWeek === 0 ? 6 : dayOfWeek - 1]}`,
        severity: 'error'
      })
    }
    
    // Check overtime
    const employeeShifts = shifts.filter(s => s.employeeId === employee.id)
    const weeklyHours = employeeShifts.reduce((sum, s) => sum + s.duration, 0)
    const shiftHours = parseInt(endTime.split(':')[0]) - parseInt(startTime.split(':')[0])
    
    if (weeklyHours + shiftHours > employee.maxWeeklyHours) {
      errors.push({
        type: 'overtime',
        message: `${employee.name} excedería las ${employee.maxWeeklyHours} horas semanales permitidas`,
        severity: 'warning'
      })
    }
    
    // Check overlap
    const dateString = date.toISOString().split('T')[0]
    const overlappingShift = shifts.find(s => 
      s.employeeId === employee.id && 
      s.date === dateString &&
      ((startTime >= s.startTime && startTime < s.endTime) ||
       (endTime > s.startTime && endTime <= s.endTime))
    )
    
    if (overlappingShift) {
      errors.push({
        type: 'overlap',
        message: `${employee.name} ya tiene un turno asignado en este horario`,
        severity: 'error'
      })
    }

    // Check budget for location
    if (selectedLocation !== 'all') {
      const location = mockLocations.find(l => l.id === selectedLocation)
      if (location) {
        const shiftCost = calculateShiftCost(shiftHours, employee.hourlyRate, 'regular', date)
        const newTotal = location.weeklySpent + shiftCost
        if (newTotal > location.weeklyBudget) {
          errors.push({
            type: 'budget',
            message: `Agregar este turno excedería el presupuesto semanal de ${location.name}`,
            severity: 'warning'
          })
        }
      }
    }
    
    return errors
  }

  const handleEmployeeDragStart = (e: React.DragEvent, employee: Employee) => {
    setDraggedEmployee(employee)
    e.dataTransfer.effectAllowed = 'copy'
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'copy'
  }

  const handleDrop = (e: React.DragEvent, date: Date, employeeId: string) => {
    e.preventDefault()
    
    if (draggedEmployee) {
      // Store pending data for template selection modal
      setPendingShiftData({
        employee: draggedEmployee,
        date: date,
        timeSlot: '06:00' // Default, will be overridden by template selection
      })
      setShowCustomTimeModal(true)
      setDraggedEmployee(null)
    }
  }

  const applyTemplateToSlot = (template: ShiftTemplate, date: Date, timeSlot: string) => {
    if (!draggedEmployee && !pendingShiftData) {
      addNotification({ type: 'error', title: 'Error', message: 'Selecciona un empleado primero' })
      return
    }

    const employee = draggedEmployee || pendingShiftData?.employee
    if (!employee) return

    const duration = calculateShiftDuration(template.startTime, template.endTime, template.crossesMidnight)
    const errors = validateShift(employee, date, template.startTime, template.endTime)
    
    if (errors.some(e => e.severity === 'error')) {
      setValidationErrors(errors)
      addNotification({ type: 'error', title: 'Error', message: 'No se puede asignar el turno debido a conflictos' })
      return
    }
    
    const dayOfWeek = date.getDay()
    const actualEndDate = getShiftEndDate(date.toISOString().split('T')[0], template.startTime, template.endTime)
    
    const newShift: ScheduleShift = {
      id: `shift-${Date.now()}`,
      employeeId: employee.id,
      employeeName: employee.name,
      position: employee.position,
      locationId: employee.locationId,
      date: date.toISOString().split('T')[0],
      startTime: template.startTime,
      endTime: template.endTime,
      duration: duration / 60, // Convert minutes to hours
      type: template.type,
      status: 'draft',
      cost: calculateShiftCost(duration / 60, employee.hourlyRate, template.type, date),
      templateId: template.id,
      crossesMidnight: template.crossesMidnight,
      actualDate: actualEndDate
    }
    
    setShifts([...shifts, newShift])
    
    if (errors.length > 0) {
      setValidationErrors(errors)
    }
    
    const shiftDescription = template.crossesMidnight 
      ? `${template.name} (${template.startTime} - ${template.endTime} +1 día)`
      : `${template.name} (${template.startTime} - ${template.endTime})`
    
    addNotification({ type: 'success', title: 'Éxito', message: `${shiftDescription} asignado a ${employee.name}` })
  }

  const handleShiftSubmit = (templateId: string | null, customStartTime?: string, customEndTime?: string) => {
    if (!pendingShiftData) return

    const { employee, date } = pendingShiftData
    const dayOfWeek = date.getDay()
    
    let startTime: string, endTime: string, duration: number, shiftType: ScheduleShift['type'], templateUsed: ShiftTemplate | null = null
    
    if (templateId) {
      // Use template
      templateUsed = shiftTemplates.find(t => t.id === templateId) || null
      if (!templateUsed) return
      
      startTime = templateUsed.startTime
      endTime = templateUsed.endTime
      duration = templateUsed.duration
      shiftType = templateUsed.type
    } else if (customStartTime && customEndTime) {
      // Use custom times
      startTime = customStartTime
      endTime = customEndTime
      const crossesMidnight = timeToMinutes(endTime) <= timeToMinutes(startTime)
      duration = calculateShiftDuration(startTime, endTime, crossesMidnight) / 60
      shiftType = detectShiftType(startTime, endTime, duration * 60, date)
      
      // Check for overtime
      if (duration > 8) {
        const confirm = window.confirm(
          `Este turno de ${duration.toFixed(1)} horas excede las 8 horas legales. Se cobrarán horas extras con recargo del 25%. ¿Continuar?`
        )
        if (!confirm) return
      }
    } else {
      return
    }
    
    const errors = validateShift(employee, date, startTime, endTime)
    
    if (errors.some(e => e.severity === 'error')) {
      setValidationErrors(errors)
      addNotification({ type: 'error', title: 'Error', message: 'No se puede asignar el turno debido a conflictos' })
      return
    }
    
    const crossesMidnight = timeToMinutes(endTime) <= timeToMinutes(startTime)
    const actualEndDate = getShiftEndDate(date.toISOString().split('T')[0], startTime, endTime)
    
    const newShift: ScheduleShift = {
      id: `shift-${Date.now()}`,
      employeeId: employee.id,
      employeeName: employee.name,
      position: employee.position,
      locationId: employee.locationId,
      date: date.toISOString().split('T')[0],
      startTime: startTime,
      endTime: endTime,
      duration: duration,
      type: shiftType,
      status: 'draft',
      cost: calculateShiftCost(duration, employee.hourlyRate, shiftType, date),
      templateId: templateUsed?.id,
      crossesMidnight: crossesMidnight,
      actualDate: actualEndDate
    }
    
    setShifts([...shifts, newShift])
    setShowCustomTimeModal(false)
    setPendingShiftData(null)
    
    if (errors.length > 0) {
      setValidationErrors(errors)
    }
    
    const shiftDescription = templateUsed 
      ? `${templateUsed.name} (${startTime} - ${endTime}${crossesMidnight ? ' +1 día' : ''})`
      : `Turno personalizado (${startTime} - ${endTime}${crossesMidnight ? ' +1 día' : ''})`
    
    addNotification({ type: 'success', title: 'Éxito', message: `${shiftDescription} asignado a ${employee.name}` })
  }

  const handleDeleteShift = (shiftId: string) => {
    setShifts(shifts.filter(s => s.id !== shiftId))
    addNotification({ type: 'success', title: 'Éxito', message: 'Turno eliminado' })
  }

  const handleEditShift = (shift: ScheduleShift) => {
    setEditingShift(shift)
    setShowEditShiftModal(true)
  }

  const handleSaveEditedShift = (updatedShift: ScheduleShift) => {
    const updatedShifts = shifts.map(shift => 
      shift.id === updatedShift.id ? updatedShift : shift
    )
    setShifts(updatedShifts)
    setShowEditShiftModal(false)
    setEditingShift(null)
    addNotification({ type: 'success', title: 'Éxito', message: 'Turno actualizado exitosamente' })
  }

  const handlePublishSchedule = () => {
    const updatedShifts = shifts.map(shift => ({
      ...shift,
      status: 'published' as const
    }))
    setShifts(updatedShifts)
    setShowPublishModal(false)
    addNotification({ type: 'success', title: 'Éxito', message: 'Horario publicado exitosamente' })
  }

  const calculateLocationMetrics = (locationId: string) => {
    const locationShifts = shifts.filter(s => s.locationId === locationId)
    const totalHours = locationShifts.reduce((sum, s) => sum + s.duration, 0)
    const totalCost = locationShifts.reduce((sum, s) => sum + s.cost, 0)
    const employeeCount = new Set(locationShifts.map(s => s.employeeId)).size
    
    return { totalHours, totalCost, employeeCount, shiftCount: locationShifts.length }
  }

  const calculateTotalMetrics = () => {
    const totalHours = shifts.reduce((sum, s) => sum + s.duration, 0)
    const totalCost = shifts.reduce((sum, s) => sum + s.cost, 0)
    const employeeCount = new Set(shifts.map(s => s.employeeId)).size
    
    return { totalHours, totalCost, employeeCount, shiftCount: shifts.length }
  }

  const metrics = selectedLocation === 'all' 
    ? calculateTotalMetrics()
    : calculateLocationMetrics(selectedLocation)

  return (
    <div className="space-y-6">
      {/* Header with location selector */}
      <div className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-lg p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-neutral-black mb-2">
              Planificador de Horarios
            </h1>
            <p className="text-neutral-dark-gray">
              Gestiona los horarios de todas las ubicaciones de tu empresa
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex flex-col">
              <label className="text-xs text-neutral-medium-gray mb-1">Ubicación</label>
              <select
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                className="px-4 py-2 border border-neutral-light-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="all">Todas las ubicaciones</option>
                {mockLocations.map(location => (
                  <option key={location.id} value={location.id}>
                    {location.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="flex flex-col">
              <label className="text-xs text-neutral-medium-gray mb-1">Semana</label>
              <input
                type="week"
                value={selectedWeek}
                onChange={(e) => setSelectedWeek(e.target.value)}
                className="px-4 py-2 border border-neutral-light-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Navigation tabs */}
      <div className="border-b border-neutral-light-gray">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('calendar')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'calendar'
                ? 'border-primary text-primary'
                : 'border-transparent text-neutral-medium-gray hover:text-neutral-dark-gray'
            }`}
          >
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>Calendario</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('templates')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'templates'
                ? 'border-primary text-primary'
                : 'border-transparent text-neutral-medium-gray hover:text-neutral-dark-gray'
            }`}
          >
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 9a2 2 0 00-2 2v2a2 2 0 002 2m0 0h14m-14 0a2 2 0 002 2v2a2 2 0 01-2 2M5 9V7a2 2 0 012-2h10a2 2 0 012 2v2M5 9a2 2 0 012-2h10a2 2 0 012 2m0 0V9" />
              </svg>
              <span>Plantillas</span>
            </div>
          </button>
        </nav>
      </div>

      {/* Calendar view */}
      {activeTab === 'calendar' && (
        <div className="space-y-6">
          {/* Enhanced Location metrics with budget alerts */}
          {selectedLocation !== 'all' && (
        <div className="space-y-4">
          {mockLocations
            .filter(loc => loc.id === selectedLocation)
            .map(location => {
              const currentPeriod = getCurrentBudgetPeriod(location, weekDates[0])
              const weeklyBudgetFromPeriod = getWeeklyBudgetFromPeriod(location, weekDates[0])
              const utilization = currentPeriod ? getBudgetUtilization(currentPeriod) : 0
              const status = currentPeriod ? getBudgetStatus(utilization, location.budget?.alertThreshold || 80) : 'success'
              
              return (
                <React.Fragment key={location.id}>
                  {/* Budget Alert Banner */}
                  {currentPeriod && status !== 'success' && (
                    <Card className={`p-4 border-l-4 ${
                      status === 'error' ? 'border-semantic-error bg-semantic-error/5' :
                      'border-semantic-warning bg-semantic-warning/5'
                    }`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className={`p-2 rounded-full ${
                            status === 'error' ? 'bg-semantic-error/10' : 'bg-semantic-warning/10'
                          }`}>
                            <svg className={`w-5 h-5 ${
                              status === 'error' ? 'text-semantic-error' : 'text-semantic-warning'
                            }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                          </div>
                          <div>
                            <h3 className={`font-medium ${
                              status === 'error' ? 'text-semantic-error' : 'text-semantic-warning'
                            }`}>
                              {status === 'error' ? 'Presupuesto Excedido' : 'Alerta de Presupuesto'}
                            </h3>
                            <p className="text-sm text-neutral-medium-gray">
                              {utilization.toFixed(1)}% del presupuesto {location.budget?.type === 'monthly' ? 'mensual' : 
                               location.budget?.type === 'quarterly' ? 'trimestral' : 'anual'} utilizado
                            </p>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => {
                            // TODO: Open budget adjustment modal
                            addNotification({ type: 'info', title: 'Información', message: 'Función de ajuste de presupuesto próximamente' })
                          }}
                        >
                          Ajustar Presupuesto
                        </Button>
                      </div>
                    </Card>
                  )}

                  {/* Metrics Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card className="p-4">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center mr-3">
                          <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-xs text-neutral-medium-gray">Empleados</p>
                          <p className="text-xl font-bold">{location.employeeCount}</p>
                        </div>
                      </div>
                    </Card>
                    
                    <Card className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center mr-3 ${
                            status === 'error' ? 'bg-semantic-error/10' :
                            status === 'warning' ? 'bg-semantic-warning/10' :
                            'bg-semantic-success/10'
                          }`}>
                            <svg className={`w-6 h-6 ${
                              status === 'error' ? 'text-semantic-error' :
                              status === 'warning' ? 'text-semantic-warning' :
                              'text-semantic-success'
                            }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                          <div>
                            <p className="text-xs text-neutral-medium-gray">Presupuesto Semanal</p>
                            <p className="text-xl font-bold">{formatCurrency(weeklyBudgetFromPeriod)}</p>
                            {location.budget?.autoDistribute && (
                              <p className="text-xs text-neutral-medium-gray">Auto-distribuido</p>
                            )}
                          </div>
                        </div>
                        {currentPeriod && (
                          <div className={`w-3 h-3 rounded-full ${
                            status === 'error' ? 'bg-semantic-error' :
                            status === 'warning' ? 'bg-semantic-warning' :
                            'bg-semantic-success'
                          }`} title={`${utilization.toFixed(1)}% utilizado`} />
                        )}
                      </div>
                    </Card>
                    
                    <Card className="p-4">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-semantic-warning/10 rounded-lg flex items-center justify-center mr-3">
                          <svg className="w-6 h-6 text-semantic-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-xs text-neutral-medium-gray">Gastado Esta Semana</p>
                          <p className="text-xl font-bold">{formatCurrency(location.weeklySpent)}</p>
                        </div>
                      </div>
                    </Card>
                    
                    <Card className="p-4">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-semantic-success/10 rounded-lg flex items-center justify-center mr-3">
                          <svg className="w-6 h-6 text-semantic-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-xs text-neutral-medium-gray">Disponible</p>
                          <p className="text-xl font-bold text-semantic-success">
                            {formatCurrency(weeklyBudgetFromPeriod - location.weeklySpent)}
                          </p>
                          <div className="w-full bg-neutral-light-gray rounded-full h-2 mt-2">
                            <div 
                              className={`h-2 rounded-full transition-all duration-300 ${
                                status === 'error' ? 'bg-semantic-error' :
                                status === 'warning' ? 'bg-semantic-warning' :
                                'bg-semantic-success'
                              }`}
                              style={{ width: `${Math.min((location.weeklySpent / weeklyBudgetFromPeriod) * 100, 100)}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </Card>
                  </div>
                </React.Fragment>
              )
            })}
        </div>
      )}

      {/* Consolidated metrics for all locations */}
      {selectedLocation === 'all' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-4">
            <h3 className="text-sm font-medium text-neutral-dark-gray mb-2">Total Ubicaciones</h3>
            <p className="text-2xl font-bold">{mockLocations.length}</p>
          </Card>
          
          <Card className="p-4">
            <h3 className="text-sm font-medium text-neutral-dark-gray mb-2">Total Empleados</h3>
            <p className="text-2xl font-bold">{mockEmployees.length}</p>
          </Card>
          
          <Card className="p-4">
            <h3 className="text-sm font-medium text-neutral-dark-gray mb-2">Costo Total Semanal</h3>
            <p className="text-2xl font-bold">${(metrics.totalCost / 1000000).toFixed(1)}M</p>
          </Card>
          
          <Card className="p-4">
            <h3 className="text-sm font-medium text-neutral-dark-gray mb-2">Turnos Programados</h3>
            <p className="text-2xl font-bold">{metrics.shiftCount}</p>
          </Card>
        </div>
      )}

      <div className="grid lg:grid-cols-4 gap-6">
        {/* Employee sidebar */}
        <Card className="lg:col-span-1">
          <div className="p-4 border-b border-neutral-light-gray">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-semibold">Empleados</h2>
              <Button 
                size="sm" 
                variant="secondary"
                onClick={() => {
                  setSelectedTemplate(null)
                  setShowTemplateModal(true)
                }}
                title="Gestionar plantillas"
              >
                ⚙️
              </Button>
            </div>
            <p className="text-sm text-neutral-medium-gray">
              Arrastra empleados al calendario
            </p>
          </div>
          
          <div className="p-4 space-y-3 max-h-[700px] overflow-y-auto">
            {filteredEmployees.map(employee => {
              const employeeShifts = shifts.filter(s => s.employeeId === employee.id)
              const weeklyHours = employeeShifts.reduce((sum, s) => sum + s.duration, 0)
              const hoursPercentage = (weeklyHours / employee.maxWeeklyHours) * 100
              
              return (
                <div
                  key={employee.id}
                  draggable
                  onDragStart={(e) => handleEmployeeDragStart(e, employee)}
                  className="p-3 bg-neutral-off-white rounded-lg cursor-move hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-semibold text-sm">{employee.name}</h3>
                      <p className="text-xs text-neutral-medium-gray">{employee.position}</p>
                      {selectedLocation === 'all' && (
                        <p className="text-xs text-primary mt-1">
                          {mockLocations.find(l => l.id === employee.locationId)?.name}
                        </p>
                      )}
                    </div>
                    <Tag variant={hoursPercentage > 90 ? 'error' : hoursPercentage > 70 ? 'warning' : 'success'}>
                      {weeklyHours}h/{employee.maxWeeklyHours}h
                    </Tag>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex items-center text-xs">
                      <span className="text-neutral-medium-gray">Tarifa:</span>
                      <span className="ml-auto font-medium">${employee.hourlyRate.toLocaleString()}/h</span>
                    </div>
                    
                    <div className="w-full bg-neutral-light-gray rounded-full h-1.5">
                      <div 
                        className={`h-1.5 rounded-full transition-all ${
                          hoursPercentage > 90 ? 'bg-semantic-error' :
                          hoursPercentage > 70 ? 'bg-semantic-warning' :
                          'bg-semantic-success'
                        }`}
                        style={{ width: `${Math.min(hoursPercentage, 100)}%` }}
                      />
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-1 mt-2">
                    {employee.skills.slice(0, 2).map((skill, idx) => (
                      <span key={idx} className="text-xs px-2 py-1 bg-primary/10 text-primary rounded">
                        {skill}
                      </span>
                    ))}
                    {employee.skills.length > 2 && (
                      <span className="text-xs px-2 py-1 bg-neutral-light-gray rounded">
                        +{employee.skills.length - 2}
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </Card>

        {/* Schedule grid - Employee x Day view */}
        <Card className="lg:col-span-3 overflow-x-auto">
          <div className="p-4 border-b border-neutral-light-gray flex items-center justify-between">
            <h2 className="text-lg font-semibold">Horario Semanal</h2>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowPublishModal(true)}
                disabled={shifts.filter(s => s.status === 'draft').length === 0}
              >
                Publicar Horario
              </Button>
              <Button size="sm">
                Exportar
              </Button>
            </div>
          </div>
          
          <div className="p-4">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px]">
                <thead>
                  <tr>
                    <th className="text-left p-3 text-sm font-semibold w-48">Empleado</th>
                    {weekDates.map((date, idx) => {
                      const isHoliday = isColombianHoliday(date)
                      const isSundayDate = isSunday(date)
                      const isSpecialDay = isHoliday || isSundayDate
                      
                      return (
                        <th 
                          key={idx} 
                          className={`text-center p-3 text-sm min-w-[120px] ${
                            isSpecialDay 
                              ? 'bg-semantic-error/10 border-semantic-error/20' 
                              : ''
                          }`}
                        >
                          <div className={`font-semibold ${
                            isSpecialDay ? 'text-semantic-error' : ''
                          }`}>
                            {dayNames[idx]}
                            {isHoliday && (
                              <span className="ml-1" title="Día festivo">
                                🎉
                              </span>
                            )}
                            {isSundayDate && !isHoliday && (
                              <span className="ml-1" title="Domingo">
                                📅
                              </span>
                            )}
                          </div>
                          <div className={`text-xs ${
                            isSpecialDay ? 'text-semantic-error/70' : 'text-neutral-medium-gray'
                          }`}>
                            {date.toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })}
                          </div>
                        </th>
                      )
                    })}
                  </tr>
                </thead>
                <tbody>
                  {filteredEmployees.map(employee => {
                    const employeeShifts = shifts.filter(s => s.employeeId === employee.id)
                    const weeklyHours = employeeShifts.reduce((sum, s) => sum + s.duration, 0)
                    const hoursPercentage = (weeklyHours / employee.maxWeeklyHours) * 100
                    
                    return (
                      <tr key={employee.id} className="border-b border-neutral-light-gray hover:bg-neutral-off-white/30">
                        <td className="p-3">
                          <div className="flex items-center space-x-3">
                            <div className="flex-1">
                              <h3 className="font-semibold text-sm">{employee.name}</h3>
                              <p className="text-xs text-neutral-medium-gray">{employee.position}</p>
                              {selectedLocation === 'all' && (
                                <p className="text-xs text-primary">
                                  {mockLocations.find(l => l.id === employee.locationId)?.name}
                                </p>
                              )}
                            </div>
                            <div className="text-right">
                              <Tag variant={hoursPercentage > 90 ? 'error' : hoursPercentage > 70 ? 'warning' : 'success'} className="text-xs">
                                {weeklyHours}h
                              </Tag>
                            </div>
                          </div>
                        </td>
                        {weekDates.map((date, idx) => {
                          const dateString = date.toISOString().split('T')[0]
                          const dayShifts = getShiftsForEmployeeAndDate(employee.id, dateString)
                          const isHoliday = isColombianHoliday(date)
                          const isSundayDate = isSunday(date)
                          const isSpecialDay = isHoliday || isSundayDate
                          
                          return (
                            <td 
                              key={idx}
                              className={`p-2 border-l border-neutral-light-gray relative min-h-[80px] ${
                                isSpecialDay ? 'bg-semantic-error/5' : ''
                              }`}
                              onDragOver={handleDragOver}
                              onDrop={(e) => handleDrop(e, date, employee.id)}
                            >
                              <div className="min-h-[60px] space-y-1">
                                {dayShifts.length === 0 ? (
                                  <div className="w-full h-full rounded border-2 border-dashed border-neutral-light-gray flex flex-col items-center justify-center text-neutral-medium-gray text-xs gap-2">
                                    <span>Arrastra aquí</span>
                                    <span className="text-neutral-light-gray">o</span>
                                    <button
                                      onClick={() => {
                                        setPendingShiftData({
                                          employee: employee,
                                          date: date,
                                          timeSlot: '06:00'
                                        })
                                        setShowCustomTimeModal(true)
                                      }}
                                      className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center hover:bg-primary/80 transition-colors"
                                      title="Asignar turno"
                                    >
                                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                      </svg>
                                    </button>
                                  </div>
                                ) : (
                                  dayShifts.map(shift => {
                                    const template = shift.templateId ? shiftTemplates.find(t => t.id === shift.templateId) : null
                                    const shiftColor = template?.color || (
                                      shift.type === 'night' ? '#8B5CF6' :
                                      shift.type === 'overtime' ? '#F59E0B' :
                                      shift.type === 'holiday' ? '#EF4444' :
                                      '#10B981'
                                    )
                                    
                                    return (
                                      <div
                                        key={shift.id}
                                        className={`p-2 rounded text-xs cursor-pointer relative group border-l-4 ${
                                          shift.status === 'published' ? 'bg-semantic-success/10' :
                                          shift.status === 'confirmed' ? 'bg-primary/10' :
                                          'bg-neutral-off-white'
                                        }`}
                                        style={{ 
                                          borderLeftColor: shiftColor
                                        }}
                                        onClick={() => {
                                          handleEditShift(shift)
                                        }}
                                      >
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation()
                                            handleDeleteShift(shift.id)
                                          }}
                                          className="absolute -top-1 -right-1 w-4 h-4 bg-semantic-error text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity text-xs leading-none"
                                        >
                                          ×
                                        </button>
                                        
                                        <div className="flex justify-between items-center">
                                          <div className="font-medium">
                                            {shift.startTime} - {shift.endTime}
                                          </div>
                                          <div className="flex items-center space-x-1">
                                            {shift.crossesMidnight && (
                                              <span className="text-semantic-warning">🌙</span>
                                            )}
                                            {shift.type === 'overtime' && (
                                              <span className="text-semantic-error">+</span>
                                            )}
                                            <span className="text-xs text-neutral-medium-gray">
                                              {shift.duration}h
                                            </span>
                                          </div>
                                        </div>
                                        
                                        {template && (
                                          <div className="text-xs text-neutral-medium-gray mt-1 truncate">
                                            {template.name}
                                          </div>
                                        )}
                                      </div>
                                    )
                                  })
                                )}
                              </div>
                            </td>
                          )
                        })}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            
            {/* Schedule summary */}
            <div className="mt-6 p-4 bg-primary/5 rounded-lg">
              <h3 className="font-semibold mb-3">Resumen del Horario</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-xs text-neutral-medium-gray">Total Horas</p>
                  <p className="text-lg font-bold">{metrics.totalHours}h</p>
                </div>
                <div>
                  <p className="text-xs text-neutral-medium-gray">Costo Estimado</p>
                  <p className="text-lg font-bold">${metrics.totalCost.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-neutral-medium-gray">Empleados</p>
                  <p className="text-lg font-bold">{metrics.employeeCount}</p>
                </div>
                <div>
                  <p className="text-xs text-neutral-medium-gray">Turnos</p>
                  <p className="text-lg font-bold">{metrics.shiftCount}</p>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Validation errors */}
      {validationErrors.length > 0 && (
        <Card className="border-semantic-warning/30 bg-semantic-warning/5">
          <div className="p-4">
            <h3 className="font-semibold text-semantic-warning mb-3">Alertas de Validación</h3>
            <div className="space-y-2">
              {validationErrors.map((error, idx) => (
                <div key={idx} className="flex items-start space-x-2">
                  <svg 
                    className={`w-5 h-5 mt-0.5 ${
                      error.severity === 'error' ? 'text-semantic-error' : 'text-semantic-warning'
                    }`} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" 
                    />
                  </svg>
                  <p className="text-sm">{error.message}</p>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}
        </div>
      )}

      {/* Templates management view */}
      {activeTab === 'templates' && (
        <div className="space-y-6">
          <Card>
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-neutral-black">Gestión de Plantillas</h2>
                  <p className="text-neutral-medium-gray mt-1">
                    Administra las plantillas de turno que podrás usar en el calendario
                  </p>
                </div>
                <Button
                  onClick={() => {
                    setSelectedTemplate(null)
                    setShowTemplateModal(true)
                  }}
                  className="flex items-center space-x-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  <span>Nueva Plantilla</span>
                </Button>
              </div>

              {/* Templates grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {shiftTemplates.map(template => (
                  <div
                    key={template.id}
                    className="border border-neutral-light-gray rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <div 
                            className="w-4 h-4 rounded"
                            style={{ backgroundColor: template.color }}
                          />
                          <h3 className="font-semibold text-neutral-black">{template.name}</h3>
                        </div>
                        <p className="text-sm text-neutral-medium-gray">
                          {template.startTime} - {template.endTime}
                          {template.crossesMidnight && ' (+1 día)'}
                        </p>
                      </div>
                      <div className="flex space-x-1">
                        <button
                          onClick={() => {
                            setSelectedTemplate(template)
                            setShowTemplateModal(true)
                          }}
                          className="p-1 text-neutral-medium-gray hover:text-primary transition-colors"
                          title="Editar plantilla"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`¿Estás seguro de eliminar la plantilla "${template.name}"?`)) {
                              setShiftTemplates(prev => prev.filter(t => t.id !== template.id))
                              addNotification({ type: 'success', title: 'Éxito', message: 'Plantilla eliminada' })
                            }
                          }}
                          className="p-1 text-neutral-medium-gray hover:text-semantic-error transition-colors"
                          title="Eliminar plantilla"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-neutral-medium-gray">Duración:</span>
                        <span className="font-medium">{template.duration}h</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-neutral-medium-gray">Tipo:</span>
                        <span className={`font-medium ${
                          template.type === 'night' ? 'text-semantic-warning' :
                          template.type === 'overtime' ? 'text-semantic-error' :
                          'text-semantic-success'
                        }`}>
                          {template.type === 'night' ? 'Nocturno (+35%)' :
                           template.type === 'overtime' ? 'Horas Extra (+25%)' :
                           'Regular'}
                        </span>
                      </div>
                      {template.description && (
                        <div className="text-sm">
                          <span className="text-neutral-medium-gray">Descripción:</span>
                          <p className="text-neutral-dark-gray mt-1">{template.description}</p>
                        </div>
                      )}
                    </div>

                    {/* Preview */}
                    <div className="mt-4 p-3 rounded-lg border" style={{ 
                      backgroundColor: template.color + '15',
                      borderColor: template.color + '40'
                    }}>
                      <div className="text-center">
                        <div className="font-medium text-sm">{template.name}</div>
                        <div className="text-xs text-neutral-medium-gray">
                          {template.startTime} - {template.endTime}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {shiftTemplates.length === 0 && (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-neutral-light-gray rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-neutral-medium-gray" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 9a2 2 0 00-2 2v2a2 2 0 002 2m0 0h14m-14 0a2 2 0 002 2v2a2 2 0 01-2 2M5 9V7a2 2 0 012-2h10a2 2 0 012 2v2M5 9a2 2 0 012-2h10a2 2 0 012 2m0 0V9" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-neutral-black mb-2">No hay plantillas</h3>
                  <p className="text-neutral-medium-gray mb-4">
                    Crea tu primera plantilla de turno para agilizar la asignación de horarios
                  </p>
                  <Button
                    onClick={() => {
                      setSelectedTemplate(null)
                      setShowTemplateModal(true)
                    }}
                  >
                    Crear Primera Plantilla
                  </Button>
                </div>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* Publish schedule modal */}
      <Modal
        isOpen={showPublishModal}
        onClose={() => setShowPublishModal(false)}
        title="Publicar Horario"
      >
        <div className="space-y-4">
          <p className="text-neutral-dark-gray">
            ¿Estás seguro de publicar este horario? Una vez publicado, los empleados recibirán notificaciones y podrán ver sus turnos asignados.
          </p>
          
          <div className="bg-primary/5 p-4 rounded-lg">
            <h4 className="font-semibold mb-2">Resumen</h4>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span>Turnos en borrador:</span>
                <span className="font-semibold">{shifts.filter(s => s.status === 'draft').length}</span>
              </div>
              <div className="flex justify-between">
                <span>Total empleados:</span>
                <span className="font-semibold">{metrics.employeeCount}</span>
              </div>
              <div className="flex justify-between">
                <span>Costo total:</span>
                <span className="font-semibold">${metrics.totalCost.toLocaleString()}</span>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end space-x-2">
            <Button
              variant="secondary"
              onClick={() => setShowPublishModal(false)}
            >
              Cancelar
            </Button>
            <Button onClick={handlePublishSchedule}>
              Publicar Horario
            </Button>
          </div>
        </div>
      </Modal>

      {/* Shift creation modal with template selector */}
      <Modal
        isOpen={showCustomTimeModal}
        onClose={() => {
          setShowCustomTimeModal(false)
          setPendingShiftData(null)
        }}
        title="Asignar Turno"
      >
        {pendingShiftData && (
          <ShiftCreationForm
            employee={pendingShiftData.employee}
            date={pendingShiftData.date}
            templates={shiftTemplates}
            onSubmit={handleShiftSubmit}
            onCancel={() => {
              setShowCustomTimeModal(false)
              setPendingShiftData(null)
            }}
          />
        )}
      </Modal>

      {/* Template management modal */}
      <Modal
        isOpen={showTemplateModal}
        onClose={() => {
          setShowTemplateModal(false)
          setSelectedTemplate(null)
        }}
        title={selectedTemplate ? 'Editar Plantilla' : 'Nueva Plantilla de Turno'}
      >
        <TemplateForm
          template={selectedTemplate}
          onSave={(template) => {
            if (selectedTemplate) {
              setShiftTemplates(prev => prev.map(t => 
                t.id === selectedTemplate.id ? template : t
              ))
              addNotification({ type: 'success', title: 'Éxito', message: 'Plantilla actualizada' })
            } else {
              const newTemplate = { ...template, id: `template-${Date.now()}` }
              setShiftTemplates(prev => [...prev, newTemplate])
              addNotification({ type: 'success', title: 'Éxito', message: 'Nueva plantilla creada' })
            }
            setShowTemplateModal(false)
            setSelectedTemplate(null)
          }}
          onCancel={() => {
            setShowTemplateModal(false)
            setSelectedTemplate(null)
          }}
        />
      </Modal>

      {/* Edit Shift Modal */}
      <Modal
        isOpen={showEditShiftModal}
        onClose={() => {
          setShowEditShiftModal(false)
          setEditingShift(null)
        }}
        title="Editar Turno"
      >
        {editingShift && (
          <EditShiftForm
            shift={editingShift}
            employees={filteredEmployees}
            onSave={handleSaveEditedShift}
            onCancel={() => {
              setShowEditShiftModal(false)
              setEditingShift(null)
            }}
          />
        )}
      </Modal>
    </div>
  )
}

// Shift Creation Form Component with Template Selector
function ShiftCreationForm({ 
  employee, 
  date, 
  templates,
  onSubmit, 
  onCancel 
}: { 
  employee: Employee
  date: Date
  templates: ShiftTemplate[]
  onSubmit: (startTime: string, endTime: string) => void
  onCancel: () => void
}) {
  const [selectedOption, setSelectedOption] = useState<'template' | 'custom'>('template')
  const [selectedTemplate, setSelectedTemplate] = useState<string>('')
  const [customStartTime, setCustomStartTime] = useState('06:00')
  const [customEndTime, setCustomEndTime] = useState('14:00')

  const timeToMinutes = (time: string): number => {
    const [hours, minutes] = time.split(':').map(Number)
    return hours * 60 + minutes
  }

  const calculateDuration = (start: string, end: string): number => {
    const startMinutes = timeToMinutes(start)
    const endMinutes = timeToMinutes(end)
    
    if (endMinutes <= startMinutes) {
      // Crosses midnight
      return ((24 * 60) - startMinutes + endMinutes) / 60
    } else {
      return (endMinutes - startMinutes) / 60
    }
  }

  const getShiftInfo = () => {
    if (selectedOption === 'template' && selectedTemplate) {
      const template = templates.find(t => t.id === selectedTemplate)
      if (template) {
        return {
          startTime: template.startTime,
          endTime: template.endTime,
          duration: template.duration,
          crossesMidnight: template.crossesMidnight,
          type: template.type
        }
      }
    }
    
    const duration = calculateDuration(customStartTime, customEndTime)
    const crossesMidnight = timeToMinutes(customEndTime) <= timeToMinutes(customStartTime)
    
    return {
      startTime: customStartTime,
      endTime: customEndTime,
      duration,
      crossesMidnight,
      type: crossesMidnight ? 'night' : duration > 8 ? 'overtime' : 'regular'
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const shiftInfo = getShiftInfo()
    onSubmit(shiftInfo.startTime, shiftInfo.endTime)
  }

  const shiftInfo = getShiftInfo()
  const isOvertime = shiftInfo.duration > 8

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-primary/5 p-4 rounded-lg">
        <h3 className="font-semibold mb-2">Empleado seleccionado</h3>
        <p className="text-lg font-semibold">{employee.name}</p>
        <p className="text-sm text-neutral-medium-gray">{employee.position}</p>
        <p className="text-sm text-neutral-medium-gray">
          {date.toLocaleDateString('es-CO', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </p>
      </div>

      {/* Option selector */}
      <div className="space-y-3">
        <h4 className="font-medium text-neutral-dark-gray">Selecciona el tipo de turno</h4>
        
        <div className="space-y-3">
          {/* Template option */}
          <label className="flex items-start space-x-3 cursor-pointer">
            <input
              type="radio"
              name="shiftOption"
              value="template"
              checked={selectedOption === 'template'}
              onChange={() => setSelectedOption('template')}
              className="mt-1"
            />
            <div className="flex-1">
              <div className="font-medium">Usar plantilla predefinida</div>
              <div className="text-sm text-neutral-medium-gray">
                Selecciona una plantilla de turno existente
              </div>
            </div>
          </label>

          {/* Template selector */}
          {selectedOption === 'template' && (
            <div className="ml-6 space-y-2">
              {templates.map(template => (
                <label key={template.id} className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    name="template"
                    value={template.id}
                    checked={selectedTemplate === template.id}
                    onChange={() => setSelectedTemplate(template.id)}
                  />
                  <div 
                    className="flex-1 p-3 rounded-lg border"
                    style={{ 
                      backgroundColor: template.color + '15',
                      borderColor: template.color + '40'
                    }}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-semibold text-sm">{template.name}</h3>
                      <span className="text-xs px-2 py-1 bg-white rounded">
                        {template.duration}h
                      </span>
                    </div>
                    <div className="text-xs text-neutral-medium-gray">
                      {template.startTime} - {template.endTime}
                      {template.crossesMidnight && ' (+1 día)'}
                    </div>
                    {template.description && (
                      <div className="text-xs text-neutral-dark-gray mt-1">
                        {template.description}
                      </div>
                    )}
                  </div>
                </label>
              ))}
            </div>
          )}

          {/* Custom option */}
          <label className="flex items-start space-x-3 cursor-pointer">
            <input
              type="radio"
              name="shiftOption"
              value="custom"
              checked={selectedOption === 'custom'}
              onChange={() => setSelectedOption('custom')}
              className="mt-1"
            />
            <div className="flex-1">
              <div className="font-medium">Horario personalizado</div>
              <div className="text-sm text-neutral-medium-gray">
                Define las horas de inicio y fin manualmente
              </div>
            </div>
          </label>

          {/* Custom time inputs */}
          {selectedOption === 'custom' && (
            <div className="ml-6 grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-dark-gray mb-2">
                  Hora de inicio
                </label>
                <input
                  type="time"
                  value={customStartTime}
                  onChange={(e) => setCustomStartTime(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-light-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-neutral-dark-gray mb-2">
                  Hora de fin
                </label>
                <input
                  type="time"
                  value={customEndTime}
                  onChange={(e) => setCustomEndTime(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-light-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Shift preview */}
      <div className="bg-neutral-off-white p-4 rounded-lg">
        <h4 className="font-semibold mb-3">Vista previa del turno</h4>
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-neutral-medium-gray">Duración</p>
            <p className="font-semibold text-lg">{shiftInfo.duration.toFixed(1)} horas</p>
          </div>
          <div>
            <p className="text-neutral-medium-gray">Tipo</p>
            <p className="font-semibold">
              {shiftInfo.crossesMidnight && <span className="text-semantic-warning">Nocturno</span>}
              {isOvertime && <span className="text-semantic-error">Horas extras</span>}
              {!shiftInfo.crossesMidnight && !isOvertime && <span className="text-semantic-success">Regular</span>}
            </p>
          </div>
          <div>
            <p className="text-neutral-medium-gray">Recargo</p>
            <p className="font-semibold">
              {shiftInfo.crossesMidnight && '+35%'}
              {isOvertime && !shiftInfo.crossesMidnight && '+25%'}
              {!shiftInfo.crossesMidnight && !isOvertime && 'Normal'}
            </p>
          </div>
        </div>
        
        {shiftInfo.crossesMidnight && (
          <div className="mt-3 p-2 bg-semantic-warning/10 border border-semantic-warning/20 rounded">
            <p className="text-sm text-semantic-warning">
              ⚠️ Este turno cruza medianoche y terminará el día siguiente
            </p>
          </div>
        )}
        
        {isOvertime && (
          <div className="mt-3 p-2 bg-semantic-error/10 border border-semantic-error/20 rounded">
            <p className="text-sm text-semantic-error">
              ⚠️ Este turno excede las 8 horas legales y se cobrarán horas extras
            </p>
          </div>
        )}
      </div>
      
      <div className="flex justify-end space-x-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancelar
        </Button>
        <Button 
          type="submit"
          disabled={selectedOption === 'template' && !selectedTemplate}
        >
          Crear Turno
        </Button>
      </div>
    </form>
  )
}

// Custom Time Form Component
function CustomTimeForm({ 
  employee, 
  date, 
  initialTime, 
  onSubmit, 
  onCancel 
}: { 
  employee: Employee
  date: Date
  initialTime: string
  onSubmit: (startTime: string, endTime: string) => void
  onCancel: () => void
}) {
  const [startTime, setStartTime] = useState(initialTime)
  const [endTime, setEndTime] = useState('18:00')
  const [duration, setDuration] = useState(8)

  const timeToMinutes = (time: string): number => {
    const [hours, minutes] = time.split(':').map(Number)
    return hours * 60 + minutes
  }

  const calculateDuration = (start: string, end: string): number => {
    const startMinutes = timeToMinutes(start)
    const endMinutes = timeToMinutes(end)
    
    if (endMinutes <= startMinutes) {
      // Crosses midnight
      return ((24 * 60) - startMinutes + endMinutes) / 60
    } else {
      return (endMinutes - startMinutes) / 60
    }
  }

  const handleStartTimeChange = (newStartTime: string) => {
    setStartTime(newStartTime)
    setDuration(calculateDuration(newStartTime, endTime))
  }

  const handleEndTimeChange = (newEndTime: string) => {
    setEndTime(newEndTime)
    setDuration(calculateDuration(startTime, newEndTime))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(startTime, endTime)
  }

  const crossesMidnight = timeToMinutes(endTime) <= timeToMinutes(startTime)
  const isOvertime = duration > 8

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="bg-primary/5 p-4 rounded-lg">
        <h3 className="font-semibold mb-2">Empleado seleccionado</h3>
        <p className="text-lg font-semibold">{employee.name}</p>
        <p className="text-sm text-neutral-medium-gray">{employee.position}</p>
        <p className="text-sm text-neutral-medium-gray">
          {date.toLocaleDateString('es-CO', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </p>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-neutral-dark-gray mb-2">
            Hora de inicio
          </label>
          <input
            type="time"
            value={startTime}
            onChange={(e) => handleStartTimeChange(e.target.value)}
            className="w-full px-3 py-2 border border-neutral-light-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-neutral-dark-gray mb-2">
            Hora de fin
          </label>
          <input
            type="time"
            value={endTime}
            onChange={(e) => handleEndTimeChange(e.target.value)}
            className="w-full px-3 py-2 border border-neutral-light-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            required
          />
        </div>
      </div>
      
      <div className="bg-neutral-off-white p-4 rounded-lg">
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-neutral-medium-gray">Duración</p>
            <p className="font-semibold text-lg">{duration.toFixed(1)} horas</p>
          </div>
          <div>
            <p className="text-neutral-medium-gray">Tipo</p>
            <p className="font-semibold">
              {crossesMidnight && <span className="text-semantic-warning">Nocturno</span>}
              {isOvertime && <span className="text-semantic-error">Horas extras</span>}
              {!crossesMidnight && !isOvertime && <span className="text-semantic-success">Regular</span>}
            </p>
          </div>
          <div>
            <p className="text-neutral-medium-gray">Recargo</p>
            <p className="font-semibold">
              {crossesMidnight && '+35%'}
              {isOvertime && !crossesMidnight && '+25%'}
              {!crossesMidnight && !isOvertime && 'Normal'}
            </p>
          </div>
        </div>
        
        {crossesMidnight && (
          <div className="mt-3 p-2 bg-semantic-warning/10 border border-semantic-warning/20 rounded">
            <p className="text-sm text-semantic-warning">
              ⚠️ Este turno cruza medianoche y terminará el día siguiente
            </p>
          </div>
        )}
        
        {isOvertime && (
          <div className="mt-3 p-2 bg-semantic-error/10 border border-semantic-error/20 rounded">
            <p className="text-sm text-semantic-error">
              ⚠️ Este turno excede las 8 horas legales y se cobrarán horas extras
            </p>
          </div>
        )}
      </div>
      
      <div className="flex justify-end space-x-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit">
          Crear Turno
        </Button>
      </div>
    </form>
  )
}

// Template Form Component
function TemplateForm({ 
  template, 
  onSave, 
  onCancel 
}: { 
  template: ShiftTemplate | null
  onSave: (template: ShiftTemplate) => void
  onCancel: () => void
}) {
  const [formData, setFormData] = useState<ShiftTemplate>(
    template || {
      id: '',
      name: '',
      startTime: '06:00',
      endTime: '14:00',
      duration: 8,
      type: 'regular',
      color: '#10B981',
      description: '',
      crossesMidnight: false
    }
  )

  const timeToMinutes = (time: string): number => {
    const [hours, minutes] = time.split(':').map(Number)
    return hours * 60 + minutes
  }

  const calculateDuration = (start: string, end: string, crossesMidnight: boolean): number => {
    const startMinutes = timeToMinutes(start)
    const endMinutes = timeToMinutes(end)
    
    if (crossesMidnight) {
      return ((24 * 60) - startMinutes + endMinutes) / 60
    } else {
      return (endMinutes - startMinutes) / 60
    }
  }

  const handleTimeChange = (field: 'startTime' | 'endTime', value: string) => {
    const newData = { ...formData, [field]: value }
    const crossesMidnight = timeToMinutes(newData.endTime) <= timeToMinutes(newData.startTime)
    const duration = calculateDuration(newData.startTime, newData.endTime, crossesMidnight)
    
    setFormData({
      ...newData,
      duration,
      crossesMidnight,
      type: crossesMidnight ? 'night' : duration > 8 ? 'overtime' : 'regular'
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
  }

  const presetColors = [
    '#10B981', '#3B82F6', '#8B5CF6', '#F59E0B', 
    '#EF4444', '#84CC16', '#06B6D4', '#EC4899'
  ]

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-neutral-dark-gray mb-1">
          Nombre de la plantilla
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({...formData, name: e.target.value})}
          placeholder="Ej: Turno Mañana"
          className="w-full px-3 py-2 border border-neutral-light-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          required
        />
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-neutral-dark-gray mb-1">
            Hora de inicio
          </label>
          <input
            type="time"
            value={formData.startTime}
            onChange={(e) => handleTimeChange('startTime', e.target.value)}
            className="w-full px-3 py-2 border border-neutral-light-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-neutral-dark-gray mb-1">
            Hora de fin
          </label>
          <input
            type="time"
            value={formData.endTime}
            onChange={(e) => handleTimeChange('endTime', e.target.value)}
            className="w-full px-3 py-2 border border-neutral-light-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            required
          />
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-neutral-dark-gray mb-1">
          Descripción
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({...formData, description: e.target.value})}
          placeholder="Descripción de la plantilla"
          className="w-full px-3 py-2 border border-neutral-light-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          rows={2}
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-neutral-dark-gray mb-2">
          Color
        </label>
        <div className="flex gap-2">
          {presetColors.map(color => (
            <button
              key={color}
              type="button"
              onClick={() => setFormData({...formData, color})}
              className={`w-8 h-8 rounded border-2 ${
                formData.color === color ? 'border-neutral-black' : 'border-neutral-light-gray'
              }`}
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
      </div>
      
      <div className="bg-neutral-off-white p-4 rounded-lg">
        <h4 className="font-semibold mb-2">Vista previa</h4>
        <div
          className="p-3 rounded-lg border"
          style={{ 
            backgroundColor: formData.color + '15',
            borderColor: formData.color + '40'
          }}
        >
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-semibold text-sm">{formData.name || 'Nombre de plantilla'}</h3>
            <span className="text-xs px-2 py-1 bg-white rounded">
              {formData.duration.toFixed(1)}h
            </span>
          </div>
          <div className="text-xs text-neutral-medium-gray">
            {formData.startTime} - {formData.endTime}
            {formData.crossesMidnight && ' (+1 día)'}
          </div>
          {formData.description && (
            <div className="text-xs text-neutral-dark-gray mt-1">
              {formData.description}
            </div>
          )}
        </div>
        
        <div className="mt-3 text-sm space-y-1">
          <p><span className="text-neutral-medium-gray">Duración:</span> {formData.duration.toFixed(1)} horas</p>
          <p><span className="text-neutral-medium-gray">Tipo:</span> {
            formData.type === 'night' ? 'Nocturno (+35%)' :
            formData.type === 'overtime' ? 'Horas extras (+25%)' :
            'Regular'
          }</p>
          {formData.crossesMidnight && (
            <p className="text-semantic-warning">⚠️ Cruza medianoche</p>
          )}
        </div>
      </div>
      
      <div className="flex justify-end space-x-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit">
          {template ? 'Actualizar' : 'Crear'} Plantilla
        </Button>
      </div>
    </form>
  )
}

// Edit Shift Form Component
function EditShiftForm({ 
  shift, 
  employees,
  onSave, 
  onCancel 
}: { 
  shift: ScheduleShift
  employees: Employee[]
  onSave: (shift: ScheduleShift) => void
  onCancel: () => void
}) {
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(shift.employeeId)
  const [startTime, setStartTime] = useState(shift.startTime)
  const [endTime, setEndTime] = useState(shift.endTime)
  const [notes, setNotes] = useState(shift.notes || '')

  const timeToMinutes = (time: string): number => {
    const [hours, minutes] = time.split(':').map(Number)
    return hours * 60 + minutes
  }

  const calculateDuration = (start: string, end: string): number => {
    const startMinutes = timeToMinutes(start)
    const endMinutes = timeToMinutes(end)
    
    if (endMinutes <= startMinutes) {
      return ((24 * 60) - startMinutes + endMinutes) / 60
    }
    
    return (endMinutes - startMinutes) / 60
  }

  const detectShiftType = (startTime: string, endTime: string, duration: number, date: Date): ScheduleShift['type'] => {
    const isNightShift = endTime <= startTime
    const isOvertime = duration > 8
    const shiftDate = new Date(date)
    const isHoliday = isColombianHoliday(shiftDate) || isSunday(shiftDate)
    
    if (isHoliday) return 'holiday'
    if (isNightShift) return 'night'
    if (isOvertime) return 'overtime'
    return 'regular'
  }

  const calculateShiftCost = (hours: number, hourlyRate: number, type: ScheduleShift['type'], date: Date) => {
    let multiplier = 1
    
    switch (type) {
      case 'night':
        multiplier = 1.35
        break
      case 'overtime':
        multiplier = 1.25
        break
      case 'holiday':
        multiplier = 1.75
        break
      default:
        multiplier = 1
    }
    
    return hours * hourlyRate * multiplier
  }

  const getColombianHolidays = (year: number): Date[] => {
    const holidays: Date[] = []
    
    holidays.push(new Date(year, 0, 1))
    holidays.push(new Date(year, 4, 1))
    holidays.push(new Date(year, 6, 20))
    holidays.push(new Date(year, 7, 7))
    holidays.push(new Date(year, 11, 8))
    holidays.push(new Date(year, 11, 25))
    
    const movableHolidays = [
      new Date(year, 0, 6),
      new Date(year, 2, 19),
      new Date(year, 5, 29),
      new Date(year, 7, 15),
      new Date(year, 9, 12),
      new Date(year, 10, 1),
      new Date(year, 10, 11),
    ]
    
    movableHolidays.forEach(holiday => {
      const dayOfWeek = holiday.getDay()
      if (dayOfWeek !== 1) {
        const daysToAdd = dayOfWeek === 0 ? 1 : 8 - dayOfWeek
        holiday.setDate(holiday.getDate() + daysToAdd)
      }
      holidays.push(holiday)
    })
    
    const easter = getEasterDate(year)
    holidays.push(new Date(easter.getTime() - 7 * 24 * 60 * 60 * 1000))
    holidays.push(new Date(easter.getTime() - 3 * 24 * 60 * 60 * 1000))
    holidays.push(new Date(easter.getTime() - 2 * 24 * 60 * 60 * 1000))
    holidays.push(new Date(easter.getTime() + 39 * 24 * 60 * 60 * 1000))
    holidays.push(new Date(easter.getTime() + 60 * 24 * 60 * 60 * 1000))
    holidays.push(new Date(easter.getTime() + 68 * 24 * 60 * 60 * 1000))
    
    return holidays
  }

  const getEasterDate = (year: number): Date => {
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

  const isColombianHoliday = (date: Date): boolean => {
    const holidays = getColombianHolidays(date.getFullYear())
    return holidays.some(holiday => 
      holiday.getDate() === date.getDate() && 
      holiday.getMonth() === date.getMonth() && 
      holiday.getFullYear() === date.getFullYear()
    )
  }

  const isSunday = (date: Date): boolean => {
    return date.getDay() === 0
  }

  const duration = calculateDuration(startTime, endTime)
  const crossesMidnight = endTime <= startTime
  const isOvertime = duration > 8
  const shiftDate = new Date(shift.date)
  const selectedEmployee = employees.find(emp => emp.id === selectedEmployeeId)
  const shiftType = detectShiftType(startTime, endTime, duration, shiftDate)
  const shiftCost = selectedEmployee ? calculateShiftCost(duration, selectedEmployee.hourlyRate, shiftType, shiftDate) : 0

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedEmployee) return

    const updatedShift: ScheduleShift = {
      ...shift,
      employeeId: selectedEmployeeId,
      employeeName: selectedEmployee.name,
      position: selectedEmployee.position,
      startTime,
      endTime,
      duration,
      type: shiftType,
      cost: shiftCost,
      notes: notes || undefined,
      crossesMidnight
    }

    onSave(updatedShift)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-neutral-dark-gray mb-2">
          Empleado
        </label>
        <select
          value={selectedEmployeeId}
          onChange={(e) => setSelectedEmployeeId(e.target.value)}
          className="w-full px-3 py-2 border border-neutral-light-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          required
        >
          {employees.map(employee => (
            <option key={employee.id} value={employee.id}>
              {employee.name} - {employee.position}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-neutral-dark-gray mb-2">
            Hora de inicio
          </label>
          <input
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className="w-full px-3 py-2 border border-neutral-light-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-neutral-dark-gray mb-2">
            Hora de fin
          </label>
          <input
            type="time"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            className="w-full px-3 py-2 border border-neutral-light-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            required
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-neutral-dark-gray mb-2">
          Notas (opcional)
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Instrucciones especiales o comentarios..."
          className="w-full px-3 py-2 border border-neutral-light-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          rows={3}
        />
      </div>
      
      <div className="bg-neutral-off-white p-4 rounded-lg">
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-neutral-medium-gray">Duración</p>
            <p className="font-semibold text-lg">{duration.toFixed(1)} horas</p>
          </div>
          <div>
            <p className="text-neutral-medium-gray">Tipo</p>
            <p className="font-semibold">
              {shiftType === 'holiday' && <span className="text-red-600">Festivo (+75%)</span>}
              {shiftType === 'night' && <span className="text-purple-600">Nocturno (+35%)</span>}
              {shiftType === 'overtime' && <span className="text-orange-600">Horas extras (+25%)</span>}
              {shiftType === 'regular' && <span className="text-green-600">Regular</span>}
            </p>
          </div>
          <div>
            <p className="text-neutral-medium-gray">Costo</p>
            <p className="font-semibold text-lg">
              {new Intl.NumberFormat('es-CO', {
                style: 'currency',
                currency: 'COP',
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              }).format(shiftCost)}
            </p>
          </div>
        </div>
        
        {crossesMidnight && (
          <div className="mt-3 p-2 bg-semantic-warning/10 border border-semantic-warning/20 rounded">
            <p className="text-sm text-semantic-warning">
              ⚠️ Este turno cruza medianoche y terminará el día siguiente
            </p>
          </div>
        )}
        
        {isOvertime && (
          <div className="mt-3 p-2 bg-semantic-error/10 border border-semantic-error/20 rounded">
            <p className="text-sm text-semantic-error">
              ⚠️ Este turno excede las 8 horas legales y se cobrarán horas extras
            </p>
          </div>
        )}

        {shiftType === 'holiday' && (
          <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded">
            <p className="text-sm text-red-700">
              🎉 Turno en día festivo - Recargo del 75% aplicado
            </p>
          </div>
        )}
      </div>
      
      <div className="flex justify-end space-x-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit">
          Guardar Cambios
        </Button>
      </div>
    </form>
  )
}