/**
 * Componente WeekSelector
 * @fileoverview Selector de semanas con navegación y opciones de selección
 */

'use client'

import React from 'react'
import { ChevronLeftIcon, ChevronRightIcon, CalendarIcon } from '@heroicons/react/24/outline'

/**
 * Props del componente WeekSelector
 */
export interface WeekSelectorProps {
  /**
   * Semana actual en formato YYYY-WXX
   */
  currentWeek: string
  
  /**
   * Texto descriptivo de la semana (ej: "15 - 21 Ene 2024")
   */
  weekRange: string
  
  /**
   * Indica si es la semana actual
   */
  isCurrentWeek: boolean
  
  /**
   * Indica si se puede navegar hacia atrás
   */
  canGoBack: boolean
  
  /**
   * Indica si se puede navegar hacia adelante
   */
  canGoForward: boolean
  
  /**
   * Función para ir a la semana anterior
   */
  onPreviousWeek: () => void
  
  /**
   * Función para ir a la semana siguiente
   */
  onNextWeek: () => void
  
  /**
   * Función para ir a la semana actual
   */
  onCurrentWeek: () => void
  
  /**
   * Función para seleccionar una semana específica
   */
  onWeekSelect: (weekString: string) => void
  
  /**
   * Opciones de semanas disponibles para el selector
   */
  weekOptions?: Array<{
    value: string
    label: string
    isCurrent: boolean
  }>
  
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
 * Componente selector de semanas con navegación
 */
export function WeekSelector({
  currentWeek,
  weekRange,
  isCurrentWeek,
  canGoBack,
  canGoForward,
  onPreviousWeek,
  onNextWeek,
  onCurrentWeek,
  onWeekSelect,
  weekOptions = [],
  isLoading = false,
  className = ''
}: WeekSelectorProps) {
  return (
    <div className={`flex items-center justify-between bg-white rounded-lg shadow-sm border border-gray-200 p-4 ${className}`}>
      {/* Navegación hacia atrás */}
      <button
        onClick={onPreviousWeek}
        disabled={isLoading || !canGoBack}
        className="flex items-center justify-center w-10 h-10 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        title="Semana anterior"
      >
        <ChevronLeftIcon className="w-5 h-5 text-gray-600" />
      </button>

      {/* Información de la semana */}
      <div className="flex-1 mx-4 text-center">
        <div className="flex items-center justify-center space-x-2">
          <CalendarIcon className="w-5 h-5 text-gray-500" />
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              {weekRange}
            </h2>
            <p className="text-sm text-gray-500">
              Semana {currentWeek.split('-W')[1]}, {currentWeek.split('-W')[0]}
              {isCurrentWeek && (
                <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  Semana actual
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Selector desplegable de semanas (opcional) */}
        {weekOptions.length > 0 && (
          <div className="mt-3">
            <select
              value={currentWeek}
              onChange={(e) => onWeekSelect(e.target.value)}
              disabled={isLoading}
              className="block w-full max-w-xs mx-auto px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
            >
              {weekOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                  {option.isCurrent ? ' (Actual)' : ''}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Botones de acción */}
      <div className="flex items-center space-x-2">
        {/* Botón para ir a semana actual */}
        {!isCurrentWeek && (
          <button
            onClick={onCurrentWeek}
            disabled={isLoading}
            className="px-3 py-2 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Hoy
          </button>
        )}

        {/* Navegación hacia adelante */}
        <button
          onClick={onNextWeek}
          disabled={isLoading || !canGoForward}
          className="flex items-center justify-center w-10 h-10 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title="Semana siguiente"
        >
          <ChevronRightIcon className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      {/* Indicador de carga */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 rounded-lg">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
        </div>
      )}
    </div>
  )
}

/**
 * Variante compacta del selector de semanas
 */
export function CompactWeekSelector({
  currentWeek,
  weekRange,
  isCurrentWeek,
  onPreviousWeek,
  onNextWeek,
  onCurrentWeek,
  isLoading = false,
  className = ''
}: Omit<WeekSelectorProps, 'weekOptions' | 'onWeekSelect' | 'canGoBack' | 'canGoForward'>) {
  return (
    <div className={`flex items-center justify-between bg-gray-50 rounded-lg p-3 ${className}`}>
      <button
        onClick={onPreviousWeek}
        disabled={isLoading}
        className="p-2 rounded-md hover:bg-gray-200 disabled:opacity-50 transition-colors"
      >
        <ChevronLeftIcon className="w-4 h-4 text-gray-600" />
      </button>

      <div className="flex-1 text-center">
        <p className="text-sm font-medium text-gray-900">{weekRange}</p>
        {isCurrentWeek && (
          <span className="text-xs text-blue-600 font-medium">Actual</span>
        )}
      </div>

      <div className="flex items-center space-x-1">
        {!isCurrentWeek && (
          <button
            onClick={onCurrentWeek}
            disabled={isLoading}
            className="px-2 py-1 text-xs font-medium text-blue-700 bg-blue-100 rounded transition-colors hover:bg-blue-200"
          >
            Hoy
          </button>
        )}

        <button
          onClick={onNextWeek}
          disabled={isLoading}
          className="p-2 rounded-md hover:bg-gray-200 disabled:opacity-50 transition-colors"
        >
          <ChevronRightIcon className="w-4 h-4 text-gray-600" />
        </button>
      </div>
    </div>
  )
}

export default WeekSelector