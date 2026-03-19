'use client'

import { use } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'

const TreeView = dynamic(() => import('@/components/TreeView'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-screen">
      <div className="text-center">
        <div className="text-4xl mb-4">🧠</div>
        <p className="text-stone-500 dark:text-stone-400">Loading skill tree...</p>
      </div>
    </div>
  )
})

export default function TreePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()

  return (
    <div className="h-screen">
      <TreeView treeId={id} />
    </div>
  )
}
