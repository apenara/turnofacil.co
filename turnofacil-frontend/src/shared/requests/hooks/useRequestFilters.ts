/**
 * Hook para Gestión de Filtros de Requests
 * @fileoverview Hook especializado para filtros avanzados y búsquedas
 */

import { useState, useCallback, useMemo } from 'react'
import {
  RequestFilters,
  RequestType,
  RequestStatus,
  RequestPriority,
  TeamRequest,
  RequestContext,
  Employee,
  Location
} from '../core/types'
import { RequestPermissionManager } from '../core/permissions'
import { REQUEST_TYPE_CONFIG, REQUEST_STATUS_CONFIG, REQUEST_PRIORITY_CONFIG } from '../core/constants'

/**
 * Estado de filtros extendido con metadata
 */
interface ExtendedFilters extends RequestFilters {
  // Filtros temporales
  isToday?: boolean
  isThisWeek?: boolean
  isThisMonth?: boolean
  isOverdue?: boolean
  
  // Filtros por metadata
  hasAttachments?: boolean
  isEscalated?: boolean
  requiresAttention?: boolean
  
  // Filtros de tiempo de respuesta
  slowResponse?: boolean
  quickResponse?: boolean
}

/**
 * Resultado del hook de filtros
 */
interface UseRequestFiltersResult {
  // Filtros actuales
  filters: ExtendedFilters
  activeFiltersCount: number
  
  // Acciones de filtro
  setFilter: <K extends keyof ExtendedFilters>(key: K, value: ExtendedFilters[K]) => void
  toggleFilter: (key: keyof ExtendedFilters, value?: any) => void
  clearFilters: () => void
  clearFilter: (key: keyof ExtendedFilters) => void
  
  // Presets de filtros
  applyPreset: (preset: FilterPreset) => void
  saveCustomPreset: (name: string, filters: Partial<ExtendedFilters>) => void
  
  // Búsqueda avanzada
  searchInFields: (term: string, fields: SearchField[]) => void
  quickSearch: (term: string) => void
  
  // Opciones disponibles
  availableTypes: Array<{ value: RequestType; label: string; count?: number }>
  availableStatuses: Array<{ value: RequestStatus; label: string; count?: number }>
  availablePriorities: Array<{ value: RequestPriority; label: string; count?: number }>
  availableEmployees: Array<{ value: string; label: string; count?: number }>
  availableLocations: Array<{ value: string; label: string; count?: number }>
  
  // Utilidades
  isFilterActive: (key: keyof ExtendedFilters) => boolean
  getFilterSummary: () => string
  exportFilters: () => string
  importFilters: (filtersString: string) => boolean
}

/**
 * Tipos de presets de filtros
 */
export type FilterPreset = 
  | 'my_requests'
  | 'pending_approval'
  | 'urgent_requests'
  | 'recent_requests'
  | 'escalated_requests'
  | 'overdue_requests'
  | 'approved_today'
  | 'rejected_requests'

/**
 * Campos de búsqueda disponibles
 */
export type SearchField = 
  | 'employee_name'
  | 'reason'
  | 'description'
  | 'comments'
  | 'type'
  | 'all'

/**
 * Hook para gestión avanzada de filtros
 */
export function useRequestFilters(
  context: RequestContext,
  requests: TeamRequest[] = [],
  initialFilters: Partial<ExtendedFilters> = {}
): UseRequestFiltersResult {

  const permissionManager = useMemo(() => 
    new RequestPermissionManager(context)
  , [context])

  // ========== ESTADO ==========
  
  const [filters, setFilters] = useState<ExtendedFilters>({
    status: 'all',
    type: 'all',
    priority: 'all',
    location: 'all',
    employee: 'all',
    dateRange: {},
    searchTerm: '',
    sortBy: 'date',
    sortOrder: 'desc',
    
    // Filtros temporales
    isToday: false,
    isThisWeek: false,
    isThisMonth: false,
    isOverdue: false,
    
    // Filtros por metadata
    hasAttachments: false,
    isEscalated: false,
    requiresAttention: false,
    
    // Filtros de tiempo de respuesta
    slowResponse: false,
    quickResponse: false,
    
    ...initialFilters
  })

  // ========== OPCIONES DISPONIBLES ==========

  /**
   * Tipos disponibles con conteos
   */
  const availableTypes = useMemo(() => {
    const typeCounts = requests.reduce((acc, request) => {
      acc[request.type] = (acc[request.type] || 0) + 1
      return acc
    }, {} as Record<RequestType, number>)

    return Object.entries(REQUEST_TYPE_CONFIG).map(([key, config]) => ({
      value: key as RequestType,
      label: config.name,
      count: typeCounts[key as RequestType] || 0
    })).filter(item => 
      // Filtrar tipos según permisos del usuario
      permissionManager.canCreateRequestType(item.value)
    )
  }, [requests, permissionManager])

  /**
   * Estados disponibles con conteos
   */
  const availableStatuses = useMemo(() => {
    const statusCounts = requests.reduce((acc, request) => {
      acc[request.status] = (acc[request.status] || 0) + 1
      return acc
    }, {} as Record<RequestStatus, number>)

    return Object.entries(REQUEST_STATUS_CONFIG).map(([key, config]) => ({
      value: key as RequestStatus,
      label: config.name,
      count: statusCounts[key as RequestStatus] || 0
    }))
  }, [requests])

  /**
   * Prioridades disponibles con conteos
   */
  const availablePriorities = useMemo(() => {
    const priorityCounts = requests.reduce((acc, request) => {
      acc[request.priority] = (acc[request.priority] || 0) + 1
      return acc
    }, {} as Record<RequestPriority, number>)

    return Object.entries(REQUEST_PRIORITY_CONFIG).map(([key, config]) => ({
      value: key as RequestPriority,
      label: config.name,
      count: priorityCounts[key as RequestPriority] || 0
    }))
  }, [requests])

  /**
   * Empleados disponibles con conteos
   */
  const availableEmployees = useMemo(() => {
    const employeeCounts = requests.reduce((acc, request) => {
      acc[request.employeeId] = (acc[request.employeeId] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // Obtener empleados únicos de las requests
    const uniqueEmployees = Array.from(new Set(requests.map(r => r.employeeId)))
      .map(id => {
        const request = requests.find(r => r.employeeId === id)
        return {
          value: id,
          label: request?.employeeName || 'Empleado desconocido',
          count: employeeCounts[id] || 0
        }
      })
      .sort((a, b) => a.label.localeCompare(b.label))

    return uniqueEmployees
  }, [requests])

  /**
   * Ubicaciones disponibles con conteos
   */
  const availableLocations = useMemo(() => {
    const locationCounts = requests.reduce((acc, request) => {
      acc[request.locationId] = (acc[request.locationId] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // Obtener ubicaciones únicas de las requests
    const uniqueLocations = Array.from(new Set(requests.map(r => r.locationId)))
      .map(id => {
        const request = requests.find(r => r.locationId === id)
        return {
          value: id,
          label: request?.locationName || 'Ubicación desconocida',
          count: locationCounts[id] || 0
        }
      })
      .filter(location => 
        // Filtrar ubicaciones según permisos
        permissionManager.canAccessLocation(location.value)
      )
      .sort((a, b) => a.label.localeCompare(b.label))

    return uniqueLocations
  }, [requests, permissionManager])

  // ========== CÁLCULOS ==========

  /**
   * Cuenta filtros activos
   */
  const activeFiltersCount = useMemo(() => {
    let count = 0
    
    if (filters.status !== 'all') count++
    if (filters.type !== 'all') count++
    if (filters.priority !== 'all') count++
    if (filters.location !== 'all') count++
    if (filters.employee !== 'all') count++
    if (filters.searchTerm) count++
    if (filters.dateRange.start || filters.dateRange.end) count++
    
    // Filtros booleanos
    if (filters.isToday) count++
    if (filters.isThisWeek) count++
    if (filters.isThisMonth) count++
    if (filters.isOverdue) count++
    if (filters.hasAttachments) count++
    if (filters.isEscalated) count++
    if (filters.requiresAttention) count++
    if (filters.slowResponse) count++
    if (filters.quickResponse) count++
    
    return count
  }, [filters])

  // ========== ACCIONES DE FILTRO ==========

  /**
   * Establece un filtro específico
   */
  const setFilter = useCallback(<K extends keyof ExtendedFilters>(
    key: K, 
    value: ExtendedFilters[K]
  ) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }))
  }, [])

  /**
   * Alterna un filtro booleano
   */
  const toggleFilter = useCallback((key: keyof ExtendedFilters, value?: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value !== undefined ? value : !prev[key]
    }))
  }, [])

  /**
   * Limpia todos los filtros
   */
  const clearFilters = useCallback(() => {
    setFilters({
      status: 'all',
      type: 'all',
      priority: 'all',
      location: 'all',
      employee: 'all',
      dateRange: {},
      searchTerm: '',
      sortBy: 'date',
      sortOrder: 'desc',
      
      isToday: false,
      isThisWeek: false,
      isThisMonth: false,
      isOverdue: false,
      hasAttachments: false,
      isEscalated: false,
      requiresAttention: false,
      slowResponse: false,
      quickResponse: false
    })
  }, [])

  /**
   * Limpia un filtro específico
   */
  const clearFilter = useCallback((key: keyof ExtendedFilters) => {
    setFilters(prev => {
      const newFilters = { ...prev }
      
      switch (key) {
        case 'status':
        case 'type':
        case 'priority':
        case 'location':
        case 'employee':
          newFilters[key] = 'all'
          break
        case 'searchTerm':
          newFilters.searchTerm = ''
          break
        case 'dateRange':
          newFilters.dateRange = {}
          break
        default:
          // Para filtros booleanos
          newFilters[key] = false as any
          break
      }
      
      return newFilters
    })
  }, [])

  // ========== PRESETS DE FILTROS ==========

  /**
   * Aplica un preset predefinido
   */
  const applyPreset = useCallback((preset: FilterPreset) => {
    const now = new Date()
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const startOfWeek = new Date(startOfToday)
    startOfWeek.setDate(startOfToday.getDate() - startOfToday.getDay())
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    const presets: Record<FilterPreset, Partial<ExtendedFilters>> = {
      my_requests: {
        employee: [context.user.id],
        sortBy: 'date',
        sortOrder: 'desc'
      },
      
      pending_approval: {
        status: ['pending', 'under_review'],
        sortBy: 'priority',
        sortOrder: 'desc'
      },
      
      urgent_requests: {
        priority: ['urgent', 'emergency'],
        status: ['pending', 'under_review'],
        sortBy: 'date',
        sortOrder: 'asc'
      },
      
      recent_requests: {
        dateRange: {
          start: startOfWeek.toISOString().split('T')[0],
          end: now.toISOString().split('T')[0]
        },
        sortBy: 'date',
        sortOrder: 'desc'
      },
      
      escalated_requests: {
        isEscalated: true,
        sortBy: 'priority',
        sortOrder: 'desc'
      },
      
      overdue_requests: {
        isOverdue: true,
        sortBy: 'date',
        sortOrder: 'asc'
      },
      
      approved_today: {
        status: ['approved'],
        isToday: true,
        sortBy: 'date',
        sortOrder: 'desc'
      },
      
      rejected_requests: {
        status: ['rejected'],
        sortBy: 'date',
        sortOrder: 'desc'
      }
    }

    const presetFilters = presets[preset]
    if (presetFilters) {
      setFilters(prev => ({
        ...prev,
        ...presetFilters
      }))
    }
  }, [context.user.id])

  /**
   * Guarda un preset personalizado
   */
  const saveCustomPreset = useCallback((name: string, customFilters: Partial<ExtendedFilters>) => {
    // En una implementación real, esto se guardaría en localStorage o en el servidor
    const presets = JSON.parse(localStorage.getItem('request_filter_presets') || '{}')
    presets[name] = customFilters
    localStorage.setItem('request_filter_presets', JSON.stringify(presets))
  }, [])

  // ========== BÚSQUEDA AVANZADA ==========

  /**
   * Búsqueda en campos específicos
   */
  const searchInFields = useCallback((term: string, fields: SearchField[]) => {
    // Esta funcionalidad se implementaría en conjunto con el filtrado en el componente
    setFilter('searchTerm', term)
    
    // Guardar campos de búsqueda para uso posterior
    const searchConfig = { term, fields }
    localStorage.setItem('last_search_config', JSON.stringify(searchConfig))
  }, [setFilter])

  /**
   * Búsqueda rápida en todos los campos
   */
  const quickSearch = useCallback((term: string) => {
    searchInFields(term, ['all'])
  }, [searchInFields])

  // ========== UTILIDADES ==========

  /**
   * Verifica si un filtro específico está activo
   */
  const isFilterActive = useCallback((key: keyof ExtendedFilters): boolean => {
    const value = filters[key]
    
    if (typeof value === 'boolean') {
      return value
    }
    
    if (typeof value === 'string') {
      return value !== '' && value !== 'all'
    }
    
    if (Array.isArray(value)) {
      return value.length > 0
    }
    
    if (typeof value === 'object' && value !== null) {
      return Object.keys(value).length > 0
    }
    
    return false
  }, [filters])

  /**
   * Genera un resumen textual de los filtros activos
   */
  const getFilterSummary = useCallback((): string => {
    const activeParts: string[] = []
    
    if (filters.status !== 'all') {
      const statusLabels = Array.isArray(filters.status) 
        ? filters.status.map(s => REQUEST_STATUS_CONFIG[s]?.name).join(', ')
        : REQUEST_STATUS_CONFIG[filters.status as RequestStatus]?.name
      if (statusLabels) activeParts.push(`Estado: ${statusLabels}`)
    }
    
    if (filters.type !== 'all') {
      const typeLabels = Array.isArray(filters.type) 
        ? filters.type.map(t => REQUEST_TYPE_CONFIG[t]?.name).join(', ')
        : REQUEST_TYPE_CONFIG[filters.type as RequestType]?.name
      if (typeLabels) activeParts.push(`Tipo: ${typeLabels}`)
    }
    
    if (filters.priority !== 'all') {
      const priorityLabels = Array.isArray(filters.priority) 
        ? filters.priority.map(p => REQUEST_PRIORITY_CONFIG[p]?.name).join(', ')
        : REQUEST_PRIORITY_CONFIG[filters.priority as RequestPriority]?.name
      if (priorityLabels) activeParts.push(`Prioridad: ${priorityLabels}`)
    }
    
    if (filters.searchTerm) {
      activeParts.push(`Búsqueda: "${filters.searchTerm}"`)
    }
    
    if (filters.isEscalated) {
      activeParts.push('Escaladas')
    }
    
    if (filters.isOverdue) {
      activeParts.push('Vencidas')
    }
    
    return activeParts.length > 0 
      ? `Filtros activos: ${activeParts.join(' | ')}`
      : 'Sin filtros'
  }, [filters])

  /**
   * Exporta filtros como string
   */
  const exportFilters = useCallback((): string => {
    return btoa(JSON.stringify(filters))
  }, [filters])

  /**
   * Importa filtros desde string
   */
  const importFilters = useCallback((filtersString: string): boolean => {
    try {
      const imported = JSON.parse(atob(filtersString))
      setFilters(prev => ({
        ...prev,
        ...imported
      }))
      return true
    } catch (error) {
      console.error('Error importing filters:', error)
      return false
    }
  }, [])

  // ========== RETORNO DEL HOOK ==========

  return {
    // Filtros actuales
    filters,
    activeFiltersCount,
    
    // Acciones de filtro
    setFilter,
    toggleFilter,
    clearFilters,
    clearFilter,
    
    // Presets
    applyPreset,
    saveCustomPreset,
    
    // Búsqueda
    searchInFields,
    quickSearch,
    
    // Opciones disponibles
    availableTypes,
    availableStatuses,
    availablePriorities,
    availableEmployees,
    availableLocations,
    
    // Utilidades
    isFilterActive,
    getFilterSummary,
    exportFilters,
    importFilters
  }
}