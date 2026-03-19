import { NextRequest, NextResponse } from 'next/server'

const TREE_PROMPT = `你是学科专家。用户想学习：{topic}

请生成一个清晰的学习路径（技能树），包含：
1. 3-6个顶级主干节点，每个有2-4个子节点
2. 每个节点的前置依赖（只依赖更基础的概念）
3. 每个节点的难度评级（入门/进阶/高级）
4. 每个节点的核心资源（最多2本书 + 1个网站），必须包含真实的可访问网址
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
      "resources": [{"title": "书名", "url": "网址", "type": "book", "level": "入门|进阶|高级"}]
    }
  ],
  "books": [{"title": "书名", "author": "作者", "url": "网址", "type": "book", "level": "入门|进阶|高级"}],
  "websites": [{"title": "网站名", "url": "网址", "type": "website"}]
}

请直接输出 JSON，不要有其他文字。`

export async function POST(req: NextRequest) {
  try {
    const { topic } = await req.json()

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
          { role: 'system', content: '你是一个学科专家。请严格按要求输出JSON。' },
          { role: 'user', content: TREE_PROMPT.replace('{topic}', topic) }
        ],
        temperature: 0.7,
        max_tokens: 4000
      })
    })

    if (!response.ok) {
      return NextResponse.json({ error: 'MiniMax API错误: ' + response.status }, { status: 500 })
    }

    const data = await response.json()
    const rawContent = data.choices?.[0]?.message?.content

    if (!rawContent) {
      return NextResponse.json({ error: 'API返回内容为空' }, { status: 500 })
    }

    const content = String(rawContent)

    // Try multiple JSON extraction strategies
    let potentialJson: string | null = null
    let tree: any = null

    // Strategy 1: Match content between ```json and ```
    const jsonMatch = content.match(/```json\s*([\s\S]*?)```/i)
    if (jsonMatch && jsonMatch[1]) {
      potentialJson = jsonMatch[1].trim()
    }

    // Strategy 2: Find JSON after ```json marker using brace counting
    if (!potentialJson) {
      const jsonFenceIdx = content.indexOf('```json')
      if (jsonFenceIdx !== -1) {
        const afterFence = content.substring(jsonFenceIdx + 6)
        let depth = 0
        let inString = false
        let escape = false
        let start = -1

        for (let i = 0; i < afterFence.length; i++) {
          const c = afterFence[i]
          if (escape) { escape = false; continue }
          if (c === '\\') { escape = true; continue }
          if (c === '"') { inString = !inString; continue }
          if (inString) continue
          if (c === '{') { if (start === -1) start = i; depth++ }
          else if (c === '}') { depth--; if (depth === 0 && start !== -1) {
            potentialJson = afterFence.substring(start, i + 1)
            break
          }}
        }
      }
    }

    // Strategy 3: Search for JSON by finding "topic" field
    if (!potentialJson) {
      const topicIdx = content.indexOf('"topic"')
      if (topicIdx !== -1) {
        for (let i = topicIdx; i >= 0; i--) {
          if (content[i] === '{') {
            const jsonCandidate = content.substring(i)
            try {
              const parsed = JSON.parse(jsonCandidate)
              if (parsed.topic && parsed.nodes) {
                potentialJson = jsonCandidate
                break
              }
            } catch (e) {}
            break
          }
        }
      }
    }

    // Strategy 4: Brute force - find largest valid JSON with nodes array
    if (!potentialJson) {
      let candidates: { start: number, end: number, size: number }[] = []
      let depth = 0
      let inString = false
      let escape = false
      let start = -1

      for (let i = 0; i < content.length; i++) {
        const c = content[i]
        if (escape) { escape = false; continue }
        if (c === '\\') { escape = true; continue }
        if (c === '"') { inString = !inString; continue }
        if (inString) continue
        if (c === '{') { if (start === -1) start = i; depth++ }
        else if (c === '}') { depth--; if (depth === 0 && start !== -1) {
          candidates.push({ start, end: i, size: i - start + 1 })
          start = -1
        }}
      }

      // Find the largest valid JSON with nodes
      for (const candidate of candidates.sort((a, b) => b.size - a.size)) {
        if (candidate.size < 500) continue
        const jsonStr = content.substring(candidate.start, candidate.end + 1)
        try {
          const parsed = JSON.parse(jsonStr)
          if (parsed.nodes && Array.isArray(parsed.nodes) && parsed.nodes.length > 0) {
            potentialJson = jsonStr
            break
          }
        } catch (e) {}
      }
    }

    if (!potentialJson) {
      return NextResponse.json({ error: '无法找到有效JSON' }, { status: 500 })
    }

    // Try to parse the JSON
    try {
      tree = JSON.parse(potentialJson)
    } catch (e) {
      // Try to fix common issues
      try {
        const fixed = potentialJson
          .replace(/：/g, ':')
          .replace(/"/g, '"')
          .replace(/'/g, "'")
          .trim()
        tree = JSON.parse(fixed)
      } catch (e2) {
        return NextResponse.json({ error: 'JSON解析错误' }, { status: 500 })
      }
    }

    // Validate structure
    if (!tree.nodes || !Array.isArray(tree.nodes) || tree.nodes.length === 0) {
      return NextResponse.json({ error: '生成的JSON结构不符合要求' }, { status: 500 })
    }

    // Assign positions for ReactFlow
    assignOrganicPositions(tree.nodes)

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

function assignOrganicPositions(nodes: any[]) {
  const roots = nodes.filter(n => !n.prerequisites?.length || n.prerequisites.length === 0)

  const childrenMap: Record<string, string[]> = {}
  nodes.forEach(n => {
    childrenMap[n.id] = n.children || []
  })

  const visited = new Set<string>()

  function layoutNode(node: any, x: number, y: number, depth: number) {
    if (visited.has(node.id)) return
    visited.add(node.id)

    const offsetX = (Math.random() - 0.5) * 60
    const offsetY = Math.random() * 40

    node.x = x + offsetX
    node.y = y + offsetY

    const children = childrenMap[node.id] || []
    if (children.length === 0) return

    const spreadFactor = Math.min(depth * 30 + 80, 200)
    const startX = x - spreadFactor / 2
    const gap = spreadFactor / children.length

    children.forEach((childId: string, i: number) => {
      const child = nodes.find(n => n.id === childId)
      if (!child || visited.has(childId)) return

      const branchOffset = startX + i * gap + gap / 2
      const newY = y + 140 + Math.random() * 80

      layoutNode(child, branchOffset, newY, depth + 1)
    })
  }

  const rootSpread = roots.length * 150
  const startX = -rootSpread / 2

  roots.forEach((root, i) => {
    const x = startX + i * 150 + 75
    layoutNode(root, x, 50, 0)
  })

  nodes.forEach(node => {
    if (!visited.has(node.id)) {
      node.x = (Math.random() - 0.5) * 400
      node.y = (Math.random() - 0.5) * 200 + 300
    }
  })
}