'use client'

import { memo } from 'react'
import { Handle, Position } from '@xyflow/react'
import type { NodeProps } from '@xyflow/react'
import type { SkillNodeData } from '@/types'

// Jade tablet color scheme - 古朴 jade tones
const levelColors = {
  '入门': {
    bg: 'bg-[rgb(var(--jade-pale-bg))] dark:bg-[rgb(var(--jade-pale-bg))]',
    border: 'border-[rgb(var(--jade-pale))] dark:border-[rgb(var(--jade-pale))]',
    text: 'text-[rgb(var(--jade-aged))] dark:text-[rgb(var(--jade-pale))]',
    dot: 'bg-[rgb(var(--jade-pale))]',
    glow: 'hover:shadow-[0_0_12px_rgba(180,200,180,0.4)] dark:hover:shadow-[0_0_12px_rgba(130,150,130,0.3)]',
  },
  '进阶': {
    bg: 'bg-[rgb(var(--jade-aged-bg))] dark:bg-[rgb(var(--jade-aged-bg))]',
    border: 'border-[rgb(var(--jade-aged))] dark:border-[rgb(var(--jade-aged))]',
    text: 'text-[rgb(var(--jade-aged))] dark:text-[rgb(var(--jade-aged))]',
    dot: 'bg-[rgb(var(--jade-aged))]',
    glow: 'hover:shadow-[0_0_12px_rgba(100,130,110,0.4)] dark:hover:shadow-[0_0_12px_rgba(100,130,110,0.3)]',
  },
  '高级': {
    bg: 'bg-[rgb(var(--jade-red-bg))] dark:bg-[rgb(var(--jade-red-bg))]',
    border: 'border-[rgb(var(--jade-red))] dark:border-[rgb(var(--jade-red))]',
    text: 'text-[rgb(var(--jade-red))] dark:text-[rgb(var(--jade-red))]',
    dot: 'bg-[rgb(var(--jade-red))]',
    glow: 'hover:shadow-[0_0_12px_rgba(140,90,80,0.4)] dark:hover:shadow-[0_0_12px_rgba(140,90,80,0.3)]',
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
    ring: 'hover:ring-2 hover:ring-[rgb(var(--jade-aged))] hover:ring-offset-2',
  },
  learned: {
    opacity: 'opacity-100',
    filter: 'none',
    cursor: 'pointer',
    ring: 'ring-2 ring-[rgb(var(--jade-aged))] ring-offset-2 animate-jade-glow',
  },
} as const

function SkillNodeComponent(props: NodeProps) {
  const data = props.data as unknown as SkillNodeData
  const colors = levelColors[data.level as keyof typeof levelColors] || levelColors['入门']
  const status = statusStyles[data.status] || statusStyles.available
  const isLearned = data.status === 'learned'
  const isLocked = data.status === 'locked'

  return (
    <div
      className={`
        jade-tablet relative px-4 py-3 rounded-lg border-2 min-w-[150px] max-w-[170px]
        ${colors.bg} ${colors.border}
        ${status.opacity} ${status.filter}
        transition-all duration-500 ease-out
        hover:scale-[1.02] hover:-translate-y-0.5
        ${status.ring}
      `}
    >
      {/* Top Handle */}
      <Handle
        type="target"
        position={Position.Top}
        className="!w-3.5 !h-3.5 !bg-[rgb(var(--secondary))] !border-2 !border-[rgb(var(--border))] !-top-1.5"
      />

      {/* Level indicator */}
      <div className="flex items-center gap-1.5 mb-1.5">
        <span className={`w-2 h-2 rounded-full ${colors.dot} shadow-sm`} />
        <span className={`text-xs font-medium ${colors.text}`}>{data.level}</span>
        {isLearned && (
          <span className="ml-auto text-[rgb(var(--jade-aged))] text-sm">✓</span>
        )}
        {isLocked && (
          <span className="ml-auto text-[rgb(var(--muted-foreground))] text-sm">🔒</span>
        )}
      </div>

      {/* Node name */}
      <div
        className={`font-semibold text-sm leading-tight ${
          isLocked
            ? 'text-[rgb(var(--muted-foreground))]'
            : 'text-[rgb(var(--foreground))]'
        }`}
        style={{ fontFamily: 'var(--font-noto-serif), serif' }}
      >
        {data.name}
      </div>

      {/* Description */}
      <div className="text-xs text-[rgb(var(--muted-foreground))] mt-1.5 line-clamp-2 leading-relaxed">
        {data.description}
      </div>

      {/* Bottom Handle */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-3.5 !h-3.5 !bg-[rgb(var(--secondary))] !border-2 !border-[rgb(var(--border))] !-bottom-1.5"
      />
    </div>
  )
}

export default memo(SkillNodeComponent)
