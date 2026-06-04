import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { Layout } from './components/Layout'
import { ProtectedRoute } from './components/ProtectedRoute'
import { Login } from './pages/Login'
import { Register } from './pages/Register'
import { StudentDashboard as Dashboard } from './pages/student/Dashboard'
import { QuestionBank } from './pages/student/QuestionBank'
import { ExamList } from './pages/student/ExamList'
import { ExamPage } from './pages/student/ExamPage'
import { ExamReport } from './pages/student/ExamReport'
import { WrongBook } from './pages/student/WrongBook'
import { ScoreHistory } from './pages/student/ScoreHistory'
import { AdminDashboard } from './pages/admin/Dashboard'
import { QuestionManage } from './pages/admin/QuestionManage'
import { PaperManage } from './pages/admin/PaperManage'
import { ExamManage } from './pages/admin/ExamManage'
import { Statistics } from './pages/admin/Statistics'

const App: React.FC = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      
      <Route path="/" element={
        <ProtectedRoute>
          <Layout>
            <Dashboard />
          </Layout>
        </ProtectedRoute>
      } />
      
      <Route path="/questions" element={
        <ProtectedRoute>
          <Layout>
            <QuestionBank />
          </Layout>
        </ProtectedRoute>
      } />
      
      <Route path="/exams" element={
        <ProtectedRoute>
          <Layout>
            <ExamList />
          </Layout>
        </ProtectedRoute>
      } />
      
      <Route path="/exam/:examId/:attemptId" element={
        <ProtectedRoute>
          <ExamPage />
        </ProtectedRoute>
      } />
      
      <Route path="/exam-report/:attemptId" element={
        <ProtectedRoute>
          <Layout>
            <ExamReport />
          </Layout>
        </ProtectedRoute>
      } />
      
      <Route path="/wrong-book" element={
        <ProtectedRoute>
          <Layout>
            <WrongBook />
          </Layout>
        </ProtectedRoute>
      } />
      
      <Route path="/scores" element={
        <ProtectedRoute>
          <Layout>
            <ScoreHistory />
          </Layout>
        </ProtectedRoute>
      } />
      
      <Route path="/admin" element={
        <ProtectedRoute requireAdmin>
          <Layout>
            <AdminDashboard />
          </Layout>
        </ProtectedRoute>
      } />
      
      <Route path="/admin/questions" element={
        <ProtectedRoute requireAdmin>
          <Layout>
            <QuestionManage />
          </Layout>
        </ProtectedRoute>
      } />
      
      <Route path="/admin/papers" element={
        <ProtectedRoute requireAdmin>
          <Layout>
            <PaperManage />
          </Layout>
        </ProtectedRoute>
      } />
      
      <Route path="/admin/exams" element={
        <ProtectedRoute requireAdmin>
          <Layout>
            <ExamManage />
          </Layout>
        </ProtectedRoute>
      } />
      
      <Route path="/admin/statistics" element={
        <ProtectedRoute requireAdmin>
          <Layout>
            <Statistics />
          </Layout>
        </ProtectedRoute>
      } />
      
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
