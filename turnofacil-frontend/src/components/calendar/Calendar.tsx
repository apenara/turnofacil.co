'use client'

import React, { useState, useMemo } from 'react'
import { Button, Card } from '@/components/ui'

interface CalendarEvent {
  id: string
  title: string
  startTime: string
  endTime: string
  date: string
  type: 'shift' | 'meeting' | 'request' | 'holiday'
  employeeId?: string
  employeeName?: string
  position?: string
  status?: 'confirmed' | 'pending' | 'cancelled'
}

interface CalendarProps {
  events?: CalendarEvent[]
  selectedDate?: Date
  onDateSelect?: (date: Date) => void
  onEventClick?: (event: CalendarEvent) => void
  onEventDrop?: (event: CalendarEvent, newDate: Date) => void
  mode?: 'month' | 'week' | 'day'
  editable?: boolean
  showHeader?: boolean
}

const DAYS_OF_WEEK = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
]

export const Calendar: React.FC<CalendarProps> = ({
  events = [],
  selectedDate,
  onDateSelect,
  onEventClick,
  onEventDrop,
  mode = 'month',
  editable = false,
  showHeader = true
}) => {
  const [currentDate, setCurrentDate] = useState(selectedDate || new Date())
  const [draggedEvent, setDraggedEvent] = useState<CalendarEvent | null>(null)

  const getEventTypeColor = (type: CalendarEvent['type'], status?: string) => {
    const baseColors = {
      shift: status === 'pending' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' : 'bg-primary-100 text-primary-800 border-primary-200',
      meeting: 'bg-blue-100 text-blue-800 border-blue-200',
      request: 'bg-orange-100 text-orange-800 border-orange-200',
      holiday: 'bg-green-100 text-green-800 border-green-200'
    }
    return baseColors[type]
  }

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()

    const days = []
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null)
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day))
    }
    
    return days
  }

  const getEventsForDate = (date: Date) => {
    const dateString = date.toISOString().split('T')[0]
    return events.filter(event => event.date === dateString)
  }

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate)
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1)
    } else {
      newDate.setMonth(newDate.getMonth() + 1)
    }
    setCurrentDate(newDate)
  }

  const handleDateClick = (date: Date) => {
    onDateSelect?.(date)
  }

  const handleEventClick = (event: CalendarEvent, e: React.MouseEvent) => {
    e.stopPropagation()
    onEventClick?.(event)
  }

  const handleDragStart = (event: CalendarEvent) => {
    if (!editable) return
    setDraggedEvent(event)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (date: Date, e: React.DragEvent) => {
    e.preventDefault()
    if (draggedEvent && onEventDrop) {
      onEventDrop(draggedEvent, date)
    }
    setDraggedEvent(null)
  }

  const isToday = (date: Date) => {
    const today = new Date()
    return date.toDateString() === today.toDateString()
  }

  const isSelected = (date: Date) => {
    return selectedDate && date.toDateString() === selectedDate.toDateString()
  }

  const days = useMemo(() => getDaysInMonth(currentDate), [currentDate])

  const renderMonthView = () => (
    <div className="grid grid-cols-7 gap-px bg-gray-200 rounded-lg overflow-hidden">
      {/* Day headers */}
      {DAYS_OF_WEEK.map(day => (
        <div key={day} className="bg-gray-100 p-3 text-center text-sm font-semibold text-gray-800 border-b border-gray-300">
          {day}
        </div>
      ))}
      
      {/* Calendar days */}
      {days.map((date, index) => {
        const dayEvents = date ? getEventsForDate(date) : []
        const isWeekend = date && (date.getDay() === 0 || date.getDay() === 6)
        
        return (
          <div
            key={index}
            className={`
              bg-white min-h-[120px] p-2 border-gray-100 cursor-pointer hover:bg-gray-50 transition-all duration-200 relative group
              ${date ? 'border' : ''}
              ${date && isToday(date) ? 'bg-blue-50 border-blue-200 ring-1 ring-blue-300' : ''}
              ${date && isSelected(date) ? 'bg-blue-100 border-blue-300 ring-2 ring-blue-400' : ''}
              ${isWeekend ? 'bg-gray-25' : ''}
            `}
            onClick={() => date && handleDateClick(date)}
            onDragOver={handleDragOver}
            onDrop={(e) => date && handleDrop(date, e)}
            title={date ? `${date.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' })} - ${dayEvents.length} evento(s)` : ''}
          >
            {date && (
              <>
                {/* Header del día */}
                <div className="flex items-center justify-between mb-2">
                  <div className={`text-sm font-semibold ${
                    isToday(date) ? 'text-blue-700 bg-blue-100 px-2 py-1 rounded-full' : 
                    isSelected(date) ? 'text-blue-600' : 'text-gray-700'
                  }`}>
                    {date.getDate()}
                  </div>
                  
                  {dayEvents.length > 0 && (
                    <div className="bg-blue-500 text-white text-xs px-1.5 py-0.5 rounded-full font-medium">
                      {dayEvents.length}
                    </div>
                  )}
                </div>
                
                {/* Eventos del día */}
                <div className="space-y-1 overflow-hidden">
                  {dayEvents.slice(0, 2).map(event => {
                    const eventTooltip = `
                      🎯 ${event.title}
                      ⏰ ${event.startTime} - ${event.endTime}
                      ${event.employeeName ? `👤 ${event.employeeName}` : ''}
                      ${event.position ? `💼 ${event.position}` : ''}
                      📋 ${event.type === 'shift' ? 'Turno' : 
                           event.type === 'meeting' ? 'Reunión' :
                           event.type === 'request' ? 'Solicitud' :
                           event.type === 'holiday' ? 'Día festivo' : event.type}
                      ${event.status ? `📊 ${event.status}` : ''}
                    `.trim()
                    
                    return (
                      <div
                        key={event.id}
                        className={`
                          text-xs p-2 rounded-lg border cursor-pointer transition-all duration-200
                          ${getEventTypeColor(event.type, event.status)}
                          ${editable ? 'hover:shadow-md hover:scale-[1.02] transform' : ''}
                          relative overflow-hidden
                        `}
                        onClick={(e) => handleEventClick(event, e)}
                        draggable={editable}
                        onDragStart={() => handleDragStart(event)}
                        title={eventTooltip}
                      >
                        <div className="font-semibold truncate mb-1">{event.title}</div>
                        <div className="text-xs opacity-80 truncate">
                          {event.startTime} - {event.endTime}
                        </div>
                        {event.employeeName && (
                          <div className="text-xs opacity-75 truncate">
                            {event.employeeName}
                          </div>
                        )}
                        
                        {/* Indicadores de estado */}
                        <div className="absolute top-1 right-1 flex space-x-1">
                          {event.status === 'pending' && (
                            <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full" title="Pendiente" />
                          )}
                          {event.status === 'confirmed' && (
                            <div className="w-1.5 h-1.5 bg-green-400 rounded-full" title="Confirmado" />
                          )}
                          {event.status === 'cancelled' && (
                            <div className="w-1.5 h-1.5 bg-red-400 rounded-full" title="Cancelado" />
                          )}
                        </div>
                      </div>
                    )
                  })}
                  
                  {dayEvents.length > 2 && (
                    <div className="text-xs text-gray-500 bg-gray-100 rounded px-2 py-1 text-center cursor-pointer hover:bg-gray-200 transition-colors"
                         title={`Ver todos los ${dayEvents.length} eventos de ${date.toLocaleDateString('es-CO', { day: 'numeric', month: 'long' })}`}>
                      +{dayEvents.length - 2} más
                    </div>
                  )}
                </div>
                
                {/* Botón de agregar evento */}
                {editable && (
                  <div className={`
                    absolute bottom-1 right-1 w-6 h-6 bg-blue-500 text-white rounded-full 
                    flex items-center justify-center hover:bg-blue-600 transition-all duration-200
                    ${dayEvents.length === 0 ? 'opacity-30 group-hover:opacity-100' : 'opacity-70 hover:opacity-100'}
                    hover:scale-110 shadow-sm hover:shadow-md
                  `}
                  title={`Agregar evento para ${date.toLocaleDateString('es-CO', { day: 'numeric', month: 'long' })}`}>
                    <div className="text-xs font-bold">+</div>
                  </div>
                )}
              </>
            )}
          </div>
        )
      })}
    </div>
  )

  return (
    <Card className="w-full shadow-lg">
      {showHeader && (
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center space-x-4">
            <h2 className="text-xl font-bold text-gray-900 flex items-center">
              📅 {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h2>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <div className="flex items-center">
                <span className="w-2 h-2 bg-blue-500 rounded-full mr-1"></span>
                {events.length} eventos
              </div>
              {mode === 'month' && (
                <div className="flex items-center">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-1"></span>
                  Vista mensual
                </div>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => navigateMonth('prev')}
              className="hover:bg-blue-100 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Button>
            
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setCurrentDate(new Date())}
              className="hover:bg-green-100 transition-colors font-medium"
            >
              🏠 Hoy
            </Button>
            
            <Button
              variant="secondary"
              size="sm"
              onClick={() => navigateMonth('next')}
              className="hover:bg-blue-100 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Button>
          </div>
        </div>
      )}
      
      <div className="p-4">
        {mode === 'month' && renderMonthView()}
      </div>
    </Card>
  )
}

// Tipos y interfaces adicionales para exportar
export type { CalendarEvent, CalendarProps }