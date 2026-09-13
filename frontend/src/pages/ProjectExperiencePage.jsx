import { useState } from 'react'
import { ArrowLeft, FolderKanban, Pencil, Plus, Trash2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { INITIAL_PROJECTS } from '../mocks/careerProfile'

const EMPTY_FORM = { name: '', role: '', technologies: '', description: '' }

export default function ProjectExperiencePage() {
  const navigate = useNavigate()
  const [projects, setProjects] = useState(() => INITIAL_PROJECTS.map((project) => ({ ...project })))
  const [form, setForm] = useState(EMPTY_FORM)
  const [editingId, setEditingId] = useState(null)
  const [isFormOpen, setIsFormOpen] = useState(false)

  const openCreateForm = () => {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setIsFormOpen(true)
  }

  const openEditForm = (project) => {
    setEditingId(project.id)
    setForm({
      name: project.name,
      role: project.role,
      technologies: project.technologies,
      description: project.description,
    })
    setIsFormOpen(true)
  }

  const closeForm = () => {
    setIsFormOpen(false)
    setEditingId(null)
    setForm(EMPTY_FORM)
  }

  const updateField = (field, value) => setForm((current) => ({ ...current, [field]: value }))

  const handleSubmit = (event) => {
    event.preventDefault()
    const nextProject = {
      name: form.name.trim(),
      role: form.role.trim(),
      technologies: form.technologies.trim(),
      description: form.description.trim(),
    }
    if (!nextProject.name) return

    if (editingId !== null) {
      setProjects((current) => current.map((project) => (
        project.id === editingId ? { ...project, ...nextProject } : project
      )))
    } else {
      setProjects((current) => [...current, { id: Date.now(), ...nextProject }])
    }
    closeForm()
  }

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-8">
      <main className="mx-auto max-w-screen-lg">
        <button type="button" onClick={() => navigate('/mypage')} className="mb-5 flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700">
          <ArrowLeft size={16} /> 마이페이지로 돌아가기
        </button>

        <section className="rounded-2xl bg-white p-7 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold text-gray-900">프로젝트 경험 관리</h1>
              <p className="mt-1 text-sm text-gray-400">직무 역량을 보여줄 수 있는 프로젝트 경험을 정리해보세요.</p>
            </div>
            <button type="button" onClick={openCreateForm} className="flex shrink-0 items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
              <Plus size={16} /> 경험 추가
            </button>
          </div>

          <div className="mt-7">
            {projects.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gray-200 py-14 text-center">
                <FolderKanban className="mx-auto text-gray-300" size={38} />
                <p className="mt-3 text-sm font-medium text-gray-600">등록된 프로젝트 경험이 없습니다.</p>
                <p className="mt-1 text-xs text-gray-400">수업, 팀 프로젝트, 개인 프로젝트도 좋아요.</p>
                <button type="button" onClick={openCreateForm} className="mt-4 text-sm font-medium text-blue-600">경험 추가하기</button>
              </div>
            ) : (
              <div className="space-y-3">
                {projects.map((project) => (
                  <article key={project.id} className="rounded-xl border border-gray-100 p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <h2 className="text-base font-bold text-gray-900">{project.name}</h2>
                        <p className="mt-1 text-sm text-gray-500">{project.role || '역할 미입력'}</p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <button type="button" onClick={() => openEditForm(project)} className="rounded-lg p-2 text-gray-400 hover:bg-gray-50 hover:text-blue-600" aria-label={`${project.name} 수정`}><Pencil size={16} /></button>
                        <button type="button" onClick={() => setProjects((current) => current.filter((item) => item.id !== project.id))} className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-500" aria-label={`${project.name} 삭제`}><Trash2 size={16} /></button>
                      </div>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {(project.technologies || '-').split(',').map((technology) => (
                        <span key={technology} className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-600">{technology.trim()}</span>
                      ))}
                    </div>
                    <p className="mt-4 text-sm leading-6 text-gray-600">{project.description || '설명이 없습니다.'}</p>
                  </article>
                ))}
              </div>
            )}
          </div>
          <p className="mt-5 text-xs text-gray-400">현재 화면에서 변경한 내용은 새로고침하면 초기화됩니다. 저장 API는 추후 연결 예정입니다.</p>
        </section>
      </main>

      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4" role="presentation" onMouseDown={closeForm}>
          <form className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl" onSubmit={handleSubmit} onMouseDown={(event) => event.stopPropagation()}>
            <h2 className="text-lg font-bold text-gray-900">{editingId !== null ? '프로젝트 경험 수정' : '프로젝트 경험 추가'}</h2>
            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="project-name" className="mb-1.5 block text-xs font-medium text-gray-600">프로젝트명</label>
                <input id="project-name" value={form.name} onChange={(event) => updateField('name', event.target.value)} placeholder="예: Next Step" className="w-full rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" autoFocus />
              </div>
              <div>
                <label htmlFor="project-role" className="mb-1.5 block text-xs font-medium text-gray-600">역할</label>
                <input id="project-role" value={form.role} onChange={(event) => updateField('role', event.target.value)} placeholder="예: 프론트엔드 개발" className="w-full rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm outline-none focus:border-blue-500" />
              </div>
            </div>
            <div className="mt-4">
              <label htmlFor="project-technologies" className="mb-1.5 block text-xs font-medium text-gray-600">사용 기술</label>
              <input id="project-technologies" value={form.technologies} onChange={(event) => updateField('technologies', event.target.value)} placeholder="예: React, Spring Boot, MySQL" className="w-full rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm outline-none focus:border-blue-500" />
              <p className="mt-1 text-xs text-gray-400">쉼표로 구분해서 입력해주세요.</p>
            </div>
            <div className="mt-4">
              <label htmlFor="project-description" className="mb-1.5 block text-xs font-medium text-gray-600">간단한 설명</label>
              <textarea id="project-description" value={form.description} onChange={(event) => updateField('description', event.target.value)} rows={4} placeholder="담당한 작업과 결과를 간단하게 작성해주세요." className="w-full resize-none rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm leading-6 outline-none focus:border-blue-500" />
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
