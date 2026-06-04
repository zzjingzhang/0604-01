import React, { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getExam, submitExam } from '../../api/exam'
import { Exam as ExamType, Question } from '../../types'
import { getQuestionTypeName, formatDuration } from '../../utils/format'

export const ExamPage: React.FC = () => {
  const { examId, attemptId } = useParams<{ examId: string; attemptId: string }>()
  const navigate = useNavigate()
  const [exam, setExam] = useState<ExamType | null>(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [timeLeft, setTimeLeft] = useState<number | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  useEffect(() => {
    const loadExam = async () => {
      try {
        const { data } = await getExam(Number(examId))
        setExam(data)
        setTimeLeft((data.duration || 60) * 60)
      } catch (err) {
        alert('加载考试失败')
        navigate('/exams')
      }
    }
    loadExam()
  }, [examId, navigate])

  useEffect(() => {
    if (timeLeft === null) return
    if (timeLeft <= 0) {
      handleSubmit()
      return
    }
    const timer = setInterval(() => {
      setTimeLeft(t => (t !== null ? t - 1 : null))
    }, 1000)
    return () => clearInterval(timer)
  }, [timeLeft])

  const formatTimeLeft = (seconds: number) => {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = seconds % 60
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  const handleAnswer = (questionId: number, value: string, isMultiple: boolean) => {
    if (isMultiple) {
      const current = answers[questionId] || ''
      const arr = current.split('').filter(Boolean)
      if (arr.includes(value)) {
        setAnswers(prev => ({ ...prev, [questionId]: arr.filter(v => v !== value).join('') }))
      } else {
        setAnswers(prev => ({ ...prev, [questionId]: [...arr, value].sort().join('') }))
      }
    } else {
      setAnswers(prev => ({ ...prev, [questionId]: value }))
    }
  }

  const handleSubmit = useCallback(async () => {
    if (!attemptId) return
    setSubmitting(true)
    try {
      const { data } = await submitExam(Number(examId), answers)
      navigate(`/exam-report/${data.attempt_id}`)
    } catch (err: any) {
      alert(err.response?.data?.error || '提交失败')
    } finally {
      setSubmitting(false)
    }
  }, [attemptId, examId, answers, navigate])

  if (!exam) {
    return <div className="text-center py-20">加载中...</div>
  }

  const questions = exam.questions || []
  const currentQuestion: Question | undefined = questions[currentIndex]
  const answeredCount = Object.keys(answers).filter(k => answers[k]).length

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b shadow-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-800">{exam.title}</h1>
              <p className="text-sm text-gray-500">{exam.subject_name} · {questions.length}道题 · 总分{exam.total_score}分</p>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-right">
                <p className="text-sm text-gray-500">答题进度</p>
                <p className="font-semibold text-blue-600">{answeredCount} / {questions.length}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">剩余时间</p>
                <p className={`font-mono font-bold text-xl ${timeLeft !== null && timeLeft < 300 ? 'text-red-600' : 'text-gray-800'}`}>
                  {timeLeft !== null ? formatTimeLeft(timeLeft) : '--:--:--'}
                </p>
              </div>
              <button
                onClick={() => setShowConfirm(true)}
                disabled={submitting}
                className="px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-green-400 transition font-medium"
              >
                {submitting ? '提交中...' : '交卷'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8 flex gap-6">
        <div className="flex-1">
          <div className="bg-white rounded-xl shadow-sm p-8">
            <div className="flex items-center gap-3 mb-6">
              <span className="w-10 h-10 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold">
                {currentIndex + 1}
              </span>
              <div>
                <span className="px-2 py-0.5 bg-blue-100 text-blue-600 text-xs rounded">
                  {getQuestionTypeName(currentQuestion?.type || '')}
                </span>
                <span className="ml-2 text-sm text-gray-500">{currentQuestion?.score}分</span>
              </div>
            </div>

            <p className="text-lg text-gray-800 mb-8 leading-relaxed">{currentQuestion?.content}</p>

            <div className="space-y-4">
              {currentQuestion?.type === 'judge' ? (
                ['A', 'B'].map((opt, i) => (
                  <label
                    key={opt}
                    className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition ${
                      answers[currentQuestion.id] === opt
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name={`q-${currentQuestion.id}`}
                      value={opt}
                      checked={answers[currentQuestion.id] === opt}
                      onChange={() => handleAnswer(currentQuestion.id, opt, false)}
                      className="w-5 h-5 text-blue-600"
                    />
                    <span className="ml-3 text-gray-800">{i === 0 ? '正确' : '错误'}</span>
                  </label>
                ))
              ) : (
                currentQuestion?.options?.map((opt, i) => {
                  const optValue = String.fromCharCode(65 + i)
                  const isChecked = currentQuestion.type === 'multiple'
                    ? (answers[currentQuestion.id] || '').includes(optValue)
                    : answers[currentQuestion.id] === optValue

                  return (
                    <label
                      key={i}
                      className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition ${
                        isChecked
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-blue-300'
                      }`}
                    >
                      <input
                        type={currentQuestion.type === 'multiple' ? 'checkbox' : 'radio'}
                        name={`q-${currentQuestion.id}`}
                        value={optValue}
                        checked={isChecked}
                        onChange={() => handleAnswer(currentQuestion.id, optValue, currentQuestion.type === 'multiple')}
                        className="w-5 h-5 text-blue-600"
                      />
                      <span className="ml-3 text-gray-800">
                        <span className="font-medium">{optValue}.</span> {opt.replace(/^[A-D]\.\s*/, '')}
                      </span>
                    </label>
                  )
                })
              )}
            </div>

            <div className="flex justify-between mt-8">
              <button
                onClick={() => setCurrentIndex(i => Math.max(0, i - 1))}
                disabled={currentIndex === 0}
                className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                上一题
              </button>
              {currentIndex < questions.length - 1 ? (
                <button
                  onClick={() => setCurrentIndex(i => i + 1)}
                  className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  下一题
                </button>
              ) : (
                <button
                  onClick={() => setShowConfirm(true)}
                  className="px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                >
                  交卷
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="w-72 flex-shrink-0">
          <div className="bg-white rounded-xl shadow-sm p-6 sticky top-28">
            <h3 className="font-semibold text-gray-800 mb-4">答题卡</h3>
            <div className="grid grid-cols-5 gap-2">
              {questions.map((q, i) => (
                <button
                  key={q.id}
                  onClick={() => setCurrentIndex(i)}
                  className={`w-10 h-10 rounded-lg text-sm font-medium transition ${
                    i === currentIndex
                      ? 'bg-blue-500 text-white'
                      : answers[q.id]
                        ? 'bg-green-100 text-green-700 border border-green-300'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
            <div className="mt-6 pt-4 border-t space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 bg-green-100 border border-green-300 rounded"></span>
                <span className="text-gray-600">已答 {answeredCount} 题</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 bg-gray-100 rounded"></span>
                <span className="text-gray-600">未答 {questions.length - answeredCount} 题</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-gray-800 mb-4">确认交卷</h3>
            <p className="text-gray-600 mb-2">
              您已完成 <span className="font-semibold text-blue-600">{answeredCount}</span> / {questions.length} 道题目
            </p>
            {answeredCount < questions.length && (
              <p className="text-orange-600 mb-4">
                还有 {questions.length - answeredCount} 道题目未作答，确定要交卷吗？
              </p>
            )}
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
              >
                继续答题
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="flex-1 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-green-400 transition"
              >
                {submitting ? '提交中...' : '确认交卷'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
