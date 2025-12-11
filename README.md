# AutoScan Sell - Frontend

현대자동차 인증중고차 매입 서비스를 위한 고객용 웹 애플리케이션입니다.

## 프로젝트 소개

AutoScan Sell은 중고차 매입 과정을 디지털화한 서비스입니다. 고객이 필요한 서류를 업로드하면 OCR로 자동 분석하고, AI 기반 가격 예측을 통해 예상 매입가를 제공합니다. 상담원과 실시간으로 연동되어 원활한 상담이 가능합니다.

### 주요 기능

- **서류 업로드 및 OCR 분석**: 자동차등록증, 자동차세 완납증명서, 인감증명서, 사업자등록증 등을 업로드하면 OCR로 자동 인식
- **AI 가격 예측**: 차량 정보를 입력하면 머신러닝 모델이 예상 매입가 범위를 산출
- **실시간 상담원 연동**: Socket.IO를 통해 상담원과 실시간으로 서류 및 정보 공유
- **가격 예측 보고서**: PDF로 다운로드 가능한 상세 가격 분석 보고서 제공

## 기술 스택

- **React 18** + **TypeScript**
- **Vite** - 빌드 도구
- **Tailwind CSS** - 스타일링
- **Zustand** - 상태 관리
- **Socket.IO Client** - 실시간 통신
- **Axios** - HTTP 클라이언트
- **html2canvas** + **jsPDF** - PDF 생성

## 프로젝트 구조

```
src/
├── components/           # 재사용 가능한 컴포넌트
│   ├── DocumentUploader.tsx    # 서류 업로드 컴포넌트
│   ├── Header.tsx              # 헤더
│   ├── ImageViewerModal.tsx    # 이미지 뷰어 모달
│   ├── PriceReportModal.tsx    # 가격 보고서 모달 (PDF 저장)
│   └── VehicleInfoForm.tsx     # 차량 정보 입력 폼
├── pages/                # 페이지 컴포넌트
│   ├── CustomerPage.tsx        # 고객용 메인 페이지
│   ├── AgentDashboard.tsx      # 상담원 대시보드
│   └── AgentLoginPage.tsx      # 상담원 로그인 페이지
├── services/             # API 서비스
│   └── api.ts                  # OCR, 가격예측 API 호출
├── store/                # 상태 관리
│   └── useStore.ts             # Zustand 스토어
├── hooks/                # 커스텀 훅
├── types/                # TypeScript 타입 정의
│   └── index.ts
├── App.tsx               # 라우팅 설정
├── main.tsx              # 앱 진입점
└── index.css             # 글로벌 스타일
```

## 시작하기

### 사전 요구사항

- Node.js 18.x 이상
- npm 또는 yarn

### 설치

```bash
# 저장소 클론
git clone <repository-url>
cd prototype-fe

# 의존성 설치
npm install
```

### 개발 서버 실행

```bash
npm run dev
```

브라우저에서 `http://localhost:5173` 으로 접속합니다.

### 프로덕션 빌드

```bash
npm run build
```

빌드된 파일은 `dist/` 폴더에 생성됩니다.

### 빌드 미리보기

```bash
npm run preview
```

## 환경 설정

백엔드 서버 주소는 `src/store/useStore.ts` 파일에서 설정할 수 있습니다:

```typescript
const socket = io('http://localhost:3001')  // 백엔드 서버 주소
```

## 페이지 설명

### 고객 페이지 (`/`)

고객이 사용하는 메인 페이지입니다:
1. 전화번호로 세션 시작
2. 필요 서류 업로드 (드래그 앤 드롭 지원)
3. 차량 정보 입력
4. AI 가격 예측 결과 확인
5. PDF 보고서 다운로드

### 상담원 대시보드 (`/agent`)

상담원이 사용하는 관리 페이지입니다:
1. 사번/이름으로 로그인
2. 실시간 고객 세션 목록 확인
3. 업로드된 서류 확인 및 이미지 확대/축소 (50%~300%)
4. OCR 결과 검토
5. 차량 정보 및 가격 예측 확인
6. 추가 서류 요청 전송

## 연동 API

### OCR API
- URL: `https://ganada0037--ocr-serverless-split-ocrservice-analyze-dev.modal.run`
- Method: POST (multipart/form-data)
- 응답 형식:
```json
{
  "status": "success",
  "count": 5,
  "results": [
    {
      "text": "인식된 텍스트",
      "confidence": { "yolo": 0.66, "ocr": 0.99 }
    }
  ]
}
```

### 가격 예측 API
- URL: `https://xgltqfyf77.execute-api.ap-northeast-2.amazonaws.com/predict`
- Method: POST (application/json)
- 응답 형식:
```json
{
  "predicted_price": 25000000
}
```

## 스크립트

| 명령어 | 설명 |
|--------|------|
| `npm run dev` | 개발 서버 실행 |
| `npm run build` | 프로덕션 빌드 |
| `npm run preview` | 빌드 결과 미리보기 |
| `npm run lint` | ESLint 실행 |

## 관련 프로젝트

- [prototype-socket](../prototype-socket) - 백엔드 서버

