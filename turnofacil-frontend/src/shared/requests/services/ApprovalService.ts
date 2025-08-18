/**
 * Servicio de Aprobaciones para Requests
 * @fileoverview Maneja todo el flujo de aprobaciones y escalaciones
 */

import {
  TeamRequest,
  RequestContext,
  ServiceResponse,
  ApprovalDecision,
  ApprovalReview,
  ApprovalStage,
  UserRole,
  RequestStatus
} from '../core/types'
import { RequestPermissionManager } from '../core/permissions'
import { UI_MESSAGES, REQUEST_CONFIG } from '../core/constants'

/**
 * Servicio para gestionar aprobaciones y escalaciones
 */
export class ApprovalService {
  private permissionManager: RequestPermissionManager
  private context: RequestContext

  constructor(context: RequestContext) {
    this.context = context
    this.permissionManager = new RequestPermissionManager(context)
  }

  // ========== ACCIONES DE APROBACIÓN ==========

  /**
   * Aprueba una request
   */
  async approveRequest(
    requestId: string, 
    comments?: string
  ): Promise<ServiceResponse<TeamRequest>> {
    try {
      // Obtener la request actual
      const request = await this.getRequestById(requestId)
      if (!request) {
        return {
          error: UI_MESSAGES.error.REQUEST_NOT_FOUND,
          status: 'error'
        }
      }

      // Verificar permisos
      if (!this.permissionManager.canManageRequest(request, 'approve')) {
        return {
          error: UI_MESSAGES.error.INSUFFICIENT_PERMISSIONS,
          status: 'error'
        }
      }

      // Verificar que esté en un estado aprobable
      if (!this.canApproveRequest(request)) {
        return {
          error: 'La solicitud no se puede aprobar en su estado actual',
          status: 'error'
        }
      }

      // Crear la revisión de aprobación
      const review = this.createApprovalReview('approved', comments)

      // Procesar la aprobación
      const updatedRequest = await this.processApproval(request, review)

      return {
        data: updatedRequest,
        status: 'success'
      }

    } catch (error) {
      return {
        error: error instanceof Error ? error.message : UI_MESSAGES.error.SERVER_ERROR,
        status: 'error'
      }
    }
  }

  /**
   * Rechaza una request
   */
  async rejectRequest(
    requestId: string, 
    comments: string
  ): Promise<ServiceResponse<TeamRequest>> {
    try {
      // Obtener la request actual
      const request = await this.getRequestById(requestId)
      if (!request) {
        return {
          error: UI_MESSAGES.error.REQUEST_NOT_FOUND,
          status: 'error'
        }
      }

      // Verificar permisos
      if (!this.permissionManager.canManageRequest(request, 'reject')) {
        return {
          error: UI_MESSAGES.error.INSUFFICIENT_PERMISSIONS,
          status: 'error'
        }
      }

      // Verificar que se proporcionen comentarios para rechazos
      if (!comments?.trim()) {
        return {
          error: 'Los comentarios son obligatorios para rechazar una solicitud',
          status: 'error'
        }
      }

      // Crear la revisión de rechazo
      const review = this.createApprovalReview('rejected', comments)

      // Procesar el rechazo
      const updatedRequest = await this.processRejection(request, review)

      return {
        data: updatedRequest,
        status: 'success'
      }

    } catch (error) {
      return {
        error: error instanceof Error ? error.message : UI_MESSAGES.error.SERVER_ERROR,
        status: 'error'
      }
    }
  }

  /**
   * Escala una request al siguiente nivel
   */
  async escalateRequest(
    requestId: string, 
    reason?: string
  ): Promise<ServiceResponse<TeamRequest>> {
    try {
      // Obtener la request actual
      const request = await this.getRequestById(requestId)
      if (!request) {
        return {
          error: UI_MESSAGES.error.REQUEST_NOT_FOUND,
          status: 'error'
        }
      }

      // Verificar permisos
      if (!this.permissionManager.canEscalateRequest(request)) {
        return {
          error: UI_MESSAGES.error.INSUFFICIENT_PERMISSIONS,
          status: 'error'
        }
      }

      // Verificar que se puede escalar
      if (!this.canEscalateRequest(request)) {
        return {
          error: 'La solicitud no se puede escalar en su estado actual',
          status: 'error'
        }
      }

      // Crear la revisión de escalación
      const review = this.createApprovalReview('escalated', reason)

      // Procesar la escalación
      const updatedRequest = await this.processEscalation(request, review)

      return {
        data: updatedRequest,
        status: 'success'
      }

    } catch (error) {
      return {
        error: error instanceof Error ? error.message : UI_MESSAGES.error.SERVER_ERROR,
        status: 'error'
      }
    }
  }

  /**
   * Solicita información adicional para una request
   */
  async requestMoreInfo(
    requestId: string, 
    comments: string
  ): Promise<ServiceResponse<TeamRequest>> {
    try {
      // Obtener la request actual
      const request = await this.getRequestById(requestId)
      if (!request) {
        return {
          error: UI_MESSAGES.error.REQUEST_NOT_FOUND,
          status: 'error'
        }
      }

      // Verificar permisos (mismo que aprobar/rechazar)
      if (!this.permissionManager.canManageRequest(request, 'approve')) {
        return {
          error: UI_MESSAGES.error.INSUFFICIENT_PERMISSIONS,
          status: 'error'
        }
      }

      // Crear la revisión
      const review = this.createApprovalReview('needs_info', comments)

      // Procesar solicitud de información
      const updatedRequest = await this.processInfoRequest(request, review)

      return {
        data: updatedRequest,
        status: 'success'
      }

    } catch (error) {
      return {
        error: error instanceof Error ? error.message : UI_MESSAGES.error.SERVER_ERROR,
        status: 'error'
      }
    }
  }

  // ========== ACCIONES EN MASA ==========

  /**
   * Aprueba múltiples requests en lote
   */
  async bulkApprove(
    requestIds: string[], 
    comments?: string
  ): Promise<ServiceResponse<{ approved: string[]; failed: string[] }>> {
    try {
      // Obtener todas las requests
      const requests = await Promise.all(
        requestIds.map(id => this.getRequestById(id))
      )

      // Filtrar las válidas
      const validRequests = requests.filter((r): r is TeamRequest => 
        r !== null && this.permissionManager.canManageRequest(r, 'approve')
      )

      // Verificar permisos para bulk action
      if (!this.permissionManager.canPerformBulkAction('approve', validRequests)) {
        return {
          error: UI_MESSAGES.error.INSUFFICIENT_PERMISSIONS,
          status: 'error'
        }
      }

      const approved: string[] = []
      const failed: string[] = []

      // Procesar cada request
      for (const request of validRequests) {
        try {
          if (this.canApproveRequest(request)) {
            const review = this.createApprovalReview('approved', comments)
            await this.processApproval(request, review)
            approved.push(request.id)
          } else {
            failed.push(request.id)
          }
        } catch (error) {
          failed.push(request.id)
        }
      }

      return {
        data: { approved, failed },
        status: 'success'
      }

    } catch (error) {
      return {
        error: error instanceof Error ? error.message : UI_MESSAGES.error.BULK_ACTION_FAILED,
        status: 'error'
      }
    }
  }

  /**
   * Rechaza múltiples requests en lote
   */
  async bulkReject(
    requestIds: string[], 
    comments: string
  ): Promise<ServiceResponse<{ rejected: string[]; failed: string[] }>> {
    try {
      if (!comments?.trim()) {
        return {
          error: 'Los comentarios son obligatorios para rechazos en lote',
          status: 'error'
        }
      }

      // Obtener todas las requests
      const requests = await Promise.all(
        requestIds.map(id => this.getRequestById(id))
      )

      // Filtrar las válidas
      const validRequests = requests.filter((r): r is TeamRequest => 
        r !== null && this.permissionManager.canManageRequest(r, 'reject')
      )

      // Verificar permisos para bulk action
      if (!this.permissionManager.canPerformBulkAction('reject', validRequests)) {
        return {
          error: UI_MESSAGES.error.INSUFFICIENT_PERMISSIONS,
          status: 'error'
        }
      }

      const rejected: string[] = []
      const failed: string[] = []

      // Procesar cada request
      for (const request of validRequests) {
        try {
          const review = this.createApprovalReview('rejected', comments)
          await this.processRejection(request, review)
          rejected.push(request.id)
        } catch (error) {
          failed.push(request.id)
        }
      }

      return {
        data: { rejected, failed },
        status: 'success'
      }

    } catch (error) {
      return {
        error: error instanceof Error ? error.message : UI_MESSAGES.error.BULK_ACTION_FAILED,
        status: 'error'
      }
    }
  }

  // ========== MÉTODOS PRIVADOS ==========

  /**
   * Crea una revisión de aprobación
   */
  private createApprovalReview(decision: ApprovalDecision, comments?: string): ApprovalReview {
    return {
      id: this.generateId('review'),
      reviewerId: this.context.user.id,
      reviewerName: this.context.user.name,
      reviewerRole: this.context.user.role,
      decision,
      comments: comments?.trim(),
      reviewedAt: new Date().toISOString()
    }
  }

  /**
   * Procesa una aprobación
   */
  private async processApproval(request: TeamRequest, review: ApprovalReview): Promise<TeamRequest> {
    const updatedRequest = { ...request }
    
    // Agregar la revisión al historial
    updatedRequest.approvalFlow.approvalHistory.push(review)

    // Determinar siguiente etapa
    const currentStage = updatedRequest.approvalFlow.currentStage
    const nextStage = this.getNextApprovalStage(request, currentStage, 'approved')
    
    if (nextStage === 'completed') {
      // Proceso completado - request aprobada
      updatedRequest.status = 'approved'
      updatedRequest.approvalFlow.currentStage = 'completed'
    } else {
      // Continuar al siguiente nivel
      updatedRequest.status = 'under_review'
      updatedRequest.approvalFlow.currentStage = nextStage
    }

    // Actualizar metadatos
    if (updatedRequest.metadata) {
      updatedRequest.metadata.updatedAt = new Date().toISOString()
    }

    // Simular actualización en BD
    await this.mockUpdateRequest(updatedRequest)
    
    return updatedRequest
  }

  /**
   * Procesa un rechazo
   */
  private async processRejection(request: TeamRequest, review: ApprovalReview): Promise<TeamRequest> {
    const updatedRequest = { ...request }
    
    // Agregar la revisión al historial
    updatedRequest.approvalFlow.approvalHistory.push(review)

    // Cambiar estado a rechazada (estado final)
    updatedRequest.status = 'rejected'
    updatedRequest.approvalFlow.currentStage = 'completed'

    // Actualizar metadatos
    if (updatedRequest.metadata) {
      updatedRequest.metadata.updatedAt = new Date().toISOString()
    }

    // Simular actualización en BD
    await this.mockUpdateRequest(updatedRequest)
    
    return updatedRequest
  }

  /**
   * Procesa una escalación
   */
  private async processEscalation(request: TeamRequest, review: ApprovalReview): Promise<TeamRequest> {
    const updatedRequest = { ...request }
    
    // Agregar la revisión al historial
    updatedRequest.approvalFlow.approvalHistory.push(review)

    // Marcar como escalada
    updatedRequest.approvalFlow.isEscalated = true
    updatedRequest.approvalFlow.currentStage = 'business_admin'
    updatedRequest.status = 'under_review'

    // Aumentar prioridad si no es ya urgente
    if (updatedRequest.priority === 'low') {
      updatedRequest.priority = 'medium'
    } else if (updatedRequest.priority === 'medium') {
      updatedRequest.priority = 'high'
    }

    // Actualizar metadatos
    if (updatedRequest.metadata) {
      updatedRequest.metadata.updatedAt = new Date().toISOString()
    }

    // Simular actualización en BD
    await this.mockUpdateRequest(updatedRequest)
    
    return updatedRequest
  }

  /**
   * Procesa una solicitud de información adicional
   */
  private async processInfoRequest(request: TeamRequest, review: ApprovalReview): Promise<TeamRequest> {
    const updatedRequest = { ...request }
    
    // Agregar la revisión al historial
    updatedRequest.approvalFlow.approvalHistory.push(review)

    // Regresar a pending para que el empleado pueda proporcionar info
    updatedRequest.status = 'pending'
    // Mantener la etapa actual para que regrese al mismo revisor

    // Actualizar metadatos
    if (updatedRequest.metadata) {
      updatedRequest.metadata.updatedAt = new Date().toISOString()
    }

    // Simular actualización en BD
    await this.mockUpdateRequest(updatedRequest)
    
    return updatedRequest
  }

  /**
   * Determina la siguiente etapa en el flujo de aprobación
   */
  private getNextApprovalStage(
    request: TeamRequest, 
    currentStage: ApprovalStage, 
    decision: ApprovalDecision
  ): ApprovalStage {
    
    if (decision !== 'approved') {
      return 'completed' // Rechazos o escalaciones no continúan el flujo normal
    }

    const { flowConfig } = request.approvalFlow

    switch (currentStage) {
      case 'supervisor':
        // Si requiere aprobación de business admin, ir allí
        if (flowConfig.requiresBusinessAdminApproval) {
          return 'business_admin'
        }
        // Si no, proceso completado
        return 'completed'

      case 'business_admin':
      case 'escalated':
        // Business admin es la etapa final
        return 'completed'

      default:
        return 'completed'
    }
  }

  /**
   * Verifica si una request puede ser aprobada
   */
  private canApproveRequest(request: TeamRequest): boolean {
    const validStatuses: RequestStatus[] = ['pending', 'under_review']
    return validStatuses.includes(request.status)
  }

  /**
   * Verifica si una request puede ser escalada
   */
  private canEscalateRequest(request: TeamRequest): boolean {
    return request.status === 'pending' || request.status === 'under_review'
  }

  /**
   * Obtiene el rol requerido para la etapa actual
   */
  private getRequiredRoleForStage(stage: ApprovalStage): UserRole[] {
    switch (stage) {
      case 'supervisor':
        return ['SUPERVISOR', 'BUSINESS_ADMIN'] // Business admin puede actuar como supervisor
      case 'business_admin':
      case 'escalated':
        return ['BUSINESS_ADMIN']
      default:
        return []
    }
  }

  /**
   * Verifica si el usuario actual puede actuar en la etapa dada
   */
  private canActInStage(stage: ApprovalStage): boolean {
    const requiredRoles = this.getRequiredRoleForStage(stage)
    return requiredRoles.includes(this.context.user.role)
  }

  // ========== UTILIDADES ==========

  private generateId(prefix: string): string {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  // ========== MÉTODOS MOCK ==========

  private async getRequestById(id: string): Promise<TeamRequest | null> {
    // En producción, esto sería una llamada a la API
    await this.delay(50)
    return null // Placeholder
  }

  private async mockUpdateRequest(request: TeamRequest): Promise<void> {
    // En producción, esto sería una llamada a la API para actualizar
    await this.delay(100)
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  // ========== ANÁLISIS Y REPORTES ==========

  /**
   * Obtiene estadísticas de aprobación para un período
   */
  async getApprovalStats(
    startDate: string, 
    endDate: string
  ): Promise<ServiceResponse<{
    totalReviewed: number
    approved: number
    rejected: number
    escalated: number
    averageTimeToDecision: number
    approvalsByStage: Record<ApprovalStage, number>
  }>> {
    try {
      if (!this.permissionManager.can('canViewRequestAnalytics')) {
        return {
          error: UI_MESSAGES.error.INSUFFICIENT_PERMISSIONS,
          status: 'error'
        }
      }

      // En producción, esto consultaría la base de datos
      await this.delay(200)
      
      const mockStats = {
        totalReviewed: 0,
        approved: 0,
        rejected: 0,
        escalated: 0,
        averageTimeToDecision: 0,
        approvalsByStage: {
          employee: 0,
          supervisor: 0,
          business_admin: 0,
          completed: 0,
          escalated: 0
        } as Record<ApprovalStage, number>
      }

      return {
        data: mockStats,
        status: 'success'
      }

    } catch (error) {
      return {
        error: error instanceof Error ? error.message : UI_MESSAGES.error.SERVER_ERROR,
        status: 'error'
      }
    }
  }

  /**
   * Obtiene requests pendientes de aprobación para el usuario actual
   */
  async getPendingApprovals(): Promise<ServiceResponse<TeamRequest[]>> {
    try {
      // Verificar que puede aprobar requests
      if (!this.permissionManager.can('canApproveRequests')) {
        return {
          data: [],
          status: 'success'
        }
      }

      // En producción, esto consultaría requests que el usuario puede aprobar
      await this.delay(150)
      
      return {
        data: [], // Placeholder
        status: 'success'
      }

    } catch (error) {
      return {
        error: error instanceof Error ? error.message : UI_MESSAGES.error.SERVER_ERROR,
        status: 'error'
      }
    }
  }
}