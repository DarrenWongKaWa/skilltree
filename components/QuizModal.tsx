'use client'

import { useState, useEffect } from 'react'
import type { Quiz } from '@/types'
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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-lg w-full max-h-[90vh] overflow-hidden shadow-2xl border border-stone-200 dark:border-slate-700">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white px-6 py-5">
          <div className="flex items-center gap-3">
            <span className="text-2xl">📝</span>
            <div>
              <h2 className="text-lg font-bold">{quiz.nodeName}</h2>
              <p className="text-blue-100 text-sm">
                {submitted ? 'Your Answers' : 'Skill Quiz - Answer the questions below'}
              </p>
            </div>
          </div>
        </div>

        {/* Questions */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[50vh]">
          {quiz.questions.map((q, i) => (
            <div key={q.id} className="space-y-3">
              <p className="font-medium text-stone-800 dark:text-stone-100">
                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 text-sm font-bold mr-2">
                  {i + 1}
                </span>
                {q.question}
              </p>

              {q.type === 'choice' && q.options && (
                <div className="space-y-2 ml-2">
                  {q.options.map((opt, j) => {
                    const letter = String.fromCharCode(65 + j)
                    const isSelected = answers[q.id] === letter
                    const isCorrect = letter === q.answer[0]
                    const showCorrect = submitted && isCorrect
                    const showWrong = submitted && isSelected && !isCorrect

                    return (
                      <label
                        key={j}
                        className={`
                          flex items-center gap-3 p-3.5 rounded-xl border-2 cursor-pointer
                          transition-all duration-200
                          ${showCorrect
                            ? 'border-green-500 bg-green-50 dark:bg-green-900/30'
                            : showWrong
                              ? 'border-red-500 bg-red-50 dark:bg-red-900/30'
                              : isSelected
                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30'
                                : submitted
                                  ? 'border-stone-200 dark:border-stone-700 opacity-60'
                                  : 'border-stone-200 dark:border-stone-700 hover:border-blue-300 dark:hover:border-blue-600 hover:bg-blue-50/50 dark:hover:bg-blue-900/20'
                          }
                        `}
                      >
                        <span className={`
                          flex items-center justify-center w-7 h-7 rounded-full text-sm font-bold
                          ${showCorrect
                            ? 'bg-green-500 text-white'
                            : showWrong
                              ? 'bg-red-500 text-white'
                              : isSelected
                                ? 'bg-blue-500 text-white'
                                : 'bg-stone-100 dark:bg-slate-700 text-stone-500 dark:text-stone-400'
                          }
                        `}>
                          {letter}
                        </span>
                        <span className="text-sm text-stone-700 dark:text-stone-200 flex-1">
                          {opt}
                        </span>
                        {showCorrect && <span className="text-green-500">✓</span>}
                        {showWrong && <span className="text-red-500">✗</span>}
                        <input
                          type="radio"
                          name={q.id}
                          value={letter}
                          checked={answers[q.id] === letter}
                          onChange={() => !submitted && setAnswers({ ...answers, [q.id]: letter })}
                          disabled={submitted}
                          className="sr-only"
                        />
                      </label>
                    )
                  })}
                </div>
              )}

              {q.type === 'short' && (
                <div className="ml-2">
                  <textarea
                    value={answers[q.id] || ''}
                    onChange={(e) => !submitted && setAnswers({ ...answers, [q.id]: e.target.value })}
                    disabled={submitted}
                    placeholder="Enter your answer..."
                    className="w-full p-3.5 border-2 border-stone-200 dark:border-slate-600 rounded-xl text-sm bg-white dark:bg-slate-900 text-stone-800 dark:text-stone-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-60 transition-all"
                    rows={3}
                  />
                </div>
              )}

              {submitted && result?.feedback?.[q.id] && (
                <div className={`ml-2 p-3 rounded-xl text-sm ${
                  result.feedback[q.id].startsWith('✅')
                    ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800'
                    : result.feedback[q.id].startsWith('👍')
                      ? 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800'
                      : 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800'
                }`}>
                  <div className="flex items-start gap-2">
                    <span className="text-base mt-0.5">
                      {result.feedback[q.id].startsWith('✅') ? '✓' : result.feedback[q.id].startsWith('👍') ? '👍' : '✗'}
                    </span>
                    <span>{result.feedback[q.id]}</span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Result Banner */}
        {submitted && result && (
          <div className={`mx-6 mb-4 p-4 rounded-xl ${
            result.passed
              ? 'bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/50 dark:to-emerald-900/50 text-green-800 dark:text-green-200'
              : 'bg-gradient-to-r from-amber-100 to-orange-100 dark:from-amber-900/50 dark:to-orange-900/50 text-amber-800 dark:text-amber-200'
          }`}>
            <div className="text-center">
              <p className="text-2xl mb-1">{result.passed ? '🎉' : '💪'}</p>
              <p className="font-bold text-lg">{result.message}</p>
              <p className="text-sm opacity-80 mt-1">
                Score: {result.score}/{result.total} ({Math.round((result.score / result.total) * 100)}%)
              </p>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="px-6 py-4 bg-stone-50/80 dark:bg-slate-900/50 border-t border-stone-100 dark:border-slate-700 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-stone-600 dark:text-stone-300 hover:text-stone-800 dark:hover:text-white font-medium rounded-lg hover:bg-stone-100 dark:hover:bg-slate-700 transition-colors"
          >
            {submitted ? 'Close' : 'Cancel'}
          </button>
          {!submitted && (
            <button
              onClick={handleSubmit}
              disabled={!allAnswered || submitting}
              className={`px-6 py-2.5 rounded-xl font-semibold text-white shadow-lg transition-all
                ${allAnswered && !submitting
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 hover:shadow-xl active:scale-[0.98]'
                  : 'bg-stone-300 dark:bg-slate-600 cursor-not-allowed'
                }`}
            >
              {submitting ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Evaluating
                </span>
              ) : 'Submit'}
            </button>
          )}
          {submitted && (
            <button
              onClick={handleClose}
              className={`px-6 py-2.5 rounded-xl font-semibold text-white shadow-lg transition-all hover:shadow-xl active:scale-[0.98] ${
                result?.passed
                  ? 'bg-gradient-to-r from-green-500 to-emerald-600'
                  : 'bg-gradient-to-r from-blue-500 to-purple-600'
              }`}
            >
              {result?.passed ? '🎉 Continue' : 'Close'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
