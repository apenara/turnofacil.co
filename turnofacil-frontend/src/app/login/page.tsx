'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button, Input, Card } from '@/components/ui'
import { useAuth } from '@/lib/auth/AuthContext'
import { getRouteByRole } from '@/lib/permissions/roles'

export default function LoginPage() {
  const [credentials, setCredentials] = useState({
    email: '',
    password: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const { login } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      await login(credentials)
      // Redirect will be handled by the effect in layout when user changes
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al iniciar sesión')
    } finally {
      setIsLoading(false)
    }
  }

  const demoAccounts = [
    { email: 'superadmin@turnofacil.co', role: 'Super Administrador', description: 'Gestión de la plataforma' },
    { email: 'admin@empresa.com', role: 'Administrador de Negocio', description: 'Gestión de empresa' },
    { email: 'supervisor@empresa.com', role: 'Supervisor', description: 'Gestión de equipo' },
    { email: 'empleado@empresa.com', role: 'Colaborador', description: 'Vista de empleado' }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center px-4">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <Link href="/" className="inline-block">
            <h1 className="text-3xl font-bold text-primary">TurnoFacil CO</h1>
          </Link>
          <h2 className="mt-6 text-2xl font-bold text-neutral-black">
            Iniciar Sesión
          </h2>
          <p className="mt-2 text-neutral-dark-gray">
            Accede a tu cuenta para gestionar horarios
          </p>
        </div>

        {/* Login Form */}
        <Card>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-semantic-error/10 border border-semantic-error/20 text-semantic-error px-4 py-3 rounded-md">
                {error}
              </div>
            )}

            <Input
              label="Email"
              type="email"
              value={credentials.email}
              onChange={(e) => setCredentials({...credentials, email: e.target.value})}
              required
              autoComplete="email"
            />

            <Input
              label="Contraseña"
              type="password"
              value={credentials.password}
              onChange={(e) => setCredentials({...credentials, password: e.target.value})}
              required
              autoComplete="current-password"
            />

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-primary focus:ring-primary border-neutral-light-gray rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-neutral-dark-gray">
                  Recordarme
                </label>
              </div>

              <div className="text-sm">
                <a href="#" className="font-medium text-primary hover:text-primary-dark">
                  ¿Olvidaste tu contraseña?
                </a>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
            </Button>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-neutral-light-gray" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-neutral-medium-gray">¿No tienes cuenta?</span>
              </div>
            </div>

            <div className="mt-6">
              <Link href="/register">
                <Button variant="secondary" className="w-full">
                  Registrar mi empresa
                </Button>
              </Link>
            </div>
          </div>
        </Card>

        {/* Demo Accounts */}
        <Card>
          <h3 className="text-lg font-semibold mb-4 text-center">Cuentas de Demostración</h3>
          <p className="text-sm text-neutral-dark-gray mb-4 text-center">
            Usa cualquiera de estas cuentas para probar la plataforma (contraseña: password123)
          </p>
          <div className="space-y-3">
            {demoAccounts.map((account, index) => (
              <div 
                key={index}
                className="p-3 border border-neutral-light-gray rounded-md cursor-pointer hover:bg-neutral-off-white transition-colors"
                onClick={() => setCredentials({email: account.email, password: 'password123'})}
              >
                <div className="font-medium text-sm">{account.role}</div>
                <div className="text-xs text-neutral-medium-gray">{account.email}</div>
                <div className="text-xs text-neutral-dark-gray">{account.description}</div>
              </div>
            ))}
          </div>
        </Card>

        {/* Back to Home */}
        <div className="text-center">
          <Link href="/" className="text-sm text-neutral-dark-gray hover:text-primary">
            ← Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  )
}