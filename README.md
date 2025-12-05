# AutoScan Sell 🚗

**중고차 매입 서류 AI 분석 시스템**

AutoScan Sell은 중고차 매매 상담원을 위한 AI 기반 서류 자동 분석 시스템입니다. 고객이 제출한 차량 관련 서류를 자동으로 스캔하고, OCR로 텍스트를 추출하며, 판매자 유형을 자동 분석하여 필요한 추가 서류를 안내하고, AI 기반 차량 가격을 산출합니다.

---

## ✨ 주요 기능

### 📄 **스마트 문서 OCR**
- 드래그 앤 드롭 또는 클릭으로 간편한 파일 업로드
- AI 기반 이미지 인식으로 자동 텍스트 추출
- 추출된 데이터 실시간 수정 가능
- 원본 이미지와 추출 데이터를 나란히 비교

### 🔍 **판매자 유형 자동 분석**
- 차량등록증 분석으로 판매자 유형 자동 판별
  - 개인
  - 개인사업자
  - 법인
  - 미성년자
- 판매자 유형에 따른 필수 추가 서류 자동 안내

### 💰 **AI 기반 차량 가격 산출**
- 성능점검기록부 데이터 기반 가격 분석
- 사고 이력, 주행거리, 차량 상태 종합 평가
- 최소/최대 가격 범위 제시
- 시장 동향 분석 (상승/안정/하락)

### 📋 **지원 서류 종류**

#### 필수 서류
- 자동차등록증
- 매도용 인감증명서
- 자동차세완납증명서
- 자동차성능점검기록부

#### 선택 서류
- 사업자등록증 (개인사업자/법인의 경우)

#### 조건부 추가 서류 (자동 안내)
- **미성년자**: 법정대리인동의서, 가족관계증명서
- **법인**: 법인등기부등본, 법인인감증명서

---

## 🛠 기술 스택

- **Frontend**: React 19, TypeScript
- **Build Tool**: Vite 6.2
- **Styling**: Tailwind CSS (CDN)
- **Icons**: Lucide React
- **Charts**: Recharts
- **AI/OCR**:
  - Google Gemini 2.5 Flash (기본)
  - AllenAI OLMo OCR (선택 가능)

---

## 📦 설치 방법

### 사전 요구사항
- **Node.js** 18.0 이상

### 1. 의존성 설치

```bash
npm install
```

---

## 🔑 환경 변수 설정

프로젝트 루트에 `.env` 파일을 생성하고 API 키를 설정하세요.

### Gemini 사용 시 (기본)

```env
GEMINI_API_KEY=your_gemini_api_key_here
```

**Gemini API 키 발급**: [Google AI Studio](https://aistudio.google.com/apikey)

### OLMo OCR 사용 시

```env
DEEPINFRA_API_KEY=your_deepinfra_api_key_here
```

**DeepInfra API 키 발급**: [DeepInfra](https://deepinfra.com/)

---

## 🚀 실행 방법

### 개발 서버 실행

```bash
npm run dev
```

기본적으로 `http://localhost:3000`에서 실행됩니다.

### 프로덕션 빌드

```bash
npm run build
```

### 빌드 미리보기

```bash
npm run preview
```

---

## 🔄 OCR 모델 선택 가이드

이 프로젝트는 **두 가지 OCR 모델**을 지원합니다. `App.tsx`의 import만 변경하면 됩니다.

### 옵션 1: **Gemini AI** (기본 설정)

**장점**:
- ✅ 높은 정확도
- ✅ 무료 할당량 제공
- ✅ Vision API 포함

**설정 방법**:
```typescript
// App.tsx (5번째 줄)
import { scanDocument, predictCarPrice, analyzeSellerRequirements } from './services/geminiService';
```

### 옵션 2: **OLMo OCR** (오픈소스 모델)

**장점**:
- ✅ 오픈소스 기반
- ✅ 문서 특화 OCR
- ✅ DeepInfra 통해 간편하게 사용

**설정 방법**:
```typescript
// App.tsx (5번째 줄)
import { scanDocument, predictCarPrice, analyzeSellerRequirements } from './services/olmoService';
```

**참고**: 환경 변수도 함께 변경해야 합니다!

---

## 📁 프로젝트 구조

```
autoscan-sell/
├── components/              # React 컴포넌트
│   ├── DocumentCard.tsx     # 서류 업로드 및 OCR 결과 표시 카드
│   └── ResultView.tsx       # 최종 분석 결과 및 가격 산출 화면
├── services/                # AI/OCR 서비스 로직
│   ├── geminiService.ts     # Google Gemini AI 통합
│   └── olmoService.ts       # OLMo OCR 통합 (DeepInfra) - 유료
├── App.tsx                  # 메인 애플리케이션
├── types.ts                 # TypeScript 타입 정의
├── index.tsx                # 앱 진입점
├── index.html               # HTML 템플릿
├── vite.config.ts           # Vite 설정
├── tsconfig.json            # TypeScript 설정
└── package.json             # 프로젝트 메타데이터
```

---

## 🎯 사용 방법

### 1단계: 서류 접수 및 분석
1. 필수 서류를 드래그 앤 드롭 또는 클릭하여 업로드
2. AI가 자동으로 문서를 분석하고 텍스트 추출
3. 추출된 데이터를 확인하고 필요 시 수정
4. 판매자 유형이 자동으로 분석되며, 필요한 추가 서류가 표시됨

### 2단계: 최종 확인
1. 모든 서류의 추출 데이터 최종 검토
2. "AI 가격 산출 실행" 버튼 클릭

### 3단계: 결과 확인
1. AI가 산출한 차량 가격 범위 확인
2. 가격 산출 근거 및 시장 동향 검토
3. 서류 요약 정보 확인

---

## 🔧 개발 관련

### 주요 컴포넌트

#### `DocumentCard.tsx`
- 서류별 업로드 UI 제공
- 드래그 앤 드롭 지원
- OCR 진행 상태 표시
- 원본 이미지 vs 추출 데이터 양분할 화면
- 실시간 데이터 수정 기능

#### `ResultView.tsx`
- 최종 분석 결과 표시
- 가격 차트 시각화
- 서류 요약 정보 제공

#### `geminiService.ts` / `olmoService.ts`
- 이미지 → Base64 변환
- OCR API 호출
- 판매자 유형 분석
- 차량 가격 예측

### 환경 변수 처리

Vite는 `vite.config.ts`에서 환경 변수를 `process.env`로 매핑합니다:

```typescript
define: {
  'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
  'process.env.DEEPINFRA_API_KEY': JSON.stringify(env.DEEPINFRA_API_KEY)
}
```

---

## ⚠️ 주의사항

1. **API 키 보안**: `.env` 파일은 절대 Git에 커밋하지 마세요 (`.gitignore`에 포함됨)
2. **이미지 형식**: 현재 이미지 파일(`image/*`)만 지원합니다
3. **브라우저 호환성**: 최신 Chrome, Firefox, Safari 권장
4. **개발 서버 재시작**: `.env` 파일 변경 시 개발 서버를 재시작해야 합니다

---

## 🐛 문제 해결

### OCR이 401 에러를 반환할 때
- `.env` 파일의 API 키가 올바른지 확인
- 개발 서버를 재시작 (`Ctrl+C` 후 `npm run dev`)
- `vite.config.ts`의 환경 변수 매핑 확인

### 드래그 앤 드롭이 작동하지 않을 때
- 브라우저를 새로고침 (F5 또는 Ctrl+R)
- 이미지 파일만 지원 (PNG, JPG, JPEG 등)

### 서류가 중복으로 추가될 때
- 최신 코드로 업데이트되었는지 확인
- 브라우저 캐시 삭제 후 재실행

---

## 📄 라이선스

이 프로젝트는 학습 및 개발 목적으로 제작되었습니다.

