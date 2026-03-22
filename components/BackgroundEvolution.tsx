'use client'

import { memo, useEffect, useState } from 'react'

interface BackgroundEvolutionProps {
  progress: number // 0-100, overall tree progress
  containerRef: React.RefObject<HTMLDivElement | null>
}

function BackgroundEvolution({ progress, containerRef }: BackgroundEvolutionProps) {
  const [scrollY, setScrollY] = useState(0)

  useEffect(() => {
    const handleScroll = () => {
      if (containerRef.current) {
        const scrollTop = containerRef.current.scrollTop
        const scrollHeight = containerRef.current.scrollHeight - containerRef.current.clientHeight
        setScrollY(scrollHeight > 0 ? scrollTop / scrollHeight : 0)
      }
    }

    const container = containerRef.current
    if (container) {
      container.addEventListener('scroll', handleScroll)
      return () => container.removeEventListener('scroll', handleScroll)
    }
  }, [containerRef])

  // Determine theme based on scroll position (higher = more cyberpunk)
  const getThemeFactor = () => {
    // Blend between forest (0) and cyberpunk (1) based on scroll
    return scrollY
  }

  const themeFactor = getThemeFactor()

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {/* Base gradient layer */}
      <div
        className="absolute inset-0 transition-all duration-1000"
        style={{
          background: `
            radial-gradient(ellipse at 50% 100%, rgba(34, 85, 51, ${0.4 - themeFactor * 0.2}) 0%, transparent 60%),
            radial-gradient(ellipse at 50% 0%, rgba(20, 40, 60, ${themeFactor * 0.6}) 0%, transparent 50%),
            linear-gradient(to top, rgba(10, 30, 20, 0.3) 0%, rgba(5, 15, 30, 0.1) 100%)
          `,
        }}
      />

      {/* Forest layer (fades out as we go up) */}
      <div
        className="absolute inset-0 transition-opacity duration-1000"
        style={{ opacity: Math.max(0, 1 - themeFactor * 1.5) }}
      >
        {/* Forest trees silhouettes */}
        <svg className="absolute bottom-0 left-0 w-full h-64" preserveAspectRatio="none" viewBox="0 0 1200 300">
          <defs>
            <linearGradient id="treeGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#1a3d2a" />
              <stop offset="100%" stopColor="#0d1f15" />
            </linearGradient>
          </defs>
          {/* Tree silhouettes */}
          <path d="M0,300 L0,200 Q50,180 100,200 L100,150 Q150,100 200,150 L200,180 Q250,160 300,180 L300,300 Z" fill="url(#treeGrad)" opacity="0.6" />
          <path d="M200,300 L200,220 Q280,180 360,220 L360,160 Q420,80 480,160 L480,200 Q560,150 640,200 L640,300 Z" fill="url(#treeGrad)" opacity="0.5" />
          <path d="M500,300 L500,240 Q600,200 700,240 L700,180 Q780,100 860,180 L860,220 Q940,180 1020,220 L1020,300 Z" fill="url(#treeGrad)" opacity="0.7" />
          <path d="M900,300 L900,200 Q1000,160 1100,200 L1100,140 Q1160,60 1200,140 L1200,180 Q1200,200 1200,300 Z" fill="url(#treeGrad)" opacity="0.5" />
        </svg>

        {/* Fog/mist layers */}
        <div className="absolute bottom-0 left-0 w-full h-48 bg-gradient-to-t from-[rgba(200,220,200,0.3)] to-transparent animate-mist-drift" />
        <div className="absolute bottom-8 left-0 w-full h-32 bg-gradient-to-t from-[rgba(180,200,180,0.2)] to-transparent animate-mist-drift-slow" />

        {/* Fireflies / glowing particles */}
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 rounded-full bg-[rgb(var(--lime-bright))]"
            style={{
              left: `${10 + (i * 7) % 80}%`,
              bottom: `${10 + (i * 11) % 40}%`,
              boxShadow: '0 0 6px 2px rgba(180, 220, 80, 0.6)',
              animation: `firefly-${i % 3} ${2 + (i % 3)}s ease-in-out infinite`,
              animationDelay: `${i * 0.3}s`,
            }}
          />
        ))}
      </div>

      {/* Transition layer */}
      <div
        className="absolute inset-0 transition-opacity duration-1000"
        style={{ opacity: Math.min(1, Math.max(0, themeFactor * 2 - 0.5)) }}
      >
        {/* Circuit board patterns */}
        <svg className="absolute inset-0 w-full h-full opacity-10">
          <defs>
            <pattern id="circuitPattern" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
              <path d="M0 50 H30 V70 H50 V50 M50 30 V50 H70 V30 M70 70 V90 H90" stroke="rgba(0, 200, 150, 0.5)" strokeWidth="1" fill="none" />
              <circle cx="30" cy="50" r="2" fill="rgba(0, 200, 150, 0.5)" />
              <circle cx="50" cy="50" r="2" fill="rgba(0, 200, 150, 0.5)" />
              <circle cx="70" cy="70" r="2" fill="rgba(0, 200, 150, 0.5)" />
            </pattern>
          </defs>
          <rect x="0" y="0" width="100%" height="100%" fill="url(#circuitPattern)" />
        </svg>

        {/* Grid lines */}
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `
              linear-gradient(rgba(0, 150, 200, 0.3) 1px, transparent 1px),
              linear-gradient(90deg, rgba(0, 150, 200, 0.3) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px',
            transform: 'perspective(500px) rotateX(30deg)',
            transformOrigin: 'center bottom',
          }}
        />
      </div>

      {/* Cyberpunk layer (fades in as we go up) */}
      <div
        className="absolute inset-0 transition-opacity duration-1000"
        style={{ opacity: Math.min(1, Math.max(0, (themeFactor - 0.5) * 2)) }}
      >
        {/* Neon glow from top */}
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-[rgba(0,100,200,0.15)] to-transparent" />

        {/* Neon lines */}
        <svg className="absolute top-0 left-0 w-full h-full">
          <defs>
            <filter id="neonGlow">
              <feGaussianBlur stdDeviation="3" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Horizontal neon bars */}
          <line x1="0" y1="15%" x2="30%" y2="15%" stroke="rgba(0, 255, 200, 0.3)" strokeWidth="1" filter="url(#neonGlow)" />
          <line x1="70%" y1="25%" x2="100%" y2="25%" stroke="rgba(0, 200, 255, 0.3)" strokeWidth="1" filter="url(#neonGlow)" />
          <line x1="0" y1="45%" x2="20%" y2="45%" stroke="rgba(200, 0, 255, 0.2)" strokeWidth="1" filter="url(#neonGlow)" />
          <line x1="80%" y1="55%" x2="100%" y2="55%" stroke="rgba(0, 255, 200, 0.2)" strokeWidth="1" filter="url(#neonGlow)" />

          {/* Corner accents */}
          <path d="M0 0 L50 0 L50 5 L5 5 L5 50 L0 50 Z" fill="rgba(0, 255, 200, 0.4)" />
          <path d="M100% 0 Lcalc(100% - 50) 0 Lcalc(100% - 50) 5 L100% 5 Z" fill="rgba(0, 200, 255, 0.4)" />
        </svg>

        {/* Floating data particles */}
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="absolute w-0.5 h-0.5 rounded-full bg-cyan-400"
            style={{
              left: `${15 + (i * 11) % 70}%`,
              top: `${10 + (i * 13) % 60}%`,
              boxShadow: '0 0 4px 1px rgba(0, 255, 200, 0.8)',
              animation: `dataStream ${3 + (i % 2)}s linear infinite`,
              animationDelay: `${i * 0.4}s`,
            }}
          />
        ))}
      </div>

      {/* Dynamic vignette based on progress */}
      <div
        className="absolute inset-0 transition-all duration-1000"
        style={{
          boxShadow: `inset 0 0 ${100 + progress}px ${50 + progress / 2}px rgba(0,0,0,${0.3 + themeFactor * 0.2})`,
        }}
      />
    </div>
  )
}

export default memo(BackgroundEvolution)
