import { useState, useEffect, useCallback, useRef } from 'react'
import Header from '../components/Header'
import { socketService } from '../services/socket'
import { predictPrice } from '../services/api'
import { useSessionStore } from '../store/sessionStore'
import { useAuthStore } from '../store/authStore'
import { DOCUMENT_TYPE_LABELS, DOCUMENT_STATUS_LABELS } from '../types'
import type { OCRResult, PricePrediction, UploadedDocument } from '../types'

export default function AgentDashboard() {
  const agent = useAuthStore((state) => state.agent)
  const {
    activeSessions,
    addOrUpdateSession,
    updateSessionDocuments,
    updateSessionVehicleInfo,
  } = useSessionStore()

  const [selectedSession, setSelectedSession] = useState<string | null>(null)
  const [selectedDocument, setSelectedDocument] = useState<string | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [additionalDocRequest, setAdditionalDocRequest] = useState('')
  const [pricePrediction, setPricePrediction] = useState<PricePrediction | null>(null)
  const [isPredicting, setIsPredicting] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [enlargedImage, setEnlargedImage] = useState<UploadedDocument | null>(null)
  const [showAllVehicleInfo, setShowAllVehicleInfo] = useState(false)
  const [vehicleInfoCollapsed, setVehicleInfoCollapsed] = useState(false)
  const [zoomLevel, setZoomLevel] = useState(1)

  // 소켓 연결 상태 추적 (무한 루프 방지)
  const isSocketSetup = useRef(false)

  // 줌 레벨 조절
  const handleZoomIn = useCallback(() => {
    setZoomLevel((prev) => Math.min(prev + 0.25, 3))
  }, [])

  const handleZoomOut = useCallback(() => {
    setZoomLevel((prev) => Math.max(prev - 0.25, 0.5))
  }, [])

  const handleZoomReset = useCallback(() => {
    setZoomLevel(1)
  }, [])

  // 이미지 변경 시 줌 리셋
  useEffect(() => {
    if (enlargedImage) {
      setZoomLevel(1)
    }
  }, [enlargedImage?.id])

  // 소켓 연결 및 이벤트 리스너 (한 번만 실행)
  useEffect(() => {
    // 이미 설정되었으면 스킵
    if (isSocketSetup.current) return
    isSocketSetup.current = true

    const setupSocket = async () => {
      try {
        await socketService.connect()
        setIsConnected(true)

        if (agent) {
          socketService.agentJoin(agent.id)
        }

        // 새 세션 또는 기존 세션 업데이트 (중복 방지)
        socketService.onNewSession((session) => {
          addOrUpdateSession(session)
        })

        // 서류 업로드
        socketService.onDocumentUploaded((sessionId, document) => {
          updateSessionDocuments(sessionId, document)
        })

        // 차량 정보 제출
        socketService.onVehicleInfoSubmitted((sessionId, vehicleInfo) => {
          updateSessionVehicleInfo(sessionId, vehicleInfo)
        })

        // OCR 완료
        socketService.onOcrCompleted((sessionId, documentId, ocrResult) => {
          useSessionStore.getState().updateDocumentOcr(sessionId, documentId, ocrResult)
        })

        // 세션 업데이트
        socketService.onSessionUpdated((session) => {
          addOrUpdateSession(session)
        })
      } catch (error) {
        console.error('Socket connection failed:', error)
        setIsConnected(false)
      }
    }

    setupSocket()

    return () => {
      socketService.disconnect()
      isSocketSetup.current = false
    }
  }, [agent])

  // 선택된 세션
  const currentSession = activeSessions.find((s) => s.sessionId === selectedSession)
  const currentDocument = currentSession?.documents.find((d) => d.id === selectedDocument)

  // 추가 서류 요청
  const handleRequestAdditionalDoc = useCallback(() => {
    if (!selectedSession || !additionalDocRequest.trim()) return

    socketService.requestAdditionalDocument(selectedSession, additionalDocRequest)
    setAdditionalDocRequest('')
    alert('추가 서류 요청이 전송되었습니다.')
  }, [selectedSession, additionalDocRequest])

  // 가격 예측 실행
  const handlePredictPrice = useCallback(async () => {
    if (!currentSession?.vehicleInfo) return

    setIsPredicting(true)
    try {
      const prediction = await predictPrice(currentSession.vehicleInfo)
      setPricePrediction(prediction)
    } catch (error) {
      console.error('Price prediction failed:', error)
      alert('가격 예측에 실패했습니다.')
    }
    setIsPredicting(false)
  }, [currentSession?.vehicleInfo])

  // 가격 보고서 전송
  const handleSendPriceReport = useCallback(() => {
    if (!selectedSession) return
    socketService.sendPriceReport(selectedSession)
    alert('가격 보고서가 고객에게 전송되었습니다.')
  }, [selectedSession])

  // OCR 결과 수정
  const handleUpdateOcrField = useCallback(
    (field: string, value: string) => {
      if (!selectedSession || !selectedDocument || !currentDocument?.ocrResult) return

      const updatedOcrResult: OCRResult = {
        ...currentDocument.ocrResult,
        extractedData: {
          ...currentDocument.ocrResult.extractedData,
          [field]: value,
        },
      }

      socketService.updateOcrResult(selectedSession, selectedDocument, updatedOcrResult)
    },
    [selectedSession, selectedDocument, currentDocument]
  )

  return (
    <div className="min-h-screen bg-gray-100">
      <Header />

      <div className="flex h-[calc(100vh-64px)]">
        {/* 사이드바 - 세션 목록 */}
        <aside className={`bg-white border-r border-gray-200 flex flex-col transition-all duration-300 ${sidebarCollapsed ? 'w-16' : 'w-80'}`}>
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between mb-3">
              {!sidebarCollapsed && <h2 className="font-semibold text-gray-900">상담 목록</h2>}
              <div className="flex items-center space-x-2">
                <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
                <button
                  onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                  className="p-1 hover:bg-gray-100 rounded transition-colors"
                  title={sidebarCollapsed ? '사이드바 펼치기' : '사이드바 접기'}
                >
                  <svg className={`w-5 h-5 text-gray-600 transition-transform ${sidebarCollapsed ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                  </svg>
                </button>
              </div>
            </div>
            {!sidebarCollapsed && (
              <p className="text-sm text-gray-600">
                {activeSessions.length}건의 상담이 진행중입니다.
              </p>
            )}
          </div>

          <div className="flex-1 overflow-y-auto">
            {activeSessions.length === 0 ? (
              <div className={`text-center text-gray-500 ${sidebarCollapsed ? 'p-2' : 'p-8'}`}>
                {!sidebarCollapsed && (
                  <>
                    <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                    </svg>
                    <p className="text-sm">대기 중인 상담이 없습니다.</p>
                  </>
                )}
              </div>
            ) : (
              <ul>
                {activeSessions.map((session) => (
                  <li key={session.sessionId}>
                    <button
                      onClick={() => {
                        setSelectedSession(session.sessionId)
                        setSelectedDocument(null)
                        setPricePrediction(null)
                      }}
                      className={`w-full p-4 text-left border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                        selectedSession === session.sessionId ? 'bg-blue-50 border-l-4 border-l-primary' : ''
                      }`}
                      title={sidebarCollapsed ? `${session.phoneNumber} - 서류 ${session.documents.length}건` : undefined}
                    >
                      {sidebarCollapsed ? (
                        <div className="flex items-center justify-center">
                          <div className="relative">
                            <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            {session.documents.length > 0 && (
                              <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary text-white text-xs rounded-full flex items-center justify-center">
                                {session.documents.length}
                              </span>
                            )}
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium text-gray-900">
                              {session.phoneNumber}
                            </span>
                            <span className="text-xs text-gray-500">
                              {new Date(session.createdAt).toLocaleTimeString('ko-KR', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2 text-xs text-gray-600">
                            <span>서류 {session.documents.length}건</span>
                            {session.vehicleInfo && (
                              <>
                                <span>•</span>
                                <span>차량정보 입력됨</span>
                              </>
                            )}
                          </div>
                        </>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>

        {/* 메인 컨텐츠 */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {!selectedSession ? (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <p>왼쪽에서 상담을 선택해주세요.</p>
              </div>
            </div>
          ) : (
            <>
              {/* 상단 - 세션 정보 */}
              <div className="bg-white border-b border-gray-200 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">
                      {currentSession?.phoneNumber}
                    </h2>
                    <p className="text-sm text-gray-600">
                      세션 ID: {selectedSession}
                    </p>
                  </div>
                  <div className="flex items-center space-x-3">
                    {/* 추가 서류 요청 */}
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={additionalDocRequest}
                        onChange={(e) => setAdditionalDocRequest(e.target.value)}
                        placeholder="추가 서류 요청 메시지"
                        className="input-field text-sm py-2"
                      />
                      <button
                        onClick={handleRequestAdditionalDoc}
                        disabled={!additionalDocRequest.trim()}
                        className="btn-secondary py-2 text-sm whitespace-nowrap"
                      >
                        서류 요청
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* 하단 - 2분할 */}
              <div className="flex-1 flex overflow-hidden">
                {/* 좌측 - 서류 목록 */}
                <div className="w-1/2 border-r border-gray-200 flex flex-col bg-white">
                  <div className="p-4 border-b border-gray-200">
                    <h3 className="font-semibold text-gray-900">
                      제출 서류 ({currentSession?.documents.length || 0}건)
                    </h3>
                  </div>

                  <div className="flex-1 overflow-y-auto p-4 relative">
                    {/* 확대 이미지 뷰 (영역 내 표시) */}
                    {enlargedImage ? (
                      <div className="absolute inset-0 z-10 bg-gray-900 flex flex-col">
                        {/* 확대 뷰 헤더 */}
                        <div className="flex items-center justify-between p-3 bg-gray-800">
                          <div className="text-white text-sm">
                            <span className="font-medium">{enlargedImage.fileName}</span>
                            {enlargedImage.type && (
                              <span className="ml-2 px-2 py-0.5 bg-primary text-xs rounded">
                                {DOCUMENT_TYPE_LABELS[enlargedImage.type]}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            {/* 줌 컨트롤 */}
                            <div className="flex items-center gap-1 bg-gray-700 rounded-lg px-2 py-1">
                              <button
                                onClick={handleZoomOut}
                                disabled={zoomLevel <= 0.5}
                                className="text-white hover:text-gray-300 disabled:text-gray-500 p-1"
                                title="축소"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" />
                                </svg>
                              </button>
                              <button
                                onClick={handleZoomReset}
                                className="text-white hover:text-gray-300 text-xs min-w-[50px] text-center"
                                title="원본 크기"
                              >
                                {Math.round(zoomLevel * 100)}%
                              </button>
                              <button
                                onClick={handleZoomIn}
                                disabled={zoomLevel >= 3}
                                className="text-white hover:text-gray-300 disabled:text-gray-500 p-1"
                                title="확대"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                                </svg>
                              </button>
                            </div>
                            <button
                              onClick={() => setEnlargedImage(null)}
                              className="text-white hover:text-gray-300 p-1"
                              title="닫기"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        </div>
                        {/* 확대 이미지 */}
                        <div
                          className="flex-1 overflow-auto p-2"
                          onWheel={(e) => {
                            if (e.ctrlKey || e.metaKey) {
                              e.preventDefault()
                              if (e.deltaY < 0) handleZoomIn()
                              else handleZoomOut()
                            }
                          }}
                        >
                          <div
                            className="min-h-full flex items-center justify-center"
                            style={{ minWidth: zoomLevel > 1 ? `${zoomLevel * 100}%` : '100%' }}
                          >
                            <img
                              src={enlargedImage.fileUrl}
                              alt={enlargedImage.fileName}
                              className="object-contain transition-transform duration-150"
                              style={{
                                transform: `scale(${zoomLevel})`,
                                transformOrigin: 'center center',
                                maxWidth: zoomLevel <= 1 ? '100%' : 'none',
                                maxHeight: zoomLevel <= 1 ? '100%' : 'none',
                              }}
                              draggable={false}
                            />
                          </div>
                        </div>
                        {/* 하단: 서류 썸네일 + 줌 안내 */}
                        <div className="flex items-center justify-between p-2 bg-gray-800">
                          <span className="text-gray-400 text-xs">Ctrl + 스크롤로 확대/축소</span>
                          <div className="flex items-center gap-2">
                            {currentSession?.documents.map((doc, idx) => (
                              <button
                                key={doc.id}
                                onClick={() => {
                                  setEnlargedImage(doc)
                                  setSelectedDocument(doc.id)
                                }}
                                className={`w-12 h-16 rounded border-2 overflow-hidden transition-all ${
                                  enlargedImage.id === doc.id
                                    ? 'border-primary'
                                    : 'border-gray-600 hover:border-gray-400'
                                }`}
                              >
                                <img
                                  src={doc.fileUrl}
                                  alt={`서류 ${idx + 1}`}
                                  className="w-full h-full object-cover"
                                />
                              </button>
                            ))}
                          </div>
                          <span className="text-gray-400 text-xs w-[140px]"></span>
                        </div>
                      </div>
                    ) : currentSession?.documents.length === 0 ? (
                      <p className="text-center text-gray-500 py-8">
                        제출된 서류가 없습니다.
                      </p>
                    ) : (
                      <div className="grid grid-cols-2 gap-4">
                        {currentSession?.documents.map((doc) => (
                          <div
                            key={doc.id}
                            className={`relative aspect-[3/4] rounded-lg overflow-hidden border-2 transition-all group ${
                              selectedDocument === doc.id
                                ? 'border-primary ring-2 ring-primary/20'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <button
                              onClick={() => setSelectedDocument(doc.id)}
                              className="w-full h-full"
                            >
                              <img
                                src={doc.fileUrl}
                                alt={doc.fileName}
                                className="w-full h-full object-cover"
                              />
                            </button>
                            {/* 확대 버튼 */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                setEnlargedImage(doc)
                                setSelectedDocument(doc.id)
                              }}
                              className="absolute top-2 right-2 w-8 h-8 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center hover:bg-black/70"
                              title="이미지 확대"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                              </svg>
                            </button>
                            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                              <p className="text-white text-xs truncate">
                                {doc.type ? DOCUMENT_TYPE_LABELS[doc.type] : '분류 중...'}
                              </p>
                              <span
                                className={`inline-block mt-1 px-2 py-0.5 text-xs rounded ${
                                  doc.status === 'valid'
                                    ? 'bg-green-500 text-white'
                                    : doc.status === 'invalid' || doc.status === 'expired'
                                    ? 'bg-red-500 text-white'
                                    : doc.status === 'processing'
                                    ? 'bg-yellow-500 text-white'
                                    : 'bg-gray-500 text-white'
                                }`}
                              >
                                {DOCUMENT_STATUS_LABELS[doc.status]}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* 차량 정보 & 가격 예측 - 토글 가능 */}
                  {currentSession?.vehicleInfo && (
                    <div className="border-t border-gray-200">
                      {/* 토글 헤더 */}
                      <button
                        onClick={() => setVehicleInfoCollapsed(!vehicleInfoCollapsed)}
                        className="w-full px-4 py-2 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-center space-x-2">
                          <svg
                            className={`w-4 h-4 text-gray-600 transition-transform ${vehicleInfoCollapsed ? '' : 'rotate-90'}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                          <span className="font-semibold text-gray-900 text-sm">차량 정보 & 가격 예측</span>
                          {pricePrediction && (
                            <span className="px-2 py-0.5 bg-primary text-white text-xs rounded">
                              {pricePrediction.priceRange.min.toLocaleString()}~{pricePrediction.predictedPrice.toLocaleString()}원
                            </span>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          {!vehicleInfoCollapsed && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handlePredictPrice()
                              }}
                              disabled={isPredicting}
                              className="btn-primary py-1 px-3 text-xs"
                            >
                              {isPredicting ? '계산 중...' : '가격 예측'}
                            </button>
                          )}
                        </div>
                      </button>

                      {/* 접히는 내용 */}
                      {!vehicleInfoCollapsed && (
                        <div className="p-4 space-y-3">
                          {/* 차량 정보 */}
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs text-gray-500">차량 정보</span>
                              <button
                                onClick={() => setShowAllVehicleInfo(!showAllVehicleInfo)}
                                className="text-xs text-primary hover:underline"
                              >
                                {showAllVehicleInfo ? '간략히' : '전체보기'}
                              </button>
                            </div>
                            <div className={`grid grid-cols-2 gap-1 text-xs ${showAllVehicleInfo ? 'max-h-40 overflow-y-auto pr-2' : ''}`}>
                              <div className="flex justify-between py-1 px-2 bg-gray-50 rounded">
                                <span className="text-gray-600">브랜드</span>
                                <span className="font-medium">{currentSession.vehicleInfo.modelName}</span>
                              </div>
                              <div className="flex justify-between py-1 px-2 bg-gray-50 rounded">
                                <span className="text-gray-600">주행거리</span>
                                <span className="font-medium">{currentSession.vehicleInfo.distance.toLocaleString()}km</span>
                              </div>
                              <div className="flex justify-between py-1 px-2 bg-gray-50 rounded">
                                <span className="text-gray-600">연식</span>
                                <span className="font-medium">{Math.floor(currentSession.vehicleInfo.ageMonths / 12)}년</span>
                              </div>
                              <div className="flex justify-between py-1 px-2 bg-gray-50 rounded">
                                <span className="text-gray-600">연료</span>
                                <span className="font-medium">{currentSession.vehicleInfo.fuel}</span>
                              </div>
                              {showAllVehicleInfo && (
                                <>
                                  <div className="flex justify-between py-1 px-2 bg-gray-50 rounded">
                                    <span className="text-gray-600">배기량</span>
                                    <span className="font-medium">{currentSession.vehicleInfo.displacement.toLocaleString()}cc</span>
                                  </div>
                                  <div className="flex justify-between py-1 px-2 bg-gray-50 rounded">
                                    <span className="text-gray-600">색상</span>
                                    <span className="font-medium">{currentSession.vehicleInfo.color === 'white' ? '흰색' : currentSession.vehicleInfo.color === 'black' ? '검정' : currentSession.vehicleInfo.color === 'gray' ? '회색' : '기타'}</span>
                                  </div>
                                  <div className="flex justify-between py-1 px-2 bg-gray-50 rounded col-span-2">
                                    <span className="text-gray-600">신차가</span>
                                    <span className="font-medium">{currentSession.vehicleInfo.newPrice.toLocaleString()}원</span>
                                  </div>
                                  <div className="flex justify-between py-1 px-2 bg-gray-50 rounded">
                                    <span className="text-gray-600">소유자변경</span>
                                    <span className="font-medium">{currentSession.vehicleInfo.ownerChange === '0' ? '없음' : `${currentSession.vehicleInfo.ownerChange}회`}</span>
                                  </div>
                                  <div className="flex justify-between py-1 px-2 bg-gray-50 rounded">
                                    <span className="text-gray-600">주요결함</span>
                                    <span className="font-medium">{currentSession.vehicleInfo.majorDefect}</span>
                                  </div>
                                  <div className="col-span-2 pt-1">
                                    <div className="flex flex-wrap gap-1">
                                      {currentSession.vehicleInfo.sunroof && <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 text-xs rounded">선루프</span>}
                                      {currentSession.vehicleInfo.panoramaSunroof && <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 text-xs rounded">파노라마</span>}
                                      {currentSession.vehicleInfo.frontSeatHeater && <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 text-xs rounded">앞열선</span>}
                                      {currentSession.vehicleInfo.rearSeatHeater && <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 text-xs rounded">뒷열선</span>}
                                      {currentSession.vehicleInfo.rearSensor && <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 text-xs rounded">후방센서</span>}
                                      {currentSession.vehicleInfo.rearCamera && <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 text-xs rounded">후방카메라</span>}
                                      {currentSession.vehicleInfo.aroundView && <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 text-xs rounded">어라운드뷰</span>}
                                      {currentSession.vehicleInfo.navigation && <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 text-xs rounded">네비게이션</span>}
                                    </div>
                                  </div>
                                </>
                              )}
                            </div>
                          </div>

                          {/* 가격 예측 결과 */}
                          {pricePrediction && (
                            <div className="p-3 bg-blue-50 rounded-lg">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-xs text-gray-600">예상 매입가 범위</p>
                                  <p className="text-lg font-bold text-primary">
                                    {pricePrediction.priceRange.min.toLocaleString()} ~ {pricePrediction.predictedPrice.toLocaleString()}원
                                  </p>
                                </div>
                                <button
                                  onClick={handleSendPriceReport}
                                  className="btn-accent py-1.5 px-3 text-xs"
                                >
                                  보고서 전송
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* 우측 - OCR 결과 */}
                <div className="w-1/2 bg-gray-50 flex flex-col">
                  {!currentDocument ? (
                    <div className="flex-1 flex items-center justify-center text-gray-500">
                      <p>서류를 선택하면 OCR 결과를 확인할 수 있습니다.</p>
                    </div>
                  ) : (
                    <>
                      <div className="p-4 bg-white border-b border-gray-200">
                        <h3 className="font-semibold text-gray-900">OCR 결과</h3>
                        <p className="text-sm text-gray-600">
                          {currentDocument.type
                            ? DOCUMENT_TYPE_LABELS[currentDocument.type]
                            : '서류 분류 중...'}
                        </p>
                      </div>

                      <div className="flex-1 overflow-y-auto p-4">
                        {!currentDocument.ocrResult ? (
                          <div className="flex items-center justify-center h-full">
                            <div className="text-center">
                              <svg className="animate-spin w-8 h-8 mx-auto mb-4 text-primary" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                              </svg>
                              <p className="text-gray-600">OCR 처리 중...</p>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {/* 검증 상태 */}
                            <div
                              className={`p-4 rounded-lg ${
                                currentDocument.ocrResult.isValid
                                  ? 'bg-green-50 border border-green-200'
                                  : 'bg-red-50 border border-red-200'
                              }`}
                            >
                              <div className="flex items-center space-x-2">
                                {currentDocument.ocrResult.isValid ? (
                                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                ) : (
                                  <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                )}
                                <span
                                  className={`font-medium ${
                                    currentDocument.ocrResult.isValid ? 'text-green-800' : 'text-red-800'
                                  }`}
                                >
                                  {currentDocument.ocrResult.isValid ? '검증 통과' : '검증 실패'}
                                </span>
                              </div>

                              {currentDocument.ocrResult.validationErrors.length > 0 && (
                                <ul className="mt-2 space-y-1">
                                  {currentDocument.ocrResult.validationErrors.map((error, index) => (
                                    <li key={index} className="text-sm text-red-700">
                                      • {error.field}: {error.message}
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </div>

                            {/* 신뢰도 */}
                            <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                              <span className="text-sm text-gray-600">OCR 신뢰도</span>
                              <span className="font-medium">
                                {(currentDocument.ocrResult.confidence * 100).toFixed(1)}%
                              </span>
                            </div>

                            {/* 추출된 데이터 (수정 가능) */}
                            <div className="bg-white rounded-lg p-4">
                              <h4 className="font-medium text-gray-900 mb-4">추출된 정보</h4>
                              <div className="space-y-3">
                                {Object.entries(currentDocument.ocrResult.extractedData).map(
                                  ([key, value]) => (
                                    <div key={key}>
                                      <label className="block text-xs text-gray-500 mb-1">
                                        {key}
                                      </label>
                                      <input
                                        type="text"
                                        value={value}
                                        onChange={(e) => handleUpdateOcrField(key, e.target.value)}
                                        className="input-field text-sm py-2"
                                      />
                                    </div>
                                  )
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  )
}
