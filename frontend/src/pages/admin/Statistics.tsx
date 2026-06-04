import React, { useState, useEffect } from 'react'
import { getStatistics } from '../../api/score'
import { getSubjects } from '../../api/question'
import { getExams } from '../../api/exam'
import { Statistics as StatisticsType, Subject, Exam } from '../../types'
import { formatDate } from '../../utils/format'

export const Statistics: React.FC = () => {
  const [statistics, setStatistics] = useState<StatisticsType | null>(null)
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [exams, setExams] = useState<Exam[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({ exam_id: '', subject_id: '' })

  useEffect(() => {
    loadSubjects()
    loadExams()
  }, [])

  useEffect(() => {
    loadStatistics()
  }, [filters])

  const loadSubjects = async () => {
    try {
      const { data } = await getSubjects()
      setSubjects(data)
    } catch (err: any) {
      console.error('加载科目失败:', err)
    }
  }

  const loadExams = async () => {
    try {
      const { data } = await getExams({ per_page: 100 })
      setExams(data.items)
    } catch (err: any) {
      console.error('加载考试失败:', err)
    }
  }

  const loadStatistics = async () => {
    setLoading(true)
    try {
      const params: any = {}
      if (filters.exam_id) params.exam_id = filters.exam_id
      if (filters.subject_id) params.subject_id = filters.subject_id
      const { data } = await getStatistics(params)
      setStatistics(data)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="text-center py-20">加载中...</div>
  }

  const scoreDistribution = statistics?.score_distribution || {}
  const distributionLabels = [
    { key: '0-59', label: '不及格', color: 'bg-red-500' },
    { key: '60-69', label: '及格', color: 'bg-orange-500' },
    { key: '70-79', label: '中等', color: 'bg-yellow-500' },
    { key: '80-89', label: '良好', color: 'bg-blue-500' },
    { key: '90-100', label: '优秀', color: 'bg-green-500' }
  ]

  const maxDistribution = Math.max(...Object.values(scoreDistribution), 1)

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">成绩统计</h1>
        <p className="text-gray-500 mt-2">查看和分析考试成绩数据</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">科目</label>
            <select
              value={filters.subject_id}
              onChange={(e) => { setFilters({ ...filters, subject_id: e.target.value, exam_id: '' }) }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="">全部科目</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">考试</label>
            <select
              value={filters.exam_id}
              onChange={(e) => setFilters({ ...filters, exam_id: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="">全部考试</option>
              {exams.map((e) => (
                <option key={e.id} value={e.id}>{e.title}</option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={loadStatistics}
              className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
            >
              刷新统计
            </button>
          </div>
        </div>
      </div>

      {statistics && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6 mb-6">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">参考人数</p>
                  <p className="text-3xl font-bold mt-1 text-blue-600">{statistics.total_count}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-xl">👥</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">平均分</p>
                  <p className="text-3xl font-bold mt-1 text-green-600">
                    {statistics.avg_score.toFixed(1)}
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-xl">📊</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">最高分</p>
                  <p className="text-3xl font-bold mt-1 text-purple-600">{statistics.max_score}</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <span className="text-xl">🏆</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">最低分</p>
                  <p className="text-3xl font-bold mt-1 text-orange-600">{statistics.min_score}</p>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                  <span className="text-xl">📉</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">及格率</p>
                  <p className="text-3xl font-bold mt-1 text-emerald-600">
                    {statistics.pass_rate.toFixed(1)}%
                  </p>
                </div>
                <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
                  <span className="text-xl">✅</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">优秀率</p>
                  <p className="text-3xl font-bold mt-1 text-pink-600">
                    {statistics.excellent_rate.toFixed(1)}%
                  </p>
                </div>
                <div className="w-12 h-12 bg-pink-100 rounded-full flex items-center justify-center">
                  <span className="text-xl">⭐</span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-6">分数段分布</h3>
              <div className="space-y-4">
                {distributionLabels.map((item) => {
                  const count = scoreDistribution[item.key] || 0
                  const percent = statistics.total_count > 0 ? (count / statistics.total_count) * 100 : 0
                  return (
                    <div key={item.key}>
                      <div className="flex justify-between mb-1">
                        <span className="text-gray-700">{item.label} ({item.key}分)</span>
                        <span className="text-gray-500">
                          {count}人 ({percent.toFixed(1)}%)
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-6">
                        <div
                          className={`${item.color} h-6 rounded-full transition-all flex items-center justify-end pr-2`}
                          style={{ width: `${(count / maxDistribution) * 100}%` }}
                        >
                          {count > 0 && (
                            <span className="text-white text-xs font-medium">{count}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-6">统计概览</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <span className="text-gray-600">总分范围</span>
                  <span className="font-semibold text-gray-800">
                    {statistics.min_score} - {statistics.max_score} 分
                  </span>
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <span className="text-gray-600">总分总计</span>
                  <span className="font-semibold text-gray-800">{statistics.total_score} 分</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                  <span className="text-gray-600">及格人数 (≥60分)</span>
                  <span className="font-semibold text-green-600">
                    {Math.round(statistics.total_count * statistics.pass_rate / 100)} 人
                  </span>
                </div>
                <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
                  <span className="text-gray-600">不及格人数 (&#60;60分)</span>
                  <span className="font-semibold text-red-600">
                    {statistics.total_count - Math.round(statistics.total_count * statistics.pass_rate / 100)} 人
                  </span>
                </div>
                <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
                  <span className="text-gray-600">优秀人数 (≥90分)</span>
                  <span className="font-semibold text-purple-600">
                    {Math.round(statistics.total_count * statistics.excellent_rate / 100)} 人
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">成绩详情</h3>
            {!statistics.attempts || statistics.attempts.length === 0 ? (
              <div className="text-center py-16 text-gray-400">
                <div className="text-6xl mb-4">📊</div>
                <p>暂无成绩数据</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-gray-500 text-sm border-b">
                      <th className="pb-4 font-medium">排名</th>
                      <th className="pb-4 font-medium">学生</th>
                      <th className="pb-4 font-medium">考试</th>
                      <th className="pb-4 font-medium">试卷</th>
                      <th className="pb-4 font-medium">得分</th>
                      <th className="pb-4 font-medium">满分</th>
                      <th className="pb-4 font-medium">正确率</th>
                      <th className="pb-4 font-medium">提交时间</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...statistics.attempts]
                      .sort((a, b) => (b.score || 0) - (a.score || 0))
                      .map((attempt, index) => {
                        const accuracy = Math.round(((attempt.score || 0) / (attempt.total_score || 1)) * 100)
                        const isPass = accuracy >= 60
                        return (
                          <tr key={attempt.id} className="border-b hover:bg-gray-50">
                            <td className="py-4">
                              <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${
                                index === 0 ? 'bg-yellow-400 text-white' :
                                index === 1 ? 'bg-gray-400 text-white' :
                                index === 2 ? 'bg-orange-400 text-white' :
                                'bg-gray-100 text-gray-600'
                              }`}>
                                {index + 1}
                              </span>
                            </td>
                            <td className="py-4">
                              <p className="font-medium text-gray-800">
                                {attempt.real_name || attempt.username}
                              </p>
                              <p className="text-xs text-gray-400">@{attempt.username}</p>
                            </td>
                            <td className="py-4 text-gray-600">{attempt.exam_title}</td>
                            <td className="py-4 text-gray-600">{attempt.paper_title}</td>
                            <td className="py-4">
                              <span className={`font-bold ${isPass ? 'text-green-600' : 'text-red-600'}`}>
                                {attempt.score}
                              </span>
                            </td>
                            <td className="py-4 text-gray-600">{attempt.total_score}</td>
                            <td className="py-4">
                              <div className="flex items-center gap-2">
                                <div className="w-20 bg-gray-200 rounded-full h-2">
                                  <div
                                    className={`h-2 rounded-full ${isPass ? 'bg-green-500' : 'bg-red-500'}`}
                                    style={{ width: `${accuracy}%` }}
                                  />
                                </div>
                                <span className="text-sm text-gray-500">{accuracy}%</span>
                              </div>
                            </td>
                            <td className="py-4 text-gray-500 text-sm">
                              {formatDate(attempt.submit_time)}
                            </td>
                          </tr>
                        )
                      })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
