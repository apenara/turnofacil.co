/**
 * Componente QuickActions
 * @fileoverview Barra de acciones rápidas para operaciones comunes del horario
 */

'use client'

import React, { useState } from 'react'
import {
  DocumentArrowDownIcon,
  DocumentArrowUpIcon,
  CheckCircleIcon,
  TrashIcon,
  DocumentDuplicateIcon,
  PlayIcon,
  PauseIcon,
  ShareIcon,
  PrinterIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  SparklesIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline'

/**
 * Props del componente QuickActions
 */
export interface QuickActionsProps {
  /**
   * Función para guardar el horario
   */
  onSave: () => Promise<void>
  
  /**
   * Función para cargar un horario
   */
  onLoad?: () => Promise<void>
  
  /**
   * Función para confirmar todos los turnos
   */
  onConfirmAll: () => Promise<void>
  
  /**
   * Función para limpiar todos los turnos
   */
  onClearAll: () => Promise<void>
  
  /**
   * Función para duplicar horario a otra semana
   */
  onDuplicate?: () => Promise<void>
  
  /**
   * Función para exportar horario
   */
  onExport?: (format: 'pdf' | 'excel' | 'csv') => Promise<void>
  
  /**
   * Función para imprimir horario
   */
  onPrint?: () => void
  
  /**
   * Función para compartir horario
   */
  onShare?: () => void
  
  /**
   * Función para validar horario
   */
  onValidate: () => Promise<void>
  
  /**
   * Función para aplicar correcciones automáticas
   */
  onAutoFix?: () => Promise<void>
  
  /**
   * Función para recargar datos
   */
  onRefresh?: () => Promise<void>
  
  /**
   * Estado de validación
   */
  isValid: boolean
  
  /**
   * Número de errores de validación
   */
  errorCount: number
  
  /**
   * Indica si hay cambios sin guardar
   */
  hasUnsavedChanges: boolean
  
  /**
   * Indica si alguna operación está en progreso
   */
  isLoading?: boolean
  
  /**
   * Modo compacto (para espacios reducidos)
   */
  compact?: boolean
  
  /**
   * Clases CSS adicionales
   */
  className?: string
}

/**
 * Barra de acciones rápidas
 */
export function QuickActions({
  onSave,
  onLoad,
  onConfirmAll,
  onClearAll,
  onDuplicate,
  onExport,
  onPrint,
  onShare,
  onValidate,
  onAutoFix,
  onRefresh,
  isValid,
  errorCount,
  hasUnsavedChanges,
  isLoading = false,
  compact = false,
  className = ''
}: QuickActionsProps) {
  const [showExportOptions, setShowExportOptions] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  // Ejecutar acción con estado de loading
  const executeAction = async (actionName: string, action: () => Promise<void>) => {
    setActionLoading(actionName)
    try {
      await action()
    } catch (error) {
      console.error(`Error in ${actionName}:`, error)
    } finally {
      setActionLoading(null)
    }
  }

  // Renderizar botón compacto
  const renderCompactButton = (
    key: string,
    icon: React.ComponentType<{ className?: string }>,
    onClick: () => void,
    title: string,
    variant: 'primary' | 'secondary' | 'danger' | 'warning' = 'secondary',
    disabled = false
  ) => {
    const Icon = icon
    const isActionLoading = actionLoading === key
    
    const variants = {
      primary: 'bg-blue-600 hover:bg-blue-700 text-white',
      secondary: 'bg-gray-100 hover:bg-gray-200 text-gray-700',
      danger: 'bg-red-600 hover:bg-red-700 text-white',
      warning: 'bg-yellow-500 hover:bg-yellow-600 text-white'
    }
    
    return (
      <button
        key={key}
        onClick={onClick}
        disabled={disabled || isLoading || isActionLoading}
        title={title}
        className={`
          p-2 rounded-md transition-colors duration-200 relative
          ${variants[variant]}
          ${disabled || isLoading ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        {isActionLoading ? (
          <ArrowPathIcon className="w-4 h-4 animate-spin" />
        ) : (
          <Icon className="w-4 h-4" />
        )}
      </button>
    )
  }

  // Renderizar botón normal
  const renderButton = (
    key: string,
    icon: React.ComponentType<{ className?: string }>,
    label: string,
    onClick: () => void,
    variant: 'primary' | 'secondary' | 'danger' | 'warning' = 'secondary',
    disabled = false
  ) => {
    const Icon = icon
    const isActionLoading = actionLoading === key
    
    const variants = {
      primary: 'bg-blue-600 hover:bg-blue-700 text-white border-blue-600',
      secondary: 'bg-white hover:bg-gray-50 text-gray-700 border-gray-300',
      danger: 'bg-red-600 hover:bg-red-700 text-white border-red-600',
      warning: 'bg-yellow-500 hover:bg-yellow-600 text-white border-yellow-500'
    }
    
    return (
      <button
        key={key}
        onClick={onClick}
        disabled={disabled || isLoading || isActionLoading}
        className={`
          flex items-center px-3 py-2 text-sm font-medium border rounded-md transition-colors duration-200
          ${variants[variant]}
          ${disabled || isLoading ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        {isActionLoading ? (
          <ArrowPathIcon className="w-4 h-4 mr-2 animate-spin" />
        ) : (
          <Icon className="w-4 h-4 mr-2" />
        )}
        {label}
      </button>
    )
  }

  const actions = [
    // Acciones principales
    {
      key: 'save',
      icon: DocumentArrowDownIcon,
      label: 'Guardar',
      action: () => executeAction('save', onSave),
      variant: hasUnsavedChanges ? 'primary' : 'secondary',
      priority: 1
    },
    {
      key: 'validate',
      icon: CheckCircleIcon,
      label: 'Validar',
      action: () => executeAction('validate', onValidate),
      variant: errorCount > 0 ? 'warning' : 'secondary',
      priority: 2
    },
    {
      key: 'confirm',
      icon: PlayIcon,
      label: 'Confirmar Todo',
      action: () => executeAction('confirm', onConfirmAll),
      variant: 'primary',
      priority: 3
    },
    
    // Acciones de corrección
    ...(onAutoFix ? [{
      key: 'autofix',
      icon: SparklesIcon,
      label: 'Auto-corregir',
      action: () => executeAction('autofix', onAutoFix),
      variant: 'warning' as const,
      priority: 4,
      disabled: isValid
    }] : []),
    
    // Acciones de archivo
    ...(onLoad ? [{
      key: 'load',
      icon: DocumentArrowUpIcon,
      label: 'Cargar',
      action: () => executeAction('load', onLoad),
      variant: 'secondary' as const,
      priority: 5
    }] : []),
    
    ...(onDuplicate ? [{
      key: 'duplicate',
      icon: DocumentDuplicateIcon,
      label: 'Duplicar',
      action: () => executeAction('duplicate', onDuplicate),
      variant: 'secondary' as const,
      priority: 6
    }] : []),
    
    // Acciones de exportación
    ...(onPrint ? [{
      key: 'print',
      icon: PrinterIcon,
      label: 'Imprimir',
      action: () => onPrint(),
      variant: 'secondary' as const,
      priority: 7
    }] : []),
    
    ...(onShare ? [{
      key: 'share',
      icon: ShareIcon,
      label: 'Compartir',
      action: () => onShare(),
      variant: 'secondary' as const,
      priority: 8
    }] : []),
    
    // Acciones destructivas
    {
      key: 'clear',
      icon: TrashIcon,
      label: 'Limpiar Todo',
      action: () => executeAction('clear', onClearAll),
      variant: 'danger',
      priority: 9
    },
    
    // Refresh
    ...(onRefresh ? [{
      key: 'refresh',
      icon: ArrowPathIcon,
      label: 'Actualizar',
      action: () => executeAction('refresh', onRefresh),
      variant: 'secondary' as const,
      priority: 10
    }] : [])
  ]

  if (compact) {
    // Modo compacto - solo iconos
    const priorityActions = actions
      .filter(action => action.priority <= 6)
      .sort((a, b) => a.priority - b.priority)
    
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        {priorityActions.map(action => 
          renderCompactButton(
            action.key,
            action.icon,
            action.action,
            action.label,
            action.variant as any,
            action.disabled
          )
        )}
        
        {/* Indicador de estado */}
        <div className="flex items-center ml-4 space-x-2">
          {hasUnsavedChanges && (
            <div className="w-2 h-2 bg-yellow-500 rounded-full" title="Cambios sin guardar" />
          )}
          {!isValid && (
            <div className="flex items-center text-red-600">
              <ExclamationTriangleIcon className="w-4 h-4 mr-1" />
              <span className="text-xs">{errorCount}</span>
            </div>
          )}
          {isValid && (
            <CheckCircleIcon className="w-4 h-4 text-green-600" title="Horario válido" />
          )}
        </div>
      </div>
    )
  }

  // Modo normal - con etiquetas
  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Acciones Rápidas</h3>
          
          {/* Estado del horario */}
          <div className="flex items-center space-x-3">
            {hasUnsavedChanges && (
              <div className="flex items-center text-yellow-600 text-sm">
                <ClockIcon className="w-4 h-4 mr-1" />
                <span>Cambios sin guardar</span>
              </div>
            )}
            
            <div className={`flex items-center text-sm ${
              isValid ? 'text-green-600' : 'text-red-600'
            }`}>
              {isValid ? (
                <>
                  <CheckCircleIcon className="w-4 h-4 mr-1" />
                  <span>Horario válido</span>
                </>
              ) : (
                <>
                  <ExclamationTriangleIcon className="w-4 h-4 mr-1" />
                  <span>{errorCount} errores</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Acciones agrupadas */}
        <div className="space-y-4">
          {/* Acciones principales */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Principal</h4>
            <div className="flex flex-wrap gap-2">
              {actions
                .filter(action => action.priority <= 4)
                .sort((a, b) => a.priority - b.priority)
                .map(action => 
                  renderButton(
                    action.key,
                    action.icon,
                    action.label,
                    action.action,
                    action.variant as any,
                    action.disabled
                  )
                )}
            </div>
          </div>

          {/* Acciones de archivo y exportación */}
          {actions.some(action => action.priority >= 5 && action.priority <= 8) && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Archivo y Exportación</h4>
              <div className="flex flex-wrap gap-2">
                {actions
                  .filter(action => action.priority >= 5 && action.priority <= 8)
                  .sort((a, b) => a.priority - b.priority)
                  .map(action => 
                    renderButton(
                      action.key,
                      action.icon,
                      action.label,
                      action.action,
                      action.variant as any,
                      action.disabled
                    )
                  )}
                
                {/* Botón de exportación con menú desplegable */}
                {onExport && (
                  <div className="relative">
                    <button
                      onClick={() => setShowExportOptions(!showExportOptions)}
                      className="flex items-center px-3 py-2 text-sm font-medium bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 rounded-md transition-colors"
                    >
                      <DocumentArrowDownIcon className="w-4 h-4 mr-2" />
                      Exportar
                    </button>
                    
                    {showExportOptions && (
                      <div className="absolute top-full left-0 mt-1 w-32 bg-white border border-gray-200 rounded-md shadow-lg z-10">
                        <button
                          onClick={() => {
                            executeAction('export-pdf', () => onExport('pdf'))
                            setShowExportOptions(false)
                          }}
                          className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                        >
                          PDF
                        </button>
                        <button
                          onClick={() => {
                            executeAction('export-excel', () => onExport('excel'))
                            setShowExportOptions(false)
                          }}
                          className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                        >
                          Excel
                        </button>
                        <button
                          onClick={() => {
                            executeAction('export-csv', () => onExport('csv'))
                            setShowExportOptions(false)
                          }}
                          className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                        >
                          CSV
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Acciones destructivas */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Otras Acciones</h4>
            <div className="flex flex-wrap gap-2">
              {actions
                .filter(action => action.priority >= 9)
                .sort((a, b) => a.priority - b.priority)
                .map(action => 
                  renderButton(
                    action.key,
                    action.icon,
                    action.label,
                    action.action,
                    action.variant as any,
                    action.disabled
                  )
                )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default QuickActions