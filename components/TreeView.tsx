'use client'

import { useState, useCallback, useEffect } from 'react'
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
import QuizModal from '@/components/QuizModal'
import ThemeToggle from '@/components/ThemeToggle'
import { generateQuiz } from '@/lib/api'
import type { SkillNodeData, Quiz, SkillTree } from '@/types'

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
            style: { stroke: 'rgb(var(--muted-foreground))', strokeWidth: 2 },
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
      <div className="flex items-center justify-center h-full">
        <div className="text-center animate-fade-in">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 flex items-center justify-center">
            <span className="text-3xl">🌳</span>
          </div>
          <h3 className="text-lg font-semibold text-stone-700 dark:text-stone-300 mb-2">Skill tree not found</h3>
          <button
            onClick={() => router.push('/')}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
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
                <svg className="w-5 h-5 text-stone-600 dark:text-stone-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div>
                <h1 className="font-bold text-stone-800 dark:text-stone-100">{tree.topic}</h1>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex-1 h-1.5 w-32 bg-stone-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        percent === 100
                          ? 'bg-gradient-to-r from-green-400 to-emerald-500'
                          : 'bg-gradient-to-r from-blue-500 to-purple-500'
                      }`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-blue-500">
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
          <div className="absolute inset-0 bg-black/30 flex items-center justify-center z-20">
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-xl animate-fade-in">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 border-3 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
                <span className="text-stone-700 dark:text-stone-200">Generating Quiz...</span>
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
            gap={20}
            size={1}
            color="rgb(var(--border))"
            className="dark:opacity-50"
          />
          <Controls className="bg-[rgb(var(--card))] border border-[rgb(var(--border))] rounded-lg shadow-lg" />
          <MiniMap
            className="bg-[rgb(var(--card))] border border-[rgb(var(--border))] rounded-lg"
            nodeColor={(node) => {
              const data = node.data as unknown as SkillNodeData
              if (data.status === 'learned') return '#10b981'
              if (data.status === 'available') return '#3b82f6'
              return '#94a3b8'
            }}
            maskColor="rgb(var(--background))"
          />
        </ReactFlow>
      </div>

      {/* Node Detail Panel */}
      <NodeDetail
        node={selectedNode}
        onLearn={handleQuiz}
        onQuiz={handleQuiz}
        onDirectLight={handleDirectLight}
      />

      {/* Quiz Modal */}
      {quiz && (
        <QuizModal
          quiz={quiz}
          onClose={() => setQuiz(null)}
          onPass={handleQuizPass}
        />
      )}
    </div>
  )
}
