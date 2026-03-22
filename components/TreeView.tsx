'use client'

import { useState, useCallback, useEffect, useRef, useMemo, lazy, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { useStore } from '@/store'
import SkillListSidebar from '@/components/SkillListSidebar'
import TreeBranch from '@/components/TreeBranch'
import BackgroundEvolution from '@/components/BackgroundEvolution'
import ThemeToggle from '@/components/ThemeToggle'
import { generateQuiz } from '@/lib/api'
import type { SkillNodeData, SkillTree, Quiz } from '@/types'

const QuizModal = lazy(() => import('@/components/QuizModal'))

// Fruit colors by level and status
type FruitStyle = {
  bg: string
  glow: string
  ring: string
}

const fruitStyles: Record<string, Record<string, FruitStyle>> = {
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

export default function TreeView({ treeId }: { treeId: string }) {
  const router = useRouter()
  const { trees, updateNodeStatus, getTree } = useStore()
  const tree = trees[treeId] as SkillTree | undefined
  const containerRef = useRef<HTMLDivElement>(null)

  const [selectedNode, setSelectedNode] = useState<SkillNodeData | null>(null)
  const [quiz, setQuiz] = useState<Quiz | null>(null)
  const [quizLoading, setQuizLoading] = useState(false)
  const [growthAnimation, setGrowthAnimation] = useState<Record<string, boolean>>({})
  const [zoom, setZoom] = useState(1)
  const [collapsedNodes, setCollapsedNodes] = useState<Set<string>>(new Set())

  // Calculate layout - tree grows from bottom to top
  const layout = useMemo(() => {
    if (!tree) return { nodes: [], branches: [], maxY: 800 }

    // Find root nodes (no prerequisites)
    const rootNodes = tree.nodes.filter(n => n.prerequisites.length === 0)

    // Group nodes by level (distance from root)
    const levelMap = new Map<string, number>()
    const assignLevel = (nodeId: string, level: number) => {
      if (levelMap.has(nodeId)) return
      levelMap.set(nodeId, level)
      const node = tree.nodes.find(n => n.id === nodeId)
      node?.children.forEach(childId => assignLevel(childId, level + 1))
    }

    rootNodes.forEach(root => assignLevel(root.id, 0))
    tree.nodes.forEach(node => {
      if (!levelMap.has(node.id)) levelMap.set(node.id, 0)
    })

    // Calculate positions
    const nodesByLevel = tree.nodes.reduce((acc, node) => {
      const level = levelMap.get(node.id) || 0
      if (!acc[level]) acc[level] = []
      acc[level].push(node)
      return acc
    }, {} as Record<number, SkillNodeData[]>)

    const maxLevel = Math.max(...Array.from(levelMap.values()), 0)
    const levelHeight = 150
    const baseY = 700
    const nodeWidth = 140

    // Position nodes
    const positionedNodes = tree.nodes.map(node => {
      const level = levelMap.get(node.id) || 0
      const nodesAtLevel = nodesByLevel[level] || []
      const indexAtLevel = nodesAtLevel.indexOf(node)
      const totalAtLevel = nodesAtLevel.length

      const levelWidth = totalAtLevel * nodeWidth
      const startX = (800 - levelWidth) / 2 + nodeWidth / 2

      return {
        node,
        x: startX + indexAtLevel * nodeWidth,
        y: baseY - level * levelHeight,
        level,
      }
    })

    // Create branches (edges between parent and children) - only for non-collapsed
    const branches = tree.nodes.flatMap(node => {
      if (collapsedNodes.has(node.id)) return [] // Skip if parent collapsed

      return (node.children || [])
        .filter(childId => !collapsedNodes.has(childId))
        .map(childId => {
          const parent = positionedNodes.find(p => p.node.id === node.id)
          const child = positionedNodes.find(p => p.node.id === childId)
          if (!parent || !child) return null

          const branchLevel = Math.min(parent.level, maxLevel)

          return {
            startX: parent.x,
            startY: parent.y + 25,
            endX: child.x,
            endY: child.y - 25,
            level: branchLevel,
            isLearned: parent.node.status === 'learned',
            key: `${node.id}-${childId}`,
          }
        }).filter(Boolean)
    }).filter(Boolean) as {
      startX: number
      startY: number
      endX: number
      endY: number
      level: number
      isLearned: boolean
      key: string
    }[]

    return { nodes: positionedNodes, branches, maxY: baseY + 50 }
  }, [tree, collapsedNodes])

  // Trigger growth animation on mount - bottom to top
  useEffect(() => {
    if (tree && layout.nodes.length > 0) {
      const sortedIndices = layout.nodes
        .map((_, i) => i)
        .sort((a, b) => layout.nodes[b].y - layout.nodes[a].y)

      sortedIndices.forEach((nodeIndex, sortedOrder) => {
        setTimeout(() => {
          setGrowthAnimation(prev => ({ ...prev, [nodeIndex]: true }))
        }, sortedOrder * 100)
      })
    }
  }, [tree, layout.nodes.length])

  const onNodeSelect = useCallback((node: SkillNodeData) => {
    setSelectedNode(prev => prev?.id === node.id ? null : node)
  }, [])

  const handleCollapse = useCallback((nodeId: string) => {
    setCollapsedNodes(prev => {
      const next = new Set(prev)
      if (next.has(nodeId)) {
        next.delete(nodeId)
      } else {
        next.add(nodeId)
      }
      return next
    })
  }, [])

  const handleDirectLight = useCallback((nodeId: string) => {
    updateNodeStatus(treeId, nodeId, 'learned')
    setGrowthAnimation(prev => ({ ...prev, [nodeId]: true }))
    setSelectedNode(prev => prev?.id === nodeId ? { ...prev, status: 'learned' } : prev)
    // Use getTree to get fresh data from store, not closure
    const freshTree = getTree(treeId)
    if (freshTree) {
      const children = freshTree.nodes.filter((n) => n.prerequisites.includes(nodeId))
      children.forEach((child) => {
        const allPrereqsMet = child.prerequisites.every((prereqId) => {
          const prereq = freshTree.nodes.find((n) => n.id === prereqId)
          return prereq?.status === 'learned'
        })
        if (allPrereqsMet && child.status === 'locked') {
          updateNodeStatus(treeId, child.id, 'available')
        }
      })
    }
  }, [treeId, updateNodeStatus, getTree])

  const handleQuiz = useCallback(async (node: SkillNodeData) => {
    setQuizLoading(true)
    try {
      const generatedQuiz = await generateQuiz(node.name, node.description)
      setQuiz({ ...generatedQuiz, nodeId: node.id })
    } catch (e) {
      console.error('Failed to generate quiz', e)
    }
    setQuizLoading(false)
  }, [])

  const handleQuizPass = useCallback(() => {
    if (quiz?.nodeId) {
      handleDirectLight(quiz.nodeId)
    }
  }, [quiz, handleDirectLight])

  const zoomIn = () => setZoom(prev => Math.min(prev + 0.2, 2))
  const zoomOut = () => setZoom(prev => Math.max(prev - 0.2, 0.4))

  if (!tree) {
    return (
      <div className="flex items-center justify-center h-screen bg-[rgb(var(--background))]">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[rgb(var(--card))] border border-[rgb(var(--border))] flex items-center justify-center">
            <svg className="w-8 h-8 text-[rgb(var(--muted-foreground))]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M12 2a10 10 0 100 20 10 10 0 000-20z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-[rgb(var(--foreground))] mb-4">
            Skill Tree Not Found
          </h3>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-2 bg-[rgb(var(--primary))] text-[rgb(var(--primary-foreground))] rounded-lg hover:opacity-90 transition-opacity font-medium"
          >
            Back to Home
          </button>
        </div>
      </div>
    )
  }

  const learnedCount = tree.nodes.filter((n) => n.status === 'learned').length
  const totalCount = tree.nodes.length
  const percent = Math.round((learnedCount / totalCount) * 100)

  return (
    <div className="flex h-full bg-[rgb(var(--background))] relative">
      {/* Left Sidebar */}
      <SkillListSidebar
        nodes={tree.nodes}
        selectedNodeId={selectedNode?.id || null}
        onNodeSelect={onNodeSelect}
        progress={percent}
      />

      {/* Main Tree Area */}
      <div className="flex-1 relative overflow-hidden" ref={containerRef}>
        {/* Top Bar */}
        <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between">
          {/* Left: Back button + Title */}
          <div className="glass rounded-2xl shadow-lg border border-[rgb(var(--border))] p-3 flex items-center gap-3">
            <button
              onClick={() => router.push('/')}
              className="p-2 rounded-lg hover:bg-[rgb(var(--secondary))] transition-colors"
              title="Back to home"
            >
              <svg className="w-5 h-5 text-[rgb(var(--foreground))]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <div className="h-6 w-px bg-[rgb(var(--border))]" />
            <div>
              <h1 className="font-bold text-[rgb(var(--foreground))] text-sm" style={{ fontFamily: "'Noto Serif', Georgia, serif" }}>
                {tree.topic}
              </h1>
              <div className="flex items-center gap-2 mt-0.5">
                <div className="h-1.5 w-24 bg-[rgb(var(--secondary))] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[rgb(var(--lime-dark))] to-[rgb(var(--lime-bright))] transition-all duration-500"
                    style={{ width: `${percent}%` }}
                  />
                </div>
                <span className="text-xs text-[rgb(var(--muted-foreground))]">
                  {percent}%
                </span>
              </div>
            </div>
          </div>

          {/* Right: Zoom controls + Theme */}
          <div className="flex items-center gap-2">
            <div className="glass rounded-xl shadow-lg border border-[rgb(var(--border))] p-1 flex items-center gap-1">
              <button
                onClick={zoomOut}
                className="p-2 rounded-lg hover:bg-[rgb(var(--secondary))] transition-colors"
                title="Zoom out"
              >
                <svg className="w-4 h-4 text-[rgb(var(--foreground))]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                </svg>
              </button>
              <span className="text-xs text-[rgb(var(--foreground))] px-2 font-medium min-w-[3rem] text-center">
                {Math.round(zoom * 100)}%
              </span>
              <button
                onClick={zoomIn}
                className="p-2 rounded-lg hover:bg-[rgb(var(--secondary))] transition-colors"
                title="Zoom in"
              >
                <svg className="w-4 h-4 text-[rgb(var(--foreground))]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </div>
            <ThemeToggle />
          </div>
        </div>

        {/* Quiz loading overlay */}
        {quizLoading && (
          <div className="absolute inset-0 bg-[rgb(var(--background))]/60 flex items-center justify-center z-30 backdrop-blur-sm">
            <div className="bg-[rgb(var(--card))] rounded-2xl p-6 shadow-xl border border-[rgb(var(--border))]">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 border-2 border-[rgb(var(--lime-medium))]/30 border-t-[rgb(var(--lime-medium))] rounded-full animate-spin" />
                <span className="text-[rgb(var(--foreground))] font-medium">Generating Quiz...</span>
              </div>
            </div>
          </div>
        )}

        {/* Evolving Background */}
        <BackgroundEvolution progress={percent} containerRef={containerRef} />

        {/* Tree Canvas with Zoom */}
        <div className="absolute inset-0 z-10 overflow-auto">
          <div
            className="relative transition-transform duration-300 ease-out origin-center"
            style={{
              width: '800px',
              height: `${layout.maxY}px`,
              margin: '0 auto',
              transform: `scale(${zoom})`,
              transformOrigin: 'center 70%',
            }}
          >
            {/* Tree SVG Canvas (branches) */}
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none"
              viewBox="0 0 800 750"
              preserveAspectRatio="xMidYMid meet"
            >
              {layout.branches.map(branch => (
                <TreeBranch
                  key={branch.key}
                  startX={branch.startX}
                  startY={branch.startY}
                  endX={branch.endX}
                  endY={branch.endY}
                  level={branch.level}
                  isLearned={branch.isLearned}
                  isAnimating={growthAnimation[branch.key]}
                />
              ))}
            </svg>

            {/* Fruit Nodes */}
            {layout.nodes.map(({ node, x, y }, index) => {
              const sortedIndices = layout.nodes
                .map((_, i) => i)
                .sort((a, b) => layout.nodes[b].y - layout.nodes[a].y)
              const sortedOrder = sortedIndices.indexOf(index)
              const isCollapsed = node.children.length > 0 && collapsedNodes.has(node.id)
              const isSelected = selectedNode?.id === node.id

              const levelStyle = fruitStyles[node.level as keyof typeof fruitStyles] || fruitStyles.Beginner
              const statusStyle = levelStyle[node.status as keyof typeof levelStyle] || levelStyle.locked

              return (
                <div
                  key={node.id}
                  className={`absolute transition-all duration-700 ease-out ${
                    growthAnimation[index] ? 'opacity-100 scale-100' : 'opacity-0 scale-0'
                  }`}
                  style={{
                    left: `${x - 24}px`,
                    top: `${y - 24}px`,
                    transitionDelay: `${sortedOrder * 80}ms`,
                  }}
                >
                  {/* Fruit Node (clickable) */}
                  <button
                    onClick={() => {
                      if (node.children.length > 0 && (node.status === 'learned' || node.status === 'available')) {
                        handleCollapse(node.id)
                      }
                      onNodeSelect(node)
                    }}
                    className={`
                      relative w-12 h-12 rounded-full
                      ${statusStyle.bg} ${statusStyle.glow}
                      transition-all duration-300 ease-out
                      hover:scale-110 hover:-translate-y-1
                      ${isSelected ? statusStyle.ring : ''}
                      ${node.status === 'learned' ? 'animate-pulse' : ''}
                      ${isCollapsed ? 'opacity-60' : ''}
                      flex items-center justify-center
                    `}
                    title={node.name}
                  >
                    {/* Status icon inside fruit */}
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
                    {node.status === 'available' && !isCollapsed && (
                      <span className="w-2 h-2 rounded-full bg-white/80" />
                    )}

                    {/* Collapse indicator */}
                    {node.children.length > 0 && (
                      <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[rgb(var(--card))] border border-[rgb(var(--border))] flex items-center justify-center transition-transform ${isCollapsed ? 'rotate-180' : ''}`}>
                        <svg className="w-3 h-3 text-[rgb(var(--muted-foreground))]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    )}
                  </button>

                  {/* Node label below fruit */}
                  <div className={`absolute top-full left-1/2 -translate-x-1/2 mt-2 text-center min-w-[80px] max-w-[100px] ${node.status === 'locked' ? 'opacity-50' : ''}`}>
                    <div className="text-xs font-medium text-[rgb(var(--foreground))] line-clamp-2 leading-tight">
                      {node.name}
                    </div>
                    <div className="text-[10px] text-[rgb(var(--muted-foreground))]">
                      {node.level}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Skill Detail Panel - Square popup */}
        {selectedNode && (
          <div className="absolute right-4 top-28 w-80 z-30 animate-fade-in">
            <div className="glass rounded-2xl shadow-xl border border-[rgb(var(--border))] p-5">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  {/* Level indicator fruit */}
                  <div className={`w-10 h-10 rounded-full ${
                    fruitStyles[selectedNode.level as keyof typeof fruitStyles]?.[selectedNode.status as keyof typeof fruitStyles.beginner]?.bg || 'bg-gray-300'
                  } flex items-center justify-center`}>
                    {selectedNode.status === 'learned' ? (
                      <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : selectedNode.status === 'locked' ? (
                      <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    ) : (
                      <span className="w-2 h-2 rounded-full bg-white/80" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-[rgb(var(--foreground))] text-base" style={{ fontFamily: "'Noto Serif', Georgia, serif" }}>
                      {selectedNode.name}
                    </h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      selectedNode.level === 'Beginner' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                      selectedNode.level === 'Intermediate' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                      'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                    }`}>
                      {selectedNode.level}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedNode(null)}
                  className="p-1.5 rounded-lg hover:bg-[rgb(var(--secondary))] transition-colors"
                >
                  <svg className="w-4 h-4 text-[rgb(var(--muted-foreground))]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Description */}
              <p className="text-sm text-[rgb(var(--foreground))] mb-4 leading-relaxed">
                {selectedNode.description}
              </p>

              {/* Resources */}
              {selectedNode.resources.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-xs font-semibold text-[rgb(var(--muted-foreground))] uppercase mb-2 tracking-wide">
                    Resources
                  </h4>
                  <div className="space-y-1.5">
                    {selectedNode.resources.slice(0, 3).map((r, i) => (
                      <a
                        key={i}
                        href={r.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm text-[rgb(var(--primary))] hover:underline truncate"
                      >
                        <svg className="w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                        {r.title}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex gap-2 pt-2 border-t border-[rgb(var(--border))]">
                {selectedNode.status === 'available' && (
                  <>
                    <button
                      onClick={() => handleQuiz(selectedNode)}
                      className="flex-1 px-4 py-2.5 bg-[rgb(var(--primary))] text-[rgb(var(--primary-foreground))] rounded-lg hover:opacity-90 transition-opacity text-sm font-medium"
                    >
                      Take Quiz
                    </button>
                    <button
                      onClick={() => handleDirectLight(selectedNode.id)}
                      className="flex-1 px-4 py-2.5 bg-[rgb(var(--lime-medium))] text-white rounded-lg hover:opacity-90 transition-opacity text-sm font-medium"
                    >
                      Mark Learned
                    </button>
                  </>
                )}
                {selectedNode.status === 'locked' && (
                  <div className="flex-1 text-center text-sm text-[rgb(var(--muted-foreground))] py-2.5">
                    Complete prerequisites first
                  </div>
                )}
                {selectedNode.status === 'learned' && (
                  <div className="flex-1 text-center text-sm text-[rgb(var(--lime-medium))] py-2.5 font-medium flex items-center justify-center gap-2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Already Learned
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Quiz Modal */}
      {quiz && (
        <Suspense fallback={
          <div className="fixed inset-0 bg-[rgb(var(--background))]/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-[rgb(var(--card))] rounded-2xl p-6 shadow-xl border border-[rgb(var(--border))]">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 border-2 border-[rgb(var(--lime-medium))]/30 border-t-[rgb(var(--lime-medium))] rounded-full animate-spin" />
                <span className="text-[rgb(var(--foreground))]">Loading...</span>
              </div>
            </div>
          </div>
        }>
          <QuizModal
            quiz={quiz}
            onClose={() => setQuiz(null)}
            onPass={handleQuizPass}
          />
        </Suspense>
      )}
    </div>
  )
}
