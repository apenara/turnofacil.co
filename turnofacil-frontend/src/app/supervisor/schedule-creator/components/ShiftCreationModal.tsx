/**
 * Componente ShiftCreationModal
 * @fileoverview Modal para crear y editar turnos con validación en tiempo real
 */

'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import {
  XMarkIcon,
  ClockIcon,
  CurrencyDollarIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  UserIcon,
  CalendarIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline'
import { 
  ScheduleShift, 
  Employee, 
  ShiftTemplate, 
  CreateShiftData,
  CreateShiftFullData,
  UpdateShiftData,
  UpdateShiftFullData,
  ShiftValidationData 
} from '../types'
import { 
  calculateHoursBetween,
  calculateShiftCost,
  determineShiftType,
  crossesMidnight,
  formatDuration,
  getShiftTypeColor,
  isColombianHoliday,
  isSunday,
  dateToISOString 
} from '../utils'

/**
 * Props del componente ShiftCreationModal
 */
export interface ShiftCreationModalProps {
  /**
   * Indica si el modal está abierto
   */
  isOpen: boolean
  
  /**
   * Función para cerrar el modal
   */
  onClose: () => void
  
  /**
   * Turno a editar (si es null, se crea uno nuevo)
   */
  shift?: ScheduleShift | null
  
  /**
   * Lista de empleados disponibles
   */
  employees: Employee[]
  
  /**
   * Plantillas de turnos disponibles
   */
  templates: ShiftTemplate[]
  
  /**
   * Función para crear un nuevo turno
   */
  onCreateShift: (data: CreateShiftFullData) => Promise<ScheduleShift>
  
  /**
   * Función para actualizar un turno existente
   */
  onUpdateShift: (data: UpdateShiftFullData) => Promise<ScheduleShift>
  
  /**
   * Empleado preseleccionado
   */
  preselectedEmployeeId?: string
  
  /**
   * Fecha preseleccionada
   */
  preselectedDate?: string
  
  /**
   * Hora de inicio preseleccionada
   */
  preselectedStartTime?: string
  
  /**
   * Función de validación personalizada
   */
  onValidate?: (data: ShiftValidationData) => string[]
  
  /**
   * Indica si está guardando
   */
  isSaving?: boolean
}

/**
 * Modal para crear/editar turnos
 */
export function ShiftCreationModal({
  isOpen,
  onClose,
  shift,
  employees,
  templates,
  onCreateShift,
  onUpdateShift,
  preselectedEmployeeId,
  preselectedDate,
  preselectedStartTime,
  onValidate,
  isSaving = false
}: ShiftCreationModalProps) {
  // Estado del formulario
  const [employeeId, setEmployeeId] = useState('')
  const [date, setDate] = useState('')
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [templateId, setTemplateId] = useState('')
  const [notes, setNotes] = useState('')
  const [errors, setErrors] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Reset del formulario cuando cambia el shift o se abre el modal
  useEffect(() => {
    if (isOpen) {
      if (shift) {
        // Modo edición
        setEmployeeId(shift.employeeId)
        setDate(shift.date)
        setStartTime(shift.startTime)
        setEndTime(shift.endTime)
        setTemplateId(shift.templateId || '')
        setNotes(shift.notes || '')
      } else {
        // Modo creación
        setEmployeeId(preselectedEmployeeId || '')
        setDate(preselectedDate || dateToISOString(new Date()))
        setStartTime(preselectedStartTime || '09:00')
        setEndTime('17:00')
        setTemplateId('')
        setNotes('')
      }
      setErrors([])
    }
  }, [isOpen, shift, preselectedEmployeeId, preselectedDate, preselectedStartTime])

  // Empleado seleccionado
  const selectedEmployee = useMemo(() => {
    return employees.find(emp => emp.id === employeeId)
  }, [employees, employeeId])

  // Plantilla seleccionada
  const selectedTemplate = useMemo(() => {
    return templates.find(tpl => tpl.id === templateId)
  }, [templates, templateId])

  // Cálculos del turno
  const shiftCalculations = useMemo(() => {
    if (!startTime || !endTime || !selectedEmployee) {
      return null
    }

    const duration = calculateHoursBetween(startTime, endTime)
    const shiftType = determineShiftType(date, startTime, endTime, duration)
    const crossesNight = crossesMidnight(startTime, endTime)
    
    const mockShift: ScheduleShift = {
      id: '',
      employeeId,
      employeeName: selectedEmployee.name,
      position: selectedEmployee.position,
      locationId: selectedEmployee.locationId,
      date,
      startTime,
      endTime,
      duration,
      type: shiftType,
      status: 'draft',
      cost: 0,
      crossesMidnight: crossesNight
    }
    
    const cost = calculateShiftCost(mockShift, selectedEmployee.hourlyRate)
    
    return {
      duration,
      type: shiftType,
      cost,
      crossesMidnight: crossesNight,
      isSpecialDay: isSunday(new Date(date)) || isColombianHoliday(new Date(date))
    }
  }, [startTime, endTime, selectedEmployee, date, employeeId])

  // Validación en tiempo real
  useEffect(() => {
    const newErrors: string[] = []
    
    if (!employeeId) {
      newErrors.push('Debe seleccionar un empleado')
    }
    
    if (!date) {
      newErrors.push('Debe seleccionar una fecha')
    }
    
    if (!startTime) {
      newErrors.push('Debe especificar hora de inicio')
    }
    
    if (!endTime) {
      newErrors.push('Debe especificar hora de fin')
    }
    
    if (startTime && endTime && selectedEmployee) {
      const duration = calculateHoursBetween(startTime, endTime)
      
      if (duration <= 0) {
        newErrors.push('La hora de fin debe ser posterior a la hora de inicio')
      }
      
      if (duration > 12) {
        newErrors.push('Un turno no puede exceder 12 horas consecutivas')
      }
      
      if (duration < 0.5) {
        newErrors.push('Un turno debe durar al menos 30 minutos')
      }
      
      // Verificar disponibilidad del empleado
      if (date && selectedEmployee) {
        const dayOfWeek = new Date(date).getDay()
        const availability = selectedEmployee.availability.find(a => a.day === dayOfWeek)
        
        if (!availability?.available) {
          newErrors.push(`${selectedEmployee.name} no está disponible este día`)
        } else if (availability.startTime && availability.endTime) {
          if (startTime < availability.startTime || endTime > availability.endTime) {
            newErrors.push(
              `Fuera del horario disponible (${availability.startTime} - ${availability.endTime})`
            )
          }
        }
      }
    }
    
    // Validación personalizada
    if (onValidate && employeeId && date && startTime && endTime) {
      const customErrors = onValidate({
        employeeId,
        employeeName: selectedEmployee?.name || '',
        position: selectedEmployee?.position || '',
        locationId: selectedEmployee?.locationId || '',
        date,
        startTime,
        endTime
      })
      newErrors.push(...customErrors)
    }
    
    setErrors(newErrors)
  }, [employeeId, date, startTime, endTime, selectedEmployee, onValidate])

  // Aplicar plantilla
  const applyTemplate = useCallback((template: ShiftTemplate) => {
    setStartTime(template.startTime)
    setEndTime(template.endTime)
    setNotes(template.description || '')
  }, [])

  // Manejar envío del formulario
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (errors.length > 0 || !selectedEmployee) {
      return
    }
    
    setIsSubmitting(true)
    
    try {
      const duration = calculateHoursBetween(startTime, endTime)
      const calculatedShiftType = determineShiftType(date, startTime, endTime, duration)
      
      if (shift) {
        // Actualizar turno existente
        await onUpdateShift({
          id: shift.id,
          employeeId,
          employeeName: selectedEmployee.name,
          position: selectedEmployee.position,
          locationId: selectedEmployee.locationId,
          date,
          startTime,
          endTime,
          type: calculatedShiftType,
          templateId: templateId || undefined,
          notes: notes || undefined
        })
      } else {
        // Crear nuevo turno
        await onCreateShift({
          employeeId,
          employeeName: selectedEmployee.name,
          position: selectedEmployee.position,
          locationId: selectedEmployee.locationId,
          date,
          startTime,
          endTime,
          type: calculatedShiftType,
          templateId: templateId || undefined,
          notes: notes || undefined
        })
      }
      
      onClose()
    } catch (error) {
      console.error('Error saving shift:', error)
      setErrors([error instanceof Error ? error.message : 'Error al guardar el turno'])
    } finally {
      setIsSubmitting(false)
    }
  }, [
    errors,
    selectedEmployee,
    shift,
    onUpdateShift,
    onCreateShift,
    employeeId,
    date,
    startTime,
    endTime,
    templateId,
    notes,
    onClose
  ])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={onClose} />
      
      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">
              {shift ? 'Editar Turno' : 'Crear Nuevo Turno'}
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-md transition-colors"
            >
              <XMarkIcon className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Selección de empleado */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                <UserIcon className="w-4 h-4 inline mr-1" />
                Empleado
              </label>
              <select
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Seleccionar empleado</option>
                {employees.map((employee) => (
                  <option key={employee.id} value={employee.id}>
                    {employee.name} - {employee.position} (${employee.hourlyRate.toLocaleString('es-CO')}/h)
                  </option>
                ))}
              </select>
            </div>

            {/* Fecha y plantillas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  <CalendarIcon className="w-4 h-4 inline mr-1" />
                  Fecha
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  <DocumentTextIcon className="w-4 h-4 inline mr-1" />
                  Plantilla (opcional)
                </label>
                <select
                  value={templateId}
                  onChange={(e) => {
                    setTemplateId(e.target.value)
                    const template = templates.find(t => t.id === e.target.value)
                    if (template) {
                      applyTemplate(template)
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Sin plantilla</option>
                  {templates.map((template) => (
                    <option key={template.id} value={template.id}>
                      {template.name} ({template.startTime} - {template.endTime})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Horarios */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Hora de inicio
                </label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Hora de fin
                </label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
            </div>

            {/* Notas */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Notas (opcional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Notas adicionales sobre el turno..."
              />
            </div>

            {/* Previsualización del turno */}
            {shiftCalculations && (
              <div className="bg-gray-50 rounded-md p-4">
                <h4 className="font-medium text-gray-900 mb-3">Previsualización del Turno</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Duración:</span>
                    <div className="font-medium">{formatDuration(shiftCalculations.duration)}</div>
                  </div>
                  <div>
                    <span className="text-gray-500">Tipo:</span>
                    <div className="flex items-center">
                      <div 
                        className="w-3 h-3 rounded mr-2"
                        style={{ backgroundColor: getShiftTypeColor(shiftCalculations.type) }}
                      />
                      <span className="font-medium capitalize">{shiftCalculations.type}</span>
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-500">Costo:</span>
                    <div className="font-medium">${shiftCalculations.cost.toLocaleString('es-CO')}</div>
                  </div>
                  <div>
                    <span className="text-gray-500">Estado:</span>
                    <div className="flex items-center">
                      {shiftCalculations.isSpecialDay ? (
                        <ExclamationTriangleIcon className="w-4 h-4 text-yellow-500 mr-1" />
                      ) : (
                        <CheckCircleIcon className="w-4 h-4 text-green-500 mr-1" />
                      )}
                      <span className="text-sm">
                        {shiftCalculations.isSpecialDay ? 'Día especial' : 'Normal'}
                      </span>
                    </div>
                  </div>
                </div>
                
                {shiftCalculations.crossesMidnight && (
                  <div className="mt-3 p-2 bg-blue-50 text-blue-800 text-sm rounded">
                    <ClockIcon className="w-4 h-4 inline mr-1" />
                    Este turno cruza medianoche
                  </div>
                )}
              </div>
            )}

            {/* Errores de validación */}
            {errors.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <div className="flex items-center mb-2">
                  <ExclamationTriangleIcon className="w-5 h-5 text-red-500 mr-2" />
                  <h4 className="text-sm font-medium text-red-800">
                    Errores de validación
                  </h4>
                </div>
                <ul className="text-sm text-red-700 space-y-1">
                  {errors.map((error, index) => (
                    <li key={index}>• {error}</li>
                  ))}
                </ul>
              </div>
            )}
          </form>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              disabled={isSubmitting}
            >
              Cancelar
            </button>
            <button
              type="submit"
              onClick={handleSubmit}
              disabled={errors.length > 0 || isSubmitting || isSaving}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting || isSaving ? 'Guardando...' : (shift ? 'Actualizar' : 'Crear')} Turno
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ShiftCreationModal