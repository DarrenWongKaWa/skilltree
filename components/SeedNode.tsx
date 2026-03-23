'use client'

import { memo } from 'react'
import { Handle, Position } from '@xyflow/react'
import type { NodeProps } from '@xyflow/react'

interface SeedNodeData {
  topic: string
}

function SeedNodeComponent({ data }: NodeProps) {
  const node = data as unknown as SeedNodeData

  return (
    <div className="flex flex-col items-center">
      {/* Source handle at TOP - sends edges upward to first-level nodes in BT layout */}
      <Handle
        type="source"
        position={Position.Top}
        className="!w-3 !h-3 !bg-[rgb(var(--seed-brown))] !border-2 !border-white/50"
      />

      {/* Seed shape - earthy brown gradient */}
      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[rgb(var(--seed-brown))] to-[rgb(var(--seed-dark))] shadow-lg flex items-center justify-center animate-pulse">
        <svg className="w-8 h-8 text-white/90" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 22V12M12 12C12 12 7 9 7 5C7 3 9 2 12 2C15 2 17 3 17 5C17 9 12 12 12 12ZM5 12H2M22 12H19M12 12V22"/>
        </svg>
      </div>

      {/* Topic label */}
      <div className="mt-2 px-4 py-1.5 rounded-full bg-[rgb(var(--card))]/90 border border-[rgb(var(--border))] shadow-md">
        <span className="text-sm font-bold text-[rgb(var(--foreground))]" style={{ fontFamily: "'Noto Serif', Georgia, serif" }}>
          {node.topic}
        </span>
      </div>
    </div>
  )
}

export default memo(SeedNodeComponent)