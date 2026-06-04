import React, { useState, useEffect } from 'react'
import { getOverview } from '../../api/score'
import { OverviewData } from '../../types'
import { formatDate } from '../../utils/format'

export const AdminDashboard: React.FC = () => {
  const [data, setData] = useState<OverviewData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      try {
        const { data } = await getOverview()
        setData(data)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  if (loading || !data) {
    return <div className="text-center py-20">加载中...</div>
  }

  const stats = [
    { label: '学生总数', value: data.total_students, icon: '👥', color: 'blue' },
    { label: '题目总数', value: data.total_questions, icon: '📚', color: 'green' },
    { label: '试卷总数', value: data.total_papers, icon: '📄', color: 'purple' },
    { label: '考试总数', value: data.total_exams, icon: '📝', color: 'orange' },
    { label: '答题总数', value: data.total_attempts, icon: '✅', color: 'pink' }
  ]

  const colorClasses: Record<string, string> = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    purple: 'bg-purple-500',
    orange: 'bg-orange-500',
    pink: 'bg-pink-500'
  }

  const bgColorClasses: Record<string, string> = {
    blue: 'bg-blue-100',
    green: 'bg-green-100',
    purple: 'bg-purple-100',
    orange: 'bg-orange-100',
    pink: 'bg-pink-100'
  }

  const textColorClasses: Record<string, string> = {
    blue: 'text-blue-600',
    green: 'text-green-600',
    purple: 'text-purple-600',
    orange: 'text-orange-600',
    pink: 'text-pink-600'
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">管理后台</h1>
        <p className="text-gray-500 mt-2">平台数据总览</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6 mb-8">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">{stat.label}</p>
                <p className={`text-3xl font-bold mt-1 ${textColorClasses[stat.color]}`}>
                  {stat.value}
                </p>
              </div>
              <div className={`w-14 h-14 ${bgColorClasses[stat.color]} rounded-full flex items-center justify-center`}>
                <span className="text-2xl">{stat.icon}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">近期考试</h2>
          {data.recent_exams.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <p>暂无考试</p>
            </div>
          ) : (
            <div className="space-y-3">
              {data.recent_exams.map((exam) => (
                <div key={exam.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-800">{exam.title}</p>
                    <p className="text-sm text-gray-500">{exam.subject_name}</p>
                  </div>
                  <div className="text-right">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      exam.status === 'published' ? 'bg-green-100 text-green-700' :
                      exam.status === 'ended' ? 'bg-gray-100 text-gray-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      {exam.status === 'published' ? '已发布' : exam.status === 'ended' ? '已结束' : '草稿'}
                    </span>
                    {exam.attempt_count !== undefined && (
                      <p className="text-xs text-gray-400 mt-1">{exam.attempt_count}人已考</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">近期答题</h2>
          {data.recent_attempts.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <p>暂无答题记录</p>
            </div>
          ) : (
            <div className="space-y-3">
              {data.recent_attempts.map((attempt) => (
                <div key={attempt.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-800">考试 #{attempt.exam_id}</p>
                    <p className="text-sm text-gray-500">{formatDate(attempt.submit_time || attempt.start_time)}</p>
                  </div>
                  <div className="text-right">
                    {attempt.score !== undefined ? (
                      <span className={`font-bold ${
                        (attempt.score || 0) >= 60 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {attempt.score}分
                      </span>
                    ) : (
                      <span className="text-yellow-600 text-sm">进行中</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
