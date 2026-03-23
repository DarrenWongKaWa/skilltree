'use client'

import { memo, useEffect, useState } from 'react'
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
  const [pathLength, setPathLength] = useState(200)

  // Use React Flow's native getBezierPath for non-looping S-curves
  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  })

  // Measure path length after render for animation
  useEffect(() => {
    const path = document.querySelector(`#edge-path-${id}`) as SVGPathElement | null
    if (path) {
      setPathLength(path.getTotalLength())
    }
  }, [id, edgePath])

  const dashLength = pathLength * 0.6

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
          className="animate-pulse"
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
          transition: 'all 0.5s ease-out',
        }}
      />

      {/* Animated fluorescent flow effect - layered paths for glow (no CSS filters) */}
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
          {/* Layer 3: Pure white core */}
          <path
            d={edgePath}
            fill="none"
            stroke="white"
            strokeWidth={2}
            strokeOpacity={0.85}
            strokeDasharray={`${dashLength} ${pathLength}`}
            strokeLinecap="round"
            className="edge-flow-animation"
          />
        </>
      )}

      {/* Static inner glow for learned edges */}
      {isLearned && (
        <path
          d={edgePath}
          fill="none"
          stroke="rgba(255, 255, 255, 0.4)"
          strokeWidth={0.5}
          strokeOpacity={0.5}
        />
      )}
    </>
  )
}

export default memo(TreeEdgeComponent)