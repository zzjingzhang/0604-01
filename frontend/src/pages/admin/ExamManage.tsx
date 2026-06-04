import React, { useState, useEffect } from 'react'
import { getExams, getExam, createExam, updateExam, deleteExam } from '../../api/exam'
import { getAllPapers } from '../../api/paper'
import { getAllStudents } from '../../api/score'
import { Exam, Paper, User } from '../../types'
import { formatDate, formatDuration } from '../../utils/format'

export const ExamManage: React.FC = () => {
  const [exams, setExams] = useState<Exam[]>([])
  const [papers, setPapers] = useState<Paper[]>([])
  const [students, setStudents] = useState<User[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [perPage] = useState(10)
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showStudentModal, setShowStudentModal] = useState(false)
  const [editingExam, setEditingExam] = useState<Exam | null>(null)
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null)
  const [filters, setFilters] = useState({ status: '', keyword: '' })

  const [formData, setFormData] = useState({
    title: '',
    paper_id: 0,
    start_time: '',
    end_time: '',
    student_ids: [] as number[]
  })

  useEffect(() => {
    loadPapers()
    loadStudents()
  }, [])

  useEffect(() => {
    loadExams()
  }, [page, filters])

  const loadPapers = async () => {
    try {
      const { data } = await getAllPapers()
      setPapers(data)
    } catch (err: any) {
      console.error('加载试卷失败:', err)
    }
  }

  const loadStudents = async () => {
    try {
      const { data } = await getAllStudents()
      setStudents(data)
    } catch (err: any) {
      console.error('加载学生失败:', err)
    }
  }

  const loadExams = async () => {
    setLoading(true)
    try {
      const params: any = { page, per_page: perPage }
      if (filters.status) params.status = filters.status
      if (filters.keyword) params.keyword = filters.keyword
      const { data } = await getExams(params)
      setExams(data.items)
      setTotal(data.total)
    } finally {
      setLoading(false)
    }
  }

  const openCreateModal = () => {
    setEditingExam(null)
    setFormData({
      title: '',
      paper_id: papers[0]?.id || 0,
      start_time: '',
      end_time: '',
      student_ids: []
    })
    setShowModal(true)
  }

  const openEditModal = async (exam: Exam) => {
    try {
      const { data } = await getExam(exam.id)
      setEditingExam(exam)
      setFormData({
        title: data.title,
        paper_id: data.paper_id,
        start_time: data.start_time ? data.start_time.slice(0, 16) : '',
        end_time: data.end_time ? data.end_time.slice(0, 16) : '',
        student_ids: data.students?.map(s => s.id) || []
      })
      setShowModal(true)
    } catch (err: any) {
      console.error('加载考试详情失败:', err)
    }
  }

  const openStudentModal = async (exam: Exam) => {
    try {
      const { data } = await getExam(exam.id)
      setSelectedExam(data)
      setShowStudentModal(true)
    } catch (err: any) {
      console.error('加载考试详情失败:', err)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingExam) {
        await updateExam(editingExam.id, formData)
        alert('更新成功')
      } else {
        await createExam(formData)
        alert('创建成功')
      }
      setShowModal(false)
      loadExams()
    } catch (err: any) {
      alert(err.response?.data?.error || '操作失败')
    }
  }

  const handleDelete = async (id: number) => {
    if (confirm('确定要删除这个考试吗？')) {
      try {
        await deleteExam(id)
        alert('删除成功')
        loadExams()
      } catch (err: any) {
        alert(err.response?.data?.error || '删除失败')
      }
    }
  }

  const toggleStudent = (studentId: number) => {
    const newIds = formData.student_ids.includes(studentId)
      ? formData.student_ids.filter(id => id !== studentId)
      : [...formData.student_ids, studentId]
    setFormData({ ...formData, student_ids: newIds })
  }

  const selectAllStudents = () => {
    if (formData.student_ids.length === students.length) {
      setFormData({ ...formData, student_ids: [] })
    } else {
      setFormData({ ...formData, student_ids: students.map(s => s.id) })
    }
  }

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      draft: 'bg-gray-100 text-gray-700',
      published: 'bg-green-100 text-green-700',
      ended: 'bg-blue-100 text-blue-700'
    }
    const labels: Record<string, string> = {
      draft: '草稿',
      published: '已发布',
      ended: '已结束'
    }
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] || 'bg-gray-100 text-gray-700'}`}>
        {labels[status] || status}
      </span>
    )
  }

  const totalPages = Math.ceil(total / perPage)

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">考试管理</h1>
          <p className="text-gray-500 mt-2">管理考试安排</p>
        </div>
        <button
          onClick={openCreateModal}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          + 新增考试
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">状态</label>
            <select
              value={filters.status}
              onChange={(e) => { setFilters({ ...filters, status: e.target.value }); setPage(1) }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="">全部状态</option>
              <option value="draft">草稿</option>
              <option value="published">已发布</option>
              <option value="ended">已结束</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">关键词</label>
            <input
              type="text"
              value={filters.keyword}
              onChange={(e) => setFilters({ ...filters, keyword: e.target.value })}
              onKeyDown={(e) => e.key === 'Enter' && setPage(1)}
              placeholder="搜索考试名称"
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
        ) : exams.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <div className="text-6xl mb-4">📝</div>
            <p>暂无考试</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-gray-500 text-sm border-b">
                  <th className="pb-4 font-medium">考试名称</th>
                  <th className="pb-4 font-medium">试卷</th>
                  <th className="pb-4 font-medium">题目数</th>
                  <th className="pb-4 font-medium">总分</th>
                  <th className="pb-4 font-medium">时长</th>
                  <th className="pb-4 font-medium">参考人数</th>
                  <th className="pb-4 font-medium">状态</th>
                  <th className="pb-4 font-medium">创建时间</th>
                  <th className="pb-4 font-medium">操作</th>
                </tr>
              </thead>
              <tbody>
                {exams.map((exam) => (
                  <tr key={exam.id} className="border-b hover:bg-gray-50">
                    <td className="py-4">
                      <p className="font-medium text-gray-800">{exam.title}</p>
                      {exam.start_time && (
                        <p className="text-xs text-gray-400 mt-1">
                          {formatDate(exam.start_time)} - {formatDate(exam.end_time)}
                        </p>
                      )}
                    </td>
                    <td className="py-4 text-gray-600">{exam.paper_title}</td>
                    <td className="py-4 text-gray-600">{exam.question_count || 0} 题</td>
                    <td className="py-4 text-gray-600">{exam.total_score || 0} 分</td>
                    <td className="py-4 text-gray-600">{formatDuration(exam.duration || 0)}</td>
                    <td className="py-4 text-gray-600">{exam.attempt_count || 0} 人</td>
                    <td className="py-4">{getStatusBadge(exam.status)}</td>
                    <td className="py-4 text-gray-500">{formatDate(exam.created_at)}</td>
                    <td className="py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openStudentModal(exam)}
                          className="px-3 py-1 text-purple-600 hover:bg-purple-50 rounded transition text-sm"
                        >
                          考生
                        </button>
                        <button
                          onClick={() => openEditModal(exam)}
                          className="px-3 py-1 text-blue-600 hover:bg-blue-50 rounded transition text-sm"
                        >
                          编辑
                        </button>
                        <button
                          onClick={() => handleDelete(exam.id)}
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
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold text-gray-800">
                {editingExam ? '编辑考试' : '新增考试'}
              </h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">考试名称 *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="请输入考试名称"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">选择试卷 *</label>
                <select
                  value={formData.paper_id}
                  onChange={(e) => setFormData({ ...formData, paper_id: Number(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  required
                >
                  <option value={0}>请选择试卷</option>
                  {papers.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title} ({p.subject_name} - {p.question_count || 0}题 - {p.total_score}分)
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">开始时间</label>
                  <input
                    type="datetime-local"
                    value={formData.start_time}
                    onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">结束时间</label>
                  <input
                    type="datetime-local"
                    value={formData.end_time}
                    onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">选择考生</label>
                  <button
                    type="button"
                    onClick={selectAllStudents}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    {formData.student_ids.length === students.length ? '取消全选' : '全选'}
                  </button>
                </div>
                <div className="border border-gray-300 rounded-lg p-4 max-h-48 overflow-y-auto">
                  {students.length === 0 ? (
                    <p className="text-gray-400 text-sm">暂无学生</p>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      {students.map((student) => (
                        <label key={student.id} className="flex items-center gap-2 cursor-pointer p-2 rounded hover:bg-gray-50">
                          <input
                            type="checkbox"
                            checked={formData.student_ids.includes(student.id)}
                            onChange={() => toggleStudent(student.id)}
                            className="w-4 h-4"
                          />
                          <span className="text-sm">
                            {student.real_name || student.username}
                          </span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  已选择 {formData.student_ids.length} / {students.length} 名学生
                </p>
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
                  {editingExam ? '保存修改' : '创建考试'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showStudentModal && selectedExam && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg">
            <div className="p-6 border-b flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-800">考生列表 - {selectedExam.title}</h2>
              <button
                onClick={() => setShowStudentModal(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ✕
              </button>
            </div>
            <div className="p-6 max-h-96 overflow-y-auto">
              {!selectedExam.students || selectedExam.students.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <p>暂无考生</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {selectedExam.students.map((student, index) => (
                    <div key={student.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <span className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                        {index + 1}
                      </span>
                      <div>
                        <p className="font-medium text-gray-800">
                          {student.real_name || student.username}
                        </p>
                        <p className="text-sm text-gray-500">@{student.username}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="p-6 border-t">
              <p className="text-sm text-gray-500 text-center">
                共 {selectedExam.students?.length || 0} 名考生
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
