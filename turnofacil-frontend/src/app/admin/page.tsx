'use client'

import { useState } from 'react'
import { Card, Button, Tag, Modal } from '@/components/ui'

interface Company {
  id: string
  name: string
  nit: string
  contactEmail: string
  status: 'pending' | 'active' | 'suspended'
  registrationDate: string
  plan: string
}

interface PlatformMetrics {
  activeCompanies: number
  totalUsers: number
  pendingApprovals: number
  monthlyRecurringRevenue: number
}

const mockCompanies: Company[] = [
  {
    id: '1',
    name: 'Restaurante El Buen Sabor',
    nit: '900123456-7',
    contactEmail: 'admin@elbuensabor.com',
    status: 'pending',
    registrationDate: '2024-01-15',
    plan: 'Pro'
  },
  {
    id: '2',
    name: 'Supermercado La Economía',
    nit: '900234567-8',
    contactEmail: 'gerencia@laeconomia.com',
    status: 'pending',
    registrationDate: '2024-01-14',
    plan: 'Básico'
  },
  {
    id: '3',
    name: 'Clínica San Rafael',
    nit: '900345678-9',
    contactEmail: 'sistemas@clinicasanrafael.com',
    status: 'active',
    registrationDate: '2024-01-10',
    plan: 'Corporativo'
  }
]

const platformMetrics: PlatformMetrics = {
  activeCompanies: 15,
  totalUsers: 342,
  pendingApprovals: 2,
  monthlyRecurringRevenue: 2850000
}

export default function SuperAdminDashboard() {
  const [companies, setCompanies] = useState<Company[]>(mockCompanies)
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null)
  const [actionModal, setActionModal] = useState<{
    isOpen: boolean
    action: 'approve' | 'reject' | null
    company: Company | null
  }>({
    isOpen: false,
    action: null,
    company: null
  })

  const handleCompanyAction = (company: Company, action: 'approve' | 'reject') => {
    setActionModal({
      isOpen: true,
      action,
      company
    })
  }

  const confirmAction = () => {
    if (actionModal.company && actionModal.action) {
      const updatedCompanies = companies.map(company => {
        if (company.id === actionModal.company!.id) {
          return {
            ...company,
            status: actionModal.action === 'approve' ? 'active' as const : 'pending' as const
          }
        }
        return company
      })
      
      if (actionModal.action === 'reject') {
        // In a real app, you might remove the company or mark it as rejected
        setCompanies(updatedCompanies.filter(c => c.id !== actionModal.company!.id))
      } else {
        setCompanies(updatedCompanies)
      }
    }
    
    setActionModal({ isOpen: false, action: null, company: null })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const getStatusColor = (status: Company['status']) => {
    switch (status) {
      case 'active':
        return 'success'
      case 'pending':
        return 'warning'
      case 'suspended':
        return 'error'
      default:
        return 'default'
    }
  }

  const getStatusText = (status: Company['status']) => {
    switch (status) {
      case 'active':
        return 'Activa'
      case 'pending':
        return 'Pendiente'
      case 'suspended':
        return 'Suspendida'
      default:
        return status
    }
  }

  const pendingCompanies = companies.filter(c => c.status === 'pending')

  return (
    <div className="space-y-8">
      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-neutral-dark-gray">Empresas Activas</h3>
              <p className="text-2xl font-bold text-neutral-black">{platformMetrics.activeCompanies}</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-secondary/10 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-neutral-dark-gray">Usuarios Totales</h3>
              <p className="text-2xl font-bold text-neutral-black">{platformMetrics.totalUsers}</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-semantic-warning/10 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-semantic-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-neutral-dark-gray">Pendientes de Aprobación</h3>
              <p className="text-2xl font-bold text-neutral-black">{platformMetrics.pendingApprovals}</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-semantic-success/10 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-semantic-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-neutral-dark-gray">MRR</h3>
              <p className="text-2xl font-bold text-neutral-black">
                {formatCurrency(platformMetrics.monthlyRecurringRevenue)}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Pending Approvals */}
      {pendingCompanies.length > 0 && (
        <Card>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">Empresas Pendientes de Aprobación</h2>
            <Tag variant="warning">{pendingCompanies.length} pendientes</Tag>
          </div>
          
          <div className="space-y-4">
            {pendingCompanies.map((company) => (
              <div key={company.id} className="border border-neutral-light-gray rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-4">
                      <div>
                        <h3 className="font-semibold text-lg">{company.name}</h3>
                        <p className="text-neutral-dark-gray">NIT: {company.nit}</p>
                        <p className="text-neutral-dark-gray">Email: {company.contactEmail}</p>
                      </div>
                      <Tag variant="info">{company.plan}</Tag>
                    </div>
                    <p className="text-sm text-neutral-medium-gray mt-2">
                      Registrado el {new Date(company.registrationDate).toLocaleDateString('es-CO')}
                    </p>
                  </div>
                  
                  <div className="flex space-x-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleCompanyAction(company, 'reject')}
                    >
                      Rechazar
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleCompanyAction(company, 'approve')}
                    >
                      Aprobar
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* All Companies */}
      <Card>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">Todas las Empresas</h2>
          <Button variant="secondary">
            Ver todas
          </Button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-neutral-light-gray">
            <thead>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-dark-gray uppercase tracking-wider">
                  Empresa
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-dark-gray uppercase tracking-wider">
                  NIT
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-dark-gray uppercase tracking-wider">
                  Plan
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-dark-gray uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-dark-gray uppercase tracking-wider">
                  Registro
                </th>
                <th className="relative px-6 py-3">
                  <span className="sr-only">Acciones</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-light-gray">
              {companies.map((company) => (
                <tr key={company.id} className="hover:bg-neutral-off-white">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="font-medium text-neutral-black">{company.name}</div>
                      <div className="text-sm text-neutral-medium-gray">{company.contactEmail}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-dark-gray">
                    {company.nit}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Tag variant="info">{company.plan}</Tag>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Tag variant={getStatusColor(company.status)}>
                      {getStatusText(company.status)}
                    </Tag>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-dark-gray">
                    {new Date(company.registrationDate).toLocaleDateString('es-CO')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      <Button variant="text" size="sm">
                        Ver detalles
                      </Button>
                      {company.status === 'active' && (
                        <Button variant="text" size="sm" className="text-semantic-warning">
                          Suspender
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Action Confirmation Modal */}
      <Modal
        isOpen={actionModal.isOpen}
        onClose={() => setActionModal({ isOpen: false, action: null, company: null })}
        title={`${actionModal.action === 'approve' ? 'Aprobar' : 'Rechazar'} Empresa`}
        size="md"
      >
        <div className="space-y-4">
          <p>
            ¿Estás seguro de que quieres {actionModal.action === 'approve' ? 'aprobar' : 'rechazar'} la empresa{' '}
            <strong>{actionModal.company?.name}</strong>?
          </p>
          
          {actionModal.action === 'approve' && (
            <div className="bg-semantic-success/10 p-4 rounded-md">
              <p className="text-semantic-success font-medium">Al aprobar:</p>
              <ul className="text-sm text-semantic-success mt-2 space-y-1">
                <li>• La empresa podrá acceder a la plataforma</li>
                <li>• Se activará su plan {actionModal.company?.plan}</li>
                <li>• Recibirán un email de bienvenida</li>
              </ul>
            </div>
          )}
          
          {actionModal.action === 'reject' && (
            <div className="bg-semantic-error/10 p-4 rounded-md">
              <p className="text-semantic-error font-medium">Al rechazar:</p>
              <ul className="text-sm text-semantic-error mt-2 space-y-1">
                <li>• La empresa será notificada por email</li>
                <li>• Su cuenta no se activará</li>
                <li>• Podrán solicitar el registro nuevamente</li>
              </ul>
            </div>
          )}
        </div>
        
        <div className="flex justify-end space-x-4 mt-6">
          <Button 
            variant="secondary" 
            onClick={() => setActionModal({ isOpen: false, action: null, company: null })}
          >
            Cancelar
          </Button>
          <Button 
            variant={actionModal.action === 'approve' ? 'primary' : 'danger'}
            onClick={confirmAction}
          >
            {actionModal.action === 'approve' ? 'Aprobar' : 'Rechazar'}
          </Button>
        </div>
      </Modal>
    </div>
  )
}