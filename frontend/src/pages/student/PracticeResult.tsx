import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Question } from '../../types'
import { getQuestionTypeName } from '../../utils/format'

interface PracticeResult {
  results: any[]
  questions: Question[]
  correct_count: number
  total_count: number
  total_score: number
  max_score: number
  accuracy: number
}

export const PracticeResult: React.FC = () => {
  const navigate = useNavigate()
  const [result, setResult] = useState<PracticeResult | null>(null)
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    const saved = sessionStorage.getItem('practice_results')
    if (!saved) {
      navigate('/practice')
      return
    }
    setResult(JSON.parse(saved))
  }, [navigate])

  if (!result) {
    return <div className="text-center py-20">加载中...</div>
  }

  const { results, questions, correct_count, total_count, total_score, max_score, accuracy } = result
  const isPass = accuracy >= 60
  const currentQuestion = questions[currentIndex]
  const currentResult = results[currentIndex]

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b shadow-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-800">模拟考试结果</h1>
              <p className="text-sm text-gray-500">共 {total_count} 道题</p>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/practice')}
                className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
              >
                重新练习
              </button>
              <button
                onClick={() => navigate('/')}
                className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                返回首页
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className={`rounded-2xl p-8 mb-6 ${isPass ? 'bg-gradient-to-r from-green-500 to-emerald-600' : 'bg-gradient-to-r from-red-500 to-orange-600'} text-white`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/80 text-lg">模拟考试</p>
              <h2 className="text-5xl font-bold mt-2">
                {total_score}
                <span className="text-2xl font-normal ml-2">/ {max_score} 分</span>
              </h2>
              <p className="text-white/80 mt-2">
                {isPass ? '🎉 做得不错！继续加油！' : '💪 还需要多多练习哦！'}
              </p>
            </div>
            <div className="text-right">
              <div className="text-6xl font-bold">{accuracy.toFixed(1)}%</div>
              <p className="text-white/80 mt-2">正确率</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-6 mt-8 pt-6 border-t border-white/20">
            <div>
              <p className="text-white/60 text-sm">答题总数</p>
              <p className="text-2xl font-bold mt-1">{total_count}</p>
            </div>
            <div>
              <p className="text-white/60 text-sm">答对题数</p>
              <p className="text-2xl font-bold mt-1">{correct_count}</p>
            </div>
            <div>
              <p className="text-white/60 text-sm">答错题数</p>
              <p className="text-2xl font-bold mt-1">{total_count - correct_count}</p>
            </div>
          </div>
        </div>

        <div className="flex gap-6">
          <div className="flex-1">
            <div className="bg-white rounded-xl shadow-sm p-8">
              <div className="flex items-center gap-3 mb-6">
                <span className={`w-10 h-10 text-white rounded-full flex items-center justify-center font-bold ${
                  currentResult.is_correct ? 'bg-green-500' : 'bg-red-500'
                }`}>
                  {currentIndex + 1}
                </span>
                <div>
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-600 text-xs rounded">
                    {getQuestionTypeName(currentQuestion.type)}
                  </span>
                  <span className={`ml-2 px-2 py-0.5 text-xs rounded ${
                    currentResult.is_correct ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                  }`}>
                    {currentResult.is_correct ? '正确' : '错误'}
                  </span>
                </div>
              </div>

              <p className="text-lg text-gray-800 mb-6 leading-relaxed">{currentQuestion.content}</p>

              <div className="space-y-4">
                {currentQuestion.type === 'judge' ? (
                  ['A', 'B'].map((opt, i) => (
                    <div
                      key={opt}
                      className={`flex items-center p-4 border-2 rounded-lg ${
                        currentResult.correct_answer === opt
                          ? 'border-green-500 bg-green-50'
                          : currentResult.student_answer === opt && !currentResult.is_correct
                            ? 'border-red-500 bg-red-50'
                            : 'border-gray-200'
                      }`}
                    >
                      <span className="w-5 h-5 mr-3"></span>
                      <span className="ml-3 text-gray-800">{i === 0 ? '正确' : '错误'}</span>
                      {currentResult.correct_answer === opt && (
                        <span className="ml-auto text-green-600 text-sm">✓ 正确答案</span>
                      )}
                      {currentResult.student_answer === opt && !currentResult.is_correct && (
                        <span className="ml-2 text-red-600 text-sm">✗ 你的选择</span>
                      )}
                    </div>
                  ))
                ) : (
                  currentQuestion.options?.map((opt, i) => {
                    const optValue = String.fromCharCode(65 + i)
                    const isCorrect = currentResult.correct_answer.includes(optValue)
                    const isSelected = currentResult.student_answer?.includes(optValue)
                    
                    return (
                      <div
                        key={i}
                        className={`flex items-center p-4 border-2 rounded-lg ${
                          isCorrect
                            ? 'border-green-500 bg-green-50'
                            : isSelected
                              ? 'border-red-500 bg-red-50'
                              : 'border-gray-200'
                        }`}
                      >
                        <span className="w-5 h-5 mr-3"></span>
                        <span className="ml-3 text-gray-800">
                          <span className="font-medium">{optValue}.</span> {opt.replace(/^[A-D]\.\s*/, '')}
                        </span>
                        {isCorrect && (
                          <span className="ml-auto text-green-600 text-sm">✓ 正确答案</span>
                        )}
                        {isSelected && !isCorrect && (
                          <span className="ml-2 text-red-600 text-sm">✗ 你的选择</span>
                        )}
                      </div>
                    )
                  })
                )}
              </div>

              {currentResult.analysis && (
                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm font-medium text-blue-800 mb-1">答案解析：</p>
                  <p className="text-sm text-blue-700">{currentResult.analysis}</p>
                </div>
              )}

              <div className="flex justify-between mt-8">
                <button
                  onClick={() => setCurrentIndex(i => Math.max(0, i - 1))}
                  disabled={currentIndex === 0}
                  className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  上一题
                </button>
                {currentIndex < questions.length - 1 ? (
                  <button
                    onClick={() => setCurrentIndex(i => i + 1)}
                    className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                  >
                    下一题
                  </button>
                ) : (
                  <span className="px-6 py-2.5 text-gray-500">已到最后一题</span>
                )}
              </div>
            </div>
          </div>

          <div className="w-72 flex-shrink-0">
            <div className="bg-white rounded-xl shadow-sm p-6 sticky top-28">
              <h3 className="font-semibold text-gray-800 mb-4">答题详情</h3>
              <div className="grid grid-cols-5 gap-2">
                {questions.map((q, i) => (
                  <button
                    key={q.id}
                    onClick={() => setCurrentIndex(i)}
                    className={`w-10 h-10 rounded-lg text-sm font-medium transition ${
                      i === currentIndex
                        ? 'ring-2 ring-blue-500 ring-offset-2'
                        : ''
                    } ${
                      results[i].is_correct
                        ? 'bg-green-100 text-green-700 border border-green-300'
                        : 'bg-red-100 text-red-700 border border-red-300'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
              <div className="mt-6 pt-4 border-t space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 bg-green-100 border border-green-300 rounded"></span>
                  <span className="text-gray-600">正确 {correct_count} 题</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 bg-red-100 border border-red-300 rounded"></span>
                  <span className="text-gray-600">错误 {total_count - correct_count} 题</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
