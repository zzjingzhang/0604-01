import api from './index'
import { Exam, ExamAttempt, ExamAttemptDetail, PageResponse } from '../types'

export const getExams = (params?: {
  page?: number
  per_page?: number
  status?: string
  keyword?: string
}) => {
  return api.get<PageResponse<Exam>>('/exams', { params })
}

export const getAllExams = () => {
  return api.get<Exam[]>('/exams/all')
}

export const getExam = (id: number) => {
  return api.get<Exam>(`/exams/${id}`)
}

export const createExam = (data: {
  paper_id: number
  title: string
  start_time?: string
  end_time?: string
  student_ids?: number[]
}) => {
  return api.post<{ id: number; message: string }>('/exams', data)
}

export const updateExam = (id: number, data: Partial<Exam> & { student_ids?: number[] }) => {
  return api.put<{ message: string }>(`/exams/${id}`, data)
}

export const deleteExam = (id: number) => {
  return api.delete<{ message: string }>(`/exams/${id}`)
}

export const startExam = (id: number) => {
  return api.post<ExamAttempt>(`/exams/${id}/start`)
}

export const submitExam = (id: number, answers: Record<string, string>) => {
  return api.post<{ message: string; attempt_id: number; score: number }>(`/exams/${id}/submit`, { answers })
}

export const getAttempt = (attemptId: number) => {
  return api.get<ExamAttemptDetail>(`/exams/attempt/${attemptId}`)
}
