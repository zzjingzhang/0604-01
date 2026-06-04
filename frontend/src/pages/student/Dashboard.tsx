import React, { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { getStudentOverview } from '../../api/score'
import { getExams } from '../../api/exam'
import { StudentOverview, Exam } from '../../types'
import { formatDate, formatDuration, getStatusName, getStatusColor } from '../../utils/format'
import { useNavigate } from 'react-router-dom'

export const StudentDashboard: React.FC = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [overview, setOverview] = useState<StudentOverview | null>(null)
  const [exams, setExams] = useState<Exam[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      try {
        const [overviewRes, examsRes] = await Promise.all([
          getStudentOverview(user!.id),
          getExams({ per_page: 5 })
        ])
        setOverview(overviewRes.data)
        setExams(examsRes.data.items)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [user])

  if (loading) {
    return <div className="text-center py-20">加载中...</div>
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">
          欢迎回来，{user?.real_name || user?.username}！
        </h1>
        <p className="text-gray-500 mt-2">今天也要加油学习哦 📚</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">考试次数</p>
              <p className="text-3xl font-bold text-blue-600 mt-1">{overview?.total_attempts || 0}</p>
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
              <p className="text-3xl font-bold text-green-600 mt-1">{overview?.avg_score || 0}</p>
            </div>
            <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center">
              <span className="text-2xl">📊</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">错题数量</p>
              <p className="text-3xl font-bold text-red-600 mt-1">{overview?.total_wrong || 0}</p>
            </div>
            <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center">
              <span className="text-2xl">❌</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">待考科目</p>
              <p className="text-3xl font-bold text-purple-600 mt-1">{overview?.subject_stats?.length || 0}</p>
            </div>
            <div className="w-14 h-14 bg-purple-100 rounded-full flex items-center justify-center">
              <span className="text-2xl">📚</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-800">近期考试</h2>
            <button
              onClick={() => navigate('/exams')}
              className="text-blue-600 hover:underline text-sm"
            >
              查看全部 →
            </button>
          </div>
          {exams.length === 0 ? (
            <p className="text-gray-400 text-center py-8">暂无考试</p>
          ) : (
            <div className="space-y-3">
              {exams.map((exam) => (
                <div
                  key={exam.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition cursor-pointer"
                  onClick={() => navigate('/exams')}
                >
                  <div>
                    <h3 className="font-medium text-gray-800">{exam.title}</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {exam.subject_name} · {formatDuration(exam.duration || 0)} · {exam.total_score}分
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(exam.status)}`}>
                    {getStatusName(exam.status)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-800">各科成绩</h2>
            <button
              onClick={() => navigate('/scores')}
              className="text-blue-600 hover:underline text-sm"
            >
              查看全部 →
            </button>
          </div>
          {!overview?.subject_stats?.length ? (
            <p className="text-gray-400 text-center py-8">暂无成绩记录</p>
          ) : (
            <div className="space-y-4">
              {overview.subject_stats.map((stat) => (
                <div key={stat.id}>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">{stat.name}</span>
                    <span className="text-sm text-gray-500">
                      平均 {stat.avg_score?.toFixed(0) || 0} 分
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div
                      className="bg-blue-500 h-2.5 rounded-full transition-all"
                      style={{ width: `${Math.min((stat.avg_score || 0), 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {overview?.recent_attempts?.length > 0 && (
        <div className="mt-8 bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">最近成绩</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-gray-500 text-sm border-b">
                  <th className="pb-3 font-medium">考试名称</th>
                  <th className="pb-3 font-medium">科目</th>
                  <th className="pb-3 font-medium">分数</th>
                  <th className="pb-3 font-medium">满分</th>
                  <th className="pb-3 font-medium">提交时间</th>
                  <th className="pb-3 font-medium">操作</th>
                </tr>
              </thead>
              <tbody>
                {overview.recent_attempts.map((attempt: any) => (
                  <tr key={attempt.id} className="border-b hover:bg-gray-50">
                    <td className="py-3">{attempt.exam_title}</td>
                    <td className="py-3">{attempt.subject_name}</td>
                    <td className="py-3">
                      <span className={`font-semibold ${(attempt.score || 0) >= (attempt.total_score || 100) * 0.6 ? 'text-green-600' : 'text-red-600'}`}>
                        {attempt.score}
                      </span>
                    </td>
                    <td className="py-3">{attempt.total_score}</td>
                    <td className="py-3 text-gray-500">{formatDate(attempt.submit_time)}</td>
                    <td className="py-3">
                      <button
                        onClick={() => navigate(`/exam-report/${attempt.id}`)}
                        className="text-blue-600 hover:underline text-sm"
                      >
                        查看报告
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
