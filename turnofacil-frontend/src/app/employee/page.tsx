'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card, Button, Tag } from '@/components/ui'

interface Shift {
  id: string
  date: string
  startTime: string
  endTime: string
  position: string
  location: string
  status: 'scheduled' | 'completed' | 'missed'
  hours: number
}

interface UpcomingShift {
  id: string
  date: string
  startTime: string
  endTime: string
  position: string
  location: string
  isToday: boolean
  daysUntil: number
}

const mockShifts: Shift[] = [
  {
    id: '1',
    date: '2024-01-21',
    startTime: '08:00',
    endTime: '16:00',
    position: 'Cocinero',
    location: 'Cocina Principal',
    status: 'scheduled',
    hours: 8
  },
  {
    id: '2',
    date: '2024-01-20',
    startTime: '10:00',
    endTime: '18:00',
    position: 'Cocinero',
    location: 'Cocina Principal',
    status: 'completed',
    hours: 8
  },
  {
    id: '3',
    date: '2024-01-19',
    startTime: '12:00',
    endTime: '20:00',
    position: 'Cocinero',
    location: 'Cocina Principal',
    status: 'completed',
    hours: 8
  }
]

const mockUpcomingShifts: UpcomingShift[] = [
  {
    id: '1',
    date: '2024-01-21',
    startTime: '08:00',
    endTime: '16:00',
    position: 'Cocinero',
    location: 'Cocina Principal',
    isToday: true,
    daysUntil: 0
  },
  {
    id: '2',
    date: '2024-01-22',
    startTime: '10:00',
    endTime: '18:00',
    position: 'Cocinero',
    location: 'Cocina Principal',
    isToday: false,
    daysUntil: 1
  },
  {
    id: '3',
    date: '2024-01-23',
    startTime: '12:00',
    endTime: '20:00',
    position: 'Cocinero',
    location: 'Cocina Principal',
    isToday: false,
    daysUntil: 2
  },
  {
    id: '4',
    date: '2024-01-24',
    startTime: '09:00',
    endTime: '17:00',
    position: 'Cocinero',
    location: 'Cocina Principal',
    isToday: false,
    daysUntil: 3
  }
]

export default function EmployeeSchedule() {
  const [shifts] = useState<Shift[]>(mockShifts)
  const [upcomingShifts] = useState<UpcomingShift[]>(mockUpcomingShifts)
  const [viewMode, setViewMode] = useState<'week' | 'month'>('week')

  const getStatusColor = (status: Shift['status']) => {
    switch (status) {
      case 'scheduled':
        return 'info'
      case 'completed':
        return 'success'
      case 'missed':
        return 'error'
      default:
        return 'default'
    }
  }

  const getStatusText = (status: Shift['status']) => {
    switch (status) {
      case 'scheduled':
        return 'Programado'
      case 'completed':
        return 'Completado'
      case 'missed':
        return 'Perdido'
      default:
        return status
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('es-CO', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatDateShort = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('es-CO', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    })
  }

  const getDaysUntilText = (daysUntil: number) => {
    if (daysUntil === 0) return 'Hoy'
    if (daysUntil === 1) return 'Mañana'
    return `En ${daysUntil} días`
  }

  const currentShift = upcomingShifts.find(shift => shift.isToday)
  const weeklyHours = shifts
    .filter(shift => {
      const shiftDate = new Date(shift.date)
      const now = new Date()
      const weekStart = new Date(now.setDate(now.getDate() - now.getDay()))
      return shiftDate >= weekStart
    })
    .reduce((total, shift) => total + shift.hours, 0)

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-lg p-6">
        <h1 className="text-2xl font-bold text-neutral-black mb-2">
          Mi Horario de Trabajo
        </h1>
        <p className="text-neutral-dark-gray">
          Consulta tus turnos programados y gestiona tus solicitudes.
        </p>
      </div>

      {/* Current Shift Alert */}
      {currentShift && (
        <Card className="border-semantic-success border-2">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-semantic-success/10 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-semantic-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-semantic-success">Tu turno de hoy</h3>
              <p className="text-neutral-dark-gray">
                {currentShift.startTime} - {currentShift.endTime} | {currentShift.position} | {currentShift.location}
              </p>
            </div>
            <Button size="sm">
              Ver detalles
            </Button>
          </div>
        </Card>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <div className="text-center">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2-2V7z" />
              </svg>
            </div>
            <p className="text-2xl font-bold text-neutral-black">{upcomingShifts.length}</p>
            <p className="text-sm text-neutral-dark-gray">Próximos turnos</p>
          </div>
        </Card>

        <Card>
          <div className="text-center">
            <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-2xl font-bold text-neutral-black">{weeklyHours}h</p>
            <p className="text-sm text-neutral-dark-gray">Horas esta semana</p>
          </div>
        </Card>

        <Card>
          <div className="text-center">
            <div className="w-12 h-12 bg-semantic-info/10 rounded-lg flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-semantic-info" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
              </svg>
            </div>
            <p className="text-2xl font-bold text-neutral-black">1</p>
            <p className="text-sm text-neutral-dark-gray">Solicitud pendiente</p>
          </div>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Upcoming Shifts */}
        <Card>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">Próximos Turnos</h2>
            <div className="flex space-x-2">
              <Button 
                variant={viewMode === 'week' ? 'primary' : 'secondary'} 
                size="sm"
                onClick={() => setViewMode('week')}
              >
                Semana
              </Button>
              <Button 
                variant={viewMode === 'month' ? 'primary' : 'secondary'} 
                size="sm"
                onClick={() => setViewMode('month')}
              >
                Mes
              </Button>
            </div>
          </div>
          
          <div className="space-y-3">
            {upcomingShifts.map((shift) => (
              <div key={shift.id} className={`p-4 rounded-lg border ${shift.isToday ? 'border-primary bg-primary/5' : 'border-neutral-light-gray bg-neutral-off-white'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <h3 className="font-semibold">{formatDateShort(shift.date)}</h3>
                      {shift.isToday && <Tag variant="success" className="text-xs">Hoy</Tag>}
                    </div>
                    <p className="text-sm text-neutral-dark-gray mt-1">
                      {shift.startTime} - {shift.endTime}
                    </p>
                    <p className="text-sm text-neutral-medium-gray">
                      {shift.position} • {shift.location}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-neutral-dark-gray">
                      {getDaysUntilText(shift.daysUntil)}
                    </p>
                    <Link href="/employee/requests">
                      <Button variant="text" size="sm" className="mt-1">
                        Solicitar cambio
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Quick Actions */}
        <Card>
          <h2 className="text-xl font-semibold mb-6">Acciones Rápidas</h2>
          <div className="space-y-4">
            <Link href="/employee/requests">
              <Card className="p-4 hover:shadow-lg transition-shadow cursor-pointer border border-primary/20 hover:border-primary/40">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2-2V7z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold">Solicitar Cambio de Turno</h3>
                    <p className="text-sm text-neutral-medium-gray">Cambia uno de tus turnos programados</p>
                  </div>
                </div>
              </Card>
            </Link>

            <Link href="/employee/requests">
              <Card className="p-4 hover:shadow-lg transition-shadow cursor-pointer border border-semantic-warning/20 hover:border-semantic-warning/40">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-semantic-warning/10 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-semantic-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold">Reportar Ausencia</h3>
                    <p className="text-sm text-neutral-medium-gray">Informa sobre enfermedad o calamidad</p>
                  </div>
                </div>
              </Card>
            </Link>

            <Link href="/employee/notifications">
              <Card className="p-4 hover:shadow-lg transition-shadow cursor-pointer border border-semantic-info/20 hover:border-semantic-info/40">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-semantic-info/10 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-semantic-info" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM7 8h8M7 12h8M7 16h5" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold">Ver Notificaciones</h3>
                    <p className="text-sm text-neutral-medium-gray">Consulta cambios en tus horarios</p>
                  </div>
                </div>
              </Card>
            </Link>

            <Link href="/employee/profile">
              <Card className="p-4 hover:shadow-lg transition-shadow cursor-pointer border border-secondary/20 hover:border-secondary/40">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold">Actualizar Perfil</h3>
                    <p className="text-sm text-neutral-medium-gray">Edita tu información personal</p>
                  </div>
                </div>
              </Card>
            </Link>
          </div>
        </Card>
      </div>

      {/* Recent Schedule History */}
      <Card>
        <h2 className="text-xl font-semibold mb-6">Historial Reciente</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-neutral-light-gray">
            <thead>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-dark-gray uppercase tracking-wider">
                  Fecha
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-dark-gray uppercase tracking-wider">
                  Horario
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-dark-gray uppercase tracking-wider">
                  Posición
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-dark-gray uppercase tracking-wider">
                  Horas
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-dark-gray uppercase tracking-wider">
                  Estado
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-light-gray">
              {shifts.map((shift) => (
                <tr key={shift.id} className="hover:bg-neutral-off-white">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-dark-gray">
                    {formatDateShort(shift.date)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-dark-gray">
                    {shift.startTime} - {shift.endTime}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-dark-gray">
                    {shift.position}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-dark-gray">
                    {shift.hours}h
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Tag variant={getStatusColor(shift.status)}>
                      {getStatusText(shift.status)}
                    </Tag>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}