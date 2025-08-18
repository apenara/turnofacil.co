/**
 * Tipos Unificados para el Sistema de Requests/Solicitudes
 * @fileoverview Tipos compartidos entre todos los dashboards y roles
 */

// ========== TIPOS DE ROLES Y PERMISOS ==========

export type UserRole = 'SUPERVISOR' | 'BUSINESS_ADMIN' | 'EMPLOYEE'

export interface RequestPermissions {
  // Crear y gestionar requests
  canCreateRequest: boolean
  canEditOwnRequest: boolean
  canDeleteOwnRequest: boolean
  canViewOwnRequests: boolean
  
  // Ver requests de otros
  canViewTeamRequests: boolean
  canViewAllRequests: boolean
  canViewAllLocations: boolean
  
  // Aprobaciones y decisiones
  canApproveRequests: boolean
  canRejectRequests: boolean
  canEscalateRequests: boolean
  canMakeFinalDecision: boolean
  
  // Acciones especiales
  canBulkApprove: boolean
  canBulkReject: boolean
  canEditRequestComments: boolean
  canViewRequestAnalytics: boolean
  canManageRequestTypes: boolean
  
  // Límites de acceso
  locationAccess: string[] | 'all'
  requestTypeAccess: RequestType[] | 'all'
  maxRequestsPerMonth?: number
}

// ========== TIPOS DE REQUESTS ==========

export type RequestType = 
  | 'shift_change'    // Cambio de turno
  | 'vacation'        // Vacaciones
  | 'sick_leave'      // Incapacidad médica
  | 'personal_leave'  // Permiso personal
  | 'time_off'        // Día libre
  | 'absence'         // Reporte de ausencia
  | 'overtime'        // Horas extra
  | 'early_leave'     // Salida temprana
  | 'late_arrival'    // Llegada tardía

export type RequestStatus = 
  | 'draft'           // Borrador (no enviada)
  | 'pending'         // Pendiente de revisión
  | 'under_review'    // En revisión
  | 'approved'        // Aprobada
  | 'rejected'        // Rechazada
  | 'cancelled'       // Cancelada por el empleado
  | 'expired'         // Expirada por tiempo

export type RequestPriority = 
  | 'low'             // Baja - No urgente
  | 'medium'          // Media - Rutinaria
  | 'high'            // Alta - Importante
  | 'urgent'          // Urgente - Requiere atención inmediata
  | 'emergency'       // Emergencia - Crítica

export type ApprovalStage = 
  | 'employee'        // Creada por empleado
  | 'supervisor'      // En revisión de supervisor
  | 'business_admin'  // En revisión de business admin
  | 'completed'       // Proceso completado
  | 'escalated'       // Escalada por conflicto

export type ApprovalDecision = 'approved' | 'rejected' | 'needs_info' | 'escalated'

// ========== INTERFACES PRINCIPALES ==========

/**
 * Request base con información común
 */
export interface BaseRequest {
  id: string
  employeeId: string
  employeeName: string
  employeeEmail?: string
  employeePosition: string
  locationId: string
  locationName: string
  
  // Tipo y estado
  type: RequestType
  status: RequestStatus
  priority: RequestPriority
  
  // Fechas importantes
  submittedDate: string
  requestedDate?: string      // Para requests de un día específico
  startDate?: string          // Para requests con rango de fechas
  endDate?: string
  
  // Contenido de la request
  reason: string
  description?: string
  attachments?: RequestAttachment[]
  
  // Metadata
  metadata?: {
    createdAt: string
    updatedAt?: string
    expiresAt?: string        // Para requests con tiempo límite
    version: number           // Para control de versiones
    tags?: string[]          // Para categorización adicional
  }
}

/**
 * Información específica por tipo de request
 */
export interface RequestDetails {
  // Para cambios de turno
  shiftChange?: {
    originalShift: ShiftInfo
    requestedShift: ShiftInfo
    replacementEmployeeId?: string
    replacementEmployeeName?: string
    swapApproved?: boolean
  }
  
  // Para ausencias y licencias
  timeOff?: {
    totalDays: number
    includesToday: boolean
    isConsecutive: boolean
    affectsSchedule: boolean
    medicalCertificateRequired: boolean
    medicalCertificateProvided: boolean
  }
  
  // Para horas extra
  overtime?: {
    requestedHours: number
    justification: string
    budgetImpact: number
    preApprovalRequired: boolean
  }
  
  // Para llegadas tardías/salidas tempranas
  scheduleAdjustment?: {
    originalTime: string
    requestedTime: string
    impactOnOperations: 'none' | 'minimal' | 'moderate' | 'significant'
    coverageNeeded: boolean
  }
}

/**
 * Información de turno para cambios
 */
export interface ShiftInfo {
  date: string
  startTime: string
  endTime: string
  position?: string
  locationId?: string
  notes?: string
}

/**
 * Archivo adjunto a una request
 */
export interface RequestAttachment {
  id: string
  fileName: string
  fileSize: number
  fileType: string
  url: string
  uploadedAt: string
  uploadedBy: string
  description?: string
}

/**
 * Flujo de aprobación completo
 */
export interface ApprovalFlow {
  currentStage: ApprovalStage
  isEscalated: boolean
  requiresFinalApproval: boolean
  
  // Decisiones por etapa
  supervisorReview?: ApprovalReview
  businessAdminReview?: ApprovalReview
  
  // Historial de cambios
  approvalHistory: ApprovalReview[]
  
  // Configuración del flujo
  flowConfig: {
    requiresSupervisorApproval: boolean
    requiresBusinessAdminApproval: boolean
    autoEscalationRules?: EscalationRule[]
  }
}

/**
 * Revisión/decisión de aprobación
 */
export interface ApprovalReview {
  id: string
  reviewerId: string
  reviewerName: string
  reviewerRole: UserRole
  
  decision: ApprovalDecision
  comments?: string
  reviewedAt: string
  
  // Información adicional
  reviewDuration?: number     // Tiempo en revisar (minutos)
  delegatedTo?: string       // Si se delegó la decisión
  tags?: string[]           // Etiquetas del revisor
}

/**
 * Regla de escalación automática
 */
export interface EscalationRule {
  id: string
  name: string
  condition: EscalationCondition
  action: EscalationAction
  isActive: boolean
}

export interface EscalationCondition {
  timeBasedTrigger?: {
    hoursWithoutResponse: number
    businessHoursOnly: boolean
  }
  priorityBasedTrigger?: {
    priorities: RequestPriority[]
    immediateEscalation: boolean
  }
  typeBasedTrigger?: {
    requestTypes: RequestType[]
    skipSupervisorReview: boolean
  }
}

export interface EscalationAction {
  escalateTo: ApprovalStage
  notifyUsers: string[]
  changePriority?: RequestPriority
  addTags?: string[]
  setDeadline?: number // horas
}

/**
 * Request completa con todos los detalles
 */
export interface TeamRequest extends BaseRequest {
  details: RequestDetails
  approvalFlow: ApprovalFlow
  
  // Campos calculados
  calculatedFields?: {
    daysUntilExpiry?: number
    budgetImpact?: number
    coverageImpact?: 'none' | 'low' | 'medium' | 'high'
    approvalProbability?: number // 0-100
    businessImpact?: 'minimal' | 'moderate' | 'significant' | 'critical'
  }
}

/**
 * Datos para crear una nueva request
 */
export interface CreateRequestData {
  type: RequestType
  priority?: RequestPriority
  requestedDate?: string
  startDate?: string
  endDate?: string
  reason: string
  description?: string
  details?: Partial<RequestDetails>
  attachments?: File[]
  
  // Configuración del flujo
  skipSupervisorReview?: boolean
  requiresUrgentReview?: boolean
}

/**
 * Datos para actualizar una request existente
 */
export interface UpdateRequestData extends Partial<CreateRequestData> {
  id: string
  status?: RequestStatus
  priority?: RequestPriority
  
  // Solo para managers/admins
  approverComments?: string
  decision?: ApprovalDecision
  escalate?: boolean
}

// ========== TIPOS DE EMPLEADOS ==========

export interface Employee {
  id: string
  name: string
  email: string
  position: string
  locationId: string
  departmentId?: string
  
  // Información de requests
  requestLimits: {
    maxRequestsPerMonth: number
    maxConsecutiveDaysOff: number
    minAdvanceNoticeDays: number
    vacationDaysRemaining: number
    sickDaysUsed: number
  }
  
  // Manager/Supervisor asignado
  supervisorId?: string
  supervisorName?: string
  
  status: 'active' | 'inactive' | 'on_leave'
}

// ========== TIPOS DE UBICACIONES ==========

export interface Location {
  id: string
  name: string
  address: string
  
  // Configuración de requests
  requestConfig: {
    requiresAdvanceNotice: boolean
    advanceNoticeDays: number
    allowsSamedayRequests: boolean
    businessHours: {
      start: string
      end: string
      timezone: string
    }
    blackoutDates?: string[] // Fechas donde no se permiten requests
  }
  
  // Personal asignado
  supervisorId?: string
  employeeCount: number
  
  status: 'active' | 'inactive'
}

// ========== TIPOS DE MÉTRICAS ==========

export interface RequestMetrics {
  // Contadores generales
  totalRequests: number
  pendingRequests: number
  approvedRequests: number
  rejectedRequests: number
  
  // Por tiempo
  requestsThisWeek: number
  requestsThisMonth: number
  averageApprovalTime: number // en horas
  
  // Por tipo
  requestsByType: Record<RequestType, number>
  requestsByPriority: Record<RequestPriority, number>
  
  // Por estado del proceso
  requestsByStage: Record<ApprovalStage, number>
  escalationRate: number // porcentaje
  
  // Tendencias
  approvalRate: number // porcentaje
  rejectionRate: number // porcentaje
  cancellationRate: number // porcentaje
}

export interface RequestAnalytics {
  // Análisis temporal
  trends: {
    weeklyTrends: Array<{ week: string; count: number }>
    monthlyTrends: Array<{ month: string; count: number }>
    seasonalPatterns: Array<{ season: string; avgRequests: number }>
  }
  
  // Análisis por empleado
  employeeAnalytics: Array<{
    employeeId: string
    employeeName: string
    totalRequests: number
    approvalRate: number
    averagePriority: number
    mostCommonTypes: RequestType[]
  }>
  
  // Análisis por ubicación
  locationAnalytics: Array<{
    locationId: string
    locationName: string
    totalRequests: number
    averageApprovalTime: number
    mostCommonReasons: string[]
  }>
  
  // Predicciones
  predictions?: {
    expectedRequestsNextWeek: number
    busyPeriodsPredicted: Array<{ date: string; probability: number }>
    resourceNeeds: Array<{ role: string; additionalHours: number }>
  }
}

// ========== TIPOS DE CONTEXTO ==========

export interface RequestContext {
  user: {
    id: string
    name: string
    email: string
    role: UserRole
    locationId?: string
    permissions: RequestPermissions
  }
  
  location: {
    current: string | 'all'
    available: Location[]
  }
  
  settings: {
    approvalFlow: {
      autoEscalationEnabled: boolean
      escalationTimeoutHours: number
      requiresBusinessAdminApproval: RequestType[]
    }
    
    notifications: {
      emailNotifications: boolean
      pushNotifications: boolean
      reminderIntervals: number[] // en horas
    }
    
    limits: {
      maxAttachmentSize: number // en MB
      maxAttachmentsPerRequest: number
      maxDescriptionLength: number
    }
  }
}

// ========== TIPOS DE SERVICIOS ==========

export interface RequestServiceConfig {
  apiBaseUrl?: string
  enableValidation?: boolean
  enablePermissions?: boolean
  cacheTimeout?: number
  enableAnalytics?: boolean
}

export interface ServiceResponse<T> {
  data?: T
  error?: string
  status: 'success' | 'error' | 'loading'
  metadata?: {
    total?: number
    page?: number
    limit?: number
    hasMore?: boolean
  }
}

// ========== TIPOS DE HOOKS ==========

export interface UseRequestsResult {
  // Estado
  requests: TeamRequest[]
  selectedRequest: TeamRequest | null
  metrics: RequestMetrics
  analytics?: RequestAnalytics
  isLoading: boolean
  error: string | null
  
  // Acciones CRUD
  createRequest: (data: CreateRequestData) => Promise<TeamRequest>
  updateRequest: (data: UpdateRequestData) => Promise<TeamRequest>
  deleteRequest: (id: string) => Promise<void>
  
  // Acciones de aprobación
  approveRequest: (id: string, comments?: string) => Promise<void>
  rejectRequest: (id: string, comments: string) => Promise<void>
  escalateRequest: (id: string, reason?: string) => Promise<void>
  
  // Acciones en masa
  bulkApprove: (ids: string[], comments?: string) => Promise<void>
  bulkReject: (ids: string[], comments: string) => Promise<void>
  
  // Estado de selección
  setSelectedRequest: (request: TeamRequest | null) => void
  
  // Filtros y búsqueda
  filters: RequestFilters
  setFilters: (filters: Partial<RequestFilters>) => void
  
  // Utilidades
  canPerformAction: (action: string, request?: TeamRequest) => boolean
  getFilteredRequests: () => TeamRequest[]
}

export interface RequestFilters {
  status: RequestStatus[] | 'all'
  type: RequestType[] | 'all'
  priority: RequestPriority[] | 'all'
  location: string[] | 'all'
  employee: string[] | 'all'
  dateRange: {
    start?: string
    end?: string
  }
  searchTerm: string
  sortBy: 'date' | 'priority' | 'status' | 'employee' | 'type'
  sortOrder: 'asc' | 'desc'
}

// ========== CONSTANTES TIPADAS ==========

export const REQUEST_TYPES: RequestType[] = [
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

export const REQUEST_STATUSES: RequestStatus[] = [
  'draft',
  'pending',
  'under_review',
  'approved',
  'rejected',
  'cancelled',
  'expired'
]

export const REQUEST_PRIORITIES: RequestPriority[] = [
  'low',
  'medium', 
  'high',
  'urgent',
  'emergency'
]

export const USER_ROLES: UserRole[] = [
  'SUPERVISOR',
  'BUSINESS_ADMIN', 
  'EMPLOYEE'
]