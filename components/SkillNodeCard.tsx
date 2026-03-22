'use client'

import { memo } from 'react'
import type { SkillNodeData } from '@/types'

// Lime color scheme - fresh green tones
const levelColors = {
  'Beginner': {
    bg: 'bg-[rgb(var(--lime-bright-bg))] dark:bg-[rgb(var(--lime-bright-bg))]',
    border: 'border-[rgb(var(--lime-bright))] dark:border-[rgb(var(--lime-bright))]',
    text: 'text-[rgb(var(--lime-dark))] dark:text-[rgb(var(--lime-bright))]',
    dot: 'bg-[rgb(var(--lime-bright))]',
  },
  'Intermediate': {
    bg: 'bg-[rgb(var(--lime-medium-bg))] dark:bg-[rgb(var(--lime-medium-bg))]',
    border: 'border-[rgb(var(--lime-medium))] dark:border-[rgb(var(--lime-medium))]',
    text: 'text-[rgb(var(--lime-dark))] dark:text-[rgb(var(--lime-medium))]',
    dot: 'bg-[rgb(var(--lime-medium))]',
  },
  'Advanced': {
    bg: 'bg-[rgb(var(--lime-dark-bg))] dark:bg-[rgb(var(--lime-dark-bg))]',
    border: 'border-[rgb(var(--lime-dark))] dark:border-[rgb(var(--lime-dark))]',
    text: 'text-[rgb(var(--lime-dark))] dark:text-[rgb(var(--lime-dark))]',
    dot: 'bg-[rgb(var(--lime-dark))]',
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
    ring: 'ring-2 ring-[rgb(var(--lime-medium))] ring-offset-2',
  },
} as const

interface SkillNodeCardProps {
  data: SkillNodeData
  selected?: boolean
  onClick?: () => void
}

function SkillNodeCard({ data, selected, onClick }: SkillNodeCardProps) {
  const colors = levelColors[data.level as keyof typeof levelColors] || levelColors['Beginner']
  const status = statusStyles[data.status] || statusStyles.available
  const isLearned = data.status === 'learned'
  const isLocked = data.status === 'locked'

  return (
    <div
      onClick={onClick}
      className={`
        lime-tablet relative px-4 py-3 rounded-lg border-2 min-w-[150px] max-w-[170px]
        ${colors.bg} ${colors.border}
        ${status.opacity} ${status.filter}
        transition-all duration-500 ease-out
        hover:scale-[1.02] hover:-translate-y-0.5
        ${status.ring}
        ${selected ? 'ring-4 ring-[rgb(var(--lime-bright))] ring-offset-2 shadow-xl animate-learning-pulse' : ''}
        ${isLearned ? 'animate-lime-glow' : ''}
        cursor-pointer
      `}
    >
      {/* Level indicator */}
      <div className="flex items-center gap-1.5 mb-1.5">
        <span className={`w-2 h-2 rounded-full ${colors.dot} shadow-sm ${isLearned ? 'animate-pulse' : ''}`} />
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
    </div>
  )
}

export default memo(SkillNodeCard)
