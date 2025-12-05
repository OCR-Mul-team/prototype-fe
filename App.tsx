import React, { useState, useEffect } from 'react';
import { DocumentType, CarDocumentState, ExtractedData, PredictionResult, SellerType } from './types';
import DocumentCard from './components/DocumentCard';
import ResultView from './components/ResultView';
import { scanDocument, predictCarPrice, analyzeSellerRequirements } from './services/geminiService';
// import { scanDocument, predictCarPrice, analyzeSellerRequirements } from './services/olmoService';
import { Car, ChevronRight, FileText, Sparkles, Loader2, User, Building2, Baby, AlertTriangle, CheckCircle2 } from 'lucide-react';

const INITIAL_DOCS: CarDocumentState[] = [
  { id: 'perf', type: DocumentType.PERFORMANCE_RECORD, required: true, file: null, previewUrl: null, extractedData: null, status: 'idle' },
  { id: 'reg', type: DocumentType.VEHICLE_REGISTRATION, required: true, file: null, previewUrl: null, extractedData: null, status: 'idle' },
  { id: 'seal', type: DocumentType.SEAL_CERTIFICATE, required: true, file: null, previewUrl: null, extractedData: null, status: 'idle' },
  { id: 'tax', type: DocumentType.TAX_CERTIFICATE, required: true, file: null, previewUrl: null, extractedData: null, status: 'idle' },
  { id: 'biz', type: DocumentType.BUSINESS_REGISTRATION, required: false, file: null, previewUrl: null, extractedData: null, status: 'idle' },
];

function App() {
  const [step, setStep] = useState<number>(1);
  const [documents, setDocuments] = useState<CarDocumentState[]>(INITIAL_DOCS);
  const [sellerType, setSellerType] = useState<SellerType>(SellerType.UNKNOWN);
  const [analysisReason, setAnalysisReason] = useState<string>("");
  const [isAnalyzingSeller, setIsAnalyzingSeller] = useState<boolean>(false);
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const [isPredicting, setIsPredicting] = useState<boolean>(false);

  // Update logic
  const updateDoc = (id: string, updates: Partial<CarDocumentState>) => {
    setDocuments(prev => prev.map(doc => doc.id === id ? { ...doc, ...updates } : doc));
  };

  const handleUpload = async (id: string, file: File) => {
    const doc = documents.find(d => d.id === id);
    if (!doc) return;

    const previewUrl = URL.createObjectURL(file);
    updateDoc(id, { file, previewUrl, status: 'scanning', errorMessage: undefined });

    try {
      const data = await scanDocument(file, doc.type);
      updateDoc(id, { extractedData: data, status: 'complete' });
    } catch (error) {
      updateDoc(id, { status: 'error', errorMessage: '문서 인식 실패' });
    }
  };

  const handleRemove = (id: string) => {
    const doc = documents.find(d => d.id === id);
    if (doc?.previewUrl) URL.revokeObjectURL(doc.previewUrl);
    
    // If it's a dynamically added doc, remove it completely
    if (!INITIAL_DOCS.find(d => d.id === id)) {
        setDocuments(prev => prev.filter(d => d.id !== id));
    } else {
        updateDoc(id, { file: null, previewUrl: null, extractedData: null, status: 'idle' });
    }
  };

  const handleUpdateField = (id: string, key: string, value: string) => {
    const doc = documents.find(d => d.id === id);
    if (doc && doc.extractedData) {
      updateDoc(id, { extractedData: { ...doc.extractedData, [key]: value } });
    }
  };

  // --- Auto-Analyze Seller Type ---
  // Triggered when Vehicle Registration or Business Registration changes status to complete
  useEffect(() => {
    const checkStatus = async () => {
      const regDoc = documents.find(d => d.type === DocumentType.VEHICLE_REGISTRATION);
      const bizDoc = documents.find(d => d.type === DocumentType.BUSINESS_REGISTRATION);

      // We need at least the Registration to start guessing, OR Biz Reg
      if (regDoc?.status === 'complete' || bizDoc?.status === 'complete') {
        // Prevent re-running if we already identified (unless we want to allow re-check)
        // For prototype, let's run it if we haven't locked in a complex type yet
        if (sellerType === SellerType.UNKNOWN || sellerType === SellerType.INDIVIDUAL) {
           runSellerAnalysis();
        }
      }
    };
    checkStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [documents.map(d => d.status).join(',')]); 


  const runSellerAnalysis = async () => {
    setIsAnalyzingSeller(true);
    const availableData: Record<string, ExtractedData> = {};
    documents.forEach(d => {
      if (d.status === 'complete' && d.extractedData) {
        availableData[d.type] = d.extractedData;
      }
    });

    try {
      const result = await analyzeSellerRequirements(availableData);
      setSellerType(result.type);
      setAnalysisReason(result.reason);

      // Add missing documents dynamically
      if (result.additionalDocs && result.additionalDocs.length > 0) {
        setDocuments(prev => {
          const newDocs: CarDocumentState[] = [];
          result.additionalDocs.forEach(type => {
            // Check if already exists in current state
            if (!prev.some(d => d.type === type)) {
              newDocs.push({
                id: `dynamic-${Date.now()}-${Math.random()}-${type}`,
                type: type,
                required: true,
                file: null,
                previewUrl: null,
                extractedData: null,
                status: 'idle'
              });
            }
          });

          // Only add if there are new documents
          return newDocs.length > 0 ? [...prev, ...newDocs] : prev;
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsAnalyzingSeller(false);
    }
  };

  const handlePredict = async () => {
    setIsPredicting(true);
    const aggregatedData: Record<string, ExtractedData> = {};
    documents.forEach(doc => {
      if (doc.extractedData) {
        aggregatedData[doc.type] = doc.extractedData;
      }
    });

    try {
      const result = await predictCarPrice(aggregatedData, sellerType);
      setPrediction(result);
      setStep(3);
    } catch (error) {
      alert("분석 실패");
    } finally {
      setIsPredicting(false);
    }
  };

  const restart = () => {
    setStep(1);
    setPrediction(null);
    setSellerType(SellerType.UNKNOWN);
    setDocuments(INITIAL_DOCS);
  };

  // --- UI Helpers ---

  const getSellerIcon = () => {
    switch(sellerType) {
      case SellerType.CORPORATE: return <Building2 className="w-5 h-5" />;
      case SellerType.MINOR: return <Baby className="w-5 h-5" />;
      case SellerType.INDIVIDUAL_BUSINESS: return <User className="w-5 h-5" />;
      default: return <User className="w-5 h-5" />;
    }
  };

  const requiredDocsComplete = documents.filter(d => d.required).every(d => d.status === 'complete');

  // --- Render ---

  if (step === 3 && prediction) {
    return (
      <div className="min-h-screen bg-slate-50 py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <header className="flex items-center justify-between mb-8 bg-white p-4 rounded-xl shadow-sm">
            <div className="flex items-center">
               <Car className="w-8 h-8 text-blue-600 mr-3" />
               <div>
                  <h1 className="text-xl font-bold text-slate-800">AutoScan Sell</h1>
                  <p className="text-xs text-slate-500">상담원 전용 화면</p>
               </div>
            </div>
            <button onClick={restart} className="text-sm font-medium text-slate-500 hover:text-blue-600">새 상담 시작</button>
          </header>
          <ResultView prediction={prediction} onRestart={restart} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto">
        
        {/* Header Bar */}
        <header className="flex items-center justify-between mb-8 bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
           <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
                 <Car className="w-7 h-7" />
              </div>
              <div>
                 <h1 className="text-2xl font-bold text-slate-800 tracking-tight">AutoScan Sell</h1>
                 <p className="text-sm text-slate-500 font-medium">중고차 매입 서류 AI 분석 시스템</p>
              </div>
           </div>
           
           <div className="flex gap-2">
             <div className={`px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors ${step===1 ? 'bg-blue-50 text-blue-700' : 'text-slate-400'}`}>
                <span className="w-6 h-6 rounded-full bg-current text-white flex items-center justify-center text-xs">1</span>
                서류 접수 및 분석
             </div>
             <ChevronRight className="text-slate-300" />
             <div className={`px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors ${step===2 ? 'bg-blue-50 text-blue-700' : 'text-slate-400'}`}>
                <span className="w-6 h-6 rounded-full bg-current text-white flex items-center justify-center text-xs">2</span>
                최종 확인
             </div>
           </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Main Content Area */}
          <main className="lg:col-span-8 space-y-6">
            
            {step === 1 && (
              <>
                 <div className="space-y-6">
                    {/* List layout for Documents to allow Side-by-Side view */}
                    {documents.map(doc => (
                      <DocumentCard 
                        key={doc.id} 
                        docState={doc} 
                        onUpload={(f) => handleUpload(doc.id, f)}
                        onRemove={() => handleRemove(doc.id)}
                        onUpdateField={(k, v) => handleUpdateField(doc.id, k, v)}
                      />
                    ))}
                 </div>

                 <div className="flex justify-end pt-4">
                    <button 
                      onClick={() => setStep(2)}
                      disabled={!requiredDocsComplete}
                      className={`px-8 py-3 rounded-xl font-bold shadow-lg transition-all flex items-center gap-2
                        ${requiredDocsComplete 
                           ? 'bg-blue-600 text-white hover:bg-blue-700 hover:scale-105' 
                           : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
                    >
                      다음 단계로 <ChevronRight className="w-4 h-4" />
                    </button>
                 </div>
              </>
            )}

            {step === 2 && (
              <>
                 <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200">
                    <h2 className="text-xl font-bold text-slate-800 mb-6 border-b pb-4">최종 서류 정보 요약</h2>
                    
                    <div className="space-y-8">
                       {documents.filter(d => d.status === 'complete').map(doc => (
                          <div key={doc.id} className="grid grid-cols-12 gap-6">
                             <div className="col-span-12 sm:col-span-3">
                                <h3 className="font-semibold text-slate-700">{doc.type}</h3>
                                <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full inline-block mt-1">검증 완료</span>
                             </div>
                             <div className="col-span-12 sm:col-span-9 grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl">
                                {doc.extractedData && Object.entries(doc.extractedData).map(([k, v]) => (
                                   <div key={k}>
                                      <p className="text-xs text-slate-400 font-bold uppercase">{k}</p>
                                      <p className="text-sm font-medium text-slate-800 truncate">{v}</p>
                                   </div>
                                ))}
                             </div>
                          </div>
                       ))}
                    </div>
                 </div>
                 
                 <div className="flex justify-between items-center">
                    <button onClick={() => setStep(1)} className="text-slate-500 font-medium hover:text-slate-800">
                       뒤로 가기
                    </button>
                    <button 
                       onClick={handlePredict}
                       disabled={isPredicting}
                       className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold shadow-lg hover:bg-indigo-700 hover:shadow-indigo-200 transition-all flex items-center gap-2"
                    >
                       {isPredicting ? <Loader2 className="animate-spin" /> : <Sparkles className="w-5 h-5" />}
                       AI 가격 산출 실행
                    </button>
                 </div>
              </>
            )}
          </main>

          {/* Sidebar Info Panel */}
          <aside className="lg:col-span-4 space-y-6">
             {/* Guide Card */}
             <div className="bg-blue-50 rounded-2xl p-6 border border-blue-100">
                <h3 className="font-bold text-blue-900 mb-2 flex items-center gap-2">
                   <AlertTriangle className="w-4 h-4" /> 상담 가이드
                </h3>
                <p className="text-sm text-blue-800 mb-4">
                   서류 인식 후, <strong>좌측의 원본 이미지</strong>와 <strong>우측의 인식된 텍스트</strong>를 비교하여 오타가 없는지 반드시 확인해주세요.
                </p>
                <div className="text-xs text-blue-600 space-y-1">
                   <p>• 성능점검기록부의 사고 유무는 가격에 큰 영향을 미칩니다.</p>
                   <p>• 주행거리 숫자가 정확한지 확인해주세요.</p>
                </div>
             </div>

             {/* Seller Status Card */}
             <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 sticky top-6">
                <div className="flex items-center justify-between mb-4">
                   <h3 className="font-bold text-slate-700">판매자 유형 분석</h3>
                   {isAnalyzingSeller && <Loader2 className="w-4 h-4 animate-spin text-blue-500" />}
                </div>

                <div className={`p-4 rounded-xl border-2 flex items-start gap-3 transition-colors ${
                  sellerType === SellerType.UNKNOWN ? 'border-dashed border-slate-200 bg-slate-50' :
                  sellerType === SellerType.INDIVIDUAL ? 'border-green-100 bg-green-50' :
                  'border-amber-100 bg-amber-50'
                }`}>
                   <div className={`p-2 rounded-lg ${
                      sellerType === SellerType.UNKNOWN ? 'bg-slate-200' : 
                      sellerType === SellerType.INDIVIDUAL ? 'bg-green-200 text-green-700' :
                      'bg-amber-200 text-amber-700'
                   }`}>
                      {getSellerIcon()}
                   </div>
                   <div>
                      <p className="font-bold text-slate-800">
                        {sellerType === SellerType.UNKNOWN ? '분석 대기 중...' : sellerType}
                      </p>
                      <p className="text-xs text-slate-500 mt-1 leading-snug">
                        {analysisReason || "서류를 업로드하면 AI가 판매자 유형을 자동으로 분석합니다."}
                      </p>
                   </div>
                </div>

                {/* Dynamic Checklist */}
                {sellerType !== SellerType.UNKNOWN && sellerType !== SellerType.INDIVIDUAL && (
                   <div className="mt-6">
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">추가 필요 서류</h4>
                      <ul className="space-y-2">
                         {documents.filter(d => !INITIAL_DOCS.find(i => i.id === d.id)).map(doc => (
                            <li key={doc.id} className="flex items-center gap-2 text-sm text-amber-700 bg-amber-50 px-3 py-2 rounded-lg border border-amber-100">
                               <AlertTriangle className="w-4 h-4" />
                               {doc.type}
                               {doc.status === 'complete' && <CheckCircle2 className="w-4 h-4 text-green-500 ml-auto" />}
                            </li>
                         ))}
                         {documents.filter(d => !INITIAL_DOCS.find(i => i.id === d.id)).length === 0 && (
                            <li className="text-sm text-slate-400 italic">추가 서류 없음</li>
                         )}
                      </ul>
                   </div>
                )}
             </div>
          </aside>

        </div>
      </div>
    </div>
  );
}

export default App;