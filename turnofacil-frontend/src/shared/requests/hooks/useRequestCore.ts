/**
 * Hook Principal de Requests
 * @fileoverview Hook unificado para todas las operaciones de requests
 */

import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  TeamRequest,
  Employee,
  Location,
  RequestMetrics,
  RequestAnalytics,
  CreateRequestData,
  UpdateRequestData,
  RequestContext,
  RequestFilters,
  UseRequestsResult,
  ServiceResponse,
  RequestType,
  RequestStatus,
  RequestPriority
} from '../core/types'
import { RequestService } from '../services/RequestService'
import { ApprovalService } from '../services/ApprovalService'
import { RequestPermissionManager } from '../core/permissions'

/**
 * Estado interno del hook
 */
interface RequestState {
  requests: TeamRequest[]
  selectedRequest: TeamRequest | null
  metrics: RequestMetrics
  analytics: RequestAnalytics | null
  isLoading: boolean
  error: string | null
  lastUpdated: number
}

/**
 * Configuración del hook
 */
interface UseRequestCoreOptions {
  context: RequestContext
  autoRefresh?: boolean
  refreshInterval?: number
  enableAnalytics?: boolean
  enableMetrics?: boolean
  initialFilters?: Partial<RequestFilters>
}

/**
 * Hook principal para el sistema de requests
 */
export function useRequestCore({
  context,
  autoRefresh = true,
  refreshInterval = 30000, // 30 segundos
  enableAnalytics = true,
  enableMetrics = true,
  initialFilters = {}
}: UseRequestCoreOptions): UseRequestsResult {
  
  // ========== SERVICIOS ==========
  
  const requestService = useMemo(() => 
    new RequestService(context)
  , [context])
  
  const approvalService = useMemo(() => 
    new ApprovalService(context)
  , [context])
  
  const permissionManager = useMemo(() => 
    new RequestPermissionManager(context)
  , [context])

  // ========== ESTADO ==========
  
  const [state, setState] = useState<RequestState>({
    requests: [],
    selectedRequest: null,
    metrics: {
      totalRequests: 0,
      pendingRequests: 0,
      approvedRequests: 0,
      rejectedRequests: 0,
      requestsThisWeek: 0,
      requestsThisMonth: 0,
      averageApprovalTime: 0,
      requestsByType: {} as any,
      requestsByPriority: {} as any,
      requestsByStage: {} as any,
      escalationRate: 0,
      approvalRate: 0,
      rejectionRate: 0,
      cancellationRate: 0
    },
    analytics: null,
    isLoading: false,
    error: null,
    lastUpdated: Date.now()
  })

  // ========== FILTROS ==========
  
  const [filters, setFilters] = useState<RequestFilters>({
    status: 'all',
    type: 'all', 
    priority: 'all',
    location: context.location.current !== 'all' ? [context.location.current] : 'all',
    employee: 'all',
    dateRange: {},
    searchTerm: '',
    sortBy: 'date',
    sortOrder: 'desc',
    ...initialFilters
  })

  // ========== FUNCIONES DE CARGA ==========

  /**
   * Carga los datos iniciales
   */
  const loadData = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }))
    
    try {
      // Cargar requests con filtros actuales
      const requestsResponse = await requestService.getRequests(filters)
      
      if (requestsResponse.status === 'error') {
        throw new Error(requestsResponse.error)
      }

      const requests = requestsResponse.data || []

      // Cargar métricas si están habilitadas
      let metrics = state.metrics
      if (enableMetrics) {
        const metricsResponse = await requestService.getMetrics()
        if (metricsResponse.status === 'success' && metricsResponse.data) {
          metrics = metricsResponse.data
        }
      }

      // Cargar analytics si están habilitadas y el usuario tiene permisos
      let analytics = state.analytics
      if (enableAnalytics && permissionManager.can('canViewRequestAnalytics')) {
        const analyticsResponse = await requestService.getAnalytics('month')
        if (analyticsResponse.status === 'success' && analyticsResponse.data) {
          analytics = analyticsResponse.data
        }
      }

      setState(prev => ({
        ...prev,
        requests,
        metrics,
        analytics,
        isLoading: false,
        error: null,
        lastUpdated: Date.now()
      }))

    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Error loading data'
      }))
    }
  }, [requestService, filters, enableMetrics, enableAnalytics, permissionManager])

  /**
   * Refresca solo las requests sin cambiar el estado de loading
   */
  const refreshRequests = useCallback(async () => {
    try {
      const response = await requestService.getRequests(filters)
      if (response.status === 'success' && response.data) {
        setState(prev => ({
          ...prev,
          requests: response.data!,
          lastUpdated: Date.now()
        }))
      }
    } catch (error) {
      console.error('Error refreshing requests:', error)
    }
  }, [requestService, filters])

  // ========== OPERACIONES CRUD ==========

  /**
   * Crea una nueva request
   */
  const createRequest = useCallback(async (data: CreateRequestData): Promise<TeamRequest> => {
    const response = await requestService.createRequest(data)
    
    if (response.status === 'error') {
      throw new Error(response.error)
    }

    const newRequest = response.data!
    
    setState(prev => ({
      ...prev,
      requests: [newRequest, ...prev.requests],
      lastUpdated: Date.now()
    }))

    // Refrescar métricas
    if (enableMetrics) {
      setTimeout(() => loadData(), 1000)
    }

    return newRequest
  }, [requestService, enableMetrics, loadData])

  /**
   * Actualiza una request existente
   */
  const updateRequest = useCallback(async (data: UpdateRequestData): Promise<TeamRequest> => {
    const response = await requestService.updateRequest(data)
    
    if (response.status === 'error') {
      throw new Error(response.error)
    }

    const updatedRequest = response.data!
    
    setState(prev => ({
      ...prev,
      requests: prev.requests.map(request => 
        request.id === data.id ? updatedRequest : request
      ),
      selectedRequest: prev.selectedRequest?.id === data.id ? updatedRequest : prev.selectedRequest,
      lastUpdated: Date.now()
    }))

    return updatedRequest
  }, [requestService])

  /**
   * Elimina una request
   */
  const deleteRequest = useCallback(async (id: string): Promise<void> => {
    const response = await requestService.deleteRequest(id)
    
    if (response.status === 'error') {
      throw new Error(response.error)
    }

    setState(prev => ({
      ...prev,
      requests: prev.requests.filter(request => request.id !== id),
      selectedRequest: prev.selectedRequest?.id === id ? null : prev.selectedRequest,
      lastUpdated: Date.now()
    }))
  }, [requestService])

  // ========== ACCIONES DE APROBACIÓN ==========

  /**
   * Aprueba una request
   */
  const approveRequest = useCallback(async (id: string, comments?: string): Promise<void> => {
    const response = await approvalService.approveRequest(id, comments)
    
    if (response.status === 'error') {
      throw new Error(response.error)
    }

    const updatedRequest = response.data!
    
    setState(prev => ({
      ...prev,
      requests: prev.requests.map(request => 
        request.id === id ? updatedRequest : request
      ),
      selectedRequest: prev.selectedRequest?.id === id ? updatedRequest : prev.selectedRequest,
      lastUpdated: Date.now()
    }))
  }, [approvalService])

  /**
   * Rechaza una request
   */
  const rejectRequest = useCallback(async (id: string, comments: string): Promise<void> => {
    const response = await approvalService.rejectRequest(id, comments)
    
    if (response.status === 'error') {
      throw new Error(response.error)
    }

    const updatedRequest = response.data!
    
    setState(prev => ({
      ...prev,
      requests: prev.requests.map(request => 
        request.id === id ? updatedRequest : request
      ),
      selectedRequest: prev.selectedRequest?.id === id ? updatedRequest : prev.selectedRequest,
      lastUpdated: Date.now()
    }))
  }, [approvalService])

  /**
   * Escala una request
   */
  const escalateRequest = useCallback(async (id: string, reason?: string): Promise<void> => {
    const response = await approvalService.escalateRequest(id, reason)
    
    if (response.status === 'error') {
      throw new Error(response.error)
    }

    const updatedRequest = response.data!
    
    setState(prev => ({
      ...prev,
      requests: prev.requests.map(request => 
        request.id === id ? updatedRequest : request
      ),
      selectedRequest: prev.selectedRequest?.id === id ? updatedRequest : prev.selectedRequest,
      lastUpdated: Date.now()
    }))
  }, [approvalService])

  // ========== ACCIONES EN MASA ==========

  /**
   * Aprueba múltiples requests
   */
  const bulkApprove = useCallback(async (ids: string[], comments?: string): Promise<void> => {
    const response = await approvalService.bulkApprove(ids, comments)
    
    if (response.status === 'error') {
      throw new Error(response.error)
    }

    // Refrescar la lista completa después de acciones en masa
    await refreshRequests()
  }, [approvalService, refreshRequests])

  /**
   * Rechaza múltiples requests
   */
  const bulkReject = useCallback(async (ids: string[], comments: string): Promise<void> => {
    const response = await approvalService.bulkReject(ids, comments)
    
    if (response.status === 'error') {
      throw new Error(response.error)
    }

    // Refrescar la lista completa después de acciones en masa
    await refreshRequests()
  }, [approvalService, refreshRequests])

  // ========== UTILIDADES ==========

  /**
   * Verifica si el usuario puede realizar una acción
   */
  const canPerformAction = useCallback((action: string, request?: TeamRequest): boolean => {
    switch (action) {
      case 'create_request':
        return permissionManager.can('canCreateRequest')
      case 'edit_request':
        return request ? permissionManager.canManageRequest(request, 'edit') : false
      case 'delete_request':
        return request ? permissionManager.canManageRequest(request, 'delete') : false
      case 'approve_request':
        return request ? permissionManager.canManageRequest(request, 'approve') : false
      case 'reject_request':
        return request ? permissionManager.canManageRequest(request, 'reject') : false
      case 'escalate_request':
        return request ? permissionManager.canEscalateRequest(request) : false
      case 'bulk_approve':
        return permissionManager.can('canBulkApprove')
      case 'bulk_reject':
        return permissionManager.can('canBulkReject')
      case 'view_analytics':
        return permissionManager.can('canViewRequestAnalytics')
      default:
        return false
    }
  }, [permissionManager])

  /**
   * Obtiene requests filtradas
   */
  const getFilteredRequests = useCallback((): TeamRequest[] => {
    return state.requests
  }, [state.requests])

  /**
   * Establece la request seleccionada
   */
  const setSelectedRequest = useCallback((request: TeamRequest | null) => {
    setState(prev => ({
      ...prev,
      selectedRequest: request
    }))
  }, [])

  /**
   * Actualiza filtros
   */
  const updateFilters = useCallback((newFilters: Partial<RequestFilters>) => {
    setFilters(prev => ({
      ...prev,
      ...newFilters
    }))
  }, [])

  // ========== EFECTOS ==========

  /**
   * Cargar datos iniciales al montar o cambiar contexto/filtros
   */
  useEffect(() => {
    loadData()
  }, [loadData])

  /**
   * Auto-refrescar datos periódicamente
   */
  useEffect(() => {
    if (!autoRefresh || !refreshInterval) return

    const interval = setInterval(() => {
      refreshRequests()
    }, refreshInterval)

    return () => clearInterval(interval)
  }, [autoRefresh, refreshInterval, refreshRequests])

  // ========== RETORNO DEL HOOK ==========

  return {
    // Estado
    requests: state.requests,
    selectedRequest: state.selectedRequest,
    metrics: state.metrics,
    analytics: state.analytics,
    isLoading: state.isLoading,
    error: state.error,
    
    // Acciones CRUD
    createRequest,
    updateRequest,
    deleteRequest,
    
    // Acciones de aprobación
    approveRequest,
    rejectRequest,
    escalateRequest,
    
    // Acciones en masa
    bulkApprove,
    bulkReject,
    
    // Estado de selección
    setSelectedRequest,
    
    // Filtros y búsqueda
    filters,
    setFilters: updateFilters,
    
    // Utilidades
    canPerformAction,
    getFilteredRequests
  }
}

/**
 * Hook simplificado para casos de solo lectura
 */
export function useRequestViewer(context: RequestContext) {
  return useRequestCore({
    context,
    autoRefresh: true,
    refreshInterval: 60000, // 1 minuto para solo lectura
    enableAnalytics: false,
    enableMetrics: true
  })
}

/**
 * Hook para empleados (funcionalidad limitada)
 */
export function useEmployeeRequests(context: RequestContext) {
  return useRequestCore({
    context,
    autoRefresh: true,
    refreshInterval: 30000,
    enableAnalytics: false,
    enableMetrics: false,
    initialFilters: {
      employee: [context.user.id], // Solo sus propias requests
      sortBy: 'date',
      sortOrder: 'desc'
    }
  })
}

/**
 * Hook para supervisores con funcionalidad de aprobación
 */
export function useSupervisorRequests(context: RequestContext) {
  return useRequestCore({
    context,
    autoRefresh: true,
    refreshInterval: 20000, // 20 segundos para supervisores
    enableAnalytics: true,
    enableMetrics: true,
    initialFilters: {
      location: context.user.locationId ? [context.user.locationId] : 'all',
      sortBy: 'priority',
      sortOrder: 'desc'
    }
  })
}

/**
 * Hook para business admins con funcionalidad completa
 */
export function useBusinessAdminRequests(context: RequestContext) {
  return useRequestCore({
    context,
    autoRefresh: true,
    refreshInterval: 15000, // 15 segundos para admins
    enableAnalytics: true,
    enableMetrics: true,
    initialFilters: {
      location: 'all',
      sortBy: 'priority',
      sortOrder: 'desc'
    }
  })
}