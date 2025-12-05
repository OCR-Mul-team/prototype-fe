export enum DocumentType {
  // Base Documents
  VEHICLE_REGISTRATION = '자동차등록증',
  SEAL_CERTIFICATE = '매도용 인감증명서',
  TAX_CERTIFICATE = '자동차세완납증명서',
  BUSINESS_REGISTRATION = '사업자등록증',
  PERFORMANCE_RECORD = '자동차성능점검기록부',
  
  // Conditional Documents
  LEGAL_REP_CONSENT = '법정대리인동의서',
  FAMILY_RELATION = '가족관계증명서',
  CORPORATE_REGISTRY = '법인등기부등본',
  CORPORATE_SEAL = '법인인감증명서'
}

export enum SellerType {
  INDIVIDUAL = '개인',
  INDIVIDUAL_BUSINESS = '개인사업자',
  CORPORATE = '법인',
  MINOR = '미성년자',
  UNKNOWN = '미확인'
}

export interface ExtractedData {
  [key: string]: string | number;
}

export interface CarDocumentState {
  id: string;
  type: DocumentType;
  required: boolean; // Visual cue for agents
  file: File | null;
  previewUrl: string | null;
  extractedData: ExtractedData | null;
  status: 'idle' | 'scanning' | 'complete' | 'error';
  errorMessage?: string;
}

export interface PredictionResult {
  minPrice: number;
  maxPrice: number;
  currency: string;
  reasoning: string;
  marketTrend: 'rising' | 'stable' | 'falling';
}