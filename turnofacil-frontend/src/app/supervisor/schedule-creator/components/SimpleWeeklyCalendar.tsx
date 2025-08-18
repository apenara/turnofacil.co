/**
 * Componente SimpleWeeklyCalendar
 * @fileoverview Calendario semanal simple con diseño grid original (empleados en filas, días en columnas)
 */

'use client'

import React, { useState, useCallback, useMemo } from 'react'
import {
  PlusIcon,
  ClockIcon,
  UserIcon,
  TrashIcon
} from '@heroicons/react/24/outline'
import { ScheduleShift, Employee, RestDay, LeaveRequest } from '../types'
import { 
  formatDateForDisplay,
  dateToISOString,
  formatCurrency,
  getShiftTypeColor,
  isSunday,
  isColombianHoliday,
  crossesMidnight
} from '../utils'

/**
 * Props del componente SimpleWeeklyCalendar
 */
export interface SimpleWeeklyCalendarProps {
  /**
   * Fechas de la semana a mostrar
   */
  weekDates: Date[]
  
  /**
   * Lista de empleados
   */
  employees: Employee[]
  
  /**
   * Turnos de la semana
   */
  shifts: ScheduleShift[]
  
  /**
   * Días de descanso
   */
  restDays: RestDay[]
  
  /**
   * Licencias/permisos
   */
  leaves: LeaveRequest[]
  
  /**
   * Turno seleccionado
   */
  selectedShift?: ScheduleShift | null
  
  /**
   * Función para seleccionar turno
   */
  onShiftSelect: (shift: ScheduleShift) => void
  
  /**
   * Función para crear nuevo turno
   */
  onCreateShift: (employeeId: string, date: string, startTime?: string) => void
  
  /**
   * Función para editar turno
   */
  onEditShift: (shift: ScheduleShift) => void
  
  /**
   * Función para eliminar turno
   */
  onDeleteShift: (shiftId: string) => void
  
  /**
   * Función para mover turno (drag & drop)
   */
  onMoveShift?: (shiftId: string, newDate: string, newEmployeeId: string) => void
  
  /**
   * Clases CSS adicionales
   */
  className?: string
}

/**
 * Nombres de los días en español
 */
const DAY_NAMES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

/**
 * Componente calendario semanal simple
 */
export function SimpleWeeklyCalendar({
  weekDates,
  employees,
  shifts,
  restDays,
  leaves,
  selectedShift,
  onShiftSelect,
  onCreateShift,
  onEditShift,
  onDeleteShift,
  onMoveShift,
  className = ''
}: SimpleWeeklyCalendarProps) {
  const [draggedShift, setDraggedShift] = useState<ScheduleShift | null>(null)
  const [draggedEmployee, setDraggedEmployee] = useState<Employee | null>(null)

  /**
   * Obtiene turnos para una fecha específica y empleado
   */
  const getShiftsForDate = useCallback((date: string, employeeId: string) => {
    return shifts.filter(shift => 
      shift.date === date && shift.employeeId === employeeId
    ).sort((a, b) => a.startTime.localeCompare(b.startTime))
  }, [shifts])

  /**
   * Obtiene las horas semanales trabajadas por un empleado
   */
  const getEmployeeWeeklyHours = useCallback((employeeId: string) => {
    return shifts
      .filter(shift => shift.employeeId === employeeId)
      .reduce((total, shift) => total + shift.duration, 0)
  }, [shifts])

  /**
   * Verifica si un empleado está disponible en un día específico
   */
  const isEmployeeAvailable = useCallback((employee: Employee, date: Date) => {
    const dayOfWeek = date.getDay()
    const availability = employee.availability.find(a => a.day === dayOfWeek)
    return availability?.available || false
  }, [])

  /**
   * Verifica si hay día de descanso para un empleado en una fecha
   */
  const hasRestDay = useCallback((employeeId: string, date: string) => {
    return restDays.some(rd => rd.employeeId === employeeId && rd.date === date)
  }, [restDays])

  /**
   * Verifica si hay licencia para un empleado en una fecha
   */
  const hasLeave = useCallback((employeeId: string, date: string) => {
    return leaves.some(leave => 
      leave.employeeId === employeeId &&
      leave.status === 'approved' && 
      date >= leave.startDate && 
      date <= leave.endDate
    )
  }, [leaves])

  /**
   * Maneja el inicio del drag de un empleado
   */
  const handleEmployeeDragStart = useCallback((e: React.DragEvent, employee: Employee) => {
    setDraggedEmployee(employee)
    e.dataTransfer.effectAllowed = 'move'
  }, [])

  /**
   * Maneja el inicio del drag de un turno
   */
  const handleShiftDragStart = useCallback((e: React.DragEvent, shift: ScheduleShift) => {
    setDraggedShift(shift)
    e.dataTransfer.effectAllowed = 'move'
    e.stopPropagation()
  }, [])

  /**
   * Maneja el drop en una celda
   */
  const handleDrop = useCallback((e: React.DragEvent, date: string, employeeId?: string) => {
    e.preventDefault()
    
    if (draggedEmployee && !employeeId) {
      // Dropping employee - create new shift
      onCreateShift(draggedEmployee.id, date)
    } else if (draggedShift && onMoveShift && employeeId) {
      // Moving existing shift
      onMoveShift(draggedShift.id, date, employeeId)
    }
    
    setDraggedEmployee(null)
    setDraggedShift(null)
  }, [draggedEmployee, draggedShift, onCreateShift, onMoveShift])

  /**
   * Renderiza un turno individual
   */
  const renderShift = useCallback((shift: ScheduleShift) => {
    const isSelected = selectedShift?.id === shift.id
    const shiftColor = getShiftTypeColor(shift.type)
    
    return (
      <div
        key={shift.id}
        className={`
          relative p-2 mb-1 rounded border-l-4 cursor-pointer transition-all
          ${isSelected ? 'ring-2 ring-blue-500 bg-blue-50' : 'bg-white hover:bg-gray-50'}
          ${shift.status === 'draft' ? 'border-dashed opacity-75' : 'border-solid'}
        `}
        style={{ borderLeftColor: shiftColor }}
        draggable={!!onMoveShift}
        onDragStart={(e) => handleShiftDragStart(e, shift)}
        onClick={() => onShiftSelect(shift)}
        onDoubleClick={() => onEditShift(shift)}
        title={`${shift.employeeName} - ${shift.startTime} a ${shift.endTime}`}
      >
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center text-xs">
            <ClockIcon className="w-3 h-3 mr-1" />
            <span className="font-medium">{shift.startTime} - {shift.endTime}</span>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onDeleteShift(shift.id)
            }}
            className="opacity-0 group-hover:opacity-100 p-1 text-red-500 hover:bg-red-100 rounded transition-all"
            title="Eliminar turno"
          >
            <TrashIcon className="w-3 h-3" />
          </button>
        </div>
        
        <div className="text-xs text-gray-600">
          {shift.position} • {formatCurrency(shift.cost)}
        </div>
        
        {shift.type !== 'regular' && (
          <div className="text-xs font-medium mt-1" style={{ color: shiftColor }}>
            {shift.type === 'overtime' ? 'Extra' : 
             shift.type === 'night' ? 'Nocturno' : 'Festivo'}
          </div>
        )}
        
        {shift.notes && (
          <div className="text-xs text-gray-500 mt-1 truncate">
            {shift.notes}
          </div>
        )}
      </div>
    )
  }, [selectedShift, onShiftSelect, onEditShift, onDeleteShift, onMoveShift, handleShiftDragStart])

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
      <div className="p-6">
        <div className="grid grid-cols-8 gap-4">
          {/* Header Row */}
          <div className="font-medium text-gray-700 p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center">
              <UserIcon className="w-4 h-4 mr-2" />
              Empleado
            </div>
          </div>
          
          {weekDates.map((date, index) => {
            const dateString = dateToISOString(date)
            const isSpecialDay = isSunday(date) || isColombianHoliday(date)
            
            return (
              <div key={dateString} className="text-center p-3 bg-gray-50 rounded-lg">
                <div className={`font-medium ${isSpecialDay ? 'text-semantic-error' : 'text-neutral-dark-gray'}`}>
                  {DAY_NAMES[index]}
                </div>
                <div className={`text-xs ${isSpecialDay ? 'text-semantic-error' : 'text-neutral-medium-gray'}`}>
                  {date.toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit' })}
                </div>
                {isSpecialDay && (
                  <div className="w-2 h-2 bg-semantic-error rounded-full mx-auto mt-1" />
                )}
              </div>
            )
          })}

          {/* Employee Rows */}
          {employees.map(employee => (
            <React.Fragment key={employee.id}>
              {/* Employee Info Cell */}
              <div 
                className="p-3 bg-gray-50 rounded-lg cursor-move hover:bg-gray-100 transition-colors group"
                draggable
                onDragStart={(e) => handleEmployeeDragStart(e, employee)}
              >
                <div className="font-medium text-sm text-gray-900">{employee.name}</div>
                <div className="text-xs text-gray-600">{employee.position}</div>
                <div className="text-xs text-gray-500 mt-1">
                  {getEmployeeWeeklyHours(employee.id).toFixed(1)}h / {employee.maxWeeklyHours}h
                </div>
                <div className="text-xs text-blue-600 mt-1">
                  {employee.skills.slice(0, 2).join(', ')}
                  {employee.skills.length > 2 && '...'}
                </div>
              </div>
              
              {/* Day Cells for this Employee */}
              {weekDates.map(date => {
                const dateString = dateToISOString(date)
                const dayShifts = getShiftsForDate(dateString, employee.id)
                const isAvailable = isEmployeeAvailable(employee, date)
                const hasRest = hasRestDay(employee.id, dateString)
                const hasEmployeeLeave = hasLeave(employee.id, dateString)
                const isSpecialDay = isSunday(date) || isColombianHoliday(date)
                
                return (
                  <div
                    key={`${employee.id}-${dateString}`}
                    className={`
                      min-h-20 p-2 border-2 border-dashed rounded-lg transition-colors group
                      ${!isAvailable ? 'border-gray-100 bg-gray-50' : 
                        hasRest ? 'border-green-200 bg-green-50' :
                        hasEmployeeLeave ? 'border-purple-200 bg-purple-50' :
                        isSpecialDay ? 'border-red-200 bg-red-50' :
                        'border-gray-200 hover:border-blue-300 hover:bg-blue-50'}
                    `}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => isAvailable && !hasRest && !hasEmployeeLeave && handleDrop(e, dateString, employee.id)}
                    onClick={() => {
                      if (isAvailable && !hasRest && !hasEmployeeLeave) {
                        onCreateShift(employee.id, dateString)
                      }
                    }}
                  >
                    {/* Status Indicators */}
                    <div className="flex justify-end mb-1">
                      {hasRest && (
                        <div className="w-2 h-2 bg-semantic-success rounded-full mr-1" title="Día de descanso" />
                      )}
                      {hasEmployeeLeave && (
                        <div className="w-2 h-2 bg-semantic-info rounded-full mr-1" title="En licencia" />
                      )}
                      {!isAvailable && (
                        <div className="w-2 h-2 bg-neutral-medium-gray rounded-full" title="No disponible" />
                      )}
                    </div>

                    {/* Shifts */}
                    <div className="space-y-1">
                      {dayShifts.map(shift => renderShift(shift))}
                    </div>

                    {/* Add Shift Button */}
                    {isAvailable && !hasRest && !hasEmployeeLeave && dayShifts.length < 2 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          onCreateShift(employee.id, dateString)
                        }}
                        className="
                          w-full mt-2 p-2 border border-dashed border-gray-300 rounded text-neutral-medium-gray 
                          hover:border-primary hover:text-primary hover:bg-primary/10 
                          transition-colors opacity-0 group-hover:opacity-100
                        "
                      >
                        <PlusIcon className="w-4 h-4 mx-auto" />
                      </button>
                    )}

                    {/* Status Messages */}
                    {hasRest && (
                      <div className="text-xs text-semantic-success text-center mt-1">
                        Día de descanso
                      </div>
                    )}
                    {hasEmployeeLeave && (
                      <div className="text-xs text-semantic-info text-center mt-1">
                        En licencia
                      </div>
                    )}
                    {!isAvailable && !hasRest && !hasEmployeeLeave && (
                      <div className="text-xs text-neutral-medium-gray text-center mt-1">
                        No disponible
                      </div>
                    )}
                  </div>
                )
              })}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  )
}

export default SimpleWeeklyCalendar