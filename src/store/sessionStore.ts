import { create } from 'zustand'
import type { CustomerSession, UploadedDocument, VehicleInfo, PricePrediction, OCRResult } from '../types'

interface SessionState {
  // 고객용 상태
  currentSession: CustomerSession | null
  isConnected: boolean
  additionalDocumentRequest: string | null
  priceReport: PricePrediction | null

  // 상담원용 상태
  activeSessions: CustomerSession[]

  // 고객 액션
  setCurrentSession: (session: CustomerSession | null) => void
  addDocument: (document: UploadedDocument) => void
  removeDocument: (documentId: string) => void
  updateDocumentStatus: (documentId: string, status: UploadedDocument['status']) => void
  setVehicleInfo: (vehicleInfo: VehicleInfo) => void
  setAdditionalDocumentRequest: (message: string | null) => void
  setPriceReport: (prediction: PricePrediction | null) => void
  setConnected: (connected: boolean) => void
  updateCustomerDocumentOcr: (documentId: string, ocrResult: OCRResult) => void

  // 상담원 액션 (중복 방지 로직 포함)
  addOrUpdateSession: (session: CustomerSession) => void
  updateSessionDocuments: (sessionId: string, document: UploadedDocument) => void
  updateSessionVehicleInfo: (sessionId: string, vehicleInfo: VehicleInfo) => void
  updateDocumentOcr: (sessionId: string, documentId: string, ocrResult: OCRResult) => void
  removeActiveSession: (sessionId: string) => void
}

export const useSessionStore = create<SessionState>((set) => ({
  // 초기 상태
  currentSession: null,
  isConnected: false,
  additionalDocumentRequest: null,
  priceReport: null,
  activeSessions: [],

  // 고객 액션
  setCurrentSession: (session) => set({ currentSession: session }),

  addDocument: (document) =>
    set((state) => ({
      currentSession: state.currentSession
        ? {
            ...state.currentSession,
            documents: [...state.currentSession.documents, document],
          }
        : null,
    })),

  removeDocument: (documentId) =>
    set((state) => ({
      currentSession: state.currentSession
        ? {
            ...state.currentSession,
            documents: state.currentSession.documents.filter(
              (doc) => doc.id !== documentId
            ),
          }
        : null,
    })),

  updateDocumentStatus: (documentId, status) =>
    set((state) => ({
      currentSession: state.currentSession
        ? {
            ...state.currentSession,
            documents: state.currentSession.documents.map((doc) =>
              doc.id === documentId ? { ...doc, status } : doc
            ),
          }
        : null,
    })),

  setVehicleInfo: (vehicleInfo) =>
    set((state) => ({
      currentSession: state.currentSession
        ? { ...state.currentSession, vehicleInfo }
        : null,
    })),

  setAdditionalDocumentRequest: (message) =>
    set({ additionalDocumentRequest: message }),

  setPriceReport: (prediction) => set({ priceReport: prediction }),

  setConnected: (connected) => set({ isConnected: connected }),

  // 고객용: 문서의 OCR 결과 업데이트
  updateCustomerDocumentOcr: (documentId, ocrResult) =>
    set((state) => ({
      currentSession: state.currentSession
        ? {
            ...state.currentSession,
            documents: state.currentSession.documents.map((doc) =>
              doc.id === documentId
                ? {
                    ...doc,
                    type: ocrResult.documentType,
                    status: ocrResult.isValid ? 'valid' : 'needs_review',
                    ocrResult,
                  }
                : doc
            ),
          }
        : null,
    })),

  // 상담원 액션 - 세션 추가 또는 업데이트 (중복 방지)
  addOrUpdateSession: (session) =>
    set((state) => {
      const existingIndex = state.activeSessions.findIndex(
        (s) => s.sessionId === session.sessionId
      )

      if (existingIndex >= 0) {
        // 기존 세션 업데이트
        const updatedSessions = [...state.activeSessions]
        updatedSessions[existingIndex] = {
          ...updatedSessions[existingIndex],
          ...session,
          // 문서는 병합 (기존 문서 유지하면서 새 문서 추가)
          documents: session.documents,
        }
        return { activeSessions: updatedSessions }
      } else {
        // 새 세션 추가
        return { activeSessions: [...state.activeSessions, session] }
      }
    }),

  // 세션에 문서 추가 (중복 방지)
  updateSessionDocuments: (sessionId, document) =>
    set((state) => ({
      activeSessions: state.activeSessions.map((session) => {
        if (session.sessionId !== sessionId) return session

        // 이미 같은 ID의 문서가 있으면 업데이트, 없으면 추가
        const existingDocIndex = session.documents.findIndex(
          (d) => d.id === document.id
        )

        if (existingDocIndex >= 0) {
          const updatedDocs = [...session.documents]
          updatedDocs[existingDocIndex] = document
          return { ...session, documents: updatedDocs }
        } else {
          return { ...session, documents: [...session.documents, document] }
        }
      }),
    })),

  // 세션의 차량 정보 업데이트
  updateSessionVehicleInfo: (sessionId, vehicleInfo) =>
    set((state) => ({
      activeSessions: state.activeSessions.map((session) =>
        session.sessionId === sessionId
          ? { ...session, vehicleInfo }
          : session
      ),
    })),

  // 문서의 OCR 결과 업데이트
  updateDocumentOcr: (sessionId, documentId, ocrResult) =>
    set((state) => ({
      activeSessions: state.activeSessions.map((session) => {
        if (session.sessionId !== sessionId) return session

        return {
          ...session,
          documents: session.documents.map((doc) =>
            doc.id === documentId
              ? {
                  ...doc,
                  type: ocrResult.documentType,
                  status: ocrResult.isValid ? 'valid' : 'needs_review',
                  ocrResult,
                }
              : doc
          ),
        }
      }),
    })),

  removeActiveSession: (sessionId) =>
    set((state) => ({
      activeSessions: state.activeSessions.filter(
        (session) => session.sessionId !== sessionId
      ),
    })),
}))
