/**
 * Componente WeeklyCalendar
 * @fileoverview Calendario semanal interactivo para visualizar y gestionar turnos
 */

'use client'

import React, { useState, useCallback, useMemo } from 'react'
import {
  PlusIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  StarIcon,
  UserIcon
} from '@heroicons/react/24/outline'
import { ScheduleShift, Employee, RestDay, LeaveRequest, ShiftTemplate } from '../types'
import { 
  formatDateForDisplay,
  dateToISOString,
  timeToMinutes,
  formatDuration,
  getShiftTypeColor,
  isSunday,
  isColombianHoliday,
  crossesMidnight
} from '../utils'

/**
 * Props del componente WeeklyCalendar
 */
export interface WeeklyCalendarProps {
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
   * Licencias activas
   */
  leaves: LeaveRequest[]
  
  /**
   * Turno seleccionado
   */
  selectedShift?: ScheduleShift | null
  
  /**
   * Función para seleccionar un turno
   */
  onShiftSelect: (shift: ScheduleShift | null) => void
  
  /**
   * Función para crear un nuevo turno
   */
  onCreateShift: (employeeId: string, date: string, startTime?: string) => void
  
  /**
   * Función para editar un turno existente
   */
  onEditShift: (shift: ScheduleShift) => void
  
  /**
   * Función para eliminar un turno
   */
  onDeleteShift: (shiftId: string) => void
  
  /**
   * Función para mover un turno (drag & drop)
   */
  onMoveShift?: (shiftId: string, newDate: string, newStartTime: string) => void
  
  /**
   * Vista del calendario (día completo o por empleado)
   */
  viewMode?: 'full-day' | 'by-employee'
  
  /**
   * Mostrar grid de horas
   */
  showTimeGrid?: boolean
  
  /**
   * Horas a mostrar en el grid (formato 24h)
   */
  displayHours?: { start: number; end: number }
  
  /**
   * Clases CSS adicionales
   */
  className?: string
}

/**
 * Componente calendario semanal
 */
export function WeeklyCalendar({
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
  viewMode = 'by-employee',
  showTimeGrid = true,
  displayHours = { start: 6, end: 23 },
  className = ''
}: WeeklyCalendarProps) {
  const [draggedShift, setDraggedShift] = useState<ScheduleShift | null>(null)
  const [hoveredCell, setHoveredCell] = useState<{ date: string; hour?: number } | null>(null)

  /**
   * Genera las horas para mostrar en el grid
   */
  const timeSlots = useMemo(() => {
    const slots = []
    for (let hour = displayHours.start; hour <= displayHours.end; hour++) {
      slots.push({
        hour,
        label: `${hour.toString().padStart(2, '0')}:00`
      })
    }
    return slots
  }, [displayHours])

  /**
   * Obtiene información del día (festivos, domingos, etc.)
   */
  const getDayInfo = useCallback((date: Date) => {
    const dateString = dateToISOString(date)
    const isSpecialDay = isSunday(date) || isColombianHoliday(date)
    const hasRestDays = restDays.some(rd => rd.date === dateString)
    const hasLeaves = leaves.some(leave => 
      leave.status === 'approved' && 
      dateString >= leave.startDate && 
      dateString <= leave.endDate
    )
    
    return {
      dateString,
      isSpecialDay,
      isHoliday: isColombianHoliday(date),
      isSunday: isSunday(date),
      hasRestDays,
      hasLeaves,
      formattedDate: formatDateForDisplay(date)
    }
  }, [restDays, leaves])

  /**
   * Obtiene turnos para una fecha específica
   */
  const getShiftsForDate = useCallback((date: string, employeeId?: string) => {
    return shifts.filter(shift => 
      shift.date === date && 
      (employeeId ? shift.employeeId === employeeId : true)
    ).sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime))
  }, [shifts])

  /**
   * Obtiene el empleado por ID
   */
  const getEmployee = useCallback((employeeId: string) => {
    return employees.find(emp => emp.id === employeeId)
  }, [employees])

  /**
   * Calcula la posición del turno en el grid de tiempo
   */
  const calculateShiftPosition = useCallback((shift: ScheduleShift) => {
    const startMinutes = timeToMinutes(shift.startTime)
    const endMinutes = timeToMinutes(shift.endTime)
    const gridStartMinutes = displayHours.start * 60
    const gridEndMinutes = displayHours.end * 60
    
    // Si el turno cruza medianoche, ajustar
    let adjustedEndMinutes = endMinutes
    if (crossesMidnight(shift.startTime, shift.endTime)) {
      adjustedEndMinutes = endMinutes + 24 * 60
    }
    
    const top = Math.max(0, (startMinutes - gridStartMinutes) / 60) * 60 // 60px por hora
    const height = Math.min(
      (adjustedEndMinutes - Math.max(startMinutes, gridStartMinutes)) / 60 * 60,
      (gridEndMinutes - gridStartMinutes) / 60 * 60
    )
    
    return { top, height }
  }, [displayHours])

  /**
   * Maneja el inicio del drag & drop
   */
  const handleDragStart = useCallback((e: React.DragEvent, shift: ScheduleShift) => {
    if (!onMoveShift) return
    setDraggedShift(shift)
    e.dataTransfer.effectAllowed = 'move'
  }, [onMoveShift])

  /**
   * Maneja el drop del turno
   */
  const handleDrop = useCallback((e: React.DragEvent, targetDate: string, targetHour?: number) => {
    e.preventDefault()
    if (!draggedShift || !onMoveShift) return
    
    const newStartTime = targetHour ? 
      `${targetHour.toString().padStart(2, '0')}:00` : 
      draggedShift.startTime
    
    if (targetDate !== draggedShift.date || newStartTime !== draggedShift.startTime) {
      onMoveShift(draggedShift.id, targetDate, newStartTime)
    }
    
    setDraggedShift(null)
  }, [draggedShift, onMoveShift])

  /**
   * Renderiza un turno individual
   */
  const renderShift = useCallback((shift: ScheduleShift, position?: { top: number; height: number }) => {
    const employee = getEmployee(shift.employeeId)
    const isSelected = selectedShift?.id === shift.id
    const backgroundColor = getShiftTypeColor(shift.type)
    
    return (
      <div
        key={shift.id}
        className={`
          absolute left-0 right-0 mx-1 p-2 rounded-md border cursor-pointer transition-all duration-200 text-xs
          ${isSelected ? 'ring-2 ring-blue-500 ring-offset-1' : ''}
          ${shift.status === 'draft' ? 'border-dashed opacity-75' : 'border-solid'}
          hover:shadow-md
        `}
        style={{
          backgroundColor: backgroundColor + '20',
          borderColor: backgroundColor,
          top: position?.top || 0,
          height: Math.max(position?.height || 40, 40),
          zIndex: isSelected ? 10 : 5
        }}
        draggable={!!onMoveShift}
        onDragStart={(e) => handleDragStart(e, shift)}
        onClick={() => onShiftSelect(shift)}
        onDoubleClick={() => onEditShift(shift)}
        title={`${shift.employeeName} - ${shift.startTime} a ${shift.endTime} (${formatDuration(shift.duration)})`}
      >
        <div className="flex items-center justify-between mb-1">
          <span className="font-medium text-gray-900 truncate">
            {employee?.name || shift.employeeName}
          </span>
          {shift.type !== 'regular' && (
            <StarIcon className="w-3 h-3 text-yellow-500 flex-shrink-0" />
          )}
        </div>
        
        <div className="flex items-center text-gray-600 mb-1">
          <ClockIcon className="w-3 h-3 mr-1" />
          <span>{shift.startTime} - {shift.endTime}</span>
        </div>
        
        <div className="text-gray-500 text-xs">
          {shift.position} • ${shift.cost.toLocaleString('es-CO')}
        </div>
        
        {shift.notes && (
          <div className="text-gray-400 text-xs mt-1 truncate">
            {shift.notes}
          </div>
        )}
      </div>
    )
  }, [selectedShift, getEmployee, onShiftSelect, onEditShift, onMoveShift, handleDragStart])

  /**
   * Renderiza una celda del calendario para vista por empleado
   */
  const renderEmployeeCell = useCallback((employee: Employee, date: string, dayInfo: any) => {
    const dayShifts = getShiftsForDate(date, employee.id)
    const hasRestDay = restDays.some(rd => rd.employeeId === employee.id && rd.date === date)
    const hasLeave = leaves.some(leave => 
      leave.employeeId === employee.id &&
      leave.status === 'approved' && 
      date >= leave.startDate && 
      date <= leave.endDate
    )
    
    return (
      <div
        key={`${employee.id}-${date}`}
        className={`
          relative min-h-[80px] border-r border-b border-gray-200 p-2
          ${dayInfo.isSpecialDay ? 'bg-red-50' : 'bg-white'}
          ${hasRestDay ? 'bg-green-50' : ''}
          ${hasLeave ? 'bg-purple-50' : ''}
          hover:bg-gray-50 transition-colors
        `}
        onDrop={(e) => handleDrop(e, date)}
        onDragOver={(e) => e.preventDefault()}
        onDragEnter={() => setHoveredCell({ date })}
        onDragLeave={() => setHoveredCell(null)}
      >
        {/* Indicadores de estado */}
        <div className="absolute top-1 right-1 flex space-x-1">
          {dayInfo.isHoliday && (
            <div className="w-2 h-2 bg-red-500 rounded-full" title="Día festivo" />
          )}
          {dayInfo.isSunday && (
            <div className="w-2 h-2 bg-orange-500 rounded-full" title="Domingo" />
          )}
          {hasRestDay && (
            <div className="w-2 h-2 bg-green-500 rounded-full" title="Día de descanso" />
          )}
          {hasLeave && (
            <div className="w-2 h-2 bg-purple-500 rounded-full" title="En licencia" />
          )}
        </div>

        {/* Turnos del día */}
        <div className="space-y-1">
          {dayShifts.map((shift) => renderShift(shift))}
        </div>

        {/* Botón para crear nuevo turno */}
        {!hasLeave && dayShifts.length < 2 && (
          <button
            onClick={() => onCreateShift(employee.id, date)}
            className="absolute bottom-1 right-1 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center hover:bg-blue-600 transition-colors opacity-70 hover:opacity-100"
            title="Crear turno"
          >
            <PlusIcon className="w-3 h-3" />
          </button>
        )}

        {/* Indicador de drag hover */}
        {hoveredCell?.date === date && draggedShift && (
          <div className="absolute inset-0 border-2 border-blue-500 border-dashed bg-blue-50 bg-opacity-50 rounded" />
        )}
      </div>
    )
  }, [getShiftsForDate, restDays, leaves, renderShift, onCreateShift, handleDrop, hoveredCell, draggedShift])

  /**
   * Renderiza vista por empleado
   */
  const renderByEmployeeView = () => (
    <div className="overflow-auto">
      <div className="min-w-[800px]">
        {/* Headers de días */}
        <div className="grid grid-cols-8 bg-gray-50 border-b border-gray-200 sticky top-0 z-20">
          <div className="p-3 border-r border-gray-200 font-medium text-gray-900 bg-gray-100">
            Empleado
          </div>
          {weekDates.map((date) => {
            const dayInfo = getDayInfo(date)
            return (
              <div
                key={dayInfo.dateString}
                className={`
                  p-3 text-center font-medium border-r border-gray-200 last:border-r-0
                  ${dayInfo.isSpecialDay ? 'bg-red-100 text-red-800' : 'text-gray-900'}
                `}
              >
                <div>{dayInfo.formattedDate}</div>
                {dayInfo.isSpecialDay && (
                  <div className="text-xs mt-1">
                    {dayInfo.isHoliday ? 'Festivo' : 'Domingo'}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Filas de empleados */}
        {employees.map((employee) => (
          <div key={employee.id} className="grid grid-cols-8 min-h-[80px]">
            {/* Columna del empleado */}
            <div className="p-3 border-r border-b border-gray-200 bg-gray-50 flex items-center">
              <div>
                <div className="font-medium text-gray-900">{employee.name}</div>
                <div className="text-sm text-gray-500">{employee.position}</div>
                <div className="text-xs text-gray-400">
                  ${employee.hourlyRate.toLocaleString('es-CO')}/h
                </div>
              </div>
            </div>

            {/* Celdas de días */}
            {weekDates.map((date) => {
              const dayInfo = getDayInfo(date)
              return renderEmployeeCell(employee, dayInfo.dateString, dayInfo)
            })}
          </div>
        ))}
      </div>
    </div>
  )

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
      {/* Header del calendario */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            Calendario Semanal
          </h3>
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span>Festivo</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span>Descanso</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
              <span>Licencia</span>
            </div>
          </div>
        </div>
      </div>

      {/* Contenido del calendario */}
      <div className="h-[600px] overflow-hidden">
        {viewMode === 'by-employee' && renderByEmployeeView()}
      </div>

      {/* Footer con información */}
      {selectedShift && (
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <UserIcon className="w-5 h-5 text-gray-400" />
              <div>
                <span className="font-medium">{selectedShift.employeeName}</span>
                <span className="text-gray-500 ml-2">
                  {selectedShift.startTime} - {selectedShift.endTime}
                </span>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => onEditShift(selectedShift)}
                className="px-3 py-1 text-sm font-medium text-blue-700 bg-blue-100 rounded hover:bg-blue-200 transition-colors"
              >
                Editar
              </button>
              <button
                onClick={() => onDeleteShift(selectedShift.id)}
                className="px-3 py-1 text-sm font-medium text-red-700 bg-red-100 rounded hover:bg-red-200 transition-colors"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default WeeklyCalendar