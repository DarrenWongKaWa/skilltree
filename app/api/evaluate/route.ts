import { NextRequest, NextResponse } from 'next/server'
import { validateEvaluateRequest } from '@/lib/validation'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const validation = validateEvaluateRequest(body)
    if (!validation.valid) {
      return NextResponse.json({ error: validation.errors.join(', ') }, { status: 400 })
    }

    const { quiz, answers } = body
    const { questions } = quiz

    let score = 0
    const feedback: Record<string, string> = {}

    questions.forEach((q: any, i: number) => {
      const userAnswer = answers[i]?.trim().toUpperCase()
      const correctAnswer = q.answer.trim().toUpperCase()

      if (q.type === 'choice') {
        if (userAnswer === correctAnswer) {
          score++
          feedback[q.id] = 'Correct! ' + q.explanation
        } else {
          feedback[q.id] = `The correct answer is ${q.answer}. ${q.explanation}`
        }
      } else {
        // For short answer, give partial credit based on keywords
        const keywords = q.answer.toLowerCase().split(/[、，,]/)
        const matchCount = keywords.filter((k: string) =>
          userAnswer.includes(k.toLowerCase())
        ).length
        const partialScore = matchCount / keywords.length
        if (partialScore >= 0.6) {
          score += 0.5
          feedback[q.id] = 'Mostly correct! ' + q.explanation
        } else {
          feedback[q.id] = `Reference answer: ${q.answer}. ${q.explanation}`
        }
      }
    })

    const passed = score / questions.length >= 0.6

    return NextResponse.json({
      result: {
        passed,
        score,
        total: questions.length,
        feedback,
        message: passed ? 'Congratulations, you passed!' : 'Keep trying, you can do it!'
      }
    })
  } catch (error) {
    console.error('Evaluate error:', error)
    return NextResponse.json({ error: 'Evaluation failed' }, { status: 500 })
  }
}
