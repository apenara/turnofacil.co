/**
 * Componente ValidationPanel
 * @fileoverview Panel de validaciones con errores, advertencias y sugerencias de corrección
 */

'use client'

import React, { useState, useMemo } from 'react'
import {
  ExclamationTriangleIcon,
  ExclamationCircleIcon,
  InformationCircleIcon,
  CheckCircleIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  LightBulbIcon,
  UserIcon,
  ClockIcon,
  CurrencyDollarIcon,
  DocumentCheckIcon
} from '@heroicons/react/24/outline'
import { ValidationResult, ValidationError, Employee } from '../types'

/**
 * Props del componente ValidationPanel
 */
export interface ValidationPanelProps {
  /**
   * Resultado de la validación
   */
  validation: ValidationResult
  
  /**
   * Lista de empleados para referencias
   */
  employees: Employee[]
  
  /**
   * Función para ejecutar una sugerencia de corrección
   */
  onApplySuggestion?: (errorType: string, employeeId?: string, suggestion?: string) => void
  
  /**
   * Función para navegar a un empleado específico
   */
  onNavigateToEmployee?: (employeeId: string) => void
  
  /**
   * Función para navegar a un turno específico
   */
  onNavigateToShift?: (shiftId: string) => void
  
  /**
   * Mostrar solo errores críticos
   */
  showOnlyCritical?: boolean
  
  /**
   * Mostrar panel expandido por defecto
   */
  defaultExpanded?: boolean
  
  /**
   * Clases CSS adicionales
   */
  className?: string
}

/**
 * Tipo de filtro para validaciones
 */
type ValidationFilter = 'all' | 'errors' | 'warnings' | 'info'

/**
 * Panel de validaciones y errores
 */
export function ValidationPanel({
  validation,
  employees,
  onApplySuggestion,
  onNavigateToEmployee,
  onNavigateToShift,
  showOnlyCritical = false,
  defaultExpanded = true,
  className = ''
}: ValidationPanelProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)
  const [filter, setFilter] = useState<ValidationFilter>('all')
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['errors']))

  // Agrupar errores por tipo
  const groupedValidations = useMemo(() => {
    const groups: Record<string, ValidationError[]> = {}
    
    const allValidations = [
      ...validation.errors,
      ...validation.warnings,
      ...validation.info
    ]
    
    // Filtrar según el filtro seleccionado
    const filteredValidations = allValidations.filter(item => {
      if (filter === 'errors') return item.severity === 'error'
      if (filter === 'warnings') return item.severity === 'warning'
      if (filter === 'info') return item.severity === 'info'
      return true
    })
    
    // Mostrar solo críticos si está activado
    const finalValidations = showOnlyCritical 
      ? filteredValidations.filter(item => 
          item.severity === 'error' && 
          ['overlap', 'leave_conflict', 'rest_day'].includes(item.type)
        )
      : filteredValidations
    
    finalValidations.forEach(item => {
      const category = getValidationCategory(item.type)
      if (!groups[category]) groups[category] = []
      groups[category].push(item)
    })
    
    return groups
  }, [validation, filter, showOnlyCritical])

  // Obtener categoría de validación
  const getValidationCategory = (type: string): string => {
    const categories: Record<string, string> = {
      'overtime': 'Horas Extras',
      'availability': 'Disponibilidad',
      'overlap': 'Conflictos de Horario',
      'rest_day': 'Días de Descanso',
      'leave_conflict': 'Conflictos de Licencia',
      'budget': 'Presupuesto',
      'consecutive_hours': 'Horas Consecutivas',
      'understaffed': 'Personal Insuficiente'
    }
    return categories[type] || 'Otros'
  }

  // Obtener icono para tipo de validación
  const getValidationIcon = (type: string) => {
    const icons: Record<string, React.ComponentType<{ className?: string }>> = {
      'overtime': ClockIcon,
      'availability': UserIcon,
      'overlap': ExclamationTriangleIcon,
      'rest_day': DocumentCheckIcon,
      'leave_conflict': ExclamationCircleIcon,
      'budget': CurrencyDollarIcon,
      'consecutive_hours': ClockIcon,
      'understaffed': UserIcon
    }
    return icons[type] || InformationCircleIcon
  }

  // Obtener color para severidad
  const getSeverityColor = (severity: string) => {
    const colors = {
      'error': 'text-red-600 bg-red-50 border-red-200',
      'warning': 'text-yellow-600 bg-yellow-50 border-yellow-200',
      'info': 'text-blue-600 bg-blue-50 border-blue-200'
    }
    return colors[severity as keyof typeof colors] || colors.info
  }

  // Obtener icono para severidad
  const getSeverityIcon = (severity: string) => {
    const icons = {
      'error': ExclamationCircleIcon,
      'warning': ExclamationTriangleIcon,
      'info': InformationCircleIcon
    }
    return icons[severity as keyof typeof icons] || InformationCircleIcon
  }

  // Obtener empleado por ID
  const getEmployee = (employeeId: string) => {
    return employees.find(emp => emp.id === employeeId)
  }

  // Toggle expansión de categoría
  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories)
    if (newExpanded.has(category)) {
      newExpanded.delete(category)
    } else {
      newExpanded.add(category)
    }
    setExpandedCategories(newExpanded)
  }

  // Renderizar item de validación
  const renderValidationItem = (item: ValidationError, index: number) => {
    const SeverityIcon = getSeverityIcon(item.severity)
    const employee = item.employeeId ? getEmployee(item.employeeId) : null
    
    return (
      <div
        key={`${item.type}-${index}`}
        className={`p-4 border rounded-lg ${getSeverityColor(item.severity)}`}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            {/* Header del error */}
            <div className="flex items-center mb-2">
              <SeverityIcon className="w-5 h-5 mr-2 flex-shrink-0" />
              <h4 className="font-medium">{item.message}</h4>
            </div>

            {/* Información adicional */}
            <div className="ml-7 space-y-2">
              {employee && (
                <div className="flex items-center text-sm">
                  <UserIcon className="w-4 h-4 mr-1" />
                  <button
                    onClick={() => onNavigateToEmployee?.(employee.id)}
                    className="hover:underline font-medium"
                  >
                    {employee.name} - {employee.position}
                  </button>
                </div>
              )}

              {item.date && (
                <div className="text-sm">
                  <strong>Fecha:</strong> {new Date(item.date).toLocaleDateString('es-CO')}
                </div>
              )}

              {item.shifts && item.shifts.length > 0 && (
                <div className="text-sm">
                  <strong>Turnos afectados:</strong> {item.shifts.length}
                  {onNavigateToShift && (
                    <div className="mt-1 space-x-2">
                      {item.shifts.slice(0, 3).map(shiftId => (
                        <button
                          key={shiftId}
                          onClick={() => onNavigateToShift(shiftId)}
                          className="px-2 py-1 text-xs bg-white bg-opacity-50 rounded hover:bg-opacity-75 transition-colors"
                        >
                          Ver turno
                        </button>
                      ))}
                      {item.shifts.length > 3 && (
                        <span className="text-xs">+{item.shifts.length - 3} más</span>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Sugerencias */}
              {item.suggestions && item.suggestions.length > 0 && (
                <div className="mt-3 p-3 bg-white bg-opacity-50 rounded-md">
                  <div className="flex items-center mb-2">
                    <LightBulbIcon className="w-4 h-4 mr-1" />
                    <span className="text-sm font-medium">Sugerencias:</span>
                  </div>
                  <ul className="text-sm space-y-1">
                    {item.suggestions.map((suggestion, idx) => (
                      <li key={idx} className="flex items-start">
                        <span className="mr-2">•</span>
                        <span className="flex-1">{suggestion}</span>
                        {onApplySuggestion && (
                          <button
                            onClick={() => onApplySuggestion(item.type, item.employeeId, suggestion)}
                            className="ml-2 px-2 py-1 text-xs bg-white rounded hover:bg-gray-50 transition-colors"
                          >
                            Aplicar
                          </button>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Estado del panel
  const hasIssues = validation.errors.length > 0 || validation.warnings.length > 0
  const isValid = validation.isValid

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
      {/* Header */}
      <div 
        className="p-4 border-b border-gray-200 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            {isValid ? (
              <CheckCircleIcon className="w-6 h-6 text-green-500 mr-3" />
            ) : (
              <ExclamationTriangleIcon className="w-6 h-6 text-red-500 mr-3" />
            )}
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Validación del Horario
              </h3>
              <p className="text-sm text-gray-500">
                {isValid 
                  ? 'El horario cumple con todas las validaciones'
                  : `${validation.summary.totalErrors} errores, ${validation.summary.totalWarnings} advertencias`
                }
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            {/* Resumen rápido */}
            {hasIssues && (
              <div className="flex items-center space-x-2 text-sm">
                {validation.errors.length > 0 && (
                  <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full">
                    {validation.errors.length} errores
                  </span>
                )}
                {validation.warnings.length > 0 && (
                  <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full">
                    {validation.warnings.length} advertencias
                  </span>
                )}
              </div>
            )}
            
            {isExpanded ? (
              <ChevronDownIcon className="w-5 h-5 text-gray-500" />
            ) : (
              <ChevronRightIcon className="w-5 h-5 text-gray-500" />
            )}
          </div>
        </div>
      </div>

      {/* Contenido expandible */}
      {isExpanded && hasIssues && (
        <div className="p-4">
          {/* Filtros */}
          <div className="mb-4 flex flex-wrap gap-2">
            {(['all', 'errors', 'warnings', 'info'] as ValidationFilter[]).map(filterType => {
              const counts = {
                all: validation.errors.length + validation.warnings.length + validation.info.length,
                errors: validation.errors.length,
                warnings: validation.warnings.length,
                info: validation.info.length
              }
              
              return (
                <button
                  key={filterType}
                  onClick={() => setFilter(filterType)}
                  className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                    filter === filterType
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {filterType === 'all' ? 'Todos' : 
                   filterType === 'errors' ? 'Errores' :
                   filterType === 'warnings' ? 'Advertencias' : 'Información'} 
                  {counts[filterType] > 0 && (
                    <span className="ml-1">({counts[filterType]})</span>
                  )}
                </button>
              )
            })}
          </div>

          {/* Grupos de validaciones */}
          <div className="space-y-4">
            {Object.entries(groupedValidations).map(([category, items]) => {
              const CategoryIcon = getValidationIcon(items[0]?.type || '')
              const isExpanded = expandedCategories.has(category)
              
              return (
                <div key={category} className="border border-gray-200 rounded-lg">
                  {/* Header de categoría */}
                  <button
                    onClick={() => toggleCategory(category)}
                    className="w-full p-3 text-left bg-gray-50 hover:bg-gray-100 transition-colors flex items-center justify-between rounded-t-lg"
                  >
                    <div className="flex items-center">
                      <CategoryIcon className="w-5 h-5 text-gray-500 mr-2" />
                      <span className="font-medium text-gray-900">{category}</span>
                      <span className="ml-2 px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded-full">
                        {items.length}
                      </span>
                    </div>
                    {isExpanded ? (
                      <ChevronDownIcon className="w-4 h-4 text-gray-500" />
                    ) : (
                      <ChevronRightIcon className="w-4 h-4 text-gray-500" />
                    )}
                  </button>

                  {/* Items de la categoría */}
                  {isExpanded && (
                    <div className="p-3 space-y-3">
                      {items.map((item, index) => renderValidationItem(item, index))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {Object.keys(groupedValidations).length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <CheckCircleIcon className="w-12 h-12 mx-auto mb-4 text-green-400" />
              <p>No hay problemas de validación con los filtros actuales</p>
            </div>
          )}
        </div>
      )}

      {/* Panel de éxito */}
      {isExpanded && isValid && (
        <div className="p-4">
          <div className="text-center py-8">
            <CheckCircleIcon className="w-16 h-16 mx-auto mb-4 text-green-500" />
            <h4 className="text-lg font-medium text-gray-900 mb-2">
              ¡Horario Válido!
            </h4>
            <p className="text-gray-500">
              El horario cumple con todas las validaciones de la legislación laboral colombiana
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

export default ValidationPanel