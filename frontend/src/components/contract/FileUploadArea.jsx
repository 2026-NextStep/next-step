import { useRef, useState } from 'react'

const ACCEPTED_MIME = ['application/pdf', 'image/jpeg', 'image/png']
const MAX_BYTES = 10 * 1024 * 1024

function validate(file) {
  if (!ACCEPTED_MIME.includes(file.type))
    return 'PDF, JPG, PNG 파일만 업로드 가능합니다'
  if (file.size > MAX_BYTES)
    return '파일 크기는 10MB 이하여야 합니다'
  return null
}

export default function FileUploadArea({ onFileSelect, selectedFile, onError }) {
  const [isDragging, setIsDragging] = useState(false)
  const inputRef = useRef(null)

  const handleFile = (file) => {
    const err = validate(file)
    if (err) {
      onError ? onError(err) : alert(err)
      return
    }
    onFileSelect(file)
  }

  const onDragOver = (e) => { e.preventDefault(); setIsDragging(true) }
  const onDragLeave = (e) => { e.preventDefault(); setIsDragging(false) }
  const onDrop = (e) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => inputRef.current?.click()}
      onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      className={`cursor-pointer select-none border-2 border-dashed rounded-2xl py-14 flex flex-col items-center gap-4 transition-colors ${
        isDragging
          ? 'border-blue-400 bg-blue-50'
          : 'border-gray-200 bg-gray-50 hover:border-blue-300 hover:bg-blue-50/30'
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) handleFile(f)
          e.target.value = ''
        }}
        onClick={(e) => e.stopPropagation()}
      />

      <div className="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center">
        <svg
          width="26" height="26" viewBox="0 0 24 24"
          fill="none" stroke="#3b82f6" strokeWidth="2"
          strokeLinecap="round" strokeLinejoin="round"
        >
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="12" y1="18" x2="12" y2="12" />
          <polyline points="9 15 12 12 15 15" />
        </svg>
      </div>

      {selectedFile ? (
        <p className="text-sm font-semibold text-blue-600 px-6 text-center break-all">
          {selectedFile.name}
        </p>
      ) : (
        <>
          <div className="text-center">
            <p className="text-base font-semibold text-gray-800">
              클릭하여 파일 업로드 또는 드래그 앤 드롭
            </p>
            <p className="text-sm text-gray-400 mt-1.5">
              지원 파일 형식: PDF, JPG, PNG (최대 10MB)
            </p>
          </div>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); inputRef.current?.click() }}
            className="border border-gray-300 rounded-md px-5 py-1.5 text-sm text-gray-600 bg-white hover:bg-gray-50 transition-colors"
          >
            파일 선택
          </button>
        </>
      )}
    </div>
  )
}