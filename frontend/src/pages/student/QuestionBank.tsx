import React, { useState, useEffect } from 'react'
import { getSubjects, getQuestions } from '../../api/question'
import { Subject, Question } from '../../types'
import { getQuestionTypeName, getDifficultyName, getDifficultyColor } from '../../utils/format'

export const QuestionBank: React.FC = () => {
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [questions, setQuestions] = useState<Question[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [perPage] = useState(10)
  const [filters, setFilters] = useState({
    subject_id: '',
    type: '',
    difficulty: '',
    keyword: ''
  })
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
  }, [page, filters])

  const loadQuestions = async () => {
    setLoading(true)
    try {
      const params: any = { page, per_page: perPage }
      if (filters.subject_id) params.subject_id = filters.subject_id
      if (filters.type) params.type = filters.type
      if (filters.difficulty) params.difficulty = filters.difficulty
      if (filters.keyword) params.keyword = filters.keyword

      const { data } = await getQuestions(params)
      setQuestions(data.items)
      setTotal(data.total)
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
    setPage(1)
  }

  const totalPages = Math.ceil(total / perPage)

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">题库浏览</h1>
        <p className="text-gray-500 mt-2">浏览和学习各科目练习题</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">科目</label>
            <select
              value={filters.subject_id}
              onChange={(e) => handleFilterChange('subject_id', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            >
              <option value="">全部科目</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">题型</label>
            <select
              value={filters.type}
              onChange={(e) => handleFilterChange('type', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            >
              <option value="">全部题型</option>
              <option value="single">单选题</option>
              <option value="multiple">多选题</option>
              <option value="judge">判断题</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">难度</label>
            <select
              value={filters.difficulty}
              onChange={(e) => handleFilterChange('difficulty', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            >
              <option value="">全部难度</option>
              <option value="easy">简单</option>
              <option value="medium">中等</option>
              <option value="hard">困难</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">搜索</label>
            <input
              type="text"
              value={filters.keyword}
              onChange={(e) => handleFilterChange('keyword', e.target.value)}
              placeholder="输入关键词..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={() => { setFilters({ subject_id: '', type: '', difficulty: '', keyword: '' }); setPage(1) }}
              className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
            >
              重置筛选
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <p className="text-gray-500">共 <span className="text-blue-600 font-semibold">{total}</span> 道题目</p>
        </div>

        {loading ? (
          <div className="text-center py-12">加载中...</div>
        ) : questions.length === 0 ? (
          <div className="text-center py-12 text-gray-400">暂无题目</div>
        ) : (
          <div className="space-y-4">
            {questions.map((q, index) => (
              <div
                key={q.id}
                className="border border-gray-200 rounded-lg overflow-hidden hover:border-blue-300 transition"
              >
                <div
                  className="p-4 cursor-pointer hover:bg-gray-50"
                  onClick={() => setExpandedId(expandedId === q.id ? null : q.id)}
                >
                  <div className="flex items-start gap-4">
                    <span className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-semibold text-sm">
                      {(page - 1) * perPage + index + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-600 text-xs rounded">
                          {getQuestionTypeName(q.type)}
                        </span>
                        <span className={`px-2 py-0.5 text-xs rounded ${getDifficultyColor(q.difficulty)}`}>
                          {getDifficultyName(q.difficulty)}
                        </span>
                        <span className="text-xs text-gray-400">{q.subject_name}</span>
                        <span className="text-xs text-gray-400">{q.score}分</span>
                      </div>
                      <p className="text-gray-800">{q.content}</p>
                    </div>
                    <span className="text-gray-400">
                      {expandedId === q.id ? '▲' : '▼'}
                    </span>
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
