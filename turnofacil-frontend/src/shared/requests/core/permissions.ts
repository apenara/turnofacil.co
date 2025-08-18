/**
 * Sistema de Permisos por Rol para Requests
 * @fileoverview Definición y gestión de permisos específicos por rol de usuario
 */

import { UserRole, RequestPermissions, RequestType, RequestContext, TeamRequest } from './types'

/**
 * Configuración de permisos por rol
 */
export const ROLE_PERMISSIONS_CONFIG: Record<UserRole, RequestPermissions> = {
  EMPLOYEE: {
    // Crear y gestionar requests propias
    canCreateRequest: true,
    canEditOwnRequest: true,        // Solo si está en borrador
    canDeleteOwnRequest: true,      // Solo si está en borrador
    canViewOwnRequests: true,
    
    // Ver requests de otros - NO
    canViewTeamRequests: false,
    canViewAllRequests: false,
    canViewAllLocations: false,
    
    // Aprobaciones y decisiones - NO
    canApproveRequests: false,
    canRejectRequests: false,
    canEscalateRequests: false,
    canMakeFinalDecision: false,
    
    // Acciones especiales - NO
    canBulkApprove: false,
    canBulkReject: false,
    canEditRequestComments: false,  // Solo pueden agregar descripción
    canViewRequestAnalytics: false,
    canManageRequestTypes: false,
    
    // Límites de acceso
    locationAccess: [], // Solo su ubicación (se asigna dinámicamente)
    requestTypeAccess: 'all', // Pueden crear todos los tipos
    maxRequestsPerMonth: 10 // Límite mensual
  },

  SUPERVISOR: {
    // Crear requests - SÍ (pueden crear para su equipo)
    canCreateRequest: true,
    canEditOwnRequest: true,
    canDeleteOwnRequest: true,
    canViewOwnRequests: true,
    
    // Ver requests de equipo - SÍ
    canViewTeamRequests: true,
    canViewAllRequests: false,      // Solo su ubicación
    canViewAllLocations: false,
    
    // Aprobaciones y decisiones - Primera instancia
    canApproveRequests: true,
    canRejectRequests: true,
    canEscalateRequests: true,      // Pueden escalar a Business Admin
    canMakeFinalDecision: false,    // Solo primera instancia
    
    // Acciones especiales - Limitadas
    canBulkApprove: true,           // Para su equipo
    canBulkReject: true,            // Para su equipo
    canEditRequestComments: true,   // Pueden comentar
    canViewRequestAnalytics: true,  // Análisis de su equipo
    canManageRequestTypes: false,
    
    // Límites de acceso
    locationAccess: [], // Solo su ubicación (se asigna dinámicamente)
    requestTypeAccess: 'all',
    maxRequestsPerMonth: 25 // Mayor límite para supervisores
  },

  BUSINESS_ADMIN: {
    // Crear requests - SÍ (acceso completo)
    canCreateRequest: true,
    canEditOwnRequest: true,
    canDeleteOwnRequest: true,
    canViewOwnRequests: true,
    
    // Ver requests - ACCESO TOTAL
    canViewTeamRequests: true,
    canViewAllRequests: true,
    canViewAllLocations: true,
    
    // Aprobaciones y decisiones - PODER TOTAL
    canApproveRequests: true,
    canRejectRequests: true,
    canEscalateRequests: false,     // Ya es la instancia final
    canMakeFinalDecision: true,     // Decisión final en escalaciones
    
    // Acciones especiales - ACCESO COMPLETO
    canBulkApprove: true,
    canBulkReject: true,
    canEditRequestComments: true,
    canViewRequestAnalytics: true,  // Análisis completo
    canManageRequestTypes: true,    // Puede configurar tipos
    
    // Límites de acceso - SIN LÍMITES
    locationAccess: 'all',
    requestTypeAccess: 'all',
    maxRequestsPerMonth: undefined // Sin límite
  }
}

/**
 * Clase para gestionar permisos de requests
 */
export class RequestPermissionManager {
  private permissions: RequestPermissions
  private context: RequestContext

  constructor(context: RequestContext) {
    this.context = context
    this.permissions = this.buildPermissions(context.user.role, context.user.locationId)
  }

  /**
   * Construye permisos específicos para el usuario
   */
  private buildPermissions(role: UserRole, userLocationId?: string): RequestPermissions {
    const basePermissions = { ...ROLE_PERMISSIONS_CONFIG[role] }
    
    // Configurar acceso a ubicaciones según el rol y ubicación del usuario
    if ((role === 'SUPERVISOR' || role === 'EMPLOYEE') && userLocationId) {
      basePermissions.locationAccess = [userLocationId]
    }
    
    return basePermissions
  }

  /**
   * Verifica si el usuario puede realizar una acción específica
   */
  can(action: keyof RequestPermissions): boolean {
    return this.permissions[action] as boolean
  }

  /**
   * Verifica si el usuario puede acceder a una ubicación específica
   */
  canAccessLocation(locationId: string): boolean {
    if (this.permissions.locationAccess === 'all') {
      return true
    }
    
    if (Array.isArray(this.permissions.locationAccess)) {
      return this.permissions.locationAccess.includes(locationId)
    }
    
    return false
  }

  /**
   * Verifica si el usuario puede crear un tipo específico de request
   */
  canCreateRequestType(requestType: RequestType): boolean {
    if (!this.permissions.canCreateRequest) {
      return false
    }
    
    if (this.permissions.requestTypeAccess === 'all') {
      return true
    }
    
    if (Array.isArray(this.permissions.requestTypeAccess)) {
      return this.permissions.requestTypeAccess.includes(requestType)
    }
    
    return false
  }

  /**
   * Verifica si el usuario puede gestionar una request específica
   */
  canManageRequest(request: TeamRequest, action: 'view' | 'edit' | 'delete' | 'approve' | 'reject'): boolean {
    const isOwnRequest = request.employeeId === this.context.user.id
    const hasLocationAccess = this.canAccessLocation(request.locationId)
    
    switch (action) {
      case 'view':
        // Puede ver si: es propia, o puede ver equipo/todo, y tiene acceso a ubicación
        return (isOwnRequest && this.permissions.canViewOwnRequests) ||
               (this.permissions.canViewTeamRequests && hasLocationAccess) ||
               (this.permissions.canViewAllRequests)
      
      case 'edit':
        // Solo puede editar propias (y solo en borrador) o si es admin
        if (isOwnRequest && this.permissions.canEditOwnRequest) {
          return request.status === 'draft' || request.status === 'pending'
        }
        return this.context.user.role === 'BUSINESS_ADMIN' && hasLocationAccess
      
      case 'delete':
        // Solo puede eliminar propias en borrador o si es admin
        if (isOwnRequest && this.permissions.canDeleteOwnRequest) {
          return request.status === 'draft'
        }
        return this.context.user.role === 'BUSINESS_ADMIN' && hasLocationAccess
      
      case 'approve':
        return this.permissions.canApproveRequests && 
               hasLocationAccess && 
               !isOwnRequest &&
               this.canApproveAtCurrentStage(request)
      
      case 'reject':
        return this.permissions.canRejectRequests && 
               hasLocationAccess && 
               !isOwnRequest &&
               this.canRejectAtCurrentStage(request)
      
      default:
        return false
    }
  }

  /**
   * Verifica si puede aprobar en la etapa actual del flujo
   */
  private canApproveAtCurrentStage(request: TeamRequest): boolean {
    const { currentStage } = request.approvalFlow
    const userRole = this.context.user.role
    
    switch (currentStage) {
      case 'supervisor':
        return userRole === 'SUPERVISOR' || userRole === 'BUSINESS_ADMIN'
      
      case 'business_admin':
      case 'escalated':
        return userRole === 'BUSINESS_ADMIN'
      
      default:
        return false
    }
  }

  /**
   * Verifica si puede rechazar en la etapa actual del flujo
   */
  private canRejectAtCurrentStage(request: TeamRequest): boolean {
    // Misma lógica que aprobar para este caso
    return this.canApproveAtCurrentStage(request)
  }

  /**
   * Verifica si puede escalar una request
   */
  canEscalateRequest(request: TeamRequest): boolean {
    return this.permissions.canEscalateRequests &&
           this.canAccessLocation(request.locationId) &&
           request.approvalFlow.currentStage === 'supervisor' &&
           this.context.user.role === 'SUPERVISOR'
  }

  /**
   * Obtiene el límite de requests mensuales para el usuario
   */
  getMonthlyRequestLimit(): number | undefined {
    return this.permissions.maxRequestsPerMonth
  }

  /**
   * Verifica permisos para acciones en masa
   */
  canPerformBulkAction(action: 'approve' | 'reject', requests: TeamRequest[]): boolean {
    const canBulk = action === 'approve' ? 
      this.permissions.canBulkApprove : 
      this.permissions.canBulkReject
    
    if (!canBulk) return false
    
    // Verificar que pueda gestionar todas las requests individualmente
    return requests.every(request => 
      this.canManageRequest(request, action)
    )
  }

  /**
   * Obtiene todas las restricciones activas para el usuario
   */
  getRestrictions(): {
    locations: string[] | 'all'
    requestTypes: RequestType[] | 'all'
    maxRequestsPerMonth?: number
    readOnly: boolean
    canCreateRequests: boolean
    canApproveRequests: boolean
  } {
    return {
      locations: this.permissions.locationAccess,
      requestTypes: this.permissions.requestTypeAccess,
      maxRequestsPerMonth: this.permissions.maxRequestsPerMonth,
      readOnly: !this.permissions.canCreateRequest && !this.permissions.canApproveRequests,
      canCreateRequests: this.permissions.canCreateRequest,
      canApproveRequests: this.permissions.canApproveRequests
    }
  }

  /**
   * Verifica si una funcionalidad específica debe estar habilitada en la UI
   */
  isFeatureEnabled(feature: RequestFeature): boolean {
    const featurePermissions: Record<RequestFeature, keyof RequestPermissions> = {
      'request-creation': 'canCreateRequest',
      'request-approval': 'canApproveRequests',
      'request-rejection': 'canRejectRequests',
      'bulk-actions': 'canBulkApprove',
      'team-requests': 'canViewTeamRequests',
      'all-requests': 'canViewAllRequests',
      'request-analytics': 'canViewRequestAnalytics',
      'escalation': 'canEscalateRequests',
      'final-decision': 'canMakeFinalDecision',
      'request-types-management': 'canManageRequestTypes'
    }

    const requiredPermission = featurePermissions[feature]
    return requiredPermission ? this.can(requiredPermission) : false
  }

  /**
   * Obtiene configuración de UI específica para el rol
   */
  getUIConfig(): RequestUIConfig {
    const role = this.context.user.role
    
    return {
      showCreateButton: this.permissions.canCreateRequest,
      showBulkActions: this.permissions.canBulkApprove || this.permissions.canBulkReject,
      showAnalytics: this.permissions.canViewRequestAnalytics,
      showAllLocations: this.permissions.canViewAllLocations,
      showApprovalActions: this.permissions.canApproveRequests,
      showEscalationOption: this.permissions.canEscalateRequests,
      compactMode: role === 'EMPLOYEE',
      readOnlyMode: role === 'EMPLOYEE' && !this.permissions.canCreateRequest,
      maxTabsVisible: role === 'EMPLOYEE' ? 2 : role === 'SUPERVISOR' ? 4 : 6,
      defaultView: role === 'EMPLOYEE' ? 'my-requests' : 'team-requests'
    }
  }

  /**
   * Filtra requests según permisos del usuario
   */
  filterRequestsByPermissions(requests: TeamRequest[]): TeamRequest[] {
    return requests.filter(request => {
      return this.canManageRequest(request, 'view')
    })
  }

  /**
   * Obtiene tipos de requests disponibles para el usuario
   */
  getAvailableRequestTypes(): RequestType[] {
    if (this.permissions.requestTypeAccess === 'all') {
      return [
        'shift_change',
        'vacation', 
        'sick_leave',
        'personal_leave',
        'time_off',
        'absence',
        'overtime',
        'early_leave',
        'late_arrival'
      ]
    }
    
    return this.permissions.requestTypeAccess as RequestType[]
  }
}

/**
 * Tipos auxiliares para el sistema de permisos
 */
export type RequestFeature = 
  | 'request-creation'
  | 'request-approval' 
  | 'request-rejection'
  | 'bulk-actions'
  | 'team-requests'
  | 'all-requests'
  | 'request-analytics'
  | 'escalation'
  | 'final-decision'
  | 'request-types-management'

export interface RequestUIConfig {
  showCreateButton: boolean
  showBulkActions: boolean
  showAnalytics: boolean
  showAllLocations: boolean
  showApprovalActions: boolean
  showEscalationOption: boolean
  compactMode: boolean
  readOnlyMode: boolean
  maxTabsVisible: number
  defaultView: 'my-requests' | 'team-requests' | 'all-requests'
}

/**
 * Hook para usar el sistema de permisos de requests
 */
export function useRequestPermissions(context: RequestContext) {
  const permissionManager = new RequestPermissionManager(context)
  
  return {
    can: (action: keyof RequestPermissions) => permissionManager.can(action),
    canAccessLocation: (locationId: string) => permissionManager.canAccessLocation(locationId),
    canManageRequest: (request: TeamRequest, action: 'view' | 'edit' | 'delete' | 'approve' | 'reject') => 
      permissionManager.canManageRequest(request, action),
    canCreateRequestType: (type: RequestType) => permissionManager.canCreateRequestType(type),
    canEscalateRequest: (request: TeamRequest) => permissionManager.canEscalateRequest(request),
    canPerformBulkAction: (action: 'approve' | 'reject', requests: TeamRequest[]) => 
      permissionManager.canPerformBulkAction(action, requests),
    isFeatureEnabled: (feature: RequestFeature) => permissionManager.isFeatureEnabled(feature),
    getUIConfig: () => permissionManager.getUIConfig(),
    getRestrictions: () => permissionManager.getRestrictions(),
    getAvailableRequestTypes: () => permissionManager.getAvailableRequestTypes(),
    filterRequestsByPermissions: (requests: TeamRequest[]) => 
      permissionManager.filterRequestsByPermissions(requests),
    getMonthlyRequestLimit: () => permissionManager.getMonthlyRequestLimit()
  }
}

/**
 * Utilidades para verificación rápida de permisos
 */
export const RequestPermissionUtils = {
  /**
   * Verifica si un rol puede realizar una acción específica
   */
  roleCanPerform(role: UserRole, action: keyof RequestPermissions): boolean {
    return ROLE_PERMISSIONS_CONFIG[role][action] as boolean
  },

  /**
   * Obtiene todas las acciones permitidas para un rol
   */
  getAllowedActions(role: UserRole): string[] {
    const permissions = ROLE_PERMISSIONS_CONFIG[role]
    return Object.entries(permissions)
      .filter(([_, value]) => value === true)
      .map(([key]) => key)
  },

  /**
   * Compara permisos entre dos roles
   */
  compareRoles(role1: UserRole, role2: UserRole): {
    role1Only: string[]
    role2Only: string[]
    shared: string[]
  } {
    const role1Actions = this.getAllowedActions(role1)
    const role2Actions = this.getAllowedActions(role2)
    
    return {
      role1Only: role1Actions.filter(action => !role2Actions.includes(action)),
      role2Only: role2Actions.filter(action => !role1Actions.includes(action)),
      shared: role1Actions.filter(action => role2Actions.includes(action))
    }
  },

  /**
   * Obtiene el nivel jerárquico de un rol (para escalación)
   */
  getRoleHierarchy(role: UserRole): number {
    const hierarchy: Record<UserRole, number> = {
      'EMPLOYEE': 1,
      'SUPERVISOR': 2,
      'BUSINESS_ADMIN': 3
    }
    return hierarchy[role]
  },

  /**
   * Determina si un rol puede escalar a otro
   */
  canEscalateTo(fromRole: UserRole, toRole: UserRole): boolean {
    return this.getRoleHierarchy(fromRole) < this.getRoleHierarchy(toRole)
  }
}