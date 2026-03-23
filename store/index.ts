import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { SkillTree, SkillNodeData, Quiz } from '@/types'

// Canvas camera state (pan + zoom)
interface CameraState {
  x: number
  y: number
  zoom: number
}

// Node position state (for draggable nodes)
interface NodePosition {
  id: string
  x: number
  y: number
}

interface AppState {
  // Current tree being viewed/edited
  currentTree: SkillTree | null
  currentQuiz: Quiz | null

  // All saved trees (indexed by id)
  trees: Record<string, SkillTree>

  // O(1) lookup maps for tree nodes
  nodesMaps: Record<string, Record<string, SkillNodeData>>

  // Canvas camera state (pan + zoom) - global so branches can follow
  camera: CameraState

  // Node positions for draggable nodes
  nodePositions: Record<string, NodePosition>

  // Actions
  setCurrentTree: (tree: SkillTree | null) => void
  addTree: (tree: SkillTree) => void
  deleteTree: (treeId: string) => void
  updateNodeStatus: (treeId: string, nodeId: string, status: SkillNode['status']) => void
  setCurrentQuiz: (quiz: Quiz | null) => void
  getTree: (id: string) => SkillTree | undefined
  getNode: (treeId: string, nodeId: string) => SkillNodeData | undefined

  // Camera actions
  updateCamera: (x: number, y: number) => void
  setZoom: (zoom: number) => void

  // Node position actions
  updateNodePosition: (id: string, x: number, y: number) => void
  initializeNodePositions: (treeId: string, positions: NodePosition[]) => void
}

interface SkillNode {
  id: string
  status: 'locked' | 'available' | 'learned'
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      currentTree: null,
      currentQuiz: null,
      trees: {},
      nodesMaps: {},
      camera: { x: 0, y: 0, zoom: 1 },
      nodePositions: {},

      setCurrentTree: (tree) => set({ currentTree: tree }),

      addTree: (tree) => {
        // Build O(1) lookup map
        const nodesMap = tree.nodes.reduce((acc, node) => {
          acc[node.id] = node
          return acc
        }, {} as Record<string, SkillNodeData>)

        set((state) => ({
          trees: { ...state.trees, [tree.id]: tree },
          nodesMaps: { ...state.nodesMaps, [tree.id]: nodesMap },
        }))
      },

      deleteTree: (treeId) => {
        set((state) => {
          const { [treeId]: removed, ...remainingTrees } = state.trees
          const { [treeId]: removedMap, ...remainingMaps } = state.nodesMaps
          return {
            trees: remainingTrees,
            nodesMaps: remainingMaps,
            currentTree: state.currentTree?.id === treeId ? null : state.currentTree,
          }
        })
      },

      updateNodeStatus: (treeId, nodeId, status) =>
        set((state) => {
          const tree = state.trees[treeId]
          if (!tree) return state
          const nodes = tree.nodes.map((n) =>
            n.id === nodeId ? { ...n, status } : n
          )
          // Update nodesMap for O(1) lookup
          const nodesMap = { ...state.nodesMaps[treeId] }
          if (nodesMap[nodeId]) {
            nodesMap[nodeId] = { ...nodesMap[nodeId], status }
          }
          return {
            trees: { ...state.trees, [treeId]: { ...tree, nodes } },
            nodesMaps: { ...state.nodesMaps, [treeId]: nodesMap },
            currentTree: state.currentTree?.id === treeId
              ? { ...state.currentTree, nodes }
              : state.currentTree,
          }
        }),

      setCurrentQuiz: (quiz) => set({ currentQuiz: quiz }),

      getTree: (id) => get().trees[id],

      getNode: (treeId, nodeId) => get().nodesMaps[treeId]?.[nodeId],

      // Camera actions
      updateCamera: (x, y) => set((state) => ({
        camera: { ...state.camera, x, y }
      })),

      setZoom: (zoom) => set((state) => ({
        camera: { ...state.camera, zoom }
      })),

      // Node position actions
      updateNodePosition: (id, x, y) => set((state) => ({
        nodePositions: { ...state.nodePositions, [id]: { id, x, y } }
      })),

      initializeNodePositions: (treeId, positions) => set((state) => {
        const newPositions = { ...state.nodePositions }
        positions.forEach(p => { newPositions[p.id] = p })
        return { nodePositions: newPositions }
      }),
    }),
    {
      name: 'skilltree-storage',
      partialize: (state) => ({ trees: state.trees, nodesMaps: state.nodesMaps }),
    }
  )
)
