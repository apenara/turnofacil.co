import { UserRole } from '../auth/types'

export const ROLE_PERMISSIONS = {
  SUPER_ADMIN: [
    'MANAGE_CLIENT_COMPANIES',
    'VIEW_PLATFORM_ANALYTICS',
    'MANAGE_SUBSCRIPTION_PLANS',
    'SEND_GLOBAL_NOTIFICATIONS'
  ],
  BUSINESS_ADMIN: [
    'MANAGE_COMPANY_PROFILE',
    'MANAGE_USERS',
    'DEFINE_COMPANY_SETTINGS',
    'MANAGE_SHIFT_TEMPLATES',
    'FINALIZE_SCHEDULES',
    'VIEW_ALL_REPORTS',
    'MANAGE_BILLING',
    'CONFIGURE_PERMISSIONS'
  ],
  SUPERVISOR: [
    'CREATE_AND_MANAGE_TEAM_SCHEDULES',
    'SUBMIT_SCHEDULES_FOR_APPROVAL',
    'MANAGE_TEAM_REQUESTS',
    'VIEW_TEAM_REPORTS',
    'VIEW_ASSIGNED_EMPLOYEES'
  ],
  EMPLOYEE: [
    'VIEW_OWN_SCHEDULE',
    'VIEW_TEAM_SCHEDULE',
    'REQUEST_SHIFT_CHANGE',
    'REPORT_ABSENCE',
    'UPLOAD_SUPPORT_DOCUMENT',
    'MANAGE_OWN_PROFILE'
  ]
} as const

export const hasPermission = (userRole: UserRole, permission: string): boolean => {
  const permissions = ROLE_PERMISSIONS[userRole] as readonly string[]
  return permissions.includes(permission)
}

export const getRouteByRole = (role: UserRole): string => {
  switch (role) {
    case 'SUPER_ADMIN':
      return '/admin'
    case 'BUSINESS_ADMIN':
      return '/business'
    case 'SUPERVISOR':
      return '/supervisor'
    case 'EMPLOYEE':
      return '/employee'
    default:
      return '/login'
  }
}