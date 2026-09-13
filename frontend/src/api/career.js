import axiosInstance from './axiosInstance'

export const PROFICIENCY_LABELS = {
  BEGINNER: '입문',
  BASIC: '초급',
  INTERMEDIATE: '중급',
  ADVANCED: '고급',
}

export const PROFICIENCY_VALUES = Object.fromEntries(
  Object.entries(PROFICIENCY_LABELS).map(([value, label]) => [label, value])
)

export async function getSkills() {
  const { data } = await axiosInstance.get('/users/me/skills')
  return data
}

export async function createSkill({ name, proficiency }) {
  const { data } = await axiosInstance.post('/users/me/skills', { name, proficiency })
  return data
}

export async function updateSkill(id, { name, proficiency }) {
  const { data } = await axiosInstance.patch(`/users/me/skills/${id}`, { name, proficiency })
  return data
}

export async function deleteSkill(id) {
  await axiosInstance.delete(`/users/me/skills/${id}`)
}

export async function getProjects() {
  const { data } = await axiosInstance.get('/users/me/projects')
  return data
}

export async function createProject({ name, role, technologies, description }) {
  const { data } = await axiosInstance.post('/users/me/projects', { name, role, technologies, description })
  return data
}

export async function updateProject(id, { name, role, technologies, description }) {
  const { data } = await axiosInstance.patch(`/users/me/projects/${id}`, { name, role, technologies, description })
  return data
}

export async function deleteProject(id) {
  await axiosInstance.delete(`/users/me/projects/${id}`)
}
