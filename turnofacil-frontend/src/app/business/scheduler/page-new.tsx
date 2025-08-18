/**
 * Página del Business Scheduler
 * @fileoverview Versión migrada usando el módulo compartido de scheduling
 */

'use client'

import React, { useState, useCallback, useMemo } from 'react'
import { Card, Button, Input, Modal, Tag } from '@/components/ui'
import { useNotifications } from '@/components/shared/NotificationSystem'
import { 
  MapPinIcon, 
  UsersIcon, 
  CurrencyDollarIcon,
  ChartBarIcon,
  BuildingOfficeIcon,
  CalendarDaysIcon
} from '@heroicons/react/24/outline'

// Importar del módulo compartido
import {
  UniversalScheduleCalendar,
  useScheduleCore,
  useEmployeeManagement,
  createSchedulingContext,
  SchedulingUtils,
  COLOMBIAN_LABOR_CONSTANTS,
  BUDGET_CONFIG,
  type SchedulingContext,
  type Location,
  type CreateShiftData,
  type UpdateShiftData,
  type ScheduleMetrics
} from '@/shared/scheduling'

// Importar componentes que aún necesitamos del supervisor
import {
  WeekSelector,
  TabNavigation,
  ValidationPanel,
  WeekSummary,
  type TabType
} from '../../supervisor/schedule-creator/components'

// Hook de gestión de semanas
import { useWeekCalculations } from '../../supervisor/schedule-creator/hooks'

/**
 * Datos de ejemplo de ubicaciones para Business Admin
 */
const MOCK_LOCATIONS: Location[] = [
  {
    id: 'loc-1',
    name: 'Sede Centro',
    address: 'Cra 7 #45-23, Bogotá',
    employeeCount: 15,
    activeShifts: 8,
    weeklyBudget: 12000000,
    weeklySpent: 8500000,
    status: 'active',
    metadata: {
      manager: 'Carlos López',
      phone: '+57 301 1234567',
      timezone: 'America/Bogota'
    }
  },
  {
    id: 'loc-2',
    name: 'Sede Norte',
    address: 'Cll 140 #15-30, Bogotá',
    employeeCount: 12,
    activeShifts: 6,
    weeklyBudget: 10000000,
    weeklySpent: 7200000,
    status: 'active',
    metadata: {
      manager: 'Ana Martínez',
      phone: '+57 302 2345678',
      timezone: 'America/Bogota'
    }
  },
  {
    id: 'loc-3',
    name: 'Sede Chapinero',
    address: 'Cll 67 #9-45, Bogotá',
    employeeCount: 10,
    activeShifts: 5,
    weeklyBudget: 8000000,
    weeklySpent: 6100000,
    status: 'active',
    metadata: {
      manager: 'Luis Rodríguez',
      phone: '+57 303 3456789',
      timezone: 'America/Bogota'
    }
  }
]

/**
 * Datos del usuario Business Admin
 */
const BUSINESS_ADMIN_USER = {
  id: 'admin-1',
  name: 'Juan Pérez',
  role: 'BUSINESS_ADMIN' as const,
  locationId: undefined // Business admin puede ver todas las ubicaciones
}

/**
 * Componente de tarjeta de ubicación
 */
function LocationCard({ 
  location, 
  isSelected, 
  onClick,
  metrics 
}: { 
  location: Location
  isSelected: boolean
  onClick: () => void
  metrics?: ScheduleMetrics
}) {
  const budgetUtilization = (location.weeklySpent / location.weeklyBudget) * 100
  const budgetStatus = budgetUtilization > 100 ? 'danger' : 
                       budgetUtilization > 85 ? 'warning' : 'success'

  return (
    <Card 
      className={`cursor-pointer transition-all ${
        isSelected ? 'ring-2 ring-blue-500 shadow-lg' : 'hover:shadow-md'
      }`}
      onClick={onClick}
    >
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="font-semibold text-gray-900">{location.name}</h3>
            <p className="text-sm text-gray-500 flex items-center mt-1">
              <MapPinIcon className="h-3 w-3 mr-1" />
              {location.address}
            </p>
          </div>
          {isSelected && (
            <Tag color="blue" size="sm">Activa</Tag>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center">
            <UsersIcon className="h-4 w-4 text-gray-400 mr-2" />
            <div>
              <p className="text-xs text-gray-500">Empleados</p>
              <p className="font-medium">{location.employeeCount}</p>
            </div>
          </div>
          
          <div className="flex items-center">
            <CalendarDaysIcon className="h-4 w-4 text-gray-400 mr-2" />
            <div>
              <p className="text-xs text-gray-500">Turnos</p>
              <p className="font-medium">{location.activeShifts}</p>
            </div>
          </div>
        </div>

        <div className="mt-3 pt-3 border-t">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-gray-500">Presupuesto</span>
            <span className={`text-xs font-medium ${
              budgetStatus === 'danger' ? 'text-red-600' :
              budgetStatus === 'warning' ? 'text-yellow-600' :
              'text-green-600'
            }`}>
              {budgetUtilization.toFixed(0)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all ${
                budgetStatus === 'danger' ? 'bg-red-500' :
                budgetStatus === 'warning' ? 'bg-yellow-500' :
                'bg-green-500'
              }`}
              style={{ width: `${Math.min(100, budgetUtilization)}%` }}
            />
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-xs text-gray-500">
              ${location.weeklySpent.toLocaleString()}
            </span>
            <span className="text-xs text-gray-700 font-medium">
              ${location.weeklyBudget.toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    </Card>
  )
}

/**
 * Panel de métricas consolidadas
 */
function ConsolidatedMetrics({ 
  locations, 
  selectedLocation,
  globalMetrics 
}: { 
  locations: Location[]
  selectedLocation: string | 'all'
  globalMetrics: ScheduleMetrics
}) {
  const filteredLocations = selectedLocation === 'all' 
    ? locations 
    : locations.filter(l => l.id === selectedLocation)

  const totalBudget = filteredLocations.reduce((sum, loc) => sum + loc.weeklyBudget, 0)
  const totalSpent = filteredLocations.reduce((sum, loc) => sum + loc.weeklySpent, 0)
  const totalEmployees = filteredLocations.reduce((sum, loc) => sum + loc.employeeCount, 0)
  const totalShifts = filteredLocations.reduce((sum, loc) => sum + loc.activeShifts, 0)
  const budgetUtilization = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <Card>
        <div className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Presupuesto Total</p>
              <p className="text-2xl font-bold text-gray-900">
                ${totalBudget.toLocaleString()}
              </p>
              <p className="text-xs text-gray-600 mt-1">
                Usado: ${totalSpent.toLocaleString()} ({budgetUtilization.toFixed(1)}%)
              </p>
            </div>
            <CurrencyDollarIcon className={`h-8 w-8 ${
              budgetUtilization > 100 ? 'text-red-500' :
              budgetUtilization > 85 ? 'text-yellow-500' :
              'text-green-500'
            }`} />
          </div>
        </div>
      </Card>

      <Card>
        <div className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Empleados</p>
              <p className="text-2xl font-bold text-gray-900">{totalEmployees}</p>
              <p className="text-xs text-gray-600 mt-1">
                En {filteredLocations.length} ubicaciones
              </p>
            </div>
            <UsersIcon className="h-8 w-8 text-blue-500" />
          </div>
        </div>
      </Card>

      <Card>
        <div className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Turnos Activos</p>
              <p className="text-2xl font-bold text-gray-900">{totalShifts}</p>
              <p className="text-xs text-gray-600 mt-1">
                Promedio: {totalEmployees > 0 ? (totalShifts / totalEmployees).toFixed(1) : 0} por empleado
              </p>
            </div>
            <CalendarDaysIcon className="h-8 w-8 text-purple-500" />
          </div>
        </div>
      </Card>

      <Card>
        <div className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Horas Semanales</p>
              <p className="text-2xl font-bold text-gray-900">
                {globalMetrics.weeklyHours}h
              </p>
              <p className="text-xs text-gray-600 mt-1">
                Costo: ${globalMetrics.weeklyCost.toLocaleString()}
              </p>
            </div>
            <ChartBarIcon className="h-8 w-8 text-indigo-500" />
          </div>
        </div>
      </Card>
    </div>
  )
}

/**
 * Componente principal del Business Scheduler
 */
export default function BusinessSchedulerPage() {
  const { addNotification } = useNotifications()
  
  // Estado de la UI
  const [activeTab, setActiveTab] = useState<TabType>('calendar')
  const [selectedLocation, setSelectedLocation] = useState<string | 'all'>('all')
  const [showLocationModal, setShowLocationModal] = useState(false)
  
  // Hook de gestión de semanas
  const weekCalculations = useWeekCalculations()
  const {
    weekConfig,
    weekInfo,
    navigationInfo,
    goToPreviousWeek,
    goToNextWeek,
    goToCurrentWeek,
    goToWeek,
    generateWeekOptions
  } = weekCalculations

  // Crear contexto de scheduling
  const schedulingContext = useMemo<SchedulingContext>(() => {
    const totalBudget = MOCK_LOCATIONS.reduce((sum, loc) => sum + loc.weeklyBudget, 0)
    
    return createSchedulingContext(
      BUSINESS_ADMIN_USER,
      weekConfig.startDate,
      MOCK_LOCATIONS,
      {
        weeklyBudgetLimit: totalBudget,
        alertThreshold: 85,
        maxWeeklyHours: COLOMBIAN_LABOR_CONSTANTS.REGULAR_HOURS_PER_WEEK,
        enforceValidation: true
      }
    )
  }, [weekConfig.startDate])

  // Actualizar contexto con ubicación seleccionada
  const contextWithLocation = useMemo<SchedulingContext>(() => ({
    ...schedulingContext,
    location: {
      ...schedulingContext.location,
      current: selectedLocation
    }
  }), [schedulingContext, selectedLocation])

  // Usar hooks del módulo compartido
  const {
    shifts,
    employees,
    templates,
    restDays,
    leaves,
    validation,
    metrics,
    selectedShift,
    setSelectedShift,
    createShift,
    updateShift,
    deleteShift,
    validateSchedule,
    canPerformAction,
    getFilteredData,
    isLoading
  } = useScheduleCore({ 
    context: contextWithLocation,
    autoValidate: true,
    enableMetrics: true,
    refreshInterval: 30000 // Refrescar cada 30 segundos
  })

  const employeeManagement = useEmployeeManagement({
    context: contextWithLocation,
    employees,
    shifts,
    restDays,
    leaves
  })

  // Datos filtrados según permisos y ubicación
  const filteredData = useMemo(() => {
    const data = getFilteredData()
    
    // Si hay una ubicación seleccionada, filtrar adicionalmente
    if (selectedLocation !== 'all') {
      return {
        ...data,
        employees: data.employees.filter(emp => emp.locationId === selectedLocation),
        shifts: data.shifts.filter(shift => shift.locationId === selectedLocation),
        locations: data.locations.filter(loc => loc.id === selectedLocation)
      }
    }
    
    return data
  }, [getFilteredData, selectedLocation])

  // Opciones de semanas
  const weekOptions = useMemo(() => {
    return generateWeekOptions(12)
  }, [generateWeekOptions])

  // Manejadores de eventos
  const handleLocationChange = useCallback((locationId: string | 'all') => {
    setSelectedLocation(locationId)
    addNotification({
      type: 'info',
      title: 'Ubicación Cambiada',
      message: locationId === 'all' 
        ? 'Mostrando todas las ubicaciones' 
        : `Mostrando ${MOCK_LOCATIONS.find(l => l.id === locationId)?.name}`
    })
  }, [addNotification])

  const handleShiftCreate = useCallback(async (data: CreateShiftData) => {
    try {
      await createShift(data)
      addNotification({
        type: 'success',
        title: 'Turno Creado',
        message: 'El turno se ha creado correctamente'
      })
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Error',
        message: error instanceof Error ? error.message : 'Error al crear el turno'
      })
    }
  }, [createShift, addNotification])

  const handleShiftUpdate = useCallback(async (data: UpdateShiftData) => {
    try {
      await updateShift(data)
      addNotification({
        type: 'success',
        title: 'Turno Actualizado',
        message: 'El turno se ha actualizado correctamente'
      })
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Error',
        message: error instanceof Error ? error.message : 'Error al actualizar el turno'
      })
    }
  }, [updateShift, addNotification])

  const handleShiftDelete = useCallback(async (id: string) => {
    try {
      await deleteShift(id)
      addNotification({
        type: 'success',
        title: 'Turno Eliminado',
        message: 'El turno se ha eliminado correctamente'
      })
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Error',
        message: error instanceof Error ? error.message : 'Error al eliminar el turno'
      })
    }
  }, [deleteShift, addNotification])

  const handleApproveSchedule = useCallback(async () => {
    try {
      const result = await validateSchedule()
      
      if (!result.isValid) {
        addNotification({
          type: 'warning',
          title: 'No se puede aprobar',
          message: `El horario tiene ${result.summary.totalErrors} errores que deben corregirse`
        })
        return
      }

      // Cambiar estado de todos los turnos a publicados
      const updatePromises = shifts
        .filter(shift => shift.status !== 'published')
        .map(shift => updateShift({ ...shift, status: 'published' }))
      
      await Promise.all(updatePromises)
      
      addNotification({
        type: 'success',
        title: 'Horario Aprobado',
        message: `Se aprobaron y publicaron ${updatePromises.length} turnos`
      })
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'No se pudo aprobar el horario'
      })
    }
  }, [validateSchedule, shifts, updateShift, addNotification])

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header con título y acciones */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Planificador de Horarios
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Gestiona los horarios de todas tus ubicaciones
              </p>
            </div>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowLocationModal(true)}
              >
                <BuildingOfficeIcon className="h-4 w-4 mr-2" />
                Gestionar Ubicaciones
              </Button>
              
              {canPerformAction('approve_schedule') && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleApproveSchedule}
                  disabled={!validation.isValid || shifts.length === 0}
                >
                  Aprobar y Publicar
                </Button>
              )}
            </div>
          </div>

          {/* Selector de semana */}
          <WeekSelector
            currentWeek={weekInfo.weekString}
            weekRange={weekInfo.rangeString}
            isCurrentWeek={weekInfo.isCurrentWeek}
            canGoBack={navigationInfo.canGoBack}
            canGoForward={navigationInfo.canGoForward}
            onPreviousWeek={goToPreviousWeek}
            onNextWeek={goToNextWeek}
            onCurrentWeek={goToCurrentWeek}
            onWeekSelect={goToWeek}
            weekOptions={weekOptions}
            isLoading={isLoading}
          />
        </div>

        {/* Selector de ubicaciones */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-gray-900">Ubicaciones</h2>
            <Button
              variant={selectedLocation === 'all' ? 'primary' : 'outline'}
              size="xs"
              onClick={() => handleLocationChange('all')}
            >
              Ver Todas
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {MOCK_LOCATIONS.map(location => (
              <LocationCard
                key={location.id}
                location={location}
                isSelected={selectedLocation === location.id}
                onClick={() => handleLocationChange(location.id)}
                metrics={metrics}
              />
            ))}
          </div>
        </div>

        {/* Métricas consolidadas */}
        <ConsolidatedMetrics
          locations={MOCK_LOCATIONS}
          selectedLocation={selectedLocation}
          globalMetrics={metrics}
        />

        {/* Navegación por pestañas */}
        <div className="mb-6">
          <TabNavigation
            activeTab={activeTab}
            onTabChange={setActiveTab}
            validationErrors={validation.summary.totalErrors}
            validationWarnings={validation.summary.totalWarnings}
            employeeCount={filteredData.employees.length}
            shiftsCount={shifts.length}
            restDaysCount={restDays.length}
            templatesCount={templates.length}
          />
        </div>

        {/* Contenido principal */}
        <div className="space-y-6">
          {activeTab === 'calendar' && (
            <>
              <UniversalScheduleCalendar
                context={contextWithLocation}
                onShiftCreate={handleShiftCreate}
                onShiftUpdate={handleShiftUpdate}
                onShiftDelete={handleShiftDelete}
                compactMode={false}
              />
              
              <WeekSummary
                summary={{
                  weekRange: weekInfo.rangeString,
                  metrics,
                  totalShifts: shifts.length,
                  budgetRemaining: MOCK_LOCATIONS.reduce((sum, loc) => 
                    sum + (loc.weeklyBudget - loc.weeklySpent), 0
                  ),
                  dailySummary: [],
                  employeeSummary: [],
                  specialDays: []
                }}
                weeklyBudget={MOCK_LOCATIONS.reduce((sum, loc) => sum + loc.weeklyBudget, 0)}
                showComparison={true}
                showCharts={true}
              />
            </>
          )}

          {activeTab === 'validation' && (
            <ValidationPanel
              validation={validation}
              employees={filteredData.employees}
              onNavigateToEmployee={(id) => {
                const employee = filteredData.employees.find(e => e.id === id)
                if (employee) {
                  employeeManagement.selectEmployee(employee)
                  setActiveTab('employees')
                }
              }}
              onNavigateToShift={(shiftId) => {
                const shift = shifts.find(s => s.id === shiftId)
                if (shift) {
                  setSelectedShift(shift)
                  setActiveTab('calendar')
                }
              }}
              showOnlyCritical={false}
              defaultExpanded={true}
            />
          )}

          {/* Otras pestañas aquí */}
        </div>

        {/* Modal de gestión de ubicaciones */}
        <Modal
          isOpen={showLocationModal}
          onClose={() => setShowLocationModal(false)}
          title="Gestionar Ubicaciones"
          size="lg"
        >
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Gestiona las ubicaciones y sus presupuestos semanales.
            </p>
            
            {MOCK_LOCATIONS.map(location => (
              <div key={location.id} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">{location.name}</h3>
                    <p className="text-sm text-gray-600">{location.address}</p>
                  </div>
                  <Button variant="outline" size="xs">
                    Editar
                  </Button>
                </div>
                
                <div className="mt-3 grid grid-cols-3 gap-3 text-sm">
                  <div>
                    <span className="text-gray-500">Empleados:</span> {location.employeeCount}
                  </div>
                  <div>
                    <span className="text-gray-500">Presupuesto:</span> ${location.weeklyBudget.toLocaleString()}
                  </div>
                  <div>
                    <span className="text-gray-500">Gastado:</span> ${location.weeklySpent.toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
            
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowLocationModal(false)}
              >
                Cerrar
              </Button>
              <Button variant="primary" size="sm">
                Agregar Ubicación
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  )
}