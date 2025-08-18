/**
 * Constantes del Sistema de Requests
 * @fileoverview Constantes centralizadas para todo el sistema de requests
 */

import { 
  RequestType, 
  RequestStatus, 
  RequestPriority, 
  UserRole,
  ApprovalStage
} from './types'

// ========== CONSTANTES DE TIPOS DE REQUESTS ==========

export const REQUEST_TYPE_CONFIG = {
  shift_change: {
    name: 'Cambio de turno',
    description: 'Solicitud para cambiar horario de trabajo',
    icon: '🔄',
    color: '#3B82F6',
    requiresApproval: true,
    requiresSupervisorApproval: true,
    requiresBusinessAdminApproval: false,
    defaultPriority: 'medium' as RequestPriority,
    maxAdvanceDays: 30,
    minAdvanceDays: 1,
    canBeUrgent: true,
    requiredFields: ['originalShift', 'requestedShift', 'reason'],
    attachmentsAllowed: false
  },
  
  vacation: {
    name: 'Vacaciones',
    description: 'Solicitud de días de vacaciones',
    icon: '🏖️',
    color: '#10B981',
    requiresApproval: true,
    requiresSupervisorApproval: true,
    requiresBusinessAdminApproval: true, // Vacaciones siempre requieren aprobación final
    defaultPriority: 'low' as RequestPriority,
    maxAdvanceDays: 365,
    minAdvanceDays: 15, // 15 días de anticipación mínima
    canBeUrgent: false,
    requiredFields: ['startDate', 'endDate', 'reason'],
    attachmentsAllowed: false
  },
  
  sick_leave: {
    name: 'Incapacidad médica',
    description: 'Reporte de incapacidad por enfermedad',
    icon: '🏥',
    color: '#EF4444',
    requiresApproval: true,
    requiresSupervisorApproval: false, // Incapacidades pueden ser auto-aprobadas con certificado
    requiresBusinessAdminApproval: false,
    defaultPriority: 'high' as RequestPriority,
    maxAdvanceDays: 0, // Solo retrospectivas o mismo día
    minAdvanceDays: 0,
    canBeUrgent: true,
    requiredFields: ['startDate', 'reason'],
    attachmentsAllowed: true,
    requiredAttachments: true // Certificado médico obligatorio
  },
  
  personal_leave: {
    name: 'Permiso personal',
    description: 'Solicitud de permiso por motivos personales',
    icon: '👤',
    color: '#8B5CF6',
    requiresApproval: true,
    requiresSupervisorApproval: true,
    requiresBusinessAdminApproval: false,
    defaultPriority: 'medium' as RequestPriority,
    maxAdvanceDays: 60,
    minAdvanceDays: 3,
    canBeUrgent: true,
    requiredFields: ['requestedDate', 'reason'],
    attachmentsAllowed: true
  },
  
  time_off: {
    name: 'Día libre',
    description: 'Solicitud de día libre compensatorio',
    icon: '📅',
    color: '#F59E0B',
    requiresApproval: true,
    requiresSupervisorApproval: true,
    requiresBusinessAdminApproval: false,
    defaultPriority: 'medium' as RequestPriority,
    maxAdvanceDays: 30,
    minAdvanceDays: 1,
    canBeUrgent: true,
    requiredFields: ['requestedDate', 'reason'],
    attachmentsAllowed: false
  },
  
  absence: {
    name: 'Reporte de ausencia',
    description: 'Reporte de ausencia no planificada',
    icon: '⚠️',
    color: '#DC2626',
    requiresApproval: false, // Solo es informativo
    requiresSupervisorApproval: false,
    requiresBusinessAdminApproval: false,
    defaultPriority: 'urgent' as RequestPriority,
    maxAdvanceDays: 0, // Solo mismo día o retrospectivo
    minAdvanceDays: 0,
    canBeUrgent: true,
    requiredFields: ['date', 'reason'],
    attachmentsAllowed: true
  },
  
  overtime: {
    name: 'Horas extra',
    description: 'Solicitud de horas extra',
    icon: '⏰',
    color: '#0D9488',
    requiresApproval: true,
    requiresSupervisorApproval: true,
    requiresBusinessAdminApproval: true, // Horas extra requieren aprobación presupuestal
    defaultPriority: 'medium' as RequestPriority,
    maxAdvanceDays: 14,
    minAdvanceDays: 1,
    canBeUrgent: false,
    requiredFields: ['date', 'requestedHours', 'justification'],
    attachmentsAllowed: false
  },
  
  early_leave: {
    name: 'Salida temprana',
    description: 'Solicitud para salir antes del horario',
    icon: '🚪',
    color: '#7C3AED',
    requiresApproval: true,
    requiresSupervisorApproval: true,
    requiresBusinessAdminApproval: false,
    defaultPriority: 'medium' as RequestPriority,
    maxAdvanceDays: 7,
    minAdvanceDays: 0,
    canBeUrgent: true,
    requiredFields: ['date', 'requestedTime', 'reason'],
    attachmentsAllowed: false
  },
  
  late_arrival: {
    name: 'Llegada tardía',
    description: 'Notificación de llegada tardía',
    icon: '⏱️',
    color: '#EA580C',
    requiresApproval: false, // Solo informativo
    requiresSupervisorApproval: false,
    requiresBusinessAdminApproval: false,
    defaultPriority: 'medium' as RequestPriority,
    maxAdvanceDays: 1,
    minAdvanceDays: 0,
    canBeUrgent: false,
    requiredFields: ['date', 'estimatedArrival', 'reason'],
    attachmentsAllowed: false
  }
} as const

// ========== CONSTANTES DE ESTADOS ==========

export const REQUEST_STATUS_CONFIG = {
  draft: {
    name: 'Borrador',
    description: 'Request guardada pero no enviada',
    color: '#6B7280',
    icon: '📝',
    isActive: true,
    canEdit: true,
    canDelete: true,
    canTransitionTo: ['pending', 'cancelled']
  },
  
  pending: {
    name: 'Pendiente',
    description: 'Esperando revisión',
    color: '#F59E0B',
    icon: '⏳',
    isActive: true,
    canEdit: false,
    canDelete: false,
    canTransitionTo: ['under_review', 'approved', 'rejected', 'cancelled', 'expired']
  },
  
  under_review: {
    name: 'En revisión',
    description: 'Siendo revisada por supervisor/admin',
    color: '#3B82F6',
    icon: '👀',
    isActive: true,
    canEdit: false,
    canDelete: false,
    canTransitionTo: ['approved', 'rejected', 'pending', 'expired']
  },
  
  approved: {
    name: 'Aprobada',
    description: 'Request aprobada y activa',
    color: '#10B981',
    icon: '✅',
    isActive: false,
    canEdit: false,
    canDelete: false,
    canTransitionTo: ['cancelled'] // Solo el empleado puede cancelar después
  },
  
  rejected: {
    name: 'Rechazada',
    description: 'Request rechazada con comentarios',
    color: '#EF4444',
    icon: '❌',
    isActive: false,
    canEdit: false,
    canDelete: true,
    canTransitionTo: [] // Estado final
  },
  
  cancelled: {
    name: 'Cancelada',
    description: 'Cancelada por el empleado',
    color: '#6B7280',
    icon: '🚫',
    isActive: false,
    canEdit: false,
    canDelete: true,
    canTransitionTo: [] // Estado final
  },
  
  expired: {
    name: 'Expirada',
    description: 'Expirada por falta de acción',
    color: '#9CA3AF',
    icon: '⏰',
    isActive: false,
    canEdit: false,
    canDelete: true,
    canTransitionTo: [] // Estado final
  }
} as const

// ========== CONSTANTES DE PRIORIDADES ==========

export const REQUEST_PRIORITY_CONFIG = {
  low: {
    name: 'Baja',
    description: 'No urgente, tiempo flexible',
    color: '#10B981',
    icon: '🟢',
    escalationHours: 120, // 5 días
    reminderIntervals: [72, 24], // 3 días y 1 día antes
    sortOrder: 1
  },
  
  medium: {
    name: 'Media',
    description: 'Prioridad normal',
    color: '#F59E0B',
    icon: '🟡',
    escalationHours: 48, // 2 días
    reminderIntervals: [24, 4], // 1 día y 4 horas antes
    sortOrder: 2
  },
  
  high: {
    name: 'Alta',
    description: 'Importante, requiere atención pronta',
    color: '#EF4444',
    icon: '🟠',
    escalationHours: 24, // 1 día
    reminderIntervals: [12, 2], // 12 y 2 horas antes
    sortOrder: 3
  },
  
  urgent: {
    name: 'Urgente',
    description: 'Requiere atención inmediata',
    color: '#DC2626',
    icon: '🔴',
    escalationHours: 4, // 4 horas
    reminderIntervals: [2, 0.5], // 2 horas y 30 min antes
    sortOrder: 4
  },
  
  emergency: {
    name: 'Emergencia',
    description: 'Situación crítica, acción inmediata',
    color: '#991B1B',
    icon: '🚨',
    escalationHours: 1, // 1 hora
    reminderIntervals: [0.5, 0.25], // 30 y 15 min antes
    sortOrder: 5
  }
} as const

// ========== CONSTANTES DE CONFIGURACIÓN ==========

export const REQUEST_CONFIG = {
  // Límites generales
  MAX_DESCRIPTION_LENGTH: 500,
  MAX_REASON_LENGTH: 100,
  MAX_ATTACHMENTS_PER_REQUEST: 3,
  MAX_ATTACHMENT_SIZE_MB: 5,
  
  // Formatos de archivo permitidos
  ALLOWED_FILE_TYPES: [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/gif',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ],
  
  // Extensiones permitidas
  ALLOWED_FILE_EXTENSIONS: ['.pdf', '.jpg', '.jpeg', '.png', '.gif', '.doc', '.docx'],
  
  // Configuración de notificaciones
  NOTIFICATION_CONFIG: {
    emailEnabled: true,
    pushEnabled: true,
    smsEnabled: false,
    
    // Intervalos de recordatorios (en horas)
    reminderIntervals: {
      beforeExpiration: [24, 4, 1],
      afterSubmission: [0.25], // 15 minutos después de enviar
      weeklyDigest: 168 // Una vez por semana
    },
    
    // Destinatarios por evento
    recipients: {
      requestSubmitted: ['supervisor', 'employee'],
      requestApproved: ['employee'],
      requestRejected: ['employee'],
      requestEscalated: ['business_admin', 'supervisor', 'employee'],
      requestExpiring: ['supervisor', 'business_admin']
    }
  },
  
  // Configuración de escalación automática
  ESCALATION_CONFIG: {
    enabled: true,
    
    // Reglas por tipo de request
    rules: {
      vacation: {
        escalateAfterHours: 48,
        escalateTo: 'business_admin',
        requiresJustification: false
      },
      sick_leave: {
        escalateAfterHours: 2, // Incapacidades son urgentes
        escalateTo: 'business_admin',
        requiresJustification: false
      },
      overtime: {
        escalateAfterHours: 24,
        escalateTo: 'business_admin',
        requiresJustification: true // Impacto presupuestal
      },
      emergency: {
        escalateAfterHours: 1,
        escalateTo: 'business_admin',
        requiresJustification: false
      }
    },
    
    // Configuración por prioridad
    priorityMultipliers: {
      low: 1.0,
      medium: 0.8,
      high: 0.5,
      urgent: 0.25,
      emergency: 0.1
    }
  }
} as const

// ========== CONFIGURACIÓN POR ROL ==========

export const ROLE_CONFIG = {
  EMPLOYEE: {
    defaultView: 'my-requests',
    availableViews: ['my-requests', 'create-request'],
    maxRequestsPerMonth: 10,
    maxPendingRequests: 3,
    canCreateTypes: 'all' as const,
    autoApprovalTypes: [], // Ningún tipo se auto-aprueba para empleados
    
    ui: {
      compactMode: true,
      showMetrics: false,
      showAnalytics: false,
      showBulkActions: false,
      maxTabsVisible: 2
    }
  },
  
  SUPERVISOR: {
    defaultView: 'team-requests',
    availableViews: ['team-requests', 'my-requests', 'create-request', 'analytics'],
    maxRequestsPerMonth: 25,
    maxPendingRequests: 10,
    canCreateTypes: 'all' as const,
    autoApprovalTypes: ['late_arrival', 'early_leave'], // Pueden auto-aprobar algunos tipos
    
    ui: {
      compactMode: false,
      showMetrics: true,
      showAnalytics: true,
      showBulkActions: true,
      maxTabsVisible: 4
    }
  },
  
  BUSINESS_ADMIN: {
    defaultView: 'all-requests',
    availableViews: ['all-requests', 'team-requests', 'my-requests', 'analytics', 'settings'],
    maxRequestsPerMonth: undefined, // Sin límite
    maxPendingRequests: undefined, // Sin límite
    canCreateTypes: 'all' as const,
    autoApprovalTypes: 'all' as const, // Puede configurar auto-aprobaciones
    
    ui: {
      compactMode: false,
      showMetrics: true,
      showAnalytics: true,
      showBulkActions: true,
      maxTabsVisible: 6
    }
  }
} as const

// ========== CONSTANTES DE VALIDACIÓN ==========

export const VALIDATION_RULES = {
  // Reglas de fechas
  dateRules: {
    maxFutureMonths: 12, // No más de 12 meses en el futuro
    weekendsAllowed: true,
    holidaysAllowed: false,
    blackoutPeriods: [] // Se configura por ubicación
  },
  
  // Reglas por tipo
  typeSpecificRules: {
    vacation: {
      minConsecutiveDays: 5,
      maxConsecutiveDays: 30,
      maxPerYear: 15, // Días de vacaciones por año
      mustBeConsecutive: false
    },
    
    sick_leave: {
      maxWithoutCertificate: 3,
      certificateRequired: true,
      retroactiveAllowed: true,
      maxRetroactiveDays: 30
    },
    
    shift_change: {
      requiresReplacement: true,
      samePositionOnly: false,
      minNoticeDays: 1,
      maxChangesPerMonth: 4
    }
  },
  
  // Mensajes de error
  errorMessages: {
    INVALID_DATE_RANGE: 'El rango de fechas no es válido',
    INSUFFICIENT_ADVANCE_NOTICE: 'No hay suficiente tiempo de anticipación',
    EXCEEDS_MONTHLY_LIMIT: 'Excede el límite mensual de solicitudes',
    OVERLAPPING_REQUEST: 'Ya existe una solicitud para estas fechas',
    MISSING_REQUIRED_FIELD: 'Falta información requerida',
    INVALID_FILE_TYPE: 'Tipo de archivo no permitido',
    FILE_TOO_LARGE: 'El archivo es demasiado grande',
    BLACKOUT_PERIOD: 'No se permiten solicitudes en este período'
  }
} as const

// ========== CONSTANTES DE ANALYTICS ==========

export const ANALYTICS_CONFIG = {
  // Métricas por defecto
  defaultMetrics: [
    'total_requests',
    'pending_requests', 
    'approval_rate',
    'average_approval_time',
    'requests_by_type',
    'requests_by_priority',
    'escalation_rate'
  ],
  
  // Períodos de análisis
  analysisPeriods: {
    daily: 1,
    weekly: 7,
    monthly: 30,
    quarterly: 90,
    yearly: 365
  },
  
  // Configuración de reportes
  reports: {
    employee_summary: {
      name: 'Resumen por empleado',
      fields: ['total_requests', 'approval_rate', 'most_common_types'],
      frequency: 'monthly'
    },
    
    location_analysis: {
      name: 'Análisis por ubicación', 
      fields: ['request_volume', 'approval_times', 'common_reasons'],
      frequency: 'weekly'
    },
    
    trend_analysis: {
      name: 'Análisis de tendencias',
      fields: ['weekly_trends', 'seasonal_patterns', 'predictions'],
      frequency: 'monthly'
    }
  }
} as const

// ========== MENSAJES Y TEXTOS ==========

export const UI_MESSAGES = {
  // Mensajes de éxito
  success: {
    REQUEST_CREATED: 'Solicitud creada exitosamente',
    REQUEST_UPDATED: 'Solicitud actualizada exitosamente',
    REQUEST_APPROVED: 'Solicitud aprobada exitosamente',
    REQUEST_REJECTED: 'Solicitud rechazada',
    REQUEST_CANCELLED: 'Solicitud cancelada',
    BULK_APPROVED: 'Solicitudes aprobadas en lote',
    BULK_REJECTED: 'Solicitudes rechazadas en lote'
  },
  
  // Mensajes de error
  error: {
    REQUEST_NOT_FOUND: 'Solicitud no encontrada',
    INSUFFICIENT_PERMISSIONS: 'No tienes permisos para esta acción',
    VALIDATION_FAILED: 'Error de validación',
    SERVER_ERROR: 'Error del servidor',
    NETWORK_ERROR: 'Error de conexión',
    FILE_UPLOAD_FAILED: 'Error al subir archivo',
    BULK_ACTION_FAILED: 'Error en acción masiva'
  },
  
  // Mensajes informativos
  info: {
    REQUEST_PENDING_APPROVAL: 'Tu solicitud está pendiente de aprobación',
    REQUEST_ESCALATED: 'La solicitud ha sido escalada',
    AUTO_REMINDER_SENT: 'Recordatorio enviado automáticamente',
    APPROACHING_LIMIT: 'Te acercas al límite mensual de solicitudes',
    NO_REQUESTS_FOUND: 'No se encontraron solicitudes'
  },
  
  // Mensajes de confirmación
  confirmation: {
    DELETE_REQUEST: '¿Estás seguro de eliminar esta solicitud?',
    CANCEL_REQUEST: '¿Estás seguro de cancelar esta solicitud?',
    BULK_APPROVE: '¿Aprobar todas las solicitudes seleccionadas?',
    BULK_REJECT: '¿Rechazar todas las solicitudes seleccionadas?',
    ESCALATE_REQUEST: '¿Escalar esta solicitud al nivel superior?'
  }
} as const

// ========== EXPORTS TIPADOS ==========

export type RequestTypeKey = keyof typeof REQUEST_TYPE_CONFIG
export type RequestStatusKey = keyof typeof REQUEST_STATUS_CONFIG  
export type RequestPriorityKey = keyof typeof REQUEST_PRIORITY_CONFIG
export type UserRoleKey = keyof typeof ROLE_CONFIG