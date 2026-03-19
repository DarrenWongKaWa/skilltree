import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { quiz, answers } = await req.json()
    const { questions } = quiz
    
    let score = 0
    const feedback: Record<string, string> = {}
    
    questions.forEach((q: any, i: number) => {
      const userAnswer = answers[i]?.trim().toUpperCase()
      const correctAnswer = q.answer.trim().toUpperCase()
      
      if (q.type === 'choice') {
        if (userAnswer === correctAnswer) {
          score++
          feedback[q.id] = '✅ 正确！' + q.explanation
        } else {
          feedback[q.id] = `❌ 正确答案是 ${q.answer}。${q.explanation}`
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
          feedback[q.id] = '👍 基本正确！' + q.explanation
        } else {
          feedback[q.id] = `📝 参考答案：${q.answer}。${q.explanation}`
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
        message: passed ? '🎉 恭喜通过！' : '💪 继续加油，再试一次！'
      }
    })
  } catch (error) {
    console.error('Evaluate error:', error)
    return NextResponse.json({ error: '评判失败' }, { status: 500 })
  }
}
