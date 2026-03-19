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
    <div className="fixed inset-0 bg-[rgb(var(--background))]/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-[rgb(var(--card))] rounded-2xl max-w-lg w-full max-h-[90vh] overflow-hidden shadow-2xl border border-[rgb(var(--border))]">
        {/* Header - bamboo/silk banner style */}
        <div className="bg-[rgb(var(--primary))] text-[rgb(var(--primary-foreground))] px-6 py-5 border-b-4 border-[rgb(var(--accent))]">
          <div className="flex items-center gap-3">
            <span className="text-2xl" style={{ fontFamily: 'var(--font-brush-chinese)' }}>◇</span>
            <div>
              <h2 className="text-lg font-bold" style={{ fontFamily: "'Noto Serif', Georgia, serif" }}>{quiz.nodeName}</h2>
              <p className="text-[rgb(var(--primary-foreground))]/70 text-sm">
                {submitted ? 'Your Answers' : 'Knowledge Quiz - Answer the questions below'}
              </p>
            </div>
          </div>
        </div>

        {/* Questions */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[50vh]">
          {quiz.questions.map((q, i) => (
            <div key={q.id} className="space-y-3">
              <p className="font-medium text-[rgb(var(--foreground))]" style={{ fontFamily: "'Noto Serif', Georgia, serif" }}>
                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[rgb(var(--secondary))] text-[rgb(var(--accent))] text-sm font-bold mr-2">
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
                            ? 'border-[rgb(var(--lime-medium))] bg-[rgb(var(--lime-medium-bg))]'
                            : showWrong
                              ? 'border-[rgb(var(--lime-dark))] bg-[rgb(var(--lime-dark-bg))]'
                              : isSelected
                                ? 'border-[rgb(var(--primary))] bg-[rgb(var(--secondary))]'
                                : submitted
                                  ? 'border-[rgb(var(--border))] opacity-60'
                                  : 'border-[rgb(var(--border))] hover:border-[rgb(var(--primary))] hover:bg-[rgb(var(--secondary))]/30'
                          }
                        `}
                      >
                        <span className={`
                          flex items-center justify-center w-7 h-7 rounded-full text-sm font-bold
                          ${showCorrect
                            ? 'bg-[rgb(var(--lime-medium))] text-[rgb(var(--primary-foreground))]'
                            : showWrong
                              ? 'bg-[rgb(var(--lime-dark))] text-[rgb(var(--lime-dark-bg))]'
                              : isSelected
                                ? 'bg-[rgb(var(--primary))] text-[rgb(var(--primary-foreground))]'
                                : 'bg-[rgb(var(--secondary))] text-[rgb(var(--muted-foreground))]'
                          }
                        `}>
                          {letter}
                        </span>
                        <span className="text-sm text-[rgb(var(--foreground))] flex-1">
                          {opt}
                        </span>
                        {showCorrect && <span className="text-[rgb(var(--lime-medium))]">✓</span>}
                        {showWrong && <span className="text-[rgb(var(--lime-dark))]">✗</span>}
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
                    className="w-full p-3.5 border-2 border-[rgb(var(--border))] rounded-xl text-sm bg-[rgb(var(--background))] text-[rgb(var(--foreground))] focus:ring-2 focus:ring-[rgb(var(--primary))] focus:border-transparent disabled:opacity-60 transition-all"
                    rows={3}
                  />
                </div>
              )}

              {submitted && result?.feedback?.[q.id] && (
                <div className={`ml-2 p-3 rounded-xl text-sm ${
                  result.feedback[q.id].startsWith('✅')
                    ? 'bg-[rgb(var(--lime-medium-bg))] text-[rgb(var(--lime-medium))] border border-[rgb(var(--lime-medium))]'
                    : result.feedback[q.id].startsWith('👍')
                      ? 'bg-[rgb(var(--lime-bright-bg))] text-[rgb(var(--lime-medium))] border border-[rgb(var(--lime-bright))]'
                      : 'bg-[rgb(var(--lime-dark-bg))] text-[rgb(var(--lime-dark))] border border-[rgb(var(--lime-dark))]'
                }`}>
                  <div className="flex items-start gap-2">
                    <span className="text-base mt-0.5">
                      {result.feedback[q.id].startsWith('✅') ? '✓' : result.feedback[q.id].startsWith('👍') ? '◉' : '✗'}
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
              ? 'bg-[rgb(var(--lime-medium-bg))] text-[rgb(var(--lime-medium))] border border-[rgb(var(--lime-medium))]'
              : 'bg-[rgb(var(--lime-bright-bg))] text-[rgb(var(--muted-foreground))] border border-[rgb(var(--border))]'
          }`}>
            <div className="text-center">
              <p className="text-2xl mb-1" style={{ fontFamily: 'var(--font-brush-chinese)' }}>{result.passed ? '◉' : '○'}</p>
              <p className="font-bold text-lg">{result.message}</p>
              <p className="text-sm opacity-80 mt-1">
                Score: {result.score}/{result.total} ({Math.round((result.score / result.total) * 100)}%)
              </p>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="px-6 py-4 bg-[rgb(var(--secondary))]/50 border-t border-[rgb(var(--border))] flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-[rgb(var(--muted-foreground))] hover:text-[rgb(var(--foreground))] font-medium rounded-lg hover:bg-[rgb(var(--secondary))] transition-colors"
          >
            {submitted ? 'Close' : 'Cancel'}
          </button>
          {!submitted && (
            <button
              onClick={handleSubmit}
              disabled={!allAnswered || submitting}
              className={`px-6 py-2.5 rounded-xl font-semibold text-[rgb(var(--primary-foreground))] shadow-lg transition-all
                ${allAnswered && !submitting
                  ? 'bg-[rgb(var(--primary))] hover:bg-[rgb(var(--primary))]/90 hover:shadow-xl active:scale-[0.98]'
                  : 'bg-[rgb(var(--muted))] cursor-not-allowed'
                }`}
            >
              {submitting ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-[rgb(var(--primary-foreground))]/30 border-t-[rgb(var(--primary-foreground))] rounded-full animate-spin" />
                  Evaluating
                </span>
              ) : 'Submit'}
            </button>
          )}
          {submitted && (
            <button
              onClick={handleClose}
              className={`px-6 py-2.5 rounded-xl font-semibold text-[rgb(var(--primary-foreground))] shadow-lg transition-all hover:shadow-xl active:scale-[0.98] ${
                result?.passed
                  ? 'bg-[rgb(var(--lime-medium))]'
                  : 'bg-[rgb(var(--primary))]'
              }`}
            >
              {result?.passed ? '◉ Continue' : 'Close'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
