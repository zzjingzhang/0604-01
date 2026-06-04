import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getExams, startExam } from '../../api/exam'
import { Exam } from '../../types'
import { formatDuration, getStatusName, getStatusColor, formatDate } from '../../utils/format'

export const ExamList: React.FC = () => {
  const navigate = useNavigate()
  const [exams, setExams] = useState<Exam[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [perPage] = useState(10)
  const [loading, setLoading] = useState(true)
  const [startingId, setStartingId] = useState<number | null>(null)

  useEffect(() => {
    loadExams()
  }, [page])

  const loadExams = async () => {
    setLoading(true)
    try {
      const { data } = await getExams({ page, per_page: perPage })
      setExams(data.items)
      setTotal(data.total)
    } finally {
      setLoading(false)
    }
  }

  const handleStartExam = async (exam: Exam) => {
    if (exam.attempt?.status === 'submitted') {
      navigate(`/exam-report/${exam.attempt.id}`)
      return
    }

    if (exam.attempt?.status === 'in_progress') {
      navigate(`/exam/${exam.id}/${exam.attempt.id}`)
      return
    }

    setStartingId(exam.id)
    try {
      const { data } = await startExam(exam.id)
      navigate(`/exam/${exam.id}/${data.id}`)
    } catch (err: any) {
      alert(err.response?.data?.error || '开始考试失败')
    } finally {
      setStartingId(null)
    }
  }

  const totalPages = Math.ceil(total / perPage)

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">我的考试</h1>
        <p className="text-gray-500 mt-2">选择考试开始答题</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6">
        {loading ? (
          <div className="text-center py-12">加载中...</div>
        ) : exams.length === 0 ? (
          <div className="text-center py-12 text-gray-400">暂无考试</div>
        ) : (
          <div className="space-y-4">
            {exams.map((exam) => (
              <div
                key={exam.id}
                className="border border-gray-200 rounded-xl p-6 hover:border-blue-300 hover:shadow-md transition"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-semibold text-gray-800">{exam.title}</h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(exam.status)}`}>
                        {getStatusName(exam.status)}
                      </span>
                      {exam.attempt && (
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(exam.attempt.status)}`}>
                          {exam.attempt.status === 'submitted' ? '已完成' : '进行中'}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                      <span>📚 {exam.subject_name}</span>
                      <span>⏱️ {formatDuration(exam.duration || 0)}</span>
                      <span>📊 {exam.total_score}分</span>
                      <span>📝 {exam.question_count}道题</span>
                      {exam.attempt?.score !== undefined && (
                        <span className={`font-medium ${(exam.attempt.score || 0) >= (exam.total_score || 100) * 0.6 ? 'text-green-600' : 'text-red-600'}`}>
                          得分: {exam.attempt.score}分
                        </span>
                      )}
                    </div>
                    {exam.attempt?.submit_time && (
                      <p className="text-xs text-gray-400 mt-2">
                        提交时间: {formatDate(exam.attempt.submit_time)}
                      </p>
                    )}
                  </div>
                  <div>
                    {exam.attempt?.status === 'submitted' ? (
                      <button
                        onClick={() => navigate(`/exam-report/${exam.attempt!.id}`)}
                        className="px-6 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
                      >
                        查看报告
                      </button>
                    ) : exam.attempt?.status === 'in_progress' ? (
                      <button
                        onClick={() => handleStartExam(exam)}
                        className="px-6 py-2.5 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition"
                      >
                        继续考试
                      </button>
                    ) : (
                      <button
                        onClick={() => handleStartExam(exam)}
                        disabled={startingId === exam.id}
                        className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 transition"
                      >
                        {startingId === exam.id ? '进入中...' : '开始考试'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-6">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              上一页
            </button>
            <span className="text-gray-600">
              第 {page} / {totalPages} 页
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              下一页
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
