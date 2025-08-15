'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button, Input, Card } from '@/components/ui'

interface RegistrationData {
  // Step 1: Account Creation
  fullName: string
  workEmail: string
  password: string
  confirmPassword: string
  companyName: string
  companySize: string

  // Step 2: Business Details
  nit: string
  sector: string
  address: string
  city: string
  phone: string

  // Step 3: Plan Selection
  selectedPlan: string
  paymentMethod: string
  cardNumber: string
  expiryDate: string
  cvv: string
  cardholderName: string
}

const initialData: RegistrationData = {
  fullName: '',
  workEmail: '',
  password: '',
  confirmPassword: '',
  companyName: '',
  companySize: '',
  nit: '',
  sector: '',
  address: '',
  city: '',
  phone: '',
  selectedPlan: 'pro',
  paymentMethod: 'card',
  cardNumber: '',
  expiryDate: '',
  cvv: '',
  cardholderName: ''
}

export default function RegisterPage() {
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState<RegistrationData>(initialData)
  const [errors, setErrors] = useState<Partial<RegistrationData>>({})

  const updateFormData = (field: keyof RegistrationData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const validateStep = (step: number): boolean => {
    const newErrors: Partial<RegistrationData> = {}

    switch (step) {
      case 1:
        if (!formData.fullName) newErrors.fullName = 'Nombre completo es requerido'
        if (!formData.workEmail) newErrors.workEmail = 'Email es requerido'
        if (!formData.password) newErrors.password = 'Contraseña es requerida'
        if (formData.password !== formData.confirmPassword) {
          newErrors.confirmPassword = 'Las contraseñas no coinciden'
        }
        if (!formData.companyName) newErrors.companyName = 'Nombre de empresa es requerido'
        if (!formData.companySize) newErrors.companySize = 'Tamaño de empresa es requerido'
        break

      case 2:
        if (!formData.nit) newErrors.nit = 'NIT es requerido'
        if (!formData.sector) newErrors.sector = 'Sector es requerido'
        if (!formData.address) newErrors.address = 'Dirección es requerida'
        if (!formData.city) newErrors.city = 'Ciudad es requerida'
        if (!formData.phone) newErrors.phone = 'Teléfono es requerido'
        break

      case 3:
        if (formData.paymentMethod === 'card') {
          if (!formData.cardNumber) newErrors.cardNumber = 'Número de tarjeta es requerido'
          if (!formData.expiryDate) newErrors.expiryDate = 'Fecha de vencimiento es requerida'
          if (!formData.cvv) newErrors.cvv = 'CVV es requerido'
          if (!formData.cardholderName) newErrors.cardholderName = 'Nombre del titular es requerido'
        }
        break
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => prev + 1)
    }
  }

  const handleBack = () => {
    setCurrentStep(prev => prev - 1)
  }

  const handleSubmit = () => {
    if (validateStep(3)) {
      setCurrentStep(4)
      // Here you would typically send the data to your API
      console.log('Registration data:', formData)
    }
  }

  const plans = [
    {
      id: 'basico',
      name: 'Básico',
      price: '$99.000',
      period: '/mes',
      features: ['Hasta 10 empleados', '1 sede', 'Reportes básicos', 'Soporte por email']
    },
    {
      id: 'pro',
      name: 'Pro',
      price: '$199.000',
      period: '/mes',
      features: ['Hasta 50 empleados', '3 sedes', 'Reportes avanzados', 'Soporte prioritario', 'Plantillas personalizadas'],
      recommended: true
    },
    {
      id: 'corporativo',
      name: 'Corporativo',
      price: 'Personalizado',
      period: '',
      features: ['Empleados ilimitados', 'Sedes ilimitadas', 'API personalizada', 'Gerente de cuenta dedicado']
    }
  ]

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center mb-8">
      {[1, 2, 3, 4].map((step) => (
        <div key={step} className="flex items-center">
          <div className={`
            w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
            ${currentStep >= step 
              ? 'bg-primary text-white' 
              : 'bg-neutral-light-gray text-neutral-medium-gray'
            }
          `}>
            {step}
          </div>
          {step < 4 && (
            <div className={`
              w-12 h-0.5 mx-2
              ${currentStep > step ? 'bg-primary' : 'bg-neutral-light-gray'}
            `} />
          )}
        </div>
      ))}
    </div>
  )

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold">Crear tu cuenta</h2>
        <p className="text-neutral-dark-gray">Información básica para comenzar</p>
      </div>

      <Input
        label="Nombre completo"
        value={formData.fullName}
        onChange={(e) => updateFormData('fullName', e.target.value)}
        error={errors.fullName}
        required
      />

      <Input
        label="Email de trabajo"
        type="email"
        value={formData.workEmail}
        onChange={(e) => updateFormData('workEmail', e.target.value)}
        error={errors.workEmail}
        required
      />

      <div className="grid md:grid-cols-2 gap-4">
        <Input
          label="Contraseña"
          type="password"
          value={formData.password}
          onChange={(e) => updateFormData('password', e.target.value)}
          error={errors.password}
          required
        />
        <Input
          label="Confirmar contraseña"
          type="password"
          value={formData.confirmPassword}
          onChange={(e) => updateFormData('confirmPassword', e.target.value)}
          error={errors.confirmPassword}
          required
        />
      </div>

      <Input
        label="Nombre de la empresa"
        value={formData.companyName}
        onChange={(e) => updateFormData('companyName', e.target.value)}
        error={errors.companyName}
        required
      />

      <div>
        <label className="block text-caption text-neutral-dark-gray mb-1">
          Tamaño de la empresa *
        </label>
        <select
          className="w-full px-sm py-sm rounded-md border border-neutral-light-gray focus:border-primary focus:ring-primary bg-white text-neutral-black focus:outline-none focus:ring-2 focus:ring-opacity-20"
          value={formData.companySize}
          onChange={(e) => updateFormData('companySize', e.target.value)}
          required
        >
          <option value="">Selecciona el tamaño</option>
          <option value="1-10">1-10 empleados</option>
          <option value="11-50">11-50 empleados</option>
          <option value="51-100">51-100 empleados</option>
          <option value="100+">Más de 100 empleados</option>
        </select>
        {errors.companySize && (
          <p className="mt-1 text-caption text-semantic-error">{errors.companySize}</p>
        )}
      </div>
    </div>
  )

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold">Detalles del negocio</h2>
        <p className="text-neutral-dark-gray">Información legal y de contacto</p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Input
          label="NIT"
          value={formData.nit}
          onChange={(e) => updateFormData('nit', e.target.value)}
          error={errors.nit}
          placeholder="123456789-0"
          required
        />
        <div>
          <label className="block text-caption text-neutral-dark-gray mb-1">
            Sector/Industria *
          </label>
          <select
            className="w-full px-sm py-sm rounded-md border border-neutral-light-gray focus:border-primary focus:ring-primary bg-white text-neutral-black focus:outline-none focus:ring-2 focus:ring-opacity-20"
            value={formData.sector}
            onChange={(e) => updateFormData('sector', e.target.value)}
            required
          >
            <option value="">Selecciona el sector</option>
            <option value="restaurantes">Restaurantes y Alimentación</option>
            <option value="retail">Retail y Comercio</option>
            <option value="salud">Salud y Bienestar</option>
            <option value="manufactura">Manufactura</option>
            <option value="servicios">Servicios</option>
            <option value="otro">Otro</option>
          </select>
          {errors.sector && (
            <p className="mt-1 text-caption text-semantic-error">{errors.sector}</p>
          )}
        </div>
      </div>

      <Input
        label="Dirección"
        value={formData.address}
        onChange={(e) => updateFormData('address', e.target.value)}
        error={errors.address}
        required
      />

      <div className="grid md:grid-cols-2 gap-4">
        <Input
          label="Ciudad"
          value={formData.city}
          onChange={(e) => updateFormData('city', e.target.value)}
          error={errors.city}
          required
        />
        <Input
          label="Teléfono"
          value={formData.phone}
          onChange={(e) => updateFormData('phone', e.target.value)}
          error={errors.phone}
          placeholder="+57 300 123 4567"
          required
        />
      </div>
    </div>
  )

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold">Selecciona tu plan</h2>
        <p className="text-neutral-dark-gray">Elige el plan que mejor se adapte a tu empresa</p>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        {plans.map((plan) => (
          <Card
            key={plan.id}
            className={`cursor-pointer transition-all ${
              formData.selectedPlan === plan.id
                ? 'ring-2 ring-primary bg-primary/5'
                : 'hover:shadow-lg'
            } ${plan.recommended ? 'ring-2 ring-secondary' : ''}`}
            onClick={() => updateFormData('selectedPlan', plan.id)}
          >
            {plan.recommended && (
              <div className="bg-secondary text-white px-2 py-1 rounded-full text-xs font-medium text-center mb-2">
                Recomendado
              </div>
            )}
            <div className="text-center">
              <h3 className="font-bold text-lg">{plan.name}</h3>
              <div className="text-2xl font-bold text-primary my-2">
                {plan.price}
                <span className="text-sm font-normal text-neutral-medium-gray">{plan.period}</span>
              </div>
              <ul className="text-sm space-y-1">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-center">
                    <svg className="w-4 h-4 text-semantic-success mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          </Card>
        ))}
      </div>

      {formData.selectedPlan !== 'corporativo' && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Información de pago</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-caption text-neutral-dark-gray mb-1">
                Método de pago
              </label>
              <div className="flex gap-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="card"
                    checked={formData.paymentMethod === 'card'}
                    onChange={(e) => updateFormData('paymentMethod', e.target.value)}
                    className="mr-2"
                  />
                  Tarjeta de crédito
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="transfer"
                    checked={formData.paymentMethod === 'transfer'}
                    onChange={(e) => updateFormData('paymentMethod', e.target.value)}
                    className="mr-2"
                  />
                  Transferencia bancaria
                </label>
              </div>
            </div>

            {formData.paymentMethod === 'card' && (
              <>
                <Input
                  label="Número de tarjeta"
                  value={formData.cardNumber}
                  onChange={(e) => updateFormData('cardNumber', e.target.value)}
                  error={errors.cardNumber}
                  placeholder="1234 5678 9012 3456"
                />
                
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Fecha de vencimiento"
                    value={formData.expiryDate}
                    onChange={(e) => updateFormData('expiryDate', e.target.value)}
                    error={errors.expiryDate}
                    placeholder="MM/AA"
                  />
                  <Input
                    label="CVV"
                    value={formData.cvv}
                    onChange={(e) => updateFormData('cvv', e.target.value)}
                    error={errors.cvv}
                    placeholder="123"
                  />
                </div>
                
                <Input
                  label="Nombre del titular"
                  value={formData.cardholderName}
                  onChange={(e) => updateFormData('cardholderName', e.target.value)}
                  error={errors.cardholderName}
                />
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )

  const renderStep4 = () => (
    <div className="text-center space-y-6">
      <div className="text-primary mb-6">
        <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      
      <h2 className="text-2xl font-bold">¡Registro exitoso!</h2>
      
      <Card className="text-left">
        <h3 className="font-semibold mb-4">Tu cuenta está pendiente de aprobación</h3>
        <div className="space-y-3 text-sm">
          <p>
            <strong>¿Qué sigue?</strong>
          </p>
          <ul className="list-disc list-inside space-y-1 text-neutral-dark-gray">
            <li>Nuestro equipo revisará tu solicitud en las próximas 24-48 horas</li>
            <li>Recibirás un email de confirmación una vez aprobada tu cuenta</li>
            <li>Podrás acceder inmediatamente a configurar tu empresa</li>
            <li>Te brindaremos una sesión de onboarding gratuita</li>
          </ul>
          
          <div className="mt-4 p-4 bg-semantic-info/10 rounded-md">
            <p className="text-semantic-info font-medium">
              💡 Mientras tanto, revisa tu email para confirmar tu dirección de correo
            </p>
          </div>
        </div>
      </Card>
      
      <div className="space-y-4">
        <Link href="/login">
          <Button className="w-full">
            Ir al login
          </Button>
        </Link>
        <Link href="/">
          <Button variant="secondary" className="w-full">
            Volver al inicio
          </Button>
        </Link>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 to-secondary/10 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block mb-4">
            <h1 className="text-3xl font-bold text-primary">TurnoFacil CO</h1>
          </Link>
        </div>

        {renderStepIndicator()}

        <Card className="max-w-2xl mx-auto">
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}
          {currentStep === 4 && renderStep4()}

          {currentStep < 4 && (
            <div className="flex justify-between mt-8 pt-6 border-t border-neutral-light-gray">
              {currentStep > 1 ? (
                <Button variant="secondary" onClick={handleBack}>
                  Anterior
                </Button>
              ) : (
                <Link href="/login">
                  <Button variant="text">
                    ¿Ya tienes cuenta? Inicia sesión
                  </Button>
                </Link>
              )}

              {currentStep < 3 ? (
                <Button onClick={handleNext}>
                  Siguiente
                </Button>
              ) : (
                <Button onClick={handleSubmit}>
                  {formData.selectedPlan === 'corporativo' ? 'Enviar solicitud' : 'Finalizar registro'}
                </Button>
              )}
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}