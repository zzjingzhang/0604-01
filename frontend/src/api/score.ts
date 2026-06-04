import api from './index'
import { WrongQuestion, Statistics, OverviewData, StudentOverview, PageResponse, ExamAttempt } from '../types'

export const getMyScores = (params?: {
  page?: number
  per_page?: number
  exam_id?: number
}) => {
  return api.get<PageResponse<ExamAttempt>>('/scores/my', { params })
}

export const getWrongQuestions = (params?: {
  page?: number
  per_page?: number
  subject_id?: number
}) => {
  return api.get<PageResponse<WrongQuestion>>('/scores/wrong-questions', { params })
}

export const removeWrongQuestion = (questionId: number) => {
  return api.delete<{ message: string }>(`/scores/wrong-questions/${questionId}`)
}

export const clearWrongQuestions = () => {
  return api.post<{ message: string }>('/scores/wrong-questions/clear')
}

export const getStatistics = (params: { exam_id?: number; subject_id?: number }) => {
  return api.get<Statistics>('/scores/statistics', { params })
}

export const getOverview = () => {
  return api.get<OverviewData>('/scores/overview')
}

export const getStudentOverview = (studentId: number) => {
  return api.get<StudentOverview>(`/scores/student/${studentId}/overview`)
}

export const getStudents = (params?: { page?: number; per_page?: number; keyword?: string }) => {
  return api.get<PageResponse<any>>('/admin/students', { params })
}

export const getAllStudents = () => {
  return api.get<any[]>('/admin/students/all')
}

export const deleteStudent = (id: number) => {
  return api.delete<{ message: string }>(`/admin/students/${id}`)
}

export const getAdminSubjects = () => {
  return api.get<any[]>('/admin/subjects')
}

export const createSubject = (data: { name: string; description?: string }) => {
  return api.post<{ id: number; message: string }>('/admin/subjects', data)
}

export const updateSubject = (id: number, data: { name?: string; description?: string }) => {
  return api.put<{ message: string }>(`/admin/subjects/${id}`, data)
}

export const deleteSubject = (id: number) => {
  return api.delete<{ message: string }>(`/admin/subjects/${id}`)
}
