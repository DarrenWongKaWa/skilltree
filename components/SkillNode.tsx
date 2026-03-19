'use client'

import { memo } from 'react'
import { Handle, Position } from '@xyflow/react'
import type { NodeProps } from '@xyflow/react'
import type { SkillNodeData } from '@/types'

const levelColors = {
  '入门': { bg: 'bg-green-100', border: 'border-green-400', text: 'text-green-700', dot: 'bg-green-500' },
  '进阶': { bg: 'bg-yellow-100', border: 'border-yellow-400', text: 'text-yellow-700', dot: 'bg-yellow-500' },
  '高级': { bg: 'bg-red-100', border: 'border-red-400', text: 'text-red-700', dot: 'bg-red-500' },
} as const

const statusStyles = {
  locked: { opacity: 'opacity-40', filter: 'grayscale(80%)', cursor: 'not-allowed' },
  available: { opacity: 'opacity-100', filter: 'none', cursor: 'pointer' },
  learned: { opacity: 'opacity-100', filter: 'none', cursor: 'pointer' },
} as const

function SkillNodeComponent(props: NodeProps) {
  const data = props.data as unknown as SkillNodeData
  const colors = levelColors[data.level] || levelColors['入门']
  const status = statusStyles[data.status] || statusStyles.available
  const isLearned = data.status === 'learned'
  const isLocked = data.status === 'locked'

  return (
    <div
      className={`
        relative px-4 py-3 rounded-xl border-2 min-w-[140px] max-w-[160px]
        ${colors.bg} ${colors.border}
        ${status.opacity} ${status.filter}
        transition-all duration-200 hover:scale-105
        ${isLearned ? 'ring-2 ring-blue-500 ring-offset-2' : ''}
      `}
    >
      {/* Top Handle */}
      <Handle
        type="target"
        position={Position.Top}
        className="!w-3 !h-3 !bg-gray-400 !border-2 !border-white"
      />

      {/* Level indicator */}
      <div className="flex items-center gap-1.5 mb-1">
        <span className={`w-2 h-2 rounded-full ${colors.dot}`} />
        <span className={`text-xs font-medium ${colors.text}`}>{data.level}</span>
        {isLearned && <span className="ml-auto text-blue-500">✓</span>}
        {isLocked && <span className="ml-auto text-gray-400">🔒</span>}
      </div>

      {/* Node name */}
      <div className={`font-semibold text-sm ${isLocked ? 'text-gray-500' : 'text-gray-800'}`}>
        {data.name}
      </div>

      {/* Description */}
      <div className="text-xs text-gray-500 mt-1 line-clamp-2">
        {data.description}
      </div>

      {/* Bottom Handle */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-3 !h-3 !bg-gray-400 !border-2 !border-white"
      />
    </div>
  )
}

export default memo(SkillNodeComponent)
