'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card, Button, Tag } from '@/components/ui'

interface DashboardMetrics {
  employeesOnShift: number
  pendingRequests: number
  weeklyOvertimeHours: number
  scheduledShiftsToday: number
  upcomingScheduleApprovals: number
}

interface RecentActivity {
  id: string
  type: 'schedule_submitted' | 'request_pending' | 'employee_added'
  message: string
  time: string
  priority: 'low' | 'medium' | 'high'
}

const mockMetrics: DashboardMetrics = {
  employeesOnShift: 8,
  pendingRequests: 3,
  weeklyOvertimeHours: 12.5,
  scheduledShiftsToday: 15,
  upcomingScheduleApprovals: 1
}

const mockActivities: RecentActivity[] = [
  {
    id: '1',
    type: 'schedule_submitted',
    message: 'María García envió el horario semanal para aprobación',
    time: '2024-01-21T10:30:00',
    priority: 'high'
  },
  {
    id: '2',
    type: 'request_pending',
    message: 'Carlos López solicitó cambio de turno para el viernes',
    time: '2024-01-21T09:15:00',
    priority: 'medium'
  },
  {
    id: '3',
    type: 'request_pending',
    message: 'Ana Martínez reportó ausencia por enfermedad',
    time: '2024-01-21T08:45:00',
    priority: 'medium'
  },
  {
    id: '4',
    type: 'employee_added',
    message: 'Nuevo empleado registrado: Luis Rodríguez',
    time: '2024-01-20T16:20:00',
    priority: 'low'
  }
]

export default function BusinessDashboard() {
  const [metrics] = useState<DashboardMetrics>(mockMetrics)
  const [activities] = useState<RecentActivity[]>(mockActivities)

  const getActivityIcon = (type: RecentActivity['type']) => {
    switch (type) {
      case 'schedule_submitted':
        return (
          <div className="w-8 h-8 bg-semantic-info/10 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-semantic-info" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )
      case 'request_pending':
        return (
          <div className="w-8 h-8 bg-semantic-warning/10 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-semantic-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
            </svg>
          </div>
        )
      case 'employee_added':
        return (
          <div className="w-8 h-8 bg-semantic-success/10 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-semantic-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </div>
        )
      default:
        return null
    }
  }

  const getPriorityColor = (priority: RecentActivity['priority']) => {
    switch (priority) {
      case 'high':
        return 'error'
      case 'medium':
        return 'warning'
      case 'low':
        return 'success'
      default:
        return 'default'
    }
  }

  const formatTime = (timeString: string) => {
    const date = new Date(timeString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
      return `Hace ${diffInMinutes} minutos`
    } else if (diffInHours < 24) {
      return `Hace ${diffInHours} horas`
    } else {
      return date.toLocaleDateString('es-CO')
    }
  }

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-lg p-6">
        <h1 className="text-2xl font-bold text-neutral-black mb-2">
          ¡Bienvenido al panel de administración!
        </h1>
        <p className="text-neutral-dark-gray">
          Gestiona los horarios, empleados y solicitudes de tu empresa desde un solo lugar.
        </p>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
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
              <p className="text-2xl font-bold text-neutral-black">{metrics.employeesOnShift}</p>
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
              <h3 className="text-sm font-medium text-neutral-dark-gray">Solicitudes pendientes</h3>
              <p className="text-2xl font-bold text-neutral-black">{metrics.pendingRequests}</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-secondary/10 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-neutral-dark-gray">Horas extras semana</h3>
              <p className="text-2xl font-bold text-neutral-black">{metrics.weeklyOvertimeHours}h</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2-2V7z" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-neutral-dark-gray">Turnos hoy</h3>
              <p className="text-2xl font-bold text-neutral-black">{metrics.scheduledShiftsToday}</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-semantic-info/10 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-semantic-info" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-neutral-dark-gray">Por aprobar</h3>
              <p className="text-2xl font-bold text-neutral-black">{metrics.upcomingScheduleApprovals}</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Quick Actions */}
        <Card>
          <h2 className="text-xl font-semibold mb-6">Acceso Rápido</h2>
          <div className="grid grid-cols-2 gap-4">
            <Link href="/business/scheduler">
              <Card className="p-4 hover:shadow-lg transition-shadow cursor-pointer border border-primary/20 hover:border-primary/40">
                <div className="text-center">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2-2V7z" />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-sm">Crear Horario</h3>
                  <p className="text-xs text-neutral-medium-gray mt-1">Planificar turnos</p>
                </div>
              </Card>
            </Link>

            <Link href="/business/employees">
              <Card className="p-4 hover:shadow-lg transition-shadow cursor-pointer border border-secondary/20 hover:border-secondary/40">
                <div className="text-center">
                  <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <svg className="w-6 h-6 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-sm">Añadir Empleado</h3>
                  <p className="text-xs text-neutral-medium-gray mt-1">Gestionar personal</p>
                </div>
              </Card>
            </Link>

            <Link href="/business/requests">
              <Card className="p-4 hover:shadow-lg transition-shadow cursor-pointer border border-semantic-warning/20 hover:border-semantic-warning/40">
                <div className="text-center">
                  <div className="w-12 h-12 bg-semantic-warning/10 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <svg className="w-6 h-6 text-semantic-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-sm">Ver Solicitudes</h3>
                  <p className="text-xs text-neutral-medium-gray mt-1">Revisar peticiones</p>
                </div>
              </Card>
            </Link>

            <Link href="/business/reports">
              <Card className="p-4 hover:shadow-lg transition-shadow cursor-pointer border border-semantic-info/20 hover:border-semantic-info/40">
                <div className="text-center">
                  <div className="w-12 h-12 bg-semantic-info/10 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <svg className="w-6 h-6 text-semantic-info" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-sm">Generar Reporte</h3>
                  <p className="text-xs text-neutral-medium-gray mt-1">Analizar datos</p>
                </div>
              </Card>
            </Link>
          </div>
        </Card>

        {/* Recent Activity */}
        <Card>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">Actividad Reciente</h2>
            <Button variant="text" size="sm">
              Ver todo
            </Button>
          </div>
          
          <div className="space-y-4">
            {activities.map((activity) => (
              <div key={activity.id} className="flex items-start space-x-3">
                {getActivityIcon(activity.type)}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-neutral-black">{activity.message}</p>
                  <div className="flex items-center space-x-2 mt-1">
                    <p className="text-xs text-neutral-medium-gray">{formatTime(activity.time)}</p>
                    <Tag variant={getPriorityColor(activity.priority)} className="text-xs">
                      {activity.priority === 'high' && 'Alta'}
                      {activity.priority === 'medium' && 'Media'}
                      {activity.priority === 'low' && 'Baja'}
                    </Tag>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Pending Approvals */}
      {metrics.upcomingScheduleApprovals > 0 && (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Horarios Pendientes de Aprobación</h2>
            <Tag variant="warning">{metrics.upcomingScheduleApprovals} pendiente</Tag>
          </div>
          
          <div className="bg-semantic-warning/10 border border-semantic-warning/20 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <svg className="w-6 h-6 text-semantic-warning mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <div className="flex-1">
                <h3 className="font-semibold text-semantic-warning">Horario semanal pendiente</h3>
                <p className="text-sm text-neutral-dark-gray mt-1">
                  María García envió el horario para la semana del 22-28 de enero. 
                  Revisa los turnos asignados y los costos proyectados antes de aprobar.
                </p>
                <div className="flex space-x-2 mt-3">
                  <Button size="sm">
                    Revisar horario
                  </Button>
                  <Button variant="secondary" size="sm">
                    Ver detalles
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