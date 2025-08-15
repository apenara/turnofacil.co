'use client'

import { useState } from 'react'
import { Card, Button, Tag, Modal, Input } from '@/components/ui'

interface Company {
  id: string
  name: string
  nit: string
  contactEmail: string
  contactName: string
  status: 'pending' | 'active' | 'suspended'
  registrationDate: string
  plan: string
  employees: number
  lastActivity: string
}

const mockCompanies: Company[] = [
  {
    id: '1',
    name: 'Restaurante El Buen Sabor',
    nit: '900123456-7',
    contactEmail: 'admin@elbuensabor.com',
    contactName: 'María González',
    status: 'active',
    registrationDate: '2024-01-15',
    plan: 'Pro',
    employees: 25,
    lastActivity: '2024-01-20'
  },
  {
    id: '2',
    name: 'Supermercado La Economía',
    nit: '900234567-8',
    contactEmail: 'gerencia@laeconomia.com',
    contactName: 'Carlos Pérez',
    status: 'active',
    registrationDate: '2024-01-14',
    plan: 'Básico',
    employees: 8,
    lastActivity: '2024-01-19'
  },
  {
    id: '3',
    name: 'Clínica San Rafael',
    nit: '900345678-9',
    contactEmail: 'sistemas@clinicasanrafael.com',
    contactName: 'Dr. Ana López',
    status: 'active',
    registrationDate: '2024-01-10',
    plan: 'Corporativo',
    employees: 150,
    lastActivity: '2024-01-21'
  },
  {
    id: '4',
    name: 'Café Central',
    nit: '900456789-0',
    contactEmail: 'admin@cafecentral.com',
    contactName: 'Luis Rodríguez',
    status: 'suspended',
    registrationDate: '2023-12-05',
    plan: 'Básico',
    employees: 12,
    lastActivity: '2024-01-05'
  },
  {
    id: '5',
    name: 'Hotel Plaza Mayor',
    nit: '900567890-1',
    contactEmail: 'reservas@hotelplazamayor.com',
    contactName: 'Elena Martínez',
    status: 'pending',
    registrationDate: '2024-01-22',
    plan: 'Pro',
    employees: 0,
    lastActivity: '2024-01-22'
  }
]

export default function CompaniesManagement() {
  const [companies, setCompanies] = useState<Company[]>(mockCompanies)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null)
  const [actionModal, setActionModal] = useState<{
    isOpen: boolean
    action: 'suspend' | 'reactivate' | 'delete' | null
    company: Company | null
  }>({
    isOpen: false,
    action: null,
    company: null
  })

  const filteredCompanies = companies.filter(company => {
    const matchesSearch = company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         company.nit.includes(searchTerm) ||
                         company.contactEmail.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || company.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  const handleAction = (company: Company, action: 'suspend' | 'reactivate' | 'delete') => {
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
          if (actionModal.action === 'suspend') {
            return { ...company, status: 'suspended' as const }
          } else if (actionModal.action === 'reactivate') {
            return { ...company, status: 'active' as const }
          }
        }
        return company
      })
      
      if (actionModal.action === 'delete') {
        setCompanies(companies.filter(c => c.id !== actionModal.company!.id))
      } else {
        setCompanies(updatedCompanies)
      }
    }
    
    setActionModal({ isOpen: false, action: null, company: null })
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

  const getActionText = (action: string) => {
    switch (action) {
      case 'suspend':
        return 'suspender'
      case 'reactivate':
        return 'reactivar'
      case 'delete':
        return 'eliminar'
      default:
        return action
    }
  }

  const stats = {
    total: companies.length,
    active: companies.filter(c => c.status === 'active').length,
    pending: companies.filter(c => c.status === 'pending').length,
    suspended: companies.filter(c => c.status === 'suspended').length
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-neutral-black">Gestión de Clientes</h1>
        <Button variant="secondary">
          Exportar Lista
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <div className="text-center">
            <p className="text-2xl font-bold text-neutral-black">{stats.total}</p>
            <p className="text-sm text-neutral-dark-gray">Total de Empresas</p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-2xl font-bold text-semantic-success">{stats.active}</p>
            <p className="text-sm text-neutral-dark-gray">Activas</p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-2xl font-bold text-semantic-warning">{stats.pending}</p>
            <p className="text-sm text-neutral-dark-gray">Pendientes</p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-2xl font-bold text-semantic-error">{stats.suspended}</p>
            <p className="text-sm text-neutral-dark-gray">Suspendidas</p>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Buscar por nombre, NIT o email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="md:w-48">
            <select
              className="w-full px-sm py-sm rounded-md border border-neutral-light-gray focus:border-primary focus:ring-primary bg-white text-neutral-black focus:outline-none focus:ring-2 focus:ring-opacity-20"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">Todos los estados</option>
              <option value="active">Activas</option>
              <option value="pending">Pendientes</option>
              <option value="suspended">Suspendidas</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Companies Table */}
      <Card>
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
                  Empleados
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-dark-gray uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-dark-gray uppercase tracking-wider">
                  Última Actividad
                </th>
                <th className="relative px-6 py-3">
                  <span className="sr-only">Acciones</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-light-gray">
              {filteredCompanies.map((company) => (
                <tr key={company.id} className="hover:bg-neutral-off-white">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="font-medium text-neutral-black">{company.name}</div>
                      <div className="text-sm text-neutral-medium-gray">{company.contactName}</div>
                      <div className="text-sm text-neutral-medium-gray">{company.contactEmail}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-dark-gray">
                    {company.nit}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Tag variant="info">{company.plan}</Tag>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-dark-gray">
                    {company.employees}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Tag variant={getStatusColor(company.status)}>
                      {getStatusText(company.status)}
                    </Tag>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-dark-gray">
                    {new Date(company.lastActivity).toLocaleDateString('es-CO')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      <Button 
                        variant="text" 
                        size="sm"
                        onClick={() => setSelectedCompany(company)}
                      >
                        Ver detalles
                      </Button>
                      
                      {company.status === 'active' && (
                        <Button 
                          variant="text" 
                          size="sm" 
                          className="text-semantic-warning hover:text-semantic-warning"
                          onClick={() => handleAction(company, 'suspend')}
                        >
                          Suspender
                        </Button>
                      )}
                      
                      {company.status === 'suspended' && (
                        <Button 
                          variant="text" 
                          size="sm" 
                          className="text-semantic-success hover:text-semantic-success"
                          onClick={() => handleAction(company, 'reactivate')}
                        >
                          Reactivar
                        </Button>
                      )}
                      
                      <Button 
                        variant="text" 
                        size="sm" 
                        className="text-semantic-error hover:text-semantic-error"
                        onClick={() => handleAction(company, 'delete')}
                      >
                        Eliminar
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {filteredCompanies.length === 0 && (
            <div className="text-center py-12">
              <p className="text-neutral-medium-gray">No se encontraron empresas que coincidan con los filtros.</p>
            </div>
          )}
        </div>
      </Card>

      {/* Company Details Modal */}
      <Modal
        isOpen={!!selectedCompany}
        onClose={() => setSelectedCompany(null)}
        title="Detalles de la Empresa"
        size="lg"
      >
        {selectedCompany && (
          <div className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-4">Información General</h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-neutral-dark-gray">Nombre</label>
                    <p className="text-neutral-black">{selectedCompany.name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-neutral-dark-gray">NIT</label>
                    <p className="text-neutral-black">{selectedCompany.nit}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-neutral-dark-gray">Plan</label>
                    <p className="text-neutral-black">{selectedCompany.plan}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-neutral-dark-gray">Estado</label>
                    <div className="mt-1">
                      <Tag variant={getStatusColor(selectedCompany.status)}>
                        {getStatusText(selectedCompany.status)}
                      </Tag>
                    </div>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="font-semibold mb-4">Contacto</h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-neutral-dark-gray">Contacto Principal</label>
                    <p className="text-neutral-black">{selectedCompany.contactName}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-neutral-dark-gray">Email</label>
                    <p className="text-neutral-black">{selectedCompany.contactEmail}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-neutral-dark-gray">Empleados</label>
                    <p className="text-neutral-black">{selectedCompany.employees}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-neutral-dark-gray">Fecha de Registro</label>
                    <p className="text-neutral-black">
                      {new Date(selectedCompany.registrationDate).toLocaleDateString('es-CO')}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="pt-4 border-t border-neutral-light-gray">
              <h3 className="font-semibold mb-4">Actividad Reciente</h3>
              <div className="bg-neutral-off-white rounded-lg p-4">
                <p className="text-sm text-neutral-dark-gray">
                  Última actividad: {new Date(selectedCompany.lastActivity).toLocaleDateString('es-CO')}
                </p>
                <p className="text-sm text-neutral-medium-gray mt-2">
                  Actividad detallada disponible en el panel de análisis.
                </p>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Action Confirmation Modal */}
      <Modal
        isOpen={actionModal.isOpen}
        onClose={() => setActionModal({ isOpen: false, action: null, company: null })}
        title={`Confirmar Acción`}
        size="md"
      >
        <div className="space-y-4">
          <p>
            ¿Estás seguro de que quieres {getActionText(actionModal.action || '')} la empresa{' '}
            <strong>{actionModal.company?.name}</strong>?
          </p>
          
          {actionModal.action === 'suspend' && (
            <div className="bg-semantic-warning/10 p-4 rounded-md">
              <p className="text-semantic-warning font-medium">Al suspender:</p>
              <ul className="text-sm text-semantic-warning mt-2 space-y-1">
                <li>• La empresa perderá acceso a la plataforma</li>
                <li>• Los usuarios no podrán iniciar sesión</li>
                <li>• Los datos se mantendrán intactos</li>
                <li>• Se puede reactivar en cualquier momento</li>
              </ul>
            </div>
          )}
          
          {actionModal.action === 'reactivate' && (
            <div className="bg-semantic-success/10 p-4 rounded-md">
              <p className="text-semantic-success font-medium">Al reactivar:</p>
              <ul className="text-sm text-semantic-success mt-2 space-y-1">
                <li>• La empresa recuperará acceso completo</li>
                <li>• Los usuarios podrán iniciar sesión</li>
                <li>• Todos los datos estarán disponibles</li>
              </ul>
            </div>
          )}
          
          {actionModal.action === 'delete' && (
            <div className="bg-semantic-error/10 p-4 rounded-md">
              <p className="text-semantic-error font-medium">⚠️ Al eliminar:</p>
              <ul className="text-sm text-semantic-error mt-2 space-y-1">
                <li>• Se eliminarán TODOS los datos de la empresa</li>
                <li>• Esta acción NO se puede deshacer</li>
                <li>• Se recomienda suspender en lugar de eliminar</li>
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
            variant={actionModal.action === 'delete' ? 'danger' : 'primary'}
            onClick={confirmAction}
          >
            {actionModal.action === 'suspend' && 'Suspender'}
            {actionModal.action === 'reactivate' && 'Reactivar'}
            {actionModal.action === 'delete' && 'Eliminar'}
          </Button>
        </div>
      </Modal>
    </div>
  )
}