/**
 * Servicio Principal de Requests
 * @fileoverview Servicio centralizado para todas las operaciones de requests
 */

import {
  TeamRequest,
  Employee,
  Location,
  CreateRequestData,
  UpdateRequestData,
  RequestMetrics,
  RequestAnalytics,
  RequestFilters,
  RequestContext,
  ServiceResponse,
  RequestServiceConfig,
  RequestType,
  RequestStatus,
  RequestPermissions
} from '../core/types'
import { RequestPermissionManager } from '../core/permissions'
import { REQUEST_CONFIG, VALIDATION_RULES, UI_MESSAGES } from '../core/constants'

/**
 * Clase principal del servicio de requests
 */
export class RequestService {
  private permissionManager: RequestPermissionManager
  private config: RequestServiceConfig
  private cache: Map<string, { data: any; timestamp: number }> = new Map()
  private context: RequestContext

  constructor(context: RequestContext, config: RequestServiceConfig = {}) {
    this.context = context
    this.permissionManager = new RequestPermissionManager(context)
    this.config = {
      enableValidation: true,
      enablePermissions: true,
      enableAnalytics: true,
      cacheTimeout: 5 * 60 * 1000, // 5 minutos por defecto
      ...config
    }
  }

  // ========== OPERACIONES CRUD ==========

  /**
   * Crea una nueva request
   */
  async createRequest(data: CreateRequestData): Promise<ServiceResponse<TeamRequest>> {
    try {
      // Verificar permisos
      if (this.config.enablePermissions) {
        if (!this.permissionManager.can('canCreateRequest')) {
          return { 
            error: UI_MESSAGES.error.INSUFFICIENT_PERMISSIONS, 
            status: 'error' 
          }
        }

        if (!this.permissionManager.canCreateRequestType(data.type)) {
          return { 
            error: `No tienes permisos para crear requests de tipo ${data.type}`, 
            status: 'error' 
          }
        }
      }

      // Validar datos
      if (this.config.enableValidation) {
        const validation = this.validateRequestData(data)
        if (!validation.isValid) {
          return { 
            error: validation.error || UI_MESSAGES.error.VALIDATION_FAILED, 
            status: 'error' 
          }
        }
      }

      // Verificar límites mensuales
      const monthlyLimit = this.permissionManager.getMonthlyRequestLimit()
      if (monthlyLimit) {
        const currentMonthRequests = await this.getUserRequestCountForCurrentMonth()
        if (currentMonthRequests >= monthlyLimit) {
          return { 
            error: VALIDATION_RULES.errorMessages.EXCEEDS_MONTHLY_LIMIT, 
            status: 'error' 
          }
        }
      }

      // Crear la request
      const request = await this.buildRequestFromData(data)
      
      // Simular creación (en producción sería una llamada API)
      const createdRequest = await this.mockCreateRequest(request)
      
      // Invalidar cache
      this.invalidateCache(['requests', 'metrics'])
      
      return { data: createdRequest, status: 'success' }

    } catch (error) {
      return { 
        error: error instanceof Error ? error.message : UI_MESSAGES.error.SERVER_ERROR, 
        status: 'error' 
      }
    }
  }

  /**
   * Actualiza una request existente
   */
  async updateRequest(data: UpdateRequestData): Promise<ServiceResponse<TeamRequest>> {
    try {
      // Obtener la request existente
      const existingRequest = await this.getRequestById(data.id)
      if (!existingRequest.data) {
        return { 
          error: UI_MESSAGES.error.REQUEST_NOT_FOUND, 
          status: 'error' 
        }
      }

      // Verificar permisos
      if (this.config.enablePermissions) {
        const canEdit = this.permissionManager.canManageRequest(
          existingRequest.data, 
          'edit'
        )
        if (!canEdit) {
          return { 
            error: UI_MESSAGES.error.INSUFFICIENT_PERMISSIONS, 
            status: 'error' 
          }
        }
      }

      // Validar que se puede editar
      if (!this.canEditRequest(existingRequest.data)) {
        return { 
          error: 'No se puede editar una request en este estado', 
          status: 'error' 
        }
      }

      // Simular actualización
      const updatedRequest = await this.mockUpdateRequest(data, existingRequest.data)
      
      // Invalidar cache
      this.invalidateCache(['requests', 'metrics'])
      
      return { data: updatedRequest, status: 'success' }

    } catch (error) {
      return { 
        error: error instanceof Error ? error.message : UI_MESSAGES.error.SERVER_ERROR, 
        status: 'error' 
      }
    }
  }

  /**
   * Elimina una request
   */
  async deleteRequest(id: string): Promise<ServiceResponse<void>> {
    try {
      // Obtener la request existente
      const existingRequest = await this.getRequestById(id)
      if (!existingRequest.data) {
        return { 
          error: UI_MESSAGES.error.REQUEST_NOT_FOUND, 
          status: 'error' 
        }
      }

      // Verificar permisos
      if (this.config.enablePermissions) {
        const canDelete = this.permissionManager.canManageRequest(
          existingRequest.data, 
          'delete'
        )
        if (!canDelete) {
          return { 
            error: UI_MESSAGES.error.INSUFFICIENT_PERMISSIONS, 
            status: 'error' 
          }
        }
      }

      // Simular eliminación
      await this.mockDeleteRequest(id)
      
      // Invalidar cache
      this.invalidateCache(['requests', 'metrics'])
      
      return { status: 'success' }

    } catch (error) {
      return { 
        error: error instanceof Error ? error.message : UI_MESSAGES.error.SERVER_ERROR, 
        status: 'error' 
      }
    }
  }

  /**
   * Obtiene requests filtradas según permisos del usuario
   */
  async getRequests(filters?: Partial<RequestFilters>): Promise<ServiceResponse<TeamRequest[]>> {
    try {
      const cacheKey = `requests_${JSON.stringify(filters)}_${this.context.user.id}`
      const cached = this.getFromCache(cacheKey)
      if (cached) {
        return { data: cached, status: 'success' }
      }

      // Simular obtención de datos
      let requests = await this.mockGetRequests(filters)
      
      // Filtrar según permisos
      if (this.config.enablePermissions) {
        requests = this.permissionManager.filterRequestsByPermissions(requests)
      }

      // Aplicar filtros adicionales
      if (filters) {
        requests = this.applyFilters(requests, filters)
      }
      
      // Guardar en cache
      this.setCache(cacheKey, requests, this.config.cacheTimeout || 300000)
      
      return { 
        data: requests, 
        status: 'success',
        metadata: {
          total: requests.length,
          hasMore: false
        }
      }

    } catch (error) {
      return { 
        error: error instanceof Error ? error.message : UI_MESSAGES.error.SERVER_ERROR, 
        status: 'error' 
      }
    }
  }

  /**
   * Obtiene una request por ID
   */
  async getRequestById(id: string): Promise<ServiceResponse<TeamRequest>> {
    try {
      const cacheKey = `request_${id}`
      const cached = this.getFromCache(cacheKey)
      if (cached) {
        return { data: cached, status: 'success' }
      }

      // Simular obtención de datos
      const request = await this.mockGetRequestById(id)
      if (!request) {
        return { 
          error: UI_MESSAGES.error.REQUEST_NOT_FOUND, 
          status: 'error' 
        }
      }

      // Verificar permisos para ver esta request
      if (this.config.enablePermissions) {
        const canView = this.permissionManager.canManageRequest(request, 'view')
        if (!canView) {
          return { 
            error: UI_MESSAGES.error.INSUFFICIENT_PERMISSIONS, 
            status: 'error' 
          }
        }
      }
      
      // Guardar en cache
      this.setCache(cacheKey, request, this.config.cacheTimeout || 300000)
      
      return { data: request, status: 'success' }

    } catch (error) {
      return { 
        error: error instanceof Error ? error.message : UI_MESSAGES.error.SERVER_ERROR, 
        status: 'error' 
      }
    }
  }

  // ========== MÉTRICAS Y ANALYTICS ==========

  /**
   * Calcula métricas de requests
   */
  async getMetrics(): Promise<ServiceResponse<RequestMetrics>> {
    try {
      const cacheKey = `metrics_${this.context.user.id}_${this.context.location.current}`
      const cached = this.getFromCache(cacheKey)
      if (cached) {
        return { data: cached, status: 'success' }
      }

      // Obtener requests para calcular métricas
      const requestsResponse = await this.getRequests()
      if (requestsResponse.status === 'error') {
        return requestsResponse as ServiceResponse<RequestMetrics>
      }

      const requests = requestsResponse.data || []
      const metrics = this.calculateMetrics(requests)
      
      // Guardar en cache
      this.setCache(cacheKey, metrics, this.config.cacheTimeout || 300000)
      
      return { data: metrics, status: 'success' }

    } catch (error) {
      return { 
        error: error instanceof Error ? error.message : UI_MESSAGES.error.SERVER_ERROR, 
        status: 'error' 
      }
    }
  }

  /**
   * Obtiene analytics avanzado (solo para roles con permisos)
   */
  async getAnalytics(period: 'week' | 'month' | 'quarter' = 'month'): Promise<ServiceResponse<RequestAnalytics>> {
    try {
      if (!this.permissionManager.can('canViewRequestAnalytics')) {
        return { 
          error: UI_MESSAGES.error.INSUFFICIENT_PERMISSIONS, 
          status: 'error' 
        }
      }

      const cacheKey = `analytics_${period}_${this.context.user.id}`
      const cached = this.getFromCache(cacheKey)
      if (cached) {
        return { data: cached, status: 'success' }
      }

      // Simular obtención de analytics
      const analytics = await this.mockGetAnalytics(period)
      
      // Guardar en cache (cache más largo para analytics)
      this.setCache(cacheKey, analytics, 600000) // 10 minutos
      
      return { data: analytics, status: 'success' }

    } catch (error) {
      return { 
        error: error instanceof Error ? error.message : UI_MESSAGES.error.SERVER_ERROR, 
        status: 'error' 
      }
    }
  }

  // ========== MÉTODOS PRIVADOS ==========

  /**
   * Valida los datos de una request
   */
  private validateRequestData(data: CreateRequestData): { isValid: boolean; error?: string } {
    // Validar campos requeridos
    if (!data.type || !data.reason) {
      return { isValid: false, error: VALIDATION_RULES.errorMessages.MISSING_REQUIRED_FIELD }
    }

    // Validar longitudes
    if (data.reason.length > REQUEST_CONFIG.MAX_REASON_LENGTH) {
      return { isValid: false, error: 'El motivo es demasiado largo' }
    }

    if (data.description && data.description.length > REQUEST_CONFIG.MAX_DESCRIPTION_LENGTH) {
      return { isValid: false, error: 'La descripción es demasiado larga' }
    }

    // Validar fechas
    if (data.startDate && data.endDate) {
      const start = new Date(data.startDate)
      const end = new Date(data.endDate)
      if (start > end) {
        return { isValid: false, error: VALIDATION_RULES.errorMessages.INVALID_DATE_RANGE }
      }
    }

    // Validar archivos adjuntos
    if (data.attachments && data.attachments.length > 0) {
      if (data.attachments.length > REQUEST_CONFIG.MAX_ATTACHMENTS_PER_REQUEST) {
        return { isValid: false, error: 'Demasiados archivos adjuntos' }
      }

      for (const file of data.attachments) {
        if (file.size > REQUEST_CONFIG.MAX_ATTACHMENT_SIZE_MB * 1024 * 1024) {
          return { isValid: false, error: VALIDATION_RULES.errorMessages.FILE_TOO_LARGE }
        }

        if (!REQUEST_CONFIG.ALLOWED_FILE_TYPES.includes(file.type)) {
          return { isValid: false, error: VALIDATION_RULES.errorMessages.INVALID_FILE_TYPE }
        }
      }
    }

    return { isValid: true }
  }

  /**
   * Construye una request completa desde los datos de entrada
   */
  private async buildRequestFromData(data: CreateRequestData): Promise<TeamRequest> {
    const now = new Date().toISOString()
    const requestId = this.generateId('req')

    // Construir request base
    const baseRequest: TeamRequest = {
      id: requestId,
      employeeId: this.context.user.id,
      employeeName: this.context.user.name,
      employeeEmail: this.context.user.email,
      employeePosition: '', // Se obtendría de la base de datos
      locationId: this.context.user.locationId || '',
      locationName: '', // Se obtendría de la base de datos

      type: data.type,
      status: 'pending',
      priority: data.priority || 'medium',

      submittedDate: now,
      requestedDate: data.requestedDate,
      startDate: data.startDate,
      endDate: data.endDate,

      reason: data.reason,
      description: data.description,
      attachments: [], // Los archivos se procesarían separadamente

      details: data.details || {},
      
      approvalFlow: {
        currentStage: 'supervisor',
        isEscalated: false,
        requiresFinalApproval: this.requiresFinalApproval(data.type),
        
        approvalHistory: [],
        
        flowConfig: {
          requiresSupervisorApproval: this.requiresSupervisorApproval(data.type),
          requiresBusinessAdminApproval: this.requiresBusinessAdminApproval(data.type)
        }
      },

      metadata: {
        createdAt: now,
        version: 1
      }
    }

    return baseRequest
  }

  /**
   * Verifica si una request se puede editar
   */
  private canEditRequest(request: TeamRequest): boolean {
    return ['draft', 'pending'].includes(request.status)
  }

  /**
   * Determina si un tipo de request requiere aprobación final
   */
  private requiresFinalApproval(type: RequestType): boolean {
    const typesRequiringFinalApproval: RequestType[] = [
      'vacation', 
      'overtime'
    ]
    return typesRequiringFinalApproval.includes(type)
  }

  /**
   * Determina si un tipo de request requiere aprobación de supervisor
   */
  private requiresSupervisorApproval(type: RequestType): boolean {
    const typesNotRequiringSupervisor: RequestType[] = [
      'absence', 
      'late_arrival'
    ]
    return !typesNotRequiringSupervisor.includes(type)
  }

  /**
   * Determina si un tipo de request requiere aprobación de business admin
   */
  private requiresBusinessAdminApproval(type: RequestType): boolean {
    const typesRequiringBusinessAdmin: RequestType[] = [
      'vacation', 
      'overtime'
    ]
    return typesRequiringBusinessAdmin.includes(type)
  }

  /**
   * Aplica filtros a las requests
   */
  private applyFilters(requests: TeamRequest[], filters: Partial<RequestFilters>): TeamRequest[] {
    let filtered = [...requests]

    if (filters.status && filters.status !== 'all') {
      const statuses = Array.isArray(filters.status) ? filters.status : [filters.status]
      filtered = filtered.filter(r => statuses.includes(r.status))
    }

    if (filters.type && filters.type !== 'all') {
      const types = Array.isArray(filters.type) ? filters.type : [filters.type]
      filtered = filtered.filter(r => types.includes(r.type))
    }

    if (filters.priority && filters.priority !== 'all') {
      const priorities = Array.isArray(filters.priority) ? filters.priority : [filters.priority]
      filtered = filtered.filter(r => priorities.includes(r.priority))
    }

    if (filters.searchTerm) {
      const term = filters.searchTerm.toLowerCase()
      filtered = filtered.filter(r => 
        r.employeeName.toLowerCase().includes(term) ||
        r.reason.toLowerCase().includes(term) ||
        r.description?.toLowerCase().includes(term)
      )
    }

    if (filters.dateRange?.start || filters.dateRange?.end) {
      filtered = filtered.filter(r => {
        const requestDate = new Date(r.submittedDate)
        if (filters.dateRange?.start && requestDate < new Date(filters.dateRange.start)) {
          return false
        }
        if (filters.dateRange?.end && requestDate > new Date(filters.dateRange.end)) {
          return false
        }
        return true
      })
    }

    // Ordenar
    if (filters.sortBy) {
      filtered.sort((a, b) => {
        let aValue: any, bValue: any
        
        switch (filters.sortBy) {
          case 'date':
            aValue = new Date(a.submittedDate)
            bValue = new Date(b.submittedDate)
            break
          case 'employee':
            aValue = a.employeeName
            bValue = b.employeeName
            break
          case 'priority':
            const priorityOrder = { emergency: 5, urgent: 4, high: 3, medium: 2, low: 1 }
            aValue = priorityOrder[a.priority] || 0
            bValue = priorityOrder[b.priority] || 0
            break
          case 'status':
            aValue = a.status
            bValue = b.status
            break
          case 'type':
            aValue = a.type
            bValue = b.type
            break
          default:
            return 0
        }

        if (aValue < bValue) return filters.sortOrder === 'desc' ? 1 : -1
        if (aValue > bValue) return filters.sortOrder === 'desc' ? -1 : 1
        return 0
      })
    }

    return filtered
  }

  /**
   * Calcula métricas basadas en las requests
   */
  private calculateMetrics(requests: TeamRequest[]): RequestMetrics {
    const total = requests.length
    const pending = requests.filter(r => r.status === 'pending').length
    const approved = requests.filter(r => r.status === 'approved').length
    const rejected = requests.filter(r => r.status === 'rejected').length

    // Calcular métricas por tipo
    const byType = requests.reduce((acc, request) => {
      acc[request.type] = (acc[request.type] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // Calcular métricas por prioridad
    const byPriority = requests.reduce((acc, request) => {
      acc[request.priority] = (acc[request.priority] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // Calcular tiempo promedio de aprobación
    const approvedRequests = requests.filter(r => r.status === 'approved')
    const totalApprovalTime = approvedRequests.reduce((sum, request) => {
      const submitted = new Date(request.submittedDate)
      const lastApproval = request.approvalFlow.approvalHistory
        .sort((a, b) => new Date(b.reviewedAt).getTime() - new Date(a.reviewedAt).getTime())[0]
      
      if (lastApproval) {
        const approved = new Date(lastApproval.reviewedAt)
        return sum + (approved.getTime() - submitted.getTime())
      }
      return sum
    }, 0)

    const averageApprovalTime = approvedRequests.length > 0 
      ? totalApprovalTime / approvedRequests.length / (1000 * 60 * 60) // en horas
      : 0

    return {
      totalRequests: total,
      pendingRequests: pending,
      approvedRequests: approved,
      rejectedRequests: rejected,
      
      requestsThisWeek: this.getRequestsThisWeek(requests),
      requestsThisMonth: this.getRequestsThisMonth(requests),
      averageApprovalTime,
      
      requestsByType: byType as any,
      requestsByPriority: byPriority as any,
      
      requestsByStage: this.getRequestsByStage(requests),
      escalationRate: this.getEscalationRate(requests),
      
      approvalRate: total > 0 ? (approved / total) * 100 : 0,
      rejectionRate: total > 0 ? (rejected / total) * 100 : 0,
      cancellationRate: this.getCancellationRate(requests)
    }
  }

  // ========== MÉTODOS DE UTILIDAD ==========

  private generateId(prefix: string): string {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private getRequestsThisWeek(requests: TeamRequest[]): number {
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)
    return requests.filter(r => new Date(r.submittedDate) > weekAgo).length
  }

  private getRequestsThisMonth(requests: TeamRequest[]): number {
    const monthAgo = new Date()
    monthAgo.setMonth(monthAgo.getMonth() - 1)
    return requests.filter(r => new Date(r.submittedDate) > monthAgo).length
  }

  private getRequestsByStage(requests: TeamRequest[]): Record<string, number> {
    return requests.reduce((acc, request) => {
      const stage = request.approvalFlow.currentStage
      acc[stage] = (acc[stage] || 0) + 1
      return acc
    }, {} as Record<string, number>)
  }

  private getEscalationRate(requests: TeamRequest[]): number {
    const escalated = requests.filter(r => r.approvalFlow.isEscalated).length
    return requests.length > 0 ? (escalated / requests.length) * 100 : 0
  }

  private getCancellationRate(requests: TeamRequest[]): number {
    const cancelled = requests.filter(r => r.status === 'cancelled').length
    return requests.length > 0 ? (cancelled / requests.length) * 100 : 0
  }

  private async getUserRequestCountForCurrentMonth(): Promise<number> {
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)
    
    const requests = await this.mockGetUserRequests(this.context.user.id, startOfMonth)
    return requests.length
  }

  // ========== GESTIÓN DE CACHE ==========

  private getFromCache(key: string): any | null {
    const cached = this.cache.get(key)
    if (!cached) return null

    const now = Date.now()
    if (now - cached.timestamp > (this.config.cacheTimeout || 300000)) {
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

  private invalidateCache(patterns: string[]): void {
    patterns.forEach(pattern => {
      const keys = Array.from(this.cache.keys()).filter(key => key.includes(pattern))
      keys.forEach(key => this.cache.delete(key))
    })
  }

  // ========== MÉTODOS MOCK (EN PRODUCCIÓN SERÍAN LLAMADAS API) ==========

  private async mockCreateRequest(request: TeamRequest): Promise<TeamRequest> {
    await this.delay(200)
    return request
  }

  private async mockUpdateRequest(data: UpdateRequestData, existing: TeamRequest): Promise<TeamRequest> {
    await this.delay(150)
    return {
      ...existing,
      ...data,
      metadata: {
        ...existing.metadata,
        updatedAt: new Date().toISOString(),
        version: (existing.metadata?.version || 1) + 1
      }
    }
  }

  private async mockDeleteRequest(id: string): Promise<void> {
    await this.delay(100)
  }

  private async mockGetRequests(filters?: any): Promise<TeamRequest[]> {
    await this.delay(300)
    return [] // En producción retornaría datos reales
  }

  private async mockGetRequestById(id: string): Promise<TeamRequest | null> {
    await this.delay(100)
    return null // En producción retornaría la request real
  }

  private async mockGetAnalytics(period: string): Promise<RequestAnalytics> {
    await this.delay(500)
    return {
      trends: {
        weeklyTrends: [],
        monthlyTrends: [],
        seasonalPatterns: []
      },
      employeeAnalytics: [],
      locationAnalytics: []
    }
  }

  private async mockGetUserRequests(userId: string, since: Date): Promise<TeamRequest[]> {
    await this.delay(100)
    return []
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}