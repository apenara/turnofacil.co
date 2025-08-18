/**
 * Página del Creador de Horarios - Supervisor
 * @fileoverview Versión migrada usando el módulo compartido de scheduling
 */

'use client'

import React, { useState, useCallback, useMemo } from 'react'
import { useNotifications } from '@/components/shared/NotificationSystem'

// Importar del módulo compartido
import {
  UniversalScheduleCalendar,
  useScheduleCore,
  useEmployeeManagement,
  createSchedulingContext,
  SchedulingUtils,
  COLOMBIAN_LABOR_CONSTANTS,
  type SchedulingContext,
  type Location,
  type CreateShiftData,
  type UpdateShiftData
} from '@/shared/scheduling'

// Importar componentes locales que aún no hemos migrado
import {
  WeekSelector,
  TabNavigation,
  EmployeesList,
  ShiftCreationModal,
  RestDayManager,
  TemplateManager,
  ValidationPanel,
  WeekSummary,
  QuickActions,
  type TabType
} from './components'

// Hook de gestión de semanas (mantenemos local por ahora)
import { useWeekCalculations } from './hooks'

/**
 * Datos de ejemplo del restaurante
 */
const MOCK_LOCATION: Location = {
  id: 'loc-1',
  name: 'Restaurante Centro',
  address: 'Cra 7 #45-23, Bogotá',
  employeeCount: 6,
  activeShifts: 0,
  weeklyBudget: 8000000,
  weeklySpent: 0,
  status: 'active',
  metadata: {
    manager: 'Juan Pérez',
    phone: '+57 300 1234567',
    timezone: 'America/Bogota'
  }
}

/**
 * Datos del usuario supervisor
 */
const SUPERVISOR_USER = {
  id: 'user-1',
  name: 'María González',
  role: 'SUPERVISOR' as const,
  locationId: 'loc-1'
}

/**
 * Componente principal migrado al módulo compartido
 */
export default function SupervisorScheduleCreatorPage() {
  const { addNotification } = useNotifications()
  
  // Estado de la UI
  const [activeTab, setActiveTab] = useState<TabType>('calendar')
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('')
  const [shiftModalState, setShiftModalState] = useState<{
    isOpen: boolean
    shift?: any
    preselectedEmployeeId?: string
    preselectedDate?: string
    preselectedStartTime?: string
  }>({ isOpen: false })

  // Hook de gestión de semanas (local)
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
    return createSchedulingContext(
      SUPERVISOR_USER,
      weekConfig.startDate,
      [MOCK_LOCATION],
      {
        weeklyBudgetLimit: MOCK_LOCATION.weeklyBudget,
        alertThreshold: 85,
        maxWeeklyHours: COLOMBIAN_LABOR_CONSTANTS.REGULAR_HOURS_PER_WEEK,
        enforceValidation: true
      }
    )
  }, [weekConfig.startDate])

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
    context: schedulingContext,
    autoValidate: true,
    enableMetrics: true
  })

  const employeeManagement = useEmployeeManagement({
    context: schedulingContext,
    employees,
    shifts,
    restDays,
    leaves
  })

  // Datos filtrados según permisos
  const filteredData = useMemo(() => {
    return getFilteredData()
  }, [getFilteredData])

  // Opciones de semanas para el selector
  const weekOptions = useMemo(() => {
    return generateWeekOptions(12)
  }, [generateWeekOptions])

  // Manejadores de eventos del modal de turnos
  const handleCreateShift = useCallback((employeeId: string, date: string, startTime?: string) => {
    if (!canPerformAction('create_shift')) {
      addNotification({
        type: 'error',
        title: 'Sin Permisos',
        message: 'No tienes permisos para crear turnos'
      })
      return
    }

    setShiftModalState({
      isOpen: true,
      shift: null,
      preselectedEmployeeId: employeeId,
      preselectedDate: date,
      preselectedStartTime: startTime
    })
  }, [canPerformAction, addNotification])

  const handleEditShift = useCallback((shift: any) => {
    if (!canPerformAction('edit_shift')) {
      addNotification({
        type: 'error',
        title: 'Sin Permisos',
        message: 'No tienes permisos para editar turnos'
      })
      return
    }

    setShiftModalState({
      isOpen: true,
      shift
    })
  }, [canPerformAction, addNotification])

  const handleCloseShiftModal = useCallback(() => {
    setShiftModalState({ isOpen: false })
  }, [])

  // Manejador de creación de turno desde el calendario
  const handleShiftCreate = useCallback(async (data: CreateShiftData) => {
    try {
      await createShift(data)
      addNotification({
        type: 'success',
        title: 'Turno Creado',
        message: 'El turno se ha creado correctamente'
      })
      handleCloseShiftModal()
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Error',
        message: error instanceof Error ? error.message : 'Error al crear el turno'
      })
    }
  }, [createShift, addNotification, handleCloseShiftModal])

  // Manejador de actualización de turno
  const handleShiftUpdate = useCallback(async (data: UpdateShiftData) => {
    try {
      await updateShift(data)
      addNotification({
        type: 'success',
        title: 'Turno Actualizado',
        message: 'El turno se ha actualizado correctamente'
      })
      handleCloseShiftModal()
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Error',
        message: error instanceof Error ? error.message : 'Error al actualizar el turno'
      })
    }
  }, [updateShift, addNotification, handleCloseShiftModal])

  // Manejador de eliminación de turno
  const handleShiftDelete = useCallback(async (id: string) => {
    if (!canPerformAction('delete_shift')) {
      addNotification({
        type: 'error',
        title: 'Sin Permisos',
        message: 'No tienes permisos para eliminar turnos'
      })
      return
    }

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
  }, [deleteShift, canPerformAction, addNotification])

  // Manejadores de acciones rápidas
  const handleSave = useCallback(async () => {
    try {
      // Aquí se implementaría la lógica de guardado real
      await new Promise(resolve => setTimeout(resolve, 1000))
      addNotification({
        type: 'success',
        title: 'Horario Guardado',
        message: 'El horario se ha guardado correctamente'
      })
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Error al Guardar',
        message: 'No se pudo guardar el horario'
      })
    }
  }, [addNotification])

  const handleValidate = useCallback(async () => {
    try {
      const result = await validateSchedule()
      if (result.isValid) {
        addNotification({
          type: 'success',
          title: 'Validación Exitosa',
          message: 'El horario cumple con todas las validaciones'
        })
      } else {
        addNotification({
          type: 'warning',
          title: 'Errores de Validación',
          message: `Se encontraron ${result.summary.totalErrors} errores y ${result.summary.totalWarnings} advertencias`
        })
      }
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Error en Validación',
        message: 'No se pudo completar la validación'
      })
    }
  }, [validateSchedule, addNotification])

  const handleConfirmAll = useCallback(async () => {
    try {
      // Cambiar estado de todos los turnos a confirmados
      const updatePromises = shifts
        .filter(shift => shift.status === 'draft')
        .map(shift => updateShift({ ...shift, status: 'confirmed' }))
      
      await Promise.all(updatePromises)
      
      addNotification({
        type: 'success',
        title: 'Turnos Confirmados',
        message: `Se confirmaron ${updatePromises.length} turnos`
      })
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'No se pudieron confirmar todos los turnos'
      })
    }
  }, [shifts, updateShift, addNotification])

  const handleClearAll = useCallback(async () => {
    if (!confirm('¿Estás seguro de eliminar todos los turnos?')) return
    
    try {
      const deletePromises = shifts.map(shift => deleteShift(shift.id))
      await Promise.all(deletePromises)
      
      addNotification({
        type: 'success',
        title: 'Turnos Eliminados',
        message: 'Se eliminaron todos los turnos'
      })
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'No se pudieron eliminar todos los turnos'
      })
    }
  }, [shifts, deleteShift, addNotification])

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
            isLoading={isLoading}
          />
        </div>

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
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3">
            {activeTab === 'calendar' && (
              <div className="space-y-6">
                {/* Usar el calendario universal del módulo compartido */}
                <UniversalScheduleCalendar
                  context={schedulingContext}
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
                    budgetRemaining: MOCK_LOCATION.weeklyBudget - metrics.weeklyCost,
                    dailySummary: [],
                    employeeSummary: [],
                    specialDays: []
                  }}
                  weeklyBudget={MOCK_LOCATION.weeklyBudget}
                  showComparison={false}
                  showCharts={true}
                />
              </div>
            )}

            {activeTab === 'employees' && (
              <EmployeesList
                employees={filteredData.employees}
                shifts={shifts}
                restDays={restDays}
                leaves={leaves}
                selectedEmployeeId={selectedEmployeeId}
                onEmployeeSelect={setSelectedEmployeeId}
                onCreateShift={handleCreateShift}
                onAssignRestDay={(employeeId) => {
                  setSelectedEmployeeId(employeeId)
                  setActiveTab('rest-days')
                }}
                showDetails={true}
              />
            )}

            {activeTab === 'rest-days' && (
              <RestDayManager
                employees={filteredData.employees}
                shifts={shifts}
                restDays={restDays}
                weekDates={weekConfig.dates}
                compliance={{}}
                recommendations={employeeManagement.suggestRestDay(selectedEmployeeId)}
                onCreateRestDay={async (data) => {
                  // Implementar creación de día de descanso
                  addNotification({
                    type: 'success',
                    title: 'Día de Descanso Asignado',
                    message: 'Se asignó el día de descanso correctamente'
                  })
                }}
                onDeleteRestDay={async (id) => {
                  // Implementar eliminación de día de descanso
                  addNotification({
                    type: 'success',
                    title: 'Día de Descanso Eliminado',
                    message: 'Se eliminó el día de descanso'
                  })
                }}
                onAutoAssignRestDays={async () => {
                  // Implementar asignación automática
                  addNotification({
                    type: 'info',
                    title: 'Asignación Automática',
                    message: 'Se asignaron días de descanso automáticamente'
                  })
                }}
                isLoading={isLoading}
              />
            )}

            {activeTab === 'templates' && (
              <TemplateManager
                templates={templates}
                onCreateTemplate={async (templateData) => {
                  // Implementar creación de plantilla
                  addNotification({
                    type: 'success',
                    title: 'Plantilla Creada',
                    message: `La plantilla "${templateData.name}" se ha creado`
                  })
                }}
                onUpdateTemplate={async (id, templateData) => {
                  // Implementar actualización de plantilla
                  addNotification({
                    type: 'success',
                    title: 'Plantilla Actualizada',
                    message: 'La plantilla se ha actualizado'
                  })
                }}
                onDeleteTemplate={async (id) => {
                  // Implementar eliminación de plantilla
                  addNotification({
                    type: 'success',
                    title: 'Plantilla Eliminada',
                    message: 'La plantilla se ha eliminado'
                  })
                }}
                employees={filteredData.employees}
                isLoading={isLoading}
              />
            )}

            {activeTab === 'validation' && (
              <ValidationPanel
                validation={validation}
                employees={filteredData.employees}
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
              onConfirmAll={handleConfirmAll}
              onClearAll={handleClearAll}
              onValidate={handleValidate}
              isValid={validation.isValid}
              errorCount={validation.summary.totalErrors}
              hasUnsavedChanges={shifts.length > 0}
              isLoading={isLoading}
              compact={false}
            />

            {activeTab === 'calendar' && (
              <EmployeesList
                employees={filteredData.employees}
                shifts={shifts}
                restDays={restDays}
                leaves={leaves}
                selectedEmployeeId={selectedEmployeeId}
                onEmployeeSelect={(id) => {
                  setSelectedEmployeeId(id)
                  employeeManagement.selectEmployee(
                    filteredData.employees.find(e => e.id === id) || null
                  )
                }}
                onCreateShift={handleCreateShift}
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
          employees={filteredData.employees}
          templates={templates}
          onCreateShift={handleShiftCreate}
          onUpdateShift={handleShiftUpdate}
          preselectedEmployeeId={shiftModalState.preselectedEmployeeId}
          preselectedDate={shiftModalState.preselectedDate}
          preselectedStartTime={shiftModalState.preselectedStartTime}
          isSaving={isLoading}
        />
      </div>
    </div>
  )
}