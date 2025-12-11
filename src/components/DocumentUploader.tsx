import { useCallback, useState } from 'react'
import { DOCUMENT_TYPE_LABELS } from '../types'
import type { UploadedDocument } from '../types'

interface DocumentUploaderProps {
  onUpload: (files: File[]) => void
  documents: UploadedDocument[]
  disabled?: boolean
  onImageClick?: (doc: UploadedDocument) => void
  onDelete?: (docId: string) => void
}

export default function DocumentUploader({
  onUpload,
  documents,
  disabled,
  onImageClick,
  onDelete,
}: DocumentUploaderProps) {
  const [isDragging, setIsDragging] = useState(false)

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)

      if (disabled) return

      const files = Array.from(e.dataTransfer.files).filter((file) =>
        file.type.startsWith('image/') || file.type === 'application/pdf'
      )

      if (files.length > 0) {
        onUpload(files)
      }
    },
    [onUpload, disabled]
  )

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (disabled || !e.target.files) return

      const files = Array.from(e.target.files)
      if (files.length > 0) {
        onUpload(files)
      }

      // 같은 파일 재선택 가능하도록 초기화
      e.target.value = ''
    },
    [onUpload, disabled]
  )

  const handleDeleteClick = useCallback(
    (e: React.MouseEvent, docId: string) => {
      e.stopPropagation()
      if (onDelete) {
        onDelete(docId)
      }
    },
    [onDelete]
  )

  const requiredDocs = Object.entries(DOCUMENT_TYPE_LABELS)

  return (
    <div className="space-y-6">
      {/* 필수 서류 안내 */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-2">필수 제출 서류</h4>
        <ul className="grid grid-cols-2 gap-2 text-sm text-blue-800">
          {requiredDocs.map(([type, label]) => {
            const isUploaded = documents.some((doc) => doc.type === type)
            return (
              <li key={type} className="flex items-center space-x-2">
                {isUploaded ? (
                  <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                )}
                <span className={isUploaded ? 'text-green-700' : ''}>{label}</span>
              </li>
            )
          })}
        </ul>
        <p className="mt-2 text-xs text-blue-600">
          * 개인사업자의 경우 사업자등록증이 추가로 필요합니다.
        </p>
      </div>

      {/* 드래그 앤 드롭 영역 */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center transition-colors
          ${isDragging ? 'border-primary bg-blue-50' : 'border-gray-300 hover:border-primary'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
      >
        <input
          type="file"
          id="file-upload"
          className="hidden"
          multiple
          accept="image/*,.pdf"
          onChange={handleFileSelect}
          disabled={disabled}
        />
        <label
          htmlFor="file-upload"
          className={`flex flex-col items-center ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
        >
          <svg
            className="w-12 h-12 text-gray-400 mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>
          <p className="text-gray-700 font-medium mb-1">
            서류 이미지를 드래그하거나 클릭하여 업로드
          </p>
          <p className="text-sm text-gray-500">
            여러 장의 서류를 한 번에 업로드할 수 있습니다.
          </p>
          <p className="text-xs text-gray-400 mt-2">
            지원 형식: JPG, PNG, PDF
          </p>
        </label>
      </div>

      {/* 업로드된 서류 목록 */}
      {documents.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-medium text-gray-900">업로드된 서류 ({documents.length}건)</h4>
          <p className="text-xs text-gray-500">이미지를 클릭하면 크게 볼 수 있습니다.</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {documents.map((doc) => (
              <div
                key={doc.id}
                onClick={() => onImageClick?.(doc)}
                className="relative group bg-gray-100 rounded-lg overflow-hidden aspect-[3/4] cursor-pointer hover:ring-2 hover:ring-primary transition-all"
              >
                <img
                  src={doc.fileUrl}
                  alt={doc.fileName}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <svg className="w-8 h-8 text-white mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                  </svg>
                  <span className="text-white text-xs text-center px-2">
                    {doc.fileName}
                  </span>
                  {doc.type && (
                    <span className="mt-1 px-2 py-0.5 bg-primary text-white text-xs rounded">
                      {DOCUMENT_TYPE_LABELS[doc.type]}
                    </span>
                  )}
                </div>

                {/* 삭제 버튼 */}
                {onDelete && (
                  <button
                    onClick={(e) => handleDeleteClick(e, doc.id)}
                    className="absolute top-2 left-2 w-6 h-6 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center hover:bg-red-600"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}

                {/* 상태 배지 */}
                <div className="absolute top-2 right-2">
                  {doc.status === 'processing' && (
                    <span className="flex items-center px-2 py-1 bg-yellow-500 text-white text-xs rounded">
                      <svg className="animate-spin -ml-1 mr-1 h-3 w-3" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      처리중
                    </span>
                  )}
                  {doc.status === 'valid' && (
                    <span className="px-2 py-1 bg-green-500 text-white text-xs rounded">
                      확인완료
                    </span>
                  )}
                  {doc.status === 'invalid' && (
                    <span className="px-2 py-1 bg-red-500 text-white text-xs rounded">
                      오류
                    </span>
                  )}
                  {doc.status === 'pending' && (
                    <span className="px-2 py-1 bg-gray-500 text-white text-xs rounded">
                      대기중
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
