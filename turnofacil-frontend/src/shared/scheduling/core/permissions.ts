/**
 * Sistema de Permisos por Rol
 * @fileoverview Definición y gestión de permisos específicos por rol de usuario
 */

import { UserRole, RolePermissions, SchedulingContext } from './types'

/**
 * Configuración de permisos por rol
 */
export const ROLE_PERMISSIONS_CONFIG: Record<UserRole, RolePermissions> = {
  SUPERVISOR: {
    // Gestión de turnos
    canCreateShifts: true,
    canEditShifts: true,
    canDeleteShifts: true,
    canEditOwnShifts: false, // Los supervisores no tienen turnos propios
    
    // Gestión de empleados
    canViewAllEmployees: false, // Solo empleados de su ubicación
    canManageEmployees: false,  // No pueden crear/eliminar empleados
    canAssignShifts: true,
    
    // Gestión de ubicaciones
    canViewAllLocations: false,
    canManageLocations: false,
    locationAccess: [], // Se asigna dinámicamente según su ubicación
    
    // Días de descanso y licencias
    canManageRestDays: true,
    canApproveLeaves: false, // Solo pueden ver, no aprobar
    canViewLeaves: true,
    
    // Plantillas y validación
    canManageTemplates: true,
    canBypassValidations: false,
    canApproveSchedules: false, // Solo proponen horarios
    
    // Reportes y analytics
    canViewReports: true,
    canViewBudgets: false, // Solo información limitada
    canExportData: false,
    
    // Límites de visualización
    maxEmployeesVisible: 'unlimited', // Todos los de su ubicación
    budgetVisibility: 'summary' // Solo resumen, no detalles
  },

  BUSINESS_ADMIN: {
    // Gestión de turnos
    canCreateShifts: true,
    canEditShifts: true,
    canDeleteShifts: true,
    canEditOwnShifts: false,
    
    // Gestión de empleados
    canViewAllEmployees: true,
    canManageEmployees: true,
    canAssignShifts: true,
    
    // Gestión de ubicaciones
    canViewAllLocations: true,
    canManageLocations: true,
    locationAccess: 'all',
    
    // Días de descanso y licencias
    canManageRestDays: true,
    canApproveLeaves: true,
    canViewLeaves: true,
    
    // Plantillas y validación
    canManageTemplates: true,
    canBypassValidations: true,
    canApproveSchedules: true,
    
    // Reportes y analytics
    canViewReports: true,
    canViewBudgets: true,
    canExportData: true,
    
    // Límites de visualización
    maxEmployeesVisible: 'unlimited',
    budgetVisibility: 'full'
  },

  EMPLOYEE: {
    // Gestión de turnos
    canCreateShifts: false,
    canEditShifts: false,
    canDeleteShifts: false,
    canEditOwnShifts: false, // Solo pueden solicitar cambios
    
    // Gestión de empleados
    canViewAllEmployees: false, // Solo compañeros de equipo
    canManageEmployees: false,
    canAssignShifts: false,
    
    // Gestión de ubicaciones
    canViewAllLocations: false,
    canManageLocations: false,
    locationAccess: [], // Solo su ubicación
    
    // Días de descanso y licencias
    canManageRestDays: false,
    canApproveLeaves: false,
    canViewLeaves: false, // Solo las propias
    
    // Plantillas y validación
    canManageTemplates: false,
    canBypassValidations: false,
    canApproveSchedules: false,
    
    // Reportes y analytics
    canViewReports: false,
    canViewBudgets: false,
    canExportData: false,
    
    // Límites de visualización
    maxEmployeesVisible: 10, // Solo compañeros cercanos
    budgetVisibility: 'none'
  }
}

/**
 * Clase para gestionar permisos de usuario
 */
export class PermissionManager {
  private permissions: RolePermissions
  private context: SchedulingContext

  constructor(context: SchedulingContext) {
    this.context = context
    this.permissions = this.buildPermissions(context.user.role, context.user.locationId)
  }

  /**
   * Construye permisos específicos para el usuario
   */
  private buildPermissions(role: UserRole, userLocationId?: string): RolePermissions {
    const basePermissions = { ...ROLE_PERMISSIONS_CONFIG[role] }
    
    // Configurar acceso a ubicaciones según el rol y ubicación del usuario
    if (role === 'SUPERVISOR' && userLocationId) {
      basePermissions.locationAccess = [userLocationId]
    }
    
    if (role === 'EMPLOYEE' && userLocationId) {
      basePermissions.locationAccess = [userLocationId]
    }
    
    return basePermissions
  }

  /**
   * Verifica si el usuario puede realizar una acción específica
   */
  can(action: keyof RolePermissions): boolean {
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
   * Verifica si el usuario puede ver un número específico de empleados
   */
  canViewEmployeeCount(count: number): boolean {
    if (this.permissions.maxEmployeesVisible === 'unlimited') {
      return true
    }
    
    return count <= this.permissions.maxEmployeesVisible
  }

  /**
   * Obtiene el nivel de visibilidad del presupuesto
   */
  getBudgetVisibility(): 'full' | 'summary' | 'none' {
    return this.permissions.budgetVisibility
  }

  /**
   * Verifica permisos específicos para operaciones de turnos
   */
  canManageShift(shift: any, operation: 'create' | 'edit' | 'delete'): boolean {
    const locationAccess = this.canAccessLocation(shift.locationId)
    
    switch (operation) {
      case 'create':
        return this.can('canCreateShifts') && locationAccess
      case 'edit':
        return this.can('canEditShifts') && locationAccess
      case 'delete':
        return this.can('canDeleteShifts') && locationAccess
      default:
        return false
    }
  }

  /**
   * Obtiene todas las restricciones activas para el usuario
   */
  getRestrictions(): {
    locations: string[] | 'all'
    maxEmployees: number | 'unlimited'
    budgetLevel: string
    readOnly: boolean
  } {
    return {
      locations: this.permissions.locationAccess,
      maxEmployees: this.permissions.maxEmployeesVisible,
      budgetLevel: this.permissions.budgetVisibility,
      readOnly: !this.can('canCreateShifts') && !this.can('canEditShifts')
    }
  }

  /**
   * Verifica si una funcionalidad específica debe estar habilitada en la UI
   */
  isFeatureEnabled(feature: ScheduleFeature): boolean {
    const featurePermissions: Record<ScheduleFeature, keyof RolePermissions> = {
      'shift-creation': 'canCreateShifts',
      'shift-editing': 'canEditShifts',
      'shift-deletion': 'canDeleteShifts',
      'employee-management': 'canManageEmployees',
      'template-management': 'canManageTemplates',
      'rest-day-management': 'canManageRestDays',
      'leave-approval': 'canApproveLeaves',
      'budget-view': 'canViewBudgets',
      'reports-view': 'canViewReports',
      'data-export': 'canExportData',
      'schedule-approval': 'canApproveSchedules',
      'validation-bypass': 'canBypassValidations'
    }

    const requiredPermission = featurePermissions[feature]
    return requiredPermission ? this.can(requiredPermission) : false
  }

  /**
   * Obtiene configuración de UI específica para el rol
   */
  getUIConfig(): ScheduleUIConfig {
    const role = this.context.user.role
    
    return {
      showBudgetInfo: this.permissions.budgetVisibility !== 'none',
      showAllLocations: this.permissions.canViewAllLocations,
      showEmployeeManagement: this.permissions.canManageEmployees,
      showAdvancedValidation: this.permissions.canBypassValidations,
      showApprovalActions: this.permissions.canApproveSchedules,
      compactMode: role === 'EMPLOYEE',
      readOnlyMode: role === 'EMPLOYEE',
      maxTabsVisible: role === 'EMPLOYEE' ? 2 : 6
    }
  }
}

/**
 * Tipos auxiliares para el sistema de permisos
 */
export type ScheduleFeature = 
  | 'shift-creation'
  | 'shift-editing' 
  | 'shift-deletion'
  | 'employee-management'
  | 'template-management'
  | 'rest-day-management'
  | 'leave-approval'
  | 'budget-view'
  | 'reports-view'
  | 'data-export'
  | 'schedule-approval'
  | 'validation-bypass'

export interface ScheduleUIConfig {
  showBudgetInfo: boolean
  showAllLocations: boolean
  showEmployeeManagement: boolean
  showAdvancedValidation: boolean
  showApprovalActions: boolean
  compactMode: boolean
  readOnlyMode: boolean
  maxTabsVisible: number
}

/**
 * Hook para usar el sistema de permisos
 */
export function usePermissions(context: SchedulingContext) {
  const permissionManager = new PermissionManager(context)
  
  return {
    can: (action: keyof RolePermissions) => permissionManager.can(action),
    canAccessLocation: (locationId: string) => permissionManager.canAccessLocation(locationId),
    canManageShift: (shift: any, operation: 'create' | 'edit' | 'delete') => 
      permissionManager.canManageShift(shift, operation),
    isFeatureEnabled: (feature: ScheduleFeature) => permissionManager.isFeatureEnabled(feature),
    getUIConfig: () => permissionManager.getUIConfig(),
    getRestrictions: () => permissionManager.getRestrictions(),
    getBudgetVisibility: () => permissionManager.getBudgetVisibility()
  }
}

/**
 * Utilidades para verificación rápida de permisos
 */
export const PermissionUtils = {
  /**
   * Verifica si un rol puede realizar una acción específica
   */
  roleCanPerform(role: UserRole, action: keyof RolePermissions): boolean {
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
  }
}