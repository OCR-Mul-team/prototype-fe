import { useRef, useState } from 'react'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import type { PricePrediction, VehicleInfo } from '../types'

interface PriceReportModalProps {
  isOpen: boolean
  onClose: () => void
  prediction: PricePrediction
  vehicleInfo?: VehicleInfo
}

export default function PriceReportModal({
  isOpen,
  onClose,
  prediction,
  vehicleInfo,
}: PriceReportModalProps) {
  const reportRef = useRef<HTMLDivElement>(null)
  const [isSaving, setIsSaving] = useState(false)

  if (!isOpen) return null

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ko-KR').format(price)
  }

  // 예측값을 최고가로, 범위 조정
  const maxPrice = prediction.predictedPrice
  const minPrice = prediction.priceRange.min

  const handleSavePdf = async () => {
    if (!reportRef.current) return

    setIsSaving(true)
    try {
      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
      })

      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      })

      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = pdf.internal.pageSize.getHeight()
      const imgWidth = canvas.width
      const imgHeight = canvas.height
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight)
      const imgX = (pdfWidth - imgWidth * ratio) / 2
      const imgY = 0

      pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio)
      pdf.save(`가격예측보고서_${new Date().toISOString().slice(0, 10)}.pdf`)
    } catch (error) {
      console.error('PDF 저장 실패:', error)
      alert('PDF 저장에 실패했습니다.')
    }
    setIsSaving(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 배경 오버레이 */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* 모달 */}
      <div className="relative bg-white rounded-xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* 닫기 버튼 */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 z-10"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div ref={reportRef} className="bg-white">
          {/* 헤더 */}
          <div className="bg-primary text-white p-8 text-center">
            <h2 className="text-2xl font-bold mb-2">중고차 가격 예측 보고서</h2>
            <p className="text-blue-200 text-sm">
              현대 인증중고차 | {new Date().toLocaleDateString('ko-KR')}
            </p>
          </div>

          {/* 내용 */}
          <div className="p-8">
            {/* API 오류 안내 */}
            {prediction.factors.some(f => f.name === '간이 추정가') && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <div className="flex items-start space-x-3">
                  <svg className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-yellow-800">AI 예측 서비스 연결 오류</p>
                    <p className="text-xs text-yellow-700 mt-1">
                      AI 가격 예측 서비스에 연결할 수 없어 간이 계산식으로 추정한 가격입니다.
                      정확한 가격은 상담원에게 문의해주세요.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* 예상 가격 범위 */}
            <div className="bg-gray-50 rounded-xl p-6 text-center mb-8">
              <p className="text-sm text-gray-600 mb-4">예상 매입가 범위</p>
              <div className="flex items-center justify-center space-x-4">
                <div>
                  <p className="text-xs text-gray-500 mb-1">최저가</p>
                  <p className="text-2xl font-bold text-gray-700">
                    {formatPrice(minPrice)}원
                  </p>
                </div>
                <div className="text-gray-400 text-2xl">~</div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">최고가</p>
                  <p className="text-3xl font-bold text-primary">
                    {formatPrice(maxPrice)}원
                  </p>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-4">
                * 차량 상태에 따라 위 범위 내에서 매입가가 결정됩니다.
              </p>
            </div>

            {/* 가격 산정 근거 */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b-2 border-primary">
                가격 산정 근거
              </h3>
              <div className="space-y-3">
                {prediction.factors.map((factor, index) => (
                  <div
                    key={index}
                    className="flex items-start p-4 bg-gray-50 rounded-lg"
                  >
                    <div
                      className={`
                        w-8 h-8 rounded-full flex items-center justify-center mr-4 flex-shrink-0
                        ${factor.impact === 'positive' ? 'bg-green-100 text-green-600' : ''}
                        ${factor.impact === 'negative' ? 'bg-red-100 text-red-600' : ''}
                        ${factor.impact === 'neutral' ? 'bg-gray-200 text-gray-600' : ''}
                      `}
                    >
                      {factor.impact === 'positive' && '↑'}
                      {factor.impact === 'negative' && '↓'}
                      {factor.impact === 'neutral' && '−'}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{factor.name}</p>
                      <p className="text-sm text-gray-600 mt-1">{factor.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 차량 정보 요약 */}
            {vehicleInfo && (
              <div className="mt-8 pt-6 border-t">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">입력된 차량 정보</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-600">브랜드</span>
                    <span className="font-medium">{vehicleInfo.modelName === 'Hyundai' ? '현대' : '제네시스'}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-600">연식</span>
                    <span className="font-medium">{Math.floor(vehicleInfo.ageMonths / 12)}년 {vehicleInfo.ageMonths % 12}개월</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-600">주행거리</span>
                    <span className="font-medium">{formatPrice(vehicleInfo.distance)}km</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-600">연료</span>
                    <span className="font-medium">
                      {vehicleInfo.fuel === 'gasoline' && '가솔린'}
                      {vehicleInfo.fuel === 'diesel' && '디젤'}
                      {vehicleInfo.fuel === 'hybrid' && '하이브리드'}
                      {vehicleInfo.fuel === 'electric' && '전기'}
                      {vehicleInfo.fuel === 'lpg' && 'LPG'}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 푸터 */}
          <div className="bg-gray-50 p-6 text-center">
            <p className="text-xs text-gray-500">
              본 보고서는 입력된 정보를 바탕으로 산출된 예상 가격이며,<br />
              실제 매입가는 방문 점검 후 변동될 수 있습니다.
            </p>
          </div>
        </div>

        {/* 저장 버튼 */}
        <div className="p-6 border-t flex justify-end space-x-3">
          <button onClick={onClose} className="btn-secondary">
            닫기
          </button>
          <button
            onClick={handleSavePdf}
            disabled={isSaving}
            className="btn-primary flex items-center space-x-2"
          >
            {isSaving ? (
              <>
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <span>저장 중...</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>PDF 저장</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
