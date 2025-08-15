'use client'

import React, { useState } from 'react'
import { Card, Button, Input, Modal, Tag } from '@/components/ui'
import { useReportGenerator } from '@/components/shared/ReportGenerator'

interface ScheduleApproval {
  id: string
  weekRange: string
  location: string
  supervisor: string
  supervisorId: string
  submittedDate: string
  totalHours: number
  totalEmployees: number
  estimatedCost: number
  status: 'pending' | 'approved' | 'rejected' | 'changes_requested'
  comments?: string
  shifts: ScheduleShift[]
}

interface ScheduleShift {
  id: string
  employeeId: string
  employeeName: string
  position: string
  date: string
  startTime: string
  endTime: string
  duration: number
  type: 'regular' | 'overtime' | 'night' | 'holiday'
  cost: number
}

const mockScheduleApprovals: ScheduleApproval[] = [
  {
    id: '1',
    weekRange: '2024-01-15 - 2024-01-21',
    location: 'Sede Principal',
    supervisor: 'María García',
    supervisorId: '1',
    submittedDate: '2024-01-12',
    totalHours: 384,
    totalEmployees: 12,
    estimatedCost: 2450000,
    status: 'pending',
    shifts: [
      {
        id: '1',
        employeeId: '1',
        employeeName: 'Carlos López',
        position: 'Cocinero',
        date: '2024-01-15',
        startTime: '06:00',
        endTime: '14:00',
        duration: 8,
        type: 'regular',
        cost: 50000
      },
      {
        id: '2',
        employeeId: '2',
        employeeName: 'Ana Martínez',
        position: 'Mesera',
        date: '2024-01-15',
        startTime: '14:00',
        endTime: '22:00',
        duration: 8,
        type: 'regular',
        cost: 45834
      }
    ]
  },
  {
    id: '2',
    weekRange: '2024-01-15 - 2024-01-21',
    location: 'Sucursal Norte',
    supervisor: 'Carlos López',
    supervisorId: '2',
    submittedDate: '2024-01-13',
    totalHours: 256,
    totalEmployees: 8,
    estimatedCost: 1680000,
    status: 'approved',
    comments: 'Horario aprobado. Cumple con todos los requisitos.',
    shifts: []
  },
  {
    id: '3',
    weekRange: '2024-01-08 - 2024-01-14',
    location: 'Punto Chapinero',
    supervisor: 'Ana Rodríguez',
    supervisorId: '3',
    submittedDate: '2024-01-05',
    totalHours: 320,
    totalEmployees: 10,
    estimatedCost: 2100000,
    status: 'changes_requested',
    comments: 'Se requieren ajustes en los turnos nocturnos. Verificar cumplimiento de recargos.',
    shifts: []
  },
  {
    id: '4',
    weekRange: '2024-01-01 - 2024-01-07',
    location: 'Sede Principal',
    supervisor: 'María García',
    supervisorId: '1',
    submittedDate: '2023-12-29',
    totalHours: 400,
    totalEmployees: 12,
    estimatedCost: 2800000,
    status: 'rejected',
    comments: 'Excede el presupuesto aprobado para la semana. Revisar asignación de horas extras.',
    shifts: []
  }
]

const locations = ['Sede Principal', 'Sucursal Norte', 'Punto Chapinero']

export default function ScheduleApprovalsPage() {
  const [schedules, setSchedules] = useState<ScheduleApproval[]>(mockScheduleApprovals)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<ScheduleApproval['status'] | 'all'>('all')
  const [filterLocation, setFilterLocation] = useState<string>('all')
  const [selectedSchedule, setSelectedSchedule] = useState<ScheduleApproval | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<'view' | 'approve' | 'reject'>('view')
  const [approvalComments, setApprovalComments] = useState('')

  const { generateReport, ReportModal } = useReportGenerator()

  const filteredSchedules = schedules.filter(schedule => {
    const matchesSearch = schedule.supervisor.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         schedule.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         schedule.weekRange.includes(searchTerm)
    const matchesStatus = filterStatus === 'all' || schedule.status === filterStatus
    const matchesLocation = filterLocation === 'all' || schedule.location === filterLocation
    return matchesSearch && matchesStatus && matchesLocation
  })

  const getStatusColor = (status: ScheduleApproval['status']) => {
    switch (status) {
      case 'pending':
        return 'warning'
      case 'approved':
        return 'success'
      case 'rejected':
        return 'error'
      case 'changes_requested':
        return 'info'
      default:
        return 'default'
    }
  }

  const getStatusText = (status: ScheduleApproval['status']) => {
    switch (status) {
      case 'pending':
        return 'Pendiente'
      case 'approved':
        return 'Aprobado'
      case 'rejected':
        return 'Rechazado'
      case 'changes_requested':
        return 'Cambios Solicitados'
      default:
        return status
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const openModal = (mode: 'view' | 'approve' | 'reject', schedule: ScheduleApproval) => {
    setModalMode(mode)
    setSelectedSchedule(schedule)
    setApprovalComments(schedule.comments || '')
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setSelectedSchedule(null)
    setApprovalComments('')
  }

  const handleApproval = (status: 'approved' | 'rejected' | 'changes_requested') => {
    if (!selectedSchedule) return

    setSchedules(schedules.map(schedule =>
      schedule.id === selectedSchedule.id
        ? { 
            ...schedule, 
            status, 
            comments: approvalComments || undefined 
          }
        : schedule
    ))
    closeModal()
  }

  const handleExportReport = () => {
    generateReport({
      title: 'Reporte de Aprobación de Horarios',
      subtitle: 'Estado de horarios semanales por ubicación',
      company: 'TurnoFacil CO',
      generatedBy: 'Administrador',
      generatedAt: new Date(),
      data: filteredSchedules,
      columns: [
        { key: 'weekRange', title: 'Semana', type: 'text' },
        { key: 'location', title: 'Ubicación', type: 'text' },
        { key: 'supervisor', title: 'Supervisor', type: 'text' },
        { key: 'totalEmployees', title: 'Empleados', type: 'number' },
        { key: 'totalHours', title: 'Horas Total', type: 'number' },
        { key: 'estimatedCost', title: 'Costo Estimado', type: 'currency' },
        { key: 'status', title: 'Estado', type: 'text' }
      ],
      summary: [
        { label: 'Total Horarios', value: filteredSchedules.length, type: 'number' },
        { label: 'Pendientes', value: filteredSchedules.filter(s => s.status === 'pending').length, type: 'number' },
        { label: 'Aprobados', value: filteredSchedules.filter(s => s.status === 'approved').length, type: 'number' },
        { label: 'Costo Total Estimado', value: filteredSchedules.reduce((sum, s) => sum + s.estimatedCost, 0), type: 'currency' }
      ]
    })
  }

  const pendingSchedules = schedules.filter(s => s.status === 'pending').length
  const approvedSchedules = schedules.filter(s => s.status === 'approved').length
  const totalCost = schedules.filter(s => s.status === 'approved').reduce((sum, s) => sum + s.estimatedCost, 0)
  const totalHours = schedules.filter(s => s.status === 'approved').reduce((sum, s) => sum + s.totalHours, 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Aprobación de Horarios</h1>
          <p className="text-gray-600">Revisa y aprueba los horarios semanales enviados por supervisores</p>
        </div>
        <div className="flex space-x-3">
          <Button variant="secondary" onClick={handleExportReport}>
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
            </svg>
            Exportar
          </Button>
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
              <p className="text-2xl font-bold text-gray-900">{pendingSchedules}</p>
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
              <h3 className="text-sm font-medium text-gray-600">Aprobados</h3>
              <p className="text-2xl font-bold text-gray-900">{approvedSchedules}</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-600">Horas Aprobadas</h3>
              <p className="text-2xl font-bold text-gray-900">{totalHours.toLocaleString()}</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-600">Costo Aprobado</h3>
              <p className="text-xl font-bold text-gray-900">{formatCurrency(totalCost)}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4">
          <div className="flex-1">
            <Input
              placeholder="Buscar por supervisor, ubicación o semana..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex space-x-4">
            <select
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as ScheduleApproval['status'] | 'all')}
            >
              <option value="all">Todos los estados</option>
              <option value="pending">Pendientes</option>
              <option value="approved">Aprobados</option>
              <option value="rejected">Rechazados</option>
              <option value="changes_requested">Cambios Solicitados</option>
            </select>
            <select
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              value={filterLocation}
              onChange={(e) => setFilterLocation(e.target.value)}
            >
              <option value="all">Todas las ubicaciones</option>
              {locations.map(location => (
                <option key={location} value={location}>{location}</option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* Schedules Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Semana
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ubicación
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Supervisor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Empleados/Horas
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Costo Estimado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredSchedules.map((schedule) => (
                <tr key={schedule.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{schedule.weekRange}</div>
                      <div className="text-sm text-gray-500">
                        Enviado: {new Date(schedule.submittedDate).toLocaleDateString('es-CO')}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {schedule.location}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {schedule.supervisor}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div>
                      <div className="font-medium">{schedule.totalEmployees} empleados</div>
                      <div className="text-gray-500">{schedule.totalHours} horas</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatCurrency(schedule.estimatedCost)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Tag variant={getStatusColor(schedule.status)}>
                      {getStatusText(schedule.status)}
                    </Tag>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <Button
                        variant="text"
                        size="sm"
                        onClick={() => openModal('view', schedule)}
                      >
                        Ver
                      </Button>
                      {schedule.status === 'pending' && (
                        <>
                          <Button
                            variant="text"
                            size="sm"
                            onClick={() => openModal('approve', schedule)}
                            className="text-green-600 hover:text-green-700"
                          >
                            Aprobar
                          </Button>
                          <Button
                            variant="text"
                            size="sm"
                            onClick={() => openModal('reject', schedule)}
                            className="text-red-600 hover:text-red-700"
                          >
                            Rechazar
                          </Button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Schedule Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={
          modalMode === 'view' ? 'Detalles del Horario' :
          modalMode === 'approve' ? 'Aprobar Horario' :
          'Rechazar Horario'
        }
        size="xl"
      >
        {selectedSchedule && (
          <div className="space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Semana</label>
                <p className="text-sm text-gray-900">{selectedSchedule.weekRange}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Ubicación</label>
                <p className="text-sm text-gray-900">{selectedSchedule.location}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Supervisor</label>
                <p className="text-sm text-gray-900">{selectedSchedule.supervisor}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Fecha de Envío</label>
                <p className="text-sm text-gray-900">
                  {new Date(selectedSchedule.submittedDate).toLocaleDateString('es-CO')}
                </p>
              </div>
            </div>

            {/* Summary */}
            <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">{selectedSchedule.totalEmployees}</p>
                <p className="text-sm text-gray-600">Empleados</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">{selectedSchedule.totalHours}</p>
                <p className="text-sm text-gray-600">Horas Total</p>
              </div>
              <div className="text-center">
                <p className="text-xl font-bold text-gray-900">{formatCurrency(selectedSchedule.estimatedCost)}</p>
                <p className="text-sm text-gray-600">Costo Estimado</p>
              </div>
            </div>

            {/* Shifts Preview (only if available) */}
            {selectedSchedule.shifts.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Turnos Programados</h4>
                <div className="max-h-64 overflow-y-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="px-3 py-2 text-left">Empleado</th>
                        <th className="px-3 py-2 text-left">Fecha</th>
                        <th className="px-3 py-2 text-left">Horario</th>
                        <th className="px-3 py-2 text-left">Tipo</th>
                        <th className="px-3 py-2 text-left">Costo</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedSchedule.shifts.map(shift => (
                        <tr key={shift.id} className="border-b border-gray-200">
                          <td className="px-3 py-2">
                            <div>
                              <div className="font-medium">{shift.employeeName}</div>
                              <div className="text-gray-500 text-xs">{shift.position}</div>
                            </div>
                          </td>
                          <td className="px-3 py-2">
                            {new Date(shift.date).toLocaleDateString('es-CO')}
                          </td>
                          <td className="px-3 py-2">
                            {shift.startTime} - {shift.endTime}
                            <div className="text-gray-500 text-xs">{shift.duration}h</div>
                          </td>
                          <td className="px-3 py-2">
                            <Tag 
                              variant={
                                shift.type === 'regular' ? 'default' :
                                shift.type === 'overtime' ? 'warning' :
                                shift.type === 'night' ? 'info' : 'error'
                              }
                              size="sm"
                            >
                              {shift.type === 'regular' ? 'Regular' :
                               shift.type === 'overtime' ? 'Extra' :
                               shift.type === 'night' ? 'Nocturno' : 'Festivo'}
                            </Tag>
                          </td>
                          <td className="px-3 py-2">
                            {formatCurrency(shift.cost)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Current Comments */}
            {selectedSchedule.comments && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Comentarios Previos</label>
                <p className="text-sm text-gray-600 p-3 bg-gray-50 rounded-md">{selectedSchedule.comments}</p>
              </div>
            )}

            {/* Action Comments */}
            {(modalMode === 'approve' || modalMode === 'reject') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {modalMode === 'approve' ? 'Comentarios de Aprobación' : 'Razón del Rechazo'}
                </label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  rows={3}
                  value={approvalComments}
                  onChange={(e) => setApprovalComments(e.target.value)}
                  placeholder={
                    modalMode === 'approve' 
                      ? 'Comentarios adicionales sobre la aprobación...'
                      : 'Especifica los motivos del rechazo...'
                  }
                />
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end space-x-4 pt-4">
              <Button variant="secondary" onClick={closeModal}>
                Cancelar
              </Button>
              {modalMode === 'approve' && (
                <>
                  <Button 
                    variant="secondary"
                    onClick={() => handleApproval('changes_requested')}
                  >
                    Solicitar Cambios
                  </Button>
                  <Button onClick={() => handleApproval('approved')}>
                    Aprobar Horario
                  </Button>
                </>
              )}
              {modalMode === 'reject' && (
                <Button 
                  variant="error" 
                  onClick={() => handleApproval('rejected')}
                  disabled={!approvalComments.trim()}
                >
                  Rechazar Horario
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>

      <ReportModal />
    </div>
  )
}