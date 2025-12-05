import React, { useRef, useState } from 'react';
import { Upload, X, FileText, AlertCircle, Loader2, ZoomIn, Maximize2 } from 'lucide-react';
import { CarDocumentState } from '../types';

interface DocumentCardProps {
  docState: CarDocumentState;
  onUpload: (file: File) => void;
  onRemove: () => void;
  onUpdateField: (key: string, value: string) => void;
}

const DocumentCard: React.FC<DocumentCardProps> = ({ docState, onUpload, onRemove, onUpdateField }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isZoomed, setIsZoomed] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onUpload(e.target.files[0]);
    }
  };

  const triggerUpload = () => {
    fileInputRef.current?.click();
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      // Check if it's an image file
      if (files[0].type.startsWith('image/')) {
        onUpload(files[0]);
      }
    }
  };

  const getStatusColor = () => {
    switch (docState.status) {
      case 'complete': return 'border-green-200 bg-white ring-1 ring-green-100';
      case 'scanning': return 'border-blue-200 bg-blue-50/30';
      case 'error': return 'border-red-200 bg-red-50/30';
      default: return docState.required ? 'border-amber-200 bg-white' : 'border-gray-200 bg-white';
    }
  };

  return (
    <div className={`border rounded-xl transition-all duration-300 ${getStatusColor()} shadow-sm overflow-hidden group`}>
      <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
      
      {/* Header Section */}
      <div className="flex justify-between items-center p-4 border-b border-gray-100 bg-gray-50/50">
        <div className="flex items-center gap-3">
           <div className={`p-2 rounded-lg ${docState.status === 'complete' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
              <FileText className="w-5 h-5" />
           </div>
           <div>
              <h3 className="font-bold text-gray-800 flex items-center gap-2">
                {docState.type}
                {docState.required && (
                  <span className="text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-bold">필수</span>
                )}
              </h3>
              <p className="text-xs text-gray-500">
                {docState.status === 'complete' ? '내용을 확인하고 필요시 수정하세요.' : 
                 docState.status === 'scanning' ? 'AI가 문서를 분석 중입니다...' : 
                 docState.required ? '필수 제출 서류입니다.' : '추가 증빙 서류입니다.'}
              </p>
           </div>
        </div>

        <div className="flex items-center gap-2">
          {docState.status === 'idle' && (
             <button 
                onClick={triggerUpload}
                className="text-sm bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm"
             >
                업로드
             </button>
          )}
          {docState.status !== 'idle' && (
            <button onClick={onRemove} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Content Body */}
      <div className="p-0">
        {/* State: Idle */}
        {docState.status === 'idle' && (
           <div
              onClick={triggerUpload}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`h-32 flex flex-col items-center justify-center text-gray-300 cursor-pointer transition-colors border-b border-dashed ${
                isDragging
                  ? 'bg-blue-50 border-blue-300 text-blue-500'
                  : 'border-transparent hover:border-gray-200 hover:bg-gray-50'
              }`}
           >
              <Upload className={`w-8 h-8 mb-2 ${isDragging ? 'opacity-100 scale-110' : 'opacity-50'} transition-all`} />
              <span className="text-sm">{isDragging ? '파일을 여기에 놓으세요' : '클릭하여 파일 선택 또는 드래그'}</span>
           </div>
        )}

        {/* State: Scanning */}
        {docState.status === 'scanning' && (
          <div className="h-48 flex flex-col items-center justify-center text-blue-600">
            <Loader2 className="w-8 h-8 animate-spin mb-3" />
            <span className="text-sm font-medium">텍스트 추출 및 분석 중...</span>
          </div>
        )}

        {/* State: Error */}
        {docState.status === 'error' && (
          <div className="h-48 flex flex-col items-center justify-center text-red-600">
            <AlertCircle className="w-8 h-8 mb-2" />
            <span className="text-sm font-medium mb-4">인식에 실패했습니다.</span>
            <button onClick={triggerUpload} className="text-xs bg-white border border-red-200 px-4 py-2 rounded-lg hover:bg-red-50">
              다시 시도하기
            </button>
          </div>
        )}

        {/* State: Complete (Split View) */}
        {docState.status === 'complete' && docState.extractedData && (
          <div className="flex flex-col lg:flex-row h-auto lg:h-[400px]">
             {/* Left: Image Preview */}
             <div className="w-full lg:w-1/2 bg-slate-900 flex items-center justify-center relative group overflow-hidden">
                {docState.previewUrl && (
                  <img 
                    src={docState.previewUrl} 
                    alt="Document Preview" 
                    className={`w-full h-full transition-transform duration-300 ${isZoomed ? 'scale-150 cursor-move object-cover' : 'object-contain'}`}
                  />
                )}
                
                {/* Image Controls */}
                <div className="absolute bottom-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                   <button 
                      onClick={() => setIsZoomed(!isZoomed)}
                      className="p-2 bg-black/50 text-white rounded-lg hover:bg-black/70 backdrop-blur-sm"
                      title="확대/축소"
                   >
                      {isZoomed ? <Maximize2 className="w-4 h-4" /> : <ZoomIn className="w-4 h-4" />}
                   </button>
                </div>
                <div className="absolute top-4 left-4 bg-black/50 text-white text-xs px-3 py-1 rounded-full backdrop-blur-sm">
                   원본 이미지
                </div>
             </div>

             {/* Right: Form Data */}
             <div className="w-full lg:w-1/2 p-6 overflow-y-auto bg-white border-l border-gray-100">
                <div className="flex items-center justify-between mb-4">
                   <h4 className="font-bold text-gray-800 text-sm">인식 결과 확인 및 수정</h4>
                   <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded font-medium">편집 가능</span>
                </div>
                
                <div className="space-y-4">
                  {Object.entries(docState.extractedData).map(([key, value]) => (
                    <div key={key} className="relative">
                      <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5 ml-1">
                        {key}
                      </label>
                      <input 
                          type="text"
                          value={value}
                          onChange={(e) => onUpdateField(key, e.target.value)}
                          className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none bg-gray-50/50 hover:bg-white focus:bg-white font-medium text-gray-700 transition-all"
                      />
                    </div>
                  ))}
                </div>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DocumentCard;