/**
 * Calendario Universal de Scheduling
 * @fileoverview Componente compartido que se adapta según el rol del usuario
 */

'use client'

import React, { useMemo, useState, useCallback } from 'react'
import {
  ScheduleShift,
  Employee,
  SchedulingContext,
  CreateShiftData,
  UpdateShiftData,
  UserRole
} from '../core/types'
import { useScheduleCore, useEmployeeManagement } from '../hooks'
import { PermissionManager } from '../core/permissions'
import { SHIFT_CONFIG, UI_CONFIG } from '../core/constants'

/**
 * Props del componente universal
 */
interface UniversalScheduleCalendarProps {
  context: SchedulingContext
  onShiftCreate?: (data: CreateShiftData) => void
  onShiftUpdate?: (data: UpdateShiftData) => void
  onShiftDelete?: (id: string) => void
  className?: string
  compactMode?: boolean
}

/**
 * Props de celda de calendario
 */
interface CalendarCellProps {
  date: string
  dayIndex: number
  employee: Employee
  shifts: ScheduleShift[]
  canEdit: boolean
  onShiftClick: (shift: ScheduleShift) => void
  onCellClick: (employee: Employee, date: string) => void
}

/**
 * Props de turno en calendario
 */
interface ShiftItemProps {
  shift: ScheduleShift
  canEdit: boolean
  onClick: (shift: ScheduleShift) => void
  isSelected: boolean
}

/**
 * Componente de turno individual
 */
function ShiftItem({ shift, canEdit, onClick, isSelected }: ShiftItemProps) {
  const shiftColor = SHIFT_CONFIG.SHIFT_COLORS[shift.type]
  
  return (
    <div
      className={`
        px-2 py-1 mb-1 rounded text-xs cursor-pointer transition-all duration-200
        ${isSelected ? 'ring-2 ring-blue-400' : ''}
        ${canEdit ? 'hover:shadow-md hover:scale-105' : 'cursor-default'}
        text-white font-medium
      `}
      style={{ 
        backgroundColor: shiftColor,
        opacity: isSelected ? 1 : 0.9
      }}
      onClick={() => onClick(shift)}
      title={`${shift.employeeName} - ${shift.startTime} a ${shift.endTime}${shift.notes ? ` - ${shift.notes}` : ''}`}
    >
      <div className="flex justify-between items-center">
        <span className="truncate">
          {shift.startTime}-{shift.endTime}
        </span>
        {shift.type !== 'regular' && (
          <span className="ml-1 text-xs opacity-75">
            {shift.type === 'overtime' ? 'EX' : 
             shift.type === 'night' ? 'NOC' : 
             shift.type === 'holiday' ? 'FES' : ''}
          </span>
        )}
      </div>
      {shift.notes && (
        <div className="text-xs opacity-75 truncate mt-0.5">
          {shift.notes}
        </div>
      )}
    </div>
  )
}

/**
 * Componente de celda del calendario
 */
function CalendarCell({ 
  date, 
  dayIndex, 
  employee, 
  shifts, 
  canEdit, 
  onShiftClick, 
  onCellClick 
}: CalendarCellProps) {
  const dateShifts = shifts.filter(shift => 
    shift.employeeId === employee.id && shift.date === date
  )
  
  const dayOfWeek = new Date(date).getDay()
  const availability = employee.availability.find(avail => avail.day === dayOfWeek)
  const isAvailable = availability?.available || false
  
  const handleCellClick = () => {
    if (canEdit && isAvailable) {
      onCellClick(employee, date)
    }
  }

  return (
    <div 
      className={`
        min-h-[100px] border border-gray-200 p-1 
        ${isAvailable ? 'bg-white' : 'bg-gray-50'}
        ${canEdit && isAvailable ? 'hover:bg-blue-50 cursor-pointer' : ''}
        ${dayIndex === 0 || dayIndex === 6 ? 'bg-gray-25' : ''}
      `}
      onClick={handleCellClick}
    >
      {!isAvailable && (
        <div className="text-xs text-gray-400 italic">
          No disponible
        </div>
      )}
      
      {isAvailable && availability?.startTime && availability?.endTime && (
        <div className="text-xs text-gray-500 mb-1">
          {availability.startTime}-{availability.endTime}
        </div>
      )}
      
      <div className="space-y-1">
        {dateShifts.map(shift => (
          <ShiftItem
            key={shift.id}
            shift={shift}
            canEdit={canEdit}
            onClick={onShiftClick}
            isSelected={false}
          />
        ))}
      </div>
      
      {canEdit && isAvailable && dateShifts.length === 0 && (
        <div className="text-xs text-gray-400 text-center mt-4 opacity-0 hover:opacity-100 transition-opacity">
          + Agregar turno
        </div>
      )}
    </div>
  )
}

/**
 * Componente principal del calendario universal
 */
export function UniversalScheduleCalendar({
  context,
  onShiftCreate,
  onShiftUpdate,
  onShiftDelete,
  className = '',
  compactMode = false
}: UniversalScheduleCalendarProps) {
  
  // ========== HOOKS Y SERVICIOS ==========
  
  const {
    shifts,
    employees,
    selectedShift,
    setSelectedShift,
    createShift,
    updateShift,
    deleteShift,
    canPerformAction,
    getFilteredData,
    isLoading
  } = useScheduleCore({ context })
  
  const employeeManagement = useEmployeeManagement({
    context,
    employees,
    shifts
  })
  
  const permissionManager = useMemo(() => 
    new PermissionManager(context), [context]
  )

  // ========== ESTADO LOCAL ==========
  
  const [selectedCell, setSelectedCell] = useState<{
    employee: Employee
    date: string
  } | null>(null)

  // ========== DATOS FILTRADOS ==========
  
  const filteredData = useMemo(() => {
    return getFilteredData()
  }, [getFilteredData])

  const { employees: visibleEmployees, shifts: visibleShifts } = filteredData

  // ========== CONFIGURACIÓN POR ROL ==========
  
  const uiConfig = useMemo(() => {
    return permissionManager.getUIConfig()
  }, [permissionManager])

  const roleConfig = useMemo(() => {
    return UI_CONFIG.ROLE_UI_SETTINGS[context.user.role]
  }, [context.user.role])

  // ========== FECHAS DE LA SEMANA ==========
  
  const weekDates = useMemo(() => {
    return context.week.dates.map(date => date.toISOString().split('T')[0])
  }, [context.week.dates])

  const weekDayNames = useMemo(() => {
    return context.week.dates.map(date => {
      const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
      return {
        short: dayNames[date.getDay()],
        date: date.getDate(),
        full: date.toLocaleDateString('es-CO', { 
          weekday: 'long', 
          day: 'numeric', 
          month: 'short' 
        })
      }
    })
  }, [context.week.dates])

  // ========== MANEJADORES DE EVENTOS ==========
  
  const handleShiftClick = useCallback((shift: ScheduleShift) => {
    setSelectedShift(shift)
    
    if (canPerformAction('edit_shift')) {
      // Abrir modal de edición (se implementaría externamente)
      // onShiftUpdate podría llamarse desde aquí
    }
  }, [setSelectedShift, canPerformAction])

  const handleCellClick = useCallback((employee: Employee, date: string) => {
    if (!canPerformAction('create_shift')) return
    
    setSelectedCell({ employee, date })
    
    // Crear turno básico o abrir modal de creación
    const defaultShift: CreateShiftData = {
      employeeId: employee.id,
      employeeName: employee.name,
      position: employee.position,
      locationId: employee.locationId,
      date,
      startTime: '08:00',
      endTime: '16:00',
      type: 'regular'
    }
    
    if (onShiftCreate) {
      onShiftCreate(defaultShift)
    } else {
      // Crear directamente si no hay handler externo
      createShift(defaultShift).catch(console.error)
    }
  }, [canPerformAction, createShift, onShiftCreate])

  const handleShiftUpdate = useCallback(async (data: UpdateShiftData) => {
    try {
      if (onShiftUpdate) {
        onShiftUpdate(data)
      } else {
        await updateShift(data)
      }
    } catch (error) {
      console.error('Error updating shift:', error)
    }
  }, [updateShift, onShiftUpdate])

  const handleShiftDelete = useCallback(async (id: string) => {
    try {
      if (onShiftDelete) {
        onShiftDelete(id)
      } else {
        await deleteShift(id)
      }
    } catch (error) {
      console.error('Error deleting shift:', error)
    }
  }, [deleteShift, onShiftDelete])

  // ========== RENDERIZADO ==========
  
  if (isLoading) {
    return (
      <div className={`flex items-center justify-center h-64 ${className}`}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <span className="ml-2 text-gray-600">Cargando horarios...</span>
      </div>
    )
  }

  const canEdit = canPerformAction('create_shift') || canPerformAction('edit_shift')
  const maxEmployees = compactMode ? 10 : (roleConfig.showAllLocations ? 20 : 15)
  const displayEmployees = visibleEmployees.slice(0, maxEmployees)

  return (
    <div className={`schedule-calendar ${className}`}>
      {/* Header de información */}
      {!compactMode && (
        <div className="mb-4 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Horario Semanal - {context.week.startDate} al {context.week.endDate}
              </h3>
              <p className="text-sm text-gray-600">
                {displayEmployees.length} empleados • {visibleShifts.length} turnos
                {context.user.role !== 'EMPLOYEE' && uiConfig.showBudgetInfo && (
                  <span className="ml-2">
                    • Presupuesto: {((visibleShifts.reduce((sum, shift) => sum + shift.cost, 0) / context.settings.budget.weeklyLimit) * 100).toFixed(1)}%
                  </span>
                )}
              </p>
            </div>
            
            {canEdit && (
              <div className="flex gap-2">
                <button className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600">
                  Nuevo Turno
                </button>
                <button className="px-3 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600">
                  Validar Horario
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Grid del calendario */}
      <div className="border border-gray-300 rounded-lg overflow-hidden">
        {/* Header con días de la semana */}
        <div className={`grid grid-cols-8 bg-gray-100 ${compactMode ? 'text-xs' : 'text-sm'}`}>
          <div className={`${compactMode ? 'p-2' : 'p-3'} font-medium text-gray-700 border-r border-gray-300`}>
            Empleado
          </div>
          {weekDayNames.map((day, index) => (
            <div 
              key={index} 
              className={`${compactMode ? 'p-2' : 'p-3'} font-medium text-center border-r border-gray-300 last:border-r-0`}
            >
              <div className={compactMode ? 'text-xs' : 'text-sm'}>{day.short}</div>
              <div className={`${compactMode ? 'text-xs' : 'text-sm'} text-gray-600`}>{day.date}</div>
            </div>
          ))}
        </div>

        {/* Filas de empleados */}
        <div className="divide-y divide-gray-200">
          {displayEmployees.map((employee, empIndex) => (
            <div key={employee.id} className={`grid grid-cols-8 ${compactMode ? 'min-h-[80px]' : 'min-h-[120px]'}`}>
              {/* Columna de empleado */}
              <div className={`${compactMode ? 'p-2' : 'p-3'} border-r border-gray-300 bg-gray-50 flex flex-col justify-center`}>
                <div className={`font-medium text-gray-900 ${compactMode ? 'text-xs' : 'text-sm'}`}>
                  {employee.name}
                </div>
                <div className={`text-gray-600 ${compactMode ? 'text-xs' : 'text-sm'}`}>
                  {employee.position}
                </div>
                {!compactMode && (
                  <div className="text-xs text-gray-500 mt-1">
                    {employeeManagement.calculateEmployeeWeeklyHours(employee.id)}h / {employee.maxWeeklyHours}h
                  </div>
                )}
              </div>

              {/* Celdas de días */}
              {weekDates.map((date, dayIndex) => (
                <CalendarCell
                  key={`${employee.id}-${date}`}
                  date={date}
                  dayIndex={dayIndex}
                  employee={employee}
                  shifts={visibleShifts}
                  canEdit={canEdit}
                  onShiftClick={handleShiftClick}
                  onCellClick={handleCellClick}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Footer con resumen */}
      {!compactMode && (
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-700">Total Horas:</span>
              <span className="ml-2 text-gray-900">
                {visibleShifts.reduce((sum, shift) => sum + shift.duration, 0)}h
              </span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Empleados Activos:</span>
              <span className="ml-2 text-gray-900">
                {new Set(visibleShifts.map(shift => shift.employeeId)).size}
              </span>
            </div>
            {uiConfig.showBudgetInfo && (
              <div>
                <span className="font-medium text-gray-700">Costo Semanal:</span>
                <span className="ml-2 text-gray-900">
                  ${visibleShifts.reduce((sum, shift) => sum + shift.cost, 0).toLocaleString()}
                </span>
              </div>
            )}
            <div>
              <span className="font-medium text-gray-700">Turnos:</span>
              <span className="ml-2 text-gray-900">{visibleShifts.length}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default UniversalScheduleCalendar