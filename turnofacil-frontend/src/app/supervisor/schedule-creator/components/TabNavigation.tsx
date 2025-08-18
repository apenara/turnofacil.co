/**
 * Componente TabNavigation
 * @fileoverview Navegación por pestañas para las diferentes secciones del creador de horarios
 */

'use client'

import React from 'react'
import {
  CalendarDaysIcon,
  UserGroupIcon,
  ClockIcon,
  DocumentCheckIcon,
  CogIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'

/**
 * Tipos de pestañas disponibles
 */
export type TabType = 
  | 'calendar' 
  | 'employees' 
  | 'shifts' 
  | 'rest-days' 
  | 'templates' 
  | 'validation'

/**
 * Definición de una pestaña
 */
export interface Tab {
  id: TabType
  label: string
  icon: React.ComponentType<{ className?: string }>
  badge?: number | string
  disabled?: boolean
  hasError?: boolean
  hasWarning?: boolean
}

/**
 * Props del componente TabNavigation
 */
export interface TabNavigationProps {
  /**
   * Pestaña activa actual
   */
  activeTab: TabType
  
  /**
   * Función para cambiar de pestaña
   */
  onTabChange: (tab: TabType) => void
  
  /**
   * Número de errores de validación (para mostrar badge en la pestaña de validación)
   */
  validationErrors?: number
  
  /**
   * Número de advertencias de validación
   */
  validationWarnings?: number
  
  /**
   * Número total de empleados
   */
  employeeCount?: number
  
  /**
   * Número total de turnos
   */
  shiftsCount?: number
  
  /**
   * Número de días de descanso asignados
   */
  restDaysCount?: number
  
  /**
   * Número de plantillas disponibles
   */
  templatesCount?: number
  
  /**
   * Indica si alguna funcionalidad está deshabilitada
   */
  disabled?: boolean
  
  /**
   * Clases CSS adicionales
   */
  className?: string
}

/**
 * Componente de navegación por pestañas
 */
export function TabNavigation({
  activeTab,
  onTabChange,
  validationErrors = 0,
  validationWarnings = 0,
  employeeCount = 0,
  shiftsCount = 0,
  restDaysCount = 0,
  templatesCount = 0,
  disabled = false,
  className = ''
}: TabNavigationProps) {
  
  const tabs: Tab[] = [
    {
      id: 'calendar',
      label: 'Calendario',
      icon: CalendarDaysIcon
    },
    {
      id: 'employees',
      label: 'Empleados',
      icon: UserGroupIcon,
      badge: employeeCount > 0 ? employeeCount : undefined
    },
    {
      id: 'shifts',
      label: 'Turnos',
      icon: ClockIcon,
      badge: shiftsCount > 0 ? shiftsCount : undefined
    },
    {
      id: 'rest-days',
      label: 'Descansos',
      icon: DocumentCheckIcon,
      badge: restDaysCount > 0 ? restDaysCount : undefined
    },
    {
      id: 'templates',
      label: 'Plantillas',
      icon: CogIcon,
      badge: templatesCount > 0 ? templatesCount : undefined
    },
    {
      id: 'validation',
      label: 'Validación',
      icon: ExclamationTriangleIcon,
      badge: validationErrors > 0 ? validationErrors : undefined,
      hasError: validationErrors > 0,
      hasWarning: validationWarnings > 0 && validationErrors === 0
    }
  ]

  return (
    <div className={`border-b border-gray-200 ${className}`}>
      <nav className="-mb-px flex space-x-8" aria-label="Navegación de pestañas">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id
          const isDisabled = disabled || tab.disabled
          
          const TabIcon = tab.icon
          
          return (
            <button
              key={tab.id}
              onClick={() => !isDisabled && onTabChange(tab.id)}
              disabled={isDisabled}
              className={`
                group inline-flex items-center py-2 px-1 border-b-2 font-medium text-sm transition-colors duration-200
                ${
                  isActive
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
                ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                ${tab.hasError ? 'text-red-600 hover:text-red-700' : ''}
                ${tab.hasWarning && !tab.hasError ? 'text-yellow-600 hover:text-yellow-700' : ''}
              `}
              aria-current={isActive ? 'page' : undefined}
            >
              <TabIcon
                className={`
                  w-5 h-5 mr-2
                  ${
                    isActive
                      ? 'text-blue-500'
                      : 'text-gray-400 group-hover:text-gray-500'
                  }
                  ${tab.hasError ? 'text-red-500' : ''}
                  ${tab.hasWarning && !tab.hasError ? 'text-yellow-500' : ''}
                `}
                aria-hidden="true"
              />
              {tab.label}
              
              {/* Badge para mostrar contadores o errores */}
              {tab.badge && (
                <span
                  className={`
                    ml-2 inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-medium
                    ${
                      tab.hasError
                        ? 'bg-red-100 text-red-800'
                        : tab.hasWarning
                        ? 'bg-yellow-100 text-yellow-800'
                        : isActive
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-800'
                    }
                  `}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          )
        })}
      </nav>
    </div>
  )
}

/**
 * Variante compacta de la navegación por pestañas (para móviles)
 */
export function CompactTabNavigation({
  activeTab,
  onTabChange,
  validationErrors = 0,
  validationWarnings = 0,
  disabled = false,
  className = ''
}: Omit<TabNavigationProps, 'employeeCount' | 'shiftsCount' | 'restDaysCount' | 'templatesCount'>) {
  
  const tabs: Tab[] = [
    { id: 'calendar', label: 'Cal.', icon: CalendarDaysIcon },
    { id: 'employees', label: 'Emp.', icon: UserGroupIcon },
    { id: 'shifts', label: 'Turnos', icon: ClockIcon },
    { id: 'rest-days', label: 'Desc.', icon: DocumentCheckIcon },
    { id: 'templates', label: 'Plant.', icon: CogIcon },
    { 
      id: 'validation', 
      label: 'Valid.', 
      icon: ExclamationTriangleIcon,
      badge: validationErrors > 0 ? validationErrors : undefined,
      hasError: validationErrors > 0,
      hasWarning: validationWarnings > 0 && validationErrors === 0
    }
  ]

  return (
    <div className={`bg-white border-b border-gray-200 ${className}`}>
      <div className="flex overflow-x-auto">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id
          const isDisabled = disabled || tab.disabled
          const TabIcon = tab.icon
          
          return (
            <button
              key={tab.id}
              onClick={() => !isDisabled && onTabChange(tab.id)}
              disabled={isDisabled}
              className={`
                relative flex-shrink-0 flex flex-col items-center justify-center px-3 py-2 text-xs font-medium transition-colors
                ${
                  isActive
                    ? 'text-blue-600 bg-blue-50 border-b-2 border-blue-500'
                    : 'text-gray-500 hover:text-gray-700'
                }
                ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                ${tab.hasError ? 'text-red-600' : ''}
                ${tab.hasWarning && !tab.hasError ? 'text-yellow-600' : ''}
              `}
            >
              <div className="relative">
                <TabIcon className="w-5 h-5 mb-1" />
                {tab.badge && (
                  <span
                    className={`
                      absolute -top-1 -right-1 inline-flex items-center justify-center w-4 h-4 text-xs font-bold rounded-full
                      ${
                        tab.hasError
                          ? 'bg-red-500 text-white'
                          : tab.hasWarning
                          ? 'bg-yellow-500 text-white'
                          : 'bg-blue-500 text-white'
                      }
                    `}
                  >
                    {tab.badge}
                  </span>
                )}
              </div>
              <span>{tab.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default TabNavigation