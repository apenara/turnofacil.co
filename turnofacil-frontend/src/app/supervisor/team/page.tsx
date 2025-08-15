'use client'

import React, { useState } from 'react'
import { Card, Button, Input, Modal, Tag } from '@/components/ui'
import { useNotifications } from '@/components/shared/NotificationSystem'

interface TeamMember {
  id: string
  name: string
  email: string
  phone: string
  position: string
  status: 'active' | 'on_leave' | 'sick' | 'vacation'
  weeklyHoursScheduled: number
  weeklyHoursWorked: number
  lastCheckIn: string
  availability: DayAvailability[]
  skills: string[]
  emergencyContact: {
    name: string
    phone: string
    relationship: string
  }
}

interface DayAvailability {
  day: number // 0-6 (Sunday-Saturday)
  available: boolean
  startTime?: string
  endTime?: string
  notes?: string
}

const mockTeamMembers: TeamMember[] = [
  {
    id: '1',
    name: 'Carlos López',
    email: 'carlos.lopez@empresa.com',
    phone: '+57 321 456 7890',
    position: 'Cocinero Senior',
    status: 'active',
    weeklyHoursScheduled: 48,
    weeklyHoursWorked: 46,
    lastCheckIn: '2024-01-15T14:30:00',
    skills: ['Cocina', 'Parrilla', 'Preparación', 'Supervisión'],
    emergencyContact: {
      name: 'María López',
      phone: '+57 300 123 4567',
      relationship: 'Esposa'
    },
    availability: [
      { day: 1, available: true, startTime: '06:00', endTime: '18:00' },
      { day: 2, available: true, startTime: '06:00', endTime: '18:00' },
      { day: 3, available: true, startTime: '06:00', endTime: '18:00' },
      { day: 4, available: true, startTime: '06:00', endTime: '18:00' },
      { day: 5, available: true, startTime: '06:00', endTime: '18:00' },
      { day: 6, available: false },
      { day: 0, available: false }
    ]
  },
  {
    id: '2',
    name: 'Ana Martínez',
    email: 'ana.martinez@empresa.com',
    phone: '+57 310 123 4567',
    position: 'Mesera',
    status: 'active',
    weeklyHoursScheduled: 44,
    weeklyHoursWorked: 44,
    lastCheckIn: '2024-01-15T16:00:00',
    skills: ['Atención al cliente', 'Caja', 'Servicio', 'Idiomas'],
    emergencyContact: {
      name: 'José Martínez',
      phone: '+57 320 987 6543',
      relationship: 'Padre'
    },
    availability: [
      { day: 1, available: true, startTime: '14:00', endTime: '23:00' },
      { day: 2, available: true, startTime: '14:00', endTime: '23:00' },
      { day: 3, available: true, startTime: '14:00', endTime: '23:00' },
      { day: 4, available: true, startTime: '14:00', endTime: '23:00' },
      { day: 5, available: true, startTime: '14:00', endTime: '23:00' },
      { day: 6, available: true, startTime: '12:00', endTime: '22:00' },
      { day: 0, available: true, startTime: '12:00', endTime: '22:00' }
    ]
  },
  {
    id: '3',
    name: 'Pedro García',
    email: 'pedro.garcia@empresa.com',
    phone: '+57 300 987 6543',
    position: 'Cajero',
    status: 'on_leave',
    weeklyHoursScheduled: 40,
    weeklyHoursWorked: 0,
    lastCheckIn: '2024-01-10T08:00:00',
    skills: ['Caja', 'Atención al cliente', 'Ventas', 'Inventario'],
    emergencyContact: {
      name: 'Carmen García',
      phone: '+57 315 654 3210',
      relationship: 'Madre'
    },
    availability: [
      { day: 1, available: true, startTime: '08:00', endTime: '16:00' },
      { day: 2, available: true, startTime: '08:00', endTime: '16:00' },
      { day: 3, available: true, startTime: '08:00', endTime: '16:00' },
      { day: 4, available: true, startTime: '08:00', endTime: '16:00' },
      { day: 5, available: true, startTime: '08:00', endTime: '16:00' },
      { day: 6, available: false },
      { day: 0, available: false }
    ]
  },
  {
    id: '4',
    name: 'Laura Rodríguez',
    email: 'laura.rodriguez@empresa.com',
    phone: '+57 312 345 6789',
    position: 'Auxiliar de Cocina',
    status: 'active',
    weeklyHoursScheduled: 40,
    weeklyHoursWorked: 42,
    lastCheckIn: '2024-01-15T13:45:00',
    skills: ['Preparación', 'Limpieza', 'Organización'],
    emergencyContact: {
      name: 'Miguel Rodríguez',
      phone: '+57 318 876 5432',
      relationship: 'Hermano'
    },
    availability: [
      { day: 1, available: true, startTime: '10:00', endTime: '18:00' },
      { day: 2, available: true, startTime: '10:00', endTime: '18:00' },
      { day: 3, available: true, startTime: '10:00', endTime: '18:00' },
      { day: 4, available: true, startTime: '10:00', endTime: '18:00' },
      { day: 5, available: true, startTime: '10:00', endTime: '18:00' },
      { day: 6, available: true, startTime: '09:00', endTime: '17:00' },
      { day: 0, available: false }
    ]
  }
]

const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

export default function TeamPage() {
  const [teamMembers] = useState<TeamMember[]>(mockTeamMembers)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<TeamMember['status'] | 'all'>('all')
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [isContactModalOpen, setIsContactModalOpen] = useState(false)
  const [contactMessage, setContactMessage] = useState('')

  const { addNotification } = useNotifications()

  const filteredMembers = teamMembers.filter(member => {
    const matchesSearch = member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === 'all' || member.status === filterStatus
    return matchesSearch && matchesStatus
  })

  const getStatusColor = (status: TeamMember['status']) => {
    switch (status) {
      case 'active':
        return 'success'
      case 'on_leave':
        return 'warning'
      case 'sick':
        return 'error'
      case 'vacation':
        return 'info'
      default:
        return 'default'
    }
  }

  const getStatusText = (status: TeamMember['status']) => {
    switch (status) {
      case 'active':
        return 'Activo'
      case 'on_leave':
        return 'Licencia'
      case 'sick':
        return 'Incapacidad'
      case 'vacation':
        return 'Vacaciones'
      default:
        return status
    }
  }

  const getHoursEfficiency = (scheduled: number, worked: number) => {
    if (scheduled === 0) return 0
    return Math.round((worked / scheduled) * 100)
  }

  const getEfficiencyColor = (efficiency: number) => {
    if (efficiency >= 95) return 'text-green-600'
    if (efficiency >= 85) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getLastCheckInText = (checkIn: string) => {
    const now = new Date()
    const checkInDate = new Date(checkIn)
    const diffInHours = (now.getTime() - checkInDate.getTime()) / (1000 * 60 * 60)
    
    if (diffInHours < 1) return 'Hace unos minutos'
    if (diffInHours < 24) return `Hace ${Math.floor(diffInHours)} horas`
    return `Hace ${Math.floor(diffInHours / 24)} días`
  }

  const openMemberDetail = (member: TeamMember) => {
    setSelectedMember(member)
    setIsDetailModalOpen(true)
  }

  const openContactModal = (member: TeamMember) => {
    setSelectedMember(member)
    setContactMessage('')
    setIsContactModalOpen(true)
  }

  const sendMessage = () => {
    if (!selectedMember || !contactMessage.trim()) return
    
    addNotification({
      type: 'success',
      title: 'Mensaje enviado',
      message: `Mensaje enviado a ${selectedMember.name}`
    })
    
    setIsContactModalOpen(false)
    setContactMessage('')
    setSelectedMember(null)
  }

  const activeMembers = teamMembers.filter(m => m.status === 'active').length
  const totalScheduledHours = teamMembers.reduce((sum, m) => sum + m.weeklyHoursScheduled, 0)
  const totalWorkedHours = teamMembers.reduce((sum, m) => sum + m.weeklyHoursWorked, 0)
  const teamEfficiency = totalScheduledHours > 0 ? Math.round((totalWorkedHours / totalScheduledHours) * 100) : 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Mi Equipo</h1>
          <p className="text-gray-600">Gestiona y supervisa tu equipo de trabajo</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-600">Total Empleados</h3>
              <p className="text-2xl font-bold text-gray-900">{teamMembers.length}</p>
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
              <h3 className="text-sm font-medium text-gray-600">Activos</h3>
              <p className="text-2xl font-bold text-gray-900">{activeMembers}</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-600">Horas Semanales</h3>
              <p className="text-2xl font-bold text-gray-900">{totalWorkedHours}</p>
              <p className="text-xs text-gray-500">de {totalScheduledHours} programadas</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-600">Eficiencia</h3>
              <p className={`text-2xl font-bold ${getEfficiencyColor(teamEfficiency)}`}>
                {teamEfficiency}%
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4">
          <div className="flex-1">
            <Input
              placeholder="Buscar empleados..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex space-x-4">
            <select
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as TeamMember['status'] | 'all')}
            >
              <option value="all">Todos los estados</option>
              <option value="active">Activos</option>
              <option value="on_leave">En licencia</option>
              <option value="sick">Incapacidad</option>
              <option value="vacation">Vacaciones</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Team Members Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredMembers.map((member) => {
          const efficiency = getHoursEfficiency(member.weeklyHoursScheduled, member.weeklyHoursWorked)
          
          return (
            <Card key={member.id} className="hover:shadow-lg transition-shadow">
              <div className="p-6">
                {/* Member Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                      <span className="text-primary-700 font-medium text-lg">
                        {member.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-lg font-semibold text-gray-900">{member.name}</h3>
                      <p className="text-sm text-gray-600">{member.position}</p>
                    </div>
                  </div>
                  <Tag variant={getStatusColor(member.status)}>
                    {getStatusText(member.status)}
                  </Tag>
                </div>

                {/* Contact Info */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-sm text-gray-600">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    {member.email}
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    {member.phone}
                  </div>
                </div>

                {/* Hours and Efficiency */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-lg font-bold text-gray-900">{member.weeklyHoursWorked}h</div>
                    <div className="text-xs text-gray-600">Trabajadas</div>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className={`text-lg font-bold ${getEfficiencyColor(efficiency)}`}>
                      {efficiency}%
                    </div>
                    <div className="text-xs text-gray-600">Eficiencia</div>
                  </div>
                </div>

                {/* Skills */}
                <div className="mb-4">
                  <p className="text-xs font-medium text-gray-700 mb-2">Habilidades:</p>
                  <div className="flex flex-wrap gap-1">
                    {member.skills.slice(0, 3).map((skill, index) => (
                      <Tag key={index} variant="info" size="sm">
                        {skill}
                      </Tag>
                    ))}
                    {member.skills.length > 3 && (
                      <Tag variant="default" size="sm">
                        +{member.skills.length - 3}
                      </Tag>
                    )}
                  </div>
                </div>

                {/* Last Check-in */}
                <div className="text-xs text-gray-500 mb-4">
                  Último check-in: {getLastCheckInText(member.lastCheckIn)}
                </div>

                {/* Actions */}
                <div className="flex space-x-2">
                  <Button
                    variant="text"
                    size="sm"
                    onClick={() => openMemberDetail(member)}
                    className="flex-1"
                  >
                    Ver Detalles
                  </Button>
                  <Button
                    variant="text"
                    size="sm"
                    onClick={() => openContactModal(member)}
                    className="flex-1"
                  >
                    Contactar
                  </Button>
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      {/* Member Detail Modal */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title="Detalles del Empleado"
        size="lg"
      >
        {selectedMember && (
          <div className="space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Nombre completo</label>
                <p className="text-sm text-gray-900">{selectedMember.name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Posición</label>
                <p className="text-sm text-gray-900">{selectedMember.position}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <p className="text-sm text-gray-900">{selectedMember.email}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Teléfono</label>
                <p className="text-sm text-gray-900">{selectedMember.phone}</p>
              </div>
            </div>

            {/* Emergency Contact */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Contacto de Emergencia</h4>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs text-gray-600">Nombre</label>
                  <p className="text-sm text-gray-900">{selectedMember.emergencyContact.name}</p>
                </div>
                <div>
                  <label className="block text-xs text-gray-600">Teléfono</label>
                  <p className="text-sm text-gray-900">{selectedMember.emergencyContact.phone}</p>
                </div>
                <div>
                  <label className="block text-xs text-gray-600">Relación</label>
                  <p className="text-sm text-gray-900">{selectedMember.emergencyContact.relationship}</p>
                </div>
              </div>
            </div>

            {/* Skills */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Habilidades</h4>
              <div className="flex flex-wrap gap-2">
                {selectedMember.skills.map((skill, index) => (
                  <Tag key={index} variant="info">
                    {skill}
                  </Tag>
                ))}
              </div>
            </div>

            {/* Availability */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Disponibilidad Semanal</h4>
              <div className="grid grid-cols-7 gap-2">
                {selectedMember.availability.map((day, index) => (
                  <div key={index} className="text-center">
                    <div className="text-xs font-medium text-gray-700 mb-1">
                      {dayNames[day.day]}
                    </div>
                    <div className={`p-2 rounded text-xs ${
                      day.available 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-500'
                    }`}>
                      {day.available && day.startTime && day.endTime
                        ? `${day.startTime}-${day.endTime}`
                        : 'No disponible'
                      }
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Contact Modal */}
      <Modal
        isOpen={isContactModalOpen}
        onClose={() => setIsContactModalOpen(false)}
        title="Enviar Mensaje"
        size="md"
      >
        {selectedMember && (
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-600">
                <strong>Para:</strong> {selectedMember.name} ({selectedMember.email})
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mensaje
              </label>
              <textarea
                value={contactMessage}
                onChange={(e) => setContactMessage(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                rows={4}
                placeholder="Escribe tu mensaje aquí..."
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <Button variant="secondary" onClick={() => setIsContactModalOpen(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={sendMessage}
                disabled={!contactMessage.trim()}
              >
                Enviar Mensaje
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}