'use client'

import { useState, useCallback, useEffect, useRef, useMemo, lazy, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { useStore } from '@/store'
import SkillNodeCard from '@/components/SkillNodeCard'
import SkillListSidebar from '@/components/SkillListSidebar'
import TreeBranch from '@/components/TreeBranch'
import BackgroundEvolution from '@/components/BackgroundEvolution'
import ThemeToggle from '@/components/ThemeToggle'
import { generateQuiz } from '@/lib/api'
import type { SkillNodeData, SkillTree, Quiz } from '@/types'

const QuizModal = lazy(() => import('@/components/QuizModal'))

export default function TreeView({ treeId }: { treeId: string }) {
  const router = useRouter()
  const { trees, updateNodeStatus } = useStore()
  const tree = trees[treeId] as SkillTree | undefined
  const containerRef = useRef<HTMLDivElement>(null)

  const [selectedNode, setSelectedNode] = useState<SkillNodeData | null>(null)
  const [quiz, setQuiz] = useState<Quiz | null>(null)
  const [quizLoading, setQuizLoading] = useState(false)
  const [growthAnimation, setGrowthAnimation] = useState<Record<string, boolean>>({})

  // Calculate layout - tree grows from bottom to top
  const layout = useMemo(() => {
    if (!tree) return { nodes: [], branches: [] }

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
    const levelHeight = 180 // Vertical spacing between levels
    const baseY = 700 // Bottom position
    const nodeWidth = 160

    // Position nodes
    const positionedNodes = tree.nodes.map(node => {
      const level = levelMap.get(node.id) || 0
      const nodesAtLevel = nodesByLevel[level] || []
      const indexAtLevel = nodesAtLevel.indexOf(node)
      const totalAtLevel = nodesAtLevel.length

      // Center nodes at each level with offset for tree shape
      const levelWidth = totalAtLevel * nodeWidth
      const startX = (800 - levelWidth) / 2 + nodeWidth / 2

      return {
        node,
        x: startX + indexAtLevel * nodeWidth,
        y: baseY - level * levelHeight,
        level,
      }
    })

    // Create branches (edges between parent and children)
    const branches = tree.nodes.flatMap(node =>
      (node.children || []).map(childId => {
        const parent = positionedNodes.find(p => p.node.id === node.id)
        const child = positionedNodes.find(p => p.node.id === childId)
        if (!parent || !child) return null

        // Determine branch thickness based on level
        const branchLevel = Math.min(parent.level, maxLevel)

        return {
          startX: parent.x,
          startY: parent.y + 40, // Bottom of parent node
          endX: child.x,
          endY: child.y - 40, // Top of child node
          level: branchLevel,
          isLearned: parent.node.status === 'learned',
          key: `${node.id}-${childId}`,
        }
      }).filter(Boolean)
    ).filter(Boolean) as {
      startX: number
      startY: number
      endX: number
      endY: number
      level: number
      isLearned: boolean
      key: string
    }[]

    return { nodes: positionedNodes, branches }
  }, [tree])

  // Trigger growth animation on mount - bottom to top
  useEffect(() => {
    if (tree && layout.nodes.length > 0) {
      // Sort by level (bottom = higher level number in this layout)
      // Higher Y = lower on screen = should animate first
      const sortedIndices = layout.nodes
        .map((_, i) => i)
        .sort((a, b) => layout.nodes[b].y - layout.nodes[a].y) // Higher Y first (bottom nodes)

      sortedIndices.forEach((nodeIndex, sortedOrder) => {
        setTimeout(() => {
          setGrowthAnimation(prev => ({ ...prev, [nodeIndex]: true }))
        }, sortedOrder * 150) // 150ms delay between each level
      })
    }
  }, [tree, layout.nodes.length])

  const onNodeSelect = useCallback((node: SkillNodeData) => {
    setSelectedNode(node)
  }, [])

  const handleDirectLight = useCallback((nodeId: string) => {
    updateNodeStatus(treeId, nodeId, 'learned')
    setGrowthAnimation(prev => ({ ...prev, [nodeId]: true }))
    setSelectedNode(prev => prev?.id === nodeId ? { ...prev, status: 'learned' } : prev)
    unlockChildren(nodeId)
  }, [treeId, updateNodeStatus])

  const unlockChildren = useCallback((completedNodeId: string) => {
    if (!tree) return
    const children = tree.nodes.filter((n) => n.prerequisites.includes(completedNodeId))
    children.forEach((child) => {
      const allPrereqsMet = child.prerequisites.every((prereqId) => {
        const prereq = tree.nodes.find((n) => n.id === prereqId)
        return prereq?.status === 'learned'
      })
      if (allPrereqsMet && child.status === 'locked') {
        updateNodeStatus(treeId, child.id, 'available')
      }
    })
  }, [tree, treeId, updateNodeStatus])

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

  if (!tree) {
    return (
      <div className="flex items-center justify-center h-full bg-rice-paper">
        <div className="text-center animate-ink-spread">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl lime-tablet border-2 border-[rgb(var(--lime-bright))] flex items-center justify-center">
            <span className="text-3xl">🌳</span>
          </div>
          <h3
            className="text-lg font-semibold text-[rgb(var(--foreground))] mb-2"
            style={{ fontFamily: "'Noto Serif', Georgia, serif" }}
          >
            Skill Tree Not Found
          </h3>
          <button
            onClick={() => router.push('/')}
            className="px-4 py-2 bg-[rgb(var(--primary))] text-[rgb(var(--primary-foreground))] rounded-lg hover:bg-[rgb(var(--primary))]/90 transition-colors border border-[rgb(var(--border))]"
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
        {/* Header bar */}
        <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between">
          <div className="glass rounded-2xl shadow-lg border border-[rgb(var(--border))] p-4 animate-fade-in">
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push('/')}
                className="p-2 rounded-lg hover:bg-[rgb(var(--secondary))] transition-colors btn-press"
              >
                <svg className="w-5 h-5 text-[rgb(var(--foreground))]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div>
                <h1
                  className="font-bold text-[rgb(var(--foreground))]"
                  style={{ fontFamily: "'Noto Serif', Georgia, serif" }}
                >
                  {tree.topic}
                </h1>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex-1 h-1.5 w-32 bg-[rgb(var(--secondary))] rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        percent === 100
                          ? 'bg-gradient-to-r from-[rgb(var(--lime-medium))] to-[rgb(var(--lime-bright))]'
                          : 'bg-gradient-to-r from-[rgb(var(--lime-medium))] to-[rgb(var(--accent))]'
                      }`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-[rgb(var(--lime-medium))]">
                    {learnedCount}/{totalCount} ({percent}%)
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
          </div>
        </div>

        {/* Quiz loading overlay */}
        {quizLoading && (
          <div className="absolute inset-0 bg-[rgb(var(--background))]/60 flex items-center justify-center z-30 backdrop-blur-sm">
            <div className="bg-[rgb(var(--card))] rounded-2xl p-6 shadow-xl border border-[rgb(var(--border))] animate-ink-spread">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 border-2 border-[rgb(var(--lime-medium))]/30 border-t-[rgb(var(--lime-medium))] rounded-full animate-spin" />
                <span
                  className="text-[rgb(var(--foreground))]"
                  style={{ fontFamily: "'Noto Serif', Georgia, serif" }}
                >
                  Generating Quiz...
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Evolving Background */}
        <BackgroundEvolution progress={percent} containerRef={containerRef} />

        {/* Tree SVG Canvas (branches) */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none z-10"
          viewBox="0 0 800 800"
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
              isAnimating={branch.isLearned && growthAnimation[branch.key]}
            />
          ))}
        </svg>

        {/* Tree Nodes Container */}
        <div className="absolute inset-0 z-20 overflow-auto">
          <div
            className="relative min-h-full"
            style={{
              width: '800px',
              height: '800px',
              margin: '0 auto',
            }}
          >
            {layout.nodes.map(({ node, x, y }, index) => {
              // Calculate sorted order for proper bottom-to-top animation delay
              const sortedIndices = layout.nodes
                .map((_, i) => i)
                .sort((a, b) => layout.nodes[b].y - layout.nodes[a].y)
              const sortedOrder = sortedIndices.indexOf(index)

              return (
                <div
                  key={node.id}
                  className={`absolute transition-all duration-700 ease-out ${
                    growthAnimation[index] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-16'
                  }`}
                  style={{
                    left: `${x - 80}px`,
                    top: `${y - 30}px`,
                    transitionDelay: `${sortedOrder * 100}ms`,
                  }}
                  onClick={() => onNodeSelect(node)}
                >
                <SkillNodeCard
                  data={node}
                  selected={selectedNode?.id === node.id}
                />
              </div>
            )
            })}
          </div>
        </div>

        {/* Node Detail Panel */}
        {selectedNode && (
          <div className="absolute right-4 top-24 w-80 z-30 animate-slide-in-right">
            <div className="glass rounded-2xl shadow-xl border border-[rgb(var(--border))] p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3
                    className="font-semibold text-lg text-[rgb(var(--foreground))]"
                    style={{ fontFamily: "'Noto Serif', Georgia, serif" }}
                  >
                    {selectedNode.name}
                  </h3>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    selectedNode.level === 'Beginner' ? 'bg-[rgb(var(--lime-bright-bg))] text-[rgb(var(--lime-bright))]' :
                    selectedNode.level === 'Intermediate' ? 'bg-[rgb(var(--lime-medium-bg))] text-[rgb(var(--lime-medium))]' :
                    'bg-[rgb(var(--lime-dark-bg))] text-[rgb(var(--lime-dark))]'
                  }`}>
                    {selectedNode.level}
                  </span>
                </div>
                <button
                  onClick={() => setSelectedNode(null)}
                  className="p-1 rounded hover:bg-[rgb(var(--secondary))] transition-colors"
                >
                  <svg className="w-4 h-4 text-[rgb(var(--muted-foreground))]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <p className="text-sm text-[rgb(var(--muted-foreground))] mb-4">
                {selectedNode.description}
              </p>

              {selectedNode.resources.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-xs font-semibold text-[rgb(var(--muted-foreground))] uppercase mb-2">
                    Resources
                  </h4>
                  <div className="space-y-1">
                    {selectedNode.resources.slice(0, 3).map((r, i) => (
                      <a
                        key={i}
                        href={r.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block text-sm text-[rgb(var(--lime-medium))] hover:underline truncate"
                      >
                        {r.title}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                {selectedNode.status === 'available' && (
                  <>
                    <button
                      onClick={() => handleQuiz(selectedNode)}
                      className="flex-1 px-4 py-2 bg-[rgb(var(--primary))] text-[rgb(var(--primary-foreground))] rounded-lg hover:bg-[rgb(var(--primary))]/90 transition-colors text-sm font-medium"
                    >
                      Take Quiz
                    </button>
                    <button
                      onClick={() => handleDirectLight(selectedNode.id)}
                      className="flex-1 px-4 py-2 bg-[rgb(var(--lime-medium))] text-white rounded-lg hover:bg-[rgb(var(--lime-medium))]/90 transition-colors text-sm font-medium"
                    >
                      Mark Learned
                    </button>
                  </>
                )}
                {selectedNode.status === 'locked' && (
                  <div className="flex-1 text-center text-sm text-[rgb(var(--muted-foreground))] py-2">
                    Complete prerequisites first
                  </div>
                )}
                {selectedNode.status === 'learned' && (
                  <div className="flex-1 text-center text-sm text-[rgb(var(--lime-medium))] py-2 font-medium">
                    ✓ Already Learned
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
