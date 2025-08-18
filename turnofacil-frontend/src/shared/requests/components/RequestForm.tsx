/**
 * Formulario Universal para Requests
 * @fileoverview Formulario adaptable para crear/editar requests
 */

'use client'

import React, { useState, useEffect } from 'react'
import {
  CreateRequestData,
  UpdateRequestData,
  RequestContext,
  RequestType,
  RequestPriority,
  TeamRequest
} from '../core/types'
import { REQUEST_TYPE_CONFIG, REQUEST_PRIORITY_CONFIG, VALIDATION_RULES } from '../core/constants'
import { RequestPermissionManager } from '../core/permissions'

interface RequestFormProps {
  context: RequestContext
  mode: 'create' | 'edit'
  request?: TeamRequest
  onSubmit: (data: CreateRequestData | UpdateRequestData) => Promise<void>
  onCancel?: () => void
  disabled?: boolean
  className?: string
}

export function RequestForm({
  context,
  mode,
  request,
  onSubmit,
  onCancel,
  disabled = false,
  className = ''
}: RequestFormProps) {

  // ========== ESTADO ==========

  const [formData, setFormData] = useState<Partial<CreateRequestData>>({
    type: 'personal_leave',
    priority: 'medium',
    reason: '',
    description: '',
    requestedDate: '',
    startDate: '',
    endDate: '',
    details: {}
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)

  const permissionManager = new RequestPermissionManager(context)

  // ========== EFECTOS ==========

  useEffect(() => {
    if (request && mode === 'edit') {
      setFormData({
        type: request.type,
        priority: request.priority,
        reason: request.reason,
        description: request.description,
        requestedDate: request.requestedDate,
        startDate: request.startDate,
        endDate: request.endDate,
        details: request.details
      })
    }
  }, [request, mode])

  // ========== HANDLERS ==========

  const handleInputChange = (field: keyof CreateRequestData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Limpiar error del campo
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }

    // Configurar valores automáticos según el tipo
    if (field === 'type' && value) {
      const typeConfig = REQUEST_TYPE_CONFIG[value as RequestType]
      if (typeConfig) {
        setFormData(prev => ({
          ...prev,
          priority: typeConfig.defaultPriority,
          // Limpiar fechas si el tipo cambió
          requestedDate: '',
          startDate: '',
          endDate: ''
        }))
      }
    }
  }

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {}

    if (step === 1) {
      // Validar tipo
      if (!formData.type) {
        newErrors.type = 'Selecciona un tipo de solicitud'
      }

      // Validar fechas según el tipo
      const typeConfig = formData.type ? REQUEST_TYPE_CONFIG[formData.type] : null
      if (typeConfig) {
        // Fecha requerida
        if (typeConfig.requiredFields.includes('requestedDate') && !formData.requestedDate) {
          newErrors.requestedDate = 'La fecha es obligatoria'
        }

        if (typeConfig.requiredFields.includes('startDate') && !formData.startDate) {
          newErrors.startDate = 'La fecha de inicio es obligatoria'
        }

        if (typeConfig.requiredFields.includes('endDate') && !formData.endDate) {
          newErrors.endDate = 'La fecha de fin es obligatoria'
        }

        // Validar rango de fechas
        if (formData.startDate && formData.endDate) {
          const start = new Date(formData.startDate)
          const end = new Date(formData.endDate)
          if (start > end) {
            newErrors.endDate = 'La fecha de fin debe ser posterior a la de inicio'
          }
        }

        // Validar tiempo de anticipación
        const requestDate = formData.requestedDate || formData.startDate
        if (requestDate) {
          const targetDate = new Date(requestDate)
          const now = new Date()
          const daysDiff = Math.ceil((targetDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
          
          if (daysDiff < typeConfig.minAdvanceDays) {
            const field = formData.requestedDate ? 'requestedDate' : 'startDate'
            newErrors[field] = `Se requieren al menos ${typeConfig.minAdvanceDays} días de anticipación`
          }

          if (daysDiff > typeConfig.maxAdvanceDays) {
            const field = formData.requestedDate ? 'requestedDate' : 'startDate'
            newErrors[field] = `No se puede solicitar con más de ${typeConfig.maxAdvanceDays} días de anticipación`
          }
        }
      }
    }

    if (step === 2) {
      // Validar motivo
      if (!formData.reason?.trim()) {
        newErrors.reason = 'El motivo es obligatorio'
      } else if (formData.reason.length > 100) {
        newErrors.reason = 'El motivo es demasiado largo (máximo 100 caracteres)'
      }

      // Validar descripción
      if (formData.description && formData.description.length > 500) {
        newErrors.description = 'La descripción es demasiado larga (máximo 500 caracteres)'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => prev + 1)
    }
  }

  const handlePrevious = () => {
    setCurrentStep(prev => prev - 1)
  }

  const handleSubmit = async () => {
    if (!validateStep(1) || !validateStep(2)) return

    setIsSubmitting(true)
    try {
      if (mode === 'create') {
        await onSubmit(formData as CreateRequestData)
      } else if (mode === 'edit' && request) {
        await onSubmit({ ...formData, id: request.id } as UpdateRequestData)
      }
    } catch (error) {
      console.error('Error submitting form:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  // ========== HELPERS ==========

  const getAvailableTypes = () => {
    return Object.entries(REQUEST_TYPE_CONFIG)
      .filter(([key]) => permissionManager.canCreateRequestType(key as RequestType))
      .map(([key, config]) => ({
        value: key as RequestType,
        label: config.name,
        description: config.description,
        icon: config.icon,
        color: config.color
      }))
  }

  const getAvailablePriorities = () => {
    const selectedType = formData.type
    const typeConfig = selectedType ? REQUEST_TYPE_CONFIG[selectedType] : null
    
    return Object.entries(REQUEST_PRIORITY_CONFIG)
      .filter(([key]) => {
        if (!typeConfig) return true
        if (key === 'urgent' || key === 'emergency') {
          return typeConfig.canBeUrgent
        }
        return true
      })
      .map(([key, config]) => ({
        value: key as RequestPriority,
        label: config.name,
        description: config.description,
        icon: config.icon,
        color: config.color
      }))
  }

  const getTypeConfig = () => {
    return formData.type ? REQUEST_TYPE_CONFIG[formData.type] : null
  }

  const getTotalSteps = () => 2

  // ========== RENDER STEPS ==========

  const renderStep1 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Tipo y fechas de la solicitud
        </h3>
      </div>

      {/* Tipo de solicitud */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Tipo de solicitud *
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {getAvailableTypes().map(type => (
            <button
              key={type.value}
              type="button"
              onClick={() => handleInputChange('type', type.value)}
              className={`p-4 rounded-lg border-2 transition-all text-left ${
                formData.type === type.value
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl">{type.icon}</span>
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{type.label}</h4>
                  <p className="text-sm text-gray-500 mt-1">{type.description}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
        {errors.type && <p className="text-red-500 text-sm mt-2">{errors.type}</p>}
      </div>

      {/* Configuración específica del tipo */}
      {formData.type && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <span className="text-2xl">{REQUEST_TYPE_CONFIG[formData.type].icon}</span>
            <div>
              <h4 className="font-medium text-blue-900">
                {REQUEST_TYPE_CONFIG[formData.type].name}
              </h4>
              <p className="text-sm text-blue-700 mt-1">
                {REQUEST_TYPE_CONFIG[formData.type].description}
              </p>
              {REQUEST_TYPE_CONFIG[formData.type].minAdvanceDays > 0 && (
                <p className="text-xs text-blue-600 mt-2">
                  ⏰ Requiere {REQUEST_TYPE_CONFIG[formData.type].minAdvanceDays} días de anticipación mínima
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Fechas según configuración del tipo */}
      {formData.type && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Fecha solicitada */}
            {REQUEST_TYPE_CONFIG[formData.type]?.requiredFields.includes('requestedDate') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha solicitada *
                </label>
                <input
                  type="date"
                  value={formData.requestedDate || ''}
                  onChange={(e) => handleInputChange('requestedDate', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.requestedDate ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.requestedDate && <p className="text-red-500 text-sm mt-1">{errors.requestedDate}</p>}
              </div>
            )}

            {/* Fecha de inicio */}
            {REQUEST_TYPE_CONFIG[formData.type]?.requiredFields.includes('startDate') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha de inicio *
                </label>
                <input
                  type="date"
                  value={formData.startDate || ''}
                  onChange={(e) => handleInputChange('startDate', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.startDate ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.startDate && <p className="text-red-500 text-sm mt-1">{errors.startDate}</p>}
              </div>
            )}

            {/* Fecha de fin */}
            {REQUEST_TYPE_CONFIG[formData.type]?.requiredFields.includes('endDate') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha de fin *
                </label>
                <input
                  type="date"
                  value={formData.endDate || ''}
                  onChange={(e) => handleInputChange('endDate', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.endDate ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.endDate && <p className="text-red-500 text-sm mt-1">{errors.endDate}</p>}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Prioridad */}
      {formData.type && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Prioridad
          </label>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            {getAvailablePriorities().map(priority => (
              <button
                key={priority.value}
                type="button"
                onClick={() => handleInputChange('priority', priority.value)}
                className={`p-3 rounded-lg border-2 transition-all text-center ${
                  formData.priority === priority.value
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="text-lg mb-1">{priority.icon}</div>
                <div className="text-sm font-medium text-gray-900">{priority.label}</div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )

  const renderStep2 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Motivo y detalles
        </h3>
      </div>

      {/* Motivo */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Motivo de la solicitud *
        </label>
        <input
          type="text"
          value={formData.reason || ''}
          onChange={(e) => handleInputChange('reason', e.target.value)}
          placeholder="Breve descripción del motivo"
          maxLength={100}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors.reason ? 'border-red-500' : 'border-gray-300'
          }`}
        />
        {errors.reason && <p className="text-red-500 text-sm mt-1">{errors.reason}</p>}
        <p className="text-gray-500 text-sm mt-1">
          {formData.reason?.length || 0}/100 caracteres
        </p>
      </div>

      {/* Descripción adicional */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Descripción adicional
        </label>
        <textarea
          value={formData.description || ''}
          onChange={(e) => handleInputChange('description', e.target.value)}
          placeholder="Información adicional que consideres relevante"
          maxLength={500}
          rows={5}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none ${
            errors.description ? 'border-red-500' : 'border-gray-300'
          }`}
        />
        {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
        <p className="text-gray-500 text-sm mt-1">
          {formData.description?.length || 0}/500 caracteres
        </p>
      </div>

      {/* Resumen de la solicitud */}
      {formData.type && formData.reason && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-3">Resumen de tu solicitud</h4>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-gray-600">Tipo:</span>
              <span className="font-medium">
                {REQUEST_TYPE_CONFIG[formData.type].icon} {REQUEST_TYPE_CONFIG[formData.type].name}
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-gray-600">Prioridad:</span>
              <span className="font-medium">
                {REQUEST_PRIORITY_CONFIG[formData.priority!].icon} {REQUEST_PRIORITY_CONFIG[formData.priority!].name}
              </span>
            </div>

            {formData.requestedDate && (
              <div className="flex items-center gap-2">
                <span className="text-gray-600">Fecha:</span>
                <span className="font-medium">
                  {new Date(formData.requestedDate).toLocaleDateString('es-CO')}
                </span>
              </div>
            )}

            {formData.startDate && formData.endDate && (
              <div className="flex items-center gap-2">
                <span className="text-gray-600">Período:</span>
                <span className="font-medium">
                  {new Date(formData.startDate).toLocaleDateString('es-CO')} - {new Date(formData.endDate).toLocaleDateString('es-CO')}
                </span>
              </div>
            )}

            <div className="flex items-start gap-2">
              <span className="text-gray-600">Motivo:</span>
              <span className="font-medium">{formData.reason}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )

  // ========== RENDER ==========

  return (
    <div className={`bg-white rounded-lg border ${className}`}>
      {/* Progress bar */}
      <div className="px-6 py-4 border-b">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl font-semibold text-gray-900">
            {mode === 'create' ? 'Nueva solicitud' : 'Editar solicitud'}
          </h2>
          <span className="text-sm text-gray-500">
            Paso {currentStep} de {getTotalSteps()}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${(currentStep / getTotalSteps()) * 100}%` }}
          />
        </div>
      </div>

      {/* Form content */}
      <div className="p-6">
        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
      </div>

      {/* Form actions */}
      <div className="flex items-center justify-between px-6 py-4 border-t bg-gray-50">
        <div>
          {currentStep > 1 && (
            <button
              onClick={handlePrevious}
              disabled={disabled || isSubmitting}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50"
            >
              ← Anterior
            </button>
          )}
        </div>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={disabled || isSubmitting}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50"
          >
            Cancelar
          </button>

          {currentStep < getTotalSteps() ? (
            <button
              onClick={handleNext}
              disabled={disabled || isSubmitting}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              Siguiente →
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={disabled || isSubmitting}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
            >
              {isSubmitting && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              {mode === 'create' ? 'Enviar solicitud' : 'Guardar cambios'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}