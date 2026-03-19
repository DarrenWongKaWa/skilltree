export type NodeLevel = 'Beginner' | 'Intermediate' | 'Advanced'
export type NodeStatus = 'locked' | 'available' | 'learned'
export type ResourceType = 'book' | 'website' | 'video' | 'course'

export interface Resource {
  title: string
  url?: string
  type: ResourceType
  level: NodeLevel
  author?: string
}

export interface SkillNodeData {
  id: string
  name: string
  description: string
  status: NodeStatus
  level: NodeLevel
  prerequisites: string[]
  children: string[]
  resources: Resource[]
  x?: number
  y?: number
}

export interface SkillTree {
  id: string
  topic: string
  description: string
  nodes: SkillNodeData[]
  books: Resource[]
  websites: Resource[]
  createdAt: number
}

export interface QuizQuestion {
  id: string
  question: string
  options?: string[]
  answer: string
  explanation: string
  type: 'choice' | 'short'
}

export interface Quiz {
  nodeId: string
  nodeName: string
  questions: QuizQuestion[]
}

export interface QuizResult {
  passed: boolean
  score: number
  total: number
  feedback: Record<string, string>
  message: string
}

export interface Progress {
  treeId: string
  learnedNodes: string[]
  updatedAt: number
}
