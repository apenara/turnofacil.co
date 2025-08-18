'use client'

import React, { useState } from 'react'
import { Card, Button, Input, Modal, Tag } from '@/components/ui'
import { useNotifications } from '@/components/shared/NotificationSystem'

interface TeamRequest {
  id: string
  employeeId: string
  employeeName: string
  employeePosition: string
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
}

const mockRequests: TeamRequest[] = [
  {
    id: '1',
    employeeId: '1',
    employeeName: 'Carlos López',
    employeePosition: 'Cocinero Senior',
    type: 'shift_change',
    status: 'pending',
    priority: 'medium',
    submittedDate: '2024-01-15T09:30:00',
    reason: 'Cita médica',
    description: 'Necesito cambiar mi turno del viernes para asistir a una cita médica importante.',
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
    employeeId: '2',
    employeeName: 'Ana Martínez',
    employeePosition: 'Mesera',
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
    type: 'sick_leave',
    status: 'approved',
    priority: 'high',
    submittedDate: '2024-01-12T08:15:00',
    startDate: '2024-01-13',
    endDate: '2024-01-17',
    reason: 'Incapacidad médica',
    description: 'Incapacidad por gripe fuerte con certificado médico adjunto.',
    managerComments: 'Aprobado. Se adjuntó certificado médico válido.',
    attachments: ['certificado_medico_pedro.pdf']
  },
  {
    id: '4',
    employeeId: '4',
    employeeName: 'Laura Rodríguez',
    employeePosition: 'Auxiliar de Cocina',
    type: 'personal_leave',
    status: 'rejected',
    priority: 'medium',
    submittedDate: '2024-01-10T14:20:00',
    requestedDate: '2024-01-15',
    reason: 'Asuntos personales',
    description: 'Necesito el día libre para resolver asuntos personales urgentes.',
    managerComments: 'No se puede aprobar debido a falta de personal ese día. Sugerir otra fecha.'
  },
  {
    id: '5',
    employeeId: '1',
    employeeName: 'Carlos López',
    employeePosition: 'Cocinero Senior',
    type: 'time_off',
    status: 'pending',
    priority: 'urgent',
    submittedDate: '2024-01-15T11:00:00',
    requestedDate: '2024-01-16',
    reason: 'Emergencia familiar',
    description: 'Emergencia familiar que requiere mi presencia inmediata mañana.'
  }
]

export default function RequestsPage() {
  const [requests, setRequests] = useState<TeamRequest[]>(mockRequests)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<TeamRequest['status'] | 'all'>('all')
  const [filterType, setFilterType] = useState<TeamRequest['type'] | 'all'>('all')
  const [selectedRequest, setSelectedRequest] = useState<TeamRequest | null>(null)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [managerComments, setManagerComments] = useState('')

  const { addNotification } = useNotifications()

  const filteredRequests = requests.filter(request => {
    const matchesSearch = request.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         request.reason.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         request.description?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === 'all' || request.status === filterStatus
    const matchesType = filterType === 'all' || request.type === filterType
    return matchesSearch && matchesStatus && matchesType
  })

  const getTypeColor = (type: TeamRequest['type']) => {
    switch (type) {
      case 'vacation': return 'info'
      case 'sick_leave': return 'error'
      case 'shift_change': return 'warning'
      case 'personal_leave': return 'default'
      case 'time_off': return 'success'
      default: return 'default'
    }
  }

  const getTypeText = (type: TeamRequest['type']) => {
    switch (type) {
      case 'vacation': return 'Vacaciones'
      case 'sick_leave': return 'Incapacidad'
      case 'shift_change': return 'Cambio de Turno'
      case 'personal_leave': return 'Permiso Personal'
      case 'time_off': return 'Día Libre'
      default: return type
    }
  }

  const getStatusColor = (status: TeamRequest['status']) => {
    switch (status) {
      case 'pending': return 'warning'
      case 'approved': return 'success'
      case 'rejected': return 'error'
      case 'cancelled': return 'default'
      default: return 'default'
    }
  }

  const getStatusText = (status: TeamRequest['status']) => {
    switch (status) {
      case 'pending': return 'Pendiente'
      case 'approved': return 'Aprobado'
      case 'rejected': return 'Rechazado'
      case 'cancelled': return 'Cancelado'
      default: return status
    }
  }

  const getPriorityColor = (priority: TeamRequest['priority']) => {
    switch (priority) {
      case 'urgent': return 'error'
      case 'high': return 'warning'
      case 'medium': return 'info'
      case 'low': return 'success'
      default: return 'default'
    }
  }

  const getPriorityText = (priority: TeamRequest['priority']) => {
    switch (priority) {
      case 'urgent': return 'Urgente'
      case 'high': return 'Alta'
      case 'medium': return 'Media'
      case 'low': return 'Baja'
      default: return priority
    }
  }

  const getTimeSinceSubmission = (submittedDate: string) => {
    const now = new Date()
    const submitted = new Date(submittedDate)
    const diffInHours = (now.getTime() - submitted.getTime()) / (1000 * 60 * 60)
    
    if (diffInHours < 1) return 'Hace unos minutos'
    if (diffInHours < 24) return `Hace ${Math.floor(diffInHours)} horas`
    return `Hace ${Math.floor(diffInHours / 24)} días`
  }

  const openRequestDetail = (request: TeamRequest) => {
    setSelectedRequest(request)
    setManagerComments(request.managerComments || '')
    setIsDetailModalOpen(true)
  }

  const handleRequestAction = (action: 'approve' | 'reject') => {
    if (!selectedRequest) return

    const updatedRequest = {
      ...selectedRequest,
      status: action === 'approve' ? 'approved' as const : 'rejected' as const,
      managerComments: managerComments.trim() || undefined
    }

    setRequests(requests.map(req => 
      req.id === selectedRequest.id ? updatedRequest : req
    ))

    addNotification({
      type: action === 'approve' ? 'success' : 'info',
      title: `Solicitud ${action === 'approve' ? 'aprobada' : 'rechazada'}`,
      message: `La solicitud de ${selectedRequest.employeeName} ha sido ${action === 'approve' ? 'aprobada' : 'rechazada'}`
    })

    setIsDetailModalOpen(false)
    setSelectedRequest(null)
    setManagerComments('')
  }

  const pendingRequests = requests.filter(r => r.status === 'pending').length
  const urgentRequests = requests.filter(r => r.priority === 'urgent' && r.status === 'pending').length
  const approvedThisWeek = requests.filter(r => {
    const oneWeekAgo = new Date()
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
    return r.status === 'approved' && new Date(r.submittedDate) >= oneWeekAgo
  }).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Gestión de Solicitudes</h1>
          <p className="text-gray-600">Revisa y gestiona las solicitudes de tu equipo</p>
        </div>
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
              <p className="text-2xl font-bold text-gray-900">{pendingRequests}</p>
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
              <p className="text-2xl font-bold text-gray-900">{urgentRequests}</p>
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
              <h3 className="text-sm font-medium text-gray-600">Aprobadas (7 días)</h3>
              <p className="text-2xl font-bold text-gray-900">{approvedThisWeek}</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-600">Total Solicitudes</h3>
              <p className="text-2xl font-bold text-gray-900">{requests.length}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4">
          <div className="flex-1">
            <Input
              placeholder="Buscar solicitudes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex space-x-4">
            <select
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as TeamRequest['status'] | 'all')}
            >
              <option value="all">Todos los estados</option>
              <option value="pending">Pendientes</option>
              <option value="approved">Aprobados</option>
              <option value="rejected">Rechazados</option>
              <option value="cancelled">Cancelados</option>
            </select>
            <select
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as TeamRequest['type'] | 'all')}
            >
              <option value="all">Todos los tipos</option>
              <option value="vacation">Vacaciones</option>
              <option value="sick_leave">Incapacidad</option>
              <option value="shift_change">Cambio de Turno</option>
              <option value="personal_leave">Permiso Personal</option>
              <option value="time_off">Día Libre</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Requests List */}
      <Card>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Empleado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tipo de Solicitud
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fechas
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Prioridad
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Enviado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredRequests
                .sort((a, b) => {
                  // Sort by priority (urgent first) then by date
                  if (a.status === 'pending' && b.status !== 'pending') return -1
                  if (a.status !== 'pending' && b.status === 'pending') return 1
                  
                  const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 }
                  const aPriority = priorityOrder[a.priority]
                  const bPriority = priorityOrder[b.priority]
                  
                  if (aPriority !== bPriority) return aPriority - bPriority
                  
                  return new Date(b.submittedDate).getTime() - new Date(a.submittedDate).getTime()
                })
                .map((request) => (
                <tr key={request.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{request.employeeName}</div>
                      <div className="text-sm text-gray-500">{request.employeePosition}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Tag variant={getTypeColor(request.type)}>
                      {getTypeText(request.type)}
                    </Tag>
                    <div className="text-xs text-gray-500 mt-1 max-w-xs truncate">
                      {request.reason}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {request.requestedDate && (
                      <div>
                        {new Date(request.requestedDate).toLocaleDateString('es-CO')}
                      </div>
                    )}
                    {request.startDate && request.endDate && (
                      <div>
                        {new Date(request.startDate).toLocaleDateString('es-CO')} - {new Date(request.endDate).toLocaleDateString('es-CO')}
                      </div>
                    )}
                    {request.originalShift && (
                      <div className="text-xs text-gray-500">
                        {new Date(request.originalShift.date).toLocaleDateString('es-CO')}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Tag variant={getPriorityColor(request.priority)}>
                      {getPriorityText(request.priority)}
                    </Tag>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Tag variant={getStatusColor(request.status)}>
                      {getStatusText(request.status)}
                    </Tag>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {getTimeSinceSubmission(request.submittedDate)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <Button
                      variant="text"
                                            onClick={() => openRequestDetail(request)}
                    >
                      {request.status === 'pending' ? 'Revisar' : 'Ver Detalles'}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Request Detail Modal */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title="Detalles de la Solicitud"
        size="lg"
      >
        {selectedRequest && (
          <div className="space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Empleado</label>
                <p className="text-sm text-gray-900">{selectedRequest.employeeName}</p>
                <p className="text-xs text-gray-500">{selectedRequest.employeePosition}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Tipo de Solicitud</label>
                <Tag variant={getTypeColor(selectedRequest.type)}>
                  {getTypeText(selectedRequest.type)}
                </Tag>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Prioridad</label>
                <Tag variant={getPriorityColor(selectedRequest.priority)}>
                  {getPriorityText(selectedRequest.priority)}
                </Tag>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Estado</label>
                <Tag variant={getStatusColor(selectedRequest.status)}>
                  {getStatusText(selectedRequest.status)}
                </Tag>
              </div>
            </div>

            {/* Request Details */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Motivo</label>
              <p className="text-sm text-gray-900">{selectedRequest.reason}</p>
            </div>

            {selectedRequest.description && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                <p className="text-sm text-gray-900">{selectedRequest.description}</p>
              </div>
            )}

            {/* Date Information */}
            {(selectedRequest.requestedDate || selectedRequest.startDate || selectedRequest.originalShift) && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Fechas</label>
                <div className="space-y-2">
                  {selectedRequest.requestedDate && (
                    <p className="text-sm text-gray-900">
                      <strong>Fecha solicitada:</strong> {new Date(selectedRequest.requestedDate).toLocaleDateString('es-CO')}
                    </p>
                  )}
                  {selectedRequest.startDate && selectedRequest.endDate && (
                    <p className="text-sm text-gray-900">
                      <strong>Período:</strong> {new Date(selectedRequest.startDate).toLocaleDateString('es-CO')} - {new Date(selectedRequest.endDate).toLocaleDateString('es-CO')}
                    </p>
                  )}
                  {selectedRequest.originalShift && (
                    <div className="text-sm text-gray-900">
                      <strong>Turno original:</strong> {new Date(selectedRequest.originalShift.date).toLocaleDateString('es-CO')} 
                      de {selectedRequest.originalShift.startTime} a {selectedRequest.originalShift.endTime}
                    </div>
                  )}
                  {selectedRequest.newShift && (
                    <div className="text-sm text-gray-900">
                      <strong>Nuevo turno:</strong> {new Date(selectedRequest.newShift.date).toLocaleDateString('es-CO')} 
                      de {selectedRequest.newShift.startTime} a {selectedRequest.newShift.endTime}
                    </div>
                  )}
                  {selectedRequest.replacementEmployeeName && (
                    <div className="text-sm text-gray-900">
                      <strong>Reemplazo:</strong> {selectedRequest.replacementEmployeeName}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Attachments */}
            {selectedRequest.attachments && selectedRequest.attachments.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Archivos Adjuntos</label>
                <div className="space-y-1">
                  {selectedRequest.attachments.map((attachment, index) => (
                    <div key={index} className="flex items-center text-sm text-blue-600 hover:text-blue-800">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                      </svg>
                      {attachment}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Manager Comments */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Comentarios del Supervisor
              </label>
              <textarea
                value={managerComments}
                onChange={(e) => setManagerComments(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                rows={3}
                placeholder="Agrega comentarios sobre esta solicitud..."
                disabled={selectedRequest.status !== 'pending'}
              />
            </div>

            {/* Actions */}
            {selectedRequest.status === 'pending' && (
              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                <Button 
                  variant="secondary" 
                  onClick={() => handleRequestAction('reject')}
                >
                  Rechazar
                </Button>
                <Button 
                  onClick={() => handleRequestAction('approve')}
                >
                  Aprobar
                </Button>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}