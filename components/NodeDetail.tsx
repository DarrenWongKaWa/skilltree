'use client'

import { useState } from 'react'
import type { SkillNodeData } from '@/types'

interface NodeDetailProps {
  node: SkillNodeData | null
  onLearn: (node: SkillNodeData) => void
  onQuiz: (node: SkillNodeData) => void
  onDirectLight: (nodeId: string) => void
}

export default function NodeDetail({ node, onLearn, onQuiz, onDirectLight }: NodeDetailProps) {
  const [copied, setCopied] = useState(false)

  if (!node) {
    return (
      <div className="w-80 bg-gray-50 border-l border-gray-200 flex items-center justify-center">
        <p className="text-gray-400 text-sm">👈 点击节点查看详情</p>
      </div>
    )
  }

  const handleCopyDescription = () => {
    navigator.clipboard.writeText(node.description)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className="w-80 bg-white border-l border-gray-200 overflow-y-auto">
      {/* Header */}
      <div className="p-5 border-b border-gray-100">
        <div className="flex items-start justify-between">
          <div>
            <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium mb-2
              ${node.level === '入门' ? 'bg-green-100 text-green-700' :
                node.level === '进阶' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-red-100 text-red-700'}`}>
              {node.level}
            </span>
            <h2 className="text-lg font-bold text-gray-900">{node.name}</h2>
          </div>
          {node.status === 'learned' && (
            <span className="text-2xl">✅</span>
          )}
        </div>
        <p className="text-gray-600 text-sm mt-2">{node.description}</p>
      </div>

      {/* Resources */}
      {node.resources && node.resources.length > 0 && (
        <div className="p-5 border-b border-gray-100">
          <h3 className="font-semibold text-gray-800 mb-3">📚 相关资源</h3>
          <div className="space-y-2">
            {node.resources.map((r, i) => (
              <a
                key={i}
                href={r.url || '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <span className="text-sm">{r.type === 'book' ? '📖' : '🌐'}</span>
                <span className="text-sm text-blue-600 hover:underline flex-1">{r.title}</span>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Prerequisite Info */}
      {node.prerequisites && node.prerequisites.length > 0 && (
        <div className="p-5 border-b border-gray-100">
          <h3 className="font-semibold text-gray-800 mb-2">🔗 前置技能</h3>
          <p className="text-sm text-gray-500">
            需要先点亮 {node.prerequisites.length} 个前置技能
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="p-5 space-y-3">
        {node.status === 'locked' ? (
          <div className="text-center py-4 text-gray-400">
            <p className="text-sm">🔒 请先完成前置技能</p>
          </div>
        ) : node.status === 'available' ? (
          <>
            <button
              onClick={() => onDirectLight(node.id)}
              className="w-full py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-medium transition-colors"
            >
              ✨ 直接点亮
            </button>
            <button
              onClick={() => onQuiz(node)}
              className="w-full py-3 bg-white border-2 border-purple-500 text-purple-600 rounded-xl font-medium hover:bg-purple-50 transition-colors"
            >
              📝 答题验证
            </button>
          </>
        ) : (
          <div className="text-center py-4">
            <span className="text-3xl mb-2 block">🎉</span>
            <p className="text-green-600 font-medium">已点亮！</p>
            <button
              onClick={() => onQuiz(node)}
              className="mt-3 text-sm text-purple-600 hover:underline"
            >
              再测一次 →
            </button>
          </div>
        )}
      </div>

      {/* Copy button */}
      <div className="p-5 pt-0">
        <button
          onClick={handleCopyDescription}
          className="w-full py-2 text-xs text-gray-400 hover:text-gray-600 border border-gray-200 rounded-lg"
        >
          {copied ? '✓ 已复制' : '📋 复制描述'}
        </button>
      </div>
    </div>
  )
}
