/**
 * Hook para manejo de vista simplificada de horarios
 * Convierte turnos complejos a códigos simples
 */

import { useMemo } from 'react'
import { ScheduleShift, Employee } from '../core/types'
import { SimpleShift } from '@/components/calendar/SimpleScheduleView'

/**
 * Configuración de códigos simples
 */
const SHIFT_CODE_CONFIG = {
  // Horarios matutinos (6:00 - 14:00)
  morning: {
    codes: ['M'],
    timeRanges: [
      { start: '06:00', end: '14:00' },
      { start: '07:00', end: '15:00' },
      { start: '08:00', end: '16:00' }
    ]
  },
  // Horarios vespertinos (14:00 - 22:00)
  afternoon: {
    codes: ['T'],
    timeRanges: [
      { start: '14:00', end: '22:00' },
      { start: '15:00', end: '23:00' },
      { start: '16:00', end: '24:00' }
    ]
  },
  // Horarios nocturnos (22:00 - 06:00)
  night: {
    codes: ['N'],
    timeRanges: [
      { start: '22:00', end: '06:00' },
      { start: '23:00', end: '07:00' },
      { start: '00:00', end: '08:00' }
    ]
  }
}

interface UseSimpleScheduleProps {
  shifts: ScheduleShift[]
  employees: Employee[]
  weekDates: Date[]
}

/**
 * Convierte hora string a minutos para comparación
 */
function timeToMinutes(timeStr: string): number {
  const [hours, minutes] = timeStr.split(':').map(Number)
  return hours * 60 + minutes
}

/**
 * Determina el código de turno basado en horarios
 */
function getShiftCode(startTime: string, endTime: string, type: ScheduleShift['type']): SimpleShift['shiftCode'] {
  const startMinutes = timeToMinutes(startTime)
  
  // Casos especiales por tipo
  if (type === 'holiday') return 'V' // Vacaciones para días festivos
  if (type === 'overtime') return 'X' // Extra para horas extra
  
  // Determinar por horario
  if (startMinutes >= 360 && startMinutes < 840) { // 6:00 - 14:00
    return 'M' // Mañana
  } else if (startMinutes >= 840 && startMinutes < 1320) { // 14:00 - 22:00
    return 'T' // Tarde
  } else { // 22:00 - 6:00
    return 'N' // Noche
  }
}

/**
 * Convierte un turno complejo a turno simple
 */
function convertToSimpleShift(shift: ScheduleShift): SimpleShift {
  const shiftCode = getShiftCode(shift.startTime, shift.endTime, shift.type)
  
  return {
    id: shift.id,
    employeeId: shift.employeeId,
    employeeName: shift.employeeName,
    date: shift.date,
    shiftCode,
    startTime: shift.startTime,
    endTime: shift.endTime,
    isHoliday: shift.type === 'holiday',
    isWeekend: new Date(shift.date).getDay() === 0 || new Date(shift.date).getDay() === 6
  }
}

/**
 * Hook principal para vista simplificada
 */
export function useSimpleSchedule({ shifts, employees, weekDates }: UseSimpleScheduleProps) {
  
  // Convertir turnos a formato simple
  const simpleShifts = useMemo(() => {
    return shifts.map(convertToSimpleShift)
  }, [shifts])
  
  // Preparar empleados para vista simple
  const simpleEmployees = useMemo(() => {
    return employees.map(emp => ({
      id: emp.id,
      name: emp.name,
      position: emp.position
    }))
  }, [employees])
  
  // Estadísticas de la vista simple
  const statistics = useMemo(() => {
    const shiftCounts = {
      M: simpleShifts.filter(s => s.shiftCode === 'M').length,
      T: simpleShifts.filter(s => s.shiftCode === 'T').length,
      N: simpleShifts.filter(s => s.shiftCode === 'N').length,
      D: simpleShifts.filter(s => s.shiftCode === 'D').length,
      L: simpleShifts.filter(s => s.shiftCode === 'L').length,
      V: simpleShifts.filter(s => s.shiftCode === 'V').length,
      X: simpleShifts.filter(s => s.shiftCode === 'X').length
    }
    
    const employeesWithShifts = new Set(simpleShifts.map(s => s.employeeId)).size
    const totalShifts = simpleShifts.length
    
    return {
      shiftCounts,
      employeesWithShifts,
      totalShifts,
      coverage: employeesWithShifts / employees.length * 100
    }
  }, [simpleShifts, employees.length])
  
  // Función para agregar días de descanso
  const addRestDays = useMemo(() => {
    const shiftsWithRest: SimpleShift[] = [...simpleShifts]
    
    // Por cada empleado, agregar días de descanso donde no hay turnos
    employees.forEach(employee => {
      weekDates.forEach(date => {
        const dateStr = date.toISOString().split('T')[0]
        const hasShift = simpleShifts.some(s => 
          s.employeeId === employee.id && s.date === dateStr
        )
        
        if (!hasShift) {
          shiftsWithRest.push({
            id: `rest-${employee.id}-${dateStr}`,
            employeeId: employee.id,
            employeeName: employee.name,
            date: dateStr,
            shiftCode: 'D', // Descanso
            isWeekend: date.getDay() === 0 || date.getDay() === 6
          })
        }
      })
    })
    
    return shiftsWithRest
  }, [simpleShifts, employees, weekDates])
  
  // Función para exportar datos
  const exportData = useMemo(() => ({
    // Datos para Excel/CSV
    toCsv: () => {
      const headers = ['Empleado', ...weekDates.map(d => 
        d.toLocaleDateString('es-CO', { weekday: 'short', day: 'numeric' })
      )]
      
      const rows = employees.map(emp => {
        const row = [emp.name]
        weekDates.forEach(date => {
          const dateStr = date.toISOString().split('T')[0]
          const shift = addRestDays.find(s => 
            s.employeeId === emp.id && s.date === dateStr
          )
          row.push(shift?.shiftCode || '')
        })
        return row
      })
      
      return [headers, ...rows]
    },
    
    // Datos para impresión
    toPrintData: () => ({
      title: `HORARIO: ${weekDates[0]?.getDate()} ${weekDates[0]?.toLocaleDateString('es-CO', { month: 'short' })} - ${weekDates[6]?.getDate()} ${weekDates[6]?.toLocaleDateString('es-CO', { month: 'short' })} ${weekDates[6]?.getFullYear()}`,
      employees: simpleEmployees,
      shifts: addRestDays,
      weekDates,
      statistics
    })
  }), [addRestDays, employees, simpleEmployees, weekDates, statistics])
  
  return {
    simpleShifts: addRestDays,
    simpleEmployees,
    statistics,
    exportData,
    
    // Utilidades
    getShiftForEmployee: (employeeId: string, date: string) => 
      addRestDays.find(s => s.employeeId === employeeId && s.date === date),
    
    getEmployeeWeeklyPattern: (employeeId: string) => 
      weekDates.map(date => {
        const dateStr = date.toISOString().split('T')[0]
        const shift = addRestDays.find(s => s.employeeId === employeeId && s.date === dateStr)
        return shift?.shiftCode || 'D'
      }).join('-')
  }
}

export default useSimpleSchedule