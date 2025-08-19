'use client'

import React, { useState, useMemo } from 'react'
import { Card, Button, Input, Modal, Tag } from '@/components/ui'
import { useNotifications } from '@/components/shared/NotificationSystem'
import {
  UniversalRequestList,
  RequestModal,
  createSimpleRequestContext,
  useRequestsForRole,
  TeamRequest,
  CreateRequestData,
  UpdateRequestData,
  RequestFilters
} from '@/shared/requests'

// Mock context para supervisor
const mockContext = createSimpleRequestContext({
  id: 'sup-001',
  name: 'María García',
  email: 'maria@company.com',
  role: 'SUPERVISOR',
  locationId: 'location-001'
})

export default function RequestsPage() {
  const { addNotification } = useNotifications()
  const [selectedRequest, setSelectedRequest] = useState<TeamRequest | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)

  // Hook del módulo compartido configurado para supervisores
  const {
    requests,
    metrics,
    isLoading,
    error,
    createRequest,
    updateRequest,
    deleteRequest,
    approveRequest,
    rejectRequest,
    escalateRequest,
    bulkApprove,
    bulkReject,
    canPerformAction
  } = useRequestsForRole(mockContext, 'SUPERVISOR')

  // Calcular estadísticas locales para mantener el diseño original
  const stats = useMemo(() => {
    const pending = requests.filter(r => r.status === 'pending').length
    const urgent = requests.filter(r => r.priority === 'urgent' && r.status === 'pending').length
    const approvedThisWeek = requests.filter(r => {
      const oneWeekAgo = new Date()
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
      return r.status === 'approved' && new Date(r.submittedDate) >= oneWeekAgo
    }).length
    const totalRequests = requests.length

    return { pending, urgent, approvedThisWeek, totalRequests }
  }, [requests])

  const handleCreateRequest = async (data: CreateRequestData) => {
    try {
      await createRequest(data)
      setShowCreateModal(false)
      addNotification({
        
        type: 'success',
        title: 'Solicitud creada',
        message: 'La solicitud ha sido creada exitosamente.'
      })
    } catch (error) {
      addNotification({
        
        type: 'error',
        title: 'Error',
        message: 'No se pudo crear la solicitud. Intenta de nuevo.'
      })
    }
  }

  // Handler unificado para el modal
  const handleModalSave = async (data: CreateRequestData | UpdateRequestData) => {
    if ('id' in data) {
      // Es UpdateRequestData
      await updateRequest(data as UpdateRequestData)
    } else {
      // Es CreateRequestData
      await handleCreateRequest(data as CreateRequestData)
    }
  }

  const handleRequestSelect = (request: TeamRequest) => {
    setSelectedRequest(request)
    setShowDetailModal(true)
  }

  const handleRequestAction = async (action: string, request: TeamRequest) => {
    try {
      if (action === 'approve' && canPerformAction('approve_request', request)) {
        await approveRequest(request.id)
        addNotification({
          
          type: 'success',
          title: 'Solicitud aprobada',
          message: `La solicitud de ${request.employeeName} ha sido aprobada.`
        })
      } else if (action === 'reject' && canPerformAction('reject_request', request)) {
        await rejectRequest(request.id, 'Rechazada por supervisor')
        addNotification({
          
          type: 'info',
          title: 'Solicitud rechazada',
          message: `La solicitud de ${request.employeeName} ha sido rechazada.`
        })
      } else if (action === 'escalate' && canPerformAction('escalate_request', request)) {
        await escalateRequest(request.id, 'Escalada por supervisor')
        addNotification({
          
          type: 'warning',
          title: 'Solicitud escalada',
          message: `La solicitud de ${request.employeeName} ha sido escalada al administrador.`
        })
      }
    } catch (error) {
      addNotification({
        
        type: 'error',
        title: 'Error',
        message: 'No se pudo procesar la acción. Intenta de nuevo.'
      })
    }
  }

  const handleBulkAction = async (action: 'approve' | 'reject', requestIds: string[]) => {
    try {
      if (action === 'approve') {
        await bulkApprove(requestIds)
        addNotification({
          
          type: 'success',
          title: 'Solicitudes aprobadas',
          message: `${requestIds.length} solicitudes han sido aprobadas en lote.`
        })
      } else {
        await bulkReject(requestIds, 'Rechazadas en lote por supervisor')
        addNotification({
          
          type: 'info',
          title: 'Solicitudes rechazadas',
          message: `${requestIds.length} solicitudes han sido rechazadas en lote.`
        })
      }
    } catch (error) {
      addNotification({
        
        type: 'error',
        title: 'Error',
        message: 'No se pudo procesar la acción en lote.'
      })
    }
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <Card className="p-8 text-center">
            <p className="text-red-600 mb-4">Error al cargar las solicitudes</p>
            <p className="text-gray-500">{error}</p>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Gestión de Solicitudes</h1>
          <p className="text-gray-600">Revisa y gestiona las solicitudes de tu equipo</p>
        </div>
        {canPerformAction('create_request') && (
          <Button onClick={() => setShowCreateModal(true)}>
            Nueva Solicitud
          </Button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-600">Pendientes</h3>
              <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-600">Urgentes</h3>
              <p className="text-2xl font-bold text-gray-900">{stats.urgent}</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-600">Esta Semana</h3>
              <p className="text-2xl font-bold text-gray-900">{stats.approvedThisWeek}</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 00-2-2z" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-600">Total</h3>
              <p className="text-2xl font-bold text-gray-900">{stats.totalRequests}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Requests Table usando UniversalRequestList */}
      <Card>
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando solicitudes...</p>
          </div>
        ) : (
          <UniversalRequestList
            context={mockContext}
            mode="supervisor"
            showFilters={true}
            showBulkActions={true}
            showMetrics={false}
            maxHeight="600px"
            onRequestSelect={handleRequestSelect}
            onRequestAction={handleRequestAction}
            customFilters={{
              sortBy: 'priority',
              sortOrder: 'desc'
            }}
            className="border-0"
          />
        )}
      </Card>

      {/* Modal para crear requests */}
      <RequestModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        context={mockContext}
        mode="create"
        onSave={handleModalSave}
      />

      {/* Modal para ver detalles */}
      <RequestModal
        isOpen={showDetailModal}
        onClose={() => {
          setShowDetailModal(false)
          setSelectedRequest(null)
        }}
        context={mockContext}
        mode="view"
        request={selectedRequest || undefined}
      />
    </div>
  )
}