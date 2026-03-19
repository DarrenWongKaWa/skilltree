'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useStore } from '@/store'
import { generateSkillTree } from '@/lib/api'
import type { SkillTree } from '@/types'

export default function HomePage() {
  const router = useRouter()
  const { trees, addTree, setCurrentTree } = useStore()
  const [topic, setTopic] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const treeList = Object.values(trees)

  const handleCreate = async () => {
    if (!topic.trim()) return
    setLoading(true)
    setError('')
    try {
      const tree = await generateSkillTree(topic.trim()) as SkillTree
      addTree(tree)
      setCurrentTree(tree)
      router.push(`/tree/${tree.id}`)
    } catch (e) {
      setError('生成失败，请重试')
      console.error(e)
    }
    setLoading(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !loading) handleCreate()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-6 py-8">
          <h1 className="text-3xl font-bold text-gray-900">🧠 SkillTree</h1>
          <p className="text-gray-500 mt-2">技能树学习引擎 — 输入任何你想学习的主题</p>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Create new */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
          <h2 className="font-semibold text-gray-800 mb-4">🚀 创建新技能树</h2>
          <div className="flex gap-3">
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="例如：广义相对论、量子力学、机器学习..."
              disabled={loading}
              className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 text-gray-800"
            />
            <button
              onClick={handleCreate}
              disabled={!topic.trim() || loading}
              className={`px-6 py-3 rounded-xl font-medium text-white transition-all
                ${!topic.trim() || loading
                  ? 'bg-gray-300 cursor-not-allowed'
                  : 'bg-blue-500 hover:bg-blue-600'
                }`}
            >
              {loading ? '🔥 生成中...' : '生成'}
            </button>
          </div>
          {error && <p className="text-red-500 text-sm mt-3">{error}</p>}
          {loading && (
            <div className="mt-4">
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full animate-pulse" style={{ width: '60%' }} />
              </div>
              <p className="text-gray-400 text-sm mt-2">正在调用 LLM 生成技能树，请稍候...</p>
            </div>
          )}
        </div>

        {/* Existing trees */}
        {treeList.length > 0 && (
          <div>
            <h2 className="font-semibold text-gray-800 mb-4">📚 已有的技能树</h2>
            <div className="grid gap-4">
              {treeList.map((tree) => {
                const learned = tree.nodes.filter((n) => n.status === 'learned').length
                const total = tree.nodes.length
                const percent = Math.round((learned / total) * 100)
                return (
                  <button
                    key={tree.id}
                    onClick={() => {
                      setCurrentTree(tree)
                      router.push(`/tree/${tree.id}`)
                    }}
                    className="bg-white rounded-xl border border-gray-100 p-5 text-left hover:shadow-md hover:border-blue-200 transition-all group"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                          {tree.topic}
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">{tree.description}</p>
                        <p className="text-xs text-gray-400 mt-2">{total} 个技能节点</p>
                      </div>
                      <div className="text-right">
                        <div className={`text-lg font-bold ${percent === 100 ? 'text-green-500' : 'text-blue-500'}`}>
                          {percent}%
                        </div>
                        <div className="text-xs text-gray-400">
                          {learned}/{total} 已点亮
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${percent === 100 ? 'bg-green-500' : 'bg-blue-500'}`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {treeList.length === 0 && !loading && (
          <div className="text-center py-16 text-gray-400">
            <p className="text-4xl mb-4">🌳</p>
            <p>还没有技能树，创建一个开始学习吧！</p>
          </div>
        )}
      </div>
    </div>
  )
}
