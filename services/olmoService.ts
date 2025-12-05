import { DocumentType, ExtractedData, PredictionResult, SellerType } from "../types";

// DeepInfra API Configuration
const DEEPINFRA_API_KEY = process.env.DEEPINFRA_API_KEY;
const DEEPINFRA_ENDPOINT = "https://api.deepinfra.com/v1/openai/chat/completions";
const MODEL_NAME = "allenai/olmOCR-2";

const fileToBase64 = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      resolve(base64String);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

const getPromptForDocType = (type: DocumentType): string => {
  switch (type) {
    case DocumentType.VEHICLE_REGISTRATION:
      return `Extract the following information from this vehicle registration document in JSON format:
- ownerName: 소유자 성명 (Owner Name)
- residentNumber: 주민/법인 등록번호 앞 6-7자리 (Resident/Corp ID Prefix, mask last 6 digits)
- plateNumber: 차량 번호 (License Plate)
- modelName: 차명 (Model Name)
- registrationDate: 최초 등록일 (Registration Date)
- address: 주소 (Address)

If a field is unclear or not found, use "Unknown".`;

    case DocumentType.SEAL_CERTIFICATE:
      return `Extract the following information from this seal certificate document in JSON format:
- usage: 사용 용도 (Usage - should be '자동차 매도용')
- buyerName: 매수자 성명 (Buyer Name)
- buyerAddress: 매수자 주소 (Buyer Address)
- issuerDate: 발급일 (Issue Date)

If a field is unclear or not found, use "Unknown".`;

    case DocumentType.TAX_CERTIFICATE:
      return `Extract the following information from this tax certificate document in JSON format:
- taxType: 세목 (Tax Type)
- paymentStatus: 납부 상태 - must be either '완납' or '미납' (Payment Status)
- issueDate: 발급일 (Date)

If a field is unclear or not found, use "Unknown".`;

    case DocumentType.BUSINESS_REGISTRATION:
      return `Extract the following information from this business registration document in JSON format:
- companyName: 상호 (Company Name)
- repName: 대표자 성명 (Representative Name)
- businessType: 업태/종목 (Business Type)
- regNumber: 등록번호 (Registration Number)

If a field is unclear or not found, use "Unknown".`;

    case DocumentType.PERFORMANCE_RECORD:
      return `Extract the following information from this vehicle performance record document in JSON format:
- mileage: 주행거리 (Mileage including unit, e.g., "50,000 km")
- accidentHistory: 사고 유무 (Accident History: '유' or '무')
- simpleRepair: 단순 수리 (Simple Repair: '유' or '무')
- oilLeak: 오일 누유/누수 (Oil Leak: '없음', '미세누유', or '누유')
- transmission: 변속기 상태 (Transmission Status)
- inspectorOpinion: 점검자 특이사항/의견 (Inspector Opinion)

If a field is unclear or not found, use "Unknown".`;

    default:
      return `Extract key information from this document in JSON format:
- docName: 문서 제목 (Document Title)
- keyInfo: 핵심 내용 요약 (Summary)
- validity: 유효성 여부 (Valid/Invalid)

If a field is unclear or not found, use "Unknown".`;
  }
};

export const scanDocument = async (file: File, type: DocumentType): Promise<ExtractedData> => {
  try {
    const base64Image = await fileToBase64(file);
    const prompt = getPromptForDocType(type);

    const response = await fetch(DEEPINFRA_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${DEEPINFRA_API_KEY}`,
      },
      body: JSON.stringify({
        model: MODEL_NAME,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image_url",
                image_url: {
                  url: base64Image,
                },
              },
              {
                type: "text",
                text: prompt + "\n\nRespond ONLY with valid JSON, no additional text or explanation.",
              },
            ],
          },
        ],
        max_tokens: 1000,
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OLMo OCR API Error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const textContent = data.choices?.[0]?.message?.content;

    if (!textContent) {
      throw new Error("No content in OLMo OCR response");
    }

    // Extract JSON from response (in case there's additional text)
    const jsonMatch = textContent.match(/\{[\s\S]*\}/);
    const jsonString = jsonMatch ? jsonMatch[0] : textContent;

    return JSON.parse(jsonString) as ExtractedData;

  } catch (error) {
    console.error("OLMo OCR Error:", error);
    throw error;
  }
};

interface SellerAnalysis {
  type: SellerType;
  reason: string;
  additionalDocs: DocumentType[];
}

export const analyzeSellerRequirements = async (
  extractedData: Record<string, ExtractedData>
): Promise<SellerAnalysis> => {
  try {
    const prompt = `You are a strict Used Car Sales Compliance Officer.
Analyze the provided extracted data from vehicle documents to determine the Seller Type and any missing documents.

Rules:
1. If 'Business Registration' is present, they are a Business. Check if 'Vehicle Registration' owner matches 'Business Registration' rep name (Individual Business) or company name (Corporate).
2. If 'Vehicle Registration' owner name ends in 'Corp', 'Inc', '(Ju)', etc., it is CORPORATE.
3. If 'Vehicle Registration' resident number indicates birth year > 2005 (assuming current year 2024+), it is a MINOR.
4. Default is INDIVIDUAL.

Required Additional Documents:
- MINOR: ${DocumentType.LEGAL_REP_CONSENT}, ${DocumentType.FAMILY_RELATION}
- CORPORATE: ${DocumentType.CORPORATE_REGISTRY}, ${DocumentType.CORPORATE_SEAL}
- INDIVIDUAL_BUSINESS: None usually, but flag it.

Current Data:
${JSON.stringify(extractedData, null, 2)}

Respond with JSON in this exact format:
{
  "type": "INDIVIDUAL" | "CORPORATE" | "MINOR" | "INDIVIDUAL_BUSINESS" | "UNKNOWN",
  "reason": "explanation here",
  "additionalDocs": ["document type 1", "document type 2"]
}`;

    const response = await fetch(DEEPINFRA_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${DEEPINFRA_API_KEY}`,
      },
      body: JSON.stringify({
        model: MODEL_NAME,
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        max_tokens: 500,
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      throw new Error(`Analysis API Error: ${response.status}`);
    }

    const data = await response.json();
    const textContent = data.choices?.[0]?.message?.content;

    // Extract JSON from response
    const jsonMatch = textContent.match(/\{[\s\S]*\}/);
    const jsonString = jsonMatch ? jsonMatch[0] : textContent;

    return JSON.parse(jsonString) as SellerAnalysis;
  } catch (e) {
    console.error("Analysis failed", e);
    return { type: SellerType.UNKNOWN, reason: "Analysis failed", additionalDocs: [] };
  }
};

export const predictCarPrice = async (allData: Record<string, ExtractedData>, sellerType: SellerType): Promise<PredictionResult> => {
  try {
    const prompt = `Predict used car price (KRW) based on the provided document data.
CRITICAL: Focus heavily on the '${DocumentType.PERFORMANCE_RECORD}' data (Mileage, Accident History, Oil Leak, etc.) to determine the value depreciation.

Seller Type: ${sellerType}
Data: ${JSON.stringify(allData, null, 2)}

Output JSON with minPrice, maxPrice, currency='KRW', reasoning, marketTrend.
The reasoning should specifically mention the condition of the car from the performance record.

Respond with JSON in this exact format:
{
  "minPrice": 15000000,
  "maxPrice": 18000000,
  "currency": "KRW",
  "reasoning": "detailed explanation here",
  "marketTrend": "rising" | "stable" | "falling"
}`;

    const response = await fetch(DEEPINFRA_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${DEEPINFRA_API_KEY}`,
      },
      body: JSON.stringify({
        model: MODEL_NAME,
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        max_tokens: 800,
        temperature: 0.2,
      }),
    });

    if (!response.ok) {
      throw new Error(`Prediction API Error: ${response.status}`);
    }

    const data = await response.json();
    const textContent = data.choices?.[0]?.message?.content;

    // Extract JSON from response
    const jsonMatch = textContent.match(/\{[\s\S]*\}/);
    const jsonString = jsonMatch ? jsonMatch[0] : textContent;

    return JSON.parse(jsonString) as PredictionResult;
  } catch (error) {
    console.error("Prediction Error:", error);
    throw error;
  }
};
