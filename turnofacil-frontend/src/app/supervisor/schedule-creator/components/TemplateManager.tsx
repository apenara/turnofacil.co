/**
 * Componente TemplateManager
 * @fileoverview Gestor de plantillas de turnos para aplicación rápida y reutilización
 */

'use client'

import React, { useState } from 'react'
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  ClockIcon,
  DocumentDuplicateIcon,
  SwatchIcon,
  CheckIcon
} from '@heroicons/react/24/outline'
import { ShiftTemplate, ShiftType } from '../types'
import { 
  formatDuration,
  calculateHoursBetween,
  getShiftTypeColor,
  crossesMidnight
} from '../utils'

/**
 * Props del componente TemplateManager
 */
export interface TemplateManagerProps {
  /**
   * Lista de plantillas existentes
   */
  templates: ShiftTemplate[]
  
  /**
   * Función para crear nueva plantilla
   */
  onCreateTemplate: (template: Omit<ShiftTemplate, 'id'>) => Promise<void>
  
  /**
   * Función para actualizar plantilla
   */
  onUpdateTemplate: (id: string, template: Partial<ShiftTemplate>) => Promise<void>
  
  /**
   * Función para eliminar plantilla
   */
  onDeleteTemplate: (id: string) => Promise<void>
  
  /**
   * Función para aplicar plantilla a empleados
   */
  onApplyTemplate?: (templateId: string, employeeIds: string[], dates: string[]) => Promise<void>
  
  /**
   * Lista de empleados (para aplicación masiva)
   */
  employees?: Array<{ id: string; name: string; position: string }>
  
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
 * Colores predefinidos para plantillas
 */
const TEMPLATE_COLORS = [
  '#10B981', // Verde
  '#3B82F6', // Azul
  '#8B5CF6', // Púrpura
  '#EF4444', // Rojo
  '#F59E0B', // Ámbar
  '#EC4899', // Rosa
  '#6366F1', // Índigo
  '#14B8A6', // Teal
]

/**
 * Gestor de plantillas de turnos
 */
export function TemplateManager({
  templates,
  onCreateTemplate,
  onUpdateTemplate,
  onDeleteTemplate,
  onApplyTemplate,
  employees = [],
  isLoading = false,
  className = ''
}: TemplateManagerProps) {
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<ShiftTemplate | null>(null)
  const [showApplyModal, setShowApplyModal] = useState<ShiftTemplate | null>(null)
  
  // Estado del formulario
  const [formData, setFormData] = useState({
    name: '',
    startTime: '09:00',
    endTime: '17:00',
    type: 'regular' as ShiftType,
    color: TEMPLATE_COLORS[0],
    description: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Reset del formulario
  const resetForm = () => {
    setFormData({
      name: '',
      startTime: '09:00',
      endTime: '17:00',
      type: 'regular',
      color: TEMPLATE_COLORS[0],
      description: ''
    })
    setEditingTemplate(null)
    setShowCreateForm(false)
  }

  // Cargar datos para edición
  const handleEdit = (template: ShiftTemplate) => {
    setFormData({
      name: template.name,
      startTime: template.startTime,
      endTime: template.endTime,
      type: template.type,
      color: template.color,
      description: template.description || ''
    })
    setEditingTemplate(template)
    setShowCreateForm(true)
  }

  // Calcular propiedades de la plantilla
  const calculateTemplateProperties = () => {
    const duration = calculateHoursBetween(formData.startTime, formData.endTime)
    const crossesNight = crossesMidnight(formData.startTime, formData.endTime)
    
    return {
      duration,
      crossesMidnight: crossesNight
    }
  }

  // Manejar envío del formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim() || !formData.startTime || !formData.endTime) {
      return
    }
    
    setIsSubmitting(true)
    
    try {
      const properties = calculateTemplateProperties()
      const templateData = {
        name: formData.name.trim(),
        startTime: formData.startTime,
        endTime: formData.endTime,
        duration: properties.duration,
        type: formData.type,
        color: formData.color,
        description: formData.description.trim() || undefined,
        crossesMidnight: properties.crossesMidnight
      }
      
      if (editingTemplate) {
        await onUpdateTemplate(editingTemplate.id, templateData)
      } else {
        await onCreateTemplate(templateData)
      }
      
      resetForm()
    } catch (error) {
      console.error('Error saving template:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Renderizar formulario de creación/edición
  const renderForm = () => (
    <div className="p-6 border-b border-gray-200 bg-gray-50">
      <form onSubmit={handleSubmit} className="space-y-4">
        <h4 className="font-medium text-gray-900 mb-4">
          {editingTemplate ? 'Editar Plantilla' : 'Nueva Plantilla'}
        </h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nombre de la plantilla
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ej: Turno Mañana"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de turno
            </label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as ShiftType })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="regular">Regular</option>
              <option value="overtime">Horas extras</option>
              <option value="night">Nocturno</option>
              <option value="holiday">Festivo</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Hora de inicio
            </label>
            <input
              type="time"
              value={formData.startTime}
              onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Hora de fin
            </label>
            <input
              type="time"
              value={formData.endTime}
              onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Color
          </label>
          <div className="flex items-center space-x-2">
            {TEMPLATE_COLORS.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => setFormData({ ...formData, color })}
                className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${
                  formData.color === color ? 'border-gray-400 scale-110' : 'border-gray-200'
                }`}
                style={{ backgroundColor: color }}
              >
                {formData.color === color && (
                  <CheckIcon className="w-4 h-4 text-white" />
                )}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Descripción (opcional)
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={2}
            placeholder="Descripción de la plantilla..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Previsualización */}
        {formData.startTime && formData.endTime && (
          <div className="bg-white rounded-md p-4 border border-gray-200">
            <h5 className="font-medium text-gray-900 mb-2">Previsualización</h5>
            <div className="flex items-center space-x-4 text-sm">
              <div className="flex items-center">
                <div 
                  className="w-4 h-4 rounded mr-2"
                  style={{ backgroundColor: formData.color }}
                />
                <span>{formData.name || 'Sin nombre'}</span>
              </div>
              <div className="flex items-center">
                <ClockIcon className="w-4 h-4 mr-1 text-gray-400" />
                <span>{formData.startTime} - {formData.endTime}</span>
              </div>
              <div>
                <span className="text-gray-500">
                  ({formatDuration(calculateTemplateProperties().duration)})
                </span>
              </div>
              {calculateTemplateProperties().crossesMidnight && (
                <span className="text-blue-600 text-xs">Cruza medianoche</span>
              )}
            </div>
          </div>
        )}

        <div className="flex items-center justify-end space-x-3">
          <button
            type="button"
            onClick={resetForm}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            disabled={isSubmitting}
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSubmitting || !formData.name.trim()}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? 'Guardando...' : (editingTemplate ? 'Actualizar' : 'Crear')} Plantilla
          </button>
        </div>
      </form>
    </div>
  )

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            Plantillas de Turnos ({templates.length})
          </h3>
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="flex items-center px-3 py-2 text-sm font-medium text-blue-700 bg-blue-100 border border-blue-200 rounded-md hover:bg-blue-200 transition-colors"
          >
            <PlusIcon className="w-4 h-4 mr-2" />
            Nueva Plantilla
          </button>
        </div>
      </div>

      {/* Formulario de creación/edición */}
      {showCreateForm && renderForm()}

      {/* Lista de plantillas */}
      <div className="p-6">
        {templates.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <DocumentDuplicateIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No hay plantillas creadas</p>
            <p className="text-sm mt-2">
              Crea plantillas para aplicar turnos rápidamente
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {templates.map((template) => (
              <div
                key={template.id}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center">
                    <div 
                      className="w-4 h-4 rounded mr-3 flex-shrink-0"
                      style={{ backgroundColor: template.color }}
                    />
                    <div>
                      <h4 className="font-medium text-gray-900">{template.name}</h4>
                      <p className="text-sm text-gray-500 capitalize">{template.type}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => handleEdit(template)}
                      className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                      title="Editar"
                    >
                      <PencilIcon className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDeleteTemplate(template.id)}
                      className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                      title="Eliminar"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center">
                    <ClockIcon className="w-4 h-4 mr-2" />
                    <span>{template.startTime} - {template.endTime}</span>
                    <span className="ml-2 text-gray-500">
                      ({formatDuration(template.duration)})
                    </span>
                  </div>
                  
                  {template.crossesMidnight && (
                    <div className="text-blue-600 text-xs">
                      ⚠️ Cruza medianoche
                    </div>
                  )}
                  
                  {template.description && (
                    <p className="text-gray-500 text-sm mt-2">
                      {template.description}
                    </p>
                  )}
                </div>

                {/* Botón de aplicar (si hay función disponible) */}
                {onApplyTemplate && employees.length > 0 && (
                  <button
                    onClick={() => setShowApplyModal(template)}
                    className="mt-3 w-full px-3 py-2 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 transition-colors"
                  >
                    <SwatchIcon className="w-4 h-4 inline mr-2" />
                    Aplicar a Empleados
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de aplicación masiva (simplificado) */}
      {showApplyModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setShowApplyModal(null)} />
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Aplicar Plantilla: {showApplyModal.name}
                </h3>
                <p className="text-gray-600 mb-4">
                  Esta funcionalidad se implementará en una versión futura para aplicar plantillas masivamente a múltiples empleados.
                </p>
                <button
                  onClick={() => setShowApplyModal(null)}
                  className="w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
                >
                  Entendido
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default TemplateManager