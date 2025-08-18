/**
 * Módulo Compartido de Requests - Main Export
 * @fileoverview Punto de entrada principal para el módulo de requests
 */

// ========== TIPOS ==========
export * from './core/types'

// ========== CONSTANTES ==========
export * from './core/constants'

// ========== PERMISOS ==========
export { RequestPermissionManager } from './core/permissions'

// ========== SERVICIOS ==========
export { RequestService } from './services/RequestService'
export { ApprovalService } from './services/ApprovalService'

// ========== HOOKS ==========
export {
  useRequestCore,
  useRequestViewer,
  useEmployeeRequests,
  useSupervisorRequests,
  useBusinessAdminRequests
} from './hooks/useRequestCore'
export { useRequestFilters } from './hooks/useRequestFilters'

// Re-exportar hooks para uso interno
import { useRequestCore } from './hooks/useRequestCore'

// ========== COMPONENTES ==========
export {
  UniversalRequestList,
  RequestModal,
  RequestForm
} from './components'

// ========== UTILIDADES ==========
export const createRequestContext = (
  user: { id: string; name: string; email: string; role: 'EMPLOYEE' | 'SUPERVISOR' | 'BUSINESS_ADMIN'; locationId?: string },
  locations: Array<{ id: string; name: string; address: string; status: 'active' | 'inactive' }> = [],
  settings: Partial<import('./core/types').RequestContext['settings']> = {}
): import('./core/types').RequestContext => {
  const defaultSettings = {
    approvalFlow: {
      autoEscalationEnabled: true,
      escalationTimeoutHours: 24,
      requiresBusinessAdminApproval: ['vacation', 'overtime'] as import('./core/types').RequestType[]
    },
    notifications: {
      emailNotifications: true,
      pushNotifications: true,
      reminderIntervals: [24, 4, 1]
    },
    limits: {
      maxAttachmentSize: 5,
      maxAttachmentsPerRequest: 3,
      maxDescriptionLength: 500
    }
  }

  return {
    user,
    location: {
      current: user.locationId || 'all',
      available: locations.map(loc => ({
        id: loc.id,
        name: loc.name,
        address: loc.address,
        requestConfig: {
          requiresAdvanceNotice: true,
          advanceNoticeDays: 1,
          allowsSamedayRequests: false,
          businessHours: {
            start: '08:00',
            end: '18:00',
            timezone: 'America/Bogota'
          }
        },
        supervisorId: undefined,
        employeeCount: 0,
        status: loc.status
      }))
    },
    settings: {
      ...defaultSettings,
      ...settings
    }
  }
}

// Hook de conveniencia que usa configuración en lugar de diferentes hooks
export const useRequestsForRole = (
  context: import('./core/types').RequestContext,
  role?: 'EMPLOYEE' | 'SUPERVISOR' | 'BUSINESS_ADMIN'
) => {
  const actualRole = role || context.user.role
  
  const config = {
    context,
    autoRefresh: true,
    enableAnalytics: actualRole !== 'EMPLOYEE',
    enableMetrics: actualRole !== 'EMPLOYEE',
    refreshInterval: actualRole === 'EMPLOYEE' ? 30000 : actualRole === 'SUPERVISOR' ? 20000 : 15000,
    initialFilters: actualRole === 'EMPLOYEE' 
      ? { employee: [context.user.id], sortBy: 'date' as const, sortOrder: 'desc' as const }
      : actualRole === 'SUPERVISOR'
      ? { location: context.user.locationId ? [context.user.locationId] : 'all', sortBy: 'priority' as const, sortOrder: 'desc' as const }
      : { location: 'all', sortBy: 'priority' as const, sortOrder: 'desc' as const }
  }
  
  return useRequestCore(config)
}

// Utilidad simplificada para crear contexto básico
export const createSimpleRequestContext = (
  user: { id: string; name: string; email: string; role: 'EMPLOYEE' | 'SUPERVISOR' | 'BUSINESS_ADMIN'; locationId?: string }
): import('./core/types').RequestContext => {
  return createRequestContext(user, [], {})
}