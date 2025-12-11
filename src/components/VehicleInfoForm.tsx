import { useState } from 'react'
import type { VehicleInfo } from '../types'

interface VehicleInfoFormProps {
  onSubmit: (vehicleInfo: VehicleInfo) => void
  isLoading?: boolean
  disabled?: boolean
}

const INITIAL_VEHICLE_INFO: VehicleInfo = {
  modelName: 'Hyundai',
  ageMonths: 36,
  distance: 50000,
  displacement: 2000,
  fuel: 'gasoline',
  color: 'white',
  newPrice: 30000000,
  sunroof: false,
  panoramaSunroof: false,
  frontSeatHeater: false,
  rearSeatHeater: false,
  rearSensor: false,
  rearCamera: false,
  aroundView: false,
  navigation: false,
  ownerChange: '0',
  majorDefect: 'low(0-2)',
  minorDefect: 'low(0-5)',
}

export default function VehicleInfoForm({ onSubmit, isLoading, disabled }: VehicleInfoFormProps) {
  const [vehicleInfo, setVehicleInfo] = useState<VehicleInfo>(INITIAL_VEHICLE_INFO)

  const handleChange = (field: keyof VehicleInfo, value: VehicleInfo[keyof VehicleInfo]) => {
    setVehicleInfo((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(vehicleInfo)
  }

  return (
    <form onSubmit={handleSubmit} className={`space-y-8 ${disabled ? 'opacity-60 pointer-events-none' : ''}`}>
      {/* 기본 정보 */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b">기본 정보</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 브랜드 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              브랜드
            </label>
            <select
              value={vehicleInfo.modelName}
              onChange={(e) => handleChange('modelName', e.target.value as VehicleInfo['modelName'])}
              className="input-field"
            >
              <option value="Hyundai">현대</option>
              <option value="Genesis">제네시스</option>
            </select>
          </div>

          {/* 차량 연식 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              차량 연식 (개월)
            </label>
            <input
              type="number"
              min="1"
              max="240"
              value={vehicleInfo.ageMonths}
              onChange={(e) => handleChange('ageMonths', Number(e.target.value))}
              className="input-field"
              placeholder="예: 36 (3년)"
            />
            <p className="text-xs text-gray-500 mt-1">
              현재 기준 차량 출고 후 경과 개월 수
            </p>
          </div>

          {/* 주행거리 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              주행거리 (km)
            </label>
            <input
              type="number"
              min="0"
              value={vehicleInfo.distance}
              onChange={(e) => handleChange('distance', Number(e.target.value))}
              className="input-field"
              placeholder="예: 50000"
            />
          </div>

          {/* 배기량 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              배기량 (cc)
            </label>
            <input
              type="number"
              min="0"
              value={vehicleInfo.displacement}
              onChange={(e) => handleChange('displacement', Number(e.target.value))}
              className="input-field"
              placeholder="예: 2000"
            />
          </div>

          {/* 연료 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              연료 타입
            </label>
            <select
              value={vehicleInfo.fuel}
              onChange={(e) => handleChange('fuel', e.target.value as VehicleInfo['fuel'])}
              className="input-field"
            >
              <option value="gasoline">가솔린</option>
              <option value="diesel">디젤</option>
              <option value="hybrid">하이브리드</option>
              <option value="electric">전기</option>
              <option value="lpg">LPG</option>
            </select>
          </div>

          {/* 색상 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              외장 색상
            </label>
            <select
              value={vehicleInfo.color}
              onChange={(e) => handleChange('color', e.target.value as VehicleInfo['color'])}
              className="input-field"
            >
              <option value="white">흰색</option>
              <option value="black">검정</option>
              <option value="gray">회색</option>
              <option value="other">기타</option>
            </select>
          </div>

          {/* 신차가격 */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              신차 출고가 (원)
            </label>
            <input
              type="number"
              min="0"
              step="1000000"
              value={vehicleInfo.newPrice}
              onChange={(e) => handleChange('newPrice', Number(e.target.value))}
              className="input-field"
              placeholder="예: 30000000"
            />
            <p className="text-xs text-gray-500 mt-1">
              신차 출고 당시 가격을 입력해주세요.
            </p>
          </div>
        </div>
      </div>

      {/* 옵션 정보 */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b">옵션 정보</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { key: 'sunroof', label: '선루프' },
            { key: 'panoramaSunroof', label: '파노라마 선루프' },
            { key: 'frontSeatHeater', label: '앞좌석 열선시트' },
            { key: 'rearSeatHeater', label: '뒷좌석 열선시트' },
            { key: 'rearSensor', label: '후방센서' },
            { key: 'rearCamera', label: '후방카메라' },
            { key: 'aroundView', label: '어라운드뷰' },
            { key: 'navigation', label: '네비게이션' },
          ].map(({ key, label }) => (
            <label
              key={key}
              className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
            >
              <input
                type="checkbox"
                checked={vehicleInfo[key as keyof VehicleInfo] as boolean}
                onChange={(e) => handleChange(key as keyof VehicleInfo, e.target.checked)}
                className="w-5 h-5 text-primary rounded border-gray-300 focus:ring-primary"
              />
              <span className="text-sm text-gray-700">{label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* 차량 상태 */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b">차량 상태</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* 소유자 변경 횟수 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              소유자 변경 횟수
            </label>
            <select
              value={vehicleInfo.ownerChange}
              onChange={(e) => handleChange('ownerChange', e.target.value as VehicleInfo['ownerChange'])}
              className="input-field"
            >
              <option value="0">없음 (첫 번째 소유자)</option>
              <option value="1">1회</option>
              <option value="2">2회</option>
              <option value="3+">3회 이상</option>
            </select>
          </div>

          {/* 주요 결함 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              주요 결함 개수
            </label>
            <select
              value={vehicleInfo.majorDefect}
              onChange={(e) => handleChange('majorDefect', e.target.value as VehicleInfo['majorDefect'])}
              className="input-field"
            >
              <option value="low(0-2)">적음 (0~2개)</option>
              <option value="mid(3-10)">보통 (3~10개)</option>
              <option value="high(11+)">많음 (11개 이상)</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              엔진, 미션 등 주요 부품 결함
            </p>
          </div>

          {/* 경미한 결함 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              경미한 결함 개수
            </label>
            <select
              value={vehicleInfo.minorDefect}
              onChange={(e) => handleChange('minorDefect', e.target.value as VehicleInfo['minorDefect'])}
              className="input-field"
            >
              <option value="low(0-5)">적음 (0~5개)</option>
              <option value="mid(6-15)">보통 (6~15개)</option>
              <option value="high(16+)">많음 (16개 이상)</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              외관 스크래치, 내장재 손상 등
            </p>
          </div>
        </div>
      </div>

      {/* 안내 문구 */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-sm text-yellow-800">
          <strong>안내:</strong> 점검 담당자가 직접 방문하여 점검하였을 때, 실제 가격이 변동될 수 있습니다.
          위 정보는 예상 가격 산출을 위한 참고용으로만 사용됩니다.
        </p>
      </div>

      {/* 제출 버튼 */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isLoading || disabled}
          className="btn-primary min-w-[200px] flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              처리 중...
            </>
          ) : (
            '차량 정보 제출'
          )}
        </button>
      </div>
    </form>
  )
}
