import api from './index'
import { Question, Subject, PageResponse } from '../types'

export const getSubjects = () => {
  return api.get<Subject[]>('/questions/subjects')
}

export const getQuestions = (params?: {
  page?: number
  per_page?: number
  subject_id?: number
  type?: string
  difficulty?: string
  keyword?: string
}) => {
  return api.get<PageResponse<Question>>('/questions', { params })
}

export const getQuestion = (id: number) => {
  return api.get<Question>(`/questions/${id}`)
}

export const createQuestion = (data: Partial<Question>) => {
  return api.post<{ id: number; message: string }>('/questions', data)
}

export const updateQuestion = (id: number, data: Partial<Question>) => {
  return api.put<{ message: string }>(`/questions/${id}`, data)
}

export const deleteQuestion = (id: number) => {
  return api.delete<{ message: string }>(`/questions/${id}`)
}

export const batchCreateQuestions = (questions: Partial<Question>[]) => {
  return api.post<{ message: string; ids: number[] }>('/questions/batch', { questions })
}
