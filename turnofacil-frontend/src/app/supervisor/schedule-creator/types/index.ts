/**
 * Exportaciones centralizadas de todos los tipos
 * @fileoverview Punto de entrada único para todos los tipos del schedule creator
 */

// Tipos de empleados
export type {
  DayAvailability,
  Employee,
  EmployeeStatus,
  EmployeeCalendarInfo
} from './employee.types'

// Tipos de horarios
export type {
  ShiftType,
  ShiftStatus,
  ShiftTemplate,
  ScheduleShift,
  ScheduleMetrics,
  WeekConfig,
  CreateShiftData,
  CreateShiftFullData,
  UpdateShiftData,
  UpdateShiftFullData,
  ShiftValidationData,
  DailySummary,
  EmployeeSummary,
  SpecialDay,
  WeekSummary
} from './schedule.types'

// Tipos de días de descanso
export type {
  RestDayType,
  RestDayStatus,
  CompensatoryReason,
  RestDay,
  SundayWorkType,
  AlertPriority,
  CompensatoryAlert,
  RestDayConfig,
  CreateRestDayData,
  RestDayCompliance
} from './restDay.types'

// Tipos de validación
export type {
  ValidationErrorType,
  ValidationSeverity,
  ValidationError,
  ValidationResult,
  ValidationConfig,
  ValidationContext
} from './validation.types'

// Tipos de presupuesto (para compatibilidad)
export interface BudgetPeriod {
  id: string
  year: number
  month?: number
  quarter?: number
  amount: number
  allocated: number
  spent: number
}

export interface Location {
  id: string
  name: string
  address: string
  employeeCount: number
  activeShifts: number
  weeklyBudget: number
  weeklySpent: number
  budget?: {
    type: 'weekly' | 'monthly' | 'quarterly' | 'annual'
    periods: BudgetPeriod[]
    autoDistribute: boolean
    alertThreshold: number
  }
}

// Tipos de licencias
export type LeaveType = 'vacation' | 'sick' | 'maternity' | 'paternity' | 'personal' | 'emergency' | 'bereavement' | 'study' | 'unpaid'
export type LeaveStatus = 'pending' | 'approved' | 'rejected'

export interface LeaveRequest {
  id: string
  employeeId: string
  employeeName: string
  type: LeaveType
  startDate: string
  endDate: string
  status: LeaveStatus
  reason: string
  requestDate: string
  requestedBy: string
  requestedAt: string
  updatedAt?: string
  approvedBy?: string
  approvedDate?: string
  approvedAt?: string
  notes?: string
}