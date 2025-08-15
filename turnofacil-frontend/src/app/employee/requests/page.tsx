'use client'

import { useState } from 'react'
import { Card, Button, Input, Modal, Tag } from '@/components/ui'

interface Request {
  id: string
  type: 'shift_change' | 'absence'
  date: string
  reason: string
  status: 'pending' | 'approved' | 'rejected'
  createdAt: string
  details?: {
    originalShift?: {
      date: string
      startTime: string
      endTime: string
    }
    requestedChange?: string
    documentUrl?: string
  }
}

const mockRequests: Request[] = [
  {
    id: '1',
    type: 'shift_change',
    date: '2024-01-25',
    reason: 'Cita médica',
    status: 'pending',
    createdAt: '2024-01-21T10:00:00',
    details: {
      originalShift: {
        date: '2024-01-25',
        startTime: '08:00',
        endTime: '16:00'
      },
      requestedChange: 'Cambiar a turno de tarde (14:00 - 22:00)'
    }
  },
  {
    id: '2',
    type: 'absence',
    date: '2024-01-18',
    reason: 'Enfermedad',
    status: 'approved',
    createdAt: '2024-01-18T07:30:00',
    details: {
      documentUrl: '/documents/incapacidad_123.pdf'
    }
  }
]

export default function EmployeeRequests() {
  const [requests, setRequests] = useState<Request[]>(mockRequests)
  const [showNewRequestModal, setShowNewRequestModal] = useState(false)
  const [newRequest, setNewRequest] = useState({
    type: 'shift_change' as 'shift_change' | 'absence',
    selectedShift: '',
    date: '',
    reason: '',
    details: '',
    document: null as File | null
  })

  const handleSubmitRequest = (e: React.FormEvent) => {
    e.preventDefault()
    
    const request: Request = {
      id: `${requests.length + 1}`,
      type: newRequest.type,
      date: newRequest.date,
      reason: newRequest.reason,
      status: 'pending',
      createdAt: new Date().toISOString(),
      details: {
        requestedChange: newRequest.details,
        documentUrl: newRequest.document ? '/documents/temp_document.pdf' : undefined
      }
    }

    setRequests([request, ...requests])
    setShowNewRequestModal(false)
    setNewRequest({
      type: 'shift_change',
      selectedShift: '',
      date: '',
      reason: '',
      details: '',
      document: null
    })
  }

  const getStatusColor = (status: Request['status']) => {
    switch (status) {
      case 'pending':
        return 'warning'
      case 'approved':
        return 'success'
      case 'rejected':
        return 'error'
      default:
        return 'default'
    }
  }

  const getStatusText = (status: Request['status']) => {
    switch (status) {
      case 'pending':
        return 'Pendiente'
      case 'approved':
        return 'Aprobada'
      case 'rejected':
        return 'Rechazada'
      default:
        return status
    }
  }

  const getTypeText = (type: Request['type']) => {
    switch (type) {
      case 'shift_change':
        return 'Cambio de turno'
      case 'absence':
        return 'Reporte de ausencia'
      default:
        return type
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-CO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const upcomingShifts = [
    { id: '1', date: '2024-01-22', time: '08:00 - 16:00', position: 'Cocinero' },
    { id: '2', date: '2024-01-23', time: '10:00 - 18:00', position: 'Cocinero' },
    { id: '3', date: '2024-01-24', time: '12:00 - 20:00', position: 'Cocinero' },
    { id: '4', date: '2024-01-25', time: '08:00 - 16:00', position: 'Cocinero' }
  ]

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
        <Button onClick={() => setShowNewRequestModal(true)}>
          Nueva Solicitud
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <div className="text-center">
            <p className="text-2xl font-bold text-semantic-warning">
              {requests.filter(r => r.status === 'pending').length}
            </p>
            <p className="text-sm text-neutral-dark-gray">Pendientes</p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-2xl font-bold text-semantic-success">
              {requests.filter(r => r.status === 'approved').length}
            </p>
            <p className="text-sm text-neutral-dark-gray">Aprobadas</p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-2xl font-bold text-semantic-error">
              {requests.filter(r => r.status === 'rejected').length}
            </p>
            <p className="text-sm text-neutral-dark-gray">Rechazadas</p>
          </div>
        </Card>
      </div>

      {/* Requests List */}
      <Card>
        <h2 className="text-xl font-semibold mb-6">Historial de Solicitudes</h2>
        
        {requests.length === 0 ? (
          <div className="text-center py-12">
            <svg className="w-16 h-16 text-neutral-medium-gray mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
            </svg>
            <p className="text-neutral-medium-gray mb-4">No tienes solicitudes aún</p>
            <Button onClick={() => setShowNewRequestModal(true)}>
              Crear tu primera solicitud
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {requests.map((request) => (
              <div key={request.id} className="border border-neutral-light-gray rounded-lg p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="font-semibold text-lg">{getTypeText(request.type)}</h3>
                      <Tag variant={getStatusColor(request.status)}>
                        {getStatusText(request.status)}
                      </Tag>
                    </div>
                    
                    <div className="space-y-2 text-sm text-neutral-dark-gray">
                      <p><strong>Fecha:</strong> {formatDate(request.date)}</p>
                      <p><strong>Motivo:</strong> {request.reason}</p>
                      
                      {request.details?.originalShift && (
                        <p>
                          <strong>Turno original:</strong> {formatDate(request.details.originalShift.date)} 
                          de {request.details.originalShift.startTime} a {request.details.originalShift.endTime}
                        </p>
                      )}
                      
                      {request.details?.requestedChange && (
                        <p><strong>Cambio solicitado:</strong> {request.details.requestedChange}</p>
                      )}
                      
                      {request.details?.documentUrl && (
                        <p>
                          <strong>Documento:</strong> 
                          <a href={request.details.documentUrl} className="text-primary hover:underline ml-1">
                            Ver documento adjunto
                          </a>
                        </p>
                      )}
                      
                      <p className="text-neutral-medium-gray">
                        Enviada el {formatDateTime(request.createdAt)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    {request.status === 'pending' && (
                      <Button variant="secondary" size="sm">
                        Editar
                      </Button>
                    )}
                    <Button variant="text" size="sm">
                      Ver detalles
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* New Request Modal */}
      <Modal
        isOpen={showNewRequestModal}
        onClose={() => setShowNewRequestModal(false)}
        title="Nueva Solicitud"
        size="lg"
      >
        <form onSubmit={handleSubmitRequest} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-neutral-dark-gray mb-2">
              Tipo de solicitud
            </label>
            <div className="grid grid-cols-2 gap-4">
              <Card 
                className={`p-4 cursor-pointer border-2 transition-colors ${
                  newRequest.type === 'shift_change' 
                    ? 'border-primary bg-primary/5' 
                    : 'border-neutral-light-gray hover:border-primary/40'
                }`}
                onClick={() => setNewRequest({...newRequest, type: 'shift_change'})}
              >
                <div className="text-center">
                  <svg className="w-8 h-8 text-primary mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2-2V7z" />
                  </svg>
                  <h3 className="font-medium">Cambio de Turno</h3>
                  <p className="text-xs text-neutral-medium-gray">Solicitar cambio en un turno programado</p>
                </div>
              </Card>
              
              <Card 
                className={`p-4 cursor-pointer border-2 transition-colors ${
                  newRequest.type === 'absence' 
                    ? 'border-primary bg-primary/5' 
                    : 'border-neutral-light-gray hover:border-primary/40'
                }`}
                onClick={() => setNewRequest({...newRequest, type: 'absence'})}
              >
                <div className="text-center">
                  <svg className="w-8 h-8 text-primary mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <h3 className="font-medium">Reportar Ausencia</h3>
                  <p className="text-xs text-neutral-medium-gray">Informar sobre enfermedad o calamidad</p>
                </div>
              </Card>
            </div>
          </div>

          {newRequest.type === 'shift_change' && (
            <div>
              <label className="block text-sm font-medium text-neutral-dark-gray mb-2">
                Selecciona el turno a cambiar
              </label>
              <select
                className="w-full px-sm py-sm rounded-md border border-neutral-light-gray focus:border-primary focus:ring-primary bg-white text-neutral-black focus:outline-none focus:ring-2 focus:ring-opacity-20"
                value={newRequest.selectedShift}
                onChange={(e) => setNewRequest({...newRequest, selectedShift: e.target.value})}
                required
              >
                <option value="">Selecciona un turno</option>
                {upcomingShifts.map((shift) => (
                  <option key={shift.id} value={shift.id}>
                    {formatDate(shift.date)} - {shift.time} ({shift.position})
                  </option>
                ))}
              </select>
            </div>
          )}

          {newRequest.type === 'absence' && (
            <Input
              label="Fecha de ausencia"
              type="date"
              value={newRequest.date}
              onChange={(e) => setNewRequest({...newRequest, date: e.target.value})}
              required
            />
          )}

          <Input
            label="Motivo"
            value={newRequest.reason}
            onChange={(e) => setNewRequest({...newRequest, reason: e.target.value})}
            placeholder={newRequest.type === 'shift_change' ? 'Ej: Cita médica' : 'Ej: Enfermedad'}
            required
          />

          <div>
            <label className="block text-sm font-medium text-neutral-dark-gray mb-2">
              Detalles adicionales
            </label>
            <textarea
              className="w-full px-sm py-sm rounded-md border border-neutral-light-gray focus:border-primary focus:ring-primary bg-white text-neutral-black focus:outline-none focus:ring-2 focus:ring-opacity-20"
              rows={3}
              value={newRequest.details}
              onChange={(e) => setNewRequest({...newRequest, details: e.target.value})}
              placeholder={
                newRequest.type === 'shift_change' 
                  ? 'Especifica el cambio que solicitas (ej: cambiar a turno de tarde)'
                  : 'Proporciona información adicional si es necesario'
              }
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-dark-gray mb-2">
              Documento de soporte {newRequest.type === 'absence' && '(Requerido para ausencias)'}
            </label>
            <div className="border-2 border-dashed border-neutral-light-gray rounded-lg p-6 text-center">
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => setNewRequest({...newRequest, document: e.target.files?.[0] || null})}
                className="hidden"
                id="document-upload"
                required={newRequest.type === 'absence'}
              />
              <label htmlFor="document-upload" className="cursor-pointer">
                <svg className="w-8 h-8 text-neutral-medium-gray mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p className="text-neutral-dark-gray">
                  {newRequest.document ? newRequest.document.name : 'Haz clic para subir un archivo'}
                </p>
                <p className="text-xs text-neutral-medium-gray mt-1">
                  PDF, JPG, PNG (máx. 5MB)
                </p>
              </label>
            </div>
          </div>

          <div className="flex justify-end space-x-4 pt-4">
            <Button 
              type="button" 
              variant="secondary"
              onClick={() => setShowNewRequestModal(false)}
            >
              Cancelar
            </Button>
            <Button type="submit">
              Enviar Solicitud
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}