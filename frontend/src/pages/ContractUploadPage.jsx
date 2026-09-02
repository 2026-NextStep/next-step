import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { FileText, X, Loader2 } from 'lucide-react'
import FileUploadArea from '../components/contract/FileUploadArea'
import ProcessStepCard from '../components/contract/ProcessStepCard'
import { uploadContract } from '../api/contract'

function formatFileSize(bytes) {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${Math.round(bytes / 1024)} KB`
}

const FILE_TYPE_LABEL = {
  'application/pdf': 'PDF',
  'image/jpeg': 'JPG',
  'image/png': 'PNG',
}

function FilePreviewCard({ file, onRemove, disabled }) {
  const typeLabel =
    FILE_TYPE_LABEL[file.type] ??
    file.name.split('.').pop()?.toUpperCase() ??
    'FILE'

  return (
    <div className="mt-3 flex items-center gap-3 bg-gray-50 border border-gray-100 rounded-xl px-4 py-3">
      <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
        <FileText size={18} className="text-blue-500" />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-800 truncate">{file.name}</p>
        <p className="text-xs text-gray-400 mt-0.5">{formatFileSize(file.size)}</p>
      </div>

      <span className="shrink-0 text-xs font-semibold text-blue-500 bg-blue-50 px-2 py-0.5 rounded-md">
        {typeLabel}
      </span>

      <button
        type="button"
        onClick={onRemove}
        disabled={disabled}
        aria-label="파일 제거"
        className={`shrink-0 w-7 h-7 flex items-center justify-center rounded-full transition-colors ${disabled ? 'text-gray-300 cursor-not-allowed' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-200'}`}
      >
        <X size={14} />
      </button>
    </div>
  )
}

function IconUpload() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  )
}

function IconOcr() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 7V5a2 2 0 0 1 2-2h2" />
      <path d="M17 3h2a2 2 0 0 1 2 2v2" />
      <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
      <path d="M7 21H5a2 2 0 0 1-2-2v-2" />
      <path d="M7 12h10" />
      <path d="M7 8h4" />
      <path d="M7 16h6" />
    </svg>
  )
}

function IconAi() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="4" width="16" height="16" rx="2" />
      <rect x="9" y="9" width="6" height="6" />
      <path d="M9 2v2M15 2v2M9 20v2M15 20v2M2 9h2M2 15h2M20 9h2M20 15h2" />
    </svg>
  )
}

function IconResult() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <polyline points="9 15 11 17 15 13" />
    </svg>
  )
}

const STEPS = [
  {
    step: '01',
    title: '계약서 업로드',
    description: '서명 전 또는 서명된 근로계약서 파일을 업로드합니다.',
    icon: <IconUpload />,
  },
  {
    step: '02',
    title: 'OCR 텍스트 추출',
    description: '이미지나 PDF에서 텍스트와 구조를 자동으로 추출합니다.',
    icon: <IconOcr />,
  },
  {
    step: '03',
    title: 'AI 위험도 분석',
    description: '독소조항 탐지, 실수령액 계산 등 상세 분석을 진행합니다.',
    icon: <IconAi />,
  },
  {
    step: '04',
    title: '결과 확인',
    description: '분석 리포트를 통해 안전한 근로계약인지 확인합니다.',
    icon: <IconResult />,
  },
]

export default function ContractUploadPage() {
  const [file, setFile] = useState(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [currentStep, setCurrentStep] = useState(null)
  const [fileError, setFileError] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    if (!isUploading) return
    const handler = (e) => {
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [isUploading])

  const handleFileSelect = (f) => {
    setFileError(null)
    setFile(f)
  }

  const handleAnalyze = async () => {
    if (!file || isUploading) return
    setIsUploading(true)
    setCurrentStep('uploading')
    setUploadProgress(0)
    try {
      const response = await uploadContract(file, (p) => setUploadProgress(p))
      setCurrentStep('analyzing')
      const contractId = response.contractId
      navigate(`/contract/result/${contractId}`)
    } catch (error) {
      alert(error.response?.data?.message || '업로드 중 오류가 발생했습니다.')
      setIsUploading(false)
      setCurrentStep(null)
      setUploadProgress(0)
    }
  }


  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="py-16 px-4">

        {/* 히어로 */}
        <div className="text-center mb-10">
          <span className="inline-block text-sm text-gray-500 border border-gray-200 bg-white rounded-full px-4 py-1 mb-5">
            AI 근로계약서 분석
          </span>
          <h1 className="text-[2rem] font-bold text-gray-900 leading-tight mb-4">
            서명하기 전, 꼼꼼하게 확인하세요
          </h1>
          <p className="text-sm text-gray-500 leading-relaxed">
            업로드된 근로계약서의 독소조항, 실수령액, 필수 확인 사항을 AI가 분석해 드립니다.
          </p>
        </div>

        {/* 업로드 카드 */}
        <div className="max-w-xl mx-auto">
          <div className="bg-white rounded-2xl shadow-sm p-8">
            <div className={isUploading ? 'pointer-events-none opacity-60' : ''}>
              <FileUploadArea
                onFileSelect={handleFileSelect}
                selectedFile={file}
                onError={setFileError}
              />
            </div>

            {fileError && (
              <p className="mt-2 flex items-center gap-1.5 text-sm text-red-500">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                {fileError}
              </p>
            )}

            {file && (
              <FilePreviewCard file={file} onRemove={() => setFile(null)} disabled={isUploading} />
            )}

            {currentStep === 'uploading' ? (
              <div className="w-full mt-5">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="font-medium text-gray-700">파일 업로드 중...</span>
                  <span className="font-semibold text-blue-600">{uploadProgress}%</span>
                </div>
                <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full transition-all duration-300 ease-out"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            ) : currentStep === 'analyzing' ? (
              <div className="w-full mt-5 flex flex-col items-center gap-2 py-2">
                <div className="flex items-center gap-2.5 text-gray-700">
                  <Loader2 size={18} className="animate-spin text-blue-500" />
                  <span className="text-sm font-medium">계약서 분석 중...</span>
                </div>
                <p className="text-xs text-gray-400">잠시만 기다려주세요. 약 1~2분 정도 소요됩니다.</p>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleAnalyze}
                disabled={!file}
                className="w-full mt-5 flex items-center justify-center gap-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-200 disabled:cursor-not-allowed text-white rounded-xl py-4 text-base font-semibold transition-colors"
              >
                <svg
                  width="18" height="18" viewBox="0 0 24 24"
                  fill="none" stroke="currentColor" strokeWidth="2"
                  strokeLinecap="round" strokeLinejoin="round"
                >
                  <path d="M23 4v6h-6" />
                  <path d="M1 20v-6h6" />
                  <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                </svg>
                OCR 텍스트 추출 및 AI 분석 시작하기
              </button>
            )}

            <div className="mt-4 bg-gray-50 rounded-xl px-5 py-4 space-y-2.5">
              <div className="flex items-center gap-2.5 text-xs text-gray-500">
                <svg
                  width="15" height="15" viewBox="0 0 24 24"
                  fill="none" stroke="#60a5fa" strokeWidth="2"
                  strokeLinecap="round" strokeLinejoin="round"
                  className="shrink-0"
                >
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  <polyline points="9 12 11 14 15 10" />
                </svg>
                업로드된 파일은 분석 결과 페이지를 벗어나면 즉시 파기됩니다.
              </div>
              <div className="flex items-center gap-2.5 text-xs text-gray-500">
                <svg
                  width="15" height="15" viewBox="0 0 24 24"
                  fill="none" stroke="#60a5fa" strokeWidth="2"
                  strokeLinecap="round" strokeLinejoin="round"
                  className="shrink-0"
                >
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                텍스트 추출 및 AI 분석에는 약 1~2분이 소요될 수 있습니다.
              </div>
            </div>
          </div>
        </div>

        {/* 분석 진행 과정 */}
        <div className="max-w-3xl mx-auto mt-20">
          <h2 className="text-xl font-bold text-gray-900 text-center mb-8">
            분석 진행 과정
          </h2>
          <div className="grid grid-cols-4 gap-4">
            {STEPS.map((s) => (
              <ProcessStepCard key={s.step} {...s} />
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}