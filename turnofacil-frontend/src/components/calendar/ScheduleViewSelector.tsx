/**
 * Selector de Vista de Horarios
 * Permite alternar entre vista detallada y vista simple
 */

'use client'

import React from 'react'
import { Button } from '@/components/ui'

export type ScheduleViewMode = 'detailed' | 'simple'

interface ScheduleViewSelectorProps {
  currentView: ScheduleViewMode
  onViewChange: (view: ScheduleViewMode) => void
  className?: string
  compactMode?: boolean
  showLabels?: boolean
}

interface ViewOptionConfig {
  key: ScheduleViewMode
  label: string
  icon: string
  description: string
  shortLabel: string
}

const VIEW_OPTIONS: ViewOptionConfig[] = [
  {
    key: 'detailed',
    label: 'Vista Detallada',
    icon: '📋',
    description: 'Información completa con horarios, costos y empleados',
    shortLabel: 'Detallada'
  },
  {
    key: 'simple',
    label: 'Vista Simple',
    icon: '📄',
    description: 'Tabla tradicional con códigos de turno (M, T, N, D)',
    shortLabel: 'Simple'
  }
]

export function ScheduleViewSelector({
  currentView,
  onViewChange,
  className = '',
  compactMode = false,
  showLabels = true
}: ScheduleViewSelectorProps) {

  const buttonSize = compactMode ? 'sm' : 'md'
  const iconSize = compactMode ? 'text-sm' : 'text-base'
  const textSize = compactMode ? 'text-xs' : 'text-sm'

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {showLabels && !compactMode && (
        <span className="text-sm font-medium text-gray-700 mr-2">
          Vista:
        </span>
      )}
      
      <div className="flex bg-gray-100 rounded-lg p-1">
        {VIEW_OPTIONS.map((option) => {
          const isActive = currentView === option.key
          
          return (
            <button
              key={option.key}
              onClick={() => onViewChange(option.key)}
              className={`
                flex items-center gap-2 px-3 py-2 rounded-md transition-all duration-200
                ${isActive 
                  ? 'bg-white text-blue-700 shadow-sm font-medium' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }
                ${compactMode ? 'px-2 py-1' : 'px-3 py-2'}
              `}
              title={option.description}
              type="button"
            >
              <span className={iconSize}>{option.icon}</span>
              {showLabels && (
                <span className={`${textSize} font-medium`}>
                  {compactMode ? option.shortLabel : option.label}
                </span>
              )}
              
              {isActive && !compactMode && (
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full ml-1" />
              )}
            </button>
          )
        })}
      </div>
      
      {/* Indicador de vista actual (solo en modo compacto) */}
      {compactMode && (
        <div className="ml-2 text-xs text-gray-500">
          {VIEW_OPTIONS.find(opt => opt.key === currentView)?.shortLabel}
        </div>
      )}
    </div>
  )
}

/**
 * Hook para manejar el estado de la vista
 */
export function useScheduleView(initialView: ScheduleViewMode = 'detailed') {
  const [viewMode, setViewMode] = React.useState<ScheduleViewMode>(initialView)
  
  const toggleView = React.useCallback(() => {
    setViewMode(current => current === 'detailed' ? 'simple' : 'detailed')
  }, [])
  
  const setDetailedView = React.useCallback(() => {
    setViewMode('detailed')
  }, [])
  
  const setSimpleView = React.useCallback(() => {
    setViewMode('simple')
  }, [])
  
  return {
    viewMode,
    setViewMode,
    toggleView,
    setDetailedView,
    setSimpleView,
    isDetailed: viewMode === 'detailed',
    isSimple: viewMode === 'simple'
  }
}

/**
 * Componente de información de la vista actual
 */
interface ViewInfoProps {
  currentView: ScheduleViewMode
  className?: string
}

export function ViewInfo({ currentView, className = '' }: ViewInfoProps) {
  const viewConfig = VIEW_OPTIONS.find(opt => opt.key === currentView)
  
  if (!viewConfig) return null
  
  return (
    <div className={`flex items-center gap-2 text-sm text-gray-600 ${className}`}>
      <span>{viewConfig.icon}</span>
      <span>{viewConfig.description}</span>
    </div>
  )
}

/**
 * Componente de atajos de teclado para alternar vistas
 */
export function useScheduleViewKeyboard(onViewChange: (view: ScheduleViewMode) => void) {
  React.useEffect(() => {
    const handleKeyboard = (event: KeyboardEvent) => {
      // Ctrl/Cmd + Shift + 1 = Vista Detallada
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === '1') {
        event.preventDefault()
        onViewChange('detailed')
      }
      
      // Ctrl/Cmd + Shift + 2 = Vista Simple
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === '2') {
        event.preventDefault()
        onViewChange('simple')
      }
    }
    
    window.addEventListener('keydown', handleKeyboard)
    return () => window.removeEventListener('keydown', handleKeyboard)
  }, [onViewChange])
}

export default ScheduleViewSelector