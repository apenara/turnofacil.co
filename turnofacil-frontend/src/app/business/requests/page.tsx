'use client'

import React, { useState } from 'react'
import { Card, Button, Input, Modal, Tag } from '@/components/ui'
import { useNotifications } from '@/components/shared/NotificationSystem'

interface Location {
  id: string
  name: string
  address: string
}

interface TeamRequest {
  id: string
  employeeId: string
  employeeName: string
  employeePosition: string
  locationId: string
  locationName: string
  type: 'time_off' | 'shift_change' | 'vacation' | 'sick_leave' | 'personal_leave'
  status: 'pending' | 'approved' | 'rejected' | 'cancelled'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  submittedDate: string
  requestedDate?: string
  startDate?: string
  endDate?: string
  reason: string
  description?: string
  managerComments?: string
  businessAdminComments?: string
  attachments?: string[]
  originalShift?: {
    date: string
    startTime: string
    endTime: string
  }
  newShift?: {
    date: string
    startTime: string
    endTime: string
  }
  replacementEmployeeId?: string
  replacementEmployeeName?: string
  supervisorId?: string
  supervisorName?: string
  supervisorDecision?: 'approved' | 'rejected'
  escalated?: boolean
}

const mockLocations: Location[] = [
  {
    id: '1',
    name: 'Sede Centro',
    address: 'Cra 7 #45-23, Bogotá'
  },
  {
    id: '2',
    name: 'Sede Norte',
    address: 'Cll 140 #15-30, Bogotá'
  },
  {
    id: '3',
    name: 'Sede Chapinero',
    address: 'Cll 67 #9-45, Bogotá'
  }
]

const mockRequests: TeamRequest[] = [
  {
    id: '1',
    employeeId: '1',
    employeeName: 'Carlos López',
    employeePosition: 'Cocinero Senior',
    locationId: '1',
    locationName: 'Sede Centro',
    type: 'shift_change',
    status: 'pending',
    priority: 'medium',
    submittedDate: '2024-01-15T09:30:00',
    reason: 'Cita médica',
    description: 'Necesito cambiar mi turno del viernes para asistir a una cita médica importante.',
    supervisorId: 'sup1',
    supervisorName: 'María García',
    supervisorDecision: 'approved',
    escalated: true,
    originalShift: {
      date: '2024-01-19',
      startTime: '06:00',
      endTime: '14:00'
    },
    newShift: {
      date: '2024-01-19',
      startTime: '14:00',
      endTime: '22:00'
    },
    replacementEmployeeId: '4',
    replacementEmployeeName: 'Laura Rodríguez'
  },
  {
    id: '2',
    employeeName: 'Ana Martínez',
    employeeId: '2',
    employeePosition: 'Mesera',
    locationId: '1',
    locationName: 'Sede Centro',
    type: 'vacation',
    status: 'pending',
    priority: 'low',
    submittedDate: '2024-01-14T16:45:00',
    startDate: '2024-02-05',
    endDate: '2024-02-09',
    reason: 'Vacaciones familiares',
    description: 'Solicito 5 días de vacaciones para viajar con mi familia.'
  },
  {
    id: '3',
    employeeId: '3',
    employeeName: 'Pedro García',
    employeePosition: 'Cajero',
    locationId: '2',
    locationName: 'Sede Norte',
    type: 'sick_leave',
    status: 'approved',
    priority: 'high',
    submittedDate: '2024-01-12T08:15:00',
    startDate: '2024-01-13',
    endDate: '2024-01-17',
    reason: 'Incapacidad médica',
    description: 'Incapacidad por gripe fuerte con certificado médico adjunto.',
    businessAdminComments: 'Aprobado. Certificado médico validado.',
    attachments: ['certificado_medico_pedro.pdf']
  },
  {
    id: '4',
    employeeId: '4',
    employeeName: 'Laura Rodríguez',
    employeePosition: 'Auxiliar de Cocina',
    locationId: '2',
    locationName: 'Sede Norte',
    type: 'personal_leave',
    status: 'rejected',
    priority: 'medium',
    submittedDate: '2024-01-10T14:20:00',
    requestedDate: '2024-01-20',
    reason: 'Asunto personal',
    description: 'Necesito un día libre para resolver un tema personal importante.',
    businessAdminComments: 'No aprobado. Día de alta demanda y sin suficiente personal de reemplazo.'
  },
  {
    id: '5',
    employeeId: '5',
    employeeName: 'Luis Hernández',
    employeePosition: 'Barista',
    locationId: '3',
    locationName: 'Sede Chapinero',
    type: 'vacation',
    status: 'pending',
    priority: 'urgent',
    submittedDate: '2024-01-16T11:00:00',
    startDate: '2024-01-25',
    endDate: '2024-01-30',
    reason: 'Viaje familiar urgente',
    description: 'Emergencia familiar que requiere viaje inmediato. Solicito aprobación urgente.',
    escalated: true
  },
  {
    id: '6',
    employeeId: '6',
    employeeName: 'Sandra Morales',
    employeePosition: 'Gerente de Tienda',
    locationId: '3',
    locationName: 'Sede Chapinero',
    type: 'shift_change',
    status: 'pending',
    priority: 'high',
    submittedDate: '2024-01-17T15:30:00',
    reason: 'Reunión importante',
    description: 'Tengo una reunión con proveedores que no se puede mover.',
    originalShift: {
      date: '2024-01-22',
      startTime: '09:00',
      endTime: '17:00'
    },
    newShift: {
      date: '2024-01-22',
      startTime: '17:00',
      endTime: '01:00'
    }
  }
]

export default function BusinessRequests() {
  const { addNotification } = useNotifications()
  const [selectedLocation, setSelectedLocation] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [priorityFilter, setPriorityFilter] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [requests, setRequests] = useState<TeamRequest[]>(mockRequests)
  const [selectedRequest, setSelectedRequest] = useState<TeamRequest | null>(null)
  const [showRequestModal, setShowRequestModal] = useState(false)
  const [bulkSelection, setBulkSelection] = useState<string[]>([])
  const [showBulkModal, setShowBulkModal] = useState(false)
  const [bulkAction, setBulkAction] = useState<'approve' | 'reject'>('approve')

  // Filter requests
  const filteredRequests = requests.filter(request => {
    const matchesLocation = selectedLocation === 'all' || request.locationId === selectedLocation
    const matchesStatus = statusFilter === 'all' || request.status === statusFilter
    const matchesType = typeFilter === 'all' || request.type === typeFilter
    const matchesPriority = priorityFilter === 'all' || request.priority === priorityFilter
    const matchesSearch = searchTerm === '' || 
      request.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.reason.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.description?.toLowerCase().includes(searchTerm.toLowerCase())
    
    return matchesLocation && matchesStatus && matchesType && matchesPriority && matchesSearch
  })

  // Calculate metrics
  const calculateMetrics = () => {
    const total = filteredRequests.length
    const pending = filteredRequests.filter(r => r.status === 'pending').length
    const urgent = filteredRequests.filter(r => r.priority === 'urgent').length
    const escalated = filteredRequests.filter(r => r.escalated).length
    
    return { total, pending, urgent, escalated }
  }

  const metrics = calculateMetrics()

  const getTypeLabel = (type: TeamRequest['type']) => {
    switch (type) {
      case 'time_off':
        return 'Día libre'
      case 'shift_change':
        return 'Cambio de turno'
      case 'vacation':
        return 'Vacaciones'
      case 'sick_leave':
        return 'Incapacidad'
      case 'personal_leave':
        return 'Permiso personal'
      default:
        return type
    }
  }

  const getStatusLabel = (status: TeamRequest['status']) => {
    switch (status) {
      case 'pending':
        return 'Pendiente'
      case 'approved':
        return 'Aprobado'
      case 'rejected':
        return 'Rechazado'
      case 'cancelled':
        return 'Cancelado'
      default:
        return status
    }
  }

  const getPriorityLabel = (priority: TeamRequest['priority']) => {
    switch (priority) {
      case 'low':
        return 'Baja'
      case 'medium':
        return 'Media'
      case 'high':
        return 'Alta'
      case 'urgent':
        return 'Urgente'
      default:
        return priority
    }
  }

  const getStatusVariant = (status: TeamRequest['status']) => {
    switch (status) {
      case 'pending':
        return 'warning'
      case 'approved':
        return 'success'
      case 'rejected':
        return 'error'
      case 'cancelled':
        return 'default'
      default:
        return 'default'
    }
  }

  const getPriorityVariant = (priority: TeamRequest['priority']) => {
    switch (priority) {
      case 'low':
        return 'success'
      case 'medium':
        return 'default'
      case 'high':
        return 'warning'
      case 'urgent':
        return 'error'
      default:
        return 'default'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatTime = (timeString: string) => {
    const date = new Date(timeString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
      return `Hace ${diffInMinutes} min`
    } else if (diffInHours < 24) {
      return `Hace ${diffInHours}h`
    } else {
      const diffInDays = Math.floor(diffInHours / 24)
      return `Hace ${diffInDays}d`
    }
  }

  const handleRequestAction = (requestId: string, action: 'approve' | 'reject', comments?: string) => {
    setRequests(prev => prev.map(request => 
      request.id === requestId 
        ? { 
            ...request, 
            status: action === 'approve' ? 'approved' : 'rejected',
            businessAdminComments: comments
          }
        : request
    ))
    
    const actionText = action === 'approve' ? 'aprobada' : 'rechazada'
    addNotification({
      type: 'success',
      title: 'Acción completada',
      message: `Solicitud ${actionText} exitosamente`
    })
  }

  const handleBulkAction = (action: 'approve' | 'reject', comments: string) => {
    setRequests(prev => prev.map(request => 
      bulkSelection.includes(request.id)
        ? { 
            ...request, 
            status: action === 'approve' ? 'approved' : 'rejected',
            businessAdminComments: comments
          }
        : request
    ))
    
    setBulkSelection([])
    setShowBulkModal(false)
    
    const actionText = action === 'approve' ? 'aprobadas' : 'rechazadas'
    addNotification({
      type: 'success',
      title: 'Acción completada',
      message: `${bulkSelection.length} solicitudes ${actionText}`
    })
  }

  const toggleBulkSelection = (requestId: string) => {
    setBulkSelection(prev => 
      prev.includes(requestId)
        ? prev.filter(id => id !== requestId)
        : [...prev, requestId]
    )
  }

  const selectAllPending = () => {
    const pendingIds = filteredRequests
      .filter(r => r.status === 'pending')
      .map(r => r.id)
    setBulkSelection(pendingIds)
  }

  const clearSelection = () => {
    setBulkSelection([])
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
          </div>
        </div>
      </div>

      {/* Metrics */}
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
              <p className="text-xl font-bold">{metrics.total}</p>
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
              <p className="text-xl font-bold">{metrics.pending}</p>
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
              <p className="text-xl font-bold text-semantic-error">{metrics.urgent}</p>
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
              <p className="text-xl font-bold">{metrics.escalated}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters and bulk actions */}
      <Card>
        <div className="p-4 border-b border-neutral-light-gray">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <Input
                placeholder="Buscar por empleado o motivo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64"
              />
              
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-neutral-light-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="all">Todos los estados</option>
                <option value="pending">Pendiente</option>
                <option value="approved">Aprobado</option>
                <option value="rejected">Rechazado</option>
                <option value="cancelled">Cancelado</option>
              </select>
              
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-3 py-2 border border-neutral-light-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="all">Todos los tipos</option>
                <option value="vacation">Vacaciones</option>
                <option value="sick_leave">Incapacidad</option>
                <option value="shift_change">Cambio de turno</option>
                <option value="personal_leave">Permiso personal</option>
                <option value="time_off">Día libre</option>
              </select>
              
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="px-3 py-2 border border-neutral-light-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="all">Todas las prioridades</option>
                <option value="urgent">Urgente</option>
                <option value="high">Alta</option>
                <option value="medium">Media</option>
                <option value="low">Baja</option>
              </select>
            </div>
            
            <div className="flex items-center gap-2">
              {bulkSelection.length > 0 && (
                <>
                  <span className="text-sm text-neutral-medium-gray">
                    {bulkSelection.length} seleccionadas
                  </span>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      setBulkAction('approve')
                      setShowBulkModal(true)
                    }}
                  >
                    Aprobar
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      setBulkAction('reject')
                      setShowBulkModal(true)
                    }}
                  >
                    Rechazar
                  </Button>
                  <Button
                    size="sm"
                    variant="text"
                    onClick={clearSelection}
                  >
                    Limpiar
                  </Button>
                </>
              )}
              
              {bulkSelection.length === 0 && (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={selectAllPending}
                  disabled={filteredRequests.filter(r => r.status === 'pending').length === 0}
                >
                  Seleccionar pendientes
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Requests list */}
        <div className="divide-y divide-neutral-light-gray">
          {filteredRequests.map(request => (
            <div key={request.id} className="p-4 hover:bg-neutral-off-white/50 transition-colors">
              <div className="flex items-start space-x-4">
                <input
                  type="checkbox"
                  checked={bulkSelection.includes(request.id)}
                  onChange={() => toggleBulkSelection(request.id)}
                  disabled={request.status !== 'pending'}
                  className="mt-1 h-4 w-4 text-primary focus:ring-primary border-neutral-light-gray rounded"
                />
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-3">
                      <h3 className="text-lg font-semibold text-neutral-black">
                        {request.employeeName}
                      </h3>
                      <Tag variant="default">{request.employeePosition}</Tag>
                      {selectedLocation === 'all' && (
                        <Tag variant="info">{request.locationName}</Tag>
                      )}
                      {request.escalated && (
                        <Tag variant="warning">Escalada</Tag>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Tag variant={getPriorityVariant(request.priority)}>
                        {getPriorityLabel(request.priority)}
                      </Tag>
                      <Tag variant={getStatusVariant(request.status)}>
                        {getStatusLabel(request.status)}
                      </Tag>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                    <div>
                      <p className="text-sm text-neutral-medium-gray">Tipo de solicitud</p>
                      <p className="font-medium">{getTypeLabel(request.type)}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-neutral-medium-gray">Motivo</p>
                      <p className="font-medium">{request.reason}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-neutral-medium-gray">Enviada</p>
                      <p className="font-medium">{formatTime(request.submittedDate)}</p>
                    </div>
                  </div>
                  
                  {request.description && (
                    <p className="text-sm text-neutral-dark-gray mb-3">
                      {request.description}
                    </p>
                  )}
                  
                  {/* Shift change details */}
                  {request.type === 'shift_change' && request.originalShift && request.newShift && (
                    <div className="bg-primary/5 p-3 rounded-lg mb-3">
                      <h4 className="font-semibold text-sm mb-2">Detalles del cambio de turno</h4>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-neutral-medium-gray">Turno original</p>
                          <p>{formatDate(request.originalShift.date)}</p>
                          <p>{request.originalShift.startTime} - {request.originalShift.endTime}</p>
                        </div>
                        <div>
                          <p className="text-neutral-medium-gray">Nuevo turno</p>
                          <p>{formatDate(request.newShift.date)}</p>
                          <p>{request.newShift.startTime} - {request.newShift.endTime}</p>
                        </div>
                      </div>
                      {request.replacementEmployeeName && (
                        <p className="text-sm mt-2">
                          <span className="text-neutral-medium-gray">Reemplazo: </span>
                          {request.replacementEmployeeName}
                        </p>
                      )}
                    </div>
                  )}
                  
                  {/* Date range requests */}
                  {(request.type === 'vacation' || request.type === 'sick_leave') && request.startDate && request.endDate && (
                    <div className="bg-secondary/5 p-3 rounded-lg mb-3">
                      <h4 className="font-semibold text-sm mb-2">Período solicitado</h4>
                      <p className="text-sm">
                        Desde: {formatDate(request.startDate)} - Hasta: {formatDate(request.endDate)}
                      </p>
                    </div>
                  )}
                  
                  {/* Supervisor decision for escalated requests */}
                  {request.escalated && request.supervisorDecision && (
                    <div className="bg-semantic-info/5 p-3 rounded-lg mb-3">
                      <h4 className="font-semibold text-sm mb-2">Decisión del supervisor</h4>
                      <p className="text-sm">
                        <span className="text-neutral-medium-gray">{request.supervisorName}: </span>
                        <Tag variant={request.supervisorDecision === 'approved' ? 'success' : 'error'}>
                          {request.supervisorDecision === 'approved' ? 'Aprobó' : 'Rechazó'}
                        </Tag>
                      </p>
                      <p className="text-sm text-neutral-medium-gray mt-1">
                        Escalada para decisión final del Business Admin
                      </p>
                    </div>
                  )}
                  
                  {/* Comments */}
                  {(request.businessAdminComments || request.managerComments) && (
                    <div className="bg-neutral-off-white p-3 rounded-lg mb-3">
                      <h4 className="font-semibold text-sm mb-2">Comentarios</h4>
                      {request.businessAdminComments && (
                        <p className="text-sm mb-1">
                          <span className="font-medium">Business Admin: </span>
                          {request.businessAdminComments}
                        </p>
                      )}
                      {request.managerComments && (
                        <p className="text-sm">
                          <span className="font-medium">Supervisor: </span>
                          {request.managerComments}
                        </p>
                      )}
                    </div>
                  )}
                  
                  {/* Attachments */}
                  {request.attachments && request.attachments.length > 0 && (
                    <div className="mb-3">
                      <h4 className="font-semibold text-sm mb-2">Archivos adjuntos</h4>
                      <div className="flex flex-wrap gap-2">
                        {request.attachments.map((attachment, idx) => (
                          <span key={idx} className="text-xs px-2 py-1 bg-primary/10 text-primary rounded">
                            📎 {attachment}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Actions */}
                  <div className="flex items-center justify-between">
                    <Button
                      variant="text"
                      size="sm"
                      onClick={() => {
                        setSelectedRequest(request)
                        setShowRequestModal(true)
                      }}
                    >
                      Ver detalles
                    </Button>
                    
                    {request.status === 'pending' && (
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleRequestAction(request.id, 'reject')}
                        >
                          Rechazar
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleRequestAction(request.id, 'approve')}
                        >
                          Aprobar
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
          
          {filteredRequests.length === 0 && (
            <div className="p-12 text-center">
              <svg className="w-12 h-12 text-neutral-light-gray mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="text-lg font-semibold text-neutral-dark-gray mb-2">No hay solicitudes</h3>
              <p className="text-neutral-medium-gray">
                No se encontraron solicitudes con los filtros actuales.
              </p>
            </div>
          )}
        </div>
      </Card>

      {/* Request details modal */}
      <Modal
        isOpen={showRequestModal}
        onClose={() => {
          setShowRequestModal(false)
          setSelectedRequest(null)
        }}
        title="Detalles de la Solicitud"
      >
        {selectedRequest && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-dark-gray mb-1">
                  Empleado
                </label>
                <p className="text-lg font-semibold">{selectedRequest.employeeName}</p>
                <p className="text-sm text-neutral-medium-gray">{selectedRequest.employeePosition}</p>
                <p className="text-sm text-primary">{selectedRequest.locationName}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-neutral-dark-gray mb-1">
                  Estado
                </label>
                <div className="flex items-center space-x-2">
                  <Tag variant={getStatusVariant(selectedRequest.status)}>
                    {getStatusLabel(selectedRequest.status)}
                  </Tag>
                  <Tag variant={getPriorityVariant(selectedRequest.priority)}>
                    {getPriorityLabel(selectedRequest.priority)}
                  </Tag>
                </div>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-neutral-dark-gray mb-1">
                Tipo de solicitud
              </label>
              <p>{getTypeLabel(selectedRequest.type)}</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-neutral-dark-gray mb-1">
                Motivo
              </label>
              <p>{selectedRequest.reason}</p>
            </div>
            
            {selectedRequest.description && (
              <div>
                <label className="block text-sm font-medium text-neutral-dark-gray mb-1">
                  Descripción
                </label>
                <p className="text-sm">{selectedRequest.description}</p>
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium text-neutral-dark-gray mb-1">
                Comentarios de Business Admin
              </label>
              <textarea
                className="w-full px-3 py-2 border border-neutral-light-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                rows={3}
                placeholder="Agregar comentarios..."
                defaultValue={selectedRequest.businessAdminComments}
              />
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button
                variant="secondary"
                onClick={() => {
                  setShowRequestModal(false)
                  setSelectedRequest(null)
                }}
              >
                Cerrar
              </Button>
              
              {selectedRequest.status === 'pending' && (
                <>
                  <Button
                    variant="secondary"
                    onClick={() => {
                      handleRequestAction(selectedRequest.id, 'reject')
                      setShowRequestModal(false)
                      setSelectedRequest(null)
                    }}
                  >
                    Rechazar
                  </Button>
                  <Button
                    onClick={() => {
                      handleRequestAction(selectedRequest.id, 'approve')
                      setShowRequestModal(false)
                      setSelectedRequest(null)
                    }}
                  >
                    Aprobar
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Bulk action modal */}
      <Modal
        isOpen={showBulkModal}
        onClose={() => setShowBulkModal(false)}
        title={`${bulkAction === 'approve' ? 'Aprobar' : 'Rechazar'} Solicitudes`}
      >
        <div className="space-y-4">
          <p className="text-neutral-dark-gray">
            ¿Estás seguro de {bulkAction === 'approve' ? 'aprobar' : 'rechazar'} {bulkSelection.length} solicitudes?
          </p>
          
          <div>
            <label className="block text-sm font-medium text-neutral-dark-gray mb-1">
              Comentarios
            </label>
            <textarea
              id="bulk-comments"
              className="w-full px-3 py-2 border border-neutral-light-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              rows={3}
              placeholder="Agregar comentarios (opcional)..."
            />
          </div>
          
          <div className="flex justify-end space-x-2">
            <Button
              variant="secondary"
              onClick={() => setShowBulkModal(false)}
            >
              Cancelar
            </Button>
            <Button
              onClick={() => {
                const comments = (document.getElementById('bulk-comments') as HTMLTextAreaElement)?.value || ''
                handleBulkAction(bulkAction, comments)
              }}
            >
              {bulkAction === 'approve' ? 'Aprobar' : 'Rechazar'} {bulkSelection.length} solicitudes
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}