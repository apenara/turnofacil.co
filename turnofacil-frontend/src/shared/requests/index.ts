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

// ========== COMPONENTES ==========
export {
  UniversalRequestList,
  RequestModal,
  RequestForm
} from './components'

// ========== UTILIDADES ==========
export const createRequestContext = (
  user: { id: string; name: string; email: string; role: 'EMPLOYEE' | 'SUPERVISOR' | 'BUSINESS_ADMIN'; locationId?: string },
  location: { current: string; available: string[] } = { current: 'all', available: [] }
) => ({
  user,
  location
})

// Hook de conveniencia para casos comunes
export const useRequestsForRole = (
  context: import('./core/types').RequestContext,
  role?: 'EMPLOYEE' | 'SUPERVISOR' | 'BUSINESS_ADMIN'
) => {
  const actualRole = role || context.user.role
  
  // Re-importar hooks para usar dentro de la función
  const {
    useEmployeeRequests,
    useSupervisorRequests,
    useBusinessAdminRequests
  } = require('./hooks/useRequestCore')
  
  switch (actualRole) {
    case 'EMPLOYEE':
      return useEmployeeRequests(context)
    case 'SUPERVISOR':
      return useSupervisorRequests(context)
    case 'BUSINESS_ADMIN':
      return useBusinessAdminRequests(context)
    default:
      return useEmployeeRequests(context)
  }
}