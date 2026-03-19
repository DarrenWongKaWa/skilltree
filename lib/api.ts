const TREE_PROMPT = `你是学科专家。用户想学习：{topic}

请生成一个清晰的学习路径（技能树），包含：
1. 3-6个顶级主干节点，每个有2-4个子节点
2. 每个节点的前置依赖（只依赖更基础的概念）
3. 每个节点的难度评级（入门/进阶/高级）
4. 每个节点的核心资源（最多2本书 + 1个网站）
5. 整体描述（50字以内）

同时给出该主题的整体书籍推荐（3本）和网站推荐（2个）。

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

export async function generateSkillTree(topic: string): Promise<any> {
  const response = await fetch('/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ topic }),
  })
  const data = await response.json()
  return data.tree
}

export async function generateQuiz(nodeName: string, nodeDescription: string): Promise<any> {
  const response = await fetch('/api/quiz', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nodeName, nodeDescription }),
  })
  const data = await response.json()
  return data.quiz
}

export async function evaluateQuiz(quiz: any, answers: string[]): Promise<any> {
  const response = await fetch('/api/evaluate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ quiz, answers }),
  })
  const data = await response.json()
  return data.result
}
