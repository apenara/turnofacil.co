'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button, Card, Input, Modal } from '@/components/ui'

export default function LandingPage() {
  const [showContactModal, setShowContactModal] = useState(false)
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    company: '',
    message: ''
  })

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log('Formulario de contacto:', contactForm)
    setShowContactModal(false)
    setContactForm({ name: '', email: '', company: '', message: '' })
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-primary">TurnoFacil CO</h1>
            </div>
            <nav className="flex items-center space-x-4">
              <a href="#beneficios" className="text-neutral-dark-gray hover:text-primary transition-colors">
                Beneficios
              </a>
              <a href="#precios" className="text-neutral-dark-gray hover:text-primary transition-colors">
                Precios
              </a>
              <a href="#contacto" className="text-neutral-dark-gray hover:text-primary transition-colors">
                Contacto
              </a>
              <Link href="/login">
                <Button variant="secondary" size="sm">
                  Iniciar Sesión
                </Button>
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary/10 to-secondary/10 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-5xl font-bold text-neutral-black mb-6">
              TurnoFacil CO: Optimiza tus turnos, cumple la ley
            </h2>
            <p className="text-xl text-neutral-dark-gray mb-8 max-w-3xl mx-auto">
              La plataforma inteligente para gestionar horarios laborales en Colombia. 
              Automatiza el cálculo de horas extras, recargos y cumple con toda la normativa laboral.
            </p>
            <div className="flex justify-center space-x-4">
              <Link href="/register">
                <Button size="lg">
                  Empezar ahora
                </Button>
              </Link>
              <Button 
                variant="secondary" 
                size="lg"
                onClick={() => setShowContactModal(true)}
              >
                Solicitar Demo
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Beneficios Section */}
      <section id="beneficios" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">
            ¿Por qué elegir TurnoFacil CO?
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card className="text-center">
              <div className="text-primary mb-4">
                <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2">Cálculo Automático</h3>
              <p className="text-neutral-dark-gray">
                Calcula automáticamente horas extras, recargos nocturnos y dominicales según la ley colombiana.
              </p>
            </Card>

            <Card className="text-center">
              <div className="text-primary mb-4">
                <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2">Cumplimiento Legal</h3>
              <p className="text-neutral-dark-gray">
                Garantiza el cumplimiento de toda la normativa laboral colombiana vigente.
              </p>
            </Card>

            <Card className="text-center">
              <div className="text-primary mb-4">
                <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2">Portal del Empleado</h3>
              <p className="text-neutral-dark-gray">
                Tus colaboradores pueden ver sus horarios y solicitar cambios desde cualquier dispositivo.
              </p>
            </Card>

            <Card className="text-center">
              <div className="text-primary mb-4">
                <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2">Reportes Inteligentes</h3>
              <p className="text-neutral-dark-gray">
                Genera reportes detallados de costos, horas trabajadas y eficiencia operativa.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Precios Section */}
      <section id="precios" className="py-20 bg-neutral-off-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">
            Planes que se adaptan a tu empresa
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <Card>
              <div className="text-center">
                <h3 className="text-2xl font-bold mb-2">Básico</h3>
                <p className="text-neutral-dark-gray mb-4">Para pequeñas empresas</p>
                <div className="text-4xl font-bold text-primary mb-6">
                  $99.000
                  <span className="text-lg font-normal text-neutral-medium-gray">/mes</span>
                </div>
                <ul className="text-left space-y-3 mb-6">
                  <li className="flex items-start">
                    <svg className="w-5 h-5 text-semantic-success mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Hasta 10 empleados</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="w-5 h-5 text-semantic-success mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>1 sede</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="w-5 h-5 text-semantic-success mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Reportes básicos</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="w-5 h-5 text-semantic-success mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Soporte por email</span>
                  </li>
                </ul>
                <Link href="/register?plan=basico">
                  <Button variant="secondary" className="w-full">
                    Seleccionar Plan
                  </Button>
                </Link>
              </div>
            </Card>

            <Card className="ring-2 ring-primary">
              <div className="text-center">
                <div className="bg-primary text-white px-3 py-1 rounded-full inline-block mb-4">
                  Más Popular
                </div>
                <h3 className="text-2xl font-bold mb-2">Pro</h3>
                <p className="text-neutral-dark-gray mb-4">Para empresas en crecimiento</p>
                <div className="text-4xl font-bold text-primary mb-6">
                  $199.000
                  <span className="text-lg font-normal text-neutral-medium-gray">/mes</span>
                </div>
                <ul className="text-left space-y-3 mb-6">
                  <li className="flex items-start">
                    <svg className="w-5 h-5 text-semantic-success mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Hasta 50 empleados</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="w-5 h-5 text-semantic-success mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>3 sedes</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="w-5 h-5 text-semantic-success mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Reportes avanzados</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="w-5 h-5 text-semantic-success mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Soporte prioritario</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="w-5 h-5 text-semantic-success mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Plantillas personalizadas</span>
                  </li>
                </ul>
                <Link href="/register?plan=pro">
                  <Button className="w-full">
                    Seleccionar Plan
                  </Button>
                </Link>
              </div>
            </Card>

            <Card>
              <div className="text-center">
                <h3 className="text-2xl font-bold mb-2">Corporativo</h3>
                <p className="text-neutral-dark-gray mb-4">Para grandes empresas</p>
                <div className="text-4xl font-bold text-primary mb-6">
                  Personalizado
                </div>
                <ul className="text-left space-y-3 mb-6">
                  <li className="flex items-start">
                    <svg className="w-5 h-5 text-semantic-success mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Empleados ilimitados</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="w-5 h-5 text-semantic-success mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Sedes ilimitadas</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="w-5 h-5 text-semantic-success mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>API personalizada</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="w-5 h-5 text-semantic-success mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Gerente de cuenta dedicado</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="w-5 h-5 text-semantic-success mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Capacitación personalizada</span>
                  </li>
                </ul>
                <Button 
                  variant="secondary" 
                  className="w-full"
                  onClick={() => setShowContactModal(true)}
                >
                  Contactar Ventas
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Contacto Section */}
      <section id="contacto" className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">
            ¿Tienes preguntas? Contáctanos
          </h2>
          <Card>
            <form onSubmit={handleContactSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <Input
                  label="Nombre completo"
                  value={contactForm.name}
                  onChange={(e) => setContactForm({...contactForm, name: e.target.value})}
                  required
                />
                <Input
                  label="Email"
                  type="email"
                  value={contactForm.email}
                  onChange={(e) => setContactForm({...contactForm, email: e.target.value})}
                  required
                />
              </div>
              <Input
                label="Empresa"
                value={contactForm.company}
                onChange={(e) => setContactForm({...contactForm, company: e.target.value})}
              />
              <div>
                <label className="block text-caption text-neutral-dark-gray mb-1">
                  Mensaje
                </label>
                <textarea
                  className="w-full px-sm py-sm rounded-md border border-neutral-light-gray focus:border-primary focus:ring-primary bg-white text-neutral-black focus:outline-none focus:ring-2 focus:ring-opacity-20"
                  rows={4}
                  value={contactForm.message}
                  onChange={(e) => setContactForm({...contactForm, message: e.target.value})}
                  required
                />
              </div>
              <Button type="submit" className="w-full">
                Enviar mensaje
              </Button>
            </form>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-neutral-black text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4">TurnoFacil CO</h3>
              <p className="text-neutral-light-gray">
                Optimiza la gestión de horarios y cumple con la normativa laboral colombiana.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Producto</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-neutral-light-gray hover:text-white">Características</a></li>
                <li><a href="#precios" className="text-neutral-light-gray hover:text-white">Precios</a></li>
                <li><a href="#" className="text-neutral-light-gray hover:text-white">API</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Empresa</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-neutral-light-gray hover:text-white">Sobre nosotros</a></li>
                <li><a href="#contacto" className="text-neutral-light-gray hover:text-white">Contacto</a></li>
                <li><a href="#" className="text-neutral-light-gray hover:text-white">Blog</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-neutral-light-gray hover:text-white">Términos de servicio</a></li>
                <li><a href="#" className="text-neutral-light-gray hover:text-white">Política de privacidad</a></li>
                <li><a href="#" className="text-neutral-light-gray hover:text-white">Cookies</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-neutral-dark-gray text-center text-neutral-light-gray">
            <p>&copy; 2024 TurnoFacil CO. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>

      {/* Contact Modal */}
      <Modal
        isOpen={showContactModal}
        onClose={() => setShowContactModal(false)}
        title="Solicitar Demostración"
        size="md"
      >
        <form onSubmit={handleContactSubmit} className="space-y-4">
          <Input
            label="Nombre completo"
            value={contactForm.name}
            onChange={(e) => setContactForm({...contactForm, name: e.target.value})}
            required
          />
          <Input
            label="Email corporativo"
            type="email"
            value={contactForm.email}
            onChange={(e) => setContactForm({...contactForm, email: e.target.value})}
            required
          />
          <Input
            label="Empresa"
            value={contactForm.company}
            onChange={(e) => setContactForm({...contactForm, company: e.target.value})}
            required
          />
          <div>
            <label className="block text-caption text-neutral-dark-gray mb-1">
              ¿Cuántos empleados tiene tu empresa?
            </label>
            <select className="w-full px-sm py-sm rounded-md border border-neutral-light-gray focus:border-primary focus:ring-primary bg-white text-neutral-black focus:outline-none focus:ring-2 focus:ring-opacity-20">
              <option>1-10 empleados</option>
              <option>11-50 empleados</option>
              <option>51-100 empleados</option>
              <option>Más de 100 empleados</option>
            </select>
          </div>
          <div className="flex justify-end space-x-4 pt-4">
            <Button 
              type="button" 
              variant="secondary"
              onClick={() => setShowContactModal(false)}
            >
              Cancelar
            </Button>
            <Button type="submit">
              Solicitar Demo
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}