'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/lib/auth/AuthContext'
import { Button } from '@/components/ui'

interface DashboardLayoutProps {
  children: React.ReactNode
  navigation: Array<{
    name: string
    href: string
    icon: React.ReactNode
    current?: boolean
  }>
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children, navigation }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { user, logout } = useAuth()

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile sidebar */}
      {sidebarOpen && (
        <div className="lg:hidden">
          <div className="fixed inset-0 z-40 flex">
            <div 
              className="fixed inset-0 bg-black bg-opacity-75"
              onClick={() => setSidebarOpen(false)}
            />
            <div className="relative flex flex-col flex-1 w-full max-w-xs bg-white">
              <div className="absolute top-0 right-0 pt-2 -mr-12">
                <button
                  className="flex items-center justify-center w-10 h-10 ml-1 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                  onClick={() => setSidebarOpen(false)}
                >
                  <span className="sr-only">Cerrar sidebar</span>
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <SidebarContent navigation={navigation} />
            </div>
          </div>
        </div>
      )}

      {/* Static sidebar for desktop */}
      <div className="hidden lg:flex lg:flex-shrink-0">
        <div className="flex flex-col w-64 fixed h-full">
          <SidebarContent navigation={navigation} />
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-col flex-1 lg:ml-64">
        {/* Top header */}
        <div className="sticky top-0 z-10 bg-white shadow-sm lg:hidden">
          <div className="flex items-center justify-between px-4 py-2">
            <button
              className="text-gray-600 hover:text-primary-500"
              onClick={() => setSidebarOpen(true)}
            >
              <span className="sr-only">Abrir sidebar</span>
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <h1 className="text-xl font-bold text-primary-500">TurnoFacil CO</h1>
          </div>
        </div>

        {/* Page header */}
        <div className="bg-white shadow-sm">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center">
                <h1 className="text-2xl font-semibold text-gray-900">
                  {user?.role === 'SUPER_ADMIN' && 'Panel de Super Administrador'}
                  {user?.role === 'BUSINESS_ADMIN' && 'Panel de Administración'}
                  {user?.role === 'SUPERVISOR' && 'Panel de Supervisor'}
                  {user?.role === 'EMPLOYEE' && 'Mi Portal'}
                </h1>
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                    <p className="text-xs text-gray-500">{user?.companyName || 'TurnoFacil CO'}</p>
                  </div>
                  <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-medium text-sm">
                      {user?.name?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                </div>
                <Button variant="text" onClick={logout}>
                  Cerrar Sesión
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Main content area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}

const SidebarContent: React.FC<{ navigation: DashboardLayoutProps['navigation'] }> = ({ navigation }) => {
  return (
    <div className="flex flex-col flex-1 min-h-0 bg-white border-r border-gray-200">
      <div className="flex items-center flex-shrink-0 px-4 py-4">
        <Link href="/">
          <h1 className="text-xl font-bold text-primary-500">TurnoFacil CO</h1>
        </Link>
      </div>
      <div className="flex-1 flex flex-col overflow-y-auto">
        <nav className="flex-1 px-2 py-4 space-y-1">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={`
                group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors
                ${item.current
                  ? 'bg-primary-500 text-white'
                  : 'text-gray-700 hover:bg-primary-50 hover:text-primary-500'
                }
              `}
            >
              <span className="mr-3 flex-shrink-0 h-5 w-5">
                {item.icon}
              </span>
              {item.name}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  )
}