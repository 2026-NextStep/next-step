import { useState, forwardRef, useImperativeHandle } from 'react'

const CONDITIONS = [
  { label: '8자 이상', test: (pw) => pw.length >= 8 },
  { label: '영문 포함', test: (pw) => /[a-zA-Z]/.test(pw) },
  { label: '숫자 포함', test: (pw) => /[0-9]/.test(pw) },
  { label: '특수문자 포함', test: (pw) => /[^a-zA-Z0-9]/.test(pw) },
]

const PasswordChangeForm = forwardRef(function PasswordChangeForm(
  _,
  ref,
) {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [newPasswordConfirm, setNewPasswordConfirm] = useState('')

  const isEmpty = !currentPassword && !newPassword && !newPasswordConfirm
  const allConditionsMet = CONDITIONS.every(({ test }) => test(newPassword))
  const isMatch = newPassword === newPasswordConfirm

  useImperativeHandle(
    ref,
    () => ({
      tryGetValues: () => {
        if (isEmpty) return null
        if (!currentPassword || !allConditionsMet || !isMatch) return null
        return { currentPassword, newPassword, newPasswordConfirm }
      },
      getValidationError: () => {
        if (isEmpty) return null
        if (!currentPassword) return 'noCurrentPw'
        if (!allConditionsMet) return 'conditions'
        if (!isMatch) return 'mismatch'
        return null
      },
      reset: () => {
        setCurrentPassword('')
        setNewPassword('')
        setNewPasswordConfirm('')
      },
    }),
    [isEmpty, currentPassword, newPassword, newPasswordConfirm, allConditionsMet, isMatch],
  )

  const showConditions = newPassword.length > 0
  const showConfirmError = newPasswordConfirm.length > 0 && !isMatch
  const showConfirmOk = newPasswordConfirm.length > 0 && isMatch

  return (
    <div className="mt-7 pt-7 border-t border-gray-100">
      <h3 className="text-sm font-semibold text-gray-800 mb-5">비밀번호 변경</h3>

      <div className="space-y-4">
        {/* 현재 비밀번호 */}
        <div>
          <label className="block text-xs text-gray-500 mb-1.5">현재 비밀번호</label>
          <input
            type="password"
            autoComplete="new-password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder="현재 비밀번호를 입력해주세요"
            className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* 새 비밀번호 */}
        <div>
          <label className="block text-xs text-gray-500 mb-1.5">새 비밀번호</label>
          <input
            type="password"
            autoComplete="new-password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="영문, 숫자, 특수문자 조합 8자 이상"
            className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          {showConditions && (
            <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1">
              {CONDITIONS.map(({ label, test }) => {
                const met = test(newPassword)
                return (
                  <p
                    key={label}
                    className={`flex items-center gap-1 text-xs transition-colors ${
                      met ? 'text-green-600' : 'text-gray-400'
                    }`}
                  >
                    <span className="font-bold">{met ? '✓' : '✗'}</span>
                    {label}
                  </p>
                )
              })}
            </div>
          )}
        </div>

        {/* 새 비밀번호 확인 */}
        <div>
          <label className="block text-xs text-gray-500 mb-1.5">새 비밀번호 확인</label>
          <input
            type="password"
            autoComplete="new-password"
            value={newPasswordConfirm}
            onChange={(e) => setNewPasswordConfirm(e.target.value)}
            placeholder="새 비밀번호를 다시 입력해주세요"
            className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          {showConfirmError && (
            <p className="mt-1.5 text-xs text-red-500">비밀번호가 일치하지 않습니다</p>
          )}
          {showConfirmOk && (
            <p className="mt-1.5 text-xs text-green-600">비밀번호가 일치합니다</p>
          )}
        </div>
      </div>
    </div>
  )
})

export default PasswordChangeForm
