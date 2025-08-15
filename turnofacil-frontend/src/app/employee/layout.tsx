'use client'

import { AuthGuard } from '@/components/shared/AuthGuard'
import { DashboardLayout } from '@/components/shared/DashboardLayout'

const navigation = [
  {
    name: 'Mi Horario',
    href: '/employee',
    current: true,
    icon: (
      <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2-2V7z" />
      </svg>
    )
  },
  {
    name: 'Solicitudes',
    href: '/employee/requests',
    current: false,
    icon: (
      <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
      </svg>
    )
  },
  {
    name: 'Notificaciones',
    href: '/employee/notifications',
    current: false,
    icon: (
      <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM7 8h8M7 12h8M7 16h5" />
      </svg>
    )
  },
  {
    name: 'Mi Perfil',
    href: '/employee/profile',
    current: false,
    icon: (
      <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    )
  }
]

export default function EmployeeLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuthGuard allowedRoles={['EMPLOYEE']}>
      <DashboardLayout navigation={navigation}>
        {children}
      </DashboardLayout>
    </AuthGuard>
  )
}