/**
 * Tipos Unificados para el Sistema de Scheduling
 * @fileoverview Tipos compartidos entre todos los dashboards y roles
 */

// ========== TIPOS DE ROLES Y PERMISOS ==========

export type UserRole = 'SUPERVISOR' | 'BUSINESS_ADMIN' | 'EMPLOYEE'

export interface RolePermissions {
  // Gestión de turnos
  canCreateShifts: boolean
  canEditShifts: boolean
  canDeleteShifts: boolean
  canEditOwnShifts: boolean
  
  // Gestión de empleados
  canViewAllEmployees: boolean
  canManageEmployees: boolean
  canAssignShifts: boolean
  
  // Gestión de ubicaciones
  canViewAllLocations: boolean
  canManageLocations: boolean
  locationAccess: string[] | 'all' // IDs de ubicaciones o 'all'
  
  // Días de descanso y licencias
  canManageRestDays: boolean
  canApproveLeaves: boolean
  canViewLeaves: boolean
  
  // Plantillas y validación
  canManageTemplates: boolean
  canBypassValidations: boolean
  canApproveSchedules: boolean
  
  // Reportes y analytics
  canViewReports: boolean
  canViewBudgets: boolean
  canExportData: boolean
  
  // Límites de visualización
  maxEmployeesVisible: number | 'unlimited'
  budgetVisibility: 'full' | 'summary' | 'none'
}

// ========== TIPOS DE EMPLEADOS ==========

export interface Employee {
  id: string
  name: string
  position: string
  locationId: string
  maxWeeklyHours: number
  hourlyRate: number
  skills: string[]
  availability: DayAvailability[]
  status?: 'active' | 'inactive' | 'on_leave'
  metadata?: {
    hireDate?: string
    department?: string
    emergencyContact?: EmergencyContact
  }
}

export interface DayAvailability {
  day: number // 0-6 (Sunday-Saturday)
  available: boolean
  startTime?: string
  endTime?: string
  restrictions?: string[]
  notes?: string
}

export interface EmergencyContact {
  name: string
  phone: string
  relationship: string
}

// ========== TIPOS DE TURNOS ==========

export type ShiftType = 'regular' | 'overtime' | 'night' | 'holiday'
export type ShiftStatus = 'draft' | 'confirmed' | 'published' | 'completed'

export interface ScheduleShift {
  id: string
  employeeId: string
  employeeName: string
  position: string
  locationId: string
  date: string // ISO date string (YYYY-MM-DD)
  startTime: string // HH:mm format
  endTime: string // HH:mm format
  duration: number // hours
  type: ShiftType
  status: ShiftStatus
  cost: number
  notes?: string
  templateId?: string
  crossesMidnight: boolean
  actualDate?: string // For night shifts that end the next day
  metadata?: {
    createdBy?: string
    createdAt?: string
    updatedBy?: string
    updatedAt?: string
    approvedBy?: string
    approvedAt?: string
  }
}

export interface CreateShiftData {
  employeeId: string
  employeeName: string
  position: string
  locationId: string
  date: string
  startTime: string
  endTime: string
  type?: ShiftType
  notes?: string
  templateId?: string
}

export interface UpdateShiftData extends Partial<CreateShiftData> {
  id: string
}

// ========== TIPOS DE PLANTILLAS ==========

export interface ShiftTemplate {
  id: string
  name: string
  startTime: string
  endTime: string
  duration: number
  type: ShiftType
  color: string
  description?: string
  crossesMidnight: boolean
  locationId?: string // Si es específica de una ubicación
  metadata?: {
    createdBy?: string
    isDefault?: boolean
    usageCount?: number
  }
}

// ========== TIPOS DE DÍAS DE DESCANSO ==========

export type RestDayType = 'weekly' | 'compensatory' | 'additional'
export type RestDayStatus = 'pending' | 'approved' | 'rejected'
export type CompensatoryReason = string

export interface RestDay {
  id: string
  employeeId: string
  employeeName: string
  date: string
  type: RestDayType
  reason?: CompensatoryReason
  notes?: string
  status: RestDayStatus
  metadata?: {
    createdBy?: string
    createdAt?: string
    approvedBy?: string
    approvedAt?: string
  }
}

export interface CreateRestDayData {
  employeeId: string
  employeeName: string
  date: string
  type: RestDayType
  reason?: CompensatoryReason
  notes?: string
}

// ========== TIPOS DE LICENCIAS ==========

export type LeaveType = 'vacation' | 'sick' | 'personal' | 'maternity' | 'emergency'
export type LeaveStatus = 'pending' | 'approved' | 'rejected' | 'cancelled'

export interface LeaveRequest {
  id: string
  employeeId: string
  employeeName: string
  type: LeaveType
  startDate: string
  endDate: string
  reason: string
  status: LeaveStatus
  attachments?: string[]
  metadata?: {
    requestedAt?: string
    reviewedBy?: string
    reviewedAt?: string
    comments?: string
  }
}

// ========== TIPOS DE UBICACIONES ==========

export interface Location {
  id: string
  name: string
  address: string
  employeeCount: number
  activeShifts: number
  weeklyBudget: number
  weeklySpent: number
  status: 'active' | 'inactive'
  metadata?: {
    manager?: string
    phone?: string
    timezone?: string
  }
}

// ========== TIPOS DE VALIDACIÓN ==========

export type ValidationSeverity = 'error' | 'warning' | 'info'
export type ValidationType = 
  | 'overtime' 
  | 'availability' 
  | 'overlap' 
  | 'understaffed' 
  | 'budget' 
  | 'rest_day' 
  | 'leave_conflict'
  | 'shift_gap'

export interface ValidationError {
  id: string
  type: ValidationType
  severity: ValidationSeverity
  message: string
  description?: string
  entityId?: string // ID del turno, empleado, etc. afectado
  entityType?: 'shift' | 'employee' | 'day'
  suggestions?: string[]
  canAutoFix?: boolean
}

export interface ValidationResult {
  isValid: boolean
  errors: ValidationError[]
  warnings: ValidationError[]
  summary: {
    totalErrors: number
    totalWarnings: number
    criticalErrors: number
    byType: Record<ValidationType, number>
  }
}

export interface ValidationConfig {
  maxWeeklyHours: number
  maxConsecutiveHours: number
  minimumRestBetweenShifts: number
  enforceRestDays: boolean
  enforceBudgetLimits: boolean
  budgetWarningThreshold: number
  enforceAvailability: boolean
  allowOvertimeApproval: boolean
}

// ========== TIPOS DE MÉTRICAS ==========

export interface ScheduleMetrics {
  weeklyHours: number
  weeklyCost: number
  employeeCount: number
  budgetUtilization: number
  budgetStatus: 'success' | 'warning' | 'danger'
  overtimeHours?: number
  nightHours?: number
  holidayHours?: number
}

export interface EmployeeMetrics {
  employeeId: string
  weeklyHours: number
  weeklyCost: number
  efficiency: number
  overtimeHours: number
  restDaysAssigned: number
  shiftsCount: number
  avgShiftDuration: number
}

export interface DailySummary {
  date: string
  totalShifts: number
  totalHours: number
  totalCost: number
  employeesScheduled: number
  coverage: number // percentage
}

export interface WeekSummary {
  weekRange: string
  metrics: ScheduleMetrics
  totalShifts: number
  budgetRemaining: number
  dailySummary: DailySummary[]
  employeeSummary: EmployeeMetrics[]
  specialDays: SpecialDay[]
}

export interface SpecialDay {
  date: string
  type: 'holiday' | 'sunday' | 'special_event'
  name: string
  multiplier?: number
}

// ========== TIPOS DE CONTEXTO ==========

export interface SchedulingContext {
  user: {
    id: string
    name: string
    role: UserRole
    locationId?: string
    permissions: RolePermissions
  }
  week: {
    startDate: string
    endDate: string
    dates: Date[]
  }
  location: {
    current: string | 'all'
    available: Location[]
  }
  settings: {
    validation: ValidationConfig
    budget: {
      weeklyLimit: number
      alertThreshold: number
    }
  }
}

// ========== TIPOS DE ACCIONES ==========

export type ScheduleAction = 
  | { type: 'CREATE_SHIFT'; payload: CreateShiftData }
  | { type: 'UPDATE_SHIFT'; payload: UpdateShiftData }
  | { type: 'DELETE_SHIFT'; payload: { id: string } }
  | { type: 'SET_WEEK'; payload: { startDate: string } }
  | { type: 'SET_LOCATION'; payload: { locationId: string } }
  | { type: 'VALIDATE_SCHEDULE'; payload: { shifts: ScheduleShift[] } }

// ========== TIPOS DE SERVICIOS ==========

export interface ScheduleServiceConfig {
  apiBaseUrl?: string
  enableValidation?: boolean
  enablePermissions?: boolean
  cacheTimeout?: number
}

export interface ServiceResponse<T> {
  data?: T
  error?: string
  status: 'success' | 'error' | 'loading'
}

// ========== TIPOS DE HOOKS ==========

export interface UseScheduleResult {
  // Estado
  shifts: ScheduleShift[]
  employees: Employee[]
  templates: ShiftTemplate[]
  restDays: RestDay[]
  leaves: LeaveRequest[]
  validation: ValidationResult
  metrics: ScheduleMetrics
  isLoading: boolean
  
  // Acciones
  createShift: (data: CreateShiftData) => Promise<ScheduleShift>
  updateShift: (data: UpdateShiftData) => Promise<ScheduleShift>
  deleteShift: (id: string) => Promise<void>
  validateSchedule: () => Promise<ValidationResult>
  
  // Estado de selección
  selectedShift?: ScheduleShift
  setSelectedShift: (shift: ScheduleShift | null) => void
  
  // Utilidades
  canPerformAction: (action: string) => boolean
  getFilteredData: () => {
    employees: Employee[]
    shifts: ScheduleShift[]
    locations: Location[]
  }
}

// ========== EXPORTS ==========

export type {
  // Re-exportar todos los tipos para fácil acceso
}

// Tipos de constantes
export const SHIFT_TYPES: ShiftType[] = ['regular', 'overtime', 'night', 'holiday']
export const SHIFT_STATUSES: ShiftStatus[] = ['draft', 'confirmed', 'published', 'completed']
export const USER_ROLES: UserRole[] = ['SUPERVISOR', 'BUSINESS_ADMIN', 'EMPLOYEE']