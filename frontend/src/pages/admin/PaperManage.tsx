import React, { useState, useEffect } from 'react'
import { getPapers, getPaper, createPaper, updatePaper, deletePaper, addQuestionsToPaper, removeQuestionFromPaper } from '../../api/paper'
import { getSubjects, getQuestions } from '../../api/question'
import { Paper, Subject, Question } from '../../types'
import { formatDate, getQuestionTypeName } from '../../utils/format'

export const PaperManage: React.FC = () => {
  const [papers, setPapers] = useState<Paper[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [perPage] = useState(10)
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showQuestionModal, setShowQuestionModal] = useState(false)
  const [editingPaper, setEditingPaper] = useState<Paper | null>(null)
  const [selectedPaper, setSelectedPaper] = useState<Paper | null>(null)
  const [availableQuestions, setAvailableQuestions] = useState<Question[]>([])
  const [selectedQuestions, setSelectedQuestions] = useState<Map<number, number>>(new Map())
  const [questionPage, setQuestionPage] = useState(1)
  const [questionTotal, setQuestionTotal] = useState(0)
  const [filters, setFilters] = useState({ subject_id: '', keyword: '' })
  const [questionFilter, setQuestionFilter] = useState({ subject_id: '', keyword: '' })

  const [formData, setFormData] = useState({
    title: '',
    subject_id: 0,
    description: '',
    total_score: 100,
    duration: 60
  })

  useEffect(() => {
    loadSubjects()
  }, [])

  useEffect(() => {
    loadPapers()
  }, [page, filters])

  useEffect(() => {
    if (showQuestionModal) {
      loadAvailableQuestions()
    }
  }, [showQuestionModal, questionPage, questionFilter])

  const loadSubjects = async () => {
    try {
      const { data } = await getSubjects()
      setSubjects(data)
    } catch (err: any) {
      console.error('加载科目失败:', err)
    }
  }

  const loadPapers = async () => {
    setLoading(true)
    try {
      const params: any = { page, per_page: perPage }
      if (filters.subject_id) params.subject_id = filters.subject_id
      if (filters.keyword) params.keyword = filters.keyword
      const { data } = await getPapers(params)
      setPapers(data.items)
      setTotal(data.total)
    } finally {
      setLoading(false)
    }
  }

  const loadAvailableQuestions = async () => {
    try {
      const params: any = { page: questionPage, per_page: 20 }
      if (questionFilter.subject_id) params.subject_id = questionFilter.subject_id
      if (questionFilter.keyword) params.keyword = questionFilter.keyword
      const { data } = await getQuestions(params)
      setAvailableQuestions(data.items)
      setQuestionTotal(data.total)
    } catch (err: any) {
      console.error('加载题目失败:', err)
    }
  }

  const openCreateModal = () => {
    setEditingPaper(null)
    setFormData({
      title: '',
      subject_id: subjects[0]?.id || 0,
      description: '',
      total_score: 100,
      duration: 60
    })
    setShowModal(true)
  }

  const openEditModal = (paper: Paper) => {
    setEditingPaper(paper)
    setFormData({
      title: paper.title,
      subject_id: paper.subject_id,
      description: paper.description,
      total_score: paper.total_score,
      duration: paper.duration
    })
    setShowModal(true)
  }

  const openQuestionModal = async (paper: Paper) => {
    setSelectedPaper(paper)
    setSelectedQuestions(new Map())
    setQuestionPage(1)
    setQuestionFilter({ subject_id: String(paper.subject_id), keyword: '' })
    setShowQuestionModal(true)
    try {
      const { data } = await getPaper(paper.id)
      setSelectedPaper(data)
    } catch (err: any) {
      console.error('加载试卷详情失败:', err)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingPaper) {
        await updatePaper(editingPaper.id, formData)
        alert('更新成功')
      } else {
        await createPaper(formData)
        alert('创建成功')
      }
      setShowModal(false)
      loadPapers()
    } catch (err: any) {
      alert(err.response?.data?.error || '操作失败')
    }
  }

  const handleDelete = async (id: number) => {
    if (confirm('确定要删除这份试卷吗？')) {
      try {
        await deletePaper(id)
        alert('删除成功')
        loadPapers()
      } catch (err: any) {
        alert(err.response?.data?.error || '删除失败')
      }
    }
  }

  const toggleQuestionSelect = (questionId: number, score: number) => {
    const newSelected = new Map(selectedQuestions)
    if (newSelected.has(questionId)) {
      newSelected.delete(questionId)
    } else {
      newSelected.set(questionId, score)
    }
    setSelectedQuestions(newSelected)
  }

  const updateQuestionScore = (questionId: number, score: number) => {
    const newSelected = new Map(selectedQuestions)
    newSelected.set(questionId, score)
    setSelectedQuestions(newSelected)
  }

  const handleAddQuestions = async () => {
    if (!selectedPaper || selectedQuestions.size === 0) {
      alert('请至少选择一道题')
      return
    }
    try {
      const questions = Array.from(selectedQuestions.entries()).map(([question_id, score]) => ({
        question_id,
        score
      }))
      await addQuestionsToPaper(selectedPaper.id, questions)
      alert('添加成功')
      const { data } = await getPaper(selectedPaper.id)
      setSelectedPaper(data)
      setSelectedQuestions(new Map())
    } catch (err: any) {
      alert(err.response?.data?.error || '添加失败')
    }
  }

  const handleRemoveQuestion = async (questionId: number) => {
    if (!selectedPaper) return
    if (confirm('确定要从试卷中移除这道题吗？')) {
      try {
        await removeQuestionFromPaper(selectedPaper.id, questionId)
        alert('移除成功')
        const { data } = await getPaper(selectedPaper.id)
        setSelectedPaper(data)
      } catch (err: any) {
        alert(err.response?.data?.error || '移除失败')
      }
    }
  }

  const totalPages = Math.ceil(total / perPage)
  const questionTotalPages = Math.ceil(questionTotal / 20)

  const isQuestionInPaper = (questionId: number) => {
    return selectedPaper?.questions?.some(q => q.id === questionId) || false
  }

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">试卷管理</h1>
          <p className="text-gray-500 mt-2">管理考试试卷</p>
        </div>
        <button
          onClick={openCreateModal}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          + 新增试卷
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
            <label className="block text-sm font-medium text-gray-700 mb-2">关键词</label>
            <input
              type="text"
              value={filters.keyword}
              onChange={(e) => setFilters({ ...filters, keyword: e.target.value })}
              onKeyDown={(e) => e.key === 'Enter' && setPage(1)}
              placeholder="搜索试卷名称"
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
        ) : papers.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <div className="text-6xl mb-4">📄</div>
            <p>暂无试卷</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-gray-500 text-sm border-b">
                  <th className="pb-4 font-medium">试卷名称</th>
                  <th className="pb-4 font-medium">科目</th>
                  <th className="pb-4 font-medium">题目数</th>
                  <th className="pb-4 font-medium">总分</th>
                  <th className="pb-4 font-medium">时长</th>
                  <th className="pb-4 font-medium">创建时间</th>
                  <th className="pb-4 font-medium">操作</th>
                </tr>
              </thead>
              <tbody>
                {papers.map((paper) => (
                  <tr key={paper.id} className="border-b hover:bg-gray-50">
                    <td className="py-4">
                      <p className="font-medium text-gray-800">{paper.title}</p>
                      {paper.description && (
                        <p className="text-sm text-gray-400 mt-1 line-clamp-1">{paper.description}</p>
                      )}
                    </td>
                    <td className="py-4 text-gray-600">{paper.subject_name}</td>
                    <td className="py-4 text-gray-600">{paper.question_count || 0} 题</td>
                    <td className="py-4 text-gray-600">{paper.actual_total_score || paper.total_score} 分</td>
                    <td className="py-4 text-gray-600">{paper.duration} 分钟</td>
                    <td className="py-4 text-gray-500">{formatDate(paper.created_at)}</td>
                    <td className="py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openQuestionModal(paper)}
                          className="px-3 py-1 text-green-600 hover:bg-green-50 rounded transition text-sm"
                        >
                          组卷
                        </button>
                        <button
                          onClick={() => openEditModal(paper)}
                          className="px-3 py-1 text-blue-600 hover:bg-blue-50 rounded transition text-sm"
                        >
                          编辑
                        </button>
                        <button
                          onClick={() => handleDelete(paper.id)}
                          className="px-3 py-1 text-red-600 hover:bg-red-50 rounded transition text-sm"
                        >
                          删除
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
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
          <div className="bg-white rounded-2xl w-full max-w-lg">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold text-gray-800">
                {editingPaper ? '编辑试卷' : '新增试卷'}
              </h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">试卷名称 *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="请输入试卷名称"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  required
                />
              </div>
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
                <label className="block text-sm font-medium text-gray-700 mb-2">试卷描述</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={2}
                  placeholder="请输入试卷描述"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">总分 *</label>
                  <input
                    type="number"
                    value={formData.total_score}
                    onChange={(e) => setFormData({ ...formData, total_score: Number(e.target.value) })}
                    min="1"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">考试时长(分钟) *</label>
                  <input
                    type="number"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: Number(e.target.value) })}
                    min="1"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    required
                  />
                </div>
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
                  {editingPaper ? '保存修改' : '创建试卷'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showQuestionModal && selectedPaper && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-5xl max-h-[90vh] flex flex-col">
            <div className="p-6 border-b flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-800">组卷管理 - {selectedPaper.title}</h2>
                <p className="text-sm text-gray-500 mt-1">
                  当前试卷：{selectedPaper.questions?.length || 0} 题，共 {selectedPaper.actual_total_score || 0} 分
                </p>
              </div>
              <button
                onClick={() => setShowQuestionModal(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 flex overflow-hidden">
              <div className="w-1/2 p-6 border-r overflow-y-auto">
                <h3 className="font-semibold text-gray-800 mb-4">已选题目</h3>
                {!selectedPaper.questions || selectedPaper.questions.length === 0 ? (
                  <div className="text-center py-12 text-gray-400">
                    <p>暂无题目，请从右侧添加</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {selectedPaper.questions.map((q, index) => (
                      <div key={q.id} className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                                {index + 1}
                              </span>
                              <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-600 rounded">
                                {getQuestionTypeName(q.type)}
                              </span>
                              <span className="text-xs text-gray-500">{q.score}分</span>
                            </div>
                            <p className="text-sm text-gray-700 line-clamp-2">{q.content}</p>
                          </div>
                          <button
                            onClick={() => handleRemoveQuestion(q.id)}
                            className="ml-2 text-red-500 hover:text-red-700"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="w-1/2 p-6 overflow-y-auto">
                <h3 className="font-semibold text-gray-800 mb-4">题库选择</h3>
                <div className="flex gap-2 mb-4">
                  <select
                    value={questionFilter.subject_id}
                    onChange={(e) => { setQuestionFilter({ ...questionFilter, subject_id: e.target.value }); setQuestionPage(1) }}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="">全部科目</option>
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={questionFilter.keyword}
                    onChange={(e) => setQuestionFilter({ ...questionFilter, keyword: e.target.value })}
                    onKeyDown={(e) => e.key === 'Enter' && setQuestionPage(1)}
                    placeholder="搜索"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div className="space-y-2 mb-4 max-h-96 overflow-y-auto">
                  {availableQuestions.map((q) => {
                    const isSelected = selectedQuestions.has(q.id)
                    const isInPaper = isQuestionInPaper(q.id)
                    return (
                      <div
                        key={q.id}
                        className={`p-3 rounded-lg border-2 transition cursor-pointer ${
                          isInPaper ? 'border-green-300 bg-green-50 opacity-60' :
                          isSelected ? 'border-blue-500 bg-blue-50' :
                          'border-gray-200 hover:border-blue-300'
                        }`}
                        onClick={() => !isInPaper && toggleQuestionSelect(q.id, q.score)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-600 rounded">
                                {getQuestionTypeName(q.type)}
                              </span>
                              <span className="text-xs text-gray-500">{q.subject_name}</span>
                              {isInPaper && (
                                <span className="text-xs text-green-600">已添加</span>
                              )}
                            </div>
                            <p className="text-sm text-gray-700 line-clamp-2">{q.content}</p>
                          </div>
                          {isSelected && (
                            <div className="ml-2 flex items-center gap-1">
                              <input
                                type="number"
                                value={selectedQuestions.get(q.id) || q.score}
                                onChange={(e) => updateQuestionScore(q.id, Number(e.target.value))}
                                onClick={(e) => e.stopPropagation()}
                                min="1"
                                className="w-16 px-2 py-1 border border-gray-300 rounded text-sm text-center"
                              />
                              <span className="text-xs text-gray-500">分</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
                {questionTotalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mb-4">
                    <button
                      onClick={() => setQuestionPage(p => Math.max(1, p - 1))}
                      disabled={questionPage === 1}
                      className="px-3 py-1 border rounded text-sm disabled:opacity-50"
                    >
                      上一页
                    </button>
                    <span className="text-sm text-gray-600">
                      第 {questionPage} / {questionTotalPages} 页
                    </span>
                    <button
                      onClick={() => setQuestionPage(p => Math.min(questionTotalPages, p + 1))}
                      disabled={questionPage === questionTotalPages}
                      className="px-3 py-1 border rounded text-sm disabled:opacity-50"
                    >
                      下一页
                    </button>
                  </div>
                )}
                <div className="flex items-center justify-between pt-4 border-t">
                  <span className="text-sm text-gray-500">
                    已选择 {selectedQuestions.size} 题
                  </span>
                  <button
                    onClick={handleAddQuestions}
                    disabled={selectedQuestions.size === 0}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    添加到试卷
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
