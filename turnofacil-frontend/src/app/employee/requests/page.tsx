'use client'

import { useState, useMemo } from 'react'
import { Card, Button, Modal, Tag } from '@/components/ui'
import { useNotifications } from '@/components/shared/NotificationSystem'
import { 
  UniversalRequestList, 
  RequestModal,
  createSimpleRequestContext,
  useRequestsForRole,
  TeamRequest,
  CreateRequestData,
  UpdateRequestData
} from '@/shared/requests'

// Mock data adaptada al formato del módulo compartido
const mockContext = createSimpleRequestContext({
  id: 'emp-001',
  name: 'Juan Empleado',
  email: 'juan@company.com',
  role: 'EMPLOYEE',
  locationId: 'location-001'
})

export default function EmployeeRequests() {
  const { addNotification } = useNotifications()
  const [showNewRequestModal, setShowNewRequestModal] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState<TeamRequest | null>(null)
  const [showRequestDetailModal, setShowRequestDetailModal] = useState(false)

  // Hook del módulo compartido configurado para empleados
  const {
    requests,
    metrics,
    isLoading,
    error,
    createRequest,
    updateRequest,
    deleteRequest,
    canPerformAction
  } = useRequestsForRole(mockContext, 'EMPLOYEE')

  // Calcular estadísticas locales para mantener el diseño original
  const stats = useMemo(() => {
    const pending = requests.filter(r => r.status === 'pending').length
    const approved = requests.filter(r => r.status === 'approved').length
    const rejected = requests.filter(r => r.status === 'rejected').length
    return { pending, approved, rejected }
  }, [requests])

  const handleCreateRequest = async (data: CreateRequestData) => {
    try {
      await createRequest(data)
      setShowNewRequestModal(false)
      addNotification({
        
        type: 'success',
        title: 'Solicitud enviada',
        message: 'Tu solicitud ha sido enviada y está pendiente de revisión.'
      })
    } catch (error) {
      addNotification({
        
        type: 'error',
        title: 'Error',
        message: 'No se pudo enviar la solicitud. Intenta de nuevo.'
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
    setShowRequestDetailModal(true)
  }

  const handleRequestAction = async (action: string, request: TeamRequest) => {
    if (action === 'edit' && canPerformAction('edit_request', request)) {
      setSelectedRequest(request)
      setShowNewRequestModal(true)
    } else if (action === 'delete' && canPerformAction('delete_request', request)) {
      try {
        await deleteRequest(request.id)
        addNotification({
          
          type: 'success',
          title: 'Solicitud eliminada',
          message: 'La solicitud ha sido eliminada correctamente.'
        })
      } catch (error) {
        addNotification({
          
          type: 'error',
          title: 'Error',
          message: 'No se pudo eliminar la solicitud.'
        })
      }
    }
  }

  if (error) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <Card className="p-8 text-center">
            <p className="text-red-600 mb-4">Error al cargar las solicitudes</p>
            <p className="text-neutral-medium-gray">{error}</p>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-neutral-black">Mis Solicitudes</h1>
          <p className="text-neutral-dark-gray mt-2">
            Gestiona tus solicitudes de cambio de turno y reportes de ausencia
          </p>
        </div>
        {canPerformAction('create_request') && (
          <Button onClick={() => setShowNewRequestModal(true)}>
            Nueva Solicitud
          </Button>
        )}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <div className="text-center">
            <p className="text-2xl font-bold text-semantic-warning">
              {stats.pending}
            </p>
            <p className="text-sm text-neutral-dark-gray">Pendientes</p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-2xl font-bold text-semantic-success">
              {stats.approved}
            </p>
            <p className="text-sm text-neutral-dark-gray">Aprobadas</p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-2xl font-bold text-semantic-error">
              {stats.rejected}
            </p>
            <p className="text-sm text-neutral-dark-gray">Rechazadas</p>
          </div>
        </Card>
      </div>

      {/* Requests List usando el componente universal */}
      <Card>
        <h2 className="text-xl font-semibold mb-6">Historial de Solicitudes</h2>
        
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-neutral-medium-gray">Cargando solicitudes...</p>
          </div>
        ) : requests.length === 0 ? (
          <div className="text-center py-12">
            <svg className="w-16 h-16 text-neutral-medium-gray mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
            </svg>
            <p className="text-neutral-medium-gray mb-4">No tienes solicitudes aún</p>
            {canPerformAction('create_request') && (
              <Button onClick={() => setShowNewRequestModal(true)}>
                Crear tu primera solicitud
              </Button>
            )}
          </div>
        ) : (
          <UniversalRequestList
            context={mockContext}
            mode="employee"
            showFilters={false}
            showBulkActions={false}
            showMetrics={false}
            maxHeight="none"
            onRequestSelect={handleRequestSelect}
            onRequestAction={handleRequestAction}
            className="border-0 p-0"
          />
        )}
      </Card>

      {/* Modal para crear/editar requests */}
      <RequestModal
        isOpen={showNewRequestModal}
        onClose={() => {
          setShowNewRequestModal(false)
          setSelectedRequest(null)
        }}
        context={mockContext}
        mode={selectedRequest ? "edit" : "create"}
        request={selectedRequest || undefined}
        onSave={handleModalSave}
        onDelete={selectedRequest ? 
          () => deleteRequest(selectedRequest.id) : 
          undefined
        }
      />

      {/* Modal para ver detalles */}
      <RequestModal
        isOpen={showRequestDetailModal}
        onClose={() => {
          setShowRequestDetailModal(false)
          setSelectedRequest(null)
        }}
        context={mockContext}
        mode="view"
        request={selectedRequest || undefined}
      />
    </div>
  )
}