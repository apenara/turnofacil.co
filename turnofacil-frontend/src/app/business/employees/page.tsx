'use client'

import React, { useState } from 'react'
import { Card, Button, Input, Modal, Tag } from '@/components/ui'
import { useReportGenerator } from '@/components/shared/ReportGenerator'

interface Employee {
  id: string
  name: string
  email: string
  phone: string
  position: string
  location: string
  status: 'active' | 'inactive' | 'on_leave'
  startDate: string
  baseSalary: number
  weeklyHours: number
  documents: EmployeeDocument[]
}

interface EmployeeDocument {
  id: string
  type: 'contract' | 'id_copy' | 'certificate' | 'other'
  name: string
  uploadDate: string
  status: 'pending' | 'approved' | 'rejected'
}

const mockEmployees: Employee[] = [
  {
    id: '1',
    name: 'Carlos López',
    email: 'carlos.lopez@empresa.com',
    phone: '+57 321 456 7890',
    position: 'Cocinero',
    location: 'Cocina Principal',
    status: 'active',
    startDate: '2023-06-15',
    baseSalary: 1200000,
    weeklyHours: 48,
    documents: [
      { id: '1', type: 'contract', name: 'Contrato Laboral', uploadDate: '2023-06-15', status: 'approved' },
      { id: '2', type: 'id_copy', name: 'Cédula', uploadDate: '2023-06-15', status: 'approved' }
    ]
  },
  {
    id: '2',
    name: 'Ana Martínez',
    email: 'ana.martinez@empresa.com',
    phone: '+57 310 123 4567',
    position: 'Mesera',
    location: 'Salón Principal',
    status: 'active',
    startDate: '2023-08-01',
    baseSalary: 1100000,
    weeklyHours: 44,
    documents: [
      { id: '3', type: 'contract', name: 'Contrato Laboral', uploadDate: '2023-08-01', status: 'approved' },
      { id: '4', type: 'certificate', name: 'Certificado Manipulación Alimentos', uploadDate: '2023-08-01', status: 'pending' }
    ]
  },
  {
    id: '3',
    name: 'María García',
    email: 'maria.garcia@empresa.com',
    phone: '+57 300 987 6543',
    position: 'Supervisor',
    location: 'General',
    status: 'on_leave',
    startDate: '2023-03-20',
    baseSalary: 1800000,
    weeklyHours: 48,
    documents: [
      { id: '5', type: 'contract', name: 'Contrato Laboral', uploadDate: '2023-03-20', status: 'approved' },
      { id: '6', type: 'id_copy', name: 'Cédula', uploadDate: '2023-03-20', status: 'approved' }
    ]
  }
]

const positions = ['Cocinero', 'Mesera', 'Cajero', 'Supervisor', 'Administrador', 'Limpieza']
const locations = ['Cocina Principal', 'Salón Principal', 'Caja', 'General', 'Almacén']

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>(mockEmployees)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<Employee['status'] | 'all'>('all')
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view'>('create')
  const [formData, setFormData] = useState<Partial<Employee>>({
    name: '',
    email: '',
    phone: '',
    position: '',
    location: '',
    status: 'active',
    baseSalary: 0,
    weeklyHours: 48
  })

  const { generateReport, ReportModal } = useReportGenerator()

  const filteredEmployees = employees.filter(employee => {
    const matchesSearch = employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         employee.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         employee.position.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === 'all' || employee.status === filterStatus
    return matchesSearch && matchesStatus
  })

  const getStatusColor = (status: Employee['status']) => {
    switch (status) {
      case 'active':
        return 'success'
      case 'inactive':
        return 'error'
      case 'on_leave':
        return 'warning'
      default:
        return 'default'
    }
  }

  const getStatusText = (status: Employee['status']) => {
    switch (status) {
      case 'active':
        return 'Activo'
      case 'inactive':
        return 'Inactivo'
      case 'on_leave':
        return 'Licencia'
      default:
        return status
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const openModal = (mode: 'create' | 'edit' | 'view', employee?: Employee) => {
    setModalMode(mode)
    if (employee) {
      setSelectedEmployee(employee)
      setFormData(employee)
    } else {
      setSelectedEmployee(null)
      setFormData({
        name: '',
        email: '',
        phone: '',
        position: '',
        location: '',
        status: 'active',
        baseSalary: 0,
        weeklyHours: 48
      })
    }
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setSelectedEmployee(null)
    setFormData({})
  }

  const handleSave = () => {
    if (modalMode === 'create') {
      const newEmployee: Employee = {
        ...formData as Employee,
        id: Date.now().toString(),
        startDate: new Date().toISOString().split('T')[0],
        documents: []
      }
      setEmployees([...employees, newEmployee])
    } else if (modalMode === 'edit' && selectedEmployee) {
      setEmployees(employees.map(emp => 
        emp.id === selectedEmployee.id ? { ...emp, ...formData } : emp
      ))
    }
    closeModal()
  }

  const handleExportReport = () => {
    generateReport({
      title: 'Reporte de Empleados',
      subtitle: 'Lista completa de empleados activos',
      company: 'TurnoFacil CO',
      generatedBy: 'Administrador',
      generatedAt: new Date(),
      data: filteredEmployees,
      columns: [
        { key: 'name', title: 'Nombre', type: 'text' },
        { key: 'email', title: 'Email', type: 'text' },
        { key: 'position', title: 'Cargo', type: 'text' },
        { key: 'location', title: 'Ubicación', type: 'text' },
        { key: 'baseSalary', title: 'Salario Base', type: 'currency' },
        { key: 'weeklyHours', title: 'Horas Semanales', type: 'number' },
        { key: 'status', title: 'Estado', type: 'text' }
      ],
      summary: [
        { label: 'Total Empleados', value: filteredEmployees.length, type: 'number' },
        { label: 'Empleados Activos', value: filteredEmployees.filter(e => e.status === 'active').length, type: 'number' },
        { label: 'Nómina Total Mensual', value: filteredEmployees.filter(e => e.status === 'active').reduce((sum, e) => sum + e.baseSalary, 0), type: 'currency' }
      ]
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Gestión de Empleados</h1>
          <p className="text-gray-600">Administra tu equipo de trabajo</p>
        </div>
        <div className="flex space-x-3">
          <Button variant="secondary" onClick={handleExportReport}>
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
            </svg>
            Exportar
          </Button>
          <Button onClick={() => openModal('create')}>
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Nuevo Empleado
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-600">Total Empleados</h3>
              <p className="text-2xl font-bold text-gray-900">{employees.length}</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-600">Activos</h3>
              <p className="text-2xl font-bold text-gray-900">
                {employees.filter(e => e.status === 'active').length}
              </p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-600">En Licencia</h3>
              <p className="text-2xl font-bold text-gray-900">
                {employees.filter(e => e.status === 'on_leave').length}
              </p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-600">Nómina Mensual</h3>
              <p className="text-xl font-bold text-gray-900">
                {formatCurrency(employees.filter(e => e.status === 'active').reduce((sum, e) => sum + e.baseSalary, 0))}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4">
          <div className="flex-1">
            <Input
              placeholder="Buscar empleados..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex space-x-4">
            <select
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as Employee['status'] | 'all')}
            >
              <option value="all">Todos los estados</option>
              <option value="active">Activos</option>
              <option value="inactive">Inactivos</option>
              <option value="on_leave">En licencia</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Employees Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Empleado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cargo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ubicación
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Salario
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Horas/Semana
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredEmployees.map((employee) => (
                <tr key={employee.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{employee.name}</div>
                      <div className="text-sm text-gray-500">{employee.email}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {employee.position}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {employee.location}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatCurrency(employee.baseSalary)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {employee.weeklyHours}h
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Tag variant={getStatusColor(employee.status)}>
                      {getStatusText(employee.status)}
                    </Tag>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <Button
                        variant="text"
                        size="sm"
                        onClick={() => openModal('view', employee)}
                      >
                        Ver
                      </Button>
                      <Button
                        variant="text"
                        size="sm"
                        onClick={() => openModal('edit', employee)}
                      >
                        Editar
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Employee Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={
          modalMode === 'create' ? 'Nuevo Empleado' :
          modalMode === 'edit' ? 'Editar Empleado' :
          'Detalles del Empleado'
        }
        size="lg"
      >
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Nombre completo"
              value={formData.name || ''}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              disabled={modalMode === 'view'}
              required
            />
            <Input
              label="Email"
              type="email"
              value={formData.email || ''}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              disabled={modalMode === 'view'}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Teléfono"
              value={formData.phone || ''}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              disabled={modalMode === 'view'}
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cargo
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                value={formData.position || ''}
                onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                disabled={modalMode === 'view'}
              >
                <option value="">Seleccionar cargo</option>
                {positions.map(position => (
                  <option key={position} value={position}>{position}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ubicación
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                value={formData.location || ''}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                disabled={modalMode === 'view'}
              >
                <option value="">Seleccionar ubicación</option>
                {locations.map(location => (
                  <option key={location} value={location}>{location}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Estado
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                value={formData.status || 'active'}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as Employee['status'] })}
                disabled={modalMode === 'view'}
              >
                <option value="active">Activo</option>
                <option value="inactive">Inactivo</option>
                <option value="on_leave">En licencia</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Salario base mensual"
              type="number"
              value={formData.baseSalary || ''}
              onChange={(e) => setFormData({ ...formData, baseSalary: Number(e.target.value) })}
              disabled={modalMode === 'view'}
            />
            <Input
              label="Horas semanales"
              type="number"
              value={formData.weeklyHours || ''}
              onChange={(e) => setFormData({ ...formData, weeklyHours: Number(e.target.value) })}
              disabled={modalMode === 'view'}
            />
          </div>

          {selectedEmployee && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Documentos</h4>
              <div className="space-y-2">
                {selectedEmployee.documents.map(doc => (
                  <div key={doc.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                    <div>
                      <p className="text-sm font-medium">{doc.name}</p>
                      <p className="text-xs text-gray-500">Subido: {new Date(doc.uploadDate).toLocaleDateString('es-CO')}</p>
                    </div>
                    <Tag variant={doc.status === 'approved' ? 'success' : doc.status === 'rejected' ? 'error' : 'warning'}>
                      {doc.status === 'approved' ? 'Aprobado' : doc.status === 'rejected' ? 'Rechazado' : 'Pendiente'}
                    </Tag>
                  </div>
                ))}
              </div>
            </div>
          )}

          {modalMode !== 'view' && (
            <div className="flex justify-end space-x-4 pt-4">
              <Button variant="secondary" onClick={closeModal}>
                Cancelar
              </Button>
              <Button onClick={handleSave}>
                {modalMode === 'create' ? 'Crear Empleado' : 'Guardar Cambios'}
              </Button>
            </div>
          )}
        </div>
      </Modal>

      <ReportModal />
    </div>
  )
}