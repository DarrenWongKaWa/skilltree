import dagre from 'dagre'
import type { SkillTree, SkillNodeData } from '@/types'
import type { Node, Edge } from '@xyflow/react'

// Node dimensions for dagre layout
const NODE_WIDTH = 140
const NODE_HEIGHT = 80

// Transform SkillTree data into ReactFlow nodes and edges
export function transformTreeToFlowData(tree: SkillTree, collapsedNodes: Set<string>): { nodes: Node[]; edges: Edge[] } {
  // Build child map for hierarchy
  const childMap: Record<string, string[]> = {}
  tree.nodes.forEach(n => { childMap[n.id] = n.children || [] })

  // Get all descendants of a node (for collapse)
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

  // Determine which nodes are hidden due to collapsed parents
  const hiddenNodes = new Set<string>()
  collapsedNodes.forEach(collapsedId => {
    getAllDescendants(collapsedId).forEach(id => hiddenNodes.add(id))
  })

  // Create nodes - only visible ones
  const visibleNodes = tree.nodes.filter(n => !hiddenNodes.has(n.id))

  // Build edges from prerequisites
  const edges: Edge[] = []
  visibleNodes.forEach(node => {
    node.prerequisites.forEach(prereqId => {
      // Only add edge if prerequisite is also visible
      if (!hiddenNodes.has(prereqId)) {
        edges.push({
          id: `${prereqId}-${node.id}`,
          source: prereqId,
          target: node.id,
          type: 'smoothstep',
          style: { stroke: 'rgb(var(--lime-medium))', strokeWidth: 2 },
          animated: false,
        })
      }
    })
  })

  // Apply dagre layout
  const { nodes: layoutedNodes } = getDagreLayout(visibleNodes, edges)

  // Create ReactFlow nodes
  const flowNodes: Node[] = layoutedNodes.map(layoutedNode => {
    const nodeData = layoutedNode.data as unknown as SkillNodeData
    return {
      id: layoutedNode.id,
      type: 'skillNode',
      position: layoutedNode.position,
      data: {
        ...nodeData,
        isCollapsed: nodeData.children.length > 0 && collapsedNodes.has(layoutedNode.id),
      },
    }
  })

  return { nodes: flowNodes, edges }
}

// Dagre layout calculation
function getDagreLayout(nodes: SkillNodeData[], edges: Edge[]): { nodes: Node[]; edges: Edge[] } {
  const dagreGraph = new dagre.graphlib.Graph()
  dagreGraph.setDefaultEdgeLabel(() => ({}))
  dagreGraph.setGraph({
    rankdir: 'TB', // Top to Bottom, but we'll flip the y coordinates for BT display
    nodesep: 60,
    ranksep: 100,
    marginx: 50,
    marginy: 50,
  })

  // Add nodes to dagre graph
  nodes.forEach(node => {
    dagreGraph.setNode(node.id, { width: NODE_WIDTH, height: NODE_HEIGHT })
  })

  // Add edges to dagre graph
  edges.forEach(edge => {
    dagreGraph.setEdge(edge.source, edge.target)
  })

  // Calculate layout
  dagre.layout(dagreGraph)

  // Transform back to ReactFlow format with flipped Y for BT display
  // Use plain object with correct structure for ReactFlow
  const layoutedNodes = nodes.map(node => {
    const nodeWithPosition = dagreGraph.node(node.id)
    return {
      id: node.id,
      type: 'skillNode',
      position: {
        x: nodeWithPosition.x - NODE_WIDTH / 2,
        // Flip Y coordinate for bottom-to-top display
        // The canvas will be rendered so that lower Y is higher on screen
        y: -nodeWithPosition.y + NODE_HEIGHT / 2, // Negate for BT direction
      },
      data: node as unknown as Record<string, unknown>,
    }
  })

  return { nodes: layoutedNodes as Node[], edges }
}

// Find the root nodes (nodes with no prerequisites)
export function findRootNodes(nodes: SkillNodeData[]): SkillNodeData[] {
  return nodes.filter(n => n.prerequisites.length === 0)
}

// Get the maximum Y level in the tree (for canvas height)
export function getTreeDepth(nodes: SkillNodeData[]): number {
  const childMap: Record<string, string[]> = {}
  nodes.forEach(n => { childMap[n.id] = n.children || [] })

  const getDepth = (nodeId: string, visited: Set<string> = new Set()): number => {
    if (visited.has(nodeId)) return 0
    visited.add(nodeId)
    const children = childMap[nodeId] || []
    if (children.length === 0) return 0
    return 1 + Math.max(...children.map(c => getDepth(c, visited)))
  }

  const rootNodes = findRootNodes(nodes)
  if (rootNodes.length === 0) return 0
  return Math.max(...rootNodes.map(r => getDepth(r.id)))
}