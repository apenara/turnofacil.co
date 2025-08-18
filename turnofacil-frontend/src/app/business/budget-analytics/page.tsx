'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface Location {
  id: string
  name: string
  address: string
  weeklyBudget: number
  budget?: {
    type: 'weekly' | 'monthly' | 'quarterly' | 'annual'
    periods: BudgetPeriod[]
    autoDistribute: boolean
    alertThreshold: number
  }
}

interface BudgetPeriod {
  id: string
  year: number
  month?: number
  quarter?: number
  amount: number
  allocated: number
  spent: number
}

interface BudgetAnalytics {
  totalBudgeted: number
  totalSpent: number
  totalVariance: number
  utilizationRate: number
  trend: 'increasing' | 'decreasing' | 'stable'
  projectedSpend: number
  projectedVariance: number
}

interface LocationAnalytics extends Location {
  analytics: BudgetAnalytics
  monthlyData: { month: string; budgeted: number; spent: number }[]
}

export default function BudgetAnalyticsPage() {
  const [locations, setLocations] = useState<LocationAnalytics[]>([])
  const [selectedLocation, setSelectedLocation] = useState<string>('all')
  const [selectedPeriod, setSelectedPeriod] = useState<string>('current-quarter')
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    loadBudgetAnalytics()
  }, [selectedLocation, selectedPeriod])

  const loadBudgetAnalytics = async () => {
    setIsLoading(true)
    
    const mockLocations: Location[] = [
      {
        id: '1',
        name: 'Centro Comercial Unicentro',
        address: 'Bogotá, Colombia',
        weeklyBudget: 5000000,
        budget: {
          type: 'monthly',
          periods: [
            { id: '1', year: 2024, month: 8, amount: 20000000, allocated: 18000000, spent: 15500000 },
            { id: '2', year: 2024, month: 7, amount: 20000000, allocated: 18000000, spent: 17200000 },
            { id: '3', year: 2024, month: 6, amount: 20000000, allocated: 18000000, spent: 16800000 }
          ],
          autoDistribute: true,
          alertThreshold: 85
        }
      },
      {
        id: '2',
        name: 'Plaza de las Américas',
        address: 'Bogotá, Colombia',
        weeklyBudget: 4500000,
        budget: {
          type: 'quarterly',
          periods: [
            { id: '1', year: 2024, quarter: 3, amount: 54000000, allocated: 48000000, spent: 42300000 },
            { id: '2', year: 2024, quarter: 2, amount: 54000000, allocated: 48000000, spent: 46800000 }
          ],
          autoDistribute: true,
          alertThreshold: 80
        }
      }
    ]

    const analyticsData: LocationAnalytics[] = mockLocations.map(location => {
      const currentPeriod = location.budget?.periods[0]
      const previousPeriod = location.budget?.periods[1]
      
      const totalSpent = currentPeriod?.spent || 0
      const totalBudgeted = currentPeriod?.amount || location.weeklyBudget * 4
      const totalVariance = totalBudgeted - totalSpent
      const utilizationRate = (totalSpent / totalBudgeted) * 100

      let trend: 'increasing' | 'decreasing' | 'stable' = 'stable'
      if (previousPeriod) {
        const previousUtilization = (previousPeriod.spent / previousPeriod.amount) * 100
        if (utilizationRate > previousUtilization + 5) trend = 'increasing'
        else if (utilizationRate < previousUtilization - 5) trend = 'decreasing'
      }

      const projectedSpend = totalSpent * 1.15
      const projectedVariance = totalBudgeted - projectedSpend

      const monthlyData = [
        { month: 'Jun', budgeted: 20000000, spent: 16800000 },
        { month: 'Jul', budgeted: 20000000, spent: 17200000 },
        { month: 'Ago', budgeted: 20000000, spent: 15500000 }
      ]

      return {
        ...location,
        analytics: {
          totalBudgeted,
          totalSpent,
          totalVariance,
          utilizationRate,
          trend,
          projectedSpend,
          projectedVariance
        },
        monthlyData
      }
    })

    setLocations(analyticsData)
    setIsLoading(false)
  }

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const getVarianceColor = (variance: number): string => {
    if (variance > 0) return 'text-green-600'
    if (variance < -1000000) return 'text-red-600'
    return 'text-yellow-600'
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'increasing':
        return (
          <svg className="w-4 h-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
        )
      case 'decreasing':
        return (
          <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
          </svg>
        )
      default:
        return (
          <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14" />
          </svg>
        )
    }
  }

  const exportReport = (format: 'pdf' | 'excel') => {
    console.log(`Exporting ${format} report for period: ${selectedPeriod}`)
    // TODO: Implement actual export functionality
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const selectedLocationData = selectedLocation === 'all' 
    ? locations 
    : locations.filter(loc => loc.id === selectedLocation)

  const aggregatedAnalytics = locations.reduce((acc, location) => ({
    totalBudgeted: acc.totalBudgeted + location.analytics.totalBudgeted,
    totalSpent: acc.totalSpent + location.analytics.totalSpent,
    totalVariance: acc.totalVariance + location.analytics.totalVariance,
    utilizationRate: (acc.totalSpent + location.analytics.totalSpent) / (acc.totalBudgeted + location.analytics.totalBudgeted) * 100
  }), { totalBudgeted: 0, totalSpent: 0, totalVariance: 0, utilizationRate: 0 })

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Analytics de Presupuesto</h1>
        <p className="text-gray-600">Análisis detallado, tendencias y proyecciones de presupuestos</p>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ubicación
            </label>
            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Todas las ubicaciones</option>
              {locations.map((location) => (
                <option key={location.id} value={location.id}>
                  {location.name}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Período
            </label>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="current-month">Mes actual</option>
              <option value="current-quarter">Trimestre actual</option>
              <option value="current-year">Año actual</option>
              <option value="last-3-months">Últimos 3 meses</option>
            </select>
          </div>

          <div className="flex items-end gap-2">
            <button
              onClick={() => exportReport('pdf')}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              PDF
            </button>
            <button
              onClick={() => exportReport('excel')}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Excel
            </button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Presupuesto Total</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(selectedLocation === 'all' ? aggregatedAnalytics.totalBudgeted : selectedLocationData[0]?.analytics.totalBudgeted || 0)}
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Gasto Real</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(selectedLocation === 'all' ? aggregatedAnalytics.totalSpent : selectedLocationData[0]?.analytics.totalSpent || 0)}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Varianza</p>
              <p className={`text-2xl font-bold ${getVarianceColor(selectedLocation === 'all' ? aggregatedAnalytics.totalVariance : selectedLocationData[0]?.analytics.totalVariance || 0)}`}>
                {formatCurrency(selectedLocation === 'all' ? aggregatedAnalytics.totalVariance : selectedLocationData[0]?.analytics.totalVariance || 0)}
              </p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-full">
              <svg className="w-6 h-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Utilización</p>
              <p className="text-2xl font-bold text-gray-900">
                {(selectedLocation === 'all' ? aggregatedAnalytics.utilizationRate : selectedLocationData[0]?.analytics.utilizationRate || 0).toFixed(1)}%
              </p>
            </div>
            <div className="p-3 bg-purple-100 rounded-full">
              <svg className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Trend Chart */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Tendencia de Gastos</h3>
          <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
            <div className="text-center">
              <svg className="w-16 h-16 text-gray-400 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <p className="text-gray-500">Gráfico de tendencias</p>
              <p className="text-sm text-gray-400">Chart.js integration pending</p>
            </div>
          </div>
        </div>

        {/* Utilization Chart */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Utilización por Ubicación</h3>
          <div className="space-y-4">
            {selectedLocationData.map((location) => (
              <div key={location.id} className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">{location.name}</span>
                    <span className="text-sm text-gray-500">{location.analytics.utilizationRate.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        location.analytics.utilizationRate > 90
                          ? 'bg-red-500'
                          : location.analytics.utilizationRate > 75
                          ? 'bg-yellow-500'
                          : 'bg-green-500'
                      }`}
                      style={{ width: `${Math.min(location.analytics.utilizationRate, 100)}%` }}
                    ></div>
                  </div>
                </div>
                <div className="ml-3">
                  {getTrendIcon(location.analytics.trend)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Projections Section */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Proyecciones y Alertas</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {selectedLocationData.map((location) => (
            <div key={location.id} className="border border-gray-200 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-3">{location.name}</h4>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Gasto Proyectado:</span>
                  <span className="font-medium">{formatCurrency(location.analytics.projectedSpend)}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Varianza Proyectada:</span>
                  <span className={`font-medium ${getVarianceColor(location.analytics.projectedVariance)}`}>
                    {formatCurrency(location.analytics.projectedVariance)}
                  </span>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  {getTrendIcon(location.analytics.trend)}
                  <span className="text-sm text-gray-600">
                    Tendencia: {location.analytics.trend === 'increasing' ? 'Creciente' : 
                                location.analytics.trend === 'decreasing' ? 'Decreciente' : 'Estable'}
                  </span>
                </div>

                {location.analytics.utilizationRate > (location.budget?.alertThreshold || 85) && (
                  <div className="bg-red-50 border border-red-200 rounded-md p-3 mt-3">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                      <span className="text-sm text-red-700 font-medium">Alerta de Presupuesto</span>
                    </div>
                    <p className="text-xs text-red-600 mt-1">
                      Utilización superior al {location.budget?.alertThreshold || 85}%
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Detailed Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Análisis Detallado por Ubicación</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ubicación
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Presupuesto
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Gastado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Varianza
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Utilización
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tendencia
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Proyección
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {selectedLocationData.map((location) => (
                <tr key={location.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{location.name}</div>
                      <div className="text-sm text-gray-500">{location.address}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatCurrency(location.analytics.totalBudgeted)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatCurrency(location.analytics.totalSpent)}
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm ${getVarianceColor(location.analytics.totalVariance)}`}>
                    {formatCurrency(location.analytics.totalVariance)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-1">
                        <div className={`text-sm font-medium ${
                          location.analytics.utilizationRate > 90 ? 'text-red-600' :
                          location.analytics.utilizationRate > 75 ? 'text-yellow-600' : 'text-green-600'
                        }`}>
                          {location.analytics.utilizationRate.toFixed(1)}%
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      {getTrendIcon(location.analytics.trend)}
                      <span className="text-sm text-gray-600 capitalize">
                        {location.analytics.trend === 'increasing' ? 'Creciente' :
                         location.analytics.trend === 'decreasing' ? 'Decreciente' : 'Estable'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatCurrency(location.analytics.projectedSpend)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}