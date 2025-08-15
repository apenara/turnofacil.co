'use client'

import React, { useState } from 'react'
import { Card, Button, Input, Modal, Tag } from '@/components/ui'
import { useReportGenerator } from '@/components/shared/ReportGenerator'

interface PayrollReport {
  id: string
  period: string
  location: string
  totalEmployees: number
  totalHours: number
  regularHours: number
  overtimeHours: number
  nightHours: number
  holidayHours: number
  baseSalary: number
  overtimePay: number
  nightPay: number
  holidayPay: number
  totalCost: number
  status: 'draft' | 'approved' | 'paid'
}

interface CostAnalysis {
  location: string
  monthlyCost: number
  averageHourlyRate: number
  efficiencyRate: number
  profitabilityIndex: number
  employeeCount: number
  hoursWorked: number
}

const mockPayrollReports: PayrollReport[] = [
  {
    id: '1',
    period: '2024-01',
    location: 'Sede Principal',
    totalEmployees: 12,
    totalHours: 1920,
    regularHours: 1536,
    overtimeHours: 256,
    nightHours: 128,
    holidayHours: 0,
    baseSalary: 14400000,
    overtimePay: 2560000,
    nightPay: 1280000,
    holidayPay: 0,
    totalCost: 18240000,
    status: 'approved'
  },
  {
    id: '2',
    period: '2024-01',
    location: 'Sucursal Norte',
    totalEmployees: 8,
    totalHours: 1280,
    regularHours: 1024,
    overtimeHours: 128,
    nightHours: 128,
    holidayHours: 0,
    baseSalary: 8800000,
    overtimePay: 1280000,
    nightPay: 960000,
    holidayPay: 0,
    totalCost: 11040000,
    status: 'approved'
  },
  {
    id: '3',
    period: '2024-01',
    location: 'Punto Chapinero',
    totalEmployees: 6,
    totalHours: 960,
    regularHours: 768,
    overtimeHours: 96,
    nightHours: 96,
    holidayHours: 0,
    baseSalary: 6600000,
    overtimePay: 960000,
    nightPay: 720000,
    holidayPay: 0,
    totalCost: 8280000,
    status: 'draft'
  }
]

const mockCostAnalysis: CostAnalysis[] = [
  {
    location: 'Sede Principal',
    monthlyCost: 18240000,
    averageHourlyRate: 9500,
    efficiencyRate: 87.5,
    profitabilityIndex: 2.3,
    employeeCount: 12,
    hoursWorked: 1920
  },
  {
    location: 'Sucursal Norte',
    monthlyCost: 11040000,
    averageHourlyRate: 8625,
    efficiencyRate: 92.1,
    profitabilityIndex: 2.8,
    employeeCount: 8,
    hoursWorked: 1280
  },
  {
    location: 'Punto Chapinero',
    monthlyCost: 8280000,
    averageHourlyRate: 8625,
    efficiencyRate: 78.3,
    profitabilityIndex: 1.9,
    employeeCount: 6,
    hoursWorked: 960
  }
]

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'payroll' | 'costs' | 'projections'>('overview')
  const [selectedPeriod, setSelectedPeriod] = useState('2024-01')
  const [selectedLocation, setSelectedLocation] = useState<string>('all')
  const [payrollReports] = useState<PayrollReport[]>(mockPayrollReports)
  const [costAnalysis] = useState<CostAnalysis[]>(mockCostAnalysis)

  const { generateReport, ReportModal } = useReportGenerator()

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`
  }

  const getStatusColor = (status: PayrollReport['status']) => {
    switch (status) {
      case 'draft': return 'warning'
      case 'approved': return 'success'
      case 'paid': return 'info'
      default: return 'default'
    }
  }

  const getStatusText = (status: PayrollReport['status']) => {
    switch (status) {
      case 'draft': return 'Borrador'
      case 'approved': return 'Aprobado'
      case 'paid': return 'Pagado'
      default: return status
    }
  }

  const filteredReports = payrollReports.filter(report => {
    const matchesPeriod = selectedPeriod === 'all' || report.period === selectedPeriod
    const matchesLocation = selectedLocation === 'all' || report.location === selectedLocation
    return matchesPeriod && matchesLocation
  })

  const totalCosts = filteredReports.reduce((sum, report) => sum + report.totalCost, 0)
  const totalEmployees = filteredReports.reduce((sum, report) => sum + report.totalEmployees, 0)
  const totalHours = filteredReports.reduce((sum, report) => sum + report.totalHours, 0)
  const averageHourlyRate = totalHours > 0 ? totalCosts / totalHours : 0

  const handleExportPayrollReport = () => {
    generateReport({
      title: 'Reporte de Nómina y Costos Laborales',
      subtitle: `Período: ${selectedPeriod} | Análisis detallado por ubicación`,
      company: 'TurnoFacil CO',
      generatedBy: 'Administrador',
      generatedAt: new Date(),
      data: filteredReports,
      columns: [
        { key: 'location', title: 'Ubicación', type: 'text' },
        { key: 'totalEmployees', title: 'Empleados', type: 'number' },
        { key: 'totalHours', title: 'Horas Total', type: 'number' },
        { key: 'regularHours', title: 'Horas Regulares', type: 'number' },
        { key: 'overtimeHours', title: 'Horas Extra', type: 'number' },
        { key: 'baseSalary', title: 'Salario Base', type: 'currency' },
        { key: 'overtimePay', title: 'Pago Extras', type: 'currency' },
        { key: 'totalCost', title: 'Costo Total', type: 'currency' }
      ],
      summary: [
        { label: 'Total Empleados', value: totalEmployees, type: 'number' },
        { label: 'Total Horas', value: totalHours, type: 'number' },
        { label: 'Costo Total', value: totalCosts, type: 'currency' },
        { label: 'Tarifa Promedio/Hora', value: averageHourlyRate, type: 'currency' }
      ]
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Reportes y Análisis</h1>
          <p className="text-gray-600">Dashboard financiero y análisis de costos laborales</p>
        </div>
        <div className="flex space-x-3">
          <Button variant="secondary" onClick={handleExportPayrollReport}>
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
            </svg>
            Exportar Reporte
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4">
          <div className="flex space-x-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Período</label>
              <select
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
              >
                <option value="2024-01">Enero 2024</option>
                <option value="2023-12">Diciembre 2023</option>
                <option value="2023-11">Noviembre 2023</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ubicación</label>
              <select
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
              >
                <option value="all">Todas las ubicaciones</option>
                <option value="Sede Principal">Sede Principal</option>
                <option value="Sucursal Norte">Sucursal Norte</option>
                <option value="Punto Chapinero">Punto Chapinero</option>
              </select>
            </div>
          </div>
        </div>
      </Card>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { key: 'overview', label: 'Resumen Ejecutivo' },
            { key: 'payroll', label: 'Nómina Detallada' },
            { key: 'costs', label: 'Análisis de Costos' },
            { key: 'projections', label: 'Proyecciones' }
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
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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
                  <h3 className="text-sm font-medium text-gray-600">Costo Total</h3>
                  <p className="text-xl font-bold text-gray-900">{formatCurrency(totalCosts)}</p>
                </div>
              </div>
            </Card>

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
                  <h3 className="text-sm font-medium text-gray-600">Empleados</h3>
                  <p className="text-2xl font-bold text-gray-900">{totalEmployees}</p>
                </div>
              </div>
            </Card>

            <Card>
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-4">
                  <h3 className="text-sm font-medium text-gray-600">Horas Totales</h3>
                  <p className="text-2xl font-bold text-gray-900">{totalHours.toLocaleString()}</p>
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
                  <h3 className="text-sm font-medium text-gray-600">Tarifa/Hora</h3>
                  <p className="text-xl font-bold text-gray-900">{formatCurrency(averageHourlyRate)}</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Cost Analysis by Location */}
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Análisis de Eficiencia por Ubicación</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ubicación</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Costo Mensual</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Empleados</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Eficiencia</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Índice Rentabilidad</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {costAnalysis.map((analysis, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {analysis.location}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatCurrency(analysis.monthlyCost)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {analysis.employeeCount}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-1 bg-gray-200 rounded-full h-2 mr-2">
                              <div 
                                className="bg-primary-600 h-2 rounded-full" 
                                style={{ width: `${analysis.efficiencyRate}%` }}
                              ></div>
                            </div>
                            <span className="text-sm font-medium text-gray-900">
                              {formatPercentage(analysis.efficiencyRate)}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Tag variant={analysis.profitabilityIndex >= 2.5 ? 'success' : analysis.profitabilityIndex >= 2.0 ? 'warning' : 'error'}>
                            {analysis.profitabilityIndex.toFixed(1)}x
                          </Tag>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Payroll Tab */}
      {activeTab === 'payroll' && (
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Nómina Detallada por Ubicación</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ubicación</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Empleados</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Horas Regulares</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Horas Extra</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">H. Nocturnas</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Costo Total</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredReports.map((report) => (
                    <tr key={report.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{report.location}</div>
                        <div className="text-sm text-gray-500">Período: {report.period}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {report.totalEmployees}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div>{report.regularHours}h</div>
                        <div className="text-xs text-gray-500">{formatCurrency(report.baseSalary)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div>{report.overtimeHours}h</div>
                        <div className="text-xs text-gray-500">{formatCurrency(report.overtimePay)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div>{report.nightHours}h</div>
                        <div className="text-xs text-gray-500">{formatCurrency(report.nightPay)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {formatCurrency(report.totalCost)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Tag variant={getStatusColor(report.status)}>
                          {getStatusText(report.status)}
                        </Tag>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Card>
      )}

      {/* Cost Analysis Tab */}
      {activeTab === 'costs' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {costAnalysis.map((analysis, index) => (
            <Card key={index}>
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">{analysis.location}</h3>
                  <Tag variant={analysis.profitabilityIndex >= 2.5 ? 'success' : 'warning'}>
                    {analysis.profitabilityIndex.toFixed(1)}x ROI
                  </Tag>
                </div>
                
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Costo Mensual:</span>
                    <span className="text-sm font-medium">{formatCurrency(analysis.monthlyCost)}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Tarifa Promedio/Hora:</span>
                    <span className="text-sm font-medium">{formatCurrency(analysis.averageHourlyRate)}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Empleados:</span>
                    <span className="text-sm font-medium">{analysis.employeeCount}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Horas Trabajadas:</span>
                    <span className="text-sm font-medium">{analysis.hoursWorked.toLocaleString()}h</span>
                  </div>
                  
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm text-gray-600">Eficiencia:</span>
                      <span className="text-sm font-medium">{formatPercentage(analysis.efficiencyRate)}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-primary-600 h-2 rounded-full" 
                        style={{ width: `${analysis.efficiencyRate}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Projections Tab */}
      {activeTab === 'projections' && (
        <div className="space-y-6">
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Proyecciones Trimestrales</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{formatCurrency(totalCosts * 3)}</div>
                  <div className="text-sm text-gray-600">Costo Proyectado Q1</div>
                  <div className="text-xs text-green-600 mt-1">↗ +5.2% vs trimestre anterior</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{totalHours * 3}</div>
                  <div className="text-sm text-gray-600">Horas Proyectadas</div>
                  <div className="text-xs text-blue-600 mt-1">→ +2.1% vs trimestre anterior</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{formatCurrency(averageHourlyRate * 1.03)}</div>
                  <div className="text-sm text-gray-600">Tarifa/Hora Proyectada</div>
                  <div className="text-xs text-yellow-600 mt-1">↗ +3.0% ajuste inflación</div>
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Recomendaciones de Optimización</h3>
              <div className="space-y-4">
                <div className="border-l-4 border-yellow-400 bg-yellow-50 p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h4 className="text-sm font-medium text-yellow-800">Punto Chapinero - Baja Eficiencia</h4>
                      <p className="text-sm text-yellow-700">
                        Eficiencia del 78.3% está por debajo del objetivo. Revisar programación de turnos y capacidad instalada.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="border-l-4 border-green-400 bg-green-50 p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h4 className="text-sm font-medium text-green-800">Sucursal Norte - Alto Rendimiento</h4>
                      <p className="text-sm text-green-700">
                        Mejor índice de rentabilidad (2.8x) y eficiencia (92.1%). Replicar modelo en otras ubicaciones.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="border-l-4 border-blue-400 bg-blue-50 p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h4 className="text-sm font-medium text-blue-800">Oportunidad de Ahorro</h4>
                      <p className="text-sm text-blue-700">
                        Optimizando turnos nocturnos se puede reducir costos en un 8-12% manteniendo la cobertura.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      <ReportModal />
    </div>
  )
}