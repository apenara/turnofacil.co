'use client'

import React, { useState } from 'react'
import { Card, Button } from '@/components/ui'
import { useReportGenerator } from '@/components/shared/ReportGenerator'

interface AttendanceRecord {
  employeeId: string
  employeeName: string
  position: string
  date: string
  scheduled: {
    startTime: string
    endTime: string
    hours: number
  }
  actual: {
    checkIn?: string
    checkOut?: string
    hoursWorked: number
  }
  status: 'present' | 'late' | 'absent' | 'early_departure'
  notes?: string
}

interface ProductivityMetric {
  employeeId: string
  employeeName: string
  position: string
  weeklyScheduledHours: number
  weeklyWorkedHours: number
  efficiency: number
  tasksCompleted: number
  qualityScore: number
  attendanceRate: number
}

interface RequestSummary {
  type: 'vacation' | 'sick_leave' | 'shift_change' | 'personal_leave' | 'time_off'
  count: number
  approved: number
  rejected: number
  pending: number
  averageProcessingTime: number // hours
}

const mockAttendanceData: AttendanceRecord[] = [
  {
    employeeId: '1',
    employeeName: 'Carlos López',
    position: 'Cocinero Senior',
    date: '2024-01-15',
    scheduled: { startTime: '06:00', endTime: '14:00', hours: 8 },
    actual: { checkIn: '06:05', checkOut: '14:10', hoursWorked: 8.08 },
    status: 'late',
    notes: 'Llegó 5 minutos tarde por tráfico'
  },
  {
    employeeId: '2',
    employeeName: 'Ana Martínez',
    position: 'Mesera',
    date: '2024-01-15',
    scheduled: { startTime: '14:00', endTime: '22:00', hours: 8 },
    actual: { checkIn: '13:55', checkOut: '22:00', hoursWorked: 8.08 },
    status: 'present'
  },
  {
    employeeId: '3',
    employeeName: 'Pedro García',
    position: 'Cajero',
    date: '2024-01-15',
    scheduled: { startTime: '08:00', endTime: '16:00', hours: 8 },
    actual: { hoursWorked: 0 },
    status: 'absent',
    notes: 'Incapacidad médica'
  },
  {
    employeeId: '4',
    employeeName: 'Laura Rodríguez',
    position: 'Auxiliar de Cocina',
    date: '2024-01-15',
    scheduled: { startTime: '10:00', endTime: '18:00', hours: 8 },
    actual: { checkIn: '09:58', checkOut: '18:05', hoursWorked: 8.12 },
    status: 'present'
  }
]

const mockProductivityData: ProductivityMetric[] = [
  {
    employeeId: '1',
    employeeName: 'Carlos López',
    position: 'Cocinero Senior',
    weeklyScheduledHours: 48,
    weeklyWorkedHours: 46,
    efficiency: 95.8,
    tasksCompleted: 24,
    qualityScore: 92,
    attendanceRate: 95
  },
  {
    employeeId: '2',
    employeeName: 'Ana Martínez',
    position: 'Mesera',
    weeklyScheduledHours: 44,
    weeklyWorkedHours: 44,
    efficiency: 100,
    tasksCompleted: 28,
    qualityScore: 88,
    attendanceRate: 100
  },
  {
    employeeId: '3',
    employeeName: 'Pedro García',
    position: 'Cajero',
    weeklyScheduledHours: 40,
    weeklyWorkedHours: 8,
    efficiency: 20,
    tasksCompleted: 5,
    qualityScore: 85,
    attendanceRate: 20
  },
  {
    employeeId: '4',
    employeeName: 'Laura Rodríguez',
    position: 'Auxiliar de Cocina',
    weeklyScheduledHours: 40,
    weeklyWorkedHours: 42,
    efficiency: 105,
    tasksCompleted: 22,
    qualityScore: 90,
    attendanceRate: 100
  }
]

const mockRequestSummary: RequestSummary[] = [
  { type: 'vacation', count: 5, approved: 4, rejected: 0, pending: 1, averageProcessingTime: 24 },
  { type: 'sick_leave', count: 3, approved: 3, rejected: 0, pending: 0, averageProcessingTime: 2 },
  { type: 'shift_change', count: 8, approved: 6, rejected: 1, pending: 1, averageProcessingTime: 12 },
  { type: 'personal_leave', count: 4, approved: 2, rejected: 1, pending: 1, averageProcessingTime: 36 },
  { type: 'time_off', count: 2, approved: 2, rejected: 0, pending: 0, averageProcessingTime: 8 }
]

export default function SupervisorReportsPage() {
  const [activeTab, setActiveTab] = useState<'attendance' | 'productivity' | 'requests' | 'alerts'>('attendance')
  const [selectedPeriod, setSelectedPeriod] = useState('current_week')
  
  const { generateReport, ReportModal } = useReportGenerator()

  const getStatusColor = (status: AttendanceRecord['status']) => {
    switch (status) {
      case 'present': return 'text-green-600'
      case 'late': return 'text-yellow-600'
      case 'absent': return 'text-red-600'
      case 'early_departure': return 'text-orange-600'
      default: return 'text-gray-600'
    }
  }

  const getStatusText = (status: AttendanceRecord['status']) => {
    switch (status) {
      case 'present': return 'Presente'
      case 'late': return 'Tarde'
      case 'absent': return 'Ausente'
      case 'early_departure': return 'Salida Temprana'
      default: return status
    }
  }

  const getEfficiencyColor = (efficiency: number) => {
    if (efficiency >= 95) return 'text-green-600'
    if (efficiency >= 85) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getRequestTypeText = (type: RequestSummary['type']) => {
    switch (type) {
      case 'vacation': return 'Vacaciones'
      case 'sick_leave': return 'Incapacidad'
      case 'shift_change': return 'Cambio de Turno'
      case 'personal_leave': return 'Permiso Personal'
      case 'time_off': return 'Día Libre'
      default: return type
    }
  }

  const handleExportAttendance = () => {
    generateReport({
      title: 'Reporte de Asistencia del Equipo',
      subtitle: `Período: ${selectedPeriod} | Supervisor Dashboard`,
      company: 'TurnoFacil CO',
      generatedBy: 'Supervisor',
      generatedAt: new Date(),
      data: mockAttendanceData,
      columns: [
        { key: 'employeeName', title: 'Empleado', type: 'text' },
        { key: 'position', title: 'Posición', type: 'text' },
        { key: 'date', title: 'Fecha', type: 'date' },
        { key: 'scheduled.hours', title: 'Horas Programadas', type: 'number' },
        { key: 'actual.hoursWorked', title: 'Horas Trabajadas', type: 'number' },
        { key: 'status', title: 'Estado', type: 'text' }
      ],
      summary: [
        { label: 'Total Registros', value: mockAttendanceData.length, type: 'number' },
        { label: 'Empleados Presentes', value: mockAttendanceData.filter(r => r.status === 'present').length, type: 'number' },
        { label: 'Empleados Tarde', value: mockAttendanceData.filter(r => r.status === 'late').length, type: 'number' },
        { label: 'Empleados Ausentes', value: mockAttendanceData.filter(r => r.status === 'absent').length, type: 'number' }
      ]
    })
  }

  const handleExportProductivity = () => {
    generateReport({
      title: 'Reporte de Productividad del Equipo',
      subtitle: 'Métricas de rendimiento y eficiencia',
      company: 'TurnoFacil CO',
      generatedBy: 'Supervisor',
      generatedAt: new Date(),
      data: mockProductivityData,
      columns: [
        { key: 'employeeName', title: 'Empleado', type: 'text' },
        { key: 'position', title: 'Posición', type: 'text' },
        { key: 'weeklyScheduledHours', title: 'Horas Programadas', type: 'number' },
        { key: 'weeklyWorkedHours', title: 'Horas Trabajadas', type: 'number' },
        { key: 'efficiency', title: 'Eficiencia (%)', type: 'number' },
        { key: 'attendanceRate', title: 'Asistencia (%)', type: 'number' }
      ],
      summary: [
        { label: 'Eficiencia Promedio', value: mockProductivityData.reduce((sum, p) => sum + p.efficiency, 0) / mockProductivityData.length, type: 'number' },
        { label: 'Horas Totales Trabajadas', value: mockProductivityData.reduce((sum, p) => sum + p.weeklyWorkedHours, 0), type: 'number' },
        { label: 'Asistencia Promedio', value: mockProductivityData.reduce((sum, p) => sum + p.attendanceRate, 0) / mockProductivityData.length, type: 'number' }
      ]
    })
  }

  // Calculate summary metrics
  const totalScheduledHours = mockProductivityData.reduce((sum, p) => sum + p.weeklyScheduledHours, 0)
  const totalWorkedHours = mockProductivityData.reduce((sum, p) => sum + p.weeklyWorkedHours, 0)
  const teamEfficiency = totalScheduledHours > 0 ? Math.round((totalWorkedHours / totalScheduledHours) * 100) : 0
  const avgAttendanceRate = Math.round(mockProductivityData.reduce((sum, p) => sum + p.attendanceRate, 0) / mockProductivityData.length)

  const totalRequests = mockRequestSummary.reduce((sum, r) => sum + r.count, 0)
  const totalApproved = mockRequestSummary.reduce((sum, r) => sum + r.approved, 0)
  const totalPending = mockRequestSummary.reduce((sum, r) => sum + r.pending, 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Reportes del Supervisor</h1>
          <p className="text-gray-600">Análisis y métricas de rendimiento de tu equipo</p>
        </div>
        <div className="flex space-x-3">
          <select
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
          >
            <option value="current_week">Semana Actual</option>
            <option value="last_week">Semana Pasada</option>
            <option value="current_month">Mes Actual</option>
            <option value="last_month">Mes Pasado</option>
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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
              <h3 className="text-sm font-medium text-gray-600">Eficiencia del Equipo</h3>
              <p className={`text-2xl font-bold ${getEfficiencyColor(teamEfficiency)}`}>
                {teamEfficiency}%
              </p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-600">Asistencia Promedio</h3>
              <p className="text-2xl font-bold text-gray-900">{avgAttendanceRate}%</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-600">Solicitudes Totales</h3>
              <p className="text-2xl font-bold text-gray-900">{totalRequests}</p>
              <p className="text-xs text-gray-500">{totalPending} pendientes</p>
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
              <h3 className="text-sm font-medium text-gray-600">Tasa de Aprobación</h3>
              <p className="text-2xl font-bold text-gray-900">
                {totalRequests > 0 ? Math.round((totalApproved / totalRequests) * 100) : 0}%
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { key: 'attendance', label: 'Asistencia', icon: '📅' },
            { key: 'productivity', label: 'Productividad', icon: '📊' },
            { key: 'requests', label: 'Solicitudes', icon: '📝' },
            { key: 'alerts', label: 'Alertas', icon: '⚠️' }
          ].map(tab => (
            <button
              key={tab.key}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.key
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              onClick={() => setActiveTab(tab.key as any)}
            >
              <span className="mr-1">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Attendance Tab */}
      {activeTab === 'attendance' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-medium text-gray-900">Reporte de Asistencia</h2>
            <Button variant="secondary" onClick={handleExportAttendance}>
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
              </svg>
              Exportar
            </Button>
          </div>

          <Card>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Empleado</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Horario Programado</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Check-in/out</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Horas Trabajadas</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {mockAttendanceData.map((record, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{record.employeeName}</div>
                          <div className="text-sm text-gray-500">{record.position}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(record.date).toLocaleDateString('es-CO')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {record.scheduled.startTime} - {record.scheduled.endTime}
                        <div className="text-xs text-gray-500">{record.scheduled.hours}h</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {record.actual.checkIn && record.actual.checkOut ? (
                          <div>
                            <div>{record.actual.checkIn} - {record.actual.checkOut}</div>
                          </div>
                        ) : (
                          <span className="text-gray-400">No registrado</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {record.actual.hoursWorked.toFixed(1)}h
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`text-sm font-medium ${getStatusColor(record.status)}`}>
                          {getStatusText(record.status)}
                        </span>
                        {record.notes && (
                          <div className="text-xs text-gray-500 mt-1">{record.notes}</div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* Productivity Tab */}
      {activeTab === 'productivity' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-medium text-gray-900">Métricas de Productividad</h2>
            <Button variant="secondary" onClick={handleExportProductivity}>
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
              </svg>
              Exportar
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {mockProductivityData.map((metric, index) => (
              <Card key={index}>
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{metric.employeeName}</h3>
                      <p className="text-sm text-gray-600">{metric.position}</p>
                    </div>
                    <div className={`text-2xl font-bold ${getEfficiencyColor(metric.efficiency)}`}>
                      {metric.efficiency.toFixed(1)}%
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Horas Trabajadas:</span>
                      <span className="text-sm font-medium">{metric.weeklyWorkedHours}h / {metric.weeklyScheduledHours}h</span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Asistencia:</span>
                      <span className="text-sm font-medium">{metric.attendanceRate}%</span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Tareas Completadas:</span>
                      <span className="text-sm font-medium">{metric.tasksCompleted}</span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Calidad:</span>
                      <span className="text-sm font-medium">{metric.qualityScore}/100</span>
                    </div>
                    
                    <div className="mt-4">
                      <div className="flex justify-between mb-1">
                        <span className="text-xs text-gray-600">Eficiencia General</span>
                        <span className="text-xs font-medium">{metric.efficiency.toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${
                            metric.efficiency >= 95 ? 'bg-green-500' :
                            metric.efficiency >= 85 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${Math.min(metric.efficiency, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Requests Tab */}
      {activeTab === 'requests' && (
        <div className="space-y-6">
          <h2 className="text-lg font-medium text-gray-900">Resumen de Solicitudes</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mockRequestSummary.map((summary, index) => (
              <Card key={index}>
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    {getRequestTypeText(summary.type)}
                  </h3>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Total:</span>
                      <span className="text-sm font-bold text-gray-900">{summary.count}</span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-sm text-green-600">Aprobadas:</span>
                      <span className="text-sm font-medium text-green-600">{summary.approved}</span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-sm text-red-600">Rechazadas:</span>
                      <span className="text-sm font-medium text-red-600">{summary.rejected}</span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-sm text-yellow-600">Pendientes:</span>
                      <span className="text-sm font-medium text-yellow-600">{summary.pending}</span>
                    </div>
                    
                    <div className="pt-3 border-t border-gray-200">
                      <div className="flex justify-between">
                        <span className="text-xs text-gray-500">Tiempo promedio:</span>
                        <span className="text-xs font-medium text-gray-700">{summary.averageProcessingTime}h</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Alerts Tab */}
      {activeTab === 'alerts' && (
        <div className="space-y-6">
          <h2 className="text-lg font-medium text-gray-900">Alertas y Recomendaciones</h2>
          
          <div className="space-y-4">
            {/* Performance Alerts */}
            <Card>
              <div className="p-6">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg className="h-6 w-6 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">Baja Asistencia - Pedro García</h3>
                    <div className="mt-2 text-sm text-red-700">
                      <p>Pedro García ha tenido una asistencia del 20% esta semana debido a incapacidad médica. Se recomienda contactarlo para verificar su estado.</p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            <Card>
              <div className="p-6">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg className="h-6 w-6 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-yellow-800">Patrón de Tardanzas - Carlos López</h3>
                    <div className="mt-2 text-sm text-yellow-700">
                      <p>Carlos López ha llegado tarde 3 veces esta semana. Considera hablar con él sobre la puntualidad.</p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            <Card>
              <div className="p-6">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg className="h-6 w-6 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-green-800">Excelente Rendimiento - Ana Martínez</h3>
                    <div className="mt-2 text-sm text-green-700">
                      <p>Ana Martínez ha mantenido una eficiencia del 100% y asistencia perfecta. Considera reconocer su excelente trabajo.</p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            <Card>
              <div className="p-6">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg className="h-6 w-6 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-blue-800">Solicitudes Pendientes</h3>
                    <div className="mt-2 text-sm text-blue-700">
                      <p>Tienes 3 solicitudes pendientes de revisión. Se recomienda procesarlas en las próximas 24 horas.</p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      <ReportModal />
    </div>
  )
}