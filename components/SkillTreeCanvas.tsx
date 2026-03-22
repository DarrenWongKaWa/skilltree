'use client'

import { useState, useCallback, useMemo, useRef, useEffect } from 'react'
import type { SkillTree, SkillNodeData } from '@/types'
import TreeBranch from '@/components/TreeBranch'
import SkillNode from '@/components/SkillNode'
import { useStore } from '@/store'

interface PositionedNode {
  node: SkillNodeData
  x: number
  y: number
  level: number
}

interface Branch {
  startX: number
  startY: number
  endX: number
  endY: number
  level: number
  isLearned: boolean
  key: string
}

interface SkillTreeCanvasProps {
  tree: SkillTree
  collapsedNodes: Set<string>
  selectedNode: SkillNodeData | null
  growthAnimation: Record<string, boolean>
  zoom: number
  pan: { x: number; y: number }
  onNodeSelect: (node: SkillNodeData) => void
  onCollapse: (nodeId: string) => void
  onPanChange: (pan: { x: number; y: number }) => void
  onZoomChange: (zoom: number) => void
}

export default function SkillTreeCanvas({
  tree,
  collapsedNodes,
  selectedNode,
  growthAnimation,
  zoom,
  pan,
  onNodeSelect,
  onCollapse,
  onPanChange,
  onZoomChange,
}: SkillTreeCanvasProps) {
  // Use Zustand store for camera state (shared globally for branch rendering)
  const camera = useStore(state => state.camera)
  const updateCamera = useStore(state => state.updateCamera)
  const nodePositions = useStore(state => state.nodePositions)
  const initializeNodePositions = useStore(state => state.initializeNodePositions)

  const [isDraggingCanvas, setIsDraggingCanvas] = useState(false)
  const dragStart = useRef({ x: 0, y: 0 })
  const containerRef = useRef<HTMLDivElement>(null)

  // Initialize node positions from layout on first render
  useEffect(() => {
    if (!tree) return

    const childMap: Record<string, string[]> = {}
    tree.nodes.forEach(n => { childMap[n.id] = n.children || [] })

    const getAllDescendants = (nodeId: string): Set<string> => {
      const descendants = new Set<string>()
      const stack = [...(childMap[nodeId] || [])]
      while (stack.length > 0) {
        const childId = stack.pop()!
        if (!descendants.has(childId)) {
          descendants.add(childId)
          stack.push(...(childMap[childId] || []))
        }
      }
      return descendants
    }

    const hiddenNodes = new Set<string>()
    collapsedNodes.forEach(collapsedId => {
      getAllDescendants(collapsedId).forEach(id => hiddenNodes.add(id))
    })

    const rootNodes = tree.nodes.filter(n => n.prerequisites.length === 0)
    const levelMap = new Map<string, number>()
    const assignLevel = (nodeId: string, level: number) => {
      if (levelMap.has(nodeId)) return
      if (hiddenNodes.has(nodeId)) return
      levelMap.set(nodeId, level)
      const node = tree.nodes.find(n => n.id === nodeId)
      if (node) {
        (node.children || []).forEach(childId => {
          if (!hiddenNodes.has(childId)) {
            assignLevel(childId, level + 1)
          }
        })
      }
    }
    rootNodes.forEach(root => {
      if (!hiddenNodes.has(root.id)) assignLevel(root.id, 0)
    })
    tree.nodes.forEach(node => {
      if (!levelMap.has(node.id) && !hiddenNodes.has(node.id)) levelMap.set(node.id, 0)
    })

    const visibleNodes = tree.nodes.filter(n => !hiddenNodes.has(n.id))
    const nodesByLevel = visibleNodes.reduce((acc, node) => {
      const level = levelMap.get(node.id) || 0
      if (!acc[level]) acc[level] = []
      acc[level].push(node)
      return acc
    }, {} as Record<number, SkillNodeData[]>)

    const levelHeight = 150
    const baseY = 700
    const nodeWidth = 140

    const positions = visibleNodes.map(node => {
      const level = levelMap.get(node.id) || 0
      const nodesAtLevel = nodesByLevel[level] || []
      const indexAtLevel = nodesAtLevel.indexOf(node)
      const totalAtLevel = nodesAtLevel.length
      const levelWidth = totalAtLevel * nodeWidth
      const startX = (800 - levelWidth) / 2 + nodeWidth / 2

      return {
        id: node.id,
        x: startX + indexAtLevel * nodeWidth,
        y: baseY - level * levelHeight,
      }
    })

    initializeNodePositions(tree.id, positions)
  }, [tree, collapsedNodes, initializeNodePositions])

  // Get node positions (from store if dragged, otherwise from layout calculation)
  const layout = useMemo(() => {
    const rootNodes = tree.nodes.filter(n => n.prerequisites.length === 0)

    const childMap: Record<string, string[]> = {}
    tree.nodes.forEach(n => { childMap[n.id] = n.children || [] })

    const getAllDescendants = (nodeId: string): Set<string> => {
      const descendants = new Set<string>()
      const stack = [...(childMap[nodeId] || [])]
      while (stack.length > 0) {
        const childId = stack.pop()!
        if (!descendants.has(childId)) {
          descendants.add(childId)
          stack.push(...(childMap[childId] || []))
        }
      }
      return descendants
    }

    const hiddenNodes = new Set<string>()
    collapsedNodes.forEach(collapsedId => {
      getAllDescendants(collapsedId).forEach(id => hiddenNodes.add(id))
    })

    const levelMap = new Map<string, number>()
    const assignLevel = (nodeId: string, level: number) => {
      if (levelMap.has(nodeId)) return
      if (hiddenNodes.has(nodeId)) return
      levelMap.set(nodeId, level)
      const node = tree.nodes.find(n => n.id === nodeId)
      if (node) {
        (node.children || []).forEach(childId => {
          if (!hiddenNodes.has(childId)) {
            assignLevel(childId, level + 1)
          }
        })
      }
    }
    rootNodes.forEach(root => {
      if (!hiddenNodes.has(root.id)) assignLevel(root.id, 0)
    })
    tree.nodes.forEach(node => {
      if (!levelMap.has(node.id) && !hiddenNodes.has(node.id)) levelMap.set(node.id, 0)
    })

    const visibleNodes = tree.nodes.filter(n => !hiddenNodes.has(n.id))
    const nodesByLevel = visibleNodes.reduce((acc, node) => {
      const level = levelMap.get(node.id) || 0
      if (!acc[level]) acc[level] = []
      acc[level].push(node)
      return acc
    }, {} as Record<number, SkillNodeData[]>)

    const maxLevel = Math.max(...Array.from(levelMap.values()), 0)
    const levelHeight = 150
    const baseY = 700
    const nodeWidth = 140

    const positionedNodes: PositionedNode[] = visibleNodes.map(node => {
      const level = levelMap.get(node.id) || 0
      const nodesAtLevel = nodesByLevel[level] || []
      const indexAtLevel = nodesAtLevel.indexOf(node)
      const totalAtLevel = nodesAtLevel.length
      const levelWidth = totalAtLevel * nodeWidth
      const startX = (800 - levelWidth) / 2 + nodeWidth / 2

      // Use dragged position if available, otherwise use calculated position
      const draggedPos = nodePositions[node.id]
      return {
        node,
        x: draggedPos?.x ?? startX + indexAtLevel * nodeWidth,
        y: draggedPos?.y ?? baseY - level * levelHeight,
        level,
      }
    })

    const visibleNodeMap = new Set(visibleNodes.map(n => n.id))

    const branches: Branch[] = positionedNodes.flatMap(parent => {
      return (parent.node.children || [])
        .filter(childId => visibleNodeMap.has(childId))
        .map(childId => {
          const child = positionedNodes.find(p => p.node.id === childId)
          if (!child) return null
          return {
            startX: parent.x,
            startY: parent.y + 25,
            endX: child.x,
            endY: child.y - 25,
            level: Math.min(parent.level, maxLevel),
            isLearned: parent.node.status === 'learned',
            key: `${parent.node.id}-${childId}`,
          }
        }).filter(Boolean)
    }).filter(Boolean) as Branch[]

    return { nodes: positionedNodes, branches, maxY: baseY + 50 }
  }, [tree, collapsedNodes, nodePositions])

  const animationOrder = useMemo(() => {
    const sorted = [...layout.nodes].sort((a, b) => b.y - a.y)
    return new Map(sorted.map((n, i) => [n.node.id, i * 80]))
  }, [layout.nodes])

  // Canvas pan handlers (only when clicking on canvas background)
  const handleCanvasPointerDown = useCallback((e: React.PointerEvent) => {
    // Only pan if clicking on canvas background (id="canvas-bg")
    if ((e.target as HTMLElement).id !== 'canvas-bg') return
    if (e.button !== 0) return
    setIsDraggingCanvas(true)
    dragStart.current = { x: e.clientX - camera.x, y: e.clientY - camera.y }
  }, [camera.x, camera.y])

  const handleCanvasPointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDraggingCanvas) return
    updateCamera(e.clientX - dragStart.current.x, e.clientY - dragStart.current.y)
    onPanChange({ x: e.clientX - dragStart.current.x, y: e.clientY - dragStart.current.y })
  }, [isDraggingCanvas, updateCamera, onPanChange])

  const handleCanvasPointerUp = useCallback(() => {
    setIsDraggingCanvas(false)
  }, [])

  const handleCanvasPointerLeave = useCallback(() => {
    setIsDraggingCanvas(false)
  }, [])

  const zoomIn = () => {
    const newZoom = Math.min(zoom + 0.2, 2)
    onZoomChange(newZoom)
    useStore.getState().setZoom(newZoom)
  }
  const zoomOut = () => {
    const newZoom = Math.max(zoom - 0.2, 0.4)
    onZoomChange(newZoom)
    useStore.getState().setZoom(newZoom)
  }
  const resetView = () => {
    onZoomChange(1)
    onPanChange({ x: 0, y: 0 })
    useStore.getState().setZoom(1)
    useStore.getState().updateCamera(0, 0)
  }

  return (
    <>
      {/* Zoom Controls */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
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
          <div className="w-px h-5 bg-[rgb(var(--border))]" />
          <button
            onClick={resetView}
            className="p-2 rounded-lg hover:bg-[rgb(var(--secondary))] transition-colors"
            title="Reset view"
          >
            <svg className="w-4 h-4 text-[rgb(var(--foreground))]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
            </svg>
          </button>
        </div>
      </div>

      {/* Canvas viewport - pan by dragging background, nodes handle their own drag */}
      <div
        ref={containerRef}
        id="canvas-bg"
        className={`absolute inset-0 z-10 overflow-hidden ${isDraggingCanvas ? 'cursor-grabbing' : 'cursor-grab'}`}
        onPointerDown={handleCanvasPointerDown}
        onPointerMove={handleCanvasPointerMove}
        onPointerUp={handleCanvasPointerUp}
        onPointerLeave={handleCanvasPointerLeave}
      >
        {/* Viewport container - transform applied for pan + zoom */}
        <div
          className="relative transition-transform duration-300 ease-out"
          style={{
            width: '800px',
            height: `${layout.maxY + 60}px`,
            margin: '0 auto',
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: 'center 70%',
          }}
        >
          {/* Seed Root Node */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[rgb(var(--lime-dark))] to-[rgb(var(--lime-medium))] shadow-lg flex items-center justify-center animate-pulse">
              <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 22V12M12 12C12 12 7 9 7 5C7 3 9 2 12 2C15 2 17 3 17 5C17 9 12 12 12 12ZM5 12H2M22 12H19M12 12V22"/>
              </svg>
            </div>
            <div className="mt-2 px-4 py-1.5 rounded-full bg-[rgb(var(--card))]/90 border border-[rgb(var(--border))] shadow-md">
              <span className="text-sm font-bold text-[rgb(var(--foreground))]" style={{ fontFamily: "'Noto Serif', Georgia, serif" }}>
                {tree.topic}
              </span>
            </div>
          </div>

          {/* SVG branches layer - shares same transform as nodes */}
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

          {/* Fruit Nodes layer */}
          {layout.nodes.map(({ node, x, y }) => {
            const animationDelay = animationOrder.get(node.id) || 0
            const isCollapsed = node.children.length > 0 && collapsedNodes.has(node.id)
            const isSelected = selectedNode?.id === node.id

            return (
              <SkillNode
                key={node.id}
                node={node}
                x={x}
                y={y}
                isSelected={isSelected}
                isCollapsed={isCollapsed}
                isAnimating={growthAnimation[node.id] ?? true}
                animationDelay={animationDelay}
                onSelect={onNodeSelect}
                onCollapse={onCollapse}
              />
            )
          })}
        </div>
      </div>
    </>
  )
}