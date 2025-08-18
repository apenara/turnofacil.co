'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card, Button, Tag } from '@/components/ui'

interface TeamMetrics {
  teamMembers: number
  activeShifts: number
  pendingRequests: number
  weeklyHours: number
  pendingApproval: boolean
}

interface TeamMember {
  id: string
  name: string
  position: string
  status: 'active' | 'on_shift' | 'off_duty'
  todayShift?: {
    start: string
    end: string
  }
}

const mockMetrics: TeamMetrics = {
  teamMembers: 6,
  activeShifts: 3,
  pendingRequests: 2,
  weeklyHours: 48,
  pendingApproval: true
}

const mockTeamMembers: TeamMember[] = [
  {
    id: '1',
    name: 'Carlos López',
    position: 'Cocinero',
    status: 'on_shift',
    todayShift: { start: '08:00', end: '16:00' }
  },
  {
    id: '2',
    name: 'Ana Martínez',
    position: 'Mesera',
    status: 'on_shift',
    todayShift: { start: '10:00', end: '18:00' }
  },
  {
    id: '3',
    name: 'Luis Rodríguez',
    position: 'Cajero',
    status: 'on_shift',
    todayShift: { start: '12:00', end: '20:00' }
  },
  {
    id: '4',
    name: 'Elena García',
    position: 'Mesera',
    status: 'off_duty'
  },
  {
    id: '5',
    name: 'Pedro Sánchez',
    position: 'Cocinero',
    status: 'off_duty'
  },
  {
    id: '6',
    name: 'Sofia Herrera',
    position: 'Hostess',
    status: 'active'
  }
]

export default function SupervisorDashboard() {
  const [metrics] = useState<TeamMetrics>(mockMetrics)
  const [teamMembers] = useState<TeamMember[]>(mockTeamMembers)

  const getStatusColor = (status: TeamMember['status']) => {
    switch (status) {
      case 'on_shift':
        return 'success'
      case 'active':
        return 'info'
      case 'off_duty':
        return 'default'
      default:
        return 'default'
    }
  }

  const getStatusText = (status: TeamMember['status']) => {
    switch (status) {
      case 'on_shift':
        return 'En turno'
      case 'active':
        return 'Disponible'
      case 'off_duty':
        return 'Libre'
      default:
        return status
    }
  }

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-lg p-6">
        <h1 className="text-2xl font-bold text-neutral-black mb-2">
          Panel de Supervisor
        </h1>
        <p className="text-neutral-dark-gray">
          Gestiona los horarios y solicitudes de tu equipo de trabajo.
        </p>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-neutral-dark-gray">Mi equipo</h3>
              <p className="text-2xl font-bold text-neutral-black">{metrics.teamMembers}</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-semantic-success/10 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-semantic-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-neutral-dark-gray">En turno ahora</h3>
              <p className="text-2xl font-bold text-neutral-black">{metrics.activeShifts}</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-semantic-warning/10 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-semantic-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-neutral-dark-gray">Solicitudes</h3>
              <p className="text-2xl font-bold text-neutral-black">{metrics.pendingRequests}</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-secondary/10 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2-2V7z" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-neutral-dark-gray">Horas semana</h3>
              <p className="text-2xl font-bold text-neutral-black">{metrics.weeklyHours}h</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Quick Actions */}
        <Card>
          <h2 className="text-xl font-semibold mb-6">Acciones Rápidas</h2>
          <div className="grid grid-cols-2 gap-4">
            <Link href="/supervisor/schedule-creator">
              <Card className="p-4 hover:shadow-lg transition-shadow cursor-pointer border border-primary/20 hover:border-primary/40">
                <div className="text-center">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2-2V7z" />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-sm">Crear Horario</h3>
                  <p className="text-xs text-neutral-medium-gray mt-1">Planificar turnos del equipo</p>
                </div>
              </Card>
            </Link>

            <Link href="/supervisor/requests">
              <Card className="p-4 hover:shadow-lg transition-shadow cursor-pointer border border-semantic-warning/20 hover:border-semantic-warning/40">
                <div className="text-center">
                  <div className="w-12 h-12 bg-semantic-warning/10 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <svg className="w-6 h-6 text-semantic-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-sm">Ver Solicitudes</h3>
                  <p className="text-xs text-neutral-medium-gray mt-1">Revisar peticiones del equipo</p>
                </div>
              </Card>
            </Link>

            <Link href="/supervisor/team">
              <Card className="p-4 hover:shadow-lg transition-shadow cursor-pointer border border-secondary/20 hover:border-secondary/40">
                <div className="text-center">
                  <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <svg className="w-6 h-6 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-sm">Ver Equipo</h3>
                  <p className="text-xs text-neutral-medium-gray mt-1">Gestionar colaboradores</p>
                </div>
              </Card>
            </Link>

            <Link href="/supervisor/reports">
              <Card className="p-4 hover:shadow-lg transition-shadow cursor-pointer border border-semantic-info/20 hover:border-semantic-info/40">
                <div className="text-center">
                  <div className="w-12 h-12 bg-semantic-info/10 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <svg className="w-6 h-6 text-semantic-info" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-sm">Reportes</h3>
                  <p className="text-xs text-neutral-medium-gray mt-1">Analizar desempeño</p>
                </div>
              </Card>
            </Link>
          </div>
        </Card>

        {/* Team Status */}
        <Card>
          <h2 className="text-xl font-semibold mb-6">Estado del Equipo</h2>
          <div className="space-y-3">
            {teamMembers.map((member) => (
              <div key={member.id} className="flex items-center justify-between p-3 bg-neutral-off-white rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                    <span className="text-white font-medium text-sm">
                      {member.name.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-sm">{member.name}</p>
                    <p className="text-xs text-neutral-medium-gray">{member.position}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {member.todayShift && (
                    <span className="text-xs text-neutral-dark-gray">
                      {member.todayShift.start} - {member.todayShift.end}
                    </span>
                  )}
                  <Tag variant={getStatusColor(member.status)} className="text-xs">
                    {getStatusText(member.status)}
                  </Tag>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Pending Schedule Approval */}
      {metrics.pendingApproval && (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Horario Pendiente de Aprobación</h2>
            <Tag variant="warning">Pendiente</Tag>
          </div>
          
          <div className="bg-semantic-info/10 border border-semantic-info/20 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <svg className="w-6 h-6 text-semantic-info mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="flex-1">
                <h3 className="font-semibold text-semantic-info">Horario enviado para revisión</h3>
                <p className="text-sm text-neutral-dark-gray mt-1">
                  El horario semanal del 22-28 de enero fue enviado al administrador. 
                  Recibirás una notificación una vez sea aprobado o si se solicitan modificaciones.
                </p>
                <div className="flex space-x-2 mt-3">
                  <Button variant="secondary" size="sm">
                    Ver horario enviado
                  </Button>
                  <Button variant="text" size="sm">
                    Ver historial
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}