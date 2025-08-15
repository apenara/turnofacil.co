'use client'

import React, { useState } from 'react'
import { Card, Button, Input, Modal, Tag } from '@/components/ui'
import { useReportGenerator } from '@/components/shared/ReportGenerator'

interface Position {
  id: string
  name: string
  department: string
  description: string
  baseSalary: number
  hourlyRate: number
  requiredSkills: string[]
  responsibilities: string[]
  requirements: string[]
  level: 'entry' | 'mid' | 'senior' | 'supervisor'
  status: 'active' | 'inactive'
  employeeCount: number
  maxEmployees?: number
  overtimeEligible: boolean
  nightShiftEligible: boolean
  createdDate: string
}

const mockPositions: Position[] = [
  {
    id: '1',
    name: 'Cocinero',
    department: 'Cocina',
    description: 'Responsable de la preparación de alimentos y mantenimiento de estándares de calidad',
    baseSalary: 1200000,
    hourlyRate: 6250,
    requiredSkills: ['Manipulación de alimentos', 'Técnicas de cocina', 'Higiene'],
    responsibilities: [
      'Preparar alimentos según recetas estándar',
      'Mantener limpieza en estación de trabajo',
      'Controlar inventario de ingredientes',
      'Cumplir normas de seguridad alimentaria'
    ],
    requirements: [
      'Certificado en manipulación de alimentos',
      'Experiencia mínima 1 año',
      'Disponibilidad de horarios'
    ],
    level: 'mid',
    status: 'active',
    employeeCount: 5,
    maxEmployees: 8,
    overtimeEligible: true,
    nightShiftEligible: true,
    createdDate: '2023-01-15'
  },
  {
    id: '2',
    name: 'Mesero',
    department: 'Servicio',
    description: 'Atención al cliente y servicio de mesa',
    baseSalary: 1100000,
    hourlyRate: 5729,
    requiredSkills: ['Atención al cliente', 'Comunicación', 'Trabajo en equipo'],
    responsibilities: [
      'Atender mesas y tomar pedidos',
      'Servir alimentos y bebidas',
      'Mantener limpieza del área',
      'Procesar pagos'
    ],
    requirements: [
      'Bachillerato completo',
      'Experiencia en servicio al cliente',
      'Buena presentación personal'
    ],
    level: 'entry',
    status: 'active',
    employeeCount: 8,
    maxEmployees: 12,
    overtimeEligible: true,
    nightShiftEligible: true,
    createdDate: '2023-01-15'
  },
  {
    id: '3',
    name: 'Supervisor de Turno',
    department: 'Administración',
    description: 'Supervisión de operaciones y personal durante el turno',
    baseSalary: 1800000,
    hourlyRate: 9375,
    requiredSkills: ['Liderazgo', 'Gestión de personal', 'Resolución de problemas'],
    responsibilities: [
      'Supervisar personal de turno',
      'Coordinar operaciones diarias',
      'Resolver incidencias',
      'Reportar a gerencia'
    ],
    requirements: [
      'Educación técnica o universitaria',
      'Experiencia en supervisión min. 2 años',
      'Liderazgo comprobado'
    ],
    level: 'supervisor',
    status: 'active',
    employeeCount: 2,
    maxEmployees: 3,
    overtimeEligible: true,
    nightShiftEligible: false,
    createdDate: '2023-02-01'
  },
  {
    id: '4',
    name: 'Cajero',
    department: 'Administración',
    description: 'Manejo de caja y atención al cliente en punto de pago',
    baseSalary: 1150000,
    hourlyRate: 5989,
    requiredSkills: ['Manejo de dinero', 'Sistemas POS', 'Atención al cliente'],
    responsibilities: [
      'Procesar pagos y transacciones',
      'Mantener arqueo de caja',
      'Atender consultas de clientes',
      'Generar reportes de ventas'
    ],
    requirements: [
      'Bachillerato completo',
      'Experiencia en manejo de caja',
      'Honestidad comprobada'
    ],
    level: 'entry',
    status: 'inactive',
    employeeCount: 0,
    maxEmployees: 4,
    overtimeEligible: false,
    nightShiftEligible: false,
    createdDate: '2023-03-15'
  }
]

const departments = ['Cocina', 'Servicio', 'Administración', 'Limpieza', 'Seguridad']
const levels = [
  { value: 'entry', label: 'Nivel Inicial' },
  { value: 'mid', label: 'Nivel Medio' },
  { value: 'senior', label: 'Nivel Senior' },
  { value: 'supervisor', label: 'Supervisor' }
]

export default function PositionsPage() {
  const [positions, setPositions] = useState<Position[]>(mockPositions)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterDepartment, setFilterDepartment] = useState<string>('all')
  const [filterLevel, setFilterLevel] = useState<string>('all')
  const [selectedPosition, setSelectedPosition] = useState<Position | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view'>('create')
  const [formData, setFormData] = useState<Partial<Position>>({
    name: '',
    department: '',
    description: '',
    baseSalary: 0,
    level: 'entry',
    status: 'active',
    requiredSkills: [],
    responsibilities: [],
    requirements: [],
    overtimeEligible: true,
    nightShiftEligible: true
  })

  const { generateReport, ReportModal } = useReportGenerator()

  const filteredPositions = positions.filter(position => {
    const matchesSearch = position.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         position.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         position.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesDepartment = filterDepartment === 'all' || position.department === filterDepartment
    const matchesLevel = filterLevel === 'all' || position.level === filterLevel
    return matchesSearch && matchesDepartment && matchesLevel
  })

  const getLevelColor = (level: Position['level']) => {
    switch (level) {
      case 'entry':
        return 'info'
      case 'mid':
        return 'success'
      case 'senior':
        return 'warning'
      case 'supervisor':
        return 'error'
      default:
        return 'default'
    }
  }

  const getLevelText = (level: Position['level']) => {
    const levelMap = levels.find(l => l.value === level)
    return levelMap?.label || level
  }

  const getStatusColor = (status: Position['status']) => {
    return status === 'active' ? 'success' : 'error'
  }

  const getStatusText = (status: Position['status']) => {
    return status === 'active' ? 'Activa' : 'Inactiva'
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const openModal = (mode: 'create' | 'edit' | 'view', position?: Position) => {
    setModalMode(mode)
    if (position) {
      setSelectedPosition(position)
      setFormData(position)
    } else {
      setSelectedPosition(null)
      setFormData({
        name: '',
        department: '',
        description: '',
        baseSalary: 0,
        level: 'entry',
        status: 'active',
        requiredSkills: [],
        responsibilities: [],
        requirements: [],
        overtimeEligible: true,
        nightShiftEligible: true
      })
    }
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setSelectedPosition(null)
    setFormData({})
  }

  const handleSave = () => {
    if (modalMode === 'create') {
      const hourlyRate = formData.baseSalary ? formData.baseSalary / 192 : 0 // 192 horas/mes promedio
      const newPosition: Position = {
        ...formData as Position,
        id: Date.now().toString(),
        hourlyRate: Math.round(hourlyRate),
        employeeCount: 0,
        createdDate: new Date().toISOString().split('T')[0]
      }
      setPositions([...positions, newPosition])
    } else if (modalMode === 'edit' && selectedPosition) {
      const hourlyRate = formData.baseSalary ? formData.baseSalary / 192 : selectedPosition.hourlyRate
      setPositions(positions.map(pos => 
        pos.id === selectedPosition.id 
          ? { ...pos, ...formData, hourlyRate: Math.round(hourlyRate) } 
          : pos
      ))
    }
    closeModal()
  }

  const handleExportReport = () => {
    generateReport({
      title: 'Reporte de Posiciones de Trabajo',
      subtitle: 'Configuración completa de cargos y responsabilidades',
      company: 'TurnoFacil CO',
      generatedBy: 'Administrador',
      generatedAt: new Date(),
      data: filteredPositions,
      columns: [
        { key: 'name', title: 'Posición', type: 'text' },
        { key: 'department', title: 'Departamento', type: 'text' },
        { key: 'level', title: 'Nivel', type: 'text' },
        { key: 'baseSalary', title: 'Salario Base', type: 'currency' },
        { key: 'hourlyRate', title: 'Tarifa/Hora', type: 'currency' },
        { key: 'employeeCount', title: 'Empleados', type: 'number' },
        { key: 'status', title: 'Estado', type: 'text' }
      ],
      summary: [
        { label: 'Total Posiciones', value: filteredPositions.length, type: 'number' },
        { label: 'Posiciones Activas', value: filteredPositions.filter(p => p.status === 'active').length, type: 'number' },
        { label: 'Total Empleados', value: filteredPositions.reduce((sum, p) => sum + p.employeeCount, 0), type: 'number' },
        { label: 'Nómina Promedio', value: filteredPositions.reduce((sum, p) => sum + (p.baseSalary * p.employeeCount), 0), type: 'currency' }
      ]
    })
  }

  const totalPositions = positions.length
  const activePositions = positions.filter(p => p.status === 'active').length
  const totalEmployees = positions.reduce((sum, p) => sum + p.employeeCount, 0)
  const averageSalary = positions.length > 0 
    ? Math.round(positions.reduce((sum, p) => sum + p.baseSalary, 0) / positions.length)
    : 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Configuración de Posiciones</h1>
          <p className="text-gray-600">Define roles, responsabilidades y compensaciones</p>
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
            Nueva Posición
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
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 00-2 2H10a2 2 0 00-2-2V6m8 0h2a2 2 0 012 2v6.5M16 6H8M8 18v4.07M16 18v4.07" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-600">Total Posiciones</h3>
              <p className="text-2xl font-bold text-gray-900">{totalPositions}</p>
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
              <h3 className="text-sm font-medium text-gray-600">Posiciones Activas</h3>
              <p className="text-2xl font-bold text-gray-900">{activePositions}</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-600">Total Empleados</h3>
              <p className="text-2xl font-bold text-gray-900">{totalEmployees}</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-600">Salario Promedio</h3>
              <p className="text-xl font-bold text-gray-900">{formatCurrency(averageSalary)}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4">
          <div className="flex-1">
            <Input
              placeholder="Buscar posiciones..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex space-x-4">
            <select
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              value={filterDepartment}
              onChange={(e) => setFilterDepartment(e.target.value)}
            >
              <option value="all">Todos los departamentos</option>
              {departments.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
            <select
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              value={filterLevel}
              onChange={(e) => setFilterLevel(e.target.value)}
            >
              <option value="all">Todos los niveles</option>
              {levels.map(level => (
                <option key={level.value} value={level.value}>{level.label}</option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* Positions Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Posición
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Departamento
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nivel
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Salario Base
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Empleados
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
              {filteredPositions.map((position) => (
                <tr key={position.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{position.name}</div>
                      <div className="text-sm text-gray-500 truncate max-w-xs">
                        {position.description}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {position.department}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Tag variant={getLevelColor(position.level)}>
                      {getLevelText(position.level)}
                    </Tag>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div>
                      <div className="font-medium">{formatCurrency(position.baseSalary)}</div>
                      <div className="text-xs text-gray-500">
                        {formatCurrency(position.hourlyRate)}/hora
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex items-center">
                      <span className="font-medium">{position.employeeCount}</span>
                      {position.maxEmployees && (
                        <span className="text-gray-500 ml-1">/ {position.maxEmployees}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Tag variant={getStatusColor(position.status)}>
                      {getStatusText(position.status)}
                    </Tag>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <Button
                        variant="text"
                        size="sm"
                        onClick={() => openModal('view', position)}
                      >
                        Ver
                      </Button>
                      <Button
                        variant="text"
                        size="sm"
                        onClick={() => openModal('edit', position)}
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

      {/* Position Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={
          modalMode === 'create' ? 'Nueva Posición' :
          modalMode === 'edit' ? 'Editar Posición' :
          'Detalles de la Posición'
        }
        size="xl"
      >
        <div className="space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Nombre de la posición"
              value={formData.name || ''}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              disabled={modalMode === 'view'}
              required
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Departamento
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                value={formData.department || ''}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                disabled={modalMode === 'view'}
              >
                <option value="">Seleccionar departamento</option>
                {departments.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <Input
              label="Descripción"
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              disabled={modalMode === 'view'}
            />
          </div>

          {/* Compensation */}
          <div className="grid grid-cols-3 gap-4">
            <Input
              label="Salario base mensual"
              type="number"
              value={formData.baseSalary || ''}
              onChange={(e) => setFormData({ ...formData, baseSalary: Number(e.target.value) })}
              disabled={modalMode === 'view'}
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nivel
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                value={formData.level || 'entry'}
                onChange={(e) => setFormData({ ...formData, level: e.target.value as Position['level'] })}
                disabled={modalMode === 'view'}
              >
                {levels.map(level => (
                  <option key={level.value} value={level.value}>{level.label}</option>
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
                onChange={(e) => setFormData({ ...formData, status: e.target.value as Position['status'] })}
                disabled={modalMode === 'view'}
              >
                <option value="active">Activa</option>
                <option value="inactive">Inactiva</option>
              </select>
            </div>
          </div>

          {/* Eligibility */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="overtimeEligible"
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                checked={formData.overtimeEligible || false}
                onChange={(e) => setFormData({ ...formData, overtimeEligible: e.target.checked })}
                disabled={modalMode === 'view'}
              />
              <label htmlFor="overtimeEligible" className="ml-2 block text-sm text-gray-900">
                Elegible para horas extras
              </label>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="nightShiftEligible"
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                checked={formData.nightShiftEligible || false}
                onChange={(e) => setFormData({ ...formData, nightShiftEligible: e.target.checked })}
                disabled={modalMode === 'view'}
              />
              <label htmlFor="nightShiftEligible" className="ml-2 block text-sm text-gray-900">
                Elegible para turno nocturno
              </label>
            </div>
          </div>

          {/* Skills & Requirements - Solo mostrar en vista detallada */}
          {selectedPosition && modalMode === 'view' && (
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Habilidades Requeridas</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedPosition.requiredSkills?.map((skill, index) => (
                    <Tag key={index} variant="info">{skill}</Tag>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Responsabilidades</h4>
                <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                  {selectedPosition.responsibilities?.map((resp, index) => (
                    <li key={index}>{resp}</li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Requisitos</h4>
                <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                  {selectedPosition.requirements?.map((req, index) => (
                    <li key={index}>{req}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {modalMode !== 'view' && (
            <div className="flex justify-end space-x-4 pt-4">
              <Button variant="secondary" onClick={closeModal}>
                Cancelar
              </Button>
              <Button onClick={handleSave}>
                {modalMode === 'create' ? 'Crear Posición' : 'Guardar Cambios'}
              </Button>
            </div>
          )}
        </div>
      </Modal>

      <ReportModal />
    </div>
  )
}