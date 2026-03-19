import { NextRequest, NextResponse } from 'next/server'

const TREE_PROMPT = `You are a subject expert. User wants to learn: {topic}

Generate a clear learning path (skill tree) with:
1. 3-6 top-level main nodes, each with 2-4 child nodes
2. Prerequisites for each node (only depends on more fundamental concepts)
3. Difficulty level for each node (Beginner/Intermediate/Advanced)
4. Core resources for each node (max 2 books + 1 website), must include real accessible URLs
5. Overall description (within 50 characters)

Output strictly JSON format:
{
  "topic": "Topic name",
  "description": "Overall description",
  "nodes": [
    {
      "id": "uniqueID",
      "name": "Node name",
      "description": "Node description (within 30 characters)",
      "level": "Beginner|Intermediate|Advanced",
      "prerequisites": ["prerequisiteNodeID"],
      "children": ["childNodeID"],
      "resources": [{"title": "Book title", "url": "URL", "type": "book", "level": "Beginner|Intermediate|Advanced"}]
    }
  ],
  "books": [{"title": "Book title", "author": "Author", "url": "URL", "type": "book", "level": "Beginner|Intermediate|Advanced"}],
  "websites": [{"title": "Website name", "url": "URL", "type": "website"}]
}

Output JSON only, no other text.`

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
          { role: 'system', content: 'You are a subject expert. Output JSON only, no other text.' },
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
  const nodeMap: Record<string, any> = {}
  nodes.forEach(n => nodeMap[n.id] = n)

  // Use children array to build tree structure
  const childMap: Record<string, string[]> = {}
  nodes.forEach(n => childMap[n.id] = n.children || [])

  // Find roots (nodes with no prerequisites)
  const roots = nodes.filter(n => !n.prerequisites?.length || n.prerequisites.length === 0)

  const LEVEL_HEIGHT = 150
  const NODE_WIDTH = 220
  const NODE_GAP = 40

  // Compute subtree widths (bottom-up)
  const widthCache: Record<string, number> = {}

  function getSubtreeWidth(nodeId: string): number {
    if (widthCache[nodeId] !== undefined) return widthCache[nodeId]
    const children = childMap[nodeId] || []
    if (children.length === 0) {
      widthCache[nodeId] = NODE_WIDTH
      return NODE_WIDTH
    }
    const childrenWidth = children.reduce((sum, cid) => sum + getSubtreeWidth(cid), 0)
    const gapsWidth = (children.length - 1) * NODE_GAP
    widthCache[nodeId] = Math.max(NODE_WIDTH, childrenWidth + gapsWidth)
    return widthCache[nodeId]
  }

  // Layout tree (top-down)
  let globalX = 0

  function layoutTree(nodeId: string, level: number, startX: number, width: number) {
    const node = nodeMap[nodeId]
    node.x = startX + width / 2 - NODE_WIDTH / 2
    node.y = level * LEVEL_HEIGHT

    const children = childMap[nodeId] || []
    if (children.length === 0) return

    const childWidths = children.map(cid => getSubtreeWidth(cid))
    const totalChildWidth = childWidths.reduce((a, b) => a + b, 0)
    const totalGaps = (children.length - 1) * NODE_GAP
    let childX = startX + (width - totalChildWidth - totalGaps) / 2

    children.forEach((childId, i) => {
      layoutTree(childId, level + 1, childX, childWidths[i])
      childX += childWidths[i] + NODE_GAP
    })
  }

  // Layout each root tree side by side
  roots.forEach((root) => {
    const treeWidth = getSubtreeWidth(root.id)
    layoutTree(root.id, 0, globalX, treeWidth)
    globalX += treeWidth + NODE_GAP * 3
  })

  // Handle disconnected nodes
  nodes.forEach(node => {
    if (node.x === undefined) {
      node.x = globalX
      node.y = 0
      globalX += NODE_WIDTH + NODE_GAP
    }
  })
}