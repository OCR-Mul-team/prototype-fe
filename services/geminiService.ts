import { GoogleGenAI, Type, Schema } from "@google/genai";
import { DocumentType, ExtractedData, PredictionResult, SellerType } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
const modelId = "gemini-2.5-flash";

const fileToGenerativePart = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      const base64Data = base64String.split(',')[1];
      resolve(base64Data);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

const getSchemaForDocType = (type: DocumentType): Schema => {
  switch (type) {
    case DocumentType.VEHICLE_REGISTRATION:
      return {
        type: Type.OBJECT,
        properties: {
          ownerName: { type: Type.STRING, description: "소유자 성명 (Owner Name)" },
          residentNumber: { type: Type.STRING, description: "주민/법인 등록번호 앞 6-7자리 (Resident/Corp ID Prefix)" },
          plateNumber: { type: Type.STRING, description: "차량 번호 (License Plate)" },
          modelName: { type: Type.STRING, description: "차명 (Model Name)" },
          registrationDate: { type: Type.STRING, description: "최초 등록일 (Registration Date)" },
          address: { type: Type.STRING, description: "주소 (Address)" }
        },
        required: ["ownerName", "plateNumber"],
      };
    case DocumentType.SEAL_CERTIFICATE:
      return {
        type: Type.OBJECT,
        properties: {
          usage: { type: Type.STRING, description: "사용 용도 (Usage - MUST be '자동차 매도용')" },
          buyerName: { type: Type.STRING, description: "매수자 성명 (Buyer Name)" },
          buyerAddress: { type: Type.STRING, description: "매수자 주소 (Buyer Address)" },
          issuerDate: { type: Type.STRING, description: "발급일 (Issue Date)" }
        },
        required: ["usage", "buyerName"],
      };
    case DocumentType.TAX_CERTIFICATE:
      return {
        type: Type.OBJECT,
        properties: {
          taxType: { type: Type.STRING, description: "세목 (Tax Type)" },
          paymentStatus: { type: Type.STRING, description: "납부 상태 (완납/미납) (Payment Status)" },
          issueDate: { type: Type.STRING, description: "발급일 (Date)" }
        },
        required: ["paymentStatus"],
      };
    case DocumentType.BUSINESS_REGISTRATION:
      return {
        type: Type.OBJECT,
        properties: {
          companyName: { type: Type.STRING, description: "상호 (Company Name)" },
          repName: { type: Type.STRING, description: "대표자 성명 (Representative Name)" },
          businessType: { type: Type.STRING, description: "업태/종목 (Business Type)" },
          regNumber: { type: Type.STRING, description: "등록번호 (Registration Number)" }
        },
        required: ["companyName", "regNumber"],
      };
    case DocumentType.PERFORMANCE_RECORD:
      return {
        type: Type.OBJECT,
        properties: {
          mileage: { type: Type.STRING, description: "주행거리 (Mileage including unit)" },
          accidentHistory: { type: Type.STRING, description: "사고 유무 (Accident History: 유/무)" },
          simpleRepair: { type: Type.STRING, description: "단순 수리 (Simple Repair: 유/무)" },
          oilLeak: { type: Type.STRING, description: "오일 누유/누수 (Oil Leak: 없음/미세누유/누유)" },
          transmission: { type: Type.STRING, description: "변속기 상태 (Transmission Status)" },
          inspectorOpinion: { type: Type.STRING, description: "점검자 특이사항/의견 (Inspector Opinion)" }
        },
        required: ["mileage", "accidentHistory"],
      };
    default:
      // Generic schema for additional documents
      return {
        type: Type.OBJECT,
        properties: {
          docName: { type: Type.STRING, description: "문서 제목 (Document Title)" },
          keyInfo: { type: Type.STRING, description: "핵심 내용 요약 (Summary)" },
          validity: { type: Type.STRING, description: "유효성 여부 (Valid/Invalid)" }
        },
      };
  }
};

export const scanDocument = async (file: File, type: DocumentType): Promise<ExtractedData> => {
  try {
    const base64Data = await fileToGenerativePart(file);
    const mimeType = file.type;

    const response = await ai.models.generateContent({
      model: modelId,
      contents: {
        parts: [
          { inlineData: { data: base64Data, mimeType: mimeType } },
          { text: `Analyze this image of a ${type}. Extract key fields into JSON. If a field is unclear, use 'Unknown'. For Resident Numbers, mask the last 6 digits.` },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: getSchemaForDocType(type),
      },
    });

    const text = response.text;
    if (!text) throw new Error("No response text from Gemini");
    
    return JSON.parse(text) as ExtractedData;

  } catch (error) {
    console.error("OCR Error:", error);
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
    const prompt = `
      You are a strict Used Car Sales Compliance Officer.
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
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            type: { type: Type.STRING, enum: Object.values(SellerType) },
            reason: { type: Type.STRING },
            additionalDocs: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING, enum: Object.values(DocumentType) } 
            }
          },
          required: ["type", "reason", "additionalDocs"]
        }
      }
    });

    return JSON.parse(response.text!) as SellerAnalysis;
  } catch (e) {
    console.error("Analysis failed", e);
    return { type: SellerType.UNKNOWN, reason: "Analysis failed", additionalDocs: [] };
  }
};

export const predictCarPrice = async (allData: Record<string, ExtractedData>, sellerType: SellerType): Promise<PredictionResult> => {
  try {
    const prompt = `
      Predict used car price (KRW) based on the provided document data.
      CRITICAL: Focus heavily on the '${DocumentType.PERFORMANCE_RECORD}' data (Mileage, Accident History, Oil Leak, etc.) to determine the value depreciation.
      
      Seller Type: ${sellerType}
      Data: ${JSON.stringify(allData, null, 2)}
      
      Output JSON with minPrice, maxPrice, currency='KRW', reasoning, marketTrend.
      The reasoning should specifically mention the condition of the car from the performance record.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            minPrice: { type: Type.NUMBER },
            maxPrice: { type: Type.NUMBER },
            currency: { type: Type.STRING, enum: ["KRW"] },
            reasoning: { type: Type.STRING },
            marketTrend: { type: Type.STRING, enum: ["rising", "stable", "falling"] }
          },
          required: ["minPrice", "maxPrice", "reasoning", "marketTrend"]
        }
      }
    });

    return JSON.parse(response.text!) as PredictionResult;
  } catch (error) {
    console.error("Prediction Error:", error);
    throw error;
  }
};