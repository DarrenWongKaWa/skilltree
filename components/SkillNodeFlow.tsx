'use client'

import { memo, useState, useCallback, useEffect } from 'react'
import { Handle, Position } from '@xyflow/react'
import type { NodeProps } from '@xyflow/react'
import type { SkillNodeData } from '@/types'

// Fruit colors by level and status
type FruitStyle = {
  bg: string
  glow: string
  ring: string
}

const FRUIT_STYLES: Record<string, Record<string, FruitStyle>> = {
  Beginner: {
    learned: { bg: 'bg-gradient-to-br from-lime-400 to-green-500', glow: 'shadow-[0_0_20px_rgba(132,204,22,0.7)]', ring: 'ring-2 ring-lime-300' },
    available: { bg: 'bg-gradient-to-br from-lime-300 to-green-400', glow: 'shadow-[0_0_12px_rgba(132,204,22,0.5)]', ring: 'ring-2 ring-lime-400/50' },
    locked: { bg: 'bg-gradient-to-br from-gray-300 to-gray-400', glow: '', ring: '' },
  },
  Intermediate: {
    learned: { bg: 'bg-gradient-to-br from-amber-400 to-orange-500', glow: 'shadow-[0_0_20px_rgba(251,146,60,0.7)]', ring: 'ring-2 ring-amber-300' },
    available: { bg: 'bg-gradient-to-br from-amber-300 to-orange-400', glow: 'shadow-[0_0_12px_rgba(251,146,60,0.5)]', ring: 'ring-2 ring-amber-400/50' },
    locked: { bg: 'bg-gradient-to-br from-gray-300 to-gray-400', glow: '', ring: '' },
  },
  Advanced: {
    learned: { bg: 'bg-gradient-to-br from-purple-400 to-pink-500', glow: 'shadow-[0_0_20px_rgba(236,72,153,0.7)]', ring: 'ring-2 ring-purple-300' },
    available: { bg: 'bg-gradient-to-br from-purple-300 to-pink-400', glow: 'shadow-[0_0_12px_rgba(236,72,153,0.5)]', ring: 'ring-2 ring-pink-400/50' },
    locked: { bg: 'bg-gradient-to-br from-gray-300 to-gray-400', glow: '', ring: '' },
  },
}

interface SkillNodeFlowData extends SkillNodeData {
  isCollapsed?: boolean
  onSelect?: (node: SkillNodeData) => void
  onCollapse?: (nodeId: string) => void
  onNodeClick?: (node: SkillNodeData) => void
}

function SkillNodeFlowComponent({ data, selected }: NodeProps) {
  const node = data as unknown as SkillNodeFlowData
  const levelStyle = FRUIT_STYLES[node.level] || FRUIT_STYLES.Beginner
  const statusStyle = levelStyle[node.status] || levelStyle.locked

  // Local state for immediate collapse feedback before React re-renders
  const [localCollapsed, setLocalCollapsed] = useState(node.isCollapsed ?? false)

  // Sync local state when parent prop changes (e.g., after other node interactions)
  useEffect(() => {
    setLocalCollapsed(node.isCollapsed ?? false)
  }, [node.isCollapsed])

  const handleClick = () => {
    node.onNodeClick?.(node)
  }

  const handleCollapseClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    if (node.children.length > 0 && (node.status === 'learned' || node.status === 'available')) {
      // Immediately toggle local state for instant visual feedback
      setLocalCollapsed(prev => !prev)
      // Then propagate to parent
      node.onCollapse?.(node.id)
    }
  }, [node.children.length, node.status, node.onCollapse, node.id])

  return (
    <div className="relative">
      {/* Target handle (from parent edge) - positioned at BOTTOM since we're BT layout */}
      <Handle
        type="target"
        position={Position.Bottom}
        className="!w-3 !h-3 !bg-[rgb(var(--lime-medium))] !border-2 !border-white"
      />

      {/* Fruit Node */}
      <button
        onClick={handleClick}
        className={`
          relative w-12 h-12 rounded-full cursor-pointer
          no-select no-double-tap-zoom gpu-accelerated
          ${statusStyle.bg} ${statusStyle.glow}
          transition-all duration-300 ease-out
          ${selected ? statusStyle.ring : ''}
          ${node.status === 'learned' ? 'animate-pulse' : ''}
          ${localCollapsed ? 'opacity-60' : ''}
          flex items-center justify-center
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[rgb(var(--lime-medium))]
        `}
        title={node.name}
        aria-label={`${node.name}, ${node.level} level, ${node.status === 'learned' ? 'learned' : node.status === 'available' ? 'available to learn' : 'locked'}`}
        aria-pressed={selected}
      >
        {/* Status icon */}
        {node.status === 'learned' && (
          <svg className="w-5 h-5 text-white drop-shadow-md" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        )}
        {node.status === 'locked' && (
          <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        )}
        {node.status === 'available' && !localCollapsed && (
          <span className="w-2 h-2 rounded-full bg-white/80" />
        )}

        {/* Collapse indicator */}
        {node.children.length > 0 && (
          <div
            onClick={handleCollapseClick}
            className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[rgb(var(--card))] border border-[rgb(var(--border))] flex items-center justify-center transition-transform cursor-pointer no-select no-double-tap-zoom gpu-accelerated ${localCollapsed ? 'rotate-180' : ''}`}
          >
            <svg className="w-3 h-3 text-[rgb(var(--muted-foreground))]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        )}
      </button>

      {/* Label below node */}
      <div className={`absolute top-full left-1/2 -translate-x-1/2 mt-2 text-center min-w-[80px] max-w-[100px] ${node.status === 'locked' ? 'opacity-50' : ''}`}>
        <div className="text-xs font-medium text-[rgb(var(--foreground))] line-clamp-2 leading-tight">
          {node.name}
        </div>
        <div className="text-[10px] text-[rgb(var(--muted-foreground))]">
          {node.level}
        </div>
      </div>

      {/* Source handle (to child edge) - positioned at TOP since we're BT layout */}
      <Handle
        type="source"
        position={Position.Top}
        className="!w-3 !h-3 !bg-[rgb(var(--lime-medium))] !border-2 !border-white"
      />
    </div>
  )
}

export default memo(SkillNodeFlowComponent)