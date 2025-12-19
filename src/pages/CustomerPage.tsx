import { useState, useEffect, useCallback } from 'react'
import Header from '../components/Header'
import DocumentUploader from '../components/DocumentUploader'
import VehicleInfoForm from '../components/VehicleInfoForm'
import PriceReportModal from '../components/PriceReportModal'
import ImageViewerModal from '../components/ImageViewerModal'
import { socketService } from '../services/socket'
import { fileToBase64 } from '../services/api'
import { useSessionStore } from '../store/sessionStore'
import type { UploadedDocument, VehicleInfo, OCRResult } from '../types'

export default function CustomerPage() {
  const [phoneNumber, setPhoneNumber] = useState('')
  const [customerName, setCustomerName] = useState('')
  const [isJoined, setIsJoined] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [showPriceReport, setShowPriceReport] = useState(false)
  const [activeTab, setActiveTab] = useState<'documents' | 'vehicle'>('documents')
  const [vehicleInfoSubmitted, setVehicleInfoSubmitted] = useState(false)
  const [selectedImage, setSelectedImage] = useState<UploadedDocument | null>(null)
  const [showAgentContact, setShowAgentContact] = useState(false)

  // 상담원 연결 번호 (실제 서비스에서는 환경변수나 서버에서 가져옴)
  const AGENT_PHONE_NUMBER = '1588-1234'

  const {
    currentSession,
    setCurrentSession,
    addDocument,
    removeDocument,
    additionalDocumentRequest,
    setAdditionalDocumentRequest,
    priceReport,
    setPriceReport,
    isConnected,
    setConnected,
    updateCustomerDocumentOcr,
  } = useSessionStore()

  // 소켓 연결 및 이벤트 리스너 설정
  useEffect(() => {
    const setupSocket = async () => {
      try {
        await socketService.connect()
        setConnected(true)

        // 세션 생성 이벤트
        socketService.onSessionCreated((session) => {
          setCurrentSession(session)
          setIsJoined(true)
          setIsLoading(false)
        })

        // 추가 서류 요청 이벤트
        socketService.onAdditionalDocumentRequest((message) => {
          setAdditionalDocumentRequest(message)
        })

        // 가격 보고서 수신 이벤트
        socketService.onPriceReport((prediction) => {
          setPriceReport(prediction)
          setShowPriceReport(true)
        })

        // OCR 완료 이벤트 (상담원 연결 버튼 표시용)
        socketService.onCustomerOcrCompleted((documentId, ocrResult) => {
          console.log('[Customer] OCR completed for document:', documentId)
          updateCustomerDocumentOcr(documentId, ocrResult)
        })
      } catch (error) {
        console.error('Socket connection failed:', error)
        setConnected(false)
      }
    }

    setupSocket()

    return () => {
      socketService.disconnect()
      setConnected(false)
    }
  }, [setCurrentSession, setAdditionalDocumentRequest, setPriceReport, setConnected, updateCustomerDocumentOcr])

  // 전화번호와 이름으로 세션 시작
  const handleJoin = useCallback(() => {
    if (!customerName.trim()) {
      alert('이름을 입력해주세요.')
      return
    }

    if (!phoneNumber.trim()) {
      alert('전화번호를 입력해주세요.')
      return
    }

    // 전화번호 형식 검증 (간단한 검증)
    const phoneRegex = /^01[0-9]-?[0-9]{3,4}-?[0-9]{4}$/
    if (!phoneRegex.test(phoneNumber.replace(/-/g, ''))) {
      alert('올바른 전화번호 형식을 입력해주세요.')
      return
    }

    setIsLoading(true)
    socketService.customerJoin(phoneNumber, customerName)
  }, [phoneNumber, customerName])

  // 서류 업로드 처리
  const handleUpload = useCallback(
    async (files: File[]) => {
      for (const file of files) {
        const fileUrl = await fileToBase64(file)
        const document: UploadedDocument = {
          id: `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          type: null,
          fileName: file.name,
          fileUrl,
          uploadedAt: new Date(),
          status: 'pending',
        }

        // 로컬 상태 업데이트
        addDocument(document)

        // 서버로 전송
        socketService.uploadDocument(document)
      }
    },
    [addDocument]
  )

  // 서류 삭제 처리
  const handleDeleteDocument = useCallback(
    (documentId: string) => {
      removeDocument(documentId)
      setSelectedImage(null)
    },
    [removeDocument]
  )

  // 차량 정보 제출
  const handleVehicleInfoSubmit = useCallback((vehicleInfo: VehicleInfo) => {
    setIsLoading(true)
    socketService.submitVehicleInfo(vehicleInfo)
    setTimeout(() => {
      setIsLoading(false)
      setVehicleInfoSubmitted(true)
    }, 1000)
  }, [])

  // 세션 참가 전 화면
  if (!isJoined) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="max-w-xl mx-auto px-4 py-16">
          <div className="card text-center">
            <div className="mb-8">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">내차팔기</h1>
              <p className="text-gray-600">
                이름과 전화번호를 입력하여 상담을 시작해주세요.<br />
                서류 제출과 차량 정보 입력을 진행할 수 있습니다.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 text-left">
                  이름
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="홍길동"
                  className="input-field text-center text-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 text-left">
                  전화번호
                </label>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="010-1234-5678"
                  className="input-field text-center text-lg"
                  onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
                />
              </div>

              <button
                onClick={handleJoin}
                disabled={isLoading || !isConnected}
                className="btn-primary w-full"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    연결 중...
                  </span>
                ) : (
                  '상담 시작하기'
                )}
              </button>

              {!isConnected && (
                <p className="text-sm text-red-500">
                  서버에 연결할 수 없습니다. 잠시 후 다시 시도해주세요.
                </p>
              )}
            </div>
          </div>
        </main>
      </div>
    )
  }

  // 세션 참가 후 화면
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* 상태 표시 */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">내차팔기</h1>
            <p className="text-gray-600 text-sm mt-1">
              세션: {currentSession?.sessionId.slice(0, 8)}... | {phoneNumber}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-sm text-gray-600">
              {isConnected ? '상담원 연결됨' : '연결 끊김'}
            </span>
          </div>
        </div>

        {/* 상태 알림 영역 - 통합 */}
        <div className="mb-6 space-y-3">
          {/* 상담원 확인 중 메시지 + 연결 버튼 */}
          {currentSession && currentSession.documents.length > 0 && (() => {
            // OCR 완료된 서류 수 확인
            const ocrCompletedDocs = currentSession.documents.filter(doc => doc.ocrResult)
            const allOcrCompleted = ocrCompletedDocs.length > 0 && ocrCompletedDocs.length === currentSession.documents.length

            return (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {allOcrCompleted ? (
                    <svg className="w-6 h-6 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="animate-pulse w-6 h-6 text-blue-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                  <p className="text-sm text-blue-700">
                    {allOcrCompleted
                      ? '서류 확인이 완료되었습니다. 상담원과 통화하시려면 연결 버튼을 눌러주세요.'
                      : '상담원이 서류를 확인하고 있습니다. 잠시만 기다려주세요.'
                    }
                  </p>
                </div>
                {allOcrCompleted && (
                  <button
                    onClick={() => setShowAgentContact(true)}
                    className="btn-primary py-2 px-4 text-sm flex items-center space-x-2 whitespace-nowrap ml-4"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    <span>상담원 연결</span>
                  </button>
                )}
              </div>
            )
          })()}

          {/* 추가 서류 요청 알림 */}
          {additionalDocumentRequest && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start space-x-3">
              <svg className="w-6 h-6 text-yellow-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div className="flex-1">
                <h4 className="font-medium text-yellow-800">추가 서류 요청</h4>
                <p className="text-sm text-yellow-700 mt-1">{additionalDocumentRequest}</p>
              </div>
              <button
                onClick={() => setAdditionalDocumentRequest(null)}
                className="text-yellow-600 hover:text-yellow-800"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}

          {/* 차량 정보 제출 완료 메시지 */}
          {vehicleInfoSubmitted && !priceReport && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center space-x-3">
              <svg className="w-6 h-6 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <div>
                <h4 className="font-medium text-green-800">차량 정보 제출 완료</h4>
                <p className="text-sm text-green-700">상담원이 가격 예측을 진행하고 있습니다. 잠시만 기다려주세요.</p>
              </div>
            </div>
          )}
        </div>

        {/* 탭 네비게이션 */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('documents')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'documents'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              서류 제출
            </button>
            <button
              onClick={() => setActiveTab('vehicle')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'vehicle'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              차량 정보 입력
            </button>
          </nav>
        </div>

        {/* 컨텐츠 */}
        <div className="card">
          {activeTab === 'documents' ? (
            <div>
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-2">서류 업로드</h2>
                <p className="text-sm text-gray-600">
                  필요한 서류를 업로드해주세요. 상담원이 확인 후 안내드리겠습니다.
                </p>
              </div>

              <DocumentUploader
                onUpload={handleUpload}
                documents={currentSession?.documents || []}
                onImageClick={setSelectedImage}
                onDelete={handleDeleteDocument}
              />
            </div>
          ) : (
            <div>
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-2">차량 정보 입력</h2>
                <p className="text-sm text-gray-600">
                  차량 정보를 입력하시면 예상 매입가를 확인하실 수 있습니다.
                </p>
              </div>

              <VehicleInfoForm
                onSubmit={handleVehicleInfoSubmit}
                isLoading={isLoading}
                disabled={vehicleInfoSubmitted}
                ocrResults={currentSession?.documents
                  .filter((doc): doc is UploadedDocument & { ocrResult: OCRResult } => !!doc.ocrResult)
                  .map((doc) => doc.ocrResult) || []
                }
              />
            </div>
          )}
        </div>
      </main>

      {/* 이미지 확대 모달 */}
      {selectedImage && (
        <ImageViewerModal
          image={selectedImage}
          onClose={() => setSelectedImage(null)}
          onDelete={() => handleDeleteDocument(selectedImage.id)}
        />
      )}

      {/* 가격 보고서 모달 */}
      {priceReport && (
        <PriceReportModal
          isOpen={showPriceReport}
          onClose={() => setShowPriceReport(false)}
          prediction={priceReport}
          vehicleInfo={currentSession?.vehicleInfo}
        />
      )}

      {/* 가격 보고서 알림 버튼 (닫은 경우 다시 볼 수 있도록) */}
      {priceReport && !showPriceReport && (
        <button
          onClick={() => setShowPriceReport(true)}
          className="fixed bottom-6 right-6 bg-primary text-white px-6 py-3 rounded-full shadow-lg hover:bg-primary-dark transition-colors flex items-center space-x-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span>가격 보고서 보기</span>
        </button>
      )}

      {/* 상담원 연결 모달 */}
      {showAgentContact && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full mx-4 p-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">상담원 연결</h3>
              <p className="text-gray-600 mb-6">
                아래 번호로 전화하시면 상담원과 바로 연결됩니다.
              </p>

              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <p className="text-2xl font-bold text-primary">{AGENT_PHONE_NUMBER}</p>
                <p className="text-sm text-gray-500 mt-1">평일 09:00 - 18:00</p>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => setShowAgentContact(false)}
                  className="flex-1 py-3 px-4 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                >
                  닫기
                </button>
                <a
                  href={`tel:${AGENT_PHONE_NUMBER.replace(/-/g, '')}`}
                  className="flex-1 py-3 px-4 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark transition-colors flex items-center justify-center space-x-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <span>전화하기</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
