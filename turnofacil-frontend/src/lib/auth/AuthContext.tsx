'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { AuthContextType, AuthState, LoginCredentials, User } from './types'

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// Mock users for demonstration
const mockUsers: User[] = [
  {
    id: '1',
    email: 'superadmin@turnofacil.co',
    name: 'Super Administrador',
    role: 'SUPER_ADMIN',
    isActive: true
  },
  {
    id: '2',
    email: 'admin@empresa.com',
    name: 'Juan Pérez',
    role: 'BUSINESS_ADMIN',
    companyId: 'company-1',
    companyName: 'Empresa Demo',
    isActive: true
  },
  {
    id: '3',
    email: 'supervisor@empresa.com',
    name: 'María García',
    role: 'SUPERVISOR',
    companyId: 'company-1',
    companyName: 'Empresa Demo',
    isActive: true
  },
  {
    id: '4',
    email: 'empleado@empresa.com',
    name: 'Carlos López',
    role: 'EMPLOYEE',
    companyId: 'company-1',
    companyName: 'Empresa Demo',
    isActive: true
  }
]

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true
  })

  useEffect(() => {
    // Check for existing session
    const storedUser = localStorage.getItem('user')
    if (storedUser) {
      const user = JSON.parse(storedUser)
      setAuthState({
        user,
        isAuthenticated: true,
        isLoading: false
      })
    } else {
      setAuthState(prev => ({ ...prev, isLoading: false }))
    }
  }, [])

  const login = async (credentials: LoginCredentials): Promise<void> => {
    try {
      // Mock authentication - in real app, this would be an API call
      const user = mockUsers.find(u => 
        u.email === credentials.email && 
        credentials.password === 'password123' // Mock password
      )

      if (!user) {
        throw new Error('Credenciales inválidas')
      }

      localStorage.setItem('user', JSON.stringify(user))
      
      setAuthState({
        user,
        isAuthenticated: true,
        isLoading: false
      })
    } catch (error) {
      throw error
    }
  }

  const logout = () => {
    localStorage.removeItem('user')
    setAuthState({
      user: null,
      isAuthenticated: false,
      isLoading: false
    })
  }

  return (
    <AuthContext.Provider value={{
      ...authState,
      login,
      logout
    }}>
      {children}
    </AuthContext.Provider>
  )
}