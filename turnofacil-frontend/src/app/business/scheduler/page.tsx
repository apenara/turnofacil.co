/**
 * Página del Business Scheduler - Refactorizada
 * @fileoverview Planificador de horarios para business admin con múltiples ubicaciones
 */

'use client'

import React, { useState, useCallback, useMemo } from 'react'
import { Card, Button, Input, Modal, Tag } from '@/components/ui'
import { useNotifications } from '@/components/shared/NotificationSystem'

// Importar componentes reutilizables del supervisor
import {
  WeekSelector,
  TabNavigation,
  SimpleWeeklyCalendar,
  EmployeesList,
  ShiftCreationModal,
  TemplateManager,
  ValidationPanel,
  WeekSummary,
  QuickActions,
  type TabType
} from '../../supervisor/schedule-creator/components'

// Importar hooks reutilizables del supervisor
import {
  useWeekCalculations,
  useShiftManagement,
  useScheduleValidation
} from '../../supervisor/schedule-creator/hooks'

// Importar tipos y utilidades
import { 
  Employee, 
  ShiftTemplate, 
  ScheduleShift 
} from '../../supervisor/schedule-creator/types'

interface Location {
  id: string
  name: string
  address: string
  employeeCount: number
  activeShifts: number
  weeklyBudget: number
  weeklySpent: number
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

/**
 * Datos de ejemplo de ubicaciones
 */
const MOCK_LOCATIONS: Location[] = [
  {
    id: '1',
    name: 'Sede Centro',
    address: 'Cra 7 #45-23, Bogotá',
    employeeCount: 15,
    activeShifts: 8,
    weeklyBudget: 12000000,
    weeklySpent: 8500000
  },
  {
    id: '2',
    name: 'Sede Norte',
    address: 'Cll 140 #15-30, Bogotá',
    employeeCount: 12,
    activeShifts: 6,
    weeklyBudget: 10000000,
    weeklySpent: 7200000
  },
  {
    id: '3',
    name: 'Sede Chapinero',
    address: 'Cll 67 #9-45, Bogotá',
    employeeCount: 10,
    activeShifts: 5,
    weeklyBudget: 8000000,
    weeklySpent: 6100000
  }
]

/**
 * Datos de ejemplo de empleados por ubicación
 */
const BUSINESS_EMPLOYEES: Employee[] = [
  // Sede Centro
  {
    id: '1',
    name: 'Carlos López',
    position: 'Gerente',
    locationId: '1',
    maxWeeklyHours: 48,
    hourlyRate: 8000,
    skills: ['Gestión', 'Ventas', 'Liderazgo'],
    availability: [
      { day: 1, available: true, startTime: '08:00', endTime: '18:00' },
      { day: 2, available: true, startTime: '08:00', endTime: '18:00' },
      { day: 3, available: true, startTime: '08:00', endTime: '18:00' },
      { day: 4, available: true, startTime: '08:00', endTime: '18:00' },
      { day: 5, available: true, startTime: '08:00', endTime: '18:00' },
      { day: 6, available: false },
      { day: 0, available: false }
    ]
  },
  {
    id: '2',
    name: 'Ana Martínez',
    position: 'Supervisora',
    locationId: '1',
    maxWeeklyHours: 44,
    hourlyRate: 7000,
    skills: ['Supervisión', 'Atención al cliente', 'Capacitación'],
    availability: [
      { day: 1, available: true, startTime: '09:00', endTime: '19:00' },
      { day: 2, available: true, startTime: '09:00', endTime: '19:00' },
      { day: 3, available: true, startTime: '09:00', endTime: '19:00' },
      { day: 4, available: true, startTime: '09:00', endTime: '19:00' },
      { day: 5, available: true, startTime: '09:00', endTime: '19:00' },
      { day: 6, available: true, startTime: '10:00', endTime: '16:00' },
      { day: 0, available: false }
    ]
  },
  // Sede Norte
  {
    id: '3',
    name: 'Luis Rodríguez',
    position: 'Coordinador',
    locationId: '2',
    maxWeeklyHours: 40,
    hourlyRate: 6500,
    skills: ['Coordinación', 'Logística', 'Inventario'],
    availability: [
      { day: 1, available: true, startTime: '07:00', endTime: '17:00' },
      { day: 2, available: true, startTime: '07:00', endTime: '17:00' },
      { day: 3, available: true, startTime: '07:00', endTime: '17:00' },
      { day: 4, available: true, startTime: '07:00', endTime: '17:00' },
      { day: 5, available: true, startTime: '07:00', endTime: '17:00' },
      { day: 6, available: false },
      { day: 0, available: false }
    ]
  },
  // Sede Chapinero
  {
    id: '4',
    name: 'Elena García',
    position: 'Asistente',
    locationId: '3',
    maxWeeklyHours: 40,
    hourlyRate: 5500,
    skills: ['Administración', 'Archivo', 'Atención telefónica'],
    availability: [
      { day: 1, available: true, startTime: '08:00', endTime: '16:00' },
      { day: 2, available: true, startTime: '08:00', endTime: '16:00' },
      { day: 3, available: true, startTime: '08:00', endTime: '16:00' },
      { day: 4, available: true, startTime: '08:00', endTime: '16:00' },
      { day: 5, available: true, startTime: '08:00', endTime: '16:00' },
      { day: 6, available: false },
      { day: 0, available: false }
    ]
  }
]

/**
 * Plantillas de turnos por defecto para business
 */
const BUSINESS_TEMPLATES: ShiftTemplate[] = [
  {
    id: 'biz-template-1',
    name: 'Turno Administrativo',
    startTime: '08:00',
    endTime: '17:00',
    duration: 9,
    type: 'regular',
    color: '#10B981',
    description: 'Turno administrativo estándar',
    crossesMidnight: false
  },
  {
    id: 'biz-template-2',
    name: 'Turno Gerencial',
    startTime: '09:00',
    endTime: '18:00',
    duration: 9,
    type: 'regular',
    color: '#3B82F6',
    description: 'Turno para personal gerencial',
    crossesMidnight: false
  },
  {
    id: 'biz-template-3',
    name: 'Turno Extendido',
    startTime: '07:00',
    endTime: '19:00',
    duration: 12,
    type: 'overtime',
    color: '#F59E0B',
    description: 'Turno extendido con horas extra',
    crossesMidnight: false
  }
]

/**
 * Componente principal del business scheduler
 */
export default function BusinessSchedulerPage() {
  const { addNotification } = useNotifications()
  
  // Estado local para business-specific features
  const [selectedLocationId, setSelectedLocationId] = useState<string>('all')
  const [activeTab, setActiveTab] = useState<TabType>('calendar')
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('')
  const [shiftModalState, setShiftModalState] = useState<{
    isOpen: boolean
    shift?: ScheduleShift | null
    preselectedEmployeeId?: string
    preselectedDate?: string
    preselectedStartTime?: string
  }>({ isOpen: false })
  const [templates, setTemplates] = useState<ShiftTemplate[]>(BUSINESS_TEMPLATES)

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
    generateWeekOptions,
    calculateWeekSummary
  } = weekCalculations

  // Filtrar empleados por ubicación seleccionada
  const filteredEmployees = useMemo(() => {
    if (selectedLocationId === 'all') {
      return BUSINESS_EMPLOYEES
    }
    return BUSINESS_EMPLOYEES.filter(emp => emp.locationId === selectedLocationId)
  }, [selectedLocationId])

  // Calcular presupuesto total o por ubicación
  const totalBudget = useMemo(() => {
    if (selectedLocationId === 'all') {
      return MOCK_LOCATIONS.reduce((sum, loc) => sum + loc.weeklyBudget, 0)
    }
    const location = MOCK_LOCATIONS.find(loc => loc.id === selectedLocationId)
    return location?.weeklyBudget || 0
  }, [selectedLocationId])

  // Hook de gestión de turnos
  const shiftManagement = useShiftManagement(
    filteredEmployees,
    totalBudget,
    weekConfig.dates
  )
  const {
    shifts,
    selectedShift,
    metrics,
    createShift,
    updateShift,
    deleteShift,
    setSelectedShift,
    confirmAllShifts,
    clearAllShifts
  } = shiftManagement

  // Hook de validación
  const validation = useScheduleValidation({
    config: {
      maxWeeklyHours: 48,
      maxConsecutiveHours: 12,
      minimumRestBetweenShifts: 12,
      enforceRestDays: true,
      enforceBudgetLimits: true,
      budgetWarningThreshold: 85,
      enforceAvailability: true
    },
    shifts,
    employees: filteredEmployees,
    restDays: [],
    leaves: [],
    weekDates: weekConfig.dates,
    budgetInfo: {
      weeklyBudget: totalBudget,
      currentSpent: metrics.weeklyCost,
      alertThreshold: 85
    }
  })

  // Resumen semanal calculado
  const weekSummary = useMemo(() => {
    return calculateWeekSummary(shifts, filteredEmployees, totalBudget)
  }, [shifts, filteredEmployees, totalBudget, calculateWeekSummary])

  // Opciones de semanas para el selector
  const weekOptions = useMemo(() => {
    return generateWeekOptions(12)
  }, [generateWeekOptions])

  // Manejadores de eventos del modal de turnos
  const handleCreateShift = useCallback((employeeId: string, date: string, startTime?: string) => {
    setShiftModalState({
      isOpen: true,
      shift: null,
      preselectedEmployeeId: employeeId,
      preselectedDate: date,
      preselectedStartTime: startTime
    })
  }, [])

  const handleEditShift = useCallback((shift: ScheduleShift) => {
    setShiftModalState({
      isOpen: true,
      shift
    })
  }, [])

  const handleCloseShiftModal = useCallback(() => {
    setShiftModalState({ isOpen: false })
  }, [])

  // Manejadores de acciones
  const handleSave = useCallback(async () => {
    try {
      await new Promise(resolve => setTimeout(resolve, 1000))
      addNotification({
        type: 'success',
        title: 'Horario Guardado',
        message: 'El horario se ha guardado correctamente.'
      })
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Error al Guardar',
        message: 'No se pudo guardar el horario. Intenta nuevamente.'
      })
    }
  }, [addNotification])

  const handleValidate = useCallback(async () => {
    try {
      await new Promise(resolve => setTimeout(resolve, 500))
      if (validation.isValid) {
        addNotification({
          type: 'success',
          title: 'Validación Exitosa',
          message: 'El horario cumple con todas las validaciones.'
        })
      } else {
        addNotification({
          type: 'warning',
          title: 'Errores de Validación',
          message: `Se encontraron ${validation.summary.totalErrors} errores y ${validation.summary.totalWarnings} advertencias.`
        })
      }
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Error en Validación',
        message: 'No se pudo completar la validación.'
      })
    }
  }, [validation, addNotification])

  // Gestión de plantillas
  const handleCreateTemplate = useCallback(async (templateData: Omit<ShiftTemplate, 'id'>) => {
    const newTemplate: ShiftTemplate = {
      ...templateData,
      id: `biz-template-${Date.now()}`
    }
    setTemplates(prev => [...prev, newTemplate])
    addNotification({
      type: 'success',
      title: 'Plantilla Creada',
      message: `La plantilla "${newTemplate.name}" se ha creado correctamente.`
    })
  }, [addNotification])

  const handleUpdateTemplate = useCallback(async (id: string, templateData: Partial<ShiftTemplate>) => {
    setTemplates(prev => prev.map(template => 
      template.id === id ? { ...template, ...templateData } : template
    ))
    addNotification({
      type: 'success',
      title: 'Plantilla Actualizada',
      message: 'La plantilla se ha actualizado correctamente.'
    })
  }, [addNotification])

  const handleDeleteTemplate = useCallback(async (id: string) => {
    setTemplates(prev => prev.filter(template => template.id !== id))
    addNotification({
      type: 'success',
      title: 'Plantilla Eliminada',
      message: 'La plantilla se ha eliminado correctamente.'
    })
  }, [addNotification])

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Planificador de Horarios</h1>
              <p className="text-gray-600">Gestiona horarios para todas las ubicaciones</p>
            </div>
          </div>

          {/* Location Selector */}
          <div className="mb-4">
            <Card className="p-4">
              <div className="flex items-center space-x-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ubicación
                  </label>
                  <select
                    value={selectedLocationId}
                    onChange={(e) => setSelectedLocationId(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">Todas las ubicaciones</option>
                    {MOCK_LOCATIONS.map((location) => (
                      <option key={location.id} value={location.id}>
                        {location.name} - {location.employeeCount} empleados
                      </option>
                    ))}
                  </select>
                </div>
                
                {selectedLocationId !== 'all' && (
                  <div className="text-sm text-gray-600">
                    <p><strong>Dirección:</strong> {MOCK_LOCATIONS.find(l => l.id === selectedLocationId)?.address}</p>
                    <p><strong>Presupuesto semanal:</strong> ${totalBudget.toLocaleString('es-CO')}</p>
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Week Selector */}
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
            isLoading={weekCalculations.isLoading}
          />
        </div>

        {/* Navegación por pestañas */}
        <div className="mb-6">
          <TabNavigation
            activeTab={activeTab}
            onTabChange={setActiveTab}
            validationErrors={validation.summary.totalErrors}
            validationWarnings={validation.summary.totalWarnings}
            employeeCount={filteredEmployees.length}
            shiftsCount={shifts.length}
            restDaysCount={0}
            templatesCount={templates.length}
          />
        </div>

        {/* Contenido principal */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Contenido principal */}
          <div className="lg:col-span-3">
            {activeTab === 'calendar' && (
              <div className="space-y-6">
                <SimpleWeeklyCalendar
                  weekDates={weekConfig.dates}
                  employees={filteredEmployees}
                  shifts={shifts}
                  restDays={[]}
                  leaves={[]}
                  selectedShift={selectedShift}
                  onShiftSelect={setSelectedShift}
                  onCreateShift={handleCreateShift}
                  onEditShift={handleEditShift}
                  onDeleteShift={deleteShift}
                />
                
                <WeekSummary
                  summary={weekSummary}
                  weeklyBudget={totalBudget}
                  showComparison={false}
                  showCharts={true}
                />
              </div>
            )}

            {activeTab === 'employees' && (
              <EmployeesList
                employees={filteredEmployees}
                shifts={shifts}
                restDays={[]}
                leaves={[]}
                selectedEmployeeId={selectedEmployeeId}
                onEmployeeSelect={setSelectedEmployeeId}
                onCreateShift={(employeeId: string) => {
                  setSelectedEmployeeId(employeeId)
                  setActiveTab('calendar')
                }}
                showDetails={true}
              />
            )}

            {activeTab === 'templates' && (
              <TemplateManager
                templates={templates}
                onCreateTemplate={handleCreateTemplate}
                onUpdateTemplate={handleUpdateTemplate}
                onDeleteTemplate={handleDeleteTemplate}
                employees={filteredEmployees}
                isLoading={false}
              />
            )}

            {activeTab === 'validation' && (
              <ValidationPanel
                validation={validation}
                employees={filteredEmployees}
                onNavigateToEmployee={setSelectedEmployeeId}
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
          </div>

          {/* Panel lateral */}
          <div className="space-y-6">
            <QuickActions
              onSave={handleSave}
              onConfirmAll={async () => { await confirmAllShifts(); }}
              onClearAll={async () => { clearAllShifts(); }}
              onValidate={handleValidate}
              isValid={validation.isValid}
              errorCount={validation.summary.totalErrors}
              hasUnsavedChanges={shifts.length > 0}
              isLoading={false}
              compact={false}
            />

            {/* Business-specific metrics */}
            <Card>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Métricas de Negocio
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Ubicaciones activas:</span>
                  <span className="font-medium">
                    {selectedLocationId === 'all' ? MOCK_LOCATIONS.length : 1}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total empleados:</span>
                  <span className="font-medium">{filteredEmployees.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Presupuesto semanal:</span>
                  <span className="font-medium">${totalBudget.toLocaleString('es-CO')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Utilización:</span>
                  <span className={`font-medium ${
                    metrics.budgetUtilization > 100 ? 'text-red-600' :
                    metrics.budgetUtilization > 85 ? 'text-yellow-600' : 'text-green-600'
                  }`}>
                    {metrics.budgetUtilization.toFixed(1)}%
                  </span>
                </div>
              </div>
            </Card>

            {activeTab === 'calendar' && (
              <EmployeesList
                employees={filteredEmployees}
                shifts={shifts}
                restDays={[]}
                leaves={[]}
                selectedEmployeeId={selectedEmployeeId}
                onEmployeeSelect={setSelectedEmployeeId}
                onCreateShift={(employeeId: string) => {
                  setSelectedEmployeeId(employeeId)
                  setActiveTab('calendar')
                }}
                showDetails={false}
                className="lg:max-h-96"
              />
            )}
          </div>
        </div>

        {/* Modal de creación/edición de turnos */}
        <ShiftCreationModal
          isOpen={shiftModalState.isOpen}
          onClose={handleCloseShiftModal}
          shift={shiftModalState.shift}
          employees={filteredEmployees}
          templates={templates}
          onCreateShift={createShift}
          onUpdateShift={updateShift}
          preselectedEmployeeId={shiftModalState.preselectedEmployeeId}
          preselectedDate={shiftModalState.preselectedDate}
          preselectedStartTime={shiftModalState.preselectedStartTime}
          isSaving={shiftManagement.isLoading}
        />
      </div>
    </div>
  )
}