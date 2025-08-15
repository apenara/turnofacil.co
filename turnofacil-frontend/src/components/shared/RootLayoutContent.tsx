'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/lib/auth/AuthContext'
import { getRouteByRole } from '@/lib/permissions/roles'

export const RootLayoutContent: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated, isLoading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (!isLoading && isAuthenticated && user) {
      const publicPaths = ['/', '/login', '/register']
      const isPublicPath = publicPaths.includes(pathname) || pathname.startsWith('/register/')
      
      if (isPublicPath && pathname !== '/') {
        // User is authenticated and on a auth page, redirect to their dashboard
        const userRoute = getRouteByRole(user.role)
        router.push(userRoute)
      }
    }
  }, [isAuthenticated, isLoading, user, router, pathname])

  return <>{children}</>
}