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
    <div className="grid grid-cols-7 gap-px bg-gray-200">
      {/* Day headers */}
      {DAYS_OF_WEEK.map(day => (
        <div key={day} className="bg-gray-50 p-2 text-center text-sm font-medium text-gray-700">
          {day}
        </div>
      ))}
      
      {/* Calendar days */}
      {days.map((date, index) => (
        <div
          key={index}
          className={`
            bg-white min-h-[100px] p-2 border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors
            ${date ? 'border' : ''}
            ${date && isToday(date) ? 'bg-primary-50 border-primary-200' : ''}
            ${date && isSelected(date) ? 'bg-primary-100 border-primary-300' : ''}
          `}
          onClick={() => date && handleDateClick(date)}
          onDragOver={handleDragOver}
          onDrop={(e) => date && handleDrop(date, e)}
        >
          {date && (
            <>
              <div className={`text-sm font-medium mb-1 ${
                isToday(date) ? 'text-primary-700' : 
                isSelected(date) ? 'text-primary-600' : 'text-gray-700'
              }`}>
                {date.getDate()}
              </div>
              
              <div className="space-y-1">
                {getEventsForDate(date).slice(0, 3).map(event => (
                  <div
                    key={event.id}
                    className={`
                      text-xs p-1 rounded border cursor-pointer
                      ${getEventTypeColor(event.type, event.status)}
                      ${editable ? 'hover:shadow-sm' : ''}
                    `}
                    onClick={(e) => handleEventClick(event, e)}
                    draggable={editable}
                    onDragStart={() => handleDragStart(event)}
                    title={`${event.title} (${event.startTime} - ${event.endTime})`}
                  >
                    <div className="truncate font-medium">{event.title}</div>
                    {event.employeeName && (
                      <div className="truncate opacity-75">{event.employeeName}</div>
                    )}
                  </div>
                ))}
                
                {getEventsForDate(date).length > 3 && (
                  <div className="text-xs text-gray-500 text-center">
                    +{getEventsForDate(date).length - 3} más
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      ))}
    </div>
  )

  return (
    <Card className="w-full">
      {showHeader && (
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center space-x-4">
            <h2 className="text-lg font-semibold text-gray-900">
              {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h2>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => navigateMonth('prev')}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Button>
            
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setCurrentDate(new Date())}
            >
              Hoy
            </Button>
            
            <Button
              variant="secondary"
              size="sm"
              onClick={() => navigateMonth('next')}
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