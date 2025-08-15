'use client'

import React, { useState } from 'react'
import { Card, Button, Input, Modal, Tag } from '@/components/ui'
import { useReportGenerator } from '@/components/shared/ReportGenerator'

interface Location {
  id: string
  name: string
  address: string
  city: string
  capacity: number
  operatingHours: {
    open: string
    close: string
  }
  contactPhone?: string
  managerId?: string
  managerName?: string
  status: 'active' | 'inactive' | 'maintenance'
  employeeCount: number
  createdDate: string
}

const mockLocations: Location[] = [
  {
    id: '1',
    name: 'Sede Principal',
    address: 'Carrera 13 #85-32',
    city: 'Bogotá',
    capacity: 50,
    operatingHours: { open: '06:00', close: '22:00' },
    contactPhone: '+57 1 234-5678',
    managerId: '1',
    managerName: 'María García',
    status: 'active',
    employeeCount: 12,
    createdDate: '2023-01-15'
  },
  {
    id: '2',
    name: 'Sucursal Norte',
    address: 'Calle 127 #15-40',
    city: 'Bogotá',
    capacity: 30,
    operatingHours: { open: '08:00', close: '20:00' },
    contactPhone: '+57 1 345-6789',
    managerId: '2',
    managerName: 'Carlos López',
    status: 'active',
    employeeCount: 8,
    createdDate: '2023-03-20'
  },
  {
    id: '3',
    name: 'Punto Chapinero',
    address: 'Zona Rosa, Calle 63 #11-50',
    city: 'Bogotá',
    capacity: 20,
    operatingHours: { open: '10:00', close: '23:00' },
    contactPhone: '+57 1 456-7890',
    status: 'maintenance',
    employeeCount: 0,
    createdDate: '2023-06-10'
  }
]

const cities = ['Bogotá', 'Medellín', 'Cali', 'Barranquilla', 'Cartagena', 'Bucaramanga']

export default function LocationsPage() {
  const [locations, setLocations] = useState<Location[]>(mockLocations)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<Location['status'] | 'all'>('all')
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view'>('create')
  const [formData, setFormData] = useState<Partial<Location>>({
    name: '',
    address: '',
    city: '',
    capacity: 0,
    operatingHours: { open: '08:00', close: '18:00' },
    contactPhone: '',
    status: 'active'
  })

  const { generateReport, ReportModal } = useReportGenerator()

  const filteredLocations = locations.filter(location => {
    const matchesSearch = location.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         location.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         location.city.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === 'all' || location.status === filterStatus
    return matchesSearch && matchesStatus
  })

  const getStatusColor = (status: Location['status']) => {
    switch (status) {
      case 'active':
        return 'success'
      case 'inactive':
        return 'error'
      case 'maintenance':
        return 'warning'
      default:
        return 'default'
    }
  }

  const getStatusText = (status: Location['status']) => {
    switch (status) {
      case 'active':
        return 'Activa'
      case 'inactive':
        return 'Inactiva'
      case 'maintenance':
        return 'Mantenimiento'
      default:
        return status
    }
  }

  const openModal = (mode: 'create' | 'edit' | 'view', location?: Location) => {
    setModalMode(mode)
    if (location) {
      setSelectedLocation(location)
      setFormData(location)
    } else {
      setSelectedLocation(null)
      setFormData({
        name: '',
        address: '',
        city: '',
        capacity: 0,
        operatingHours: { open: '08:00', close: '18:00' },
        contactPhone: '',
        status: 'active'
      })
    }
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setSelectedLocation(null)
    setFormData({})
  }

  const handleSave = () => {
    if (modalMode === 'create') {
      const newLocation: Location = {
        ...formData as Location,
        id: Date.now().toString(),
        employeeCount: 0,
        createdDate: new Date().toISOString().split('T')[0]
      }
      setLocations([...locations, newLocation])
    } else if (modalMode === 'edit' && selectedLocation) {
      setLocations(locations.map(loc => 
        loc.id === selectedLocation.id ? { ...loc, ...formData } : loc
      ))
    }
    closeModal()
  }

  const handleExportReport = () => {
    generateReport({
      title: 'Reporte de Ubicaciones',
      subtitle: 'Lista completa de sedes y puntos de venta',
      company: 'TurnoFacil CO',
      generatedBy: 'Administrador',
      generatedAt: new Date(),
      data: filteredLocations,
      columns: [
        { key: 'name', title: 'Nombre', type: 'text' },
        { key: 'address', title: 'Dirección', type: 'text' },
        { key: 'city', title: 'Ciudad', type: 'text' },
        { key: 'capacity', title: 'Capacidad', type: 'number' },
        { key: 'employeeCount', title: 'Empleados', type: 'number' },
        { key: 'status', title: 'Estado', type: 'text' }
      ],
      summary: [
        { label: 'Total Ubicaciones', value: filteredLocations.length, type: 'number' },
        { label: 'Ubicaciones Activas', value: filteredLocations.filter(l => l.status === 'active').length, type: 'number' },
        { label: 'Capacidad Total', value: filteredLocations.reduce((sum, l) => sum + l.capacity, 0), type: 'number' },
        { label: 'Total Empleados', value: filteredLocations.reduce((sum, l) => sum + l.employeeCount, 0), type: 'number' }
      ]
    })
  }

  const totalCapacity = locations.reduce((sum, location) => sum + location.capacity, 0)
  const totalEmployees = locations.reduce((sum, location) => sum + location.employeeCount, 0)
  const activeLocations = locations.filter(l => l.status === 'active').length
  const utilizationRate = totalCapacity > 0 ? Math.round((totalEmployees / totalCapacity) * 100) : 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Gestión de Ubicaciones</h1>
          <p className="text-gray-600">Administra tus sedes y puntos de venta</p>
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
            Nueva Ubicación
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
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-600">Total Ubicaciones</h3>
              <p className="text-2xl font-bold text-gray-900">{locations.length}</p>
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
              <h3 className="text-sm font-medium text-gray-600">Ubicaciones Activas</h3>
              <p className="text-2xl font-bold text-gray-900">{activeLocations}</p>
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
              <h3 className="text-sm font-medium text-gray-600">Capacidad Total</h3>
              <p className="text-2xl font-bold text-gray-900">{totalCapacity}</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-600">Utilización</h3>
              <p className="text-2xl font-bold text-gray-900">{utilizationRate}%</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4">
          <div className="flex-1">
            <Input
              placeholder="Buscar ubicaciones..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex space-x-4">
            <select
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as Location['status'] | 'all')}
            >
              <option value="all">Todos los estados</option>
              <option value="active">Activas</option>
              <option value="inactive">Inactivas</option>
              <option value="maintenance">En mantenimiento</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Locations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredLocations.map((location) => (
          <Card key={location.id} className="hover:shadow-lg transition-shadow">
            <div className="space-y-4">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{location.name}</h3>
                  <p className="text-sm text-gray-500">{location.city}</p>
                </div>
                <Tag variant={getStatusColor(location.status)}>
                  {getStatusText(location.status)}
                </Tag>
              </div>

              {/* Details */}
              <div className="space-y-3">
                <div className="flex items-center text-sm text-gray-600">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {location.address}
                </div>

                <div className="flex items-center text-sm text-gray-600">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {location.operatingHours.open} - {location.operatingHours.close}
                </div>

                <div className="flex items-center text-sm text-gray-600">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  {location.employeeCount} / {location.capacity} empleados
                </div>

                {location.contactPhone && (
                  <div className="flex items-center text-sm text-gray-600">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    {location.contactPhone}
                  </div>
                )}

                {location.managerName && (
                  <div className="flex items-center text-sm text-gray-600">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Gerente: {location.managerName}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex justify-end space-x-2 pt-4 border-t border-gray-200">
                <Button
                  variant="text"
                  size="sm"
                  onClick={() => openModal('view', location)}
                >
                  Ver
                </Button>
                <Button
                  variant="text"
                  size="sm"
                  onClick={() => openModal('edit', location)}
                >
                  Editar
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Location Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={
          modalMode === 'create' ? 'Nueva Ubicación' :
          modalMode === 'edit' ? 'Editar Ubicación' :
          'Detalles de la Ubicación'
        }
        size="lg"
      >
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Nombre de la ubicación"
              value={formData.name || ''}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              disabled={modalMode === 'view'}
              required
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ciudad
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                value={formData.city || ''}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                disabled={modalMode === 'view'}
              >
                <option value="">Seleccionar ciudad</option>
                {cities.map(city => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </div>
          </div>

          <Input
            label="Dirección completa"
            value={formData.address || ''}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            disabled={modalMode === 'view'}
            required
          />

          <div className="grid grid-cols-3 gap-4">
            <Input
              label="Capacidad máxima"
              type="number"
              value={formData.capacity || ''}
              onChange={(e) => setFormData({ ...formData, capacity: Number(e.target.value) })}
              disabled={modalMode === 'view'}
            />
            <Input
              label="Hora de apertura"
              type="time"
              value={formData.operatingHours?.open || ''}
              onChange={(e) => setFormData({ 
                ...formData, 
                operatingHours: { ...formData.operatingHours!, open: e.target.value }
              })}
              disabled={modalMode === 'view'}
            />
            <Input
              label="Hora de cierre"
              type="time"
              value={formData.operatingHours?.close || ''}
              onChange={(e) => setFormData({ 
                ...formData, 
                operatingHours: { ...formData.operatingHours!, close: e.target.value }
              })}
              disabled={modalMode === 'view'}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Teléfono de contacto"
              value={formData.contactPhone || ''}
              onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
              disabled={modalMode === 'view'}
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Estado
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                value={formData.status || 'active'}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as Location['status'] })}
                disabled={modalMode === 'view'}
              >
                <option value="active">Activa</option>
                <option value="inactive">Inactiva</option>
                <option value="maintenance">En mantenimiento</option>
              </select>
            </div>
          </div>

          {modalMode !== 'view' && (
            <div className="flex justify-end space-x-4 pt-4">
              <Button variant="secondary" onClick={closeModal}>
                Cancelar
              </Button>
              <Button onClick={handleSave}>
                {modalMode === 'create' ? 'Crear Ubicación' : 'Guardar Cambios'}
              </Button>
            </div>
          )}
        </div>
      </Modal>

      <ReportModal />
    </div>
  )
}