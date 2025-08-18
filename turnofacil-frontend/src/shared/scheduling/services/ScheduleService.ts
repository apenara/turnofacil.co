/**
 * Servicio Principal de Scheduling
 * @fileoverview Servicio centralizado para todas las operaciones de scheduling
 */

import {
  ScheduleShift,
  Employee,
  ShiftTemplate,
  RestDay,
  LeaveRequest,
  Location,
  CreateShiftData,
  UpdateShiftData,
  CreateRestDayData,
  ScheduleMetrics,
  ValidationResult,
  SchedulingContext,
  ServiceResponse,
  ScheduleServiceConfig
} from '../core/types'
import { PermissionManager } from '../core/permissions'
import { ValidationService } from './ValidationService'
import { PERFORMANCE_CONFIG, DEV_CONFIG } from '../core/constants'

/**
 * Clase principal del servicio de scheduling
 */
export class ScheduleService {
  private permissionManager: PermissionManager
  private validationService: ValidationService
  private config: ScheduleServiceConfig
  private cache: Map<string, { data: any; timestamp: number }> = new Map()

  constructor(context: SchedulingContext, config: ScheduleServiceConfig = {}) {
    this.permissionManager = new PermissionManager(context)
    this.validationService = new ValidationService(context)
    this.config = {
      enableValidation: true,
      enablePermissions: true,
      cacheTimeout: 5 * 60 * 1000, // 5 minutos por defecto
      ...config
    }
  }

  // ========== GESTIÓN DE TURNOS ==========

  /**
   * Crea un nuevo turno
   */
  async createShift(data: CreateShiftData): Promise<ServiceResponse<ScheduleShift>> {
    try {
      // Verificar permisos
      if (this.config.enablePermissions) {
        const canCreate = this.permissionManager.canManageShift(data, 'create')
        if (!canCreate) {
          return { error: 'No tiene permisos para crear turnos en esta ubicación', status: 'error' }
        }
      }

      // Validar datos
      if (this.config.enableValidation) {
        const validation = await this.validationService.validateShiftData(data)
        if (!validation.isValid) {
          const criticalErrors = validation.errors.filter(e => e.severity === 'error')
          if (criticalErrors.length > 0) {
            return { 
              error: `Errores de validación: ${criticalErrors.map(e => e.message).join(', ')}`, 
              status: 'error' 
            }
          }
        }
      }

      // Simular creación (en producción sería una llamada API)
      const shift = await this.mockCreateShift(data)
      
      // Invalidar cache relacionado
      this.invalidateShiftCache()
      
      return { data: shift, status: 'success' }
    } catch (error) {
      return { 
        error: error instanceof Error ? error.message : 'Error creando turno', 
        status: 'error' 
      }
    }
  }

  /**
   * Actualiza un turno existente
   */
  async updateShift(data: UpdateShiftData): Promise<ServiceResponse<ScheduleShift>> {
    try {
      // Verificar permisos
      if (this.config.enablePermissions) {
        const canEdit = this.permissionManager.canManageShift(data, 'edit')
        if (!canEdit) {
          return { error: 'No tiene permisos para editar este turno', status: 'error' }
        }
      }

      // Validar datos
      if (this.config.enableValidation) {
        const validation = await this.validationService.validateShiftData(data)
        if (!validation.isValid) {
          const criticalErrors = validation.errors.filter(e => e.severity === 'error')
          if (criticalErrors.length > 0) {
            return { 
              error: `Errores de validación: ${criticalErrors.map(e => e.message).join(', ')}`, 
              status: 'error' 
            }
          }
        }
      }

      // Simular actualización
      const shift = await this.mockUpdateShift(data)
      
      // Invalidar cache
      this.invalidateShiftCache()
      
      return { data: shift, status: 'success' }
    } catch (error) {
      return { 
        error: error instanceof Error ? error.message : 'Error actualizando turno', 
        status: 'error' 
      }
    }
  }

  /**
   * Elimina un turno
   */
  async deleteShift(shiftId: string): Promise<ServiceResponse<void>> {
    try {
      // Verificar permisos (necesitaríamos obtener el turno primero)
      if (this.config.enablePermissions) {
        // En una implementación real, obtendríamos el turno de la base de datos
        // const shift = await this.getShift(shiftId)
        // const canDelete = this.permissionManager.canManageShift(shift, 'delete')
      }

      // Simular eliminación
      await this.mockDeleteShift(shiftId)
      
      // Invalidar cache
      this.invalidateShiftCache()
      
      return { status: 'success' }
    } catch (error) {
      return { 
        error: error instanceof Error ? error.message : 'Error eliminando turno', 
        status: 'error' 
      }
    }
  }

  /**
   * Obtiene turnos filtrados según permisos del usuario
   */
  async getShifts(filters?: {
    locationId?: string
    employeeId?: string
    startDate?: string
    endDate?: string
  }): Promise<ServiceResponse<ScheduleShift[]>> {
    try {
      const cacheKey = `shifts_${JSON.stringify(filters)}`
      const cached = this.getFromCache(cacheKey)
      if (cached) {
        return { data: cached, status: 'success' }
      }

      // Simular obtención de datos
      let shifts = await this.mockGetShifts(filters)
      
      // Filtrar según permisos
      if (this.config.enablePermissions) {
        shifts = this.filterShiftsByPermissions(shifts)
      }
      
      // Guardar en cache
      this.setCache(cacheKey, shifts, PERFORMANCE_CONFIG.CACHE_DURATION.shifts)
      
      return { data: shifts, status: 'success' }
    } catch (error) {
      return { 
        error: error instanceof Error ? error.message : 'Error obteniendo turnos', 
        status: 'error' 
      }
    }
  }

  // ========== GESTIÓN DE EMPLEADOS ==========

  /**
   * Obtiene empleados filtrados según permisos
   */
  async getEmployees(locationId?: string): Promise<ServiceResponse<Employee[]>> {
    try {
      const cacheKey = `employees_${locationId || 'all'}`
      const cached = this.getFromCache(cacheKey)
      if (cached) {
        return { data: cached, status: 'success' }
      }

      // Simular obtención de datos
      let employees = await this.mockGetEmployees(locationId)
      
      // Filtrar según permisos
      if (this.config.enablePermissions) {
        employees = this.filterEmployeesByPermissions(employees)
      }
      
      // Guardar en cache
      this.setCache(cacheKey, employees, PERFORMANCE_CONFIG.CACHE_DURATION.employees)
      
      return { data: employees, status: 'success' }
    } catch (error) {
      return { 
        error: error instanceof Error ? error.message : 'Error obteniendo empleados', 
        status: 'error' 
      }
    }
  }

  // ========== GESTIÓN DE PLANTILLAS ==========

  /**
   * Obtiene plantillas de turnos
   */
  async getTemplates(locationId?: string): Promise<ServiceResponse<ShiftTemplate[]>> {
    try {
      const cacheKey = `templates_${locationId || 'all'}`
      const cached = this.getFromCache(cacheKey)
      if (cached) {
        return { data: cached, status: 'success' }
      }

      // Simular obtención de datos
      const templates = await this.mockGetTemplates(locationId)
      
      // Guardar en cache
      this.setCache(cacheKey, templates, PERFORMANCE_CONFIG.CACHE_DURATION.templates)
      
      return { data: templates, status: 'success' }
    } catch (error) {
      return { 
        error: error instanceof Error ? error.message : 'Error obteniendo plantillas', 
        status: 'error' 
      }
    }
  }

  // ========== VALIDACIÓN ==========

  /**
   * Valida un horario completo
   */
  async validateSchedule(shifts: ScheduleShift[], employees: Employee[]): Promise<ServiceResponse<ValidationResult>> {
    try {
      const validation = await this.validationService.validateFullSchedule(shifts, employees)
      return { data: validation, status: 'success' }
    } catch (error) {
      return { 
        error: error instanceof Error ? error.message : 'Error validando horario', 
        status: 'error' 
      }
    }
  }

  // ========== MÉTRICAS ==========

  /**
   * Calcula métricas del horario
   */
  async calculateMetrics(shifts: ScheduleShift[], employees: Employee[], weeklyBudget: number): Promise<ServiceResponse<ScheduleMetrics>> {
    try {
      const metrics = await this.mockCalculateMetrics(shifts, employees, weeklyBudget)
      return { data: metrics, status: 'success' }
    } catch (error) {
      return { 
        error: error instanceof Error ? error.message : 'Error calculando métricas', 
        status: 'error' 
      }
    }
  }

  // ========== MÉTODOS PRIVADOS ==========

  /**
   * Filtra turnos según permisos del usuario
   */
  private filterShiftsByPermissions(shifts: ScheduleShift[]): ScheduleShift[] {
    return shifts.filter(shift => {
      return this.permissionManager.canAccessLocation(shift.locationId)
    })
  }

  /**
   * Filtra empleados según permisos del usuario
   */
  private filterEmployeesByPermissions(employees: Employee[]): Employee[] {
    let filteredEmployees = employees.filter(employee => {
      return this.permissionManager.canAccessLocation(employee.locationId)
    })

    // Aplicar límite de empleados visibles
    const maxEmployees = this.permissionManager.getRestrictions().maxEmployees
    if (maxEmployees !== 'unlimited') {
      filteredEmployees = filteredEmployees.slice(0, maxEmployees)
    }

    return filteredEmployees
  }

  // ========== GESTIÓN DE CACHE ==========

  private getFromCache(key: string): any | null {
    const cached = this.cache.get(key)
    if (!cached) return null

    const now = Date.now()
    if (now - cached.timestamp > (this.config.cacheTimeout || PERFORMANCE_CONFIG.CACHE_DURATION.shifts)) {
      this.cache.delete(key)
      return null
    }

    return cached.data
  }

  private setCache(key: string, data: any, duration: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    })

    // Limpiar cache automáticamente
    setTimeout(() => {
      this.cache.delete(key)
    }, duration)
  }

  private invalidateShiftCache(): void {
    const keys = Array.from(this.cache.keys()).filter(key => key.startsWith('shifts_'))
    keys.forEach(key => this.cache.delete(key))
  }

  // ========== MÉTODOS MOCK (EN PRODUCCIÓN SERÍAN LLAMADAS API) ==========

  private async mockCreateShift(data: CreateShiftData): Promise<ScheduleShift> {
    if (DEV_CONFIG.ENABLE_MOCK_DATA) {
      await this.mockDelay()
    }

    return {
      id: `shift_${Date.now()}`,
      ...data,
      duration: this.calculateDuration(data.startTime, data.endTime),
      type: data.type || 'regular',
      status: 'draft',
      cost: 0, // Se calcularía según las reglas de negocio
      crossesMidnight: this.crossesMidnight(data.startTime, data.endTime),
      metadata: {
        createdAt: new Date().toISOString(),
        createdBy: 'current-user-id'
      }
    }
  }

  private async mockUpdateShift(data: UpdateShiftData): Promise<ScheduleShift> {
    if (DEV_CONFIG.ENABLE_MOCK_DATA) {
      await this.mockDelay()
    }

    // En una implementación real, obtendríamos el turno existente y lo actualizaríamos
    return {
      id: data.id,
      employeeId: data.employeeId || '',
      employeeName: data.employeeName || '',
      position: data.position || '',
      locationId: data.locationId || '',
      date: data.date || '',
      startTime: data.startTime || '',
      endTime: data.endTime || '',
      duration: data.startTime && data.endTime ? this.calculateDuration(data.startTime, data.endTime) : 0,
      type: data.type || 'regular',
      status: 'draft',
      cost: 0,
      crossesMidnight: data.startTime && data.endTime ? this.crossesMidnight(data.startTime, data.endTime) : false,
      notes: data.notes,
      metadata: {
        updatedAt: new Date().toISOString(),
        updatedBy: 'current-user-id'
      }
    }
  }

  private async mockDeleteShift(shiftId: string): Promise<void> {
    if (DEV_CONFIG.ENABLE_MOCK_DATA) {
      await this.mockDelay()
    }
    // En una implementación real, eliminaríamos el turno de la base de datos
  }

  private async mockGetShifts(filters?: any): Promise<ScheduleShift[]> {
    if (DEV_CONFIG.ENABLE_MOCK_DATA) {
      await this.mockDelay()
    }
    // Retornar datos mock o hacer llamada API real
    return []
  }

  private async mockGetEmployees(locationId?: string): Promise<Employee[]> {
    if (DEV_CONFIG.ENABLE_MOCK_DATA) {
      await this.mockDelay()
    }
    // Retornar datos mock o hacer llamada API real
    return []
  }

  private async mockGetTemplates(locationId?: string): Promise<ShiftTemplate[]> {
    if (DEV_CONFIG.ENABLE_MOCK_DATA) {
      await this.mockDelay()
    }
    // Retornar datos mock o hacer llamada API real
    return []
  }

  private async mockCalculateMetrics(shifts: ScheduleShift[], employees: Employee[], weeklyBudget: number): Promise<ScheduleMetrics> {
    if (DEV_CONFIG.ENABLE_MOCK_DATA) {
      await this.mockDelay()
    }

    const weeklyHours = shifts.reduce((sum, shift) => sum + shift.duration, 0)
    const weeklyCost = shifts.reduce((sum, shift) => sum + shift.cost, 0)
    const employeeCount = new Set(shifts.map(shift => shift.employeeId)).size
    const budgetUtilization = weeklyBudget > 0 ? (weeklyCost / weeklyBudget) * 100 : 0

    let budgetStatus: 'success' | 'warning' | 'danger' = 'success'
    if (budgetUtilization > 100) {
      budgetStatus = 'danger'
    } else if (budgetUtilization > 85) {
      budgetStatus = 'warning'
    }

    return {
      weeklyHours,
      weeklyCost,
      employeeCount,
      budgetUtilization,
      budgetStatus
    }
  }

  private async mockDelay(): Promise<void> {
    return new Promise(resolve => {
      setTimeout(resolve, DEV_CONFIG.MOCK_DELAY)
    })
  }

  // ========== UTILIDADES ==========

  private calculateDuration(startTime: string, endTime: string): number {
    const start = this.timeToMinutes(startTime)
    let end = this.timeToMinutes(endTime)
    
    if (end < start) {
      end += 24 * 60 // Añadir 24 horas si cruza medianoche
    }
    
    return (end - start) / 60
  }

  private crossesMidnight(startTime: string, endTime: string): boolean {
    return this.timeToMinutes(endTime) <= this.timeToMinutes(startTime)
  }

  private timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number)
    return hours * 60 + minutes
  }
}