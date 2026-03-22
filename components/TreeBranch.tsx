'use client'

import { memo } from 'react'

interface TreeBranchProps {
  startX: number
  startY: number
  endX: number
  endY: number
  level: number // 0 = root (thickest), higher = thinner
  isLearned: boolean
  isAnimating: boolean
}

function TreeBranch({ startX, startY, endX, endY, level, isLearned, isAnimating }: TreeBranchProps) {
  // Calculate thickness based on level (0 = thickest)
  const baseThickness = Math.max(2, 8 - level * 1.5)
  const glowThickness = baseThickness + 8

  // Generate path with slight curve for organic tree look
  const midX = (startX + endX) / 2
  const midY = (startY + endY) / 2
  const controlOffset = (Math.random() - 0.5) * 30

  // Bezier curve for organic branch shape
  const path = `M ${startX} ${startY} Q ${midX + controlOffset} ${midY} ${endX} ${endY}`

  // Color gradient from bottom (lighter green) to top (deeper green/cyan for cyberpunk)
  const getColor = () => {
    if (!isLearned) {
      return {
        main: level < 2 ? '#4a7c59' : level < 4 ? '#2d5a3d' : '#1a3d2a', // muted brownish-green for unlearned
        glow: 'rgba(74, 124, 89, 0.3)',
      }
    }
    // Learned branches glow with fluorescent green
    const intensity = Math.min(1, 0.6 + level * 0.1)
    return {
      main: level < 2 ? `rgba(80, 220, 120, ${intensity})` : level < 4 ? `rgba(60, 200, 100, ${intensity})` : `rgba(40, 180, 140, ${intensity})`,
      glow: level < 2 ? 'rgba(80, 220, 120, 0.6)' : level < 4 ? 'rgba(60, 200, 100, 0.5)' : 'rgba(40, 180, 140, 0.4)',
    }
  }

  const colors = getColor()

  return (
    <g className="tree-branch">
      {/* Glow layer */}
      <defs>
        <linearGradient id={`branch-gradient-${startX}-${endX}`} x1="0%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%" stopColor={colors.main} stopOpacity="0.3" />
          <stop offset="100%" stopColor={colors.main} stopOpacity="0.8" />
        </linearGradient>
        <filter id={`glow-${startX}-${endX}`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="4" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id={`strong-glow-${startX}-${endX}`} x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="8" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Outer glow (visible when learned) */}
      {isLearned && (
        <path
          d={path}
          fill="none"
          stroke={colors.glow}
          strokeWidth={glowThickness}
          strokeLinecap="round"
          filter={`url(#${isAnimating ? 'strong-glow' : 'glow'}-${startX}-${endX})`}
          className={isAnimating ? 'animate-pulse' : ''}
        />
      )}

      {/* Main branch */}
      <path
        d={path}
        fill="none"
        stroke={colors.main}
        strokeWidth={baseThickness}
        strokeLinecap="round"
        className="transition-all duration-700"
      />

      {/* Fluorescent flow particle (when learned and animating) */}
      {isLearned && isAnimating && (
        <circle r="3" fill="#80ff90" className="animate-fluorescent-flow">
          <animateMotion
            dur="2s"
            repeatCount="indefinite"
            path={path}
          />
        </circle>
      )}

      {/* Secondary smaller particle */}
      {isLearned && isAnimating && (
        <circle r="2" fill="#40ff60" opacity="0.7">
          <animateMotion
            dur="2.5s"
            repeatCount="indefinite"
            begin="0.5s"
            path={path}
          />
        </circle>
      )}
    </g>
  )
}

export default memo(TreeBranch)
