/**
 * Vista Simplificada del Horario - Estilo Tradicional
 * Muestra el horario semanal en formato tabla simple con códigos de turno
 */

'use client'

import React, { useMemo } from 'react'
import { Card } from '@/components/ui'

export interface SimpleShift {
  id: string
  employeeId: string
  employeeName: string
  date: string
  shiftCode: 'M' | 'T' | 'N' | 'D' | 'L' | 'V' | 'X' // M=Mañana, T=Tarde, N=Noche, D=Descanso, L=Licencia, V=Vacaciones, X=Extra
  startTime?: string
  endTime?: string
  isHoliday?: boolean
  isWeekend?: boolean
}

export interface SimpleScheduleViewProps {
  weekDates: Date[]
  employees: Array<{
    id: string
    name: string
    position?: string
  }>
  shifts: SimpleShift[]
  showLegend?: boolean
  showPositions?: boolean
  onCellClick?: (employeeId: string, date: string) => void
  className?: string
  compactMode?: boolean
  mobileMode?: boolean
  maxEmployeesOnMobile?: number
}

const DAYS_OF_WEEK_SHORT = ['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB', 'DOM']
const MONTHS_SHORT = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']

// Colores para cada tipo de turno (similares a la imagen tradicional)
const SHIFT_COLORS = {
  'M': 'bg-white text-black',           // Mañana - Blanco
  'T': 'bg-white text-black',           // Tarde - Blanco
  'N': 'bg-gray-100 text-black',        // Noche - Gris claro
  'D': 'bg-orange-200 text-orange-900', // Descanso - Naranja (como en la imagen)
  'L': 'bg-gray-200 text-gray-700',     // Licencia - Gris
  'V': 'bg-green-100 text-green-800',   // Vacaciones - Verde claro
  'X': 'bg-yellow-100 text-yellow-800'  // Extra - Amarillo
}

// Descripciones de los códigos
const SHIFT_DESCRIPTIONS = {
  'M': 'Mañana (6:00-14:00)',
  'T': 'Tarde (14:00-22:00)',
  'N': 'Noche (22:00-6:00)',
  'D': 'Descanso',
  'L': 'Licencia/Permiso',
  'V': 'Vacaciones',
  'X': 'Turno Extra'
}

export function SimpleScheduleView({
  weekDates,
  employees,
  shifts,
  showLegend = true,
  showPositions = false,
  onCellClick,
  className = '',
  compactMode = false,
  mobileMode = false,
  maxEmployeesOnMobile = 5
}: SimpleScheduleViewProps) {
  
  // Formatear las fechas para el header
  const formattedDates = useMemo(() => {
    return weekDates.map((date, index) => ({
      dayName: DAYS_OF_WEEK_SHORT[index] || DAYS_OF_WEEK_SHORT[date.getDay() - 1],
      dayNumber: date.getDate(),
      month: MONTHS_SHORT[date.getMonth()],
      dateString: date.toISOString().split('T')[0],
      isWeekend: date.getDay() === 0 || date.getDay() === 6,
      isToday: date.toDateString() === new Date().toDateString()
    }))
  }, [weekDates])

  // Obtener el turno para un empleado y fecha específicos
  const getShiftForEmployeeAndDate = (employeeId: string, dateString: string): SimpleShift | null => {
    return shifts.find(shift => 
      shift.employeeId === employeeId && shift.date === dateString
    ) || null
  }

  // Obtener el rango de fechas para el título
  const dateRangeTitle = useMemo(() => {
    if (weekDates.length === 0) return 'Horario Semanal'
    const firstDate = weekDates[0]
    const lastDate = weekDates[weekDates.length - 1]
    return `HORARIO: ${firstDate.getDate()} ${MONTHS_SHORT[firstDate.getMonth()]} - ${lastDate.getDate()} ${MONTHS_SHORT[lastDate.getMonth()]} ${lastDate.getFullYear()}`
  }, [weekDates])

  // Configuración responsive
  const cellHeight = compactMode || mobileMode ? 'h-8' : 'h-10'
  const fontSize = compactMode || mobileMode ? 'text-xs' : 'text-sm'
  const headerSize = compactMode || mobileMode ? 'text-xs' : 'text-sm'
  const padding = mobileMode ? 'px-1 py-1' : 'px-3 py-2'
  
  // Empleados a mostrar (limitados en móvil)
  const displayEmployees = mobileMode 
    ? employees.slice(0, maxEmployeesOnMobile)
    : employees
  
  // Mostrar indicador de empleados ocultos en móvil
  const hiddenEmployeesCount = mobileMode && employees.length > maxEmployeesOnMobile 
    ? employees.length - maxEmployeesOnMobile 
    : 0

  return (
    <Card className={`p-0 overflow-hidden ${className}`}>
      {/* Título */}
      <div className="bg-gray-50 px-2 sm:px-4 py-2 sm:py-3 border-b border-gray-300">
        <h3 className={`font-bold text-gray-900 text-center ${mobileMode ? 'text-sm' : 'text-lg'}`}>
          {dateRangeTitle}
        </h3>
        {hiddenEmployeesCount > 0 && (
          <p className="text-xs text-gray-600 text-center mt-1">
            Mostrando {maxEmployeesOnMobile} de {employees.length} empleados
            <span className="ml-2 text-blue-600 cursor-pointer hover:underline">
              Ver todos
            </span>
          </p>
        )}
      </div>

      {/* Tabla */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          {/* Header con días */}
          <thead>
            <tr className="bg-gray-100 border-b-2 border-gray-300">
              <th className={`sticky left-0 z-10 bg-gray-100 border-r-2 border-gray-300 ${padding} text-left font-semibold ${headerSize}`}>
                {mobileMode ? 'EMPLEADO' : (showPositions ? 'EMPLEADO / CARGO' : 'EMPLEADO')}
              </th>
              {formattedDates.map((date, index) => (
                <th 
                  key={index}
                  className={`
                    ${padding} text-center font-semibold border-r border-gray-200 ${mobileMode ? 'min-w-[40px]' : 'min-w-[60px]'}
                    ${date.isWeekend ? 'bg-gray-200' : ''}
                    ${date.isToday ? 'bg-blue-100' : ''}
                    ${headerSize}
                  `}
                >
                  <div className="font-bold">{mobileMode ? date.dayName.substring(0, 2) : date.dayName}</div>
                  {!mobileMode && (
                    <div className="text-xs font-normal text-gray-600">
                      {date.dayNumber}
                    </div>
                  )}
                </th>
              ))}
            </tr>
          </thead>

          {/* Body con empleados y turnos */}
          <tbody>
            {displayEmployees.map((employee, empIndex) => (
              <tr 
                key={employee.id}
                className={`
                  border-b border-gray-200
                  ${empIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                  hover:bg-blue-50 transition-colors
                `}
              >
                {/* Columna del empleado */}
                <td className={`sticky left-0 z-10 border-r-2 border-gray-300 ${padding} font-medium ${fontSize} ${empIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                  <div className="font-semibold text-gray-900 truncate" title={employee.name}>
                    {mobileMode && employee.name.length > 12 
                      ? employee.name.substring(0, 12) + '...'
                      : employee.name
                    }
                  </div>
                  {showPositions && employee.position && !mobileMode && (
                    <div className="text-xs text-gray-600 truncate" title={employee.position}>
                      {employee.position}
                    </div>
                  )}
                </td>

                {/* Celdas de turnos */}
                {formattedDates.map((date) => {
                  const shift = getShiftForEmployeeAndDate(employee.id, date.dateString)
                  const shiftCode = shift?.shiftCode || ''
                  const shiftColor = shift ? SHIFT_COLORS[shift.shiftCode] : ''
                  const shiftDescription = shift ? SHIFT_DESCRIPTIONS[shift.shiftCode] : ''
                  
                  return (
                    <td
                      key={date.dateString}
                      className={`
                        text-center border-r border-gray-200 cursor-pointer
                        ${cellHeight}
                        ${date.isWeekend ? 'bg-gray-100' : ''}
                        ${shift ? shiftColor : ''}
                        hover:opacity-80 transition-opacity
                      `}
                      onClick={() => onCellClick?.(employee.id, date.dateString)}
                      title={shift ? `${employee.name} - ${shiftDescription}` : 'Sin turno asignado'}
                    >
                      <div className={`font-bold ${fontSize}`}>
                        {shiftCode}
                      </div>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Leyenda */}
      {showLegend && (
        <div className="bg-gray-50 px-2 sm:px-4 py-2 sm:py-3 border-t border-gray-300">
          <div className={`flex flex-wrap items-center gap-x-2 sm:gap-x-4 gap-y-1 sm:gap-y-2 ${mobileMode ? 'text-xs' : 'text-xs'}`}>
            {!mobileMode && <span className="font-semibold text-gray-700">Leyenda:</span>}
            <div className="flex items-center gap-1">
              <span className={`${mobileMode ? 'px-1 py-0.5 text-xs' : 'px-2 py-1'} bg-white border border-gray-300 font-bold`}>M</span>
              <span className="text-gray-600">{mobileMode ? 'Mañana' : 'Mañana (6-14h)'}</span>
            </div>
            <div className="flex items-center gap-1">
              <span className={`${mobileMode ? 'px-1 py-0.5 text-xs' : 'px-2 py-1'} bg-white border border-gray-300 font-bold`}>T</span>
              <span className="text-gray-600">{mobileMode ? 'Tarde' : 'Tarde (14-22h)'}</span>
            </div>
            <div className="flex items-center gap-1">
              <span className={`${mobileMode ? 'px-1 py-0.5 text-xs' : 'px-2 py-1'} bg-gray-100 border border-gray-300 font-bold`}>N</span>
              <span className="text-gray-600">{mobileMode ? 'Noche' : 'Noche (22-6h)'}</span>
            </div>
            <div className="flex items-center gap-1">
              <span className={`${mobileMode ? 'px-1 py-0.5 text-xs' : 'px-2 py-1'} bg-orange-200 text-orange-900 border border-orange-300 font-bold`}>D</span>
              <span className="text-gray-600">Descanso</span>
            </div>
            {!mobileMode && (
              <>
                <div className="flex items-center gap-1">
                  <span className="px-2 py-1 bg-green-100 text-green-800 border border-green-300 font-bold">V</span>
                  <span className="text-gray-600">Vacaciones</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="px-2 py-1 bg-gray-200 text-gray-700 border border-gray-300 font-bold">L</span>
                  <span className="text-gray-600">Licencia</span>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </Card>
  )
}

export default SimpleScheduleView