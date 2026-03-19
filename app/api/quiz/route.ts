import { NextRequest, NextResponse } from 'next/server'

const QUIZ_PROMPT = `你是出题专家。请为「{nodeName}」这个概念出3道题：
- 第1题：基础概念（选择题，4个选项）
- 第2题：理解判断（选择题，4个选项）
- 第3题：应用分析（简答题）

同时给出每题的答案和解析。

输出严格 JSON 格式：
{
  "nodeId": "节点ID",
  "nodeName": "节点名称",
  "questions": [
    {
      "id": "q1",
      "question": "题目内容",
      "options": ["A. 选项1", "B. 选项2", "C. 选项3", "D. 选项4"],
      "answer": "正确答案",
      "explanation": "解析",
      "type": "choice"
    },
    {
      "id": "q2",
      "question": "题目内容",
      "options": ["A. 选项1", "B. 选项2", "C. 选项3", "D. 选项4"],
      "answer": "正确答案",
      "explanation": "解析",
      "type": "choice"
    },
    {
      "id": "q3",
      "question": "题目内容（应用场景）",
      "answer": "参考答案要点",
      "explanation": "评分标准",
      "type": "short"
    }
  ]
}

请直接输出 JSON，不要有其他文字。`

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
          { role: 'system', content: '你是一个出题专家。请严格按要求输出JSON。' },
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
    return NextResponse.json({ error: '出题失败' }, { status: 500 })
  }
}
