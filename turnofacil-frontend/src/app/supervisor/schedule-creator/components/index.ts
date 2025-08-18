/**
 * Exportaciones centralizadas de todos los componentes UI
 * @fileoverview Punto de entrada único para todos los componentes del schedule creator
 */

// Componentes principales de navegación y calendario
export { default as WeekSelector, CompactWeekSelector } from './WeekSelector'
export type { WeekSelectorProps } from './WeekSelector'

export { default as TabNavigation, CompactTabNavigation } from './TabNavigation'
export type { TabNavigationProps, TabType, Tab } from './TabNavigation'

export { default as WeeklyCalendar } from './WeeklyCalendar'
export type { WeeklyCalendarProps } from './WeeklyCalendar'

export { default as SimpleWeeklyCalendar } from './SimpleWeeklyCalendar'
export type { SimpleWeeklyCalendarProps } from './SimpleWeeklyCalendar'

// Componentes de gestión de datos
export { default as EmployeesList, CompactEmployeesList } from './EmployeesList'
export type { EmployeesListProps } from './EmployeesList'

export { default as ShiftCreationModal } from './ShiftCreationModal'
export type { ShiftCreationModalProps } from './ShiftCreationModal'

export { default as RestDayManager } from './RestDayManager'
export type { RestDayManagerProps } from './RestDayManager'

export { default as TemplateManager } from './TemplateManager'
export type { TemplateManagerProps } from './TemplateManager'

// Componentes de información y acciones
export { default as ValidationPanel } from './ValidationPanel'
export type { ValidationPanelProps } from './ValidationPanel'

export { default as WeekSummary } from './WeekSummary'
export type { WeekSummaryProps } from './WeekSummary'

export { default as QuickActions } from './QuickActions'
export type { QuickActionsProps } from './QuickActions'