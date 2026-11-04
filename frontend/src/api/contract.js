import axiosInstance from './axiosInstance'
import { mockContractAnalysis } from '../mocks/contractResult'
import { USE_MOCK } from './config'

// mock 모드에서 업로드한 파일명을 결과 화면에 그대로 보여주기 위해 보관
const MOCK_FILE_NAME_KEY = 'mockContractFileName'

export async function getContractAnalysis(id, signal) {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 500))
    if (id !== '1') throw new Error('not found')
    const uploadedName = sessionStorage.getItem(MOCK_FILE_NAME_KEY)
    return uploadedName ? { ...mockContractAnalysis, fileName: uploadedName } : mockContractAnalysis
  }
  const { data } = await axiosInstance.get(`/contracts/${id}/analysis`, { signal })
  return data
}

export async function uploadContract(file, onProgress) {
  if (USE_MOCK) {
    sessionStorage.setItem(MOCK_FILE_NAME_KEY, file.name)
    return new Promise((resolve) => {
      const steps = [0, 30, 60, 100]
      let i = 0
      const tick = () => {
        onProgress?.(steps[i])
        i++
        if (i < steps.length) {
          setTimeout(tick, 600)
        } else {
          setTimeout(() => resolve({ contractId: 1 }), 300)
        }
      }
      setTimeout(tick, 200)
    })
  }
  const form = new FormData()
  form.append('file', file)
  const { data } = await axiosInstance.post(
    '/contracts/analyze',
    form,
    {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (e) => {
        if (e.total) onProgress?.(Math.round((e.loaded / e.total) * 100))
      },
    },
  )
  return data
}

export async function deleteContract(contractId) {
  if (USE_MOCK) return Promise.resolve()
  return axiosInstance.delete(`/contracts/${contractId}`)
}

export async function getActiveContract() {
  if (USE_MOCK) return null
  const response = await axiosInstance.get('/contracts/active')
  return response.status === 204 ? null : response.data.contractId
}