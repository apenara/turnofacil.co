/**
 * Componente Universal de Lista de Requests
 * @fileoverview Lista adaptable para todos los dashboards de requests
 */

'use client'

import React, { useState, useMemo } from 'react'
import {
  TeamRequest,
  RequestContext,
  RequestFilters,
  RequestType,
  RequestStatus,
  RequestPriority
} from '../core/types'
import { REQUEST_TYPE_CONFIG, REQUEST_STATUS_CONFIG, REQUEST_PRIORITY_CONFIG } from '../core/constants'
import { useRequestCore, useEmployeeRequests, useSupervisorRequests, useBusinessAdminRequests } from '../hooks/useRequestCore'
import { useRequestFilters } from '../hooks/useRequestFilters'

interface UniversalRequestListProps {
  context: RequestContext
  mode?: 'employee' | 'supervisor' | 'business_admin' | 'custom'
  showFilters?: boolean
  showBulkActions?: boolean
  showMetrics?: boolean
  maxHeight?: string
  onRequestSelect?: (request: TeamRequest) => void
  onRequestAction?: (action: string, request: TeamRequest) => void
  customFilters?: Partial<RequestFilters>
  className?: string
}

export function UniversalRequestList({
  context,
  mode = 'custom',
  showFilters = true,
  showBulkActions = false,
  showMetrics = true,
  maxHeight = '500px',
  onRequestSelect,
  onRequestAction,
  customFilters = {},
  className = ''
}: UniversalRequestListProps) {

  // ========== CONFIGURACIÓN SEGÚN EL MODO ==========

  const hookConfig = useMemo(() => {
    const baseConfig = {
      context,
      autoRefresh: true,
      enableAnalytics: showMetrics,
      enableMetrics: showMetrics,
      initialFilters: customFilters
    }

    switch (mode) {
      case 'employee':
        return {
          ...baseConfig,
          enableAnalytics: false,
          enableMetrics: false,
          initialFilters: {
            ...customFilters,
            employee: [context.user.id],
            sortBy: 'date' as const,
            sortOrder: 'desc' as const
          }
        }
      case 'supervisor':
        return {
          ...baseConfig,
          refreshInterval: 20000,
          initialFilters: {
            ...customFilters,
            location: context.user.locationId ? [context.user.locationId] : 'all',
            sortBy: 'priority' as const,
            sortOrder: 'desc' as const
          }
        }
      case 'business_admin':
        return {
          ...baseConfig,
          refreshInterval: 15000,
          initialFilters: {
            ...customFilters,
            location: 'all',
            sortBy: 'priority' as const,
            sortOrder: 'desc' as const
          }
        }
      default:
        return baseConfig
    }
  }, [mode, context, showMetrics, customFilters])

  // Un solo hook con configuración dinámica
  const activeHook = useRequestCore(hookConfig)

  const {
    requests,
    selectedRequest,
    metrics,
    isLoading,
    error,
    setSelectedRequest,
    canPerformAction,
    approveRequest,
    rejectRequest,
    escalateRequest,
    bulkApprove,
    bulkReject
  } = activeHook

  // Hook de filtros
  const filterHook = useRequestFilters(context, requests, customFilters)
  const {
    filters,
    setFilter,
    clearFilters,
    applyPreset,
    availableTypes,
    availableStatuses,
    availablePriorities,
    activeFiltersCount,
    isFilterActive
  } = filterHook

  // ========== ESTADO LOCAL ==========

  const [selectedRequestIds, setSelectedRequestIds] = useState<string[]>([])
  const [showApprovalModal, setShowApprovalModal] = useState(false)
  const [showRejectionModal, setShowRejectionModal] = useState(false)
  const [pendingAction, setPendingAction] = useState<{
    type: 'approve' | 'reject' | 'escalate'
    requestId?: string
    bulk?: boolean
  } | null>(null)

  // ========== FILTROS APLICADOS ==========

  const filteredRequests = useMemo(() => {
    let filtered = [...requests]

    // Aplicar filtros básicos
    if (filters.status !== 'all') {
      const statuses = Array.isArray(filters.status) ? filters.status : [filters.status]
      filtered = filtered.filter(r => statuses.includes(r.status))
    }

    if (filters.type !== 'all') {
      const types = Array.isArray(filters.type) ? filters.type : [filters.type]
      filtered = filtered.filter(r => types.includes(r.type))
    }

    if (filters.priority !== 'all') {
      const priorities = Array.isArray(filters.priority) ? filters.priority : [filters.priority]
      filtered = filtered.filter(r => priorities.includes(r.priority))
    }

    if (filters.searchTerm) {
      const term = filters.searchTerm.toLowerCase()
      filtered = filtered.filter(r =>
        r.employeeName.toLowerCase().includes(term) ||
        r.reason.toLowerCase().includes(term) ||
        r.description?.toLowerCase().includes(term)
      )
    }

    // Aplicar ordenamiento
    if (filters.sortBy) {
      filtered.sort((a, b) => {
        let aValue: any, bValue: any

        switch (filters.sortBy) {
          case 'date':
            aValue = new Date(a.submittedDate)
            bValue = new Date(b.submittedDate)
            break
          case 'employee':
            aValue = a.employeeName
            bValue = b.employeeName
            break
          case 'priority':
            const priorityOrder = { emergency: 5, urgent: 4, high: 3, medium: 2, low: 1 }
            aValue = priorityOrder[a.priority] || 0
            bValue = priorityOrder[b.priority] || 0
            break
          default:
            return 0
        }

        if (aValue < bValue) return filters.sortOrder === 'desc' ? 1 : -1
        if (aValue > bValue) return filters.sortOrder === 'desc' ? -1 : 1
        return 0
      })
    }

    return filtered
  }, [requests, filters])

  // ========== HANDLERS ==========

  const handleRequestSelect = (request: TeamRequest) => {
    setSelectedRequest(request)
    onRequestSelect?.(request)
  }

  const handleBulkSelection = (requestId: string, selected: boolean) => {
    if (selected) {
      setSelectedRequestIds(prev => [...prev, requestId])
    } else {
      setSelectedRequestIds(prev => prev.filter(id => id !== requestId))
    }
  }

  const handleSelectAll = () => {
    if (selectedRequestIds.length === filteredRequests.length) {
      setSelectedRequestIds([])
    } else {
      setSelectedRequestIds(filteredRequests.map(r => r.id))
    }
  }

  const handleAction = async (action: string, request: TeamRequest) => {
    try {
      switch (action) {
        case 'approve':
          setPendingAction({ type: 'approve', requestId: request.id })
          setShowApprovalModal(true)
          break
        case 'reject':
          setPendingAction({ type: 'reject', requestId: request.id })
          setShowRejectionModal(true)
          break
        case 'escalate':
          await escalateRequest(request.id)
          break
        default:
          onRequestAction?.(action, request)
      }
    } catch (error) {
      console.error('Error performing action:', error)
    }
  }

  const handleBulkAction = async (action: 'approve' | 'reject') => {
    if (selectedRequestIds.length === 0) return

    try {
      if (action === 'approve') {
        setPendingAction({ type: 'approve', bulk: true })
        setShowApprovalModal(true)
      } else {
        setPendingAction({ type: 'reject', bulk: true })
        setShowRejectionModal(true)
      }
    } catch (error) {
      console.error('Error performing bulk action:', error)
    }
  }

  const confirmAction = async (comments?: string) => {
    if (!pendingAction) return

    try {
      if (pendingAction.bulk) {
        if (pendingAction.type === 'approve') {
          await bulkApprove(selectedRequestIds, comments)
        } else {
          await bulkReject(selectedRequestIds, comments || '')
        }
        setSelectedRequestIds([])
      } else if (pendingAction.requestId) {
        if (pendingAction.type === 'approve') {
          await approveRequest(pendingAction.requestId, comments)
        } else {
          await rejectRequest(pendingAction.requestId, comments || '')
        }
      }
    } catch (error) {
      console.error('Error confirming action:', error)
    } finally {
      setPendingAction(null)
      setShowApprovalModal(false)
      setShowRejectionModal(false)
    }
  }

  // ========== HELPERS ==========

  const getRequestTypeIcon = (type: RequestType) => REQUEST_TYPE_CONFIG[type]?.icon || '📋'
  const getRequestTypeName = (type: RequestType) => REQUEST_TYPE_CONFIG[type]?.name || type
  const getStatusColor = (status: RequestStatus) => REQUEST_STATUS_CONFIG[status]?.color || '#6B7280'
  const getStatusName = (status: RequestStatus) => REQUEST_STATUS_CONFIG[status]?.name || status
  const getPriorityColor = (priority: RequestPriority) => REQUEST_PRIORITY_CONFIG[priority]?.color || '#6B7280'
  const getPriorityName = (priority: RequestPriority) => REQUEST_PRIORITY_CONFIG[priority]?.name || priority

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  // ========== RENDER ==========

  if (error) {
    return (
      <div className={`rounded-lg border border-red-200 bg-red-50 p-4 ${className}`}>
        <p className="text-red-800">Error: {error}</p>
      </div>
    )
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Métricas */}
      {showMetrics && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg border p-4">
            <p className="text-sm text-gray-600">Total</p>
            <p className="text-2xl font-bold text-gray-900">{metrics.totalRequests}</p>
          </div>
          <div className="bg-white rounded-lg border p-4">
            <p className="text-sm text-gray-600">Pendientes</p>
            <p className="text-2xl font-bold text-orange-600">{metrics.pendingRequests}</p>
          </div>
          <div className="bg-white rounded-lg border p-4">
            <p className="text-sm text-gray-600">Aprobadas</p>
            <p className="text-2xl font-bold text-green-600">{metrics.approvedRequests}</p>
          </div>
          <div className="bg-white rounded-lg border p-4">
            <p className="text-sm text-gray-600">Rechazadas</p>
            <p className="text-2xl font-bold text-red-600">{metrics.rejectedRequests}</p>
          </div>
        </div>
      )}

      {/* Filtros */}
      {showFilters && (
        <div className="bg-white rounded-lg border p-4 space-y-4">
          <div className="flex flex-wrap gap-4">
            {/* Búsqueda */}
            <div className="flex-1 min-w-[200px]">
              <input
                type="text"
                placeholder="Buscar solicitudes..."
                value={filters.searchTerm || ''}
                onChange={(e) => setFilter('searchTerm', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Estado */}
            <select
              value={Array.isArray(filters.status) ? 'multiple' : filters.status}
              onChange={(e) => setFilter('status', e.target.value as RequestStatus | 'all')}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Todos los estados</option>
              {availableStatuses.map(status => (
                <option key={status.value} value={status.value}>
                  {status.label} ({status.count})
                </option>
              ))}
            </select>

            {/* Tipo */}
            <select
              value={Array.isArray(filters.type) ? 'multiple' : filters.type}
              onChange={(e) => setFilter('type', e.target.value as RequestType | 'all')}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Todos los tipos</option>
              {availableTypes.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label} ({type.count})
                </option>
              ))}
            </select>

            {/* Prioridad */}
            <select
              value={Array.isArray(filters.priority) ? 'multiple' : filters.priority}
              onChange={(e) => setFilter('priority', e.target.value as RequestPriority | 'all')}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Todas las prioridades</option>
              {availablePriorities.map(priority => (
                <option key={priority.value} value={priority.value}>
                  {priority.label} ({priority.count})
                </option>
              ))}
            </select>

            {/* Limpiar filtros */}
            {activeFiltersCount > 0 && (
              <button
                onClick={clearFilters}
                className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Limpiar ({activeFiltersCount})
              </button>
            )}
          </div>

          {/* Presets */}
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => applyPreset('pending_approval')}
              className="px-3 py-1 text-sm bg-orange-100 text-orange-800 rounded-full hover:bg-orange-200"
            >
              Pendientes
            </button>
            <button
              onClick={() => applyPreset('urgent_requests')}
              className="px-3 py-1 text-sm bg-red-100 text-red-800 rounded-full hover:bg-red-200"
            >
              Urgentes
            </button>
            <button
              onClick={() => applyPreset('recent_requests')}
              className="px-3 py-1 text-sm bg-blue-100 text-blue-800 rounded-full hover:bg-blue-200"
            >
              Recientes
            </button>
            {mode !== 'employee' && (
              <button
                onClick={() => applyPreset('escalated_requests')}
                className="px-3 py-1 text-sm bg-purple-100 text-purple-800 rounded-full hover:bg-purple-200"
              >
                Escaladas
              </button>
            )}
          </div>
        </div>
      )}

      {/* Acciones en masa */}
      {showBulkActions && selectedRequestIds.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center justify-between">
          <span className="text-sm text-blue-800">
            {selectedRequestIds.length} solicitudes seleccionadas
          </span>
          <div className="flex gap-2">
            {canPerformAction('bulk_approve') && (
              <button
                onClick={() => handleBulkAction('approve')}
                className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
              >
                Aprobar todas
              </button>
            )}
            {canPerformAction('bulk_reject') && (
              <button
                onClick={() => handleBulkAction('reject')}
                className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
              >
                Rechazar todas
              </button>
            )}
            <button
              onClick={() => setSelectedRequestIds([])}
              className="px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Lista de requests */}
      <div className="bg-white rounded-lg border overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Cargando solicitudes...</p>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <p>No se encontraron solicitudes</p>
          </div>
        ) : (
          <div style={{ maxHeight }} className="overflow-y-auto">
            {/* Encabezado de tabla */}
            {showBulkActions && (
              <div className="bg-gray-50 border-b px-4 py-2 flex items-center">
                <input
                  type="checkbox"
                  checked={selectedRequestIds.length === filteredRequests.length}
                  onChange={handleSelectAll}
                  className="mr-3"
                />
                <span className="text-sm text-gray-600">Seleccionar todas</span>
              </div>
            )}

            {/* Lista de requests */}
            {filteredRequests.map((request) => (
              <div
                key={request.id}
                className={`border-b last:border-b-0 p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                  selectedRequest?.id === request.id ? 'bg-blue-50 border-blue-200' : ''
                }`}
                onClick={() => handleRequestSelect(request)}
              >
                <div className="flex items-start gap-4">
                  {/* Checkbox para bulk actions */}
                  {showBulkActions && (
                    <input
                      type="checkbox"
                      checked={selectedRequestIds.includes(request.id)}
                      onChange={(e) => {
                        e.stopPropagation()
                        handleBulkSelection(request.id, e.target.checked)
                      }}
                      className="mt-1"
                    />
                  )}

                  {/* Icono del tipo */}
                  <div className="text-2xl">
                    {getRequestTypeIcon(request.type)}
                  </div>

                  {/* Información principal */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-medium text-gray-900 truncate">
                          {getRequestTypeName(request.type)}
                        </h3>
                        <p className="text-sm text-gray-600">{request.employeeName}</p>
                        <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                          {request.reason}
                        </p>
                      </div>

                      <div className="flex flex-col items-end gap-2 ml-4">
                        {/* Estado */}
                        <span
                          className="px-2 py-1 text-xs font-medium rounded-full text-white"
                          style={{ backgroundColor: getStatusColor(request.status) }}
                        >
                          {getStatusName(request.status)}
                        </span>

                        {/* Prioridad */}
                        <span
                          className="px-2 py-1 text-xs font-medium rounded-full text-white"
                          style={{ backgroundColor: getPriorityColor(request.priority) }}
                        >
                          {getPriorityName(request.priority)}
                        </span>
                      </div>
                    </div>

                    {/* Metadatos */}
                    <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                      <span>Enviada: {formatDate(request.submittedDate)}</span>
                      {request.startDate && (
                        <span>Inicio: {formatDate(request.startDate)}</span>
                      )}
                      {request.approvalFlow.isEscalated && (
                        <span className="text-purple-600 font-medium">🔺 Escalada</span>
                      )}
                    </div>

                    {/* Acciones */}
                    <div className="flex gap-2 mt-3">
                      {canPerformAction('approve_request', request) && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleAction('approve', request)
                          }}
                          className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
                        >
                          Aprobar
                        </button>
                      )}
                      {canPerformAction('reject_request', request) && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleAction('reject', request)
                          }}
                          className="px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
                        >
                          Rechazar
                        </button>
                      )}
                      {canPerformAction('escalate_request', request) && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleAction('escalate', request)
                          }}
                          className="px-3 py-1 text-xs bg-purple-600 text-white rounded hover:bg-purple-700"
                        >
                          Escalar
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modales de confirmación */}
      {showApprovalModal && (
        <ApprovalModal
          isOpen={showApprovalModal}
          onClose={() => setShowApprovalModal(false)}
          onConfirm={confirmAction}
          isBulk={pendingAction?.bulk || false}
          count={pendingAction?.bulk ? selectedRequestIds.length : 1}
        />
      )}

      {showRejectionModal && (
        <RejectionModal
          isOpen={showRejectionModal}
          onClose={() => setShowRejectionModal(false)}
          onConfirm={confirmAction}
          isBulk={pendingAction?.bulk || false}
          count={pendingAction?.bulk ? selectedRequestIds.length : 1}
        />
      )}
    </div>
  )
}

// Componentes auxiliares para modales
function ApprovalModal({
  isOpen,
  onClose,
  onConfirm,
  isBulk,
  count
}: {
  isOpen: boolean
  onClose: () => void
  onConfirm: (comments?: string) => void
  isBulk: boolean
  count: number
}) {
  const [comments, setComments] = useState('')

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-medium mb-4">
          Confirmar aprobación
        </h3>
        <p className="text-gray-600 mb-4">
          {isBulk 
            ? `¿Aprobar ${count} solicitudes seleccionadas?`
            : '¿Aprobar esta solicitud?'
          }
        </p>
        <textarea
          value={comments}
          onChange={(e) => setComments(e.target.value)}
          placeholder="Comentarios (opcional)"
          className="w-full px-3 py-2 border border-gray-300 rounded-md resize-none"
          rows={3}
        />
        <div className="flex gap-2 justify-end mt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            Cancelar
          </button>
          <button
            onClick={() => onConfirm(comments)}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Aprobar
          </button>
        </div>
      </div>
    </div>
  )
}

function RejectionModal({
  isOpen,
  onClose,
  onConfirm,
  isBulk,
  count
}: {
  isOpen: boolean
  onClose: () => void
  onConfirm: (comments: string) => void
  isBulk: boolean
  count: number
}) {
  const [comments, setComments] = useState('')

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-medium mb-4">
          Confirmar rechazo
        </h3>
        <p className="text-gray-600 mb-4">
          {isBulk 
            ? `¿Rechazar ${count} solicitudes seleccionadas?`
            : '¿Rechazar esta solicitud?'
          }
        </p>
        <textarea
          value={comments}
          onChange={(e) => setComments(e.target.value)}
          placeholder="Comentarios (obligatorio)"
          className="w-full px-3 py-2 border border-gray-300 rounded-md resize-none"
          rows={3}
          required
        />
        <div className="flex gap-2 justify-end mt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            Cancelar
          </button>
          <button
            onClick={() => onConfirm(comments)}
            disabled={!comments.trim()}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Rechazar
          </button>
        </div>
      </div>
    </div>
  )
}