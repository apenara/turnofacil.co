/**
 * Componente RestDayManager
 * @fileoverview Gestor de días de descanso con cumplimiento de legislación laboral colombiana
 */

'use client'

import React, { useState, useMemo } from 'react'
import {
  PlusIcon,
  CalendarIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  UserIcon,
  DocumentCheckIcon,
  XMarkIcon,
  SparklesIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline'
import { 
  RestDay, 
  RestDayType, 
  CompensatoryReason,
  Employee, 
  ScheduleShift,
  CreateRestDayData,
  RestDayCompliance 
} from '../types'
import { 
  formatDateForDisplay,
  dateToISOString,
  isSunday,
  isColombianHoliday,
  FULL_DAY_NAMES
} from '../utils'

/**
 * Props del componente RestDayManager
 */
export interface RestDayManagerProps {
  /**
   * Lista de empleados
   */
  employees: Employee[]
  
  /**
   * Turnos de la semana
   */
  shifts: ScheduleShift[]
  
  /**
   * Días de descanso actuales
   */
  restDays: RestDay[]
  
  /**
   * Fechas de la semana
   */
  weekDates: Date[]
  
  /**
   * Cumplimiento de días de descanso por empleado
   */
  compliance: Record<string, RestDayCompliance>
  
  /**
   * Recomendaciones automáticas
   */
  recommendations: Array<{
    employeeId: string
    employeeName: string
    reason: string
    suggestedDates: Date[]
    priority: 'low' | 'medium' | 'high'
  }>
  
  /**
   * Función para crear día de descanso
   */
  onCreateRestDay: (data: CreateRestDayData) => Promise<void>
  
  /**
   * Función para eliminar día de descanso
   */
  onDeleteRestDay: (restDayId: string) => Promise<void>
  
  /**
   * Función para asignar automáticamente días de descanso
   */
  onAutoAssignRestDays: () => Promise<void>
  
  /**
   * Indica si está cargando
   */
  isLoading?: boolean
  
  /**
   * Clases CSS adicionales
   */
  className?: string
}

/**
 * Gestor de días de descanso
 */
export function RestDayManager({
  employees,
  shifts,
  restDays,
  weekDates,
  compliance,
  recommendations,
  onCreateRestDay,
  onDeleteRestDay,
  onAutoAssignRestDays,
  isLoading = false,
  className = ''
}: RestDayManagerProps) {
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('')
  const [selectedDate, setSelectedDate] = useState('')
  const [restType, setRestType] = useState<RestDayType>('weekly')
  const [reason, setReason] = useState('')
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Estadísticas de cumplimiento
  const complianceStats = useMemo(() => {
    const total = employees.length
    const compliant = Object.values(compliance).filter(c => c.compliant).length
    const nonCompliant = total - compliant
    const percentage = total > 0 ? (compliant / total) * 100 : 0
    
    return {
      total,
      compliant,
      nonCompliant,
      percentage,
      needsAttention: nonCompliant > 0
    }
  }, [employees, compliance])

  // Días especiales de la semana
  const specialDays = useMemo(() => {
    return weekDates.map(date => ({
      date: dateToISOString(date),
      formattedDate: formatDateForDisplay(date),
      dayName: FULL_DAY_NAMES[date.getDay()],
      isSunday: isSunday(date),
      isHoliday: isColombianHoliday(date),
      isSpecial: isSunday(date) || isColombianHoliday(date)
    }))
  }, [weekDates])

  // Obtener empleado por ID
  const getEmployee = (employeeId: string) => {
    return employees.find(emp => emp.id === employeeId)
  }

  // Obtener estado de cumplimiento
  const getComplianceStatus = (employeeId: string) => {
    const emp = compliance[employeeId]
    if (!emp) return { status: 'unknown', message: 'Sin información', color: 'text-gray-500', icon: InformationCircleIcon }
    
    if (emp.compliant) {
      return { 
        status: 'compliant', 
        message: 'Cumple', 
        color: 'text-green-600',
        icon: CheckCircleIcon
      }
    } else {
      return { 
        status: 'non-compliant', 
        message: emp.reason || 'No cumple', 
        color: 'text-red-600',
        icon: ExclamationTriangleIcon
      }
    }
  }

  // Verificar si una fecha tiene turnos para un empleado
  const hasShiftsOnDate = (employeeId: string, date: string) => {
    return shifts.some(shift => shift.employeeId === employeeId && shift.date === date)
  }

  // Manejar creación de día de descanso
  const handleCreateRestDay = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedEmployeeId || !selectedDate) return
    
    const employee = getEmployee(selectedEmployeeId)
    if (!employee) return
    
    setIsSubmitting(true)
    
    try {
      await onCreateRestDay({
        employeeId: selectedEmployeeId,
        employeeName: employee.name,
        date: selectedDate,
        type: restType,
        reason: restType === 'compensatory' && reason ? reason as CompensatoryReason : undefined,
        notes
      })
      
      // Reset form
      setSelectedEmployeeId('')
      setSelectedDate('')
      setRestType('weekly')
      setReason('')
      setNotes('')
      setShowCreateForm(false)
    } catch (error) {
      console.error('Error creating rest day:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Obtener empleados que necesitan días de descanso
  const employeesNeedingRestDays = useMemo(() => {
    return employees.filter(emp => {
      const empCompliance = compliance[emp.id]
      return empCompliance && !empCompliance.compliant
    })
  }, [employees, compliance])

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Gestión de Días de Descanso
          </h3>
          <div className="flex items-center space-x-3">
            {recommendations.length > 0 && (
              <button
                onClick={onAutoAssignRestDays}
                disabled={isLoading}
                className="flex items-center px-3 py-2 text-sm font-medium text-purple-700 bg-purple-100 border border-purple-200 rounded-md hover:bg-purple-200 disabled:opacity-50 transition-colors"
              >
                <SparklesIcon className="w-4 h-4 mr-2" />
                Asignar Automático
              </button>
            )}
            <button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="flex items-center px-3 py-2 text-sm font-medium text-blue-700 bg-blue-100 border border-blue-200 rounded-md hover:bg-blue-200 transition-colors"
            >
              <PlusIcon className="w-4 h-4 mr-2" />
              Asignar Manualmente
            </button>
          </div>
        </div>

        {/* Estadísticas de cumplimiento */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center">
              <UserIcon className="w-5 h-5 text-gray-400 mr-2" />
              <div>
                <p className="text-sm text-gray-500">Total Empleados</p>
                <p className="text-xl font-semibold text-gray-900">{complianceStats.total}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center">
              <CheckCircleIcon className="w-5 h-5 text-green-500 mr-2" />
              <div>
                <p className="text-sm text-green-600">Cumplen</p>
                <p className="text-xl font-semibold text-green-700">{complianceStats.compliant}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-red-50 rounded-lg p-4">
            <div className="flex items-center">
              <ExclamationTriangleIcon className="w-5 h-5 text-red-500 mr-2" />
              <div>
                <p className="text-sm text-red-600">No Cumplen</p>
                <p className="text-xl font-semibold text-red-700">{complianceStats.nonCompliant}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center">
              <DocumentCheckIcon className="w-5 h-5 text-blue-500 mr-2" />
              <div>
                <p className="text-sm text-blue-600">% Cumplimiento</p>
                <p className="text-xl font-semibold text-blue-700">
                  {complianceStats.percentage.toFixed(0)}%
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Formulario de creación */}
      {showCreateForm && (
        <div className="p-6 border-b border-gray-200 bg-gray-50">
          <form onSubmit={handleCreateRestDay} className="space-y-4">
            <h4 className="font-medium text-gray-900 mb-4">Asignar Nuevo Día de Descanso</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Empleado
                </label>
                <select
                  value={selectedEmployeeId}
                  onChange={(e) => setSelectedEmployeeId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">Seleccionar empleado</option>
                  {employees.map((employee) => {
                    const complianceStatus = getComplianceStatus(employee.id)
                    return (
                      <option key={employee.id} value={employee.id}>
                        {employee.name} - {employee.position} 
                        {complianceStatus.status === 'non-compliant' ? ' (Necesita descanso)' : ''}
                      </option>
                    )
                  })}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha
                </label>
                <select
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">Seleccionar fecha</option>
                  {specialDays.map((day) => {
                    const hasShifts = selectedEmployeeId && hasShiftsOnDate(selectedEmployeeId, day.date)
                    const hasRestDay = restDays.some(rd => 
                      rd.employeeId === selectedEmployeeId && rd.date === day.date
                    )
                    
                    return (
                      <option 
                        key={day.date} 
                        value={day.date}
                        disabled={hasShifts || hasRestDay}
                      >
                        {day.formattedDate} ({day.dayName})
                        {day.isSpecial ? ' - Día especial' : ''}
                        {hasShifts ? ' - Tiene turnos' : ''}
                        {hasRestDay ? ' - Ya tiene descanso' : ''}
                      </option>
                    )
                  })}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Descanso
                </label>
                <select
                  value={restType}
                  onChange={(e) => setRestType(e.target.value as RestDayType)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="weekly">Descanso semanal obligatorio</option>
                  <option value="compensatory">Descanso compensatorio</option>
                  <option value="additional">Descanso adicional</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Razón (opcional)
                </label>
                <input
                  type="text"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Ej: Trabajo dominical del 15/12"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notas (opcional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="Notas adicionales..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                disabled={isSubmitting}
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !selectedEmployeeId || !selectedDate}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting ? 'Asignando...' : 'Asignar Descanso'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Recomendaciones automáticas */}
      {recommendations.length > 0 && (
        <div className="p-6 border-b border-gray-200 bg-blue-50">
          <h4 className="font-medium text-blue-900 mb-3 flex items-center">
            <InformationCircleIcon className="w-5 h-5 mr-2" />
            Recomendaciones Automáticas ({recommendations.length})
          </h4>
          <div className="space-y-2">
            {recommendations.slice(0, 3).map((rec, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-white rounded-md">
                <div>
                  <span className="font-medium text-gray-900">{rec.employeeName}</span>
                  <p className="text-sm text-gray-600">{rec.reason}</p>
                  {rec.suggestedDates.length > 0 && (
                    <p className="text-sm text-blue-600">
                      Sugerencia: {formatDateForDisplay(rec.suggestedDates[0])}
                    </p>
                  )}
                </div>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  rec.priority === 'high' ? 'bg-red-100 text-red-800' :
                  rec.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {rec.priority === 'high' ? 'Alta' : rec.priority === 'medium' ? 'Media' : 'Baja'}
                </span>
              </div>
            ))}
            {recommendations.length > 3 && (
              <p className="text-sm text-blue-600 text-center">
                +{recommendations.length - 3} recomendaciones más
              </p>
            )}
          </div>
        </div>
      )}

      {/* Lista de días de descanso asignados */}
      <div className="p-6">
        <h4 className="font-medium text-gray-900 mb-4">
          Días de Descanso Asignados ({restDays.length})
        </h4>
        
        {restDays.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <CalendarIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No hay días de descanso asignados esta semana</p>
            <p className="text-sm mt-2">
              Usa el botón "Asignar Automático" o "Asignar Manualmente" para comenzar
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {restDays.map((restDay) => {
              const employee = getEmployee(restDay.employeeId)
              const complianceStatus = getComplianceStatus(restDay.employeeId)
              const StatusIcon = complianceStatus.icon
              
              return (
                <div key={restDay.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      <CalendarIcon className="w-5 h-5 text-gray-400" />
                    </div>
                    
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-gray-900">{restDay.employeeName}</span>
                        <span className="text-sm text-gray-500">•</span>
                        <span className="text-sm text-gray-500">{employee?.position}</span>
                        <StatusIcon className={`w-4 h-4 ${complianceStatus.color}`} />
                      </div>
                      
                      <div className="flex items-center space-x-4 mt-1 text-sm text-gray-600">
                        <span>{new Date(restDay.date).toLocaleDateString('es-CO')}</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          restDay.type === 'weekly' ? 'bg-green-100 text-green-800' :
                          restDay.type === 'compensatory' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {restDay.type === 'weekly' ? 'Semanal' :
                           restDay.type === 'compensatory' ? 'Compensatorio' : 'Adicional'}
                        </span>
                      </div>
                      
                      {restDay.reason && (
                        <p className="text-sm text-gray-500 mt-1">
                          Razón: {restDay.reason}
                        </p>
                      )}
                      
                      {restDay.notes && (
                        <p className="text-sm text-gray-500 mt-1">
                          Notas: {restDay.notes}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <button
                    onClick={() => onDeleteRestDay(restDay.id)}
                    disabled={isLoading}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50"
                    title="Eliminar día de descanso"
                  >
                    <XMarkIcon className="w-4 h-4" />
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Footer con información legal */}
      <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
        <div className="flex items-center text-sm text-gray-600">
          <InformationCircleIcon className="w-4 h-4 mr-2" />
          <span>
            Según el Código Sustantivo del Trabajo, todo empleado tiene derecho a un día de descanso semanal remunerado
          </span>
        </div>
      </div>
    </div>
  )
}

export default RestDayManager