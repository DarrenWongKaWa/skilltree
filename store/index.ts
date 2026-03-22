import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { SkillTree, SkillNodeData, Quiz } from '@/types'

interface AppState {
  // Current tree being viewed/edited
  currentTree: SkillTree | null
  currentQuiz: Quiz | null

  // All saved trees (indexed by id)
  trees: Record<string, SkillTree>

  // O(1) lookup maps for tree nodes ( regenerated on tree add/update)
  nodesMaps: Record<string, Record<string, SkillNodeData>>

  // Actions
  setCurrentTree: (tree: SkillTree | null) => void
  addTree: (tree: SkillTree) => void
  updateNodeStatus: (treeId: string, nodeId: string, status: SkillNode['status']) => void
  setCurrentQuiz: (quiz: Quiz | null) => void
  getTree: (id: string) => SkillTree | undefined
  getNode: (treeId: string, nodeId: string) => SkillNodeData | undefined
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
    }),
    {
      name: 'skilltree-storage',
      partialize: (state) => ({ trees: state.trees, nodesMaps: state.nodesMaps }),
    }
  )
)
