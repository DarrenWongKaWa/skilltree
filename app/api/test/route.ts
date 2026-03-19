import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  console.log('=== TEST ENDPOINT HIT ===')
  try {
    const { topic } = await req.json()
    console.log('Topic:', topic)
    
    const response = await fetch(process.env.MINIMAX_BASE_URL!, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.MINIMAX_API_KEY}`
      },
      body: JSON.stringify({
        model: 'MiniMax-M2.7',
        messages: [
          { role: 'system', content: '你是一个学科专家。请严格按要求输出JSON。' },
          { role: 'user', content: `回复 {"topic": "${topic}", "nodes": []}` }
        ],
        temperature: 0.7,
        max_tokens: 1000
      })
    })

    console.log('API response status:', response.status)
    const data = await response.json()
    console.log('API data keys:', Object.keys(data))
    
    const content = data.choices?.[0]?.message?.content || '{}'
    console.log('Content (first 200):', JSON.stringify(content).substring(0, 200))
    
    // Try to parse
    let tree
    try {
      tree = JSON.parse(content)
      console.log('Direct parse succeeded!')
    } catch (e) {
      console.log('Direct parse failed:', (e as Error).message)
      // Try stripping
      const stripped = content.replace(/<think>[\s\S]*?<\/think>/gi, '')
      console.log('After strip (first 200):', JSON.stringify(stripped).substring(0, 200))
      try {
        tree = JSON.parse(stripped)
        console.log('Strip parse succeeded!')
      } catch (e2) {
        console.log('Strip parse failed:', (e2 as Error).message)
        // Try brace finding
        const firstBrace = stripped.indexOf('{')
        const lastBrace = stripped.lastIndexOf('}')
        console.log('Braces found at:', firstBrace, lastBrace)
        if (firstBrace >= 0 && lastBrace > firstBrace) {
          const candidate = stripped.substring(firstBrace, lastBrace + 1)
          try {
            tree = JSON.parse(candidate)
            console.log('Brace parse succeeded!')
          } catch (e3) {
            console.log('Brace parse failed:', (e3 as Error).message)
          }
        }
      }
    }
    
    if (tree) {
      return NextResponse.json({ tree: { ...tree, id: `tree_${Date.now()}` } })
    }
    return NextResponse.json({ error: '解析失败' }, { status: 500 })
    
  } catch (error) {
    console.error('=== OUTER CATCH ===')
    console.error('Error:', error)
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}
