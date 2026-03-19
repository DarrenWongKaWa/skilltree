'use client'

import { useState, useEffect } from 'react'
import type { Quiz, QuizQuestion } from '@/types'
import { evaluateQuiz } from '@/lib/api'

interface QuizModalProps {
  quiz: Quiz | null
  onClose: () => void
  onPass: () => void
}

export default function QuizModal({ quiz, onClose, onPass }: QuizModalProps) {
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [submitted, setSubmitted] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (quiz) {
      setAnswers({})
      setSubmitted(false)
      setResult(null)
    }
  }, [quiz])

  if (!quiz) return null

  const handleSubmit = async () => {
    setSubmitting(true)
    const answerList = quiz.questions.map(q => answers[q.id] || '')
    const res = await evaluateQuiz(quiz, answerList)
    setResult(res)
    setSubmitted(true)
    setSubmitting(false)
  }

  const handleClose = () => {
    if (submitted && result?.passed) onPass()
    onClose()
  }

  const allAnswered = quiz.questions.every(q => answers[q.id]?.trim())

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[85vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-4">
          <h2 className="text-lg font-bold">📝 {quiz.nodeName} — 能力测试</h2>
          <p className="text-blue-100 text-sm mt-1">
            {submitted ? '你的答案' : '请回答以下问题'}
          </p>
        </div>

        {/* Questions */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[50vh]">
          {quiz.questions.map((q, i) => (
            <div key={q.id} className="space-y-3">
              <p className="font-medium text-gray-800">
                <span className="text-blue-500 mr-2">Q{i + 1}.</span>
                {q.question}
              </p>

              {q.type === 'choice' && q.options && (
                <div className="space-y-2 ml-6">
                  {q.options.map((opt, j) => (
                    <label
                      key={j}
                      className={`
                        flex items-center gap-3 p-3 rounded-lg border cursor-pointer
                        transition-all
                        ${answers[q.id] === opt[0]
                          ? submitted
                            ? opt[0] === q.answer[0]
                              ? 'border-green-500 bg-green-50'
                              : 'border-red-500 bg-red-50'
                            : 'border-blue-500 bg-blue-50'
                          : submitted && opt[0] === q.answer[0]
                            ? 'border-green-500 bg-green-50'
                            : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                        }
                      `}
                    >
                      <input
                        type="radio"
                        name={q.id}
                        value={opt[0]}
                        checked={answers[q.id] === opt[0]}
                        onChange={() => !submitted && setAnswers({ ...answers, [q.id]: opt[0] })}
                        disabled={submitted}
                        className="w-4 h-4 text-blue-500"
                      />
                      <span className="text-sm text-gray-700">{opt}</span>
                    </label>
                  ))}
                </div>
              )}

              {q.type === 'short' && (
                <textarea
                  value={answers[q.id] || ''}
                  onChange={(e) => !submitted && setAnswers({ ...answers, [q.id]: e.target.value })}
                  disabled={submitted}
                  placeholder="请输入你的答案..."
                  className="w-full p-3 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
                  rows={3}
                />
              )}

              {submitted && result?.feedback?.[q.id] && (
                <div className={`ml-6 p-3 rounded-lg text-sm ${
                  result.feedback[q.id].startsWith('✅')
                    ? 'bg-green-50 text-green-700'
                    : result.feedback[q.id].startsWith('👍')
                      ? 'bg-yellow-50 text-yellow-700'
                      : 'bg-red-50 text-red-700'
                }`}>
                  {result.feedback[q.id]}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Result Banner */}
        {submitted && result && (
          <div className={`mx-6 mb-4 p-4 rounded-xl text-center font-semibold ${
            result.passed
              ? 'bg-green-100 text-green-800'
              : 'bg-yellow-100 text-yellow-800'
          }`}>
            {result.message}
            <div className="text-sm font-normal mt-1">
              得分：{result.score}/{result.total}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="px-6 py-4 bg-gray-50 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
          >
            {submitted ? '关闭' : '取消'}
          </button>
          {!submitted && (
            <button
              onClick={handleSubmit}
              disabled={!allAnswered || submitting}
              className={`px-6 py-2 rounded-lg font-medium text-white transition-all
                ${allAnswered && !submitting
                  ? 'bg-blue-500 hover:bg-blue-600'
                  : 'bg-gray-300 cursor-not-allowed'
                }`}
            >
              {submitting ? '评判中...' : '提交答案'}
            </button>
          )}
          {submitted && (
            <button
              onClick={handleClose}
              className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium"
            >
              {result?.passed ? '🎉 继续' : '关闭'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
