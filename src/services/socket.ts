import { io, Socket } from 'socket.io-client'
import type { CustomerSession, UploadedDocument, VehicleInfo, OCRResult, PricePrediction } from '../types'

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:4000'

class SocketService {
  private socket: Socket | null = null
  private registeredEvents: Set<string> = new Set()

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      // 이미 연결되어 있으면 바로 resolve
      if (this.socket?.connected) {
        resolve()
        return
      }

      // 기존 소켓이 있으면 정리
      if (this.socket) {
        this.socket.removeAllListeners()
        this.socket.disconnect()
      }

      this.socket = io(SOCKET_URL, {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      })

      this.socket.on('connect', () => {
        console.log('Socket connected:', this.socket?.id)
        resolve()
      })

      this.socket.on('connect_error', (error) => {
        console.error('Socket connection error:', error)
        reject(error)
      })

      this.socket.on('disconnect', (reason) => {
        console.log('Socket disconnected:', reason)
      })
    })
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.removeAllListeners()
      this.socket.disconnect()
      this.socket = null
    }
    this.registeredEvents.clear()
  }

  isConnected(): boolean {
    return this.socket?.connected ?? false
  }

  // 이벤트 리스너 등록 (중복 방지)
  private registerEvent(event: string, handler: (...args: unknown[]) => void): void {
    if (!this.socket) return

    // 이미 등록된 이벤트면 스킵
    if (this.registeredEvents.has(event)) {
      return
    }

    this.registeredEvents.add(event)
    this.socket.on(event, handler)
  }

  // === 고객 이벤트 ===

  customerJoin(phoneNumber: string, customerName: string): void {
    this.socket?.emit('customer:join', { phoneNumber, customerName })
  }

  uploadDocument(document: UploadedDocument): void {
    this.socket?.emit('customer:upload_document', document)
  }

  submitVehicleInfo(vehicleInfo: VehicleInfo): void {
    this.socket?.emit('customer:submit_vehicle_info', vehicleInfo)
  }

  // 고객 이벤트 리스너
  onSessionCreated(handler: (session: CustomerSession) => void): void {
    this.registerEvent('customer:session_created', handler as (...args: unknown[]) => void)
  }

  onOcrProcessing(handler: (documentId: string) => void): void {
    this.registerEvent('customer:ocr_processing', handler as (...args: unknown[]) => void)
  }

  onAdditionalDocumentRequest(handler: (message: string) => void): void {
    this.registerEvent('customer:additional_document_request', handler as (...args: unknown[]) => void)
  }

  onPriceReport(handler: (prediction: PricePrediction) => void): void {
    this.registerEvent('customer:price_report', handler as (...args: unknown[]) => void)
  }

  // 고객용: OCR 완료 이벤트
  onCustomerOcrCompleted(handler: (documentId: string, ocrResult: OCRResult) => void): void {
    this.registerEvent('customer:ocr_completed', ((data: { documentId: string; ocrResult: OCRResult }) => {
      handler(data.documentId, data.ocrResult)
    }) as (...args: unknown[]) => void)
  }

  // === 상담원 이벤트 ===

  agentJoin(agentId: string): void {
    this.socket?.emit('agent:join', agentId)
  }

  requestAdditionalDocument(sessionId: string, message: string): void {
    this.socket?.emit('agent:request_additional_document', sessionId, message)
  }

  updateOcrResult(sessionId: string, documentId: string, ocrResult: OCRResult): void {
    this.socket?.emit('agent:update_ocr_result', sessionId, documentId, ocrResult)
  }

  sendPriceReport(sessionId: string): void {
    this.socket?.emit('agent:send_price_report', sessionId)
  }

  // 상담원 이벤트 리스너
  onNewSession(handler: (session: CustomerSession) => void): void {
    this.registerEvent('agent:new_session', handler as (...args: unknown[]) => void)
  }

  onDocumentUploaded(handler: (sessionId: string, document: UploadedDocument) => void): void {
    this.registerEvent('agent:document_uploaded', ((data: { sessionId: string; document: UploadedDocument }) => {
      handler(data.sessionId, data.document)
    }) as (...args: unknown[]) => void)
  }

  onVehicleInfoSubmitted(handler: (sessionId: string, vehicleInfo: VehicleInfo) => void): void {
    this.registerEvent('agent:vehicle_info_submitted', ((data: { sessionId: string; vehicleInfo: VehicleInfo }) => {
      handler(data.sessionId, data.vehicleInfo)
    }) as (...args: unknown[]) => void)
  }

  onOcrCompleted(handler: (sessionId: string, documentId: string, ocrResult: OCRResult) => void): void {
    this.registerEvent('agent:ocr_completed', ((data: { sessionId: string; documentId: string; ocrResult: OCRResult }) => {
      handler(data.sessionId, data.documentId, data.ocrResult)
    }) as (...args: unknown[]) => void)
  }

  onSessionUpdated(handler: (session: CustomerSession) => void): void {
    this.registerEvent('agent:session_updated', handler as (...args: unknown[]) => void)
  }

  onSessionRemoved(handler: (sessionId: string) => void): void {
    this.registerEvent('agent:session_removed', handler as (...args: unknown[]) => void)
  }
}

export const socketService = new SocketService()
