/**
 * Componente EmployeesList
 * @fileoverview Lista de empleados con información de disponibilidad y turnos asignados
 */

'use client'

import React, { useState } from 'react'
import {
  UserIcon,
  ClockIcon,
  CurrencyDollarIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  FunnelIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline'
import { Employee, ScheduleShift, RestDay, LeaveRequest } from '../types'
import { formatDuration, calculateEmployeeWeeklyHours, calculateEmployeeWeeklyCost } from '../utils'

/**
 * Props del componente EmployeesList
 */
export interface EmployeesListProps {
  /**
   * Lista de empleados
   */
  employees: Employee[]
  
  /**
   * Turnos de la semana actual
   */
  shifts: ScheduleShift[]
  
  /**
   * Días de descanso de la semana
   */
  restDays: RestDay[]
  
  /**
   * Licencias activas
   */
  leaves: LeaveRequest[]
  
  /**
   * Empleado seleccionado
   */
  selectedEmployeeId?: string
  
  /**
   * Función para seleccionar un empleado
   */
  onEmployeeSelect: (employeeId: string) => void
  
  /**
   * Función para crear un turno para un empleado
   */
  onCreateShift?: (employeeId: string) => void
  
  /**
   * Función para asignar día de descanso
   */
  onAssignRestDay?: (employeeId: string) => void
  
  /**
   * Mostrar información detallada
   */
  showDetails?: boolean
  
  /**
   * Clases CSS adicionales
   */
  className?: string
}

/**
 * Tipos de filtro disponibles
 */
type FilterType = 'all' | 'available' | 'busy' | 'compliance-issues'

/**
 * Componente lista de empleados
 */
export function EmployeesList({
  employees,
  shifts,
  restDays,
  leaves,
  selectedEmployeeId,
  onEmployeeSelect,
  onCreateShift,
  onAssignRestDay,
  showDetails = true,
  className = ''
}: EmployeesListProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [filter, setFilter] = useState<FilterType>('all')

  // Filtrar empleados según criterios
  const filteredEmployees = employees.filter(employee => {
    // Filtro por término de búsqueda
    const matchesSearch = employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         employee.position.toLowerCase().includes(searchTerm.toLowerCase())
    
    if (!matchesSearch) return false

    // Cálculos para filtros
    const employeeShifts = shifts.filter(s => s.employeeId === employee.id)
    const weeklyHours = calculateEmployeeWeeklyHours(employee.id, employeeShifts)
    const hasRestDay = restDays.some(r => r.employeeId === employee.id)
    const hasActiveLeave = leaves.some(l => 
      l.employeeId === employee.id && l.status === 'approved'
    )
    
    // Aplicar filtros
    switch (filter) {
      case 'available':
        return !hasActiveLeave && weeklyHours < employee.maxWeeklyHours
      case 'busy':
        return weeklyHours >= employee.maxWeeklyHours || hasActiveLeave
      case 'compliance-issues':
        return weeklyHours > 48 || (weeklyHours > 0 && !hasRestDay)
      default:
        return true
    }
  })

  const getEmployeeStatus = (employee: Employee) => {
    const employeeShifts = shifts.filter(s => s.employeeId === employee.id)
    const weeklyHours = calculateEmployeeWeeklyHours(employee.id, employeeShifts)
    const weeklyCost = calculateEmployeeWeeklyCost(employee.id, employeeShifts, employee.hourlyRate)
    const hasRestDay = restDays.some(r => r.employeeId === employee.id)
    const hasActiveLeave = leaves.some(l => 
      l.employeeId === employee.id && l.status === 'approved'
    )

    let status: 'available' | 'busy' | 'compliance-issue' | 'on-leave' = 'available'
    let statusText = 'Disponible'
    let statusColor = 'text-green-600 bg-green-50'

    if (hasActiveLeave) {
      status = 'on-leave'
      statusText = 'En licencia'
      statusColor = 'text-purple-600 bg-purple-50'
    } else if (weeklyHours > 48) {
      status = 'compliance-issue'
      statusText = 'Exceso legal'
      statusColor = 'text-red-600 bg-red-50'
    } else if (weeklyHours > 0 && !hasRestDay) {
      status = 'compliance-issue'
      statusText = 'Sin descanso'
      statusColor = 'text-yellow-600 bg-yellow-50'
    } else if (weeklyHours >= employee.maxWeeklyHours) {
      status = 'busy'
      statusText = 'Máximo alcanzado'
      statusColor = 'text-orange-600 bg-orange-50'
    }

    return {
      status,
      statusText,
      statusColor,
      weeklyHours,
      weeklyCost,
      hasRestDay,
      hasActiveLeave,
      shiftsCount: employeeShifts.length
    }
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
      {/* Header con búsqueda y filtros */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Empleados ({filteredEmployees.length})
          </h3>
        </div>

        {/* Barra de búsqueda */}
        <div className="relative mb-4">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar empleados..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Filtros */}
        <div className="flex space-x-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
              filter === 'all'
                ? 'bg-blue-100 text-blue-700'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Todos
          </button>
          <button
            onClick={() => setFilter('available')}
            className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
              filter === 'available'
                ? 'bg-green-100 text-green-700'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Disponibles
          </button>
          <button
            onClick={() => setFilter('busy')}
            className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
              filter === 'busy'
                ? 'bg-orange-100 text-orange-700'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Ocupados
          </button>
          <button
            onClick={() => setFilter('compliance-issues')}
            className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
              filter === 'compliance-issues'
                ? 'bg-red-100 text-red-700'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Problemas
          </button>
        </div>
      </div>

      {/* Lista de empleados */}
      <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
        {filteredEmployees.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <UserIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No se encontraron empleados</p>
            {searchTerm && (
              <p className="text-sm mt-2">
                Intenta con un término de búsqueda diferente
              </p>
            )}
          </div>
        ) : (
          filteredEmployees.map((employee) => {
            const employeeStatus = getEmployeeStatus(employee)
            const isSelected = selectedEmployeeId === employee.id

            return (
              <div
                key={employee.id}
                className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                  isSelected ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                }`}
                onClick={() => onEmployeeSelect(employee.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {/* Información básica */}
                    <div className="flex items-center mb-2">
                      <UserIcon className="w-5 h-5 text-gray-400 mr-2" />
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">
                          {employee.name}
                        </h4>
                        <p className="text-xs text-gray-500">{employee.position}</p>
                      </div>
                    </div>

                    {/* Estado */}
                    <div className="flex items-center mb-2">
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${employeeStatus.statusColor}`}
                      >
                        {employeeStatus.status === 'compliance-issue' && (
                          <ExclamationTriangleIcon className="w-3 h-3 mr-1" />
                        )}
                        {employeeStatus.status === 'available' && (
                          <CheckCircleIcon className="w-3 h-3 mr-1" />
                        )}
                        {employeeStatus.statusText}
                      </span>
                    </div>

                    {/* Detalles (si está habilitado) */}
                    {showDetails && (
                      <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                        <div className="flex items-center">
                          <ClockIcon className="w-3 h-3 mr-1" />
                          {formatDuration(employeeStatus.weeklyHours)} / {formatDuration(employee.maxWeeklyHours)}
                        </div>
                        <div className="flex items-center">
                          <CurrencyDollarIcon className="w-3 h-3 mr-1" />
                          ${employeeStatus.weeklyCost.toLocaleString('es-CO')}
                        </div>
                        <div className="text-gray-500">
                          Turnos: {employeeStatus.shiftsCount}
                        </div>
                        <div className="text-gray-500">
                          Descanso: {employeeStatus.hasRestDay ? 'Sí' : 'No'}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Acciones */}
                  <div className="flex flex-col space-y-1 ml-4">
                    {onCreateShift && !employeeStatus.hasActiveLeave && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          onCreateShift(employee.id)
                        }}
                        className="px-2 py-1 text-xs font-medium text-blue-700 bg-blue-100 rounded hover:bg-blue-200 transition-colors"
                      >
                        + Turno
                      </button>
                    )}
                    {onAssignRestDay && !employeeStatus.hasRestDay && !employeeStatus.hasActiveLeave && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          onAssignRestDay(employee.id)
                        }}
                        className="px-2 py-1 text-xs font-medium text-green-700 bg-green-100 rounded hover:bg-green-200 transition-colors"
                      >
                        Descanso
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

/**
 * Versión compacta de la lista de empleados
 */
export function CompactEmployeesList({
  employees,
  shifts,
  selectedEmployeeId,
  onEmployeeSelect,
  className = ''
}: Pick<EmployeesListProps, 'employees' | 'shifts' | 'selectedEmployeeId' | 'onEmployeeSelect' | 'className'>) {
  return (
    <div className={`bg-white rounded-lg border border-gray-200 ${className}`}>
      <div className="p-3 border-b border-gray-200">
        <h4 className="text-sm font-medium text-gray-900">
          Empleados ({employees.length})
        </h4>
      </div>
      <div className="max-h-48 overflow-y-auto">
        {employees.map((employee) => {
          const employeeShifts = shifts.filter(s => s.employeeId === employee.id)
          const weeklyHours = calculateEmployeeWeeklyHours(employee.id, employeeShifts)
          const isSelected = selectedEmployeeId === employee.id

          return (
            <button
              key={employee.id}
              onClick={() => onEmployeeSelect(employee.id)}
              className={`w-full p-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors ${
                isSelected ? 'bg-blue-50' : ''
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">{employee.name}</p>
                  <p className="text-xs text-gray-500">{employee.position}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-600">
                    {formatDuration(weeklyHours)}
                  </p>
                  <p className="text-xs text-gray-500">
                    {employeeShifts.length} turnos
                  </p>
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default EmployeesList