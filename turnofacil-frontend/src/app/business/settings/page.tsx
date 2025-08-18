'use client'

import React, { useState } from 'react'
import { Card, Button, Input, Modal, Tag } from '@/components/ui'
import { useNotifications } from '@/components/shared/NotificationSystem'

interface Company {
  id: string
  name: string
  taxId: string
  address: string
  phone: string
  email: string
  website?: string
  industry: string
  employees: number
  logo?: string
}

interface BudgetPeriod {
  id: string
  year: number
  month?: number // Si es null, es presupuesto anual
  quarter?: number // 1, 2, 3, 4 - Si es null, es presupuesto mensual/anual
  amount: number
  allocated: number // Cantidad ya asignada
  spent: number // Cantidad ya gastada
}

interface Location {
  id: string
  name: string
  address: string
  phone: string
  managerName: string
  managerEmail: string
  capacity: number
  operatingHours: {
    monday: { open: string; close: string; closed: boolean }
    tuesday: { open: string; close: string; closed: boolean }
    wednesday: { open: string; close: string; closed: boolean }
    thursday: { open: string; close: string; closed: boolean }
    friday: { open: string; close: string; closed: boolean }
    saturday: { open: string; close: string; closed: boolean }
    sunday: { open: string; close: string; closed: boolean }
  }
  weeklyBudget: number // Mantener para compatibilidad
  budget: {
    type: 'weekly' | 'monthly' | 'quarterly' | 'annual'
    periods: BudgetPeriod[]
    autoDistribute: boolean // Si true, divide automáticamente por semanas
    alertThreshold: number // % para alertas (ej: 80)
  }
  status: 'active' | 'inactive'
}

interface WorkRule {
  id: string
  name: string
  type: 'overtime_limit' | 'shift_length' | 'break_requirement' | 'night_restriction' | 'sunday_restriction'
  value: number
  unit: 'hours' | 'minutes' | 'percentage'
  description: string
  mandatory: boolean
}

interface Holiday {
  id: string
  name: string
  date: string
  type: 'national' | 'regional' | 'company'
  recurring: boolean
  mandatory: boolean
}

const mockCompany: Company = {
  id: '1',
  name: 'Restaurante El Buen Sabor',
  taxId: '900123456-1',
  address: 'Calle 72 #10-15, Bogotá',
  phone: '+57 1 234-5678',
  email: 'info@buensabor.co',
  website: 'www.buensabor.co',
  industry: 'Restaurantes',
  employees: 45
}

const mockLocations: Location[] = [
  {
    id: '1',
    name: 'Sede Centro',
    address: 'Cra 7 #45-23, Bogotá',
    phone: '+57 1 234-5678',
    managerName: 'María García',
    managerEmail: 'maria@buensabor.co',
    capacity: 80,
    weeklyBudget: 12000000,
    budget: {
      type: 'monthly',
      autoDistribute: true,
      alertThreshold: 80,
      periods: [
        {
          id: 'budget-2024-01',
          year: 2024,
          month: 1,
          amount: 48000000, // $48M mensuales
          allocated: 36000000,
          spent: 34000000
        },
        {
          id: 'budget-2024-02',
          year: 2024,
          month: 2,
          amount: 48000000,
          allocated: 40000000,
          spent: 38500000
        }
      ]
    },
    status: 'active',
    operatingHours: {
      monday: { open: '06:00', close: '22:00', closed: false },
      tuesday: { open: '06:00', close: '22:00', closed: false },
      wednesday: { open: '06:00', close: '22:00', closed: false },
      thursday: { open: '06:00', close: '22:00', closed: false },
      friday: { open: '06:00', close: '23:00', closed: false },
      saturday: { open: '07:00', close: '23:00', closed: false },
      sunday: { open: '08:00', close: '20:00', closed: false }
    }
  },
  {
    id: '2',
    name: 'Sede Norte',
    address: 'Cll 140 #15-30, Bogotá',
    phone: '+57 1 345-6789',
    managerName: 'Carlos López',
    managerEmail: 'carlos@buensabor.co',
    capacity: 60,
    weeklyBudget: 10000000,
    budget: {
      type: 'quarterly',
      autoDistribute: true,
      alertThreshold: 85,
      periods: [
        {
          id: 'budget-2024-q1',
          year: 2024,
          quarter: 1,
          amount: 120000000, // $120M trimestrales
          allocated: 90000000,
          spent: 86500000
        }
      ]
    },
    status: 'active',
    operatingHours: {
      monday: { open: '07:00', close: '21:00', closed: false },
      tuesday: { open: '07:00', close: '21:00', closed: false },
      wednesday: { open: '07:00', close: '21:00', closed: false },
      thursday: { open: '07:00', close: '21:00', closed: false },
      friday: { open: '07:00', close: '22:00', closed: false },
      saturday: { open: '08:00', close: '22:00', closed: false },
      sunday: { open: '00:00', close: '00:00', closed: true }
    }
  }
]

const mockWorkRules: WorkRule[] = [
  {
    id: '1',
    name: 'Límite de horas extras semanales',
    type: 'overtime_limit',
    value: 12,
    unit: 'hours',
    description: 'Máximo de horas extras permitidas por empleado por semana',
    mandatory: true
  },
  {
    id: '2',
    name: 'Duración máxima de turno',
    type: 'shift_length',
    value: 8,
    unit: 'hours',
    description: 'Duración máxima permitida para un turno regular',
    mandatory: true
  },
  {
    id: '3',
    name: 'Tiempo mínimo de descanso',
    type: 'break_requirement',
    value: 30,
    unit: 'minutes',
    description: 'Tiempo mínimo de descanso para turnos de más de 6 horas',
    mandatory: true
  },
  {
    id: '4',
    name: 'Recargo nocturno',
    type: 'night_restriction',
    value: 35,
    unit: 'percentage',
    description: 'Recargo porcentual para turnos nocturnos (21:00 - 06:00)',
    mandatory: true
  },
  {
    id: '5',
    name: 'Recargo dominical',
    type: 'sunday_restriction',
    value: 75,
    unit: 'percentage',
    description: 'Recargo porcentual para trabajo en domingos y festivos',
    mandatory: true
  }
]

const mockHolidays: Holiday[] = [
  {
    id: '1',
    name: 'Año Nuevo',
    date: '2024-01-01',
    type: 'national',
    recurring: true,
    mandatory: true
  },
  {
    id: '2',
    name: 'Día de los Reyes Magos',
    date: '2024-01-08',
    type: 'national',
    recurring: true,
    mandatory: true
  },
  {
    id: '3',
    name: 'Día de San José',
    date: '2024-03-25',
    type: 'national',
    recurring: true,
    mandatory: true
  },
  {
    id: '4',
    name: 'Jueves Santo',
    date: '2024-03-28',
    type: 'national',
    recurring: false,
    mandatory: true
  },
  {
    id: '5',
    name: 'Viernes Santo',
    date: '2024-03-29',
    type: 'national',
    recurring: false,
    mandatory: true
  },
  {
    id: '6',
    name: 'Día del Trabajo',
    date: '2024-05-01',
    type: 'national',
    recurring: true,
    mandatory: true
  },
  {
    id: '7',
    name: 'Aniversario de la empresa',
    date: '2024-06-15',
    type: 'company',
    recurring: true,
    mandatory: false
  }
]

// Funciones auxiliares para manejo de presupuestos
const getBudgetForPeriod = (location: Location, year: number, month?: number, quarter?: number): BudgetPeriod | null => {
  return location.budget.periods.find(period => {
    if (period.year !== year) return false
    if (month && period.month !== month) return false
    if (quarter && period.quarter !== quarter) return false
    return true
  }) || null
}

const calculateWeeklyBudget = (location: Location, year: number, month: number): number => {
  const budget = getBudgetForPeriod(location, year, month)
  if (!budget) return location.weeklyBudget
  
  if (location.budget.autoDistribute) {
    // Calcular semanas en el mes
    const daysInMonth = new Date(year, month, 0).getDate()
    const weeksInMonth = Math.ceil(daysInMonth / 7)
    return Math.round(budget.amount / weeksInMonth)
  }
  
  return location.weeklyBudget
}

const getBudgetUtilization = (period: BudgetPeriod): number => {
  return (period.spent / period.amount) * 100
}

const getBudgetStatus = (utilization: number, threshold: number): 'success' | 'warning' | 'error' => {
  if (utilization >= 100) return 'error'
  if (utilization >= threshold) return 'warning'
  return 'success'
}

const formatCurrency = (amount: number): string => {
  if (amount >= 1000000) {
    return `$${(amount / 1000000).toFixed(1)}M`
  }
  if (amount >= 1000) {
    return `$${(amount / 1000).toFixed(0)}K`
  }
  return `$${amount.toLocaleString()}`
}

const getBudgetTypeLabel = (type: Location['budget']['type']): string => {
  const labels = {
    weekly: 'Semanal',
    monthly: 'Mensual',
    quarterly: 'Trimestral',
    annual: 'Anual'
  }
  return labels[type]
}

export default function BusinessSettings() {
  const { addNotification } = useNotifications()
  const [activeTab, setActiveTab] = useState('company')
  const [company, setCompany] = useState<Company>(mockCompany)
  const [locations, setLocations] = useState<Location[]>(mockLocations)
  const [workRules, setWorkRules] = useState<WorkRule[]>(mockWorkRules)
  const [holidays, setHolidays] = useState<Holiday[]>(mockHolidays)
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null)
  const [showLocationModal, setShowLocationModal] = useState(false)
  const [showHolidayModal, setShowHolidayModal] = useState(false)
  const [showWorkRuleModal, setShowWorkRuleModal] = useState(false)
  const [selectedHoliday, setSelectedHoliday] = useState<Holiday | null>(null)
  const [selectedWorkRule, setSelectedWorkRule] = useState<WorkRule | null>(null)
  const [showBudgetModal, setShowBudgetModal] = useState(false)
  const [selectedBudgetLocation, setSelectedBudgetLocation] = useState<Location | null>(null)
  const [selectedBudgetPeriod, setSelectedBudgetPeriod] = useState<BudgetPeriod | null>(null)

  const tabs = [
    { id: 'company', name: 'Información de la Empresa', icon: '🏢' },
    { id: 'locations', name: 'Ubicaciones', icon: '📍' },
    { id: 'budgets', name: 'Gestión de Presupuestos', icon: '💰' },
    { id: 'work-rules', name: 'Reglas Laborales', icon: '📋' },
    { id: 'holidays', name: 'Calendario de Festivos', icon: '📅' },
    { id: 'notifications', name: 'Notificaciones', icon: '🔔' },
    { id: 'users', name: 'Gestión de Usuarios', icon: '👥' }
  ]

  const handleSaveCompany = () => {
    addNotification({ type: 'success', title: 'Éxito', message: 'Información de la empresa actualizada' })
  }

  const handleSaveLocation = (locationData: Location) => {
    if (selectedLocation) {
      setLocations(prev => prev.map(loc => 
        loc.id === selectedLocation.id ? locationData : loc
      ))
      addNotification({ type: 'success', title: 'Éxito', message: 'Ubicación actualizada' })
    } else {
      const newLocation = { ...locationData, id: `loc-${Date.now()}` }
      setLocations(prev => [...prev, newLocation])
      addNotification({ type: 'success', title: 'Éxito', message: 'Nueva ubicación agregada' })
    }
    setShowLocationModal(false)
    setSelectedLocation(null)
  }

  const handleDeleteLocation = (locationId: string) => {
    setLocations(prev => prev.filter(loc => loc.id !== locationId))
    addNotification({ type: 'success', title: 'Éxito', message: 'Ubicación eliminada' })
  }

  const handleSaveHoliday = (holidayData: Holiday) => {
    if (selectedHoliday) {
      setHolidays(prev => prev.map(holiday => 
        holiday.id === selectedHoliday.id ? holidayData : holiday
      ))
      addNotification({ type: 'success', title: 'Éxito', message: 'Festivo actualizado' })
    } else {
      const newHoliday = { ...holidayData, id: `holiday-${Date.now()}` }
      setHolidays(prev => [...prev, newHoliday])
      addNotification({ type: 'success', title: 'Éxito', message: 'Nuevo festivo agregado' })
    }
    setShowHolidayModal(false)
    setSelectedHoliday(null)
  }

  const handleDeleteHoliday = (holidayId: string) => {
    setHolidays(prev => prev.filter(holiday => holiday.id !== holidayId))
    addNotification({ type: 'success', title: 'Éxito', message: 'Festivo eliminado' })
  }

  const handleSaveWorkRule = (ruleData: WorkRule) => {
    if (selectedWorkRule) {
      setWorkRules(prev => prev.map(rule => 
        rule.id === selectedWorkRule.id ? ruleData : rule
      ))
      addNotification({ type: 'success', title: 'Éxito', message: 'Regla laboral actualizada' })
    } else {
      const newRule = { ...ruleData, id: `rule-${Date.now()}` }
      setWorkRules(prev => [...prev, newRule])
      addNotification({ type: 'success', title: 'Éxito', message: 'Nueva regla laboral agregada' })
    }
    setShowWorkRuleModal(false)
    setSelectedWorkRule(null)
  }

  const getDayName = (day: string) => {
    const days = {
      monday: 'Lunes',
      tuesday: 'Martes',
      wednesday: 'Miércoles',
      thursday: 'Jueves',
      friday: 'Viernes',
      saturday: 'Sábado',
      sunday: 'Domingo'
    }
    return days[day as keyof typeof days]
  }

  const getWorkRuleTypeLabel = (type: WorkRule['type']) => {
    const types = {
      overtime_limit: 'Límite de horas extras',
      shift_length: 'Duración de turno',
      break_requirement: 'Tiempo de descanso',
      night_restriction: 'Restricción nocturna',
      sunday_restriction: 'Restricción dominical'
    }
    return types[type]
  }

  const getUnitLabel = (unit: WorkRule['unit']) => {
    const units = {
      hours: 'horas',
      minutes: 'minutos',
      percentage: '%'
    }
    return units[unit]
  }

  const renderCompanyTab = () => (
    <Card>
      <div className="p-6">
        <h2 className="text-xl font-semibold mb-6">Información de la Empresa</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-neutral-dark-gray mb-2">
              Nombre de la empresa
            </label>
            <Input
              value={company.name}
              onChange={(e) => setCompany({...company, name: e.target.value})}
              placeholder="Nombre de la empresa"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-neutral-dark-gray mb-2">
              NIT
            </label>
            <Input
              value={company.taxId}
              onChange={(e) => setCompany({...company, taxId: e.target.value})}
              placeholder="123456789-1"
            />
          </div>
          
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-neutral-dark-gray mb-2">
              Dirección
            </label>
            <Input
              value={company.address}
              onChange={(e) => setCompany({...company, address: e.target.value})}
              placeholder="Dirección completa"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-neutral-dark-gray mb-2">
              Teléfono
            </label>
            <Input
              value={company.phone}
              onChange={(e) => setCompany({...company, phone: e.target.value})}
              placeholder="+57 1 234-5678"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-neutral-dark-gray mb-2">
              Email
            </label>
            <Input
              type="email"
              value={company.email}
              onChange={(e) => setCompany({...company, email: e.target.value})}
              placeholder="info@empresa.com"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-neutral-dark-gray mb-2">
              Sitio web
            </label>
            <Input
              value={company.website || ''}
              onChange={(e) => setCompany({...company, website: e.target.value})}
              placeholder="www.empresa.com"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-neutral-dark-gray mb-2">
              Industria
            </label>
            <select
              value={company.industry}
              onChange={(e) => setCompany({...company, industry: e.target.value})}
              className="w-full px-3 py-2 border border-neutral-light-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="Restaurantes">Restaurantes</option>
              <option value="Retail">Retail</option>
              <option value="Servicios">Servicios</option>
              <option value="Manufactura">Manufactura</option>
              <option value="Tecnología">Tecnología</option>
              <option value="Salud">Salud</option>
              <option value="Educación">Educación</option>
              <option value="Otro">Otro</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-neutral-dark-gray mb-2">
              Número de empleados
            </label>
            <Input
              type="number"
              value={company.employees}
              onChange={(e) => setCompany({...company, employees: parseInt(e.target.value)})}
              placeholder="45"
            />
          </div>
        </div>
        
        <div className="mt-6 flex justify-end">
          <Button onClick={handleSaveCompany}>
            Guardar Cambios
          </Button>
        </div>
      </div>
    </Card>
  )

  const renderLocationsTab = () => (
    <Card>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">Ubicaciones</h2>
          <Button 
            onClick={() => {
              setSelectedLocation(null)
              setShowLocationModal(true)
            }}
          >
            Agregar Ubicación
          </Button>
        </div>
        
        <div className="space-y-4">
          {locations.map(location => (
            <div key={location.id} className="border border-neutral-light-gray rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-semibold">{location.name}</h3>
                    <Tag variant={location.status === 'active' ? 'success' : 'error'}>
                      {location.status === 'active' ? 'Activa' : 'Inactiva'}
                    </Tag>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-neutral-medium-gray">Dirección</p>
                      <p className="font-medium">{location.address}</p>
                    </div>
                    <div>
                      <p className="text-neutral-medium-gray">Gerente</p>
                      <p className="font-medium">{location.managerName}</p>
                    </div>
                    <div>
                      <p className="text-neutral-medium-gray">Capacidad</p>
                      <p className="font-medium">{location.capacity} personas</p>
                    </div>
                  </div>
                  
                  <div className="mt-3">
                    <p className="text-neutral-medium-gray text-sm mb-1">Horarios de operación</p>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(location.operatingHours).map(([day, hours]) => (
                        <span key={day} className="text-xs px-2 py-1 bg-neutral-off-white rounded">
                          {getDayName(day)}: {hours.closed ? 'Cerrado' : `${hours.open} - ${hours.close}`}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <div className="mt-3">
                    <p className="text-neutral-medium-gray text-sm">Presupuesto semanal</p>
                    <p className="font-medium">${location.weeklyBudget.toLocaleString()}</p>
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      setSelectedLocation(location)
                      setShowLocationModal(true)
                    }}
                  >
                    Editar
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => handleDeleteLocation(location.id)}
                  >
                    Eliminar
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  )

  const renderWorkRulesTab = () => (
    <Card>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">Reglas Laborales</h2>
          <Button 
            onClick={() => {
              setSelectedWorkRule(null)
              setShowWorkRuleModal(true)
            }}
          >
            Agregar Regla
          </Button>
        </div>
        
        <div className="space-y-4">
          {workRules.map(rule => (
            <div key={rule.id} className="border border-neutral-light-gray rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-semibold">{rule.name}</h3>
                    {rule.mandatory && (
                      <Tag variant="error">Obligatoria</Tag>
                    )}
                  </div>
                  
                  <p className="text-sm text-neutral-dark-gray mb-2">{rule.description}</p>
                  
                  <div className="flex items-center space-x-4 text-sm">
                    <div>
                      <p className="text-neutral-medium-gray">Tipo</p>
                      <p className="font-medium">{getWorkRuleTypeLabel(rule.type)}</p>
                    </div>
                    <div>
                      <p className="text-neutral-medium-gray">Valor</p>
                      <p className="font-medium">{rule.value} {getUnitLabel(rule.unit)}</p>
                    </div>
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      setSelectedWorkRule(rule)
                      setShowWorkRuleModal(true)
                    }}
                  >
                    Editar
                  </Button>
                  {!rule.mandatory && (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => {
                        setWorkRules(prev => prev.filter(r => r.id !== rule.id))
                        addNotification({ type: 'success', title: 'Éxito', message: 'Regla eliminada' })
                      }}
                    >
                      Eliminar
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  )

  const renderHolidaysTab = () => (
    <Card>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">Calendario de Festivos</h2>
          <Button 
            onClick={() => {
              setSelectedHoliday(null)
              setShowHolidayModal(true)
            }}
          >
            Agregar Festivo
          </Button>
        </div>
        
        <div className="space-y-4">
          {holidays.map(holiday => (
            <div key={holiday.id} className="border border-neutral-light-gray rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-semibold">{holiday.name}</h3>
                    <Tag variant={
                      holiday.type === 'national' ? 'error' :
                      holiday.type === 'regional' ? 'warning' :
                      'info'
                    }>
                      {holiday.type === 'national' ? 'Nacional' :
                       holiday.type === 'regional' ? 'Regional' :
                       'Empresarial'}
                    </Tag>
                    {holiday.mandatory && (
                      <Tag variant="default">Obligatorio</Tag>
                    )}
                    {holiday.recurring && (
                      <Tag variant="success">Recurrente</Tag>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-4 text-sm">
                    <div>
                      <p className="text-neutral-medium-gray">Fecha</p>
                      <p className="font-medium">
                        {new Date(holiday.date).toLocaleDateString('es-CO', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      setSelectedHoliday(holiday)
                      setShowHolidayModal(true)
                    }}
                  >
                    Editar
                  </Button>
                  {holiday.type === 'company' && (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleDeleteHoliday(holiday.id)}
                    >
                      Eliminar
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  )

  const renderNotificationsTab = () => (
    <Card>
      <div className="p-6">
        <h2 className="text-xl font-semibold mb-6">Configuración de Notificaciones</h2>
        
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium mb-4">Notificaciones de Horarios</h3>
            <div className="space-y-3">
              {[
                { id: 'schedule_published', label: 'Horario publicado', description: 'Notificar cuando se publique un nuevo horario' },
                { id: 'schedule_changed', label: 'Cambios de horario', description: 'Notificar cuando se modifique un horario existente' },
                { id: 'shift_reminder', label: 'Recordatorio de turno', description: 'Recordar a empleados sobre turnos próximos' }
              ].map(item => (
                <div key={item.id} className="flex items-center justify-between p-3 bg-neutral-off-white rounded-lg">
                  <div>
                    <p className="font-medium">{item.label}</p>
                    <p className="text-sm text-neutral-medium-gray">{item.description}</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="w-11 h-6 bg-neutral-light-gray peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>
              ))}
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-medium mb-4">Notificaciones de Solicitudes</h3>
            <div className="space-y-3">
              {[
                { id: 'request_submitted', label: 'Nueva solicitud', description: 'Notificar cuando un empleado envíe una solicitud' },
                { id: 'request_approved', label: 'Solicitud aprobada', description: 'Notificar al empleado cuando se apruebe su solicitud' },
                { id: 'request_rejected', label: 'Solicitud rechazada', description: 'Notificar al empleado cuando se rechace su solicitud' }
              ].map(item => (
                <div key={item.id} className="flex items-center justify-between p-3 bg-neutral-off-white rounded-lg">
                  <div>
                    <p className="font-medium">{item.label}</p>
                    <p className="text-sm text-neutral-medium-gray">{item.description}</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="w-11 h-6 bg-neutral-light-gray peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>
              ))}
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-medium mb-4">Canales de Notificación</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-dark-gray mb-2">
                  Email para notificaciones
                </label>
                <Input
                  type="email"
                  defaultValue="admin@buensabor.co"
                  placeholder="admin@empresa.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-dark-gray mb-2">
                  WhatsApp para alertas urgentes
                </label>
                <Input
                  type="tel"
                  defaultValue="+57 300 123 4567"
                  placeholder="+57 300 123 4567"
                />
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-6 flex justify-end">
          <Button onClick={() => addNotification({ type: 'success', title: 'Éxito', message: 'Configuración de notificaciones actualizada' })}>
            Guardar Configuración
          </Button>
        </div>
      </div>
    </Card>
  )

  const renderUsersTab = () => (
    <Card>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">Gestión de Usuarios</h2>
          <Button>
            Invitar Usuario
          </Button>
        </div>
        
        <div className="space-y-4">
          {[
            { name: 'María García', email: 'maria@buensabor.co', role: 'Supervisor', location: 'Sede Centro', status: 'active' },
            { name: 'Carlos López', email: 'carlos@buensabor.co', role: 'Supervisor', location: 'Sede Norte', status: 'active' },
            { name: 'Ana Rodríguez', email: 'ana@buensabor.co', role: 'Empleado', location: 'Sede Centro', status: 'active' },
            { name: 'Pedro Martínez', email: 'pedro@buensabor.co', role: 'Empleado', location: 'Sede Norte', status: 'inactive' }
          ].map((user, idx) => (
            <div key={idx} className="border border-neutral-light-gray rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <span className="text-primary font-semibold">
                      {user.name.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-semibold">{user.name}</h3>
                    <p className="text-sm text-neutral-medium-gray">{user.email}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="text-sm">
                    <p className="font-medium">{user.role}</p>
                    <p className="text-neutral-medium-gray">{user.location}</p>
                  </div>
                  <Tag variant={user.status === 'active' ? 'success' : 'error'}>
                    {user.status === 'active' ? 'Activo' : 'Inactivo'}
                  </Tag>
                  <Button size="sm" variant="secondary">
                    Editar
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  )

  const renderBudgetsTab = () => (
    <div className="space-y-6">
      {/* Header with summary */}
      <Card>
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-neutral-black">Gestión de Presupuestos</h2>
              <p className="text-neutral-medium-gray mt-1">
                Administra los presupuestos por ubicación y período
              </p>
            </div>
            <Button
              onClick={() => {
                setSelectedBudgetLocation(null)
                setSelectedBudgetPeriod(null)
                setShowBudgetModal(true)
              }}
            >
              Nuevo Período
            </Button>
          </div>

          {/* Summary cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-primary/5 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-neutral-dark-gray mb-2">Total Presupuestado</h3>
              <p className="text-2xl font-bold text-primary">
                {formatCurrency(locations.reduce((sum, loc) => 
                  sum + (loc.budget.periods[0]?.amount || 0), 0))}
              </p>
            </div>
            <div className="bg-semantic-success/5 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-neutral-dark-gray mb-2">Total Gastado</h3>
              <p className="text-2xl font-bold text-semantic-success">
                {formatCurrency(locations.reduce((sum, loc) => 
                  sum + (loc.budget.periods[0]?.spent || 0), 0))}
              </p>
            </div>
            <div className="bg-semantic-warning/5 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-neutral-dark-gray mb-2">Total Disponible</h3>
              <p className="text-2xl font-bold text-semantic-warning">
                {formatCurrency(locations.reduce((sum, loc) => {
                  const period = loc.budget.periods[0]
                  return sum + (period ? period.amount - period.spent : 0)
                }, 0))}
              </p>
            </div>
            <div className="bg-neutral-off-white p-4 rounded-lg">
              <h3 className="text-sm font-medium text-neutral-dark-gray mb-2">Utilización Promedio</h3>
              <p className="text-2xl font-bold text-neutral-dark-gray">
                {Math.round(locations.reduce((sum, loc) => {
                  const period = loc.budget.periods[0]
                  return sum + (period ? getBudgetUtilization(period) : 0)
                }, 0) / locations.length)}%
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Budget by location */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {locations.map(location => (
          <Card key={location.id}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-neutral-black">{location.name}</h3>
                  <p className="text-sm text-neutral-medium-gray">
                    Presupuesto {getBudgetTypeLabel(location.budget.type)}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    setSelectedBudgetLocation(location)
                    setSelectedBudgetPeriod(null)
                    setShowBudgetModal(true)
                  }}
                >
                  Agregar Período
                </Button>
              </div>

              {/* Current period summary */}
              {location.budget.periods.length > 0 && (
                <div className="space-y-4">
                  {location.budget.periods.slice(0, 2).map(period => {
                    const utilization = getBudgetUtilization(period)
                    const status = getBudgetStatus(utilization, location.budget.alertThreshold)
                    
                    return (
                      <div key={period.id} className="border border-neutral-light-gray rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h4 className="font-medium">
                              {period.month ? `${getMonthName(period.month)} ${period.year}` :
                               period.quarter ? `Q${period.quarter} ${period.year}` :
                               `Año ${period.year}`}
                            </h4>
                            <p className="text-sm text-neutral-medium-gray">
                              {formatCurrency(period.spent)} de {formatCurrency(period.amount)}
                            </p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Tag variant={status}>
                              {utilization.toFixed(1)}%
                            </Tag>
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => {
                                setSelectedBudgetLocation(location)
                                setSelectedBudgetPeriod(period)
                                setShowBudgetModal(true)
                              }}
                            >
                              Editar
                            </Button>
                          </div>
                        </div>
                        
                        {/* Progress bar */}
                        <div className="w-full bg-neutral-light-gray rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full transition-all duration-300 ${
                              status === 'error' ? 'bg-semantic-error' :
                              status === 'warning' ? 'bg-semantic-warning' :
                              'bg-semantic-success'
                            }`}
                            style={{ width: `${Math.min(utilization, 100)}%` }}
                          />
                        </div>
                        
                        {utilization >= location.budget.alertThreshold && (
                          <div className={`mt-2 p-2 rounded text-sm ${
                            utilization >= 100 
                              ? 'bg-semantic-error/10 text-semantic-error' 
                              : 'bg-semantic-warning/10 text-semantic-warning'
                          }`}>
                            {utilization >= 100 
                              ? '⚠️ Presupuesto excedido'
                              : `⚠️ Cerca del límite (${location.budget.alertThreshold}%)`}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}

              {location.budget.periods.length === 0 && (
                <div className="text-center py-8">
                  <div className="w-12 h-12 bg-neutral-light-gray rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-xl">💰</span>
                  </div>
                  <p className="text-neutral-medium-gray">No hay períodos de presupuesto configurados</p>
                  <Button
                    size="sm"
                    className="mt-3"
                    onClick={() => {
                      setSelectedBudgetLocation(location)
                      setSelectedBudgetPeriod(null)
                      setShowBudgetModal(true)
                    }}
                  >
                    Configurar Presupuesto
                  </Button>
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  )

  // Helper function for month names
  const getMonthName = (month: number): string => {
    const months = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ]
    return months[month - 1]
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-lg p-6">
        <h1 className="text-2xl font-bold text-neutral-black mb-2">
          Configuración del Sistema
        </h1>
        <p className="text-neutral-dark-gray">
          Administra la configuración general de tu empresa y ubicaciones
        </p>
      </div>

      {/* Navigation tabs */}
      <div className="flex space-x-1 bg-neutral-off-white p-1 rounded-lg overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-white text-primary shadow-sm'
                : 'text-neutral-medium-gray hover:text-neutral-black'
            }`}
          >
            <span className="mr-2">{tab.icon}</span>
            {tab.name}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'company' && renderCompanyTab()}
      {activeTab === 'locations' && renderLocationsTab()}
      {activeTab === 'budgets' && renderBudgetsTab()}
      {activeTab === 'work-rules' && renderWorkRulesTab()}
      {activeTab === 'holidays' && renderHolidaysTab()}
      {activeTab === 'notifications' && renderNotificationsTab()}
      {activeTab === 'users' && renderUsersTab()}

      {/* Location Modal */}
      <Modal
        isOpen={showLocationModal}
        onClose={() => {
          setShowLocationModal(false)
          setSelectedLocation(null)
        }}
        title={selectedLocation ? 'Editar Ubicación' : 'Nueva Ubicación'}
      >
        <LocationForm
          location={selectedLocation}
          onSave={handleSaveLocation}
          onCancel={() => {
            setShowLocationModal(false)
            setSelectedLocation(null)
          }}
        />
      </Modal>

      {/* Holiday Modal */}
      <Modal
        isOpen={showHolidayModal}
        onClose={() => {
          setShowHolidayModal(false)
          setSelectedHoliday(null)
        }}
        title={selectedHoliday ? 'Editar Festivo' : 'Nuevo Festivo'}
      >
        <HolidayForm
          holiday={selectedHoliday}
          onSave={handleSaveHoliday}
          onCancel={() => {
            setShowHolidayModal(false)
            setSelectedHoliday(null)
          }}
        />
      </Modal>

      {/* Work Rule Modal */}
      <Modal
        isOpen={showWorkRuleModal}
        onClose={() => {
          setShowWorkRuleModal(false)
          setSelectedWorkRule(null)
        }}
        title={selectedWorkRule ? 'Editar Regla Laboral' : 'Nueva Regla Laboral'}
      >
        <WorkRuleForm
          workRule={selectedWorkRule}
          onSave={handleSaveWorkRule}
          onCancel={() => {
            setShowWorkRuleModal(false)
            setSelectedWorkRule(null)
          }}
        />
      </Modal>

      {/* Budget Modal */}
      <Modal
        isOpen={showBudgetModal}
        onClose={() => {
          setShowBudgetModal(false)
          setSelectedBudgetLocation(null)
          setSelectedBudgetPeriod(null)
        }}
        title={selectedBudgetPeriod ? 'Editar Período de Presupuesto' : 'Nuevo Período de Presupuesto'}
      >
        <BudgetForm
          location={selectedBudgetLocation}
          period={selectedBudgetPeriod}
          locations={locations}
          onSave={(locationId, periodData) => {
            if (selectedBudgetPeriod) {
              // Update existing period
              setLocations(prev => prev.map(loc => {
                if (loc.id === locationId) {
                  return {
                    ...loc,
                    budget: {
                      ...loc.budget,
                      periods: loc.budget.periods.map(p => 
                        p.id === selectedBudgetPeriod.id ? periodData : p
                      )
                    }
                  }
                }
                return loc
              }))
              addNotification({ type: 'success', title: 'Éxito', message: 'Período de presupuesto actualizado' })
            } else {
              // Add new period
              setLocations(prev => prev.map(loc => {
                if (loc.id === locationId) {
                  return {
                    ...loc,
                    budget: {
                      ...loc.budget,
                      periods: [...loc.budget.periods, { ...periodData, id: `budget-${Date.now()}` }]
                    }
                  }
                }
                return loc
              }))
              addNotification({ type: 'success', title: 'Éxito', message: 'Nuevo período de presupuesto creado' })
            }
            setShowBudgetModal(false)
            setSelectedBudgetLocation(null)
            setSelectedBudgetPeriod(null)
          }}
          onCancel={() => {
            setShowBudgetModal(false)
            setSelectedBudgetLocation(null)
            setSelectedBudgetPeriod(null)
          }}
        />
      </Modal>
    </div>
  )
}

// Location Form Component
function LocationForm({ 
  location, 
  onSave, 
  onCancel 
}: { 
  location: Location | null
  onSave: (location: Location) => void
  onCancel: () => void
}) {
  const [formData, setFormData] = useState<Location>(
    location || {
      id: '',
      name: '',
      address: '',
      phone: '',
      managerName: '',
      managerEmail: '',
      capacity: 0,
      weeklyBudget: 0,
      status: 'active',
      operatingHours: {
        monday: { open: '08:00', close: '18:00', closed: false },
        tuesday: { open: '08:00', close: '18:00', closed: false },
        wednesday: { open: '08:00', close: '18:00', closed: false },
        thursday: { open: '08:00', close: '18:00', closed: false },
        friday: { open: '08:00', close: '18:00', closed: false },
        saturday: { open: '08:00', close: '18:00', closed: false },
        sunday: { open: '08:00', close: '18:00', closed: true }
      },
      budget: {
        type: 'weekly' as const,
        periods: [],
        autoDistribute: false,
        alertThreshold: 80
      }
    }
  )

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-neutral-dark-gray mb-1">
            Nombre de la ubicación
          </label>
          <Input
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
            placeholder="Sede Centro"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-neutral-dark-gray mb-1">
            Estado
          </label>
          <select
            value={formData.status}
            onChange={(e) => setFormData({...formData, status: e.target.value as 'active' | 'inactive'})}
            className="w-full px-3 py-2 border border-neutral-light-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="active">Activa</option>
            <option value="inactive">Inactiva</option>
          </select>
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-neutral-dark-gray mb-1">
          Dirección
        </label>
        <Input
          value={formData.address}
          onChange={(e) => setFormData({...formData, address: e.target.value})}
          placeholder="Cra 7 #45-23, Bogotá"
          required
        />
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-neutral-dark-gray mb-1">
            Teléfono
          </label>
          <Input
            value={formData.phone}
            onChange={(e) => setFormData({...formData, phone: e.target.value})}
            placeholder="+57 1 234-5678"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-neutral-dark-gray mb-1">
            Capacidad
          </label>
          <Input
            type="number"
            value={formData.capacity}
            onChange={(e) => setFormData({...formData, capacity: parseInt(e.target.value)})}
            placeholder="80"
            required
          />
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-neutral-dark-gray mb-1">
            Nombre del gerente
          </label>
          <Input
            value={formData.managerName}
            onChange={(e) => setFormData({...formData, managerName: e.target.value})}
            placeholder="María García"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-neutral-dark-gray mb-1">
            Email del gerente
          </label>
          <Input
            type="email"
            value={formData.managerEmail}
            onChange={(e) => setFormData({...formData, managerEmail: e.target.value})}
            placeholder="maria@empresa.com"
            required
          />
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-neutral-dark-gray mb-1">
          Presupuesto semanal
        </label>
        <Input
          type="number"
          value={formData.weeklyBudget}
          onChange={(e) => setFormData({...formData, weeklyBudget: parseInt(e.target.value)})}
          placeholder="12000000"
          required
        />
      </div>
      
      <div className="flex justify-end space-x-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit">
          {location ? 'Actualizar' : 'Crear'} Ubicación
        </Button>
      </div>
    </form>
  )
}

// Holiday Form Component
function HolidayForm({ 
  holiday, 
  onSave, 
  onCancel 
}: { 
  holiday: Holiday | null
  onSave: (holiday: Holiday) => void
  onCancel: () => void
}) {
  const [formData, setFormData] = useState<Holiday>(
    holiday || {
      id: '',
      name: '',
      date: '',
      type: 'company',
      recurring: false,
      mandatory: false
    }
  )

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-neutral-dark-gray mb-1">
          Nombre del festivo
        </label>
        <Input
          value={formData.name}
          onChange={(e) => setFormData({...formData, name: e.target.value})}
          placeholder="Día de la empresa"
          required
        />
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-neutral-dark-gray mb-1">
            Fecha
          </label>
          <Input
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({...formData, date: e.target.value})}
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-neutral-dark-gray mb-1">
            Tipo
          </label>
          <select
            value={formData.type}
            onChange={(e) => setFormData({...formData, type: e.target.value as Holiday['type']})}
            className="w-full px-3 py-2 border border-neutral-light-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="company">Empresarial</option>
            <option value="regional">Regional</option>
            <option value="national">Nacional</option>
          </select>
        </div>
      </div>
      
      <div className="flex items-center space-x-4">
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={formData.recurring}
            onChange={(e) => setFormData({...formData, recurring: e.target.checked})}
            className="mr-2"
          />
          Recurrente (cada año)
        </label>
        
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={formData.mandatory}
            onChange={(e) => setFormData({...formData, mandatory: e.target.checked})}
            className="mr-2"
          />
          Obligatorio
        </label>
      </div>
      
      <div className="flex justify-end space-x-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit">
          {holiday ? 'Actualizar' : 'Crear'} Festivo
        </Button>
      </div>
    </form>
  )
}

// Work Rule Form Component
function WorkRuleForm({ 
  workRule, 
  onSave, 
  onCancel 
}: { 
  workRule: WorkRule | null
  onSave: (rule: WorkRule) => void
  onCancel: () => void
}) {
  const [formData, setFormData] = useState<WorkRule>(
    workRule || {
      id: '',
      name: '',
      type: 'overtime_limit',
      value: 0,
      unit: 'hours',
      description: '',
      mandatory: false
    }
  )

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-neutral-dark-gray mb-1">
          Nombre de la regla
        </label>
        <Input
          value={formData.name}
          onChange={(e) => setFormData({...formData, name: e.target.value})}
          placeholder="Límite de horas diarias"
          required
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-neutral-dark-gray mb-1">
          Tipo de regla
        </label>
        <select
          value={formData.type}
          onChange={(e) => setFormData({...formData, type: e.target.value as WorkRule['type']})}
          className="w-full px-3 py-2 border border-neutral-light-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="overtime_limit">Límite de horas extras</option>
          <option value="shift_length">Duración de turno</option>
          <option value="break_requirement">Tiempo de descanso</option>
          <option value="night_restriction">Restricción nocturna</option>
          <option value="sunday_restriction">Restricción dominical</option>
        </select>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-neutral-dark-gray mb-1">
            Valor
          </label>
          <Input
            type="number"
            value={formData.value}
            onChange={(e) => setFormData({...formData, value: parseFloat(e.target.value)})}
            placeholder="8"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-neutral-dark-gray mb-1">
            Unidad
          </label>
          <select
            value={formData.unit}
            onChange={(e) => setFormData({...formData, unit: e.target.value as WorkRule['unit']})}
            className="w-full px-3 py-2 border border-neutral-light-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="hours">Horas</option>
            <option value="minutes">Minutos</option>
            <option value="percentage">Porcentaje</option>
          </select>
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-neutral-dark-gray mb-1">
          Descripción
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({...formData, description: e.target.value})}
          placeholder="Descripción de la regla laboral"
          className="w-full px-3 py-2 border border-neutral-light-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          rows={3}
          required
        />
      </div>
      
      <div>
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={formData.mandatory}
            onChange={(e) => setFormData({...formData, mandatory: e.target.checked})}
            className="mr-2"
          />
          Regla obligatoria
        </label>
      </div>
      
      <div className="flex justify-end space-x-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit">
          {workRule ? 'Actualizar' : 'Crear'} Regla
        </Button>
      </div>
    </form>
  )
}

// Budget Form Component
function BudgetForm({ 
  location, 
  period, 
  locations,
  onSave, 
  onCancel 
}: { 
  location: Location | null
  period: BudgetPeriod | null
  locations: Location[]
  onSave: (locationId: string, period: BudgetPeriod) => void
  onCancel: () => void
}) {
  const [selectedLocationId, setSelectedLocationId] = useState(location?.id || '')
  const [formData, setFormData] = useState<BudgetPeriod>(
    period || {
      id: '',
      year: new Date().getFullYear(),
      month: new Date().getMonth() + 1,
      amount: 0,
      allocated: 0,
      spent: 0
    }
  )
  const [budgetType, setBudgetType] = useState<'monthly' | 'quarterly' | 'annual'>('monthly')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    const periodData = { ...formData }
    
    // Set period properties based on type
    if (budgetType === 'annual') {
      delete periodData.month
      delete periodData.quarter
    } else if (budgetType === 'quarterly') {
      delete periodData.month
      periodData.quarter = Math.ceil(formData.month! / 3)
    } else {
      delete periodData.quarter
    }
    
    onSave(selectedLocationId, periodData)
  }

  const selectedLocation = locations.find(loc => loc.id === selectedLocationId)

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {!location && (
        <div>
          <label className="block text-sm font-medium text-neutral-dark-gray mb-1">
            Ubicación
          </label>
          <select
            value={selectedLocationId}
            onChange={(e) => setSelectedLocationId(e.target.value)}
            className="w-full px-3 py-2 border border-neutral-light-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            required
          >
            <option value="">Seleccionar ubicación</option>
            {locations.map(loc => (
              <option key={loc.id} value={loc.id}>{loc.name}</option>
            ))}
          </select>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-neutral-dark-gray mb-1">
          Tipo de Período
        </label>
        <div className="grid grid-cols-3 gap-2">
          {(['monthly', 'quarterly', 'annual'] as const).map(type => (
            <button
              key={type}
              type="button"
              onClick={() => setBudgetType(type)}
              className={`p-3 text-sm border rounded-lg ${
                budgetType === type
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-neutral-light-gray hover:border-neutral-medium-gray'
              }`}
            >
              {type === 'monthly' ? 'Mensual' :
               type === 'quarterly' ? 'Trimestral' :
               'Anual'}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-neutral-dark-gray mb-1">
            Año
          </label>
          <Input
            type="number"
            value={formData.year}
            onChange={(e) => setFormData({...formData, year: parseInt(e.target.value)})}
            min={new Date().getFullYear()}
            required
          />
        </div>
        
        {budgetType === 'monthly' && (
          <div>
            <label className="block text-sm font-medium text-neutral-dark-gray mb-1">
              Mes
            </label>
            <select
              value={formData.month || 1}
              onChange={(e) => setFormData({...formData, month: parseInt(e.target.value)})}
              className="w-full px-3 py-2 border border-neutral-light-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              required
            >
              {Array.from({length: 12}, (_, i) => (
                <option key={i + 1} value={i + 1}>
                  {new Date(2024, i).toLocaleString('es-ES', { month: 'long' })}
                </option>
              ))}
            </select>
          </div>
        )}

        {budgetType === 'quarterly' && (
          <div>
            <label className="block text-sm font-medium text-neutral-dark-gray mb-1">
              Trimestre
            </label>
            <select
              value={Math.ceil((formData.month || 1) / 3)}
              onChange={(e) => setFormData({...formData, month: (parseInt(e.target.value) - 1) * 3 + 1})}
              className="w-full px-3 py-2 border border-neutral-light-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              required
            >
              <option value={1}>Q1 (Ene-Mar)</option>
              <option value={2}>Q2 (Abr-Jun)</option>
              <option value={3}>Q3 (Jul-Sep)</option>
              <option value={4}>Q4 (Oct-Dic)</option>
            </select>
          </div>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-neutral-dark-gray mb-1">
          Monto del Presupuesto
        </label>
        <Input
          type="number"
          value={formData.amount}
          onChange={(e) => setFormData({...formData, amount: parseInt(e.target.value)})}
          placeholder="48000000"
          required
        />
        <p className="text-xs text-neutral-medium-gray mt-1">
          {formatCurrency(formData.amount)}
          {selectedLocation?.budget.autoDistribute && budgetType === 'monthly' && (
            <span> • ~{formatCurrency(Math.round(formData.amount / 4.33))} por semana</span>
          )}
        </p>
      </div>

      {period && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-neutral-dark-gray mb-1">
              Cantidad Asignada
            </label>
            <Input
              type="number"
              value={formData.allocated}
              onChange={(e) => setFormData({...formData, allocated: parseInt(e.target.value)})}
              max={formData.amount}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-neutral-dark-gray mb-1">
              Cantidad Gastada
            </label>
            <Input
              type="number"
              value={formData.spent}
              onChange={(e) => setFormData({...formData, spent: parseInt(e.target.value)})}
              max={formData.amount}
            />
          </div>
        </div>
      )}

      {selectedLocation && (
        <div className="bg-neutral-off-white p-4 rounded-lg">
          <h4 className="font-medium mb-2">Configuración de Presupuesto</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Tipo actual:</span>
              <span className="font-medium">{getBudgetTypeLabel(selectedLocation.budget.type)}</span>
            </div>
            <div className="flex justify-between">
              <span>Distribución automática:</span>
              <span className="font-medium">
                {selectedLocation.budget.autoDistribute ? 'Activada' : 'Desactivada'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Umbral de alerta:</span>
              <span className="font-medium">{selectedLocation.budget.alertThreshold}%</span>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-end space-x-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={!selectedLocationId}>
          {period ? 'Actualizar' : 'Crear'} Período
        </Button>
      </div>
    </form>
  )
}