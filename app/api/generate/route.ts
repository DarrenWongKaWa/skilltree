import { NextRequest, NextResponse } from 'next/server'

const TREE_PROMPT = `你是学科专家。用户想学习：{topic}

请生成一个清晰的学习路径（技能树），包含：
1. 3-6个顶级主干节点，每个有2-4个子节点
2. 每个节点的前置依赖（只依赖更基础的概念）
3. 每个节点的难度评级（入门/进阶/高级）
4. 每个节点的核心资源（最多2本书 + 1个网站）
5. 整体描述（50字以内）

输出严格 JSON 格式：
{
  "topic": "主题名",
  "description": "整体描述",
  "nodes": [
    {
      "id": "唯一ID",
      "name": "节点名",
      "description": "节点描述（30字以内）",
      "level": "入门|进阶|高级",
      "prerequisites": ["前置节点ID"],
      "children": ["子节点ID"],
      "resources": [{"title": "书名", "type": "book", "level": "入门|进阶|高级"}]
    }
  ],
  "books": [{"title": "书名", "author": "作者", "url": "网址", "type": "book", "level": "入门|进阶|高级"}],
  "websites": [{"title": "网站名", "url": "网址", "type": "website"}]
}

请直接输出 JSON，不要有其他文字。`

export async function POST(req: NextRequest) {
  try {
    const { topic } = await req.json()

    console.log('[1] Calling MiniMax API...')
    const apiUrl = (process.env.MINIMAX_BASE_URL || 'https://api.minimaxi.com/v1') + '/chat/completions'
    console.log('[0] API URL:', apiUrl)
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.MINIMAX_API_KEY}`
      },
      body: JSON.stringify({
        model: 'MiniMax-M2.7',
        messages: [
          { role: 'system', content: '你是一个学科专家。请严格按要求输出JSON。' },
          { role: 'user', content: TREE_PROMPT.replace('{topic}', topic) }
        ],
        temperature: 0.7,
        max_tokens: 2000
      })
    })
    console.log('[2] API response status:', response.status)
    if (!response.ok) {
      const errText = await response.text()
      console.log('[2b] Error response:', errText.substring(0, 500))
      return NextResponse.json({ error: 'MiniMax API错误: ' + response.status }, { status: 500 })
    }

    const data = await response.json()
    console.log('[3] Parsed response, keys:', Object.keys(data))
    
    const content = data.choices?.[0]?.message?.content || '{}'
    // Strip think/reasoning tags that wrap the actual response
    let text = content
      .replace(/<think>[\s\S]*?<\/think>/gi, '')  // Strip think tags
      .replace(/<result>[\s\S]*?<\/result>/gi, '')  // Strip result tags  
      .replace(/```json\n?/g, '')  // Strip markdown code blocks
      .replace(/```\n?/g, '')
      .trim()
    
    console.log('[4] Content length:', content.length, 'first 100:', JSON.stringify(content.substring(0, 100)))
    console.log('[5] After stripping, first 100:', JSON.stringify(text.substring(0, 100)))
    
    // 2. Try direct parse first
    let tree
    try {
      tree = JSON.parse(text)
    } catch (e) {
      // 3. Find JSON boundaries by tracking brace depth
      let depth = 0
      let inString = false
      let escape = false
      let jsonStart = -1
      let jsonEnd = -1
      
      for (let i = 0; i < text.length; i++) {
        const c = text[i]
        if (escape) { escape = false; continue }
        if (c === '\\') { escape = true; continue }
        if (c === '"') { inString = !inString; continue }
        if (inString) continue
        
        if (c === '{') {
          if (depth === 0) jsonStart = i
          depth++
        } else if (c === '}') {
          depth--
          if (depth === 0) { jsonEnd = i; break }
        }
      }
      
      console.log('[5b] After loop - jsonStart:', jsonStart, 'jsonEnd:', jsonEnd, 'text length:', text.length)
      if (jsonEnd >= 0 && jsonEnd < text.length - 1) {
        console.log('[5c] Characters after jsonEnd:', JSON.stringify(text.substring(jsonEnd, jsonEnd + 50)))
      }
      
      if (jsonStart >= 0 && jsonEnd >= 0) {
        const candidate = text.substring(jsonStart, jsonEnd + 1)
        try {
          tree = JSON.parse(candidate)
        } catch (e2) {
          console.error('Failed to parse extracted JSON:', (e2 as Error).message)
          return NextResponse.json({ error: '生成失败：JSON解析错误' }, { status: 500 })
        }
      } else {
        console.error('Could not find valid JSON boundaries')
        console.error('Text (first 200):', text.substring(0, 200))
        return NextResponse.json({ error: '生成失败：无法找到JSON' }, { status: 500 })
      }
    }

    // Assign positions for ReactFlow
    assignNodePositions(tree.nodes)

    // Set initial status
    tree.nodes = tree.nodes.map((n: any) => ({
      ...n,
      status: n.prerequisites?.length === 0 ? 'available' : 'locked',
      prerequisites: n.prerequisites || [],
      children: n.children || [],
      resources: n.resources || []
    }))

    tree.id = `tree_${Date.now()}`
    tree.createdAt = Date.now()

    return NextResponse.json({ tree })
  } catch (error) {
    console.error('Generate error:', error)
    return NextResponse.json({ error: '生成失败' }, { status: 500 })
  }
}

function assignNodePositions(nodes: any[]) {
  const levels: Record<string, number> = {}
  const nodesByLevel: Record<number, any[]> = {}

  // Calculate levels (BFS from roots)
  const roots = nodes.filter(n => !n.prerequisites?.length)
  const queue = [...roots]

  while (queue.length) {
    const node = queue.shift()!
    const level = (node.prerequisites?.length || 0)
    levels[node.id] = level
    if (!nodesByLevel[level]) nodesByLevel[level] = []
    nodesByLevel[level].push(node)

    node.children?.forEach((childId: string) => {
      const child = nodes.find(n => n.id === childId)
      if (child && !queue.includes(child)) queue.push(child)
    })
  }

  // Assign x, y positions
  Object.entries(nodesByLevel).forEach(([level, nodesAtLevel]) => {
    const y = parseInt(level) * 180
    nodesAtLevel.forEach((node, i) => {
      const totalInLevel = nodesAtLevel.length
      const totalWidth = totalInLevel * 220
      const startX = -totalWidth / 2
      node.x = startX + i * 220 + 110
      node.y = y
    })
  })
}

