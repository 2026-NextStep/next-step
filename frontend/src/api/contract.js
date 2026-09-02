import axiosInstance from './axiosInstance'
import { mockContractAnalysis } from '../mocks/contractResult'
import { USE_MOCK } from './config'

export async function getContractAnalysis(id, signal) {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 500))
    if (id !== '1') throw new Error('not found')
    return mockContractAnalysis
  }
  const { data } = await axiosInstance.get(`/contracts/${id}/analysis`, { signal })
  return data
}

export async function uploadContract(file, onProgress) {
  if (USE_MOCK) {
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