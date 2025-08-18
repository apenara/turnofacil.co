/**
 * Componente WeekSummary
 * @fileoverview Resumen semanal con métricas, gráficos y estadísticas del horario
 */

'use client'

import React, { useMemo } from 'react'
import {
  ClockIcon,
  CurrencyDollarIcon,
  UserGroupIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  CalendarDaysIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon
} from '@heroicons/react/24/outline'
import { WeekSummary as WeekSummaryType, ScheduleShift, Employee } from '../types'
import { formatDuration } from '../utils'

/**
 * Props del componente WeekSummary
 */
export interface WeekSummaryProps {
  /**
   * Resumen calculado de la semana
   */
  summary: WeekSummaryType
  
  /**
   * Presupuesto semanal total
   */
  weeklyBudget: number
  
  /**
   * Datos de la semana anterior para comparación
   */
  previousWeekSummary?: Partial<WeekSummaryType>
  
  /**
   * Mostrar comparación con semana anterior
   */
  showComparison?: boolean
  
  /**
   * Mostrar gráficos detallados
   */
  showCharts?: boolean
  
  /**
   * Clases CSS adicionales
   */
  className?: string
}

/**
 * Componente de resumen semanal
 */
export function WeekSummary({
  summary,
  weeklyBudget,
  previousWeekSummary,
  showComparison = true,
  showCharts = true,
  className = ''
}: WeekSummaryProps) {
  
  // Cálculos de comparación
  const comparison = useMemo(() => {
    if (!previousWeekSummary || !showComparison) return null
    
    const hoursDiff = summary.metrics.weeklyHours - (previousWeekSummary.metrics?.weeklyHours || 0)
    const costDiff = summary.metrics.weeklyCost - (previousWeekSummary.metrics?.weeklyCost || 0)
    const employeesDiff = summary.metrics.employeeCount - (previousWeekSummary.metrics?.employeeCount || 0)
    
    return {
      hours: {
        value: hoursDiff,
        percentage: previousWeekSummary.metrics?.weeklyHours 
          ? (hoursDiff / previousWeekSummary.metrics.weeklyHours) * 100 
          : 0,
        isIncrease: hoursDiff > 0
      },
      cost: {
        value: costDiff,
        percentage: previousWeekSummary.metrics?.weeklyCost 
          ? (costDiff / previousWeekSummary.metrics.weeklyCost) * 100 
          : 0,
        isIncrease: costDiff > 0
      },
      employees: {
        value: employeesDiff,
        percentage: previousWeekSummary.metrics?.employeeCount 
          ? (employeesDiff / previousWeekSummary.metrics.employeeCount) * 100 
          : 0,
        isIncrease: employeesDiff > 0
      }
    }
  }, [summary, previousWeekSummary, showComparison])

  // Formatear porcentaje de cambio
  const formatPercentageChange = (value: number, isIncrease: boolean) => {
    const sign = isIncrease ? '+' : ''
    const color = isIncrease ? 'text-green-600' : 'text-red-600'
    const icon = isIncrease ? ArrowTrendingUpIcon : ArrowTrendingDownIcon
    const Icon = icon
    
    return (
      <div className={`flex items-center ${color} text-sm`}>
        <Icon className="w-4 h-4 mr-1" />
        <span>{sign}{Math.abs(value).toFixed(1)}%</span>
      </div>
    )
  }

  // Obtener color del estado del presupuesto
  const getBudgetStatusColor = () => {
    switch (summary.metrics.budgetStatus) {
      case 'success': return 'text-green-600 bg-green-50 border-green-200'
      case 'warning': return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      case 'danger': return 'text-red-600 bg-red-50 border-red-200'
      default: return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            Resumen Semanal
          </h3>
          <div className="text-sm text-gray-500">
            {summary.weekRange}
          </div>
        </div>
      </div>

      {/* Métricas principales */}
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Horas totales */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <ClockIcon className="w-5 h-5 text-gray-400 mr-2" />
                <span className="text-sm font-medium text-gray-600">Horas Totales</span>
              </div>
              {comparison?.hours && formatPercentageChange(comparison.hours.percentage, comparison.hours.isIncrease)}
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {formatDuration(summary.metrics.weeklyHours)}
            </div>
            <div className="text-sm text-gray-500 mt-1">
              {summary.totalShifts} turnos programados
            </div>
          </div>

          {/* Costo total */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <CurrencyDollarIcon className="w-5 h-5 text-gray-400 mr-2" />
                <span className="text-sm font-medium text-gray-600">Costo Total</span>
              </div>
              {comparison?.cost && formatPercentageChange(comparison.cost.percentage, comparison.cost.isIncrease)}
            </div>
            <div className="text-2xl font-bold text-gray-900">
              ${summary.metrics.weeklyCost.toLocaleString('es-CO')}
            </div>
            <div className="text-sm text-gray-500 mt-1">
              {summary.metrics.budgetUtilization.toFixed(1)}% del presupuesto
            </div>
          </div>

          {/* Empleados activos */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <UserGroupIcon className="w-5 h-5 text-gray-400 mr-2" />
                <span className="text-sm font-medium text-gray-600">Empleados</span>
              </div>
              {comparison?.employees && formatPercentageChange(comparison.employees.percentage, comparison.employees.isIncrease)}
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {summary.metrics.employeeCount}
            </div>
            <div className="text-sm text-gray-500 mt-1">
              empleados con turnos
            </div>
          </div>

          {/* Estado del presupuesto */}
          <div className={`rounded-lg p-4 border ${getBudgetStatusColor()}`}>
            <div className="flex items-center mb-2">
              {summary.metrics.budgetStatus === 'success' ? (
                <CheckCircleIcon className="w-5 h-5 mr-2" />
              ) : (
                <ExclamationTriangleIcon className="w-5 h-5 mr-2" />
              )}
              <span className="text-sm font-medium">Estado Presupuestal</span>
            </div>
            <div className="text-2xl font-bold">
              {summary.metrics.budgetUtilization.toFixed(1)}%
            </div>
            <div className="text-sm mt-1">
              ${summary.budgetRemaining.toLocaleString('es-CO')} restante
            </div>
          </div>
        </div>

        {/* Resumen por días */}
        {showCharts && (
          <div className="mb-8">
            <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <ChartBarIcon className="w-5 h-5 mr-2" />
              Distribución Diaria
            </h4>
            
            <div className="grid grid-cols-7 gap-2">
              {summary.dailySummary.map((day, index) => {
                const maxHours = Math.max(...summary.dailySummary.map(d => d.totalHours))
                const heightPercentage = maxHours > 0 ? (day.totalHours / maxHours) * 100 : 0
                
                return (
                  <div key={day.date} className="text-center">
                    <div className="mb-2">
                      <div 
                        className={`w-full rounded-t-md transition-all duration-300 ${
                          day.isSpecial ? 'bg-red-400' : 'bg-blue-400'
                        }`}
                        style={{ 
                          height: `${Math.max(heightPercentage, 5)}px`,
                          minHeight: '20px'
                        }}
                      />
                      <div className={`w-full h-8 rounded-b-md border-2 border-t-0 ${
                        day.isSpecial ? 'border-red-400 bg-red-50' : 'border-blue-400 bg-blue-50'
                      } flex items-center justify-center`}>
                        <span className="text-xs font-medium text-gray-700">
                          {formatDuration(day.totalHours)}
                        </span>
                      </div>
                    </div>
                    
                    <div className="text-xs space-y-1">
                      <div className={`font-medium ${day.isSpecial ? 'text-red-600' : 'text-gray-900'}`}>
                        {day.formattedDate}
                      </div>
                      <div className="text-gray-500">
                        {day.shiftsCount} turnos
                      </div>
                      <div className="text-gray-500">
                        {day.employeesCount} emp.
                      </div>
                      <div className="text-gray-500">
                        ${(day.totalCost || 0).toLocaleString('es-CO', { maximumFractionDigits: 0 })}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
            
            <div className="mt-4 flex items-center justify-center space-x-4 text-sm text-gray-500">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-blue-400 rounded mr-2" />
                <span>Días normales</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-red-400 rounded mr-2" />
                <span>Días especiales</span>
              </div>
            </div>
          </div>
        )}

        {/* Top empleados por horas */}
        <div className="mb-8">
          <h4 className="text-lg font-medium text-gray-900 mb-4">
            Empleados por Horas Trabajadas
          </h4>
          
          <div className="space-y-3">
            {summary.employeeSummary
              .sort((a, b) => b.totalHours - a.totalHours)
              .slice(0, 5)
              .map((emp, index) => {
                const maxHours = Math.max(...summary.employeeSummary.map(e => e.totalHours))
                const widthPercentage = maxHours > 0 ? (emp.totalHours / maxHours) * 100 : 0
                
                return (
                  <div key={emp.employeeId} className="flex items-center space-x-3">
                    <div className="w-4 text-sm text-gray-500 font-medium">
                      #{index + 1}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-gray-900">{emp.employeeName}</span>
                        <span className="text-sm text-gray-600">
                          {formatDuration(emp.totalHours)} • ${emp.totalCost.toLocaleString('es-CO')}
                        </span>
                      </div>
                      
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${widthPercentage}%` }}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between mt-1 text-xs text-gray-500">
                        <span>{emp.shiftsCount} turnos</span>
                        <span>{emp.workingDays} días</span>
                        <span>{formatDuration(emp.averageHoursPerDay)}/día</span>
                      </div>
                    </div>
                  </div>
                )
              })}
          </div>
        </div>

        {/* Días especiales */}
        {summary.specialDays.length > 0 && (
          <div>
            <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <CalendarDaysIcon className="w-5 h-5 mr-2" />
              Días Especiales de la Semana
            </h4>
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="space-y-2">
                {summary.specialDays.map((specialDay) => (
                  <div key={specialDay.date} className="flex items-center text-sm">
                    <ExclamationTriangleIcon className="w-4 h-4 text-yellow-600 mr-2" />
                    <span className="font-medium text-yellow-800">
                      {new Date(specialDay.date).toLocaleDateString('es-CO', {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'long'
                      })}
                    </span>
                    <span className="ml-2 text-yellow-700">
                      ({specialDay.isSunday ? 'Domingo' : 'Día festivo'})
                    </span>
                  </div>
                ))}
              </div>
              
              <div className="mt-3 text-sm text-yellow-700">
                <strong>Importante:</strong> Los turnos en estos días tienen recargos según la legislación laboral colombiana.
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default WeekSummary