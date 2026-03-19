'use client'

import { useState, useCallback, useEffect, lazy, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  MarkerType,
  BackgroundVariant,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { useStore } from '@/store'
import SkillNodeComponent from '@/components/SkillNode'
import NodeDetail from '@/components/NodeDetail'
import ThemeToggle from '@/components/ThemeToggle'
import { generateQuiz } from '@/lib/api'
import type { SkillNodeData, SkillTree, Quiz } from '@/types'

// Lazy load QuizModal for performance
const QuizModal = lazy(() => import('@/components/QuizModal'))

const nodeTypes = { skill: SkillNodeComponent }

export default function TreeView({ treeId }: { treeId: string }) {
  const router = useRouter()
  const { trees, updateNodeStatus } = useStore()
  const tree = trees[treeId] as SkillTree | undefined

  const [nodes, setNodes, onNodesChange] = useNodesState([] as Node[])
  const [edges, setEdges, onEdgesChange] = useEdgesState([] as Edge[])
  const [selectedNode, setSelectedNode] = useState<SkillNodeData | null>(null)
  const [quiz, setQuiz] = useState<Quiz | null>(null)
  const [quizLoading, setQuizLoading] = useState(false)

  // Sync tree changes to nodes
  useEffect(() => {
    if (tree) {
      const flowNodes = tree.nodes.map((n): Node => ({
        id: n.id,
        type: 'skill',
        position: { x: n.x || 0, y: n.y || 0 },
        data: n as unknown as Record<string, unknown>,
      }))

      const flowEdges: Edge[] = []
      tree.nodes.forEach((n) => {
        n.children?.forEach((childId) => {
          flowEdges.push({
            id: `${n.id}-${childId}`,
            source: n.id,
            target: childId,
            type: 'smoothstep',
            animated: false,
            style: { stroke: 'rgb(var(--muted-foreground))', strokeWidth: 2, opacity: 0.5 },
            markerEnd: { type: MarkerType.ArrowClosed, color: 'rgb(var(--muted-foreground))' },
          })
        })
      })

      setNodes(flowNodes)
      setEdges(flowEdges)
    }
  }, [tree, setNodes, setEdges])

  const onNodeClick = useCallback((_: any, node: Node) => {
    const data = node.data as unknown as SkillNodeData
    setSelectedNode(data)
  }, [])

  const handleDirectLight = useCallback((nodeId: string) => {
    updateNodeStatus(treeId, nodeId, 'learned')
    setNodes((nds) =>
      nds.map((n) =>
        n.id === nodeId ? { ...n, data: { ...n.data, status: 'learned' as const } } : n
      )
    )
    setSelectedNode((prev) => prev?.id === nodeId ? { ...prev, status: 'learned' } : prev)
    unlockChildren(nodeId)
  }, [treeId, updateNodeStatus, setNodes])

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
        setNodes((nds) =>
          nds.map((n) =>
            n.id === child.id ? { ...n, data: { ...n.data, status: 'available' as const } } : n
          )
        )
      }
    })
  }, [tree, treeId, updateNodeStatus, setNodes])

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
    <div className="flex h-full bg-[rgb(var(--background))]">
      {/* Main flow area */}
      <div className="flex-1 relative">
        {/* Header bar */}
        <div className="absolute top-4 left-4 right-4 z-10 flex items-center justify-between">
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
          <div className="absolute inset-0 bg-[rgb(var(--background))]/60 flex items-center justify-center z-20 backdrop-blur-sm">
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

        {/* React Flow */}
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={onNodeClick}
          nodeTypes={nodeTypes}
          fitView
          className="bg-[rgb(var(--background))]"
        >
          <Background
            variant={BackgroundVariant.Dots}
            gap={24}
            size={1}
            color="rgb(var(--border))"
            className="opacity-50"
          />
          <Controls className="bg-[rgb(var(--card))] border border-[rgb(var(--border))] rounded-lg shadow-lg [&>button]:bg-[rgb(var(--card))] [&>button]:border-b-[rgb(var(--border))] [&>button]:text-[rgb(var(--foreground))] [&>button:hover]:bg-[rgb(var(--secondary))]" />
          <MiniMap
            className="bg-[rgb(var(--card))] border border-[rgb(var(--border))] rounded-lg"
            nodeColor={(node) => {
              const data = node.data as unknown as SkillNodeData
              if (data.status === 'learned') return 'rgb(var(--lime-medium))'
              if (data.status === 'available') return 'rgb(var(--lime-bright))'
              return 'rgb(var(--muted))'
            }}
            maskColor="rgb(var(--background))"
          />
        </ReactFlow>

        {/* Decorative ink wash mountains background */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
          <img
            src="/ink-wash-mountains.svg"
            alt=""
            loading="lazy"
            className="w-full h-full object-cover opacity-20 dark:opacity-10"
          />
        </div>
      </div>

      {/* Node Detail Panel */}
      <NodeDetail
        node={selectedNode}
        onLearn={handleQuiz}
        onQuiz={handleQuiz}
        onDirectLight={handleDirectLight}
      />

      {/* Quiz Modal - lazy loaded */}
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
