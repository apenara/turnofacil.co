/**
 * Página del Creador de Horarios - Refactorizada
 * @fileoverview Componente principal que coordina todos los módulos del schedule creator
 */

'use client'

import React, { useState, useCallback, useMemo } from 'react'
import { useNotifications } from '@/components/shared/NotificationSystem'

// Importar todos los hooks personalizados
import {
  useWeekCalculations,
  useShiftManagement,
  useRestDayManagement,
  useLeaveManagement,
  useScheduleValidation
} from './hooks'

// Importar todos los componentes
import {
  WeekSelector,
  TabNavigation,
  SimpleWeeklyCalendar,
  EmployeesList,
  ShiftCreationModal,
  RestDayManager,
  TemplateManager,
  ValidationPanel,
  WeekSummary,
  QuickActions,
  type TabType
} from './components'

// Importar componentes de vista simple
import SimpleScheduleView from '@/components/calendar/SimpleScheduleView'
import ScheduleViewSelector, { useScheduleView } from '@/components/calendar/ScheduleViewSelector'
import ScheduleExporter from '@/components/calendar/ScheduleExporter'
import { useSimpleSchedule } from '@/shared/scheduling/hooks/useSimpleSchedule'
import { useCalendarResponsive } from '@/hooks/useResponsive'

// Importar tipos y utilidades
import { Employee, ShiftTemplate, ScheduleShift } from './types'
import { getCurrentWeekString } from './utils'

/**
 * Datos de ejemplo del supervisor (normalmente vendrían de una API)
 */
const SUPERVISOR_EMPLOYEES: Employee[] = [
  {
    id: '1',
    name: 'Carlos López',
    position: 'Cocinero',
    locationId: '1',
    maxWeeklyHours: 48,
    hourlyRate: 6250,
    skills: ['Cocina', 'Parrilla', 'Preparación'],
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
    position: 'Mesera',
    locationId: '1',
    maxWeeklyHours: 44,
    hourlyRate: 5729,
    skills: ['Atención al cliente', 'Caja', 'Servicio'],
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
    name: 'Luis Rodríguez',
    position: 'Cajero',
    locationId: '1',
    maxWeeklyHours: 40,
    hourlyRate: 5989,
    skills: ['Caja', 'Atención al cliente', 'Ventas'],
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
    name: 'Elena García',
    position: 'Mesera',
    locationId: '1',
    maxWeeklyHours: 44,
    hourlyRate: 5729,
    skills: ['Atención al cliente', 'Servicio', 'Barista'],
    availability: [
      { day: 1, available: true, startTime: '06:00', endTime: '14:00' },
      { day: 2, available: true, startTime: '06:00', endTime: '14:00' },
      { day: 3, available: true, startTime: '06:00', endTime: '14:00' },
      { day: 4, available: true, startTime: '06:00', endTime: '14:00' },
      { day: 5, available: true, startTime: '06:00', endTime: '14:00' },
      { day: 6, available: true, startTime: '08:00', endTime: '16:00' },
      { day: 0, available: true, startTime: '08:00', endTime: '16:00' }
    ]
  },
  {
    id: '5',
    name: 'Pedro Sánchez',
    position: 'Cocinero',
    locationId: '1',
    maxWeeklyHours: 48,
    hourlyRate: 6250,
    skills: ['Cocina', 'Repostería', 'Inventario'],
    availability: [
      { day: 1, available: true, startTime: '14:00', endTime: '22:00' },
      { day: 2, available: true, startTime: '14:00', endTime: '22:00' },
      { day: 3, available: true, startTime: '14:00', endTime: '22:00' },
      { day: 4, available: true, startTime: '14:00', endTime: '22:00' },
      { day: 5, available: true, startTime: '14:00', endTime: '22:00' },
      { day: 6, available: true, startTime: '14:00', endTime: '22:00' },
      { day: 0, available: false }
    ]
  },
  {
    id: '6',
    name: 'Sofia Herrera',
    position: 'Hostess',
    locationId: '1',
    maxWeeklyHours: 40,
    hourlyRate: 5500,
    skills: ['Atención al cliente', 'Reservas', 'Idiomas'],
    availability: [
      { day: 1, available: true, startTime: '10:00', endTime: '18:00' },
      { day: 2, available: true, startTime: '10:00', endTime: '18:00' },
      { day: 3, available: true, startTime: '10:00', endTime: '18:00' },
      { day: 4, available: true, startTime: '10:00', endTime: '18:00' },
      { day: 5, available: true, startTime: '10:00', endTime: '22:00' },
      { day: 6, available: true, startTime: '10:00', endTime: '22:00' },
      { day: 0, available: true, startTime: '10:00', endTime: '18:00' }
    ]
  }
]

/**
 * Plantillas de turnos por defecto
 */
const DEFAULT_TEMPLATES: ShiftTemplate[] = [
  {
    id: 'template-1',
    name: 'Turno Mañana',
    startTime: '06:00',
    endTime: '14:00',
    duration: 8,
    type: 'regular',
    color: '#10B981',
    description: 'Turno regular de mañana',
    crossesMidnight: false
  },
  {
    id: 'template-2',
    name: 'Turno Tarde',
    startTime: '14:00',
    endTime: '22:00',
    duration: 8,
    type: 'regular',
    color: '#3B82F6',
    description: 'Turno regular de tarde',
    crossesMidnight: false
  },
  {
    id: 'template-3',
    name: 'Turno Noche',
    startTime: '22:00',
    endTime: '06:00',
    duration: 8,
    type: 'night',
    color: '#8B5CF6',
    description: 'Turno nocturno con recargo',
    crossesMidnight: true
  },
  {
    id: 'template-4',
    name: 'Media Jornada',
    startTime: '09:00',
    endTime: '13:00',
    duration: 4,
    type: 'regular',
    color: '#F59E0B',
    description: 'Turno de media jornada',
    crossesMidnight: false
  }
]

/**
 * Configuración del restaurante
 */
const RESTAURANT_CONFIG = {
  weeklyBudget: 8000000, // 8 millones COP por semana
  location: {
    id: '1',
    name: 'Restaurante Centro',
    address: 'Cra 7 #45-23, Bogotá'
  }
}

/**
 * Componente principal del creador de horarios
 */
export default function ScheduleCreatorPage() {
  const { addNotification } = useNotifications()
  
  // Estado de la UI
  const [activeTab, setActiveTab] = useState<TabType>('calendar')
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('')
  
  // Hook para manejo de vistas
  const { viewMode, setViewMode } = useScheduleView('detailed')
  
  // Hook responsive
  const responsive = useCalendarResponsive()
  const [shiftModalState, setShiftModalState] = useState<{
    isOpen: boolean
    shift?: ScheduleShift | null
    preselectedEmployeeId?: string
    preselectedDate?: string
    preselectedStartTime?: string
  }>({ isOpen: false })
  const [templates, setTemplates] = useState<ShiftTemplate[]>(DEFAULT_TEMPLATES)

  // Hook de gestión de semanas
  const weekCalculations = useWeekCalculations()
  const {
    weekConfig,
    weekInfo,
    specialDays,
    navigationInfo,
    goToPreviousWeek,
    goToNextWeek,
    goToCurrentWeek,
    goToWeek,
    generateWeekOptions,
    calculateWeekSummary
  } = weekCalculations

  // Hook de gestión de turnos
  const shiftManagement = useShiftManagement(
    SUPERVISOR_EMPLOYEES,
    RESTAURANT_CONFIG.weeklyBudget,
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

  // Hook de gestión de días de descanso
  const restDayManagement = useRestDayManagement(
    SUPERVISOR_EMPLOYEES,
    shifts,
    weekConfig.dates
  )
  const {
    restDays,
    compliance,
    recommendations,
    complianceStats,
    createRestDay,
    deleteRestDay,
    autoAssignRestDays
  } = restDayManagement

  // Hook de gestión de licencias
  const leaveManagement = useLeaveManagement(
    SUPERVISOR_EMPLOYEES,
    shifts,
    weekConfig.dates
  )
  const {
    leaves,
    employeeStats,
    leaveConflicts,
    weeklyLeaves
  } = leaveManagement

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
    employees: SUPERVISOR_EMPLOYEES,
    restDays,
    leaves: weeklyLeaves,
    weekDates: weekConfig.dates,
    budgetInfo: {
      weeklyBudget: RESTAURANT_CONFIG.weeklyBudget,
      currentSpent: metrics.weeklyCost,
      alertThreshold: 85
    }
  })

  // Resumen semanal calculado
  const weekSummary = useMemo(() => {
    return calculateWeekSummary(shifts, SUPERVISOR_EMPLOYEES, RESTAURANT_CONFIG.weeklyBudget)
  }, [shifts, calculateWeekSummary])

  // Opciones de semanas para el selector
  const weekOptions = useMemo(() => {
    return generateWeekOptions(12)
  }, [generateWeekOptions])

  // Hook para vista simple
  const simpleScheduleData = useSimpleSchedule({
    shifts,
    employees: SUPERVISOR_EMPLOYEES,
    weekDates: weekConfig.dates
  })

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

  // Manejadores de acciones rápidas
  const handleSave = useCallback(async () => {
    try {
      // Aquí se implementaría la lógica de guardado
      await new Promise(resolve => setTimeout(resolve, 1000)) // Simulación
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
      await new Promise(resolve => setTimeout(resolve, 500)) // Simulación
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
      id: `template-${Date.now()}`
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
        {/* Header con selector de semana */}
        <div className="mb-6">
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
            employeeCount={SUPERVISOR_EMPLOYEES.length}
            shiftsCount={shifts.length}
            restDaysCount={restDays.length}
            templatesCount={templates.length}
          />
        </div>

        {/* Selector de vista - Solo visible en pestaña calendario */}
        {activeTab === 'calendar' && (
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <ScheduleViewSelector
                currentView={viewMode}
                onViewChange={setViewMode}
                showLabels={true}
              />
              
              {viewMode === 'simple' && (
                <ScheduleExporter
                  data={simpleScheduleData.exportData.toPrintData()}
                  compactMode={true}
                />
              )}
            </div>
            
            {viewMode === 'simple' && (
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                  {simpleScheduleData.statistics.totalShifts} turnos
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  {simpleScheduleData.statistics.employeesWithShifts} empleados activos
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                  {simpleScheduleData.statistics.coverage.toFixed(1)}% cobertura
                </div>
              </div>
            )}
          </div>
        )}

        {/* Contenido principal por pestañas */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Contenido principal */}
          <div className="lg:col-span-3">
            {activeTab === 'calendar' && (
              <div className="space-y-6">
                {viewMode === 'detailed' ? (
                  <SimpleWeeklyCalendar
                    weekDates={weekConfig.dates}
                    employees={SUPERVISOR_EMPLOYEES}
                    shifts={shifts}
                    restDays={restDays}
                    leaves={weeklyLeaves}
                    selectedShift={selectedShift}
                    onShiftSelect={setSelectedShift}
                    onCreateShift={handleCreateShift}
                    onEditShift={handleEditShift}
                    onDeleteShift={deleteShift}
                  />
                ) : (
                  <SimpleScheduleView
                    weekDates={weekConfig.dates}
                    employees={simpleScheduleData.simpleEmployees}
                    shifts={simpleScheduleData.simpleShifts}
                    showLegend={responsive.showFullLegend}
                    showPositions={responsive.showPositions}
                    compactMode={responsive.shouldUseCompactMode}
                    mobileMode={responsive.shouldUseMobileMode}
                    maxEmployeesOnMobile={responsive.maxEmployeesOnMobile}
                    onCellClick={(employeeId, date) => {
                      // Cambiar a vista detallada y crear turno
                      setViewMode('detailed')
                      handleCreateShift(employeeId, date)
                    }}
                  />
                )}
                
                <WeekSummary
                  summary={weekSummary}
                  weeklyBudget={RESTAURANT_CONFIG.weeklyBudget}
                  showComparison={false}
                  showCharts={viewMode === 'detailed'}
                />
              </div>
            )}

            {activeTab === 'employees' && (
              <EmployeesList
                employees={SUPERVISOR_EMPLOYEES}
                shifts={shifts}
                restDays={restDays}
                leaves={weeklyLeaves}
                selectedEmployeeId={selectedEmployeeId}
                onEmployeeSelect={setSelectedEmployeeId}
                onCreateShift={(employeeId: string) => {
                  setSelectedEmployeeId(employeeId)
                  setActiveTab('calendar')
                }}
                onAssignRestDay={(_employeeId) => {
                  // Lógica para asignar día de descanso
                  setActiveTab('rest-days')
                }}
                showDetails={true}
              />
            )}

            {activeTab === 'shifts' && (
              <div className="space-y-6">
                <SimpleWeeklyCalendar
                  weekDates={weekConfig.dates}
                  employees={SUPERVISOR_EMPLOYEES}
                  shifts={shifts}
                  restDays={restDays}
                  leaves={weeklyLeaves}
                  selectedShift={selectedShift}
                  onShiftSelect={setSelectedShift}
                  onCreateShift={handleCreateShift}
                  onEditShift={handleEditShift}
                  onDeleteShift={deleteShift}
                />
              </div>
            )}

            {activeTab === 'rest-days' && (
              <RestDayManager
                employees={SUPERVISOR_EMPLOYEES}
                shifts={shifts}
                restDays={restDays}
                weekDates={weekConfig.dates}
                compliance={compliance}
                recommendations={recommendations}
                onCreateRestDay={async (data) => { await createRestDay(data); }}
                onDeleteRestDay={async (id) => { await deleteRestDay(id); }}
                onAutoAssignRestDays={async () => { await autoAssignRestDays(); }}
                isLoading={restDayManagement.isLoading}
              />
            )}

            {activeTab === 'templates' && (
              <TemplateManager
                templates={templates}
                onCreateTemplate={handleCreateTemplate}
                onUpdateTemplate={handleUpdateTemplate}
                onDeleteTemplate={handleDeleteTemplate}
                employees={SUPERVISOR_EMPLOYEES}
                isLoading={false}
              />
            )}

            {activeTab === 'validation' && (
              <ValidationPanel
                validation={validation}
                employees={SUPERVISOR_EMPLOYEES}
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

            {activeTab === 'calendar' && (
              <EmployeesList
                employees={SUPERVISOR_EMPLOYEES}
                shifts={shifts}
                restDays={restDays}
                leaves={weeklyLeaves}
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
          employees={SUPERVISOR_EMPLOYEES}
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