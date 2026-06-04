export interface User {
  id: number
  username: string
  role: 'admin' | 'student'
  real_name: string
  created_at?: string
}

export interface LoginResponse {
  token: string
  user: User
}

export interface Subject {
  id: number
  name: string
  description: string
  created_at: string
}

export interface Question {
  id: number
  subject_id: number
  subject_name?: string
  type: 'single' | 'multiple' | 'judge'
  content: string
  options?: string[]
  answer: string
  analysis?: string
  score: number
  difficulty: 'easy' | 'medium' | 'hard'
  knowledge_point?: string
  created_at?: string
  sort_order?: number
  paper_question_id?: number
}

export interface Paper {
  id: number
  title: string
  subject_id: number
  subject_name?: string
  description: string
  total_score: number
  duration: number
  question_count?: number
  actual_total_score?: number
  questions?: Question[]
  created_at?: string
}

export interface Exam {
  id: number
  paper_id: number
  paper_title?: string
  title: string
  subject_name?: string
  start_time?: string
  end_time?: string
  status: 'draft' | 'published' | 'ended'
  duration?: number
  total_score?: number
  question_count?: number
  attempt_count?: number
  attempt?: ExamAttempt
  students?: User[]
  created_at?: string
}

export interface ExamAttempt {
  id: number
  exam_id: number
  student_id: number
  start_time: string
  submit_time?: string
  score?: number
  status: 'in_progress' | 'submitted'
}

export interface Answer {
  id: number
  attempt_id: number
  question_id: number
  student_answer: string
  is_correct: number
  score: number
}

export interface WrongQuestion extends Question {
  wrong_count: number
  last_wrong_time: string
}

export interface ExamAttemptDetail extends ExamAttempt {
  exam: Exam
  student: User
  questions: Question[]
  type_stats: Record<string, {
    total: number
    correct: number
    score: number
    max_score: number
  }>
  knowledge_stats: Record<string, {
    total: number
    correct: number
  }>
  correct_count: number
  wrong_count: number
  accuracy: number
}

export interface Statistics {
  attempts: (ExamAttempt & {
    username: string
    real_name: string
    exam_title: string
    paper_title: string
    total_score: number
  })[]
  avg_score: number
  max_score: number
  min_score: number
  pass_rate: number
  excellent_rate: number
  score_distribution: Record<string, number>
  total_count: number
  total_score: number
}

export interface OverviewData {
  total_students: number
  total_questions: number
  total_papers: number
  total_exams: number
  total_attempts: number
  recent_exams: Exam[]
  recent_attempts: ExamAttempt[]
}

export interface StudentOverview {
  total_attempts: number
  avg_score: number
  total_wrong: number
  recent_attempts: ExamAttempt[]
  subject_stats: Array<{
    id: number
    name: string
    attempt_count: number
    avg_score: number
    max_score: number
  }>
}

export interface PageResponse<T> {
  items: T[]
  total: number
  page: number
  per_page: number
}
