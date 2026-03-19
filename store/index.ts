import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { SkillTree, Quiz } from '@/types'

interface AppState {
  // Current tree being viewed/edited
  currentTree: SkillTree | null
  currentQuiz: Quiz | null
  
  // All saved trees (indexed by id)
  trees: Record<string, SkillTree>
  
  // Actions
  setCurrentTree: (tree: SkillTree | null) => void
  addTree: (tree: SkillTree) => void
  updateNodeStatus: (treeId: string, nodeId: string, status: SkillNode['status']) => void
  setCurrentQuiz: (quiz: Quiz | null) => void
  getTree: (id: string) => SkillTree | undefined
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

      setCurrentTree: (tree) => set({ currentTree: tree }),

      addTree: (tree) =>
        set((state) => ({
          trees: { ...state.trees, [tree.id]: tree },
        })),

      updateNodeStatus: (treeId, nodeId, status) =>
        set((state) => {
          const tree = state.trees[treeId]
          if (!tree) return state
          const nodes = tree.nodes.map((n) =>
            n.id === nodeId ? { ...n, status } : n
          )
          return {
            trees: { ...state.trees, [treeId]: { ...tree, nodes } },
            currentTree: state.currentTree?.id === treeId
              ? { ...state.currentTree, nodes }
              : state.currentTree,
          }
        }),

      setCurrentQuiz: (quiz) => set({ currentQuiz: quiz }),

      getTree: (id) => get().trees[id],
    }),
    {
      name: 'skilltree-storage',
      partialize: (state) => ({ trees: state.trees }),
    }
  )
)
