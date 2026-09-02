import { useEffect } from 'react'
import { AlertTriangle } from 'lucide-react'

export default function ConfirmModal({
  isOpen,
  title,
  message,
  confirmText = '확인',
  cancelText = '취소',
  onConfirm,
  onCancel,
  variant = 'warning',
  isLoading = false,
}) {
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !isLoading) onCancel()
    }

    document.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [isOpen, isLoading, onCancel])

  if (!isOpen) return null

  const iconColor = variant === 'danger' ? 'text-red-500' : 'text-amber-500'
  const confirmColor =
    variant === 'danger'
      ? 'bg-red-500 hover:bg-red-600 disabled:bg-red-300'
      : 'bg-amber-500 hover:bg-amber-600 disabled:bg-amber-300'

  const handleBackdropClick = () => {
    if (!isLoading) onCancel()
  }

  return (
    <div
      className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center"
      onClick={handleBackdropClick}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-modal-title"
        className="bg-white rounded-2xl shadow-xl max-w-sm w-full mx-4 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2">
          <AlertTriangle size={20} className={iconColor} />
          <h2 id="confirm-modal-title" className="text-lg font-bold text-gray-900">
            {title}
          </h2>
        </div>

        <p className="text-sm text-gray-600 leading-relaxed mt-3 whitespace-pre-line">
          {message}
        </p>

        <div className="flex gap-2 mt-6">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1 py-3 rounded-xl text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`flex-1 py-3 rounded-xl text-sm font-semibold text-white disabled:cursor-not-allowed transition-colors ${confirmColor}`}
          >
            {isLoading ? '처리 중...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}