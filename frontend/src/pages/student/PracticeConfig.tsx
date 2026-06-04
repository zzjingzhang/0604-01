import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getSubjects } from '../../api/question'
import { generatePractice } from '../../api/exam'
import { Subject } from '../../types'

export const PracticeConfig: React.FC = () => {
  const navigate = useNavigate()
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [config, setConfig] = useState({
    subject_id: '',
    type: '',
    difficulty: '',
    count: 10
  })
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)

  useEffect(() => {
    loadSubjects()
  }, [])

  const loadSubjects = async () => {
    setLoading(true)
    try {
      const { data } = await getSubjects()
      setSubjects(data)
    } finally {
      setLoading(false)
    }
  }

  const handleGenerate = async () => {
    setGenerating(true)
    try {
      const { data } = await generatePractice({
        subject_id: config.subject_id ? Number(config.subject_id) : undefined,
        type: config.type || undefined,
        difficulty: config.difficulty || undefined,
        count: config.count
      })
      
      if (data.questions.length === 0) {
        alert('没有符合条件的题目')
        return
      }
      
      sessionStorage.setItem('practice_questions', JSON.stringify(data.questions))
      navigate('/practice/exam')
    } catch (err: any) {
      alert(err.response?.data?.error || '生成失败')
    } finally {
      setGenerating(false)
    }
  }

  const types = [
    { value: 'single', label: '单选题' },
    { value: 'multiple', label: '多选题' },
    { value: 'judge', label: '判断题' }
  ]

  const difficulties = [
    { value: 'easy', label: '简单' },
    { value: 'medium', label: '中等' },
    { value: 'hard', label: '困难' }
  ]

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">模拟考试</h1>
        <p className="text-gray-500 mt-2">自定义练习内容，随机抽题练习</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-8 max-w-2xl">
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              选择科目
            </label>
            <select
              value={config.subject_id}
              onChange={(e) => setConfig(c => ({ ...c, subject_id: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            >
              <option value="">全部科目</option>
              {subjects.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              题目类型
            </label>
            <select
              value={config.type}
              onChange={(e) => setConfig(c => ({ ...c, type: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            >
              <option value="">全部类型</option>
              {types.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              难度级别
            </label>
            <select
              value={config.difficulty}
              onChange={(e) => setConfig(c => ({ ...c, difficulty: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            >
              <option value="">全部难度</option>
              {difficulties.map(d => (
                <option key={d.value} value={d.value}>{d.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              题目数量: {config.count} 题
            </label>
            <input
              type="range"
              min="5"
              max="50"
              step="5"
              value={config.count}
              onChange={(e) => setConfig(c => ({ ...c, count: Number(e.target.value) }))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>5题</span>
              <span>25题</span>
              <span>50题</span>
            </div>
          </div>

          <button
            onClick={handleGenerate}
            disabled={generating}
            className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 transition font-medium text-lg"
          >
            {generating ? '生成中...' : '开始模拟考试'}
          </button>
        </div>
      </div>
    </div>
  )
}
