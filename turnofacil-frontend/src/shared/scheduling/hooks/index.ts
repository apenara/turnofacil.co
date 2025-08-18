/**
 * Hooks de Scheduling - Índice Principal
 * @fileoverview Exportación centralizada de todos los hooks del módulo de scheduling
 */

// Hook principal
export { 
  useScheduleCore, 
  useScheduleViewer, 
  useScheduleAdmin 
} from './useScheduleCore'

// Hook de gestión de empleados
export { useEmployeeManagement } from './useEmployeeManagement'

// Re-exportar tipos necesarios para los hooks
export type {
  UseScheduleResult,
  SchedulingContext,
  ServiceResponse
} from '../core/types'