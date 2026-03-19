'use client'

import { memo } from 'react'
import { Handle, Position } from '@xyflow/react'
import type { NodeProps } from '@xyflow/react'
import type { SkillNodeData } from '@/types'

const levelColors = {
  'Beginner': {
    bg: 'bg-emerald-50 dark:bg-emerald-950/40',
    border: 'border-emerald-400 dark:border-emerald-600',
    text: 'text-emerald-700 dark:text-emerald-400',
    dot: 'bg-emerald-500',
    glow: 'hover:shadow-emerald-200 dark:hover:shadow-emerald-900/50',
  },
  'Intermediate': {
    bg: 'bg-amber-50 dark:bg-amber-950/40',
    border: 'border-amber-400 dark:border-amber-600',
    text: 'text-amber-700 dark:text-amber-400',
    dot: 'bg-amber-500',
    glow: 'hover:shadow-amber-200 dark:hover:shadow-amber-900/50',
  },
  'Advanced': {
    bg: 'bg-rose-50 dark:bg-rose-950/40',
    border: 'border-rose-400 dark:border-rose-600',
    text: 'text-rose-700 dark:text-rose-400',
    dot: 'bg-rose-500',
    glow: 'hover:shadow-rose-200 dark:hover:shadow-rose-900/50',
  },
} as const

const statusStyles = {
  locked: {
    opacity: 'opacity-40',
    filter: 'grayscale(80%)',
    cursor: 'not-allowed',
    ring: '',
  },
  available: {
    opacity: 'opacity-100',
    filter: 'none',
    cursor: 'pointer',
    ring: 'hover:ring-2 hover:ring-blue-400 dark:hover:ring-blue-500 hover:ring-offset-2',
  },
  learned: {
    opacity: 'opacity-100',
    filter: 'none',
    cursor: 'pointer',
    ring: 'ring-2 ring-blue-500 dark:ring-blue-400 ring-offset-2 animate-pulse-glow',
  },
} as const

function SkillNodeComponent(props: NodeProps) {
  const data = props.data as unknown as SkillNodeData
  const colors = levelColors[data.level as keyof typeof levelColors] || levelColors['Beginner']
  const status = statusStyles[data.status] || statusStyles.available
  const isLearned = data.status === 'learned'
  const isLocked = data.status === 'locked'

  return (
    <div
      className={`
        relative px-4 py-3 rounded-xl border-2 min-w-[150px] max-w-[170px]
        ${colors.bg} ${colors.border}
        ${status.opacity} ${status.filter}
        transition-all duration-200 ease-out
        hover:scale-105 ${colors.glow}
        ${status.ring}
      `}
    >
      {/* Top Handle */}
      <Handle
        type="target"
        position={Position.Top}
        className="!w-3.5 !h-3.5 !bg-stone-300 dark:!bg-stone-600 !border-2 !border-white dark:!border-stone-800 !-top-1.5"
      />

      {/* Level indicator */}
      <div className="flex items-center gap-1.5 mb-1.5">
        <span className={`w-2 h-2 rounded-full ${colors.dot} shadow-sm`} />
        <span className={`text-xs font-medium ${colors.text}`}>{data.level}</span>
        {isLearned && (
          <span className="ml-auto text-blue-500 text-sm">✓</span>
        )}
        {isLocked && (
          <span className="ml-auto text-stone-400 text-sm">🔒</span>
        )}
      </div>

      {/* Node name */}
      <div className={`font-semibold text-sm leading-tight ${isLocked ? 'text-stone-400 dark:text-stone-500' : 'text-stone-800 dark:text-stone-100'}`}>
        {data.name}
      </div>

      {/* Description */}
      <div className="text-xs text-stone-500 dark:text-stone-400 mt-1.5 line-clamp-2 leading-relaxed">
        {data.description}
      </div>

      {/* Bottom Handle */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-3.5 !h-3.5 !bg-stone-300 dark:!bg-stone-600 !border-2 !border-white dark:!border-stone-800 !-bottom-1.5"
      />
    </div>
  )
}

export default memo(SkillNodeComponent)
