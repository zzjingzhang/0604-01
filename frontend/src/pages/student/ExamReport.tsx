import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getAttempt } from '../../api/exam'
import { ExamAttemptDetail } from '../../types'
import { formatDate, getQuestionTypeName, formatDuration } from '../../utils/format'

export const ExamReport: React.FC = () => {
  const { attemptId } = useParams<{ attemptId: string }>()
  const navigate = useNavigate()
  const [report, setReport] = useState<ExamAttemptDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'questions'>('overview')

  useEffect(() => {
    const loadReport = async () => {
      try {
        const { data } = await getAttempt(Number(attemptId))
        setReport(data)
      } finally {
        setLoading(false)
      }
    }
    loadReport()
  }, [attemptId])

  if (loading || !report) {
    return <div className="text-center py-20">加载中...</div>
  }

  const totalScore = report.exam.total_score || 100
  const scorePercent = ((report.score || 0) / totalScore) * 100
  const isPass = scorePercent >= 60

  const weakPoints = Object.entries(report.knowledge_stats || {})
    .filter(([_, stat]) => stat.total > 0 && (stat.correct / stat.total) < 0.6)
    .map(([kp, stat]) => ({
      name: kp,
      accuracy: Math.round((stat.correct / stat.total) * 100),
      total: stat.total,
      correct: stat.correct
    }))

  return (
    <div>
      <div className="mb-8">
        <button
          onClick={() => navigate('/exams')}
          className="text-blue-600 hover:underline mb-4 inline-flex items-center gap-1"
        >
          ← 返回考试列表
        </button>
        <h1 className="text-3xl font-bold text-gray-800">考试成绩报告</h1>
        <p className="text-gray-500 mt-2">{report.exam.title}</p>
      </div>

      <div className={`rounded-2xl p-8 mb-6 ${isPass ? 'bg-gradient-to-r from-green-500 to-emerald-600' : 'bg-gradient-to-r from-red-500 to-orange-600'} text-white`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white/80 text-lg">{report.student.real_name || report.student.username}</p>
            <h2 className="text-5xl font-bold mt-2">
              {report.score}
              <span className="text-2xl font-normal ml-2">/ {totalScore} 分</span>
            </h2>
            <p className="text-white/80 mt-2">
              {isPass ? '🎉 恭喜通过考试！' : '💪 继续努力，下次一定能通过！'}
            </p>
          </div>
          <div className="text-right">
            <div className="text-6xl font-bold">{scorePercent.toFixed(1)}%</div>
            <p className="text-white/80 mt-2">正确率</p>
          </div>
        </div>
        <div className="grid grid-cols-4 gap-6 mt-8 pt-6 border-t border-white/20">
          <div>
            <p className="text-white/60 text-sm">答题总数</p>
            <p className="text-2xl font-bold mt-1">{report.correct_count + report.wrong_count}</p>
          </div>
          <div>
            <p className="text-white/60 text-sm">答对题数</p>
            <p className="text-2xl font-bold mt-1">{report.correct_count}</p>
          </div>
          <div>
            <p className="text-white/60 text-sm">答错题数</p>
            <p className="text-2xl font-bold mt-1">{report.wrong_count}</p>
          </div>
          <div>
            <p className="text-white/60 text-sm">用时</p>
            <p className="text-2xl font-bold mt-1">{formatDuration(60)}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm">
        <div className="border-b">
          <div className="flex">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-6 py-4 font-medium transition ${
                activeTab === 'overview'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              成绩分析
            </button>
            <button
              onClick={() => setActiveTab('questions')}
              className={`px-6 py-4 font-medium transition ${
                activeTab === 'questions'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              题目详情
            </button>
          </div>
        </div>

        <div className="p-6">
          {activeTab === 'overview' ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">各题型得分</h3>
                <div className="space-y-4">
                  {Object.entries(report.type_stats || {}).map(([type, stat]) => (
                    <div key={type}>
                      <div className="flex justify-between mb-1">
                        <span className="text-gray-700">{getQuestionTypeName(type)}</span>
                        <span className="text-gray-500">
                          {stat.score} / {stat.max_score} 分 ({stat.correct}/{stat.total})
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div
                          className="bg-blue-500 h-3 rounded-full transition-all"
                          style={{ width: `${stat.max_score > 0 ? (stat.score / stat.max_score) * 100 : 0}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">知识点掌握情况</h3>
                <div className="space-y-4">
                  {Object.entries(report.knowledge_stats || {}).map(([kp, stat]) => {
                    const accuracy = stat.total > 0 ? Math.round((stat.correct / stat.total) * 100) : 0
                    return (
                      <div key={kp}>
                        <div className="flex justify-between mb-1">
                          <span className="text-gray-700">{kp}</span>
                          <span className={`${accuracy >= 60 ? 'text-green-600' : 'text-red-600'}`}>
                            {accuracy}% ({stat.correct}/{stat.total})
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div
                            className={`h-3 rounded-full transition-all ${accuracy >= 60 ? 'bg-green-500' : 'bg-red-500'}`}
                            style={{ width: `${accuracy}%` }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {weakPoints.length > 0 && (
                <div className="lg:col-span-2 bg-orange-50 border border-orange-200 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-orange-800 mb-3">⚠️ 薄弱知识点</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {weakPoints.map((wp) => (
                      <div key={wp.name} className="bg-white rounded-lg p-4">
                        <p className="font-medium text-gray-800">{wp.name}</p>
                        <p className="text-sm text-gray-500 mt-1">
                          正确率 {wp.accuracy}% ({wp.correct}/{wp.total}题)
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="lg:col-span-2 bg-gray-50 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">考试信息</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">科目</p>
                    <p className="font-medium mt-1">{report.exam.subject_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">考试时长</p>
                    <p className="font-medium mt-1">{formatDuration(report.exam.duration || 0)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">开始时间</p>
                    <p className="font-medium mt-1">{formatDate(report.start_time)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">提交时间</p>
                    <p className="font-medium mt-1">{formatDate(report.submit_time)}</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {report.questions?.map((q, index) => (
                <div
                  key={q.id}
                  className={`border-2 rounded-xl overflow-hidden ${
                    q.is_correct ? 'border-green-200' : 'border-red-200'
                  }`}
                >
                  <div className={`p-4 ${q.is_correct ? 'bg-green-50' : 'bg-red-50'} flex items-center justify-between`}>
                    <div className="flex items-center gap-3">
                      <span className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                        q.is_correct ? 'bg-green-500' : 'bg-red-500'
                      }`}>
                        {index + 1}
                      </span>
                      <span className="px-2 py-0.5 bg-white rounded text-xs">{getQuestionTypeName(q.type)}</span>
                      <span className="text-sm text-gray-600">{q.score}分</span>
                    </div>
                    <div className="text-right">
                      {q.is_correct ? (
                        <span className="text-green-600 font-medium">✓ 正确 +{q.actual_score}分</span>
                      ) : (
                        <span className="text-red-600 font-medium">✗ 错误 +{q.actual_score}分</span>
                      )}
                    </div>
                  </div>
                  <div className="p-6">
                    <p className="text-gray-800 mb-4">{q.content}</p>
                    
                    {q.type !== 'judge' && q.options && (
                      <div className="space-y-2 mb-4">
                        {q.options.map((opt, i) => {
                          const optValue = String.fromCharCode(65 + i)
                          const isCorrect = q.answer?.includes(optValue)
                          const isSelected = (q as any).student_answer?.includes(optValue)
                          
                          return (
                            <div
                              key={i}
                              className={`flex items-center p-3 rounded-lg ${
                                isCorrect
                                  ? 'bg-green-100 border border-green-300'
                                  : isSelected
                                    ? 'bg-red-100 border border-red-300'
                                    : 'bg-gray-50'
                              }`}
                            >
                              <span className="w-6 h-6 rounded flex items-center justify-center text-sm mr-3">
                                {optValue}
                              </span>
                              <span className={isCorrect ? 'text-green-800' : isSelected ? 'text-red-800' : 'text-gray-700'}>
                                {opt.replace(/^[A-D]\.\s*/, '')}
                              </span>
                              {isCorrect && <span className="ml-auto text-green-600">✓ 正确答案</span>}
                              {isSelected && !isCorrect && <span className="ml-auto text-red-600">✗ 你的选择</span>}
                            </div>
                          )
                        })}
                      </div>
                    )}

                    {q.type === 'judge' && (
                      <div className="space-y-2 mb-4">
                        {['A', 'B'].map((opt, i) => {
                          const isCorrect = q.answer === opt
                          const isSelected = (q as any).student_answer === opt
                          return (
                            <div
                              key={opt}
                              className={`flex items-center p-3 rounded-lg ${
                                isCorrect
                                  ? 'bg-green-100 border border-green-300'
                                  : isSelected
                                    ? 'bg-red-100 border border-red-300'
                                    : 'bg-gray-50'
                              }`}
                            >
                              <span className="w-6 h-6 rounded flex items-center justify-center text-sm mr-3">
                                {opt}
                              </span>
                              <span className={isCorrect ? 'text-green-800' : isSelected ? 'text-red-800' : 'text-gray-700'}>
                                {i === 0 ? '正确' : '错误'}
                              </span>
                              {isCorrect && <span className="ml-auto text-green-600">✓ 正确答案</span>}
                              {isSelected && !isCorrect && <span className="ml-auto text-red-600">✗ 你的选择</span>}
                            </div>
                          )
                        })}
                      </div>
                    )}

                    <div className="flex gap-4 text-sm">
                      <div className="flex-1">
                        <p className="text-gray-500 mb-1">你的答案</p>
                        <p className={`font-medium ${q.is_correct ? 'text-green-600' : 'text-red-600'}`}>
                          {(q as any).student_answer || '未作答'}
                        </p>
                      </div>
                      <div className="flex-1">
                        <p className="text-gray-500 mb-1">正确答案</p>
                        <p className="font-medium text-green-600">{q.answer}</p>
                      </div>
                    </div>

                    {q.analysis && (
                      <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                        <p className="text-sm text-blue-800 font-medium mb-1">解析</p>
                        <p className="text-sm text-blue-700">{q.analysis}</p>
                      </div>
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
