'use client'

import { useState, useCallback, useEffect } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
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
import { generateQuiz } from '@/lib/api'
import type { SkillNodeData, Quiz, SkillTree } from '@/types'

const nodeTypes = { skill: SkillNodeComponent }

export default function TreeView({ treeId }: { treeId: string }) {
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
            style: { stroke: '#94a3b8', strokeWidth: 2 },
            markerEnd: { type: MarkerType.ArrowClosed, color: '#94a3b8' },
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
    // Update local nodes state
    setNodes((nds) =>
      nds.map((n) =>
        n.id === nodeId ? { ...n, data: { ...n.data, status: 'learned' as const } } : n
      )
    )
    // Update selected node
    setSelectedNode((prev) => prev?.id === nodeId ? { ...prev, status: 'learned' } : prev)
    // Check if children can now be unlocked
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
    return <div className="flex items-center justify-center h-full text-gray-400">树不存在</div>
  }

  const learnedCount = tree.nodes.filter((n) => n.status === 'learned').length
  const totalCount = tree.nodes.length

  return (
    <div className="flex h-full">
      {/* Main flow area */}
      <div className="flex-1 relative">
        {/* Header bar */}
        <div className="absolute top-4 left-4 right-4 z-10 flex items-center justify-between">
          <div className="bg-white px-4 py-2 rounded-xl shadow-md">
            <h1 className="font-bold text-gray-800">{tree.topic}</h1>
            <p className="text-sm text-gray-500">
              学习进度：{learnedCount}/{totalCount}
              <span className="ml-2 text-blue-500">{Math.round((learnedCount / totalCount) * 100)}%</span>
            </p>
          </div>
        </div>

        {/* React Flow */}
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={onNodeClick}
          nodeTypes={nodeTypes}
          fitView
          className="bg-gray-50"
        >
          <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#cbd5e1" />
          <Controls className="bg-white shadow-md rounded-lg" />
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
