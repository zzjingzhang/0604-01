import api from './index'
import { Paper, PageResponse } from '../types'

export const getPapers = (params?: {
  page?: number
  per_page?: number
  subject_id?: number
  keyword?: string
}) => {
  return api.get<PageResponse<Paper>>('/papers', { params })
}

export const getAllPapers = () => {
  return api.get<Paper[]>('/papers/all')
}

export const getPaper = (id: number) => {
  return api.get<Paper>(`/papers/${id}`)
}

export const createPaper = (data: Partial<Paper>) => {
  return api.post<{ id: number; message: string }>('/papers', data)
}

export const updatePaper = (id: number, data: Partial<Paper>) => {
  return api.put<{ message: string }>(`/papers/${id}`, data)
}

export const deletePaper = (id: number) => {
  return api.delete<{ message: string }>(`/papers/${id}`)
}

export const addQuestionsToPaper = (id: number, questions: Array<{ question_id: number; score: number }>) => {
  return api.post<{ message: string }>(`/papers/${id}/questions`, { questions })
}

export const removeQuestionFromPaper = (paperId: number, questionId: number) => {
  return api.delete<{ message: string }>(`/papers/${paperId}/question/${questionId}`)
}
