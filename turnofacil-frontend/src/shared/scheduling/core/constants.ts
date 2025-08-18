/**
 * Constantes del Negocio para Scheduling
 * @fileoverview Constantes centralizadas para todo el sistema de scheduling
 */

import { ShiftType, ValidationSeverity, UserRole } from './types'

// ========== CONSTANTES LABORALES COLOMBIANAS ==========

export const COLOMBIAN_LABOR_CONSTANTS = {
  // Horas regulares
  REGULAR_HOURS_PER_DAY: 8,
  REGULAR_HOURS_PER_WEEK: 48,
  MAX_HOURS_PER_WEEK: 60, // Incluyendo extras
  
  // Horarios especiales
  NIGHT_START_HOUR: 21, // 9:00 PM
  NIGHT_END_HOUR: 6,    // 6:00 AM
  
  // Recargos según legislación colombiana
  NIGHT_RATE: 0.35,           // 35% recargo nocturno
  OVERTIME_RATE: 0.25,        // 25% recargo horas extras diurnas
  OVERTIME_NIGHT_RATE: 0.75,  // 75% recargo horas extras nocturnas
  SUNDAY_RATE: 0.75,          // 75% recargo dominical
  SUNDAY_NIGHT_RATE: 1.10,    // 110% recargo dominical nocturno
  HOLIDAY_RATE: 0.75,         // 75% recargo festivo
  HOLIDAY_NIGHT_RATE: 1.10,   // 110% recargo festivo nocturno
  
  // Descansos obligatorios
  MIN_REST_BETWEEN_SHIFTS: 12, // Horas mínimas entre turnos
  MAX_CONSECUTIVE_WORK_DAYS: 6,
  WEEKLY_REST_DAYS_REQUIRED: 1
} as const

// ========== CONFIGURACIÓN DE TURNOS ==========

export const SHIFT_CONFIG = {
  // Duración de turnos
  MIN_SHIFT_DURATION: 1,    // 1 hora mínima
  MAX_SHIFT_DURATION: 12,   // 12 horas máximas
  DEFAULT_SHIFT_DURATION: 8,
  
  // Intervalos de tiempo
  TIME_SLOT_INTERVAL: 15,   // Intervalos de 15 minutos
  
  // Estados y tipos
  DEFAULT_SHIFT_TYPE: 'regular' as ShiftType,
  ALLOWED_SHIFT_TYPES: ['regular', 'overtime', 'night', 'holiday'] as ShiftType[],
  
  // Colores por tipo de turno
  SHIFT_COLORS: {
    regular: '#10B981',   // Verde
    overtime: '#F59E0B',  // Ámbar
    night: '#8B5CF6',     // Púrpura
    holiday: '#EF4444'    // Rojo
  },
  
  // Configuración de validación por defecto
  VALIDATION_RULES: {
    enforceAvailability: true,
    enforceRestDays: true,
    enforceBudgetLimits: true,
    allowOvertimeWithApproval: true,
    maxConsecutiveHours: 12,
    budgetWarningThreshold: 85
  }
} as const

// ========== CONFIGURACIÓN DE VALIDACIONES ==========

export const VALIDATION_CONFIG = {
  // Severidades y tipos
  SEVERITIES: ['error', 'warning', 'info'] as ValidationSeverity[],
  
  // Límites por defecto
  DEFAULT_LIMITS: {
    maxWeeklyHours: 48,
    maxDailyHours: 12,
    maxConsecutiveShifts: 6,
    minRestHours: 12,
    budgetThreshold: 100
  },
  
  // Mensajes de validación
  ERROR_MESSAGES: {
    OVERTIME_EXCEEDED: 'Empleado excede horas semanales permitidas',
    AVAILABILITY_CONFLICT: 'Turno fuera del horario de disponibilidad',
    SHIFT_OVERLAP: 'Conflicto de horarios: turnos se superponen',
    INSUFFICIENT_REST: 'Tiempo de descanso insuficiente entre turnos',
    BUDGET_EXCEEDED: 'Presupuesto semanal excedido',
    NO_REST_DAY: 'Empleado sin día de descanso asignado',
    LEAVE_CONFLICT: 'Turno programado durante licencia aprobada'
  } as const,
  
  // Sugerencias automáticas
  AUTO_SUGGESTIONS: {
    REDUCE_HOURS: 'Considere reducir las horas del turno',
    ASSIGN_REST_DAY: 'Asigne un día de descanso',
    CHECK_AVAILABILITY: 'Verifique la disponibilidad del empleado',
    BUDGET_REVIEW: 'Revise la distribución del presupuesto'
  } as const
} as const

// ========== CONFIGURACIÓN DE UI ==========

export const UI_CONFIG = {
  // Configuración por rol
  ROLE_UI_SETTINGS: {
    SUPERVISOR: {
      defaultView: 'calendar',
      availableTabs: ['calendar', 'employees', 'templates', 'validation'],
      compactMode: false,
      showBudget: false,
      showAllLocations: false
    },
    BUSINESS_ADMIN: {
      defaultView: 'calendar',
      availableTabs: ['calendar', 'employees', 'templates', 'validation', 'reports', 'approvals'],
      compactMode: false,
      showBudget: true,
      showAllLocations: true
    },
    EMPLOYEE: {
      defaultView: 'my-schedule',
      availableTabs: ['my-schedule', 'requests'],
      compactMode: true,
      showBudget: false,
      showAllLocations: false
    }
  } as Record<UserRole, any>,
  
  // Configuración de calendario
  CALENDAR_CONFIG: {
    daysOfWeek: ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'],
    fullDayNames: ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'],
    timeSlots: {
      start: 6,  // 6:00 AM
      end: 23,   // 11:00 PM
      interval: 1 // 1 hora
    },
    gridColumns: 8, // Empleado + 7 días
    maxEmployeesPerView: 20
  },
  
  // Configuración de notificaciones
  NOTIFICATION_CONFIG: {
    autoCloseDelay: 5000, // 5 segundos
    maxVisible: 3,
    types: {
      success: { icon: 'check', color: 'green' },
      warning: { icon: 'warning', color: 'yellow' },
      error: { icon: 'error', color: 'red' },
      info: { icon: 'info', color: 'blue' }
    }
  }
} as const

// ========== CONFIGURACIÓN DE FECHAS ==========

export const DATE_CONFIG = {
  // Formatos
  DATE_FORMAT: 'YYYY-MM-DD',
  TIME_FORMAT: 'HH:mm',
  DATETIME_FORMAT: 'YYYY-MM-DD HH:mm:ss',
  DISPLAY_DATE_FORMAT: 'DD/MM/YYYY',
  
  // Zona horaria
  DEFAULT_TIMEZONE: 'America/Bogota',
  
  // Configuración de semana
  WEEK_STARTS_ON: 1, // Lunes = 1, Domingo = 0
  WEEKS_TO_DISPLAY: 12, // Semanas futuras en selector
  
  // Días festivos colombianos (algunos fijos)
  FIXED_HOLIDAYS: [
    '01-01', // Año Nuevo
    '05-01', // Día del Trabajo
    '07-20', // Día de la Independencia
    '08-07', // Batalla de Boyacá
    '12-08', // Inmaculada Concepción
    '12-25'  // Navidad
  ] as const
} as const

// ========== CONFIGURACIÓN DE PRESUPUESTOS ==========

export const BUDGET_CONFIG = {
  // Tipos de presupuesto
  BUDGET_TYPES: ['weekly', 'monthly', 'quarterly', 'annual'],
  
  // Configuración de alertas
  ALERT_THRESHOLDS: {
    warning: 85,  // 85% del presupuesto
    danger: 100,  // 100% del presupuesto
    critical: 110 // 110% del presupuesto
  },
  
  // Moneda
  CURRENCY: {
    code: 'COP',
    symbol: '$',
    locale: 'es-CO',
    minimumFractionDigits: 0
  }
} as const

// ========== CONFIGURACIÓN DE CACHE Y RENDIMIENTO ==========

export const PERFORMANCE_CONFIG = {
  // Cache
  CACHE_DURATION: {
    employees: 5 * 60 * 1000,    // 5 minutos
    shifts: 2 * 60 * 1000,       // 2 minutos
    templates: 10 * 60 * 1000,   // 10 minutos
    validation: 30 * 1000        // 30 segundos
  },
  
  // Debounce
  DEBOUNCE_DELAYS: {
    search: 300,        // 300ms para búsquedas
    validation: 500,    // 500ms para validaciones
    autosave: 2000      // 2 segundos para autoguardado
  },
  
  // Límites de datos
  MAX_ITEMS: {
    shiftsPerWeek: 200,
    employeesPerLocation: 100,
    templatesPerUser: 20,
    validationErrors: 50
  }
} as const

// ========== CONFIGURACIÓN DE DESARROLLO ==========

export const DEV_CONFIG = {
  // Modo debug
  ENABLE_DEBUG_LOGS: process.env.NODE_ENV === 'development',
  ENABLE_PERFORMANCE_MONITORING: process.env.NODE_ENV === 'development',
  
  // Mock data
  ENABLE_MOCK_DATA: process.env.NODE_ENV === 'development',
  MOCK_DELAY: 500, // 500ms para simular llamadas API
  
  // Validación estricta en desarrollo
  STRICT_VALIDATION: process.env.NODE_ENV === 'development'
} as const

// ========== PATRONES DE EXPRESIONES REGULARES ==========

export const REGEX_PATTERNS = {
  TIME_FORMAT: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
  DATE_FORMAT: /^\d{4}-\d{2}-\d{2}$/,
  EMPLOYEE_ID: /^emp_[a-zA-Z0-9]{8,}$/,
  SHIFT_ID: /^shift_[a-zA-Z0-9]{8,}$/,
  PHONE_NUMBER: /^(\+57)?[0-9]{10}$/
} as const

// ========== CONFIGURACIÓN DE ACCESIBILIDAD ==========

export const A11Y_CONFIG = {
  // Atributos ARIA
  ARIA_LABELS: {
    shiftButton: 'Crear nuevo turno',
    deleteShift: 'Eliminar turno',
    editShift: 'Editar turno',
    calendar: 'Calendario de horarios',
    employeeList: 'Lista de empleados'
  },
  
  // Atajos de teclado
  KEYBOARD_SHORTCUTS: {
    createShift: 'n',
    saveSchedule: 's',
    validateSchedule: 'v',
    previousWeek: 'ArrowLeft',
    nextWeek: 'ArrowRight'
  },
  
  // Configuración de focus
  FOCUS_CONFIG: {
    trapFocus: true,
    returnFocusOnClose: true,
    focusOnMount: true
  }
} as const

// ========== EXPORTS TIPADOS ==========

export type ConstantKey = keyof typeof COLOMBIAN_LABOR_CONSTANTS
export type ShiftColor = typeof SHIFT_CONFIG.SHIFT_COLORS[ShiftType]
export type ValidationMessage = keyof typeof VALIDATION_CONFIG.ERROR_MESSAGES