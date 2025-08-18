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
  RequestFilters
} from '@/shared/requests'

// Mock context para business admin
const mockContext = createSimpleRequestContext({
  id: 'admin-001',
  name: 'Business Admin',
  email: 'admin@company.com',
  role: 'BUSINESS_ADMIN',
  locationId: 'all-locations'
})

export default function BusinessRequests() {
  const { addNotification } = useNotifications()
  const [selectedLocation, setSelectedLocation] = useState<string>('all')
  const [selectedRequest, setSelectedRequest] = useState<TeamRequest | null>(null)
  const [showRequestModal, setShowRequestModal] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)

  // Hook del módulo compartido configurado para business admin
  const {
    requests,
    metrics,
    analytics,
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
  } = useRequestsForRole(mockContext, 'BUSINESS_ADMIN')

  // Filtrar por ubicación (funcionalidad específica de business admin)
  const filteredRequests = useMemo(() => {
    if (selectedLocation === 'all') {
      return requests
    }
    return requests.filter(request => request.locationId === selectedLocation)
  }, [requests, selectedLocation])

  // Calcular métricas locales para el diseño original
  const businessMetrics = useMemo(() => {
    const total = filteredRequests.length
    const pending = filteredRequests.filter(r => r.status === 'pending').length
    const urgent = filteredRequests.filter(r => r.priority === 'urgent').length
    const escalated = filteredRequests.filter(r => r.escalated).length
    
    return { total, pending, urgent, escalated }
  }, [filteredRequests])

  // Mock locations para el filtro (esto podría venir de un servicio)
  const mockLocations = [
    { id: 'location-001', name: 'Sede Centro', address: 'Cra 7 #45-23, Bogotá' },
    { id: 'location-002', name: 'Sede Norte', address: 'Cll 140 #15-30, Bogotá' },
    { id: 'location-003', name: 'Sede Chapinero', address: 'Cll 67 #9-45, Bogotá' }
  ]

  const handleCreateRequest = async (data: CreateRequestData) => {
    try {
      await createRequest(data)
      setShowCreateModal(false)
      addNotification({
        id: Date.now().toString(),
        type: 'success',
        title: 'Solicitud creada',
        message: 'La solicitud ha sido creada exitosamente.'
      })
    } catch (error) {
      addNotification({
        id: Date.now().toString(),
        type: 'error',
        title: 'Error',
        message: 'No se pudo crear la solicitud. Intenta de nuevo.'
      })
    }
  }

  const handleRequestSelect = (request: TeamRequest) => {
    setSelectedRequest(request)
    setShowRequestModal(true)
  }

  const handleRequestAction = async (action: string, request: TeamRequest) => {
    try {
      if (action === 'approve' && canPerformAction('approve_request', request)) {
        await approveRequest(request.id, 'Aprobado por Business Admin')
        addNotification({
          id: Date.now().toString(),
          type: 'success',
          title: 'Solicitud aprobada',
          message: `La solicitud de ${request.employeeName} ha sido aprobada.`
        })
      } else if (action === 'reject' && canPerformAction('reject_request', request)) {
        await rejectRequest(request.id, 'Rechazada por Business Admin')
        addNotification({
          id: Date.now().toString(),
          type: 'info',
          title: 'Solicitud rechazada',
          message: `La solicitud de ${request.employeeName} ha sido rechazada.`
        })
      }
    } catch (error) {
      addNotification({
        id: Date.now().toString(),
        type: 'error',
        title: 'Error',
        message: 'No se pudo procesar la acción. Intenta de nuevo.'
      })
    }
  }

  const handleBulkAction = async (action: 'approve' | 'reject', requestIds: string[]) => {
    try {
      if (action === 'approve') {
        await bulkApprove(requestIds, 'Aprobadas en lote por Business Admin')
        addNotification({
          id: Date.now().toString(),
          type: 'success',
          title: 'Solicitudes aprobadas',
          message: `${requestIds.length} solicitudes han sido aprobadas en lote.`
        })
      } else {
        await bulkReject(requestIds, 'Rechazadas en lote por Business Admin')
        addNotification({
          id: Date.now().toString(),
          type: 'info',
          title: 'Solicitudes rechazadas',
          message: `${requestIds.length} solicitudes han sido rechazadas en lote.`
        })
      }
    } catch (error) {
      addNotification({
        id: Date.now().toString(),
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
      <div className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-lg p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-neutral-black mb-2">
              Gestión de Solicitudes
            </h1>
            <p className="text-neutral-dark-gray">
              Administra todas las solicitudes de empleados en todas las ubicaciones
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex flex-col">
              <label className="text-xs text-neutral-medium-gray mb-1">Ubicación</label>
              <select
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                className="px-4 py-2 border border-neutral-light-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="all">Todas las ubicaciones</option>
                {mockLocations.map(location => (
                  <option key={location.id} value={location.id}>
                    {location.name}
                  </option>
                ))}
              </select>
            </div>
            {canPerformAction('create_request') && (
              <Button onClick={() => setShowCreateModal(true)}>
                Nueva Solicitud
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center mr-3">
              <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <p className="text-xs text-neutral-medium-gray">Total Solicitudes</p>
              <p className="text-xl font-bold">{businessMetrics.total}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-semantic-warning/10 rounded-lg flex items-center justify-center mr-3">
              <svg className="w-6 h-6 text-semantic-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-xs text-neutral-medium-gray">Pendientes</p>
              <p className="text-xl font-bold">{businessMetrics.pending}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-semantic-error/10 rounded-lg flex items-center justify-center mr-3">
              <svg className="w-6 h-6 text-semantic-error" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <div>
              <p className="text-xs text-neutral-medium-gray">Urgentes</p>
              <p className="text-xl font-bold text-semantic-error">{businessMetrics.urgent}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-secondary/10 rounded-lg flex items-center justify-center mr-3">
              <svg className="w-6 h-6 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
              </svg>
            </div>
            <div>
              <p className="text-xs text-neutral-medium-gray">Escaladas</p>
              <p className="text-xl font-bold">{businessMetrics.escalated}</p>
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
            mode="business_admin"
            showFilters={true}
            showBulkActions={true}
            showMetrics={false}
            maxHeight="800px"
            onRequestSelect={handleRequestSelect}
            onRequestAction={handleRequestAction}
            onBulkAction={handleBulkAction}
            customFilters={{
              location: selectedLocation === 'all' ? undefined : selectedLocation,
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
        onSave={handleCreateRequest}
      />

      {/* Modal para ver detalles */}
      <RequestModal
        isOpen={showRequestModal}
        onClose={() => {
          setShowRequestModal(false)
          setSelectedRequest(null)
        }}
        context={mockContext}
        mode="view"
        request={selectedRequest || undefined}
      />
    </div>
  )
}