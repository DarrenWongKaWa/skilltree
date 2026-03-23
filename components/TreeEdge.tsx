'use client'

import { memo } from 'react'
import { BaseEdge, Position, getBezierPath } from '@xyflow/react'

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
  sourcePosition: Position
  targetPosition: Position
  data?: TreeEdgeData
  selected?: boolean
}

function TreeEdgeComponent({
  id,
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

  // Use React Flow's native getBezierPath for non-looping S-curves
  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  })

  // Estimate path length from Euclidean distance (avoids expensive getTotalLength during drag)
  const estimatedLength = Math.sqrt(
    Math.pow(targetX - sourceX, 2) + Math.pow(targetY - sourceY, 2)
  )
  const dashLength = estimatedLength * 0.5
  const pathLength = estimatedLength

  return (
    <>
      {/* Glow effect layer - wider, more diffuse */}
      {isLearned && (
        <path
          d={edgePath}
          fill="none"
          stroke="rgb(var(--lime-bright))"
          strokeWidth={10}
          strokeOpacity={0.12}
        />
      )}

      {/* Secondary glow - medium */}
      {isLearned && (
        <path
          d={edgePath}
          fill="none"
          stroke="rgb(var(--lime-medium))"
          strokeWidth={5}
          strokeOpacity={0.25}
        />
      )}

      {/* Main edge path - base line */}
      <BaseEdge
        id={`base-${id}`}
        path={edgePath}
        style={{
          strokeWidth: isLearned ? 2.5 : 1.5,
          stroke: selected
            ? 'rgb(var(--lime-bright))'
            : isLearned
              ? 'rgb(var(--lime-medium))'
              : 'rgba(132, 204, 22, 0.35)',
        }}
      />

      {/* Animated fluorescent flow effect - single animated layer for performance */}
      {isLearned && (
        <>
          {/* Layer 1: Wide ambient glow */}
          <path
            d={edgePath}
            fill="none"
            stroke="rgb(var(--lime-medium))"
            strokeWidth={12}
            strokeOpacity={0.08}
            strokeDasharray={`${dashLength} ${pathLength}`}
            strokeLinecap="round"
          />
          {/* Layer 2: Main neon halo */}
          <path
            d={edgePath}
            fill="none"
            stroke="rgb(var(--lime-dark))"
            strokeWidth={6}
            strokeOpacity={0.35}
            strokeDasharray={`${dashLength} ${pathLength}`}
            strokeLinecap="round"
            className="edge-flow-animation"
          />
        </>
      )}

      {/* Static white core for learned edges */}
      {isLearned && (
        <path
          d={edgePath}
          fill="none"
          stroke="rgba(255, 255, 255, 0.6)"
          strokeWidth={1.5}
          strokeOpacity={0.6}
        />
      )}
    </>
  )
}

export default memo(TreeEdgeComponent)