import axios from 'axios'
import type { VehicleInfo, PricePrediction } from '../types'

const OCR_API_URL = 'https://ganada0037--ocr-serverless-split-ocrservice-analyze-dev.modal.run'
const PRICE_API_URL = 'https://xgltqfyf77.execute-api.ap-northeast-2.amazonaws.com/predict'

// OCR API 호출
export async function analyzeDocument(file: File): Promise<{
  documentType: string
  extractedData: Record<string, string>
  confidence: number
}> {
  const formData = new FormData()
  formData.append('file', file)

  const response = await axios.post(OCR_API_URL, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })

  return response.data
}

// 차량 정보를 API 형식으로 변환
function convertVehicleInfoToApiFormat(vehicleInfo: VehicleInfo): Record<string, unknown> {
  return {
    model_name: vehicleInfo.modelName,
    age_text: vehicleInfo.ageMonths,
    log_distance: vehicleInfo.distance,
    log_displacement: vehicleInfo.displacement,
    fuel: vehicleInfo.fuel === 'diesel' ? '디젤'
      : vehicleInfo.fuel === 'gasoline' ? '가솔린'
      : vehicleInfo.fuel === 'electric' ? '전기'
      : vehicleInfo.fuel === 'hybrid' ? '하이브리드'
      : 'LPG',
    color: vehicleInfo.color === 'black' ? '검정'
      : vehicleInfo.color === 'white' ? '흰색'
      : vehicleInfo.color === 'gray' ? '회색'
      : '기타',
    new_price: vehicleInfo.newPrice,
    sunroof: vehicleInfo.sunroof ? 1 : 0,
    panorama_sunroof: vehicleInfo.panoramaSunroof ? 1 : 0,
    front_seat_heater: vehicleInfo.frontSeatHeater ? 1 : 0,
    rear_seat_heater: vehicleInfo.rearSeatHeater ? 1 : 0,
    rear_sensor: vehicleInfo.rearSensor ? 1 : 0,
    rear_camera: vehicleInfo.rearCamera ? 1 : 0,
    around_view: vehicleInfo.aroundView ? 1 : 0,
    navigation: vehicleInfo.navigation ? 1 : 0,
    owner_change_bin: vehicleInfo.ownerChange,
    major_defect_bin: vehicleInfo.majorDefect,
    minor_defect_bin: vehicleInfo.minorDefect,
  }
}

// 가격 예측 API 호출
export async function predictPrice(vehicleInfo: VehicleInfo): Promise<PricePrediction> {
  const apiData = convertVehicleInfoToApiFormat(vehicleInfo)

  const response = await axios.post(PRICE_API_URL, apiData, {
    headers: {
      'Content-Type': 'application/json',
    },
  })

  console.log('Price API Response:', response.data)

  // 응답 형식 처리: 직접 {"predicted_price": ...} 또는 {"body": "{...}"} 형식 모두 지원
  let predictedPrice: number
  if (response.data.predicted_price !== undefined) {
    // 새 형식: {"predicted_price": 71158677}
    predictedPrice = response.data.predicted_price
  } else if (response.data.body) {
    // 이전 형식: {"statusCode": 200, "body": "{\"predicted_price\": 21736580}"}
    const bodyData = typeof response.data.body === 'string'
      ? JSON.parse(response.data.body)
      : response.data.body
    predictedPrice = bodyData.predicted_price
  } else {
    throw new Error('Unexpected API response format')
  }

  // 가격 범위 계산 (예측가의 ±5%)
  const margin = predictedPrice * 0.05
  const priceRange = {
    min: Math.round(predictedPrice - margin),
    max: Math.round(predictedPrice + margin),
  }

  // 가격 요인 분석
  const factors = analyzePriceFactors(vehicleInfo)

  return {
    predictedPrice: Math.round(predictedPrice),
    priceRange,
    factors,
  }
}

// 가격 요인 분석
function analyzePriceFactors(vehicleInfo: VehicleInfo): PricePrediction['factors'] {
  const factors: PricePrediction['factors'] = []

  // 주행거리 분석
  if (vehicleInfo.distance < 50000) {
    factors.push({
      name: '주행거리',
      impact: 'positive',
      description: '주행거리가 적어 차량 상태가 양호합니다.',
    })
  } else if (vehicleInfo.distance > 150000) {
    factors.push({
      name: '주행거리',
      impact: 'negative',
      description: '주행거리가 많아 가격에 영향을 줍니다.',
    })
  }

  // 차량 연식 분석
  if (vehicleInfo.ageMonths < 36) {
    factors.push({
      name: '차량 연식',
      impact: 'positive',
      description: '3년 이하의 신형 차량입니다.',
    })
  } else if (vehicleInfo.ageMonths > 84) {
    factors.push({
      name: '차량 연식',
      impact: 'negative',
      description: '7년 이상 된 차량으로 연식 감가가 적용됩니다.',
    })
  }

  // 소유자 변경 횟수
  if (vehicleInfo.ownerChange === '0') {
    factors.push({
      name: '소유자 변경',
      impact: 'positive',
      description: '첫 번째 소유자 차량으로 이력이 깔끔합니다.',
    })
  } else if (vehicleInfo.ownerChange === '3+') {
    factors.push({
      name: '소유자 변경',
      impact: 'negative',
      description: '소유자 변경이 많아 가격에 영향을 줍니다.',
    })
  }

  // 주요 결함
  if (vehicleInfo.majorDefect === 'high(11+)') {
    factors.push({
      name: '주요 결함',
      impact: 'negative',
      description: '주요 결함이 다수 발견되었습니다.',
    })
  } else if (vehicleInfo.majorDefect === 'low(0-2)') {
    factors.push({
      name: '주요 결함',
      impact: 'positive',
      description: '주요 결함이 거의 없는 양호한 상태입니다.',
    })
  }

  // 옵션 (긍정적 요소)
  const premiumOptions = []
  if (vehicleInfo.panoramaSunroof) premiumOptions.push('파노라마 선루프')
  if (vehicleInfo.aroundView) premiumOptions.push('어라운드뷰')
  if (vehicleInfo.navigation) premiumOptions.push('네비게이션')

  if (premiumOptions.length > 0) {
    factors.push({
      name: '프리미엄 옵션',
      impact: 'positive',
      description: `${premiumOptions.join(', ')} 옵션이 포함되어 있습니다.`,
    })
  }

  // 브랜드
  if (vehicleInfo.modelName === 'Genesis') {
    factors.push({
      name: '브랜드',
      impact: 'positive',
      description: '제네시스 브랜드로 프리미엄 가치가 있습니다.',
    })
  }

  return factors
}

// 파일을 Base64로 변환
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = (error) => reject(error)
  })
}
