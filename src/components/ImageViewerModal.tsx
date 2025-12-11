import type { UploadedDocument } from '../types'
import { DOCUMENT_TYPE_LABELS, DOCUMENT_STATUS_LABELS } from '../types'

interface ImageViewerModalProps {
  image: UploadedDocument
  onClose: () => void
  onDelete?: () => void
  showDelete?: boolean
}

export default function ImageViewerModal({
  image,
  onClose,
  onDelete,
  showDelete = true,
}: ImageViewerModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
      {/* 닫기 버튼 */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white hover:text-gray-300 z-10"
      >
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* 이미지 */}
      <div className="relative max-w-[90vw] max-h-[90vh] flex flex-col">
        <img
          src={image.fileUrl}
          alt={image.fileName}
          className="max-w-full max-h-[80vh] object-contain rounded-lg"
        />

        {/* 하단 정보 및 버튼 */}
        <div className="mt-4 bg-white/10 backdrop-blur-sm rounded-lg p-4 flex items-center justify-between">
          <div className="text-white">
            <p className="font-medium">{image.fileName}</p>
            <div className="flex items-center space-x-3 mt-1 text-sm text-gray-300">
              {image.type && (
                <span className="px-2 py-0.5 bg-primary rounded">
                  {DOCUMENT_TYPE_LABELS[image.type]}
                </span>
              )}
              <span className={`px-2 py-0.5 rounded ${
                image.status === 'valid' ? 'bg-green-600' :
                image.status === 'invalid' || image.status === 'expired' ? 'bg-red-600' :
                image.status === 'processing' ? 'bg-yellow-600' : 'bg-gray-600'
              }`}>
                {DOCUMENT_STATUS_LABELS[image.status]}
              </span>
            </div>
          </div>

          {showDelete && onDelete && (
            <button
              onClick={onDelete}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              <span>삭제</span>
            </button>
          )}
        </div>
      </div>

      {/* 배경 클릭시 닫기 */}
      <div
        className="absolute inset-0 -z-10"
        onClick={onClose}
      />
    </div>
  )
}
