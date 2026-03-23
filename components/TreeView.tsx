'use client'

import { useState, useCallback, useEffect, useRef, lazy, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { useStore } from '@/store'
import SkillListSidebar from '@/components/SkillListSidebar'
import SkillTreeFlow from '@/components/SkillTreeFlow'
import { ReactFlowProvider } from '@xyflow/react'
import BackgroundEvolution from '@/components/BackgroundEvolution'
import ThemeToggle from '@/components/ThemeToggle'
import { generateQuiz } from '@/lib/api'
import type { SkillNodeData, SkillTree, Quiz } from '@/types'

const QuizModal = lazy(() => import('@/components/QuizModal'))

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
  const [pan, setPan] = useState({ x: 0, y: 0 })

  // Trigger growth animation on mount
  useEffect(() => {
    if (tree && tree.nodes.length > 0) {
      // Stagger animations for bottom-to-top reveal
      tree.nodes.forEach((node, index) => {
        setTimeout(() => {
          setGrowthAnimation(prev => ({ ...prev, [node.id]: true }))
        }, index * 100)
      })
    }
  }, [tree?.id])

  const onNodeSelect = useCallback((node: SkillNodeData | null) => {
    // 1. Guard clause: if node is null, clear the selection and exit early
    if (!node) {
      setSelectedNode(null);
      return;
    }

    // 2. Safe to check node.id now
    setSelectedNode(prev => prev?.id === node.id ? null : node);
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

  const handleUnmark = useCallback((nodeId: string) => {
    updateNodeStatus(treeId, nodeId, 'available')
    setSelectedNode(prev => prev?.id === nodeId ? { ...prev, status: 'available' } : prev)

    // When unmarking, recalculate child statuses - they may need to be locked again
    const freshTree = getTree(treeId)
    if (freshTree) {
      const children = freshTree.nodes.filter((n) => n.prerequisites.includes(nodeId))
      children.forEach((child) => {
        // Check if all prerequisites are still learned
        const allPrereqsMet = child.prerequisites.every((prereqId) => {
          const prereq = freshTree.nodes.find((n) => n.id === prereqId)
          return prereq?.status === 'learned'
        })
        if (!allPrereqsMet && child.status === 'learned') {
          // Child should become available if it has other learned prereqs, or locked if none
          const hasOtherLearnedPrereq = child.prerequisites.some((prereqId) => {
            if (prereqId === nodeId) return false
            const prereq = freshTree.nodes.find((n) => n.id === prereqId)
            return prereq?.status === 'learned'
          })
          updateNodeStatus(treeId, child.id, hasOtherLearnedPrereq ? 'available' : 'locked')
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
          {/* Left: Title card */}
          <div className="glass rounded-2xl shadow-lg border border-[rgb(var(--border))] p-3">
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

          {/* Right: Theme toggle */}
          <ThemeToggle />
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

        {/* Tree Canvas with ReactFlow */}
        <ReactFlowProvider>
          <SkillTreeFlow
            tree={tree}
            collapsedNodes={collapsedNodes}
            selectedNode={selectedNode}
            onNodeSelect={onNodeSelect}
            onCollapse={handleCollapse}
          />
        </ReactFlowProvider>

        {/* Skill Detail Panel */}
        {selectedNode && (
          <div className="absolute right-4 top-28 w-80 z-30 animate-fade-in">
            <div className="glass rounded-2xl shadow-xl border border-[rgb(var(--border))] p-5">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  {/* Level indicator fruit */}
                  <div className={`w-10 h-10 rounded-full ${
                    selectedNode.level === 'Beginner' ? 'bg-gradient-to-br from-lime-400 to-green-500' :
                    selectedNode.level === 'Intermediate' ? 'bg-gradient-to-br from-amber-400 to-orange-500' :
                    'bg-gradient-to-br from-purple-400 to-pink-500'
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
                  <div className="flex gap-2 w-full">
                    <button
                      onClick={() => handleUnmark(selectedNode.id)}
                      className="flex-1 px-4 py-2.5 bg-[rgb(var(--secondary))] text-[rgb(var(--foreground))] rounded-lg hover:bg-[rgb(var(--secondary))]/80 transition-opacity text-sm font-medium border border-[rgb(var(--border))]"
                    >
                      Unmark
                    </button>
                    <div className="flex-1 flex items-center justify-center gap-2 text-sm text-[rgb(var(--lime-medium))] py-2.5 font-medium">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Learned
                    </div>
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