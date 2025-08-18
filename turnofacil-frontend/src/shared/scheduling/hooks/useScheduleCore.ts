/**
 * Hook Principal de Scheduling
 * @fileoverview Hook unificado para todas las operaciones de scheduling
 */

import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  ScheduleShift,
  Employee,
  ShiftTemplate,
  RestDay,
  LeaveRequest,
  Location,
  ScheduleMetrics,
  ValidationResult,
  CreateShiftData,
  UpdateShiftData,
  SchedulingContext,
  UseScheduleResult,
  ServiceResponse
} from '../core/types'
import { ScheduleService } from '../services/ScheduleService'
import { PermissionManager } from '../core/permissions'

/**
 * Estado interno del hook
 */
interface ScheduleState {
  shifts: ScheduleShift[]
  employees: Employee[]
  templates: ShiftTemplate[]
  restDays: RestDay[]
  leaves: LeaveRequest[]
  validation: ValidationResult
  metrics: ScheduleMetrics
  selectedShift: ScheduleShift | null
  isLoading: boolean
  lastUpdated: number
}

/**
 * Configuración del hook
 */
interface UseScheduleCoreOptions {
  context: SchedulingContext
  autoValidate?: boolean
  enableMetrics?: boolean
  refreshInterval?: number
}

/**
 * Hook principal para el sistema de scheduling
 */
export function useScheduleCore({
  context,
  autoValidate = true,
  enableMetrics = true,
  refreshInterval = 30000 // 30 segundos
}: UseScheduleCoreOptions): UseScheduleResult {
  
  // ========== SERVICIOS ==========
  
  const scheduleService = useMemo(() => 
    new ScheduleService(context)
  , [context])
  
  const permissionManager = useMemo(() => 
    new PermissionManager(context)
  , [context])

  // ========== ESTADO ==========
  
  const [state, setState] = useState<ScheduleState>({
    shifts: [],
    employees: [],
    templates: [],
    restDays: [],
    leaves: [],
    validation: {
      isValid: true,
      errors: [],
      warnings: [],
      summary: {
        totalErrors: 0,
        totalWarnings: 0,
        criticalErrors: 0,
        byType: {
          overtime: 0,
          availability: 0,
          overlap: 0,
          understaffed: 0,
          budget: 0,
          rest_day: 0,
          leave_conflict: 0,
          shift_gap: 0
        }
      }
    },
    metrics: {
      weeklyHours: 0,
      weeklyCost: 0,
      employeeCount: 0,
      budgetUtilization: 0,
      budgetStatus: 'success'
    },
    selectedShift: null,
    isLoading: false,
    lastUpdated: Date.now()
  })

  // ========== FUNCIONES DE CARGA DE DATOS ==========

  /**
   * Carga los datos iniciales
   */
  const loadInitialData = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true }))
    
    try {
      // Cargar datos en paralelo
      const [shiftsResponse, employeesResponse, templatesResponse] = await Promise.all([
        scheduleService.getShifts({
          startDate: context.week.startDate,
          endDate: context.week.endDate,
          locationId: context.location.current !== 'all' ? context.location.current : undefined
        }),
        scheduleService.getEmployees(
          context.location.current !== 'all' ? context.location.current : undefined
        ),
        scheduleService.getTemplates(
          context.location.current !== 'all' ? context.location.current : undefined
        )
      ])

      // Actualizar estado con los datos cargados
      setState(prev => ({
        ...prev,
        shifts: shiftsResponse.data || [],
        employees: employeesResponse.data || [],
        templates: templatesResponse.data || [],
        isLoading: false,
        lastUpdated: Date.now()
      }))

      // Auto-validar si está habilitado
      if (autoValidate && shiftsResponse.data && employeesResponse.data) {
        validateSchedule()
      }

    } catch (error) {
      console.error('Error loading initial data:', error)
      setState(prev => ({ ...prev, isLoading: false }))
    }
  }, [context, scheduleService, autoValidate])

  /**
   * Recalcula métricas
   */
  const calculateMetrics = useCallback(async () => {
    if (!enableMetrics) return

    try {
      const response = await scheduleService.calculateMetrics(
        state.shifts,
        state.employees,
        context.settings.budget.weeklyLimit
      )
      
      if (response.data) {
        setState(prev => ({
          ...prev,
          metrics: response.data!
        }))
      }
    } catch (error) {
      console.error('Error calculating metrics:', error)
    }
  }, [state.shifts, state.employees, context.settings.budget.weeklyLimit, scheduleService, enableMetrics])

  // ========== OPERACIONES CRUD ==========

  /**
   * Crea un nuevo turno
   */
  const createShift = useCallback(async (data: CreateShiftData): Promise<ScheduleShift> => {
    const response = await scheduleService.createShift(data)
    
    if (response.error) {
      throw new Error(response.error)
    }

    const newShift = response.data!
    
    setState(prev => ({
      ...prev,
      shifts: [...prev.shifts, newShift],
      lastUpdated: Date.now()
    }))

    // Re-validar y re-calcular métricas
    if (autoValidate) {
      setTimeout(validateSchedule, 100)
    }
    if (enableMetrics) {
      setTimeout(calculateMetrics, 200)
    }

    return newShift
  }, [scheduleService, autoValidate, enableMetrics])

  /**
   * Actualiza un turno existente
   */
  const updateShift = useCallback(async (data: UpdateShiftData): Promise<ScheduleShift> => {
    const response = await scheduleService.updateShift(data)
    
    if (response.error) {
      throw new Error(response.error)
    }

    const updatedShift = response.data!
    
    setState(prev => ({
      ...prev,
      shifts: prev.shifts.map(shift => 
        shift.id === data.id ? updatedShift : shift
      ),
      selectedShift: prev.selectedShift?.id === data.id ? updatedShift : prev.selectedShift,
      lastUpdated: Date.now()
    }))

    // Re-validar y re-calcular métricas
    if (autoValidate) {
      setTimeout(validateSchedule, 100)
    }
    if (enableMetrics) {
      setTimeout(calculateMetrics, 200)
    }

    return updatedShift
  }, [scheduleService, autoValidate, enableMetrics])

  /**
   * Elimina un turno
   */
  const deleteShift = useCallback(async (id: string): Promise<void> => {
    const response = await scheduleService.deleteShift(id)
    
    if (response.error) {
      throw new Error(response.error)
    }

    setState(prev => ({
      ...prev,
      shifts: prev.shifts.filter(shift => shift.id !== id),
      selectedShift: prev.selectedShift?.id === id ? null : prev.selectedShift,
      lastUpdated: Date.now()
    }))

    // Re-validar y re-calcular métricas
    if (autoValidate) {
      setTimeout(validateSchedule, 100)
    }
    if (enableMetrics) {
      setTimeout(calculateMetrics, 200)
    }
  }, [scheduleService, autoValidate, enableMetrics])

  /**
   * Valida el horario completo
   */
  const validateSchedule = useCallback(async (): Promise<ValidationResult> => {
    const response = await scheduleService.validateSchedule(state.shifts, state.employees)
    
    if (response.error) {
      console.error('Error validating schedule:', response.error)
      return state.validation
    }

    const validation = response.data!
    
    setState(prev => ({
      ...prev,
      validation
    }))

    return validation
  }, [state.shifts, state.employees, scheduleService])

  // ========== FUNCIONES DE UTILIDAD ==========

  /**
   * Verifica si el usuario puede realizar una acción
   */
  const canPerformAction = useCallback((action: string): boolean => {
    switch (action) {
      case 'create_shift':
        return permissionManager.can('canCreateShifts')
      case 'edit_shift':
        return permissionManager.can('canEditShifts')
      case 'delete_shift':
        return permissionManager.can('canDeleteShifts')
      case 'manage_employees':
        return permissionManager.can('canManageEmployees')
      case 'view_budget':
        return permissionManager.can('canViewBudgets')
      case 'approve_schedule':
        return permissionManager.can('canApproveSchedules')
      default:
        return false
    }
  }, [permissionManager])

  /**
   * Obtiene datos filtrados según permisos
   */
  const getFilteredData = useCallback(() => {
    const restrictions = permissionManager.getRestrictions()
    
    let filteredEmployees = state.employees
    let filteredShifts = state.shifts
    let filteredLocations = context.location.available

    // Filtrar por ubicaciones accesibles
    if (restrictions.locations !== 'all') {
      const allowedLocations = restrictions.locations as string[]
      
      filteredEmployees = state.employees.filter(emp => 
        allowedLocations.includes(emp.locationId)
      )
      
      filteredShifts = state.shifts.filter(shift => 
        allowedLocations.includes(shift.locationId)
      )
      
      filteredLocations = context.location.available.filter(loc => 
        allowedLocations.includes(loc.id)
      )
    }

    // Aplicar límite de empleados
    if (restrictions.maxEmployees !== 'unlimited') {
      filteredEmployees = filteredEmployees.slice(0, restrictions.maxEmployees)
    }

    return {
      employees: filteredEmployees,
      shifts: filteredShifts,
      locations: filteredLocations
    }
  }, [state.employees, state.shifts, context.location.available, permissionManager])

  /**
   * Establece el turno seleccionado
   */
  const setSelectedShift = useCallback((shift: ScheduleShift | null) => {
    setState(prev => ({
      ...prev,
      selectedShift: shift
    }))
  }, [])

  // ========== EFECTOS ==========

  /**
   * Cargar datos iniciales al montar o cambiar contexto
   */
  useEffect(() => {
    loadInitialData()
  }, [loadInitialData])

  /**
   * Refrescar datos periódicamente
   */
  useEffect(() => {
    if (!refreshInterval) return

    const interval = setInterval(() => {
      loadInitialData()
    }, refreshInterval)

    return () => clearInterval(interval)
  }, [refreshInterval, loadInitialData])

  /**
   * Calcular métricas cuando cambien los turnos
   */
  useEffect(() => {
    if (enableMetrics && state.shifts.length > 0) {
      calculateMetrics()
    }
  }, [state.shifts, state.employees, calculateMetrics, enableMetrics])

  // ========== RETORNO DEL HOOK ==========

  return {
    // Estado
    shifts: state.shifts,
    employees: state.employees,
    templates: state.templates,
    restDays: state.restDays,
    leaves: state.leaves,
    validation: state.validation,
    metrics: state.metrics,
    isLoading: state.isLoading,
    
    // Acciones CRUD
    createShift,
    updateShift,
    deleteShift,
    validateSchedule,
    
    // Estado de selección
    selectedShift: state.selectedShift,
    setSelectedShift,
    
    // Utilidades
    canPerformAction,
    getFilteredData
  }
}

/**
 * Hook simplificado para casos de solo lectura
 */
export function useScheduleViewer(context: SchedulingContext) {
  return useScheduleCore({
    context,
    autoValidate: false,
    enableMetrics: true,
    refreshInterval: 60000 // 1 minuto para solo lectura
  })
}

/**
 * Hook con validación estricta para administradores
 */
export function useScheduleAdmin(context: SchedulingContext) {
  return useScheduleCore({
    context,
    autoValidate: true,
    enableMetrics: true,
    refreshInterval: 15000 // 15 segundos para admins
  })
}