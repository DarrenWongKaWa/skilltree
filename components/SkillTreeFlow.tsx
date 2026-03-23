'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  useReactFlow,
  ReactFlowProvider,
  type Node,
  type Edge,
  type NodeTypes,
  BackgroundVariant,
  SelectionMode,
  MarkerType,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'

import dagre from 'dagre'
import type { SkillTree, SkillNodeData } from '@/types'
import SkillNodeFlow from './SkillNodeFlow'
import SeedNode from './SeedNode'
import TreeEdge from './TreeEdge'

// Node dimensions for dagre layout
const NODE_WIDTH = 160
const NODE_HEIGHT = 100
const SEED_WIDTH = 100
const SEED_HEIGHT = 100

// Custom node types
const nodeTypes: NodeTypes = {
  skillNode: SkillNodeFlow,
  seedNode: SeedNode,
}

// Custom edge types
const edgeTypes = {
  treeEdge: TreeEdge,
}

interface SkillTreeFlowProps {
  tree: SkillTree
  collapsedNodes: Set<string>
  selectedNode: SkillNodeData | null
  onNodeSelect: (node: SkillNodeData) => void
  onCollapse: (nodeId: string) => void
}

// Generate a unique storage key based on tree ID
const getViewportKey = (treeId: string) => `skilltree_viewport_${treeId}`

// ============================================================
// PHASE 1: Perfect Pyramid Layout - Dagre Configuration
// ============================================================
const DAGRE_CONFIG = {
  rankdir: 'BT' as const,
  // REMOVED align property for automatic centering (symmetric tree)
  nodesep: 120,
  ranksep: 220, // Increased to give edges vertical space to route between ranks without crossing nodes
}

// ============================================================
// PHASE 2: Viewport Persistence Hook (debounced localStorage)
// ============================================================
function useViewportPersistence(treeId: string, onRestore: (vp: { x: number; y: number; zoom: number } | null) => void) {
  const { getViewport, setViewport, fitView } = useReactFlow()
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const hasRestoredRef = useRef(false)

  // Restore viewport on mount
  useEffect(() => {
    if (hasRestoredRef.current) return
    hasRestoredRef.current = true

    try {
      const stored = localStorage.getItem(getViewportKey(treeId))
      if (stored) {
        const viewport = JSON.parse(stored)
        if (viewport && typeof viewport.x === 'number' && typeof viewport.y === 'number' && typeof viewport.zoom === 'number') {
          onRestore(viewport)
        }
      }
    } catch (e) {
      console.warn('[Viewport] Failed to restore viewport:', e)
    }
  }, [treeId, onRestore])

  // Debounced save on viewport change
  const onViewportChange = useCallback((viewport: { x: number; y: number; zoom: number }) => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      try {
        localStorage.setItem(getViewportKey(treeId), JSON.stringify(viewport))
      } catch (e) {
        console.warn('[Viewport] Failed to save viewport:', e)
      }
    }, 500)
  }, [treeId])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [])

  return { onViewportChange }
}

// ============================================================
// PHASE 3: Recursive Descendant Finder (BFS)
// ============================================================
function getAllDescendants(nodeId: string, childMap: Record<string, string[]>): Set<string> {
  const descendants = new Set<string>()
  const queue: string[] = [...(childMap[nodeId] || [])]

  while (queue.length > 0) {
    const current = queue.shift()!
    if (!descendants.has(current)) {
      descendants.add(current)
      queue.push(...(childMap[current] || []))
    }
  }

  return descendants
}

// ============================================================
// PHASE 3: Transform Tree to Flow Data (with hidden edges support)
// ============================================================
function transformTreeToFlowData(
  tree: SkillTree,
  collapsedNodes: Set<string>,
  onCollapse: (nodeId: string) => void
): {
  nodes: Node[]
  edges: Edge[]
} {
  // Build child map for hierarchy
  const childMap: Record<string, string[]> = {}
  tree.nodes.forEach(n => { childMap[n.id] = n.children || [] })

  // Determine which nodes are hidden due to collapsed parents
  const hiddenNodes = new Set<string>()
  const hiddenEdges = new Set<string>()
  collapsedNodes.forEach(collapsedId => {
    const descendants = getAllDescendants(collapsedId, childMap)
    descendants.forEach(id => {
      hiddenNodes.add(id)
      // Mark all edges connected to hidden nodes as hidden
      const node = tree.nodes.find(n => n.id === id)
      if (node) {
        node.prerequisites.forEach(prereqId => {
          if (!collapsedNodes.has(prereqId)) { // Only hide if parent is not collapsed
            hiddenEdges.add(`${prereqId}-${id}`)
          }
        })
        childMap[id]?.forEach(childId => {
          if (!collapsedNodes.has(id)) {
            hiddenEdges.add(`${id}-${childId}`)
          }
        })
      }
    })
  })

  // Find first-level nodes (nodes with no prerequisites)
  const firstLevelNodes = tree.nodes.filter(n => n.prerequisites.length === 0)

  // Create seed node
  const seedNode: Node = {
    id: 'seed-root',
    type: 'seedNode',
    position: { x: 0, y: 0 },
    data: { topic: tree.topic } as Record<string, unknown>,
  }

  // Filter visible skill nodes
  const visibleSkillNodes = tree.nodes.filter(n => !hiddenNodes.has(n.id))
  const allNodeIds = new Set(tree.nodes.map(n => n.id))

  // Build edges
  const edges: Edge[] = []

  // Seed to first-level edges
  firstLevelNodes.forEach(firstLevelNode => {
    if (!hiddenNodes.has(firstLevelNode.id)) {
      edges.push({
        id: `seed-root-${firstLevelNode.id}`,
        source: 'seed-root',
        target: firstLevelNode.id,
        type: 'treeEdge',
        style: { stroke: 'rgb(var(--lime-bright))', strokeWidth: 3 },
        markerEnd: { type: MarkerType.ArrowClosed, color: 'rgb(var(--lime-dark))' },
      })
    }
  })

  // Prerequisite edges
  visibleSkillNodes.forEach(node => {
    node.prerequisites.forEach(prereqId => {
      if (allNodeIds.has(prereqId) && !hiddenNodes.has(prereqId)) {
        const sourceNode = tree.nodes.find(n => n.id === prereqId)
        edges.push({
          id: `${prereqId}-${node.id}`,
          source: prereqId,
          target: node.id,
          type: 'treeEdge',
          data: { isLearned: sourceNode?.status === 'learned' },
          style: {
            stroke: sourceNode?.status === 'learned' ? 'rgb(var(--lime-bright))' : 'rgb(var(--lime-medium))',
            strokeWidth: sourceNode?.status === 'learned' ? 3 : 2,
          },
        })
      }
    })
  })

  // Apply dagre layout
  const { nodes: layoutedNodes } = getDagreLayout(visibleSkillNodes, edges, seedNode, firstLevelNodes)

  // Apply hidden state and collapse callback to nodes
  const nodesWithHidden = layoutedNodes.map(node => {
    const originalNode = tree.nodes.find(n => n.id === node.id)
    return {
      ...node,
      hidden: hiddenNodes.has(node.id),
      data: {
        ...node.data,
        isCollapsed: collapsedNodes.has(node.id),
        onCollapse: (originalNode?.children?.length ?? 0) > 0 ? onCollapse : undefined,
      },
    }
  })

  // Apply hidden state to edges
  const edgesWithHidden = edges.map(edge => ({
    ...edge,
    hidden: hiddenEdges.has(edge.id),
  }))

  return { nodes: nodesWithHidden, edges: edgesWithHidden }
}

// ============================================================
// PHASE 1: Perfect Pyramid Dagre Layout (symmetric centering)
// ============================================================
function getDagreLayout(
  nodes: SkillNodeData[],
  edges: Edge[],
  seedNode: Node,
  firstLevelNodes: SkillNodeData[]
): { nodes: Node[], edges: Edge[] } {
  const dagreGraph = new dagre.graphlib.Graph()
  dagreGraph.setDefaultEdgeLabel(() => ({}))

  // PHASE 1: Perfect Pyramid config - no align = auto-center
  dagreGraph.setGraph({
    ...DAGRE_CONFIG,
  })

  // Add all skill nodes
  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: NODE_WIDTH, height: NODE_HEIGHT })
  })

  // Add seed node
  dagreGraph.setNode('seed-root', { width: SEED_WIDTH, height: SEED_HEIGHT })

  // Strictly filter and set edges
  const validEdges: Edge[] = []
  edges.forEach((edge) => {
    if (dagreGraph.hasNode(edge.source) && dagreGraph.hasNode(edge.target)) {
      dagreGraph.setEdge(edge.source, edge.target)
      validEdges.push(edge)
    }
  })

  // Execute layout
  dagre.layout(dagreGraph)

  // Map positions to skill nodes
  const layoutedNodes: Node[] = nodes
    .map((node) => {
      const nodeWithPosition = dagreGraph.node(node.id)
      if (!nodeWithPosition) return null

      return {
        id: node.id,
        type: 'skillNode' as const,
        targetPosition: 'bottom' as const,
        sourcePosition: 'top' as const,
        position: {
          x: nodeWithPosition.x - NODE_WIDTH / 2,
          y: nodeWithPosition.y - NODE_HEIGHT / 2,
        },
        data: node as unknown as Record<string, unknown>,
      } as Node
    })
    .filter((n): n is Node => n !== null)

  // PHASE 1: Post-process centering - calculate exact midpoint of first-level nodes
  let seedPosition = { x: 0, y: 0 }
  if (firstLevelNodes.length > 0) {
    const firstLevelPositions = firstLevelNodes
      .map(n => dagreGraph.node(n.id))
      .filter(Boolean)
      .map(pos => ({ x: pos!.x, y: pos!.y }))

    if (firstLevelPositions.length > 0) {
      // Exact midpoint calculation for perfect symmetry
      const minX = Math.min(...firstLevelPositions.map(p => p.x))
      const maxX = Math.max(...firstLevelPositions.map(p => p.x))
      const avgX = (minX + maxX) / 2
      const maxY = Math.max(...firstLevelPositions.map(p => p.y))

      seedPosition = {
        x: avgX - SEED_WIDTH / 2,
        y: maxY + 180, // Place seed well below first-level
      }
    }
  }

  // Add seed node with perfectly centered position
  layoutedNodes.push({
    ...seedNode,
    position: {
      x: seedPosition.x - SEED_WIDTH / 2,
      y: seedPosition.y - SEED_HEIGHT / 2,
    },
  })

  return { nodes: layoutedNodes, edges: validEdges }
}

// ============================================================
// Main SkillTreeFlow Component
// ============================================================
function SkillTreeFlowInner({
  tree,
  collapsedNodes,
  selectedNode,
  onNodeSelect,
  onCollapse,
}: SkillTreeFlowProps) {
  const { fitView, setViewport } = useReactFlow()
  const hasFitViewRef = useRef(false)
  const [restoredViewport, setRestoredViewport] = useState<{ x: number; y: number; zoom: number } | null>(null)

  const { onViewportChange } = useViewportPersistence(tree.id, setRestoredViewport)

  // Handle collapse toggle - recursive hiding of descendants
  const handleNodeCollapse = useCallback(
    (nodeId: string) => {
      onCollapse(nodeId)
    },
    [onCollapse]
  )

  // Transform tree data
  const { nodes: flowNodes, edges: flowEdges } = useMemo(() => {
    return transformTreeToFlowData(tree, collapsedNodes, handleNodeCollapse)
  }, [tree, collapsedNodes, handleNodeCollapse])

  const [nodes, setNodes, onNodesChange] = useNodesState(flowNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(flowEdges)

  // Update flow state when data changes
  useEffect(() => {
    setNodes(flowNodes)
    setEdges(flowEdges)
    hasFitViewRef.current = false
  }, [flowNodes, flowEdges, setNodes, setEdges])

  // Restore viewport or fit view on initial load
  useEffect(() => {
    if (!hasFitViewRef.current && nodes.length > 0) {
      const timer = setTimeout(() => {
        if (restoredViewport) {
          // PHASE 2: Apply restored viewport
          setViewport(restoredViewport, { duration: 0 })
        } else {
          // PHASE 2: Fallback centering
          fitView({ padding: 0.2, duration: 800 })
        }
        hasFitViewRef.current = true
      }, 150)
      return () => clearTimeout(timer)
    }
  }, [nodes, fitView, setViewport, restoredViewport])

  const handleNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      const nodeData = node.data as unknown as SkillNodeData & { isCollapsed?: boolean }
      onNodeSelect(nodeData)
    },
    [onNodeSelect]
  )

  const handlePaneClick = useCallback(() => {
    onNodeSelect(null as any)
  }, [onNodeSelect])

  // Memoize minimap node color to prevent re-renders during drag
  const getMiniMapNodeColor = useCallback((node: Node) => {
    const data = node.data as unknown as SkillNodeData
    if (!data?.status) return 'rgb(var(--muted))'
    switch (data.status) {
      case 'learned': return 'rgb(var(--lime-medium))'
      case 'available': return 'rgb(var(--lime-bright))'
      case 'locked': return 'rgb(var(--muted))'
      default: return 'rgb(var(--muted))'
    }
  }, [])

  return (
    <div className="w-full h-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={handleNodeClick}
        onPaneClick={handlePaneClick}
        onMoveEnd={(_, viewport) => onViewportChange(viewport)}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        selectionMode={SelectionMode.Partial}
        minZoom={0.15}
        maxZoom={2.5}
        defaultEdgeOptions={{
          type: 'treeEdge',
          style: { stroke: 'rgb(var(--lime-medium))', strokeWidth: 2 },
          markerEnd: { type: MarkerType.ArrowClosed, color: 'rgb(var(--lime-dark))' },
        }}
        panOnDrag
        selectNodesOnDrag={false}
        nodesFocusable={false}
        edgesFocusable={false}
        proOptions={{ hideAttribution: true }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={20}
          size={1}
          color="rgb(var(--lime-dark))"
          className="opacity-30"
        />
        <Controls
          showZoom
          showFitView
          showInteractive={false}
          className="!bg-[rgb(var(--card))] !border-[rgb(var(--border))] !shadow-lg"
        />
        <MiniMap
          nodeColor={getMiniMapNodeColor}
          maskColor="rgb(var(--background))"
          className="!bg-[rgb(var(--card))] !border-[rgb(var(--border))]"
        />
      </ReactFlow>
    </div>
  )
}

export default function SkillTreeFlow(props: SkillTreeFlowProps) {
  return (
    <ReactFlowProvider>
      <SkillTreeFlowInner {...props} />
    </ReactFlowProvider>
  )
}