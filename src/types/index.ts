// 서류 타입
export type DocumentType =
  | 'vehicle_registration'    // 자동차등록증
  | 'tax_payment'             // 자동차세 완납증명서
  | 'seal_certificate'        // 인감증명서
  | 'business_registration';  // 사업자등록증

export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  vehicle_registration: '자동차등록증',
  tax_payment: '자동차세 완납증명서',
  seal_certificate: '매도용 인감증명서',
  business_registration: '사업자등록증',
};

// 서류 검증 상태
export type DocumentStatus =
  | 'pending'     // 대기중
  | 'processing'  // OCR 처리중
  | 'valid'       // 유효
  | 'invalid'     // 무효
  | 'expired'     // 만료
  | 'needs_review'; // 검토 필요

export const DOCUMENT_STATUS_LABELS: Record<DocumentStatus, string> = {
  pending: '대기중',
  processing: '처리중',
  valid: '유효',
  invalid: '무효',
  expired: '만료',
  needs_review: '검토 필요',
};

// 업로드된 서류 정보
export interface UploadedDocument {
  id: string;
  type: DocumentType | null;
  fileName: string;
  fileUrl: string;
  uploadedAt: Date;
  status: DocumentStatus;
  ocrResult?: OCRResult;
}

// OCR 결과
export interface OCRResult {
  documentType: DocumentType;
  extractedData: Record<string, string>;
  confidence: number;
  validationErrors: ValidationError[];
  isValid: boolean;
  expiryDate?: string;
}

// 검증 오류
export interface ValidationError {
  field: string;
  message: string;
  severity: 'error' | 'warning';
}

// 차량 정보 (가격 예측용)
export interface VehicleInfo {
  modelName: 'Hyundai' | 'Genesis';
  ageMonths: number;
  distance: number;           // 주행거리 (km)
  displacement: number;       // 배기량 (cc)
  fuel: 'diesel' | 'gasoline' | 'electric' | 'hybrid' | 'lpg';
  color: 'black' | 'white' | 'gray' | 'other';
  newPrice: number;           // 신차가격
  sunroof: boolean;
  panoramaSunroof: boolean;
  frontSeatHeater: boolean;
  rearSeatHeater: boolean;
  rearSensor: boolean;
  rearCamera: boolean;
  aroundView: boolean;
  navigation: boolean;
  ownerChange: '0' | '1' | '2' | '3+';
  majorDefect: 'low(0-2)' | 'mid(3-10)' | 'high(11+)';
  minorDefect: 'low(0-5)' | 'mid(6-15)' | 'high(16+)';
}

// 가격 예측 결과
export interface PricePrediction {
  predictedPrice: number;
  priceRange: {
    min: number;
    max: number;
  };
  factors: PriceFactor[];
}

export interface PriceFactor {
  name: string;
  impact: 'positive' | 'negative' | 'neutral';
  description: string;
}

// 세션 정보
export interface CustomerSession {
  sessionId: string;
  phoneNumber: string;
  customerName?: string;
  createdAt: Date;
  status: 'active' | 'completed' | 'cancelled';
  documents: UploadedDocument[];
  vehicleInfo?: VehicleInfo;
  pricePrediction?: PricePrediction;
  additionalDocumentRequest?: string;
}

// 상담원 정보
export interface Agent {
  id: string;
  name: string;
  employeeId: string;
}

// 소켓 이벤트 타입
export interface SocketEvents {
  // 고객 -> 서버
  'customer:join': (phoneNumber: string) => void;
  'customer:upload_document': (document: UploadedDocument) => void;
  'customer:submit_vehicle_info': (vehicleInfo: VehicleInfo) => void;

  // 서버 -> 고객
  'customer:session_created': (session: CustomerSession) => void;
  'customer:ocr_processing': (documentId: string) => void;
  'customer:additional_document_request': (message: string) => void;
  'customer:price_report': (prediction: PricePrediction) => void;

  // 상담원 -> 서버
  'agent:join': (agentId: string) => void;
  'agent:request_additional_document': (sessionId: string, message: string) => void;
  'agent:update_ocr_result': (sessionId: string, documentId: string, ocrResult: OCRResult) => void;
  'agent:send_price_report': (sessionId: string) => void;

  // 서버 -> 상담원
  'agent:new_session': (session: CustomerSession) => void;
  'agent:document_uploaded': (sessionId: string, document: UploadedDocument) => void;
  'agent:vehicle_info_submitted': (sessionId: string, vehicleInfo: VehicleInfo) => void;
  'agent:ocr_completed': (sessionId: string, documentId: string, ocrResult: OCRResult) => void;
}
