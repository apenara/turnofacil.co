/**
 * Componentes de Scheduling - Índice Principal
 * @fileoverview Exportación centralizada de todos los componentes del módulo de scheduling
 */

// Componente principal
export { UniversalScheduleCalendar } from './UniversalScheduleCalendar'

// Re-exportar tipos necesarios para los componentes
export type {
  SchedulingContext,
  ScheduleShift,
  Employee,
  CreateShiftData,
  UpdateShiftData
} from '../core/types'