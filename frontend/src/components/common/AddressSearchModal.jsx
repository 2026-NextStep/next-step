import { useEffect } from 'react'
import { X } from 'lucide-react'
import DaumPostcodeEmbed from 'react-daum-postcode'

export default function AddressSearchModal({ isOpen, onComplete, onClose }) {
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  useEffect(() => {
    if (!isOpen) return
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  if (!isOpen) return null

  const handleComplete = (data) => {
    onComplete(data.roadAddress || data.address)
    onClose()
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl max-w-md w-full mx-4 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900">주소 검색</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="닫기"
          >
            <X size={18} />
          </button>
        </div>
        <DaumPostcodeEmbed
          onComplete={handleComplete}
          style={{ height: 450 }}
        />
      </div>
    </div>
  )
}
