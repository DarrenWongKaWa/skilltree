'use client'

import { memo } from 'react'
import { Handle, Position } from '@xyflow/react'
import type { NodeProps } from '@xyflow/react'
import type { SkillNodeData } from '@/types'

// Lime color scheme - fresh green tones
const levelColors = {
  '入门': {
    bg: 'bg-[rgb(var(--lime-bright-bg))] dark:bg-[rgb(var(--lime-bright-bg))]',
    border: 'border-[rgb(var(--lime-bright))] dark:border-[rgb(var(--lime-bright))]',
    text: 'text-[rgb(var(--lime-dark))] dark:text-[rgb(var(--lime-bright))]',
    dot: 'bg-[rgb(var(--lime-bright))]',
    glow: 'hover:shadow-[0_0_12px_rgba(180,220,80,0.5)] dark:hover:shadow-[0_0_12px_rgba(150,190,100,0.4)]',
  },
  '进阶': {
    bg: 'bg-[rgb(var(--lime-medium-bg))] dark:bg-[rgb(var(--lime-medium-bg))]',
    border: 'border-[rgb(var(--lime-medium))] dark:border-[rgb(var(--lime-medium))]',
    text: 'text-[rgb(var(--lime-dark))] dark:text-[rgb(var(--lime-medium))]',
    dot: 'bg-[rgb(var(--lime-medium))]',
    glow: 'hover:shadow-[0_0_12px_rgba(120,180,60,0.5)] dark:hover:shadow-[0_0_12px_rgba(100,150,60,0.4)]',
  },
  '高级': {
    bg: 'bg-[rgb(var(--lime-dark-bg))] dark:bg-[rgb(var(--lime-dark-bg))]',
    border: 'border-[rgb(var(--lime-dark))] dark:border-[rgb(var(--lime-dark))]',
    text: 'text-[rgb(var(--lime-dark))] dark:text-[rgb(var(--lime-dark))]',
    dot: 'bg-[rgb(var(--lime-dark))]',
    glow: 'hover:shadow-[0_0_12px_rgba(80,140,40,0.5)] dark:hover:shadow-[0_0_12px_rgba(80,130,50,0.4)]',
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
    ring: 'hover:ring-2 hover:ring-[rgb(var(--lime-medium))] hover:ring-offset-2',
  },
  learned: {
    opacity: 'opacity-100',
    filter: 'none',
    cursor: 'pointer',
    ring: 'ring-2 ring-[rgb(var(--lime-medium))] ring-offset-2 animate-lime-glow',
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
        lime-tablet relative px-4 py-3 rounded-lg border-2 min-w-[150px] max-w-[170px]
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
          <span className="ml-auto text-[rgb(var(--lime-medium))] text-sm">✓</span>
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
        style={{ fontFamily: "'Noto Serif', Georgia, serif" }}
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
