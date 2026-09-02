import { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react'
import { MessageCircle } from 'lucide-react'
import { checkNicknameDuplicate } from '../../api/user'
import { formatPhoneNumber } from '../../utils/format'
import { toImageUrl } from '../../utils/imageUrl'
import { roleToLabel } from '../../utils/roleLabel'
import AddressSearchModal from '../common/AddressSearchModal'

const ROLE_OPTIONS = ["멘토", "멘티", "해당 없음"];

const KakaoUserProfile = forwardRef(function KakaoUserProfile({ user }, ref) {
  const [nickname, setNickname] = useState(user.nickname ?? '')
  const [nicknameStatus, setNicknameStatus] = useState('idle')
  const [mentorRole, setMentorRole] = useState(() => roleToLabel(user.role))
  const [phone, setPhone] = useState(user.phone ?? '')
  const [desiredJob, setDesiredJob] = useState(user.desiredJob ?? '')
  const [address, setAddress] = useState(user.address ?? '')
  const [addressDetail, setAddressDetail] = useState(user.addressDetail ?? '')
  const [previewImage, setPreviewImage] = useState(null)
  const [selectedFile, setSelectedFile] = useState(null)
  const [imageError, setImageError] = useState(false)
  const [pendingDelete, setPendingDelete] = useState(false)
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false)
  const fileInputRef = useRef(null)

  useEffect(() => {
    setImageError(false)
    setPreviewImage(null)
    setSelectedFile(null)
    setPendingDelete(false)
  }, [user.profileImage])

  useImperativeHandle(
    ref,
    () => ({
      getValues: () => ({
        nickname: nickname?.trim() || null,
        phone: phone?.trim() || null,
        desiredJob: desiredJob?.trim() || null,
        address: address?.trim() || null,
        addressDetail: addressDetail?.trim() || null,
        role: mentorRole,
      }),
      isNicknameReady: () => {
        if (nickname.trim() === (user.nickname ?? '').trim()) return true
        return nicknameStatus === 'available'
      },
      getSelectedImageFile: () => selectedFile,
      getImageAction: () => {
        if (pendingDelete) return { type: 'delete', file: null }
        if (selectedFile)  return { type: 'upload', file: selectedFile }
        return { type: 'none', file: null }
      },
      resetImagePreview: () => {
        setPreviewImage(null)
        setSelectedFile(null)
        setPendingDelete(false)
      },
    }),
    [nickname, nicknameStatus, mentorRole, phone, desiredJob, address, addressDetail, user.nickname, selectedFile, pendingDelete],
  )

  const handleNicknameChange = (value) => {
    setNickname(value)
    setNicknameStatus('idle')
  }

  const handleCheckNickname = async () => {
    if (!nickname.trim()) {
      setNicknameStatus('empty')
      return
    }
    setNicknameStatus('checking')
    const result = await checkNicknameDuplicate(nickname)
    setNicknameStatus(result.available ? 'available' : 'taken')
  }

  const handleImageChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      alert('이미지는 5MB 이하만 업로드 가능합니다')
      e.target.value = ''
      return
    }
    const allowed = ['image/jpeg', 'image/jpg', 'image/png']
    if (!allowed.includes(file.type)) {
      alert('JPG, PNG 형식만 업로드 가능합니다')
      e.target.value = ''
      return
    }

    setPendingDelete(false)
    setSelectedFile(file)
    const reader = new FileReader()
    reader.onload = (ev) => setPreviewImage(ev.target.result)
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  const handleDeleteClick = () => {
    setPendingDelete(true)
    setPreviewImage(null)
    setSelectedFile(null)
  }

  const editableClass = 'w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'

  return (
    <div className="flex gap-10">
      {/* 프로필 사진 */}
      <div className="flex flex-col items-center gap-2.5 shrink-0 w-40">
        <input
          type="file"
          accept="image/jpeg,image/jpg,image/png"
          ref={fileInputRef}
          onChange={handleImageChange}
          style={{ display: 'none' }}
        />
        <div className="w-24 h-24 rounded-full bg-gray-100 overflow-hidden flex items-center justify-center border border-gray-200">
          {previewImage && !pendingDelete ? (
            <img src={previewImage} alt="프로필 미리보기" className="w-full h-full object-cover" />
          ) : !pendingDelete && user.profileImage && !imageError ? (
            <img
              src={toImageUrl(user.profileImage)}
              alt="프로필"
              className="w-full h-full object-cover"
              onError={() => setImageError(true)}
            />
          ) : (
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          )}
        </div>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-1.5 text-xs text-gray-500 border border-gray-200 bg-white hover:bg-gray-50 px-3 py-1.5 rounded-lg transition-colors"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
            <circle cx="12" cy="13" r="4" />
          </svg>
          사진 변경
        </button>
        {previewImage && !pendingDelete ? (
          <div className="flex flex-col items-center gap-1">
            <p className="text-xs text-gray-500 text-center leading-snug">
              변경된 이미지는<br />변경사항 저장 시 반영됩니다.
            </p>
            <button
              type="button"
              onClick={() => { setPreviewImage(null); setSelectedFile(null) }}
              className="text-xs text-gray-400 underline hover:text-gray-600 transition-colors"
            >
              취소
            </button>
          </div>
        ) : pendingDelete ? (
          <div className="flex flex-col items-center gap-1">
            <p className="text-xs text-gray-500 text-center leading-snug">
              저장 시 기본 이미지로<br />변경됩니다.
            </p>
            <button
              type="button"
              onClick={() => setPendingDelete(false)}
              className="text-xs text-gray-400 underline hover:text-gray-600 transition-colors"
            >
              취소
            </button>
          </div>
        ) : user.profileImage ? (
          <button
            type="button"
            onClick={handleDeleteClick}
            className="text-xs text-gray-400 underline hover:text-gray-600 transition-colors"
          >
            삭제
          </button>
        ) : null}
      </div>

      {/* 폼 */}
      <div className="flex-1">
        {/* 카카오 안내 박스 */}
        <div className="flex items-start gap-2.5 bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-3 mb-5">
          <MessageCircle size={16} className="text-yellow-500 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-gray-700">카카오톡 연동 계정입니다</p>
            <p className="text-xs text-gray-500 mt-0.5">아이디와 비밀번호는 카카오톡에서 관리됩니다</p>
          </div>
        </div>

        <h3 className="text-sm font-semibold text-gray-800 mb-4">기본 정보</h3>

        {/* 이름 | 닉네임 */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1.5">이름</label>
            <input
              type="text"
              value={user.name ?? ''}
              disabled
              className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm text-gray-400 bg-gray-50 cursor-not-allowed"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1.5">닉네임</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={nickname}
                onChange={(e) => handleNicknameChange(e.target.value)}
                className="flex-1 border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                type="button"
                onClick={handleCheckNickname}
                disabled={nicknameStatus === 'checking'}
                className="shrink-0 px-4 py-2.5 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {nicknameStatus === 'checking' ? '확인 중...' : '중복확인'}
              </button>
            </div>
            {nicknameStatus === 'available' && <p className="mt-1.5 text-xs text-green-600">사용 가능한 닉네임입니다</p>}
            {nicknameStatus === 'taken' && <p className="mt-1.5 text-xs text-red-500">이미 사용 중인 닉네임입니다</p>}
            {nicknameStatus === 'empty' && <p className="mt-1.5 text-xs text-red-500">닉네임을 입력해주세요</p>}
          </div>
        </div>

        {/* 멘토/멘티 여부 | 연락처 */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1.5">멘토/멘티 여부</label>
            <div className="flex gap-2 flex-wrap">
              {ROLE_OPTIONS.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setMentorRole(opt)}
                  className={`px-3 py-2 text-sm font-medium rounded-lg border transition-colors ${
                    mentorRole === opt
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1.5">연락처</label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(formatPhoneNumber(e.target.value))}
              placeholder="010-XXXX-XXXX"
              className={editableClass}
            />
          </div>
        </div>

        {/* 희망 직무 */}
        <div className="mb-4">
          <label className="block text-xs text-gray-500 mb-1.5">희망 직무</label>
          <input
            type="text"
            value={desiredJob}
            onChange={(e) => setDesiredJob(e.target.value)}
            placeholder="예: 프론트엔드 개발자"
            className={editableClass}
          />
        </div>

        {/* 주소 */}
        <div className="mb-4">
          <label className="block text-xs text-gray-500 mb-1.5">주소</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={address}
              readOnly
              placeholder="주소 검색 버튼을 눌러주세요"
              className={`${editableClass} cursor-pointer`}
              onClick={() => setIsAddressModalOpen(true)}
            />
            <button
              type="button"
              onClick={() => setIsAddressModalOpen(true)}
              className="shrink-0 px-4 py-2.5 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors whitespace-nowrap"
            >
              주소 검색
            </button>
          </div>
        </div>

        {/* 상세주소 */}
        <div>
          <label className="block text-xs text-gray-500 mb-1.5">상세주소</label>
          <input
            type="text"
            value={addressDetail}
            onChange={(e) => setAddressDetail(e.target.value)}
            placeholder="동·호수 등"
            className={editableClass}
          />
        </div>
      </div>
      <AddressSearchModal
        isOpen={isAddressModalOpen}
        onClose={() => setIsAddressModalOpen(false)}
        onComplete={(selectedAddress) => setAddress(selectedAddress)}
      />
    </div>
  )
})

export default KakaoUserProfile
