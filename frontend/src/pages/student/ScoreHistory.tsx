import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getMyScores } from '../../api/score'
import { ExamAttempt } from '../../types'
import { formatDate } from '../../utils/format'

export const ScoreHistory: React.FC = () => {
  const navigate = useNavigate()
  const [scores, setScores] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [perPage] = useState(10)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadScores()
  }, [page])

  const loadScores = async () => {
    setLoading(true)
    try {
      const { data } = await getMyScores({ page, per_page: perPage })
      setScores(data.items)
      setTotal(data.total)
    } finally {
      setLoading(false)
    }
  }

  const totalPages = Math.ceil(total / perPage)

  const avgScore = scores.length > 0
    ? Math.round(scores.reduce((sum, s) => sum + (s.score || 0), 0) / scores.length)
    : 0

  const passCount = scores.filter(s => (s.score || 0) >= (s.total_score || 100) * 0.6).length

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">成绩记录</h1>
        <p className="text-gray-500 mt-2">查看历史考试成绩</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">考试次数</p>
              <p className="text-3xl font-bold text-blue-600 mt-1">{total}</p>
            </div>
            <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-2xl">📝</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">平均分数</p>
              <p className="text-3xl font-bold text-green-600 mt-1">{avgScore.toFixed(1)}</p>
            </div>
            <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center">
              <span className="text-2xl">📊</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">及格次数</p>
              <p className="text-3xl font-bold text-purple-600">
                {passCount} / {scores.length}
              </p>
            </div>
            <div className="w-14 h-14 bg-purple-100 rounded-full flex items-center justify-center">
              <span className="text-2xl">✅</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6">
        {loading ? (
          <div className="text-center py-12">加载中...</div>
        ) : scores.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <div className="text-6xl mb-4">📭</div>
            <p>暂无成绩记录</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-gray-500 text-sm border-b">
                  <th className="pb-4 font-medium">考试名称</th>
                  <th className="pb-4 font-medium">科目</th>
                  <th className="pb-4 font-medium">得分</th>
                  <th className="pb-4 font-medium">满分</th>
                  <th className="pb-4 font-medium">正确率</th>
                  <th className="pb-4 font-medium">提交时间</th>
                  <th className="pb-4 font-medium">状态</th>
                  <th className="pb-4 font-medium">操作</th>
                </tr>
              </thead>
              <tbody>
                {scores.map((score) => {
                  const isPass = (score.score || 0) >= (score.total_score || 100) * 0.6
                  const accuracy = Math.round(((score.score || 0) / (score.total_score || 1)) * 100)
                  return (
                    <tr key={score.id} className="border-b hover:bg-gray-50">
                      <td className="py-4 font-medium text-gray-800">{score.exam_title}</td>
                      <td className="py-4 text-gray-600">{score.subject_name}</td>
                      <td className="py-4">
                        <span className={`font-semibold ${isPass ? 'text-green-600' : 'text-red-600'}`}>
                          {score.score}
                        </span>
                      </td>
                      <td className="py-4 text-gray-600">{score.total_score}</td>
                      <td className="py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-20 bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${isPass ? 'bg-green-500' : 'bg-red-500'}`}
                              style={{ width: `${accuracy}%`}}
                            />
                          </div>
                          <span className="text-sm text-gray-500">{accuracy}%</span>
                        </div>
                      </td>
                      <td className="py-4 text-gray-500">{formatDate(score.submit_time)}</td>
                      <td className="py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          isPass ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {isPass ? '及格' : '不及格'}
                        </span>
                      </td>
                      <td className="py-4">
                        <button
                          onClick={() => navigate(`/exam-report/${score.id}`)}
                          className="text-blue-600 hover:underline text-sm"
                        >
                          查看报告
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
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
