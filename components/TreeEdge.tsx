'use client'

import { memo } from 'react'
import { BaseEdge, getBezierPath } from '@xyflow/react'

type TreeEdgeData = {
  isLearned?: boolean
  isAnimating?: boolean
}

interface TreeEdgeProps {
  id: string
  sourceX: number
  sourceY: number
  targetX: number
  targetY: number
  sourcePosition: any
  targetPosition: any
  data?: TreeEdgeData
  selected?: boolean
}

function TreeEdgeComponent({
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  selected,
}: TreeEdgeProps) {
  const edgeData = data as TreeEdgeData | undefined
  const isLearned = edgeData?.isLearned ?? false

  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
  })

  return (
    <>
      {/* Glow effect for learned edges */}
      {isLearned && (
        <path
          d={edgePath}
          fill="none"
          stroke="rgb(var(--lime-bright))"
          strokeWidth={6}
          strokeOpacity={0.3}
          className="animate-pulse"
        />
      )}
      {/* Main edge path */}
      <BaseEdge
        path={edgePath}
        className={`transition-all duration-500 ${
          isLearned
            ? 'stroke-[rgb(var(--lime-medium))]'
            : 'stroke-[rgb(var(--lime-dark))]'
        } ${selected ? 'stroke-[rgb(var(--lime-bright))]' : ''}`}
        style={{
          strokeWidth: isLearned ? 3 : 2,
        }}
      />
    </>
  )
}

export default memo(TreeEdgeComponent)