import { NextRequest, NextResponse } from 'next/server'

const QUIZ_PROMPT = `You are a quiz expert. Create 3 questions for the concept "{nodeName}":
- Question 1: Basic concept (multiple choice, 4 options)
- Question 2: Understanding check (multiple choice, 4 options)
- Question 3: Application analysis (short answer)

IMPORTANT: Output ALL content in ENGLISH ONLY. No Chinese, no other languages.
Also provide the answer and explanation for each question.

Output strictly in JSON format:
{
  "nodeId": "nodeId",
  "nodeName": "nodeName",
  "questions": [
    {
      "id": "q1",
      "question": "Question content",
      "options": ["A. Option 1", "B. Option 2", "C. Option 3", "D. Option 4"],
      "answer": "Correct answer",
      "explanation": "Explanation",
      "type": "choice"
    },
    {
      "id": "q2",
      "question": "Question content",
      "options": ["A. Option 1", "B. Option 2", "C. Option 3", "D. Option 4"],
      "answer": "Correct answer",
      "explanation": "Explanation",
      "type": "choice"
    },
    {
      "id": "q3",
      "question": "Question content (application scenario)",
      "answer": "Reference answer key points",
      "explanation": "Grading criteria",
      "type": "short"
    }
  ]
}

Output only JSON, no other text.`

export async function POST(req: NextRequest) {
  try {
    const { nodeName, nodeDescription, nodeId } = await req.json()

    const apiUrl = (process.env.MINIMAX_BASE_URL || 'https://api.minimaxi.com/v1') + '/chat/completions'
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.MINIMAX_API_KEY}`
      },
      body: JSON.stringify({
        model: 'MiniMax-M2.7',
        messages: [
          { role: 'system', content: 'You are a quiz expert. Output JSON only, no other text. ALL content MUST be in English only - no Chinese or any other language.' },
          { role: 'user', content: QUIZ_PROMPT.replace('{nodeName}', nodeName) }
        ],
        temperature: 0.8,
        max_tokens: 3000
      })
    })

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content || '{}'

    const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    const quiz = JSON.parse(cleaned)
    quiz.nodeId = nodeId

    return NextResponse.json({ quiz })
  } catch (error) {
    console.error('Quiz generate error:', error)
    return NextResponse.json({ error: 'Quiz generation failed' }, { status: 500 })
  }
}
