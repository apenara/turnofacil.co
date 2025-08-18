/**
 * Hook para gestión de licencias y permisos de empleados
 * @fileoverview Maneja el estado y operaciones de licencias laborales
 */

import { useState, useCallback, useMemo } from 'react'
import { 
  LeaveRequest, 
  LeaveType, 
  LeaveStatus,
  Employee, 
  ScheduleShift
} from '../types'
import { 
  dateToISOString,
  daysDifference,
  generateUniqueId,
  isDateInWeek
} from '../utils'

/**
 * Datos para crear una nueva solicitud de licencia
 */
export interface CreateLeaveData {
  employeeId: string
  employeeName: string
  type: LeaveType
  startDate: string
  endDate: string
  reason?: string
  notes?: string
  requestedBy: string
}

/**
 * Datos para actualizar una solicitud de licencia existente
 */
export interface UpdateLeaveData extends Partial<CreateLeaveData> {
  id: string
  status?: LeaveStatus
  approvedBy?: string
  approvedAt?: string
  rejectionReason?: string
}

/**
 * Estadísticas de licencias por empleado
 */
export interface EmployeeLeaveStats {
  employeeId: string
  employeeName: string
  totalDays: number
  approvedDays: number
  pendingDays: number
  rejectedDays: number
  byType: Record<LeaveType, number>
}

/**
 * Hook para gestión de licencias
 * @param employees - Lista de empleados disponibles
 * @param shifts - Turnos actuales de la semana
 * @param weekDates - Fechas de la semana actual
 * @returns Objeto con estado y funciones de gestión de licencias
 */
export function useLeaveManagement(
  employees: Employee[],
  shifts: ScheduleShift[],
  weekDates: Date[]
) {
  // Estado principal
  const [leaves, setLeaves] = useState<LeaveRequest[]>([])
  const [isLoading, setIsLoading] = useState(false)

  /**
   * Calcula estadísticas de licencias por empleado
   */
  const employeeStats = useMemo(() => {
    const stats: EmployeeLeaveStats[] = employees.map(employee => {
      const employeeLeaves = leaves.filter(leave => leave.employeeId === employee.id)
      
      const totalDays = employeeLeaves.reduce((sum, leave) => {
        return sum + daysDifference(new Date(leave.startDate), new Date(leave.endDate)) + 1
      }, 0)
      
      const approvedDays = employeeLeaves
        .filter(leave => leave.status === 'approved')
        .reduce((sum, leave) => {
          return sum + daysDifference(new Date(leave.startDate), new Date(leave.endDate)) + 1
        }, 0)
      
      const pendingDays = employeeLeaves
        .filter(leave => leave.status === 'pending')
        .reduce((sum, leave) => {
          return sum + daysDifference(new Date(leave.startDate), new Date(leave.endDate)) + 1
        }, 0)
      
      const rejectedDays = employeeLeaves
        .filter(leave => leave.status === 'rejected')
        .reduce((sum, leave) => {
          return sum + daysDifference(new Date(leave.startDate), new Date(leave.endDate)) + 1
        }, 0)
      
      const byType: Record<LeaveType, number> = {
        vacation: 0,
        sick: 0,
        maternity: 0,
        paternity: 0,
        personal: 0,
        emergency: 0,
        bereavement: 0,
        study: 0,
        unpaid: 0
      }
      
      employeeLeaves.forEach(leave => {
        if (leave.status === 'approved') {
          const days = daysDifference(new Date(leave.startDate), new Date(leave.endDate)) + 1
          byType[leave.type] += days
        }
      })
      
      return {
        employeeId: employee.id,
        employeeName: employee.name,
        totalDays,
        approvedDays,
        pendingDays,
        rejectedDays,
        byType
      }
    })
    
    return stats
  }, [employees, leaves])

  /**
   * Obtiene conflictos con turnos programados
   */
  const leaveConflicts = useMemo(() => {
    const conflicts: Array<{
      leaveId: string
      employeeId: string
      employeeName: string
      conflictDates: string[]
      conflictingShifts: ScheduleShift[]
    }> = []
    
    leaves
      .filter(leave => leave.status === 'approved')
      .forEach(leave => {
        const conflictingShifts = shifts.filter(shift => 
          shift.employeeId === leave.employeeId &&
          shift.date >= leave.startDate &&
          shift.date <= leave.endDate
        )
        
        if (conflictingShifts.length > 0) {
          const conflictDates = [...new Set(conflictingShifts.map(shift => shift.date))]
          const employee = employees.find(emp => emp.id === leave.employeeId)
          
          conflicts.push({
            leaveId: leave.id,
            employeeId: leave.employeeId,
            employeeName: employee?.name || leave.employeeName,
            conflictDates,
            conflictingShifts
          })
        }
      })
    
    return conflicts
  }, [leaves, shifts, employees])

  /**
   * Crea una nueva solicitud de licencia
   */
  const createLeave = useCallback(async (data: CreateLeaveData): Promise<LeaveRequest> => {
    setIsLoading(true)
    
    try {
      const employee = employees.find(emp => emp.id === data.employeeId)
      if (!employee) {
        throw new Error('Empleado no encontrado')
      }

      // Validar fechas
      const startDate = new Date(data.startDate)
      const endDate = new Date(data.endDate)
      
      if (endDate < startDate) {
        throw new Error('La fecha de fin no puede ser anterior a la fecha de inicio')
      }

      // Verificar solapamiento con otras licencias aprobadas
      const overlappingLeave = leaves.find(leave => 
        leave.employeeId === data.employeeId &&
        leave.status === 'approved' &&
        !(endDate < new Date(leave.startDate) || startDate > new Date(leave.endDate))
      )
      
      if (overlappingLeave) {
        throw new Error('Ya existe una licencia aprobada que se solapa con estas fechas')
      }

      const newLeave: LeaveRequest = {
        id: generateUniqueId('leave'),
        employeeId: data.employeeId,
        employeeName: data.employeeName,
        type: data.type,
        startDate: data.startDate,
        endDate: data.endDate,
        reason: data.reason || '',
        notes: data.notes,
        status: 'pending',
        requestDate: new Date().toISOString().split('T')[0],
        requestedBy: data.requestedBy,
        requestedAt: new Date().toISOString()
      }

      setLeaves(prevLeaves => [...prevLeaves, newLeave])
      return newLeave
    } catch (error) {
      console.error('Error creating leave request:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }, [employees, leaves])

  /**
   * Actualiza una solicitud de licencia existente
   */
  const updateLeave = useCallback(async (data: UpdateLeaveData): Promise<LeaveRequest> => {
    setIsLoading(true)
    
    try {
      const existingLeave = leaves.find(leave => leave.id === data.id)
      if (!existingLeave) {
        throw new Error('Solicitud de licencia no encontrada')
      }

      // Si se cambian las fechas, validar nuevamente
      if (data.startDate || data.endDate) {
        const startDate = new Date(data.startDate || existingLeave.startDate)
        const endDate = new Date(data.endDate || existingLeave.endDate)
        
        if (endDate < startDate) {
          throw new Error('La fecha de fin no puede ser anterior a la fecha de inicio')
        }

        // Verificar solapamiento con otras licencias (excluyendo la actual)
        const overlappingLeave = leaves.find(leave => 
          leave.id !== data.id &&
          leave.employeeId === existingLeave.employeeId &&
          leave.status === 'approved' &&
          !(endDate < new Date(leave.startDate) || startDate > new Date(leave.endDate))
        )
        
        if (overlappingLeave) {
          throw new Error('Las nuevas fechas se solapan con otra licencia aprobada')
        }
      }

      const updatedLeave: LeaveRequest = {
        ...existingLeave,
        ...data,
        updatedAt: new Date().toISOString()
      }

      // Si se aprueba o rechaza, agregar timestamps correspondientes
      if (data.status === 'approved' && !updatedLeave.approvedAt) {
        updatedLeave.approvedAt = new Date().toISOString()
      }

      setLeaves(prevLeaves => 
        prevLeaves.map(leave => 
          leave.id === data.id ? updatedLeave : leave
        )
      )

      return updatedLeave
    } catch (error) {
      console.error('Error updating leave request:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }, [leaves])

  /**
   * Elimina una solicitud de licencia
   */
  const deleteLeave = useCallback(async (leaveId: string): Promise<void> => {
    setIsLoading(true)
    
    try {
      setLeaves(prevLeaves => prevLeaves.filter(leave => leave.id !== leaveId))
    } catch (error) {
      console.error('Error deleting leave request:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }, [])

  /**
   * Aprueba una solicitud de licencia
   */
  const approveLeave = useCallback(async (
    leaveId: string, 
    approvedBy: string,
    notes?: string
  ): Promise<LeaveRequest> => {
    return updateLeave({
      id: leaveId,
      status: 'approved',
      approvedBy,
      approvedAt: new Date().toISOString(),
      notes
    })
  }, [updateLeave])

  /**
   * Rechaza una solicitud de licencia
   */
  const rejectLeave = useCallback(async (
    leaveId: string,
    rejectionReason: string,
    rejectedBy: string
  ): Promise<LeaveRequest> => {
    return updateLeave({
      id: leaveId,
      status: 'rejected',
      rejectionReason,
      approvedBy: rejectedBy // Usamos el mismo campo para quien procesa la solicitud
    })
  }, [updateLeave])

  /**
   * Obtiene licencias de un empleado específico
   */
  const getLeavesForEmployee = useCallback((employeeId: string, status?: LeaveStatus): LeaveRequest[] => {
    return leaves.filter(leave => 
      leave.employeeId === employeeId &&
      (status ? leave.status === status : true)
    )
  }, [leaves])

  /**
   * Obtiene licencias en un rango de fechas
   */
  const getLeavesInDateRange = useCallback((startDate: string, endDate: string): LeaveRequest[] => {
    return leaves.filter(leave => 
      !(new Date(leave.endDate) < new Date(startDate) || new Date(leave.startDate) > new Date(endDate))
    )
  }, [leaves])

  /**
   * Verifica si un empleado tiene licencia en una fecha específica
   */
  const hasLeaveOnDate = useCallback((employeeId: string, date: string): LeaveRequest | null => {
    return leaves.find(leave => 
      leave.employeeId === employeeId &&
      leave.status === 'approved' &&
      date >= leave.startDate &&
      date <= leave.endDate
    ) || null
  }, [leaves])

  /**
   * Obtiene licencias que afectan la semana actual
   */
  const weeklyLeaves = useMemo(() => {
    const weekStart = dateToISOString(weekDates[0])
    const weekEnd = dateToISOString(weekDates[weekDates.length - 1])
    
    return getLeavesInDateRange(weekStart, weekEnd).filter(leave => 
      leave.status === 'approved'
    )
  }, [weekDates, getLeavesInDateRange])

  /**
   * Obtiene estadísticas generales de licencias
   */
  const generalStats = useMemo(() => {
    const totalRequests = leaves.length
    const pendingRequests = leaves.filter(l => l.status === 'pending').length
    const approvedRequests = leaves.filter(l => l.status === 'approved').length
    const rejectedRequests = leaves.filter(l => l.status === 'rejected').length
    
    return {
      totalRequests,
      pendingRequests,
      approvedRequests,
      rejectedRequests,
      conflictsCount: leaveConflicts.length
    }
  }, [leaves, leaveConflicts])

  /**
   * Limpia todas las licencias
   */
  const clearAllLeaves = useCallback((): void => {
    setLeaves([])
  }, [])

  /**
   * Carga licencias desde datos externos
   */
  const loadLeaves = useCallback((leavesData: LeaveRequest[]): void => {
    setLeaves(leavesData)
  }, [])

  return {
    // Estado
    leaves,
    isLoading,
    employeeStats,
    leaveConflicts,
    weeklyLeaves,
    generalStats,

    // Acciones CRUD
    createLeave,
    updateLeave,
    deleteLeave,

    // Operaciones de aprobación
    approveLeave,
    rejectLeave,

    // Consultas
    getLeavesForEmployee,
    getLeavesInDateRange,
    hasLeaveOnDate,

    // Operaciones en lote
    clearAllLeaves,
    loadLeaves
  }
}