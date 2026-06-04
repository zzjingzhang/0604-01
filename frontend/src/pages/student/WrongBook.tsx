import React, { useState, useEffect } from 'react'
import { getSubjects } from '../../api/question'
import { getWrongQuestions, removeWrongQuestion, clearWrongQuestions } from '../../api/score'
import { Subject, WrongQuestion } from '../../types'
import { getQuestionTypeName, getDifficultyName, getDifficultyColor } from '../../utils/format'

export const WrongBook: React.FC = () => {
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [questions, setQuestions] = useState<WrongQuestion[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [perPage] = useState(10)
  const [subjectId, setSubjectId] = useState('')
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadSubjects = async () => {
      try {
        const { data } = await getSubjects()
        setSubjects(data)
      } finally {
        setLoading(false)
      }
    }
    loadSubjects()
  }, [])

  useEffect(() => {
    loadQuestions()
  }, [page, subjectId])

  const loadQuestions = async () => {
    setLoading(true)
    try {
      const params: any = { page, per_page: perPage }
      if (subjectId) params.subject_id = subjectId
      const { data } = await getWrongQuestions(params)
      setQuestions(data.items)
      setTotal(data.total)
    } finally {
      setLoading(false)
    }
  }

  const handleRemove = async (questionId: number, e: React.MouseEvent) => {
    e.stopPropagation()
    if (confirm('确定要从错题本中移除这道题吗？')) {
      try {
        await removeWrongQuestion(questionId)
        loadQuestions()
      } catch (err: any) {
        alert(err.response?.data?.error || '删除失败')
      }
    }
  }

  const handleClear = async () => {
    if (confirm('确定要清空所有错题吗？此操作不可恢复！')) {
      try {
        await clearWrongQuestions()
        setPage(1)
        loadQuestions()
      } catch (err: any) {
        alert(err.response?.data?.error || '清空失败')
      }
    }
  }

  const totalPages = Math.ceil(total / perPage)

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">错题本</h1>
        <p className="text-gray-500 mt-2">复习做错的题目，巩固薄弱知识点</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">科目筛选</label>
              <select
              value={subjectId}
              onChange={(e) => { setSubjectId(e.target.value); setPage(1) }}
              className="w-48 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            >
              <option value="">全部科目</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <p className="text-gray-500">
              共 <span className="text-red-600 font-semibold">{total}</span> 道错题
            </p>
            {total > 0 && (
              <button
                onClick={handleClear}
                className="px-4 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition text-sm"
              >
                清空错题
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6">
        {loading ? (
          <div className="text-center py-12">加载中...</div>
        ) : questions.length === 0 ? (
          <div className="text-center py-16">
          <div className="text-6xl mb-4">🎉</div>
          <p className="text-gray-400 text-lg">太棒了！暂无错题记录</p>
          <p className="text-gray-300 text-sm mt-2">继续保持，加油！</p>
        </div>
        ) : (
          <div className="space-y-4">
            {questions.map((q, index) => (
              <div
                key={q.id}
                className="border border-red-200 rounded-xl overflow-hidden hover:border-red-300 transition"
              >
                <div
                  className="p-4 cursor-pointer hover:bg-red-50"
                  onClick={() => setExpandedId(expandedId === q.id ? null : q.id)}
                >
                  <div className="flex items-start gap-4">
                    <span className="flex-shrink-0 w-8 h-8 bg-red-100 text-red-600 rounded-full flex items-center justify-center font-semibold text-sm">
                      {(page - 1) * perPage + index + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-600 text-xs rounded">
                          {getQuestionTypeName(q.type)}
                        </span>
                        <span className={`px-2 py-0.5 text-xs rounded ${getDifficultyColor(q.difficulty)}`}>
                          {getDifficultyName(q.difficulty)}
                        </span>
                        <span className="text-xs text-gray-400">{q.subject_name}</span>
                        <span className="text-xs text-gray-400">{q.score}分</span>
                        <span className="text-xs text-red-500">❌ 错误 {q.wrong_count}次</span>
                      </div>
                      <p className="text-gray-800 mt-1">{q.content}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => handleRemove(q.id, e)}
                        className="text-gray-400 hover:text-red-500 transition text-sm"
                      >
                        移除
                      </button>
                      <span className="text-gray-400">
                        {expandedId === q.id ? '▲' : '▼'}
                      </span>
                    </div>
                  </div>
                </div>

                {expandedId === q.id && (
                  <div className="border-t bg-gray-50 p-4">
                    {q.type !== 'judge' && q.options && (
                      <div className="mb-4 space-y-2">
                        {q.options.map((opt, i) => (
                          <div key={i} className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded bg-white border flex items-center justify-center text-sm">
                              {String.fromCharCode(65 + i)}
                            </span>
                            <span className="text-gray-700">{opt.replace(/^[A-D]\.\s*/, '')}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {q.type === 'judge' && (
                      <div className="mb-4 space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded bg-white border flex items-center justify-center text-sm">A</span>
                          <span className="text-gray-700">正确</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded bg-white border flex items-center justify-center text-sm">B</span>
                          <span className="text-gray-700">错误</span>
                        </div>
                      </div>
                    )}
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <p className="font-medium text-green-800 mb-2">正确答案：{q.answer}</p>
                      {q.analysis && (
                        <p className="text-green-700 text-sm">解析：{q.analysis}</p>
                      )}
                    </div>
                  </div>
                )}
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
