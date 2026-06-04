import React, { useState, useEffect } from 'react'
import { getSubjects, getQuestions, createQuestion, updateQuestion, deleteQuestion } from '../../api/question'
import { Question, Subject, PageResponse } from '../../types'
import { getQuestionTypeName, getDifficultyName, getDifficultyColor } from '../../utils/format'

interface QuestionFormData {
  subject_id: number
  type: 'single' | 'multiple' | 'judge'
  content: string
  options: string[]
  answer: string
  analysis: string
  score: number
  difficulty: 'easy' | 'medium' | 'hard'
  knowledge_point: string
}

export const QuestionManage: React.FC = () => {
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [questions, setQuestions] = useState<Question[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [perPage] = useState(10)
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null)
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [filters, setFilters] = useState({
    subject_id: '',
    type: '',
    difficulty: '',
    keyword: ''
  })

  const [formData, setFormData] = useState<QuestionFormData>({
    subject_id: 0,
    type: 'single',
    content: '',
    options: ['', '', '', ''],
    answer: '',
    analysis: '',
    score: 10,
    difficulty: 'medium',
    knowledge_point: ''
  })

  useEffect(() => {
    loadSubjects()
  }, [])

  useEffect(() => {
    loadQuestions()
  }, [page, filters])

  const loadSubjects = async () => {
    try {
      const { data } = await getSubjects()
      setSubjects(data)
    } catch (err: any) {
      console.error('加载科目失败:', err)
    }
  }

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

  const openCreateModal = () => {
    setEditingQuestion(null)
    setFormData({
      subject_id: subjects[0]?.id || 0,
      type: 'single',
      content: '',
      options: ['', '', '', ''],
      answer: '',
      analysis: '',
      score: 10,
      difficulty: 'medium',
      knowledge_point: ''
    })
    setShowModal(true)
  }

  const openEditModal = (question: Question) => {
    setEditingQuestion(question)
    setFormData({
      subject_id: question.subject_id,
      type: question.type,
      content: question.content,
      options: question.options || ['', '', '', ''],
      answer: question.answer,
      analysis: question.analysis || '',
      score: question.score,
      difficulty: question.difficulty,
      knowledge_point: question.knowledge_point || ''
    })
    setShowModal(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (formData.type !== 'judge' && formData.options.filter(o => o.trim()).length < 2) {
        alert('请至少填写2个选项')
        return
      }
      if (!formData.answer) {
        alert('请填写正确答案')
        return
      }

      const submitData: Partial<Question> = {
        subject_id: formData.subject_id,
        type: formData.type,
        content: formData.content,
        options: formData.type === 'judge' ? undefined : formData.options.filter(o => o.trim()),
        answer: formData.answer,
        analysis: formData.analysis || undefined,
        score: formData.score,
        difficulty: formData.difficulty,
        knowledge_point: formData.knowledge_point || undefined
      }

      if (editingQuestion) {
        await updateQuestion(editingQuestion.id, submitData)
        alert('更新成功')
      } else {
        await createQuestion(submitData)
        alert('创建成功')
      }
      setShowModal(false)
      loadQuestions()
    } catch (err: any) {
      alert(err.response?.data?.error || '操作失败')
    }
  }

  const handleDelete = async (id: number) => {
    if (confirm('确定要删除这道题吗？')) {
      try {
        await deleteQuestion(id)
        alert('删除成功')
        loadQuestions()
      } catch (err: any) {
        alert(err.response?.data?.error || '删除失败')
      }
    }
  }

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...formData.options]
    newOptions[index] = value
    setFormData({ ...formData, options: newOptions })
  }

  const addOption = () => {
    if (formData.options.length < 8) {
      setFormData({ ...formData, options: [...formData.options, ''] })
    }
  }

  const removeOption = (index: number) => {
    if (formData.options.length > 2) {
      const newOptions = formData.options.filter((_, i) => i !== index)
      setFormData({ ...formData, options: newOptions })
    }
  }

  const totalPages = Math.ceil(total / perPage)

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">题库管理</h1>
          <p className="text-gray-500 mt-2">管理考试题目</p>
        </div>
        <button
          onClick={openCreateModal}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          + 新增题目
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">科目</label>
            <select
              value={filters.subject_id}
              onChange={(e) => { setFilters({ ...filters, subject_id: e.target.value }); setPage(1) }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
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
              onChange={(e) => { setFilters({ ...filters, type: e.target.value }); setPage(1) }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
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
              onChange={(e) => { setFilters({ ...filters, difficulty: e.target.value }); setPage(1) }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="">全部难度</option>
              <option value="easy">简单</option>
              <option value="medium">中等</option>
              <option value="hard">困难</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">关键词</label>
            <input
              type="text"
              value={filters.keyword}
              onChange={(e) => setFilters({ ...filters, keyword: e.target.value })}
              onKeyDown={(e) => e.key === 'Enter' && setPage(1)}
              placeholder="搜索题目内容"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={() => setPage(1)}
              className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
            >
              搜索
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6">
        {loading ? (
          <div className="text-center py-12">加载中...</div>
        ) : questions.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <div className="text-6xl mb-4">📭</div>
            <p>暂无题目</p>
          </div>
        ) : (
          <div className="space-y-4">
            {questions.map((q, index) => (
              <div
                key={q.id}
                className="border border-gray-200 rounded-xl overflow-hidden hover:border-blue-300 transition"
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
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-600 text-xs rounded">
                          {getQuestionTypeName(q.type)}
                        </span>
                        <span className={`px-2 py-0.5 text-xs rounded ${getDifficultyColor(q.difficulty)}`}>
                          {getDifficultyName(q.difficulty)}
                        </span>
                        <span className="text-xs text-gray-400">{q.subject_name}</span>
                        <span className="text-xs text-gray-400">{q.score}分</span>
                        {q.knowledge_point && (
                          <span className="text-xs text-gray-400">📌 {q.knowledge_point}</span>
                        )}
                      </div>
                      <p className="text-gray-800 mt-1 line-clamp-2">{q.content}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => { e.stopPropagation(); openEditModal(q) }}
                        className="px-3 py-1 text-blue-600 hover:bg-blue-50 rounded transition text-sm"
                      >
                        编辑
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(q.id) }}
                        className="px-3 py-1 text-red-600 hover:bg-red-50 rounded transition text-sm"
                      >
                        删除
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
                            <span className={`w-6 h-6 rounded flex items-center justify-center text-sm ${
                              q.answer?.includes(String.fromCharCode(65 + i))
                                ? 'bg-green-500 text-white'
                                : 'bg-white border'
                            }`}>
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
                          <span className={`w-6 h-6 rounded flex items-center justify-center text-sm ${
                            q.answer === 'A' ? 'bg-green-500 text-white' : 'bg-white border'
                          }`}>A</span>
                          <span className="text-gray-700">正确</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`w-6 h-6 rounded flex items-center justify-center text-sm ${
                            q.answer === 'B' ? 'bg-green-500 text-white' : 'bg-white border'
                          }`}>B</span>
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
              第 {page} / {totalPages} 页，共 {total} 条
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

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold text-gray-800">
                {editingQuestion ? '编辑题目' : '新增题目'}
              </h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">科目 *</label>
                  <select
                    value={formData.subject_id}
                    onChange={(e) => setFormData({ ...formData, subject_id: Number(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    required
                  >
                    <option value={0}>请选择科目</option>
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">题型 *</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as any, answer: '' })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    required
                  >
                    <option value="single">单选题</option>
                    <option value="multiple">多选题</option>
                    <option value="judge">判断题</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">分值 *</label>
                  <input
                    type="number"
                    value={formData.score}
                    onChange={(e) => setFormData({ ...formData, score: Number(e.target.value) })}
                    min="1"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">难度 *</label>
                  <select
                    value={formData.difficulty}
                    onChange={(e) => setFormData({ ...formData, difficulty: e.target.value as any })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    required
                  >
                    <option value="easy">简单</option>
                    <option value="medium">中等</option>
                    <option value="hard">困难</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">知识点</label>
                <input
                  type="text"
                  value={formData.knowledge_point}
                  onChange={(e) => setFormData({ ...formData, knowledge_point: e.target.value })}
                  placeholder="例如：函数、方程式"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">题目内容 *</label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  rows={3}
                  placeholder="请输入题目内容"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                  required
                />
              </div>

              {formData.type !== 'judge' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">选项 *</label>
                  <div className="space-y-2">
                    {formData.options.map((opt, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <span className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center text-sm font-medium">
                          {String.fromCharCode(65 + index)}
                        </span>
                        <input
                          type="text"
                          value={opt}
                          onChange={(e) => handleOptionChange(index, e.target.value)}
                          placeholder={`选项 ${String.fromCharCode(65 + index)}`}
                          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                        {formData.options.length > 2 && (
                          <button
                            type="button"
                            onClick={() => removeOption(index)}
                            className="px-2 py-2 text-red-500 hover:bg-red-50 rounded"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  {formData.options.length < 8 && (
                    <button
                      type="button"
                      onClick={addOption}
                      className="mt-2 text-blue-600 hover:underline text-sm"
                    >
                      + 添加选项
                    </button>
                  )}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">正确答案 *</label>
                {formData.type === 'judge' ? (
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="answer"
                        value="A"
                        checked={formData.answer === 'A'}
                        onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                        className="w-4 h-4"
                      />
                      <span>A. 正确</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="answer"
                        value="B"
                        checked={formData.answer === 'B'}
                        onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                        className="w-4 h-4"
                      />
                      <span>B. 错误</span>
                    </label>
                  </div>
                ) : formData.type === 'single' ? (
                  <div className="flex gap-4 flex-wrap">
                    {formData.options.filter(o => o.trim()).map((_, index) => (
                      <label key={index} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="answer"
                          value={String.fromCharCode(65 + index)}
                          checked={formData.answer === String.fromCharCode(65 + index)}
                          onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                          className="w-4 h-4"
                        />
                        <span>{String.fromCharCode(65 + index)}</span>
                      </label>
                    ))}
                  </div>
                ) : (
                  <div className="flex gap-4 flex-wrap">
                    {formData.options.filter(o => o.trim()).map((_, index) => (
                      <label key={index} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          value={String.fromCharCode(65 + index)}
                          checked={formData.answer?.includes(String.fromCharCode(65 + index))}
                          onChange={(e) => {
                            const current = formData.answer || ''
                            if (e.target.checked) {
                              setFormData({ ...formData, answer: (current + String.fromCharCode(65 + index)).split('').sort().join('') })
                            } else {
                              setFormData({ ...formData, answer: current.replace(String.fromCharCode(65 + index), '') })
                            }
                          }}
                          className="w-4 h-4"
                        />
                        <span>{String.fromCharCode(65 + index)}</span>
                      </label>
                    ))}
                    <p className="text-xs text-gray-500 w-full mt-1">多选题请勾选所有正确选项（答案按字母顺序排列）</p>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">答案解析</label>
                <textarea
                  value={formData.analysis}
                  onChange={(e) => setFormData({ ...formData, analysis: e.target.value })}
                  rows={2}
                  placeholder="请输入答案解析"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  {editingQuestion ? '保存修改' : '创建题目'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
