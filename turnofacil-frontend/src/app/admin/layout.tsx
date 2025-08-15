'use client'

import { AuthGuard } from '@/components/shared/AuthGuard'
import { DashboardLayout } from '@/components/shared/DashboardLayout'

const navigation = [
  {
    name: 'Dashboard',
    href: '/admin',
    current: true,
    icon: (
      <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2V7z" />
      </svg>
    )
  },
  {
    name: 'Gestión de Clientes',
    href: '/admin/companies',
    current: false,
    icon: (
      <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    )
  }
]

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuthGuard allowedRoles={['SUPER_ADMIN']}>
      <DashboardLayout navigation={navigation}>
        {children}
      </DashboardLayout>
    </AuthGuard>
  )
}