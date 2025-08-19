/**
 * Modal Universal para Requests
 * @fileoverview Modal adaptable para ver/crear/editar requests
 */

'use client'

import React, { useState, useEffect } from 'react'
import {
  TeamRequest,
  CreateRequestData,
  UpdateRequestData,
  RequestContext,
  RequestType,
  RequestPriority
} from '../core/types'
import { REQUEST_TYPE_CONFIG, REQUEST_PRIORITY_CONFIG, VALIDATION_RULES } from '../core/constants'
import { RequestPermissionManager } from '../core/permissions'

interface RequestModalProps {
  isOpen: boolean
  onClose: () => void
  context: RequestContext
  mode: 'create' | 'edit' | 'view'
  request?: TeamRequest
  onSave?: (data: CreateRequestData | UpdateRequestData) => Promise<void>
  onDelete?: (id: string) => Promise<void>
  className?: string
}

export function RequestModal({
  isOpen,
  onClose,
  context,
  mode,
  request,
  onSave,
  onDelete,
  className = ''
}: RequestModalProps) {

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
  const [isLoading, setIsLoading] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const permissionManager = new RequestPermissionManager(context)

  // ========== EFECTOS ==========

  useEffect(() => {
    if (request && (mode === 'edit' || mode === 'view')) {
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
    } else if (mode === 'create') {
      setFormData({
        type: 'personal_leave',
        priority: 'medium',
        reason: '',
        description: '',
        requestedDate: '',
        startDate: '',
        endDate: '',
        details: {}
      })
    }
    setErrors({})
  }, [request, mode, isOpen])

  // ========== HANDLERS ==========

  const handleInputChange = (field: keyof CreateRequestData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Limpiar error del campo
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }

    // Validaciones específicas
    if (field === 'type' && value) {
      const typeConfig = REQUEST_TYPE_CONFIG[value as RequestType]
      if (typeConfig) {
        setFormData(prev => ({
          ...prev,
          priority: typeConfig.defaultPriority
        }))
      }
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    // Validar campos requeridos
    if (!formData.type) {
      newErrors.type = 'El tipo de solicitud es obligatorio'
    }

    if (!formData.reason?.trim()) {
      newErrors.reason = 'El motivo es obligatorio'
    }

    if (formData.reason && formData.reason.length > VALIDATION_RULES.errorMessages.MISSING_REQUIRED_FIELD.length) {
      newErrors.reason = 'El motivo es demasiado largo'
    }

    // Validar fechas según el tipo
    const typeConfig = formData.type ? REQUEST_TYPE_CONFIG[formData.type] : null
    if (typeConfig) {
      // Validar fecha requerida según configuración
      if ((typeConfig.requiredFields as any).includes('requestedDate') && !formData.requestedDate) {
        newErrors.requestedDate = 'La fecha solicitada es obligatoria'
      }

      if ((typeConfig.requiredFields as any).includes('startDate') && !formData.startDate) {
        newErrors.startDate = 'La fecha de inicio es obligatoria'
      }

      if ((typeConfig.requiredFields as any).includes('endDate') && !formData.endDate) {
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

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSave = async () => {
    if (!validateForm()) return

    setIsLoading(true)
    try {
      if (mode === 'create') {
        await onSave?.(formData as CreateRequestData)
      } else if (mode === 'edit' && request) {
        await onSave?.({ ...formData, id: request.id } as UpdateRequestData)
      }
      onClose()
    } catch (error) {
      console.error('Error saving request:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!request) return

    setIsLoading(true)
    try {
      await onDelete?.(request.id)
      onClose()
    } catch (error) {
      console.error('Error deleting request:', error)
    } finally {
      setIsLoading(false)
      setShowDeleteConfirm(false)
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
        icon: config.icon
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
        icon: config.icon
      }))
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return ''
    return new Date(dateString).toLocaleDateString('es-CO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const canEdit = mode === 'create' || (mode === 'edit' && request && permissionManager.canManageRequest(request, 'edit'))
  const canDelete = mode === 'edit' && request && permissionManager.canManageRequest(request, 'delete')

  // ========== RENDER ==========

  if (!isOpen) return null

  return (
    <div className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 ${className}`}>
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {mode === 'create' && 'Nueva solicitud'}
              {mode === 'edit' && 'Editar solicitud'}
              {mode === 'view' && 'Detalle de solicitud'}
            </h2>
            {request && (
              <p className="text-sm text-gray-500 mt-1">
                ID: {request.id} • Enviada: {formatDate(request.submittedDate)}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {/* Tipo de solicitud */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de solicitud *
            </label>
            <select
              value={formData.type || ''}
              onChange={(e) => handleInputChange('type', e.target.value)}
              disabled={!canEdit}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.type ? 'border-red-500' : 'border-gray-300'
              } ${!canEdit ? 'bg-gray-100' : ''}`}
            >
              <option value="">Seleccionar tipo</option>
              {getAvailableTypes().map(type => (
                <option key={type.value} value={type.value}>
                  {type.icon} {type.label}
                </option>
              ))}
            </select>
            {errors.type && <p className="text-red-500 text-sm mt-1">{errors.type}</p>}
            {formData.type && REQUEST_TYPE_CONFIG[formData.type] && (
              <p className="text-gray-500 text-sm mt-1">
                {REQUEST_TYPE_CONFIG[formData.type].description}
              </p>
            )}
          </div>

          {/* Prioridad */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Prioridad *
            </label>
            <select
              value={formData.priority || ''}
              onChange={(e) => handleInputChange('priority', e.target.value)}
              disabled={!canEdit}
              className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                !canEdit ? 'bg-gray-100' : ''
              }`}
            >
              {getAvailablePriorities().map(priority => (
                <option key={priority.value} value={priority.value}>
                  {priority.icon} {priority.label}
                </option>
              ))}
            </select>
          </div>

          {/* Fechas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Fecha solicitada */}
            {formData.type && (REQUEST_TYPE_CONFIG[formData.type]?.requiredFields as any)?.includes('requestedDate') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha solicitada *
                </label>
                <input
                  type="date"
                  value={formData.requestedDate || ''}
                  onChange={(e) => handleInputChange('requestedDate', e.target.value)}
                  disabled={!canEdit}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.requestedDate ? 'border-red-500' : 'border-gray-300'
                  } ${!canEdit ? 'bg-gray-100' : ''}`}
                />
                {errors.requestedDate && <p className="text-red-500 text-sm mt-1">{errors.requestedDate}</p>}
              </div>
            )}

            {/* Fecha de inicio */}
            {formData.type && (REQUEST_TYPE_CONFIG[formData.type]?.requiredFields as any)?.includes('startDate') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha de inicio *
                </label>
                <input
                  type="date"
                  value={formData.startDate || ''}
                  onChange={(e) => handleInputChange('startDate', e.target.value)}
                  disabled={!canEdit}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.startDate ? 'border-red-500' : 'border-gray-300'
                  } ${!canEdit ? 'bg-gray-100' : ''}`}
                />
                {errors.startDate && <p className="text-red-500 text-sm mt-1">{errors.startDate}</p>}
              </div>
            )}

            {/* Fecha de fin */}
            {formData.type && (REQUEST_TYPE_CONFIG[formData.type]?.requiredFields as any)?.includes('endDate') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha de fin *
                </label>
                <input
                  type="date"
                  value={formData.endDate || ''}
                  onChange={(e) => handleInputChange('endDate', e.target.value)}
                  disabled={!canEdit}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.endDate ? 'border-red-500' : 'border-gray-300'
                  } ${!canEdit ? 'bg-gray-100' : ''}`}
                />
                {errors.endDate && <p className="text-red-500 text-sm mt-1">{errors.endDate}</p>}
              </div>
            )}
          </div>

          {/* Motivo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Motivo *
            </label>
            <input
              type="text"
              value={formData.reason || ''}
              onChange={(e) => handleInputChange('reason', e.target.value)}
              disabled={!canEdit}
              placeholder="Breve motivo de la solicitud"
              maxLength={100}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.reason ? 'border-red-500' : 'border-gray-300'
              } ${!canEdit ? 'bg-gray-100' : ''}`}
            />
            {errors.reason && <p className="text-red-500 text-sm mt-1">{errors.reason}</p>}
            <p className="text-gray-500 text-sm mt-1">
              {formData.reason?.length || 0}/100 caracteres
            </p>
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Descripción adicional
            </label>
            <textarea
              value={formData.description || ''}
              onChange={(e) => handleInputChange('description', e.target.value)}
              disabled={!canEdit}
              placeholder="Información adicional sobre la solicitud"
              maxLength={500}
              rows={4}
              className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none ${
                !canEdit ? 'bg-gray-100' : ''
              }`}
            />
            <p className="text-gray-500 text-sm mt-1">
              {formData.description?.length || 0}/500 caracteres
            </p>
          </div>

          {/* Historial de aprobación (solo en modo view/edit) */}
          {request && request.approvalFlow.approvalHistory.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3">Historial de aprobación</h3>
              <div className="space-y-3">
                {request.approvalFlow.approvalHistory.map((review, index) => (
                  <div key={review.id} className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <span className="font-medium text-gray-900">{review.reviewerName}</span>
                        <span className="text-gray-500 text-sm ml-2">({review.reviewerRole})</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${
                            review.decision === 'approved' ? 'bg-green-100 text-green-800' :
                            review.decision === 'rejected' ? 'bg-red-100 text-red-800' :
                            review.decision === 'escalated' ? 'bg-purple-100 text-purple-800' :
                            'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {review.decision === 'approved' ? 'Aprobado' :
                           review.decision === 'rejected' ? 'Rechazado' :
                           review.decision === 'escalated' ? 'Escalado' :
                           'Requiere información'}
                        </span>
                        <span className="text-gray-500 text-xs">
                          {formatDate(review.reviewedAt)}
                        </span>
                      </div>
                    </div>
                    {review.comments && (
                      <p className="text-gray-700 text-sm">{review.comments}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t bg-gray-50">
          <div>
            {canDelete && (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                disabled={isLoading}
                className="px-4 py-2 text-red-600 hover:text-red-800 disabled:opacity-50"
              >
                Eliminar
              </button>
            )}
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50"
            >
              {mode === 'view' ? 'Cerrar' : 'Cancelar'}
            </button>
            
            {canEdit && (
              <button
                onClick={handleSave}
                disabled={isLoading}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
              >
                {isLoading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                {mode === 'create' ? 'Crear solicitud' : 'Guardar cambios'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Modal de confirmación de eliminación */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium mb-4">Confirmar eliminación</h3>
            <p className="text-gray-600 mb-6">
              ¿Estás seguro de que quieres eliminar esta solicitud? Esta acción no se puede deshacer.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isLoading}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                disabled={isLoading}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
              >
                {isLoading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}