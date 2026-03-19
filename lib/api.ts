import type { SkillTree, Quiz, QuizResult } from '@/types'

export async function generateSkillTree(topic: string): Promise<SkillTree> {
  const response = await fetch('/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ topic }),
  })
  const data = await response.json()
  if (data.error) {
    throw new Error(data.error)
  }
  return data.tree
}

export async function generateQuiz(nodeName: string, nodeDescription: string): Promise<Quiz> {
  const response = await fetch('/api/quiz', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nodeName, nodeDescription }),
  })
  const data = await response.json()
  if (data.error) {
    throw new Error(data.error)
  }
  return data.quiz
}

export async function evaluateQuiz(quiz: Quiz, answers: string[]): Promise<QuizResult> {
  const response = await fetch('/api/evaluate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ quiz, answers }),
  })
  const data = await response.json()
  if (data.error) {
    throw new Error(data.error)
  }
  return data.result
}
