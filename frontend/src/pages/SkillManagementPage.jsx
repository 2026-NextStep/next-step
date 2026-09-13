import { useState } from 'react'
import { ArrowLeft, Pencil, Plus, Trash2, Wrench } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { INITIAL_SKILLS, PROFICIENCY_OPTIONS } from '../mocks/careerProfile'

const EMPTY_FORM = { name: '', proficiency: '초급' }

export default function SkillManagementPage() {
  const navigate = useNavigate()
  const [skills, setSkills] = useState(() => INITIAL_SKILLS.map((skill) => ({ ...skill })))
  const [form, setForm] = useState(EMPTY_FORM)
  const [editingId, setEditingId] = useState(null)
  const [isFormOpen, setIsFormOpen] = useState(false)

  const openCreateForm = () => {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setIsFormOpen(true)
  }

  const openEditForm = (skill) => {
    setEditingId(skill.id)
    setForm({ name: skill.name, proficiency: skill.proficiency })
    setIsFormOpen(true)
  }

  const closeForm = () => {
    setIsFormOpen(false)
    setEditingId(null)
    setForm(EMPTY_FORM)
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    const name = form.name.trim()
    if (!name) return

    if (editingId !== null) {
      setSkills((current) => current.map((skill) => (
        skill.id === editingId ? { ...skill, name, proficiency: form.proficiency } : skill
      )))
    } else {
      setSkills((current) => [...current, { id: Date.now(), name, proficiency: form.proficiency }])
    }
    closeForm()
  }

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-8">
      <main className="mx-auto max-w-screen-lg">
        <button
          type="button"
          onClick={() => navigate('/mypage')}
          className="mb-5 flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft size={16} /> 마이페이지로 돌아가기
        </button>

        <section className="rounded-2xl bg-white p-7 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold text-gray-900">보유 역량 관리</h1>
              <p className="mt-1 text-sm text-gray-400">직무와 관련된 기술과 현재 숙련도를 정리해보세요.</p>
            </div>
            <button
              type="button"
              onClick={openCreateForm}
              className="flex shrink-0 items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              <Plus size={16} /> 역량 추가
            </button>
          </div>

          <div className="mt-7">
            {skills.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gray-200 py-14 text-center">
                <Wrench className="mx-auto text-gray-300" size={36} />
                <p className="mt-3 text-sm font-medium text-gray-600">등록된 역량이 없습니다.</p>
                <p className="mt-1 text-xs text-gray-400">첫 번째 보유 역량을 추가해보세요.</p>
                <button type="button" onClick={openCreateForm} className="mt-4 text-sm font-medium text-blue-600">
                  역량 추가하기
                </button>
              </div>
            ) : (
              <div className="divide-y divide-gray-100 rounded-xl border border-gray-100">
                {skills.map((skill) => (
                  <div key={skill.id} className="flex items-center justify-between gap-4 px-5 py-4">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-gray-900">{skill.name}</p>
                      <span className="mt-1 inline-block rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-600">
                        {skill.proficiency}
                      </span>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <button type="button" onClick={() => openEditForm(skill)} className="rounded-lg p-2 text-gray-400 hover:bg-gray-50 hover:text-blue-600" aria-label={`${skill.name} 수정`}>
                        <Pencil size={16} />
                      </button>
                      <button type="button" onClick={() => setSkills((current) => current.filter((item) => item.id !== skill.id))} className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-500" aria-label={`${skill.name} 삭제`}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <p className="mt-5 text-xs text-gray-400">현재 화면에서 변경한 내용은 새로고침하면 초기화됩니다. 저장 API는 추후 연결 예정입니다.</p>
        </section>
      </main>

      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4" role="presentation" onMouseDown={closeForm}>
          <form className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl" onSubmit={handleSubmit} onMouseDown={(event) => event.stopPropagation()}>
            <h2 className="text-lg font-bold text-gray-900">{editingId !== null ? '역량 수정' : '역량 추가'}</h2>
            <div className="mt-5">
              <label htmlFor="skill-name" className="mb-1.5 block text-xs font-medium text-gray-600">역량명</label>
              <input
                id="skill-name"
                value={form.name}
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                placeholder="예: Spring Boot"
                className="w-full rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                autoFocus
              />
            </div>
            <div className="mt-4">
              <label htmlFor="skill-proficiency" className="mb-1.5 block text-xs font-medium text-gray-600">숙련도</label>
              <select
                id="skill-proficiency"
                value={form.proficiency}
                onChange={(event) => setForm((current) => ({ ...current, proficiency: event.target.value }))}
                className="w-full rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm outline-none focus:border-blue-500"
              >
                {PROFICIENCY_OPTIONS.map((option) => <option key={option}>{option}</option>)}
              </select>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button type="button" onClick={closeForm} className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">취소</button>
              <button type="submit" disabled={!form.name.trim()} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300">저장</button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
