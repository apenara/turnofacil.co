'use client'

import React, { useState } from 'react'
import { Card, Button, Input, Modal, Tag } from '@/components/ui'
import { useNotifications } from '@/components/shared/NotificationSystem'

interface Employee {
  id: string
  name: string
  position: string
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

interface ScheduleShift {
  id: string
  employeeId: string
  employeeName: string
  position: string
  date: string
  startTime: string
  endTime: string
  duration: number
  type: 'regular' | 'overtime' | 'night' | 'holiday'
  status: 'draft' | 'confirmed'
  cost: number
  notes?: string
}

interface ValidationError {
  type: 'overtime' | 'availability' | 'overlap' | 'understaffed'
  message: string
  severity: 'error' | 'warning'
  shifts?: string[]
}

const mockEmployees: Employee[] = [
  {
    id: '1',
    name: 'Carlos López',
    position: 'Cocinero',
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
  {
    id: '3',
    name: 'Pedro García',
    position: 'Cajero',
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
  }
]

const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
const fullDayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']

export default function ScheduleCreatorPage() {
  const [selectedWeek, setSelectedWeek] = useState('2024-01-15') // Monday of the week
  const [employees] = useState<Employee[]>(mockEmployees)
  const [shifts, setShifts] = useState<ScheduleShift[]>([])
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)
  const [selectedDate, setSelectedDate] = useState<string>('')
  const [isShiftModalOpen, setIsShiftModalOpen] = useState(false)
  const [shiftForm, setShiftForm] = useState({
    startTime: '08:00',
    endTime: '16:00',
    type: 'regular' as ScheduleShift['type'],
    notes: ''
  })
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([])
  const [draggedEmployee, setDraggedEmployee] = useState<Employee | null>(null)

  const { addNotification } = useNotifications()

  const getWeekDates = (mondayDate: string) => {
    const monday = new Date(mondayDate)
    const dates = []
    for (let i = 0; i < 7; i++) {
      const date = new Date(monday)
      date.setDate(monday.getDate() + i)
      dates.push(date.toISOString().split('T')[0])
    }
    return dates
  }

  const weekDates = getWeekDates(selectedWeek)

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const calculateShiftCost = (employee: Employee, startTime: string, endTime: string, date: string) => {
    const start = new Date(`${date}T${startTime}`)
    const end = new Date(`${date}T${endTime}`)
    const duration = (end.getTime() - start.getTime()) / (1000 * 60 * 60)
    
    let cost = duration * employee.hourlyRate
    
    // Night shift bonus (21:00 - 06:00)
    const isNightShift = parseInt(startTime.split(':')[0]) >= 21 || parseInt(endTime.split(':')[0]) <= 6
    if (isNightShift) {
      cost *= 1.35 // 35% night bonus
    }
    
    // Weekend bonus
    const dayOfWeek = new Date(date).getDay()
    if (dayOfWeek === 0) { // Sunday
      cost *= 1.75 // 75% Sunday bonus
    }
    
    return Math.round(cost)
  }

  const validateSchedule = (newShifts: ScheduleShift[]) => {
    const errors: ValidationError[] = []
    
    // Check for employee availability and overlaps
    newShifts.forEach(shift => {
      const employee = employees.find(e => e.id === shift.employeeId)
      if (!employee) return
      
      const shiftDate = new Date(shift.date)
      const dayOfWeek = shiftDate.getDay()
      const availability = employee.availability.find(a => a.day === dayOfWeek)
      
      // Check availability
      if (!availability?.available) {
        errors.push({
          type: 'availability',
          message: `${employee.name} no está disponible los ${fullDayNames[dayOfWeek]}`,
          severity: 'error',
          shifts: [shift.id]
        })
      }
      
      // Check time conflicts
      const employeeShifts = newShifts.filter(s => s.employeeId === shift.employeeId && s.date === shift.date)
      if (employeeShifts.length > 1) {
        errors.push({
          type: 'overlap',
          message: `${employee.name} tiene turnos superpuestos el ${shiftDate.toLocaleDateString('es-CO')}`,
          severity: 'error',
          shifts: employeeShifts.map(s => s.id)
        })
      }
    })
    
    // Check weekly hours
    employees.forEach(employee => {
      const employeeWeeklyShifts = newShifts.filter(s => s.employeeId === employee.id)
      const totalHours = employeeWeeklyShifts.reduce((sum, s) => sum + s.duration, 0)
      
      if (totalHours > employee.maxWeeklyHours) {
        errors.push({
          type: 'overtime',
          message: `${employee.name} excede las horas máximas (${totalHours}h / ${employee.maxWeeklyHours}h)`,
          severity: 'warning',
          shifts: employeeWeeklyShifts.map(s => s.id)
        })
      }
    })
    
    setValidationErrors(errors)
    return errors
  }

  const addShift = () => {
    if (!selectedEmployee || !selectedDate) return
    
    const start = new Date(`${selectedDate}T${shiftForm.startTime}`)
    const end = new Date(`${selectedDate}T${shiftForm.endTime}`)
    const duration = (end.getTime() - start.getTime()) / (1000 * 60 * 60)
    
    const newShift: ScheduleShift = {
      id: Date.now().toString(),
      employeeId: selectedEmployee.id,
      employeeName: selectedEmployee.name,
      position: selectedEmployee.position,
      date: selectedDate,
      startTime: shiftForm.startTime,
      endTime: shiftForm.endTime,
      duration,
      type: shiftForm.type,
      status: 'draft',
      cost: calculateShiftCost(selectedEmployee, shiftForm.startTime, shiftForm.endTime, selectedDate),
      notes: shiftForm.notes
    }
    
    const updatedShifts = [...shifts, newShift]
    setShifts(updatedShifts)
    validateSchedule(updatedShifts)
    
    addNotification({
      type: 'success',
      title: 'Turno agregado',
      message: `Turno creado para ${selectedEmployee.name}`
    })
    
    setIsShiftModalOpen(false)
    setSelectedEmployee(null)
    setSelectedDate('')
  }

  const removeShift = (shiftId: string) => {
    const updatedShifts = shifts.filter(s => s.id !== shiftId)
    setShifts(updatedShifts)
    validateSchedule(updatedShifts)
  }

  const onDragStart = (e: React.DragEvent, employee: Employee) => {
    setDraggedEmployee(employee)
  }

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const onDrop = (e: React.DragEvent, date: string) => {
    e.preventDefault()
    if (draggedEmployee) {
      setSelectedEmployee(draggedEmployee)
      setSelectedDate(date)
      setIsShiftModalOpen(true)
      setDraggedEmployee(null)
    }
  }

  const getShiftsForDate = (date: string) => {
    return shifts.filter(s => s.date === date)
  }

  const getEmployeeWeeklyHours = (employeeId: string) => {
    return shifts.filter(s => s.employeeId === employeeId).reduce((sum, s) => sum + s.duration, 0)
  }

  const getTotalWeeklyCost = () => {
    return shifts.reduce((sum, s) => sum + s.cost, 0)
  }

  const submitSchedule = () => {
    const errors = validateSchedule(shifts)
    const hasErrors = errors.some(e => e.severity === 'error')
    
    if (hasErrors) {
      addNotification({
        type: 'error',
        title: 'No se puede enviar',
        message: 'Hay errores que deben corregirse antes de enviar el horario'
      })
      return
    }
    
    // Here you would typically send to backend
    addNotification({
      type: 'success',
      title: 'Horario enviado',
      message: 'El horario ha sido enviado para aprobación del administrador'
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Creador de Horarios</h1>
          <p className="text-gray-600">Planifica y gestiona los horarios semanales de tu equipo</p>
        </div>
        <div className="flex space-x-3">
          <Button variant="secondary" onClick={() => setShifts([])}>
            Limpiar Todo
          </Button>
          <Button 
            onClick={submitSchedule}
            disabled={shifts.length === 0}
          >
            Enviar para Aprobación
          </Button>
        </div>
      </div>

      {/* Week Selector and Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <div className="p-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Semana a planificar
            </label>
            <input
              type="date"
              value={selectedWeek}
              onChange={(e) => setSelectedWeek(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              {new Date(selectedWeek).toLocaleDateString('es-CO')} - {new Date(weekDates[6]).toLocaleDateString('es-CO')}
            </p>
          </div>
        </Card>

        <Card>
          <div className="p-4 text-center">
            <div className="text-2xl font-bold text-gray-900">{shifts.length}</div>
            <div className="text-sm text-gray-600">Turnos Programados</div>
            <div className="text-xs text-gray-500 mt-1">
              {shifts.reduce((sum, s) => sum + s.duration, 0)} horas total
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-4 text-center">
            <div className="text-xl font-bold text-gray-900">{formatCurrency(getTotalWeeklyCost())}</div>
            <div className="text-sm text-gray-600">Costo Estimado</div>
            <div className="text-xs text-gray-500 mt-1">
              Incluye recargos y bonificaciones
            </div>
          </div>
        </Card>
      </div>

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <Card>
          <div className="p-4">
            <h3 className="text-sm font-medium text-gray-900 mb-3">Validaciones del Horario</h3>
            <div className="space-y-2">
              {validationErrors.map((error, index) => (
                <div 
                  key={index}
                  className={`p-3 rounded-md ${
                    error.severity === 'error' 
                      ? 'bg-red-50 border border-red-200' 
                      : 'bg-yellow-50 border border-yellow-200'
                  }`}
                >
                  <div className="flex">
                    <div className="flex-shrink-0">
                      {error.severity === 'error' ? (
                        <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                    <div className="ml-3">
                      <p className={`text-sm ${error.severity === 'error' ? 'text-red-800' : 'text-yellow-800'}`}>
                        {error.message}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Schedule Grid */}
      <Card>
        <div className="p-6">
          <div className="grid grid-cols-8 gap-4">
            {/* Header Row */}
            <div className="font-medium text-gray-700">Empleado</div>
            {weekDates.map((date, index) => (
              <div key={date} className="text-center">
                <div className="font-medium text-gray-700">{dayNames[index]}</div>
                <div className="text-xs text-gray-500">
                  {new Date(date).toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit' })}
                </div>
              </div>
            ))}

            {/* Employee Rows */}
            {employees.map(employee => (
              <React.Fragment key={employee.id}>
                <div 
                  className="p-3 bg-gray-50 rounded-lg cursor-move"
                  draggable
                  onDragStart={(e) => onDragStart(e, employee)}
                >
                  <div className="font-medium text-sm">{employee.name}</div>
                  <div className="text-xs text-gray-500">{employee.position}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {getEmployeeWeeklyHours(employee.id)}h / {employee.maxWeeklyHours}h
                  </div>
                </div>
                
                {weekDates.map(date => {
                  const dayShifts = getShiftsForDate(date).filter(s => s.employeeId === employee.id)
                  const dayOfWeek = new Date(date).getDay()
                  const availability = employee.availability.find(a => a.day === dayOfWeek)
                  
                  return (
                    <div
                      key={`${employee.id}-${date}`}
                      className={`min-h-20 p-2 border-2 border-dashed rounded-lg transition-colors ${
                        availability?.available 
                          ? 'border-gray-200 hover:border-primary-300 hover:bg-primary-50' 
                          : 'border-gray-100 bg-gray-50'
                      }`}
                      onDragOver={onDragOver}
                      onDrop={(e) => availability?.available && onDrop(e, date)}
                      onClick={() => {
                        if (availability?.available) {
                          setSelectedEmployee(employee)
                          setSelectedDate(date)
                          setIsShiftModalOpen(true)
                        }
                      }}
                    >
                      {!availability?.available ? (
                        <div className="text-xs text-gray-400 text-center">No disponible</div>
                      ) : (
                        <div className="space-y-1">
                          {dayShifts.map(shift => (
                            <div
                              key={shift.id}
                              className={`p-2 rounded text-xs ${
                                shift.type === 'regular' ? 'bg-blue-100 text-blue-800' :
                                shift.type === 'overtime' ? 'bg-yellow-100 text-yellow-800' :
                                shift.type === 'night' ? 'bg-purple-100 text-purple-800' :
                                'bg-red-100 text-red-800'
                              }`}
                            >
                              <div className="font-medium">
                                {shift.startTime} - {shift.endTime}
                              </div>
                              <div className="flex justify-between items-center mt-1">
                                <span>{shift.duration}h</span>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    removeShift(shift.id)
                                  }}
                                  className="text-red-600 hover:text-red-800"
                                >
                                  ×
                                </button>
                              </div>
                            </div>
                          ))}
                          {dayShifts.length === 0 && (
                            <div className="text-xs text-gray-400 text-center py-2">
                              Arrastra aquí o haz clic
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </React.Fragment>
            ))}
          </div>
        </div>
      </Card>

      {/* Shift Modal */}
      <Modal
        isOpen={isShiftModalOpen}
        onClose={() => setIsShiftModalOpen(false)}
        title="Programar Turno"
        size="md"
      >
        {selectedEmployee && selectedDate && (
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-600">
                <strong>Empleado:</strong> {selectedEmployee.name} ({selectedEmployee.position})
              </p>
              <p className="text-sm text-gray-600">
                <strong>Fecha:</strong> {new Date(selectedDate).toLocaleDateString('es-CO', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Hora de inicio
                </label>
                <input
                  type="time"
                  value={shiftForm.startTime}
                  onChange={(e) => setShiftForm({ ...shiftForm, startTime: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Hora de fin
                </label>
                <input
                  type="time"
                  value={shiftForm.endTime}
                  onChange={(e) => setShiftForm({ ...shiftForm, endTime: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipo de turno
              </label>
              <select
                value={shiftForm.type}
                onChange={(e) => setShiftForm({ ...shiftForm, type: e.target.value as ScheduleShift['type'] })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="regular">Regular</option>
                <option value="overtime">Hora Extra</option>
                <option value="night">Nocturno</option>
                <option value="holiday">Festivo</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notas (opcional)
              </label>
              <textarea
                value={shiftForm.notes}
                onChange={(e) => setShiftForm({ ...shiftForm, notes: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                rows={2}
                placeholder="Notas adicionales sobre el turno..."
              />
            </div>

            {/* Cost Preview */}
            <div className="bg-gray-50 p-3 rounded-md">
              <div className="text-sm font-medium text-gray-700">
                Costo estimado: {formatCurrency(
                  calculateShiftCost(
                    selectedEmployee, 
                    shiftForm.startTime, 
                    shiftForm.endTime, 
                    selectedDate
                  )
                )}
              </div>
              <div className="text-xs text-gray-500">
                Duración: {((new Date(`${selectedDate}T${shiftForm.endTime}`).getTime() - 
                           new Date(`${selectedDate}T${shiftForm.startTime}`).getTime()) / 
                           (1000 * 60 * 60)).toFixed(1)} horas
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <Button variant="secondary" onClick={() => setIsShiftModalOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={addShift}>
                Programar Turno
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}