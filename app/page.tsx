'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useStore } from '@/store'
import { generateSkillTree } from '@/lib/api'
import ThemeToggle from '@/components/ThemeToggle'
import type { SkillTree } from '@/types'

export default function HomePage() {
  const router = useRouter()
  const { trees, addTree, setCurrentTree } = useStore()
  const [topic, setTopic] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const treeList = Object.values(trees)

  const handleCreate = async () => {
    if (!topic.trim()) return
    setLoading(true)
    setError('')
    try {
      const tree = await generateSkillTree(topic.trim()) as SkillTree
      addTree(tree)
      setCurrentTree(tree)
      router.push(`/tree/${tree.id}`)
    } catch (e) {
      setError('Generation failed, please retry')
      console.error(e)
    }
    setLoading(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !loading) handleCreate()
  }

  const exampleTopics = [
    { label: 'Machine Learning', icon: '🤖' },
    { label: 'Photography', icon: '📷' },
    { label: 'Guitar', icon: '🎸' },
    { label: 'Cooking', icon: '🍳' },
  ]

  return (
    <div className="min-h-screen transition-colors duration-300"
      style={{ background: 'linear-gradient(135deg, rgb(var(--background)) 0%, rgb(var(--muted)) 50%, rgb(var(--background)) 100%)' }}>

      {/* Header */}
      <header className="border-b backdrop-blur-sm bg-white/80 dark:bg-slate-900/80 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xl shadow-lg">
              <span className="animate-float">🌳</span>
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                SkillTree
              </h1>
              <p className="text-xs text-stone-500 dark:text-stone-400">AI Skill Tree Learning</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-sm font-medium">
              {treeList.length} skill {treeList.length === 1 ? 'tree' : 'trees'}
            </span>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-4xl mx-auto px-6 py-12">

        {/* Hero Section */}
        <div className="text-center mb-12 animate-fade-in">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">
            <span className="text-stone-800 dark:text-stone-100">Learn with a</span>
            <span className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 bg-clip-text text-transparent"> Clear Path</span>
          </h2>
          <p className="text-lg text-stone-500 max-w-xl mx-auto mb-8">
            Enter any learning topic and AI generates a complete knowledge graph and learning path. From beginner to expert, every step is clear.
          </p>

          {/* Example topics */}
          <div className="flex flex-wrap justify-center gap-2 mb-8">
            {exampleTopics.map((t) => (
              <button
                key={t.label}
                onClick={() => setTopic(t.label)}
                className="px-4 py-2 rounded-full bg-white dark:bg-slate-800 border border-stone-200 dark:border-slate-700 text-sm text-stone-600 dark:text-stone-300 hover:border-blue-400 hover:text-blue-500 dark:hover:border-blue-500 dark:hover:text-blue-400 transition-all hover:shadow-md"
              >
                {t.icon} {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Create new card */}
        <div
          className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-stone-200/50 dark:border-slate-700/50 p-8 mb-10 animate-fade-in"
          style={{ animationDelay: '100ms' }}
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xl shadow-lg">
              ✨
            </div>
            <div>
              <h3 className="font-semibold text-lg text-stone-800 dark:text-stone-100">Start Your Learning Journey</h3>
              <p className="text-sm text-stone-500">Enter a topic, AI builds a complete skill tree for you</p>
            </div>
          </div>

          <div className="flex gap-3">
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Enter a topic you want to learn..."
              disabled={loading}
              className="flex-1 px-5 py-4 bg-stone-50 dark:bg-slate-900 border border-stone-200 dark:border-slate-700 rounded-xl text-stone-800 dark:text-stone-100 placeholder:text-stone-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 transition-all"
            />
            <button
              onClick={handleCreate}
              disabled={!topic.trim() || loading}
              className={`px-8 py-4 rounded-xl font-semibold text-white shadow-lg transition-all
                ${!topic.trim() || loading
                  ? 'bg-stone-300 dark:bg-slate-600 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-500 to-purple-600 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]'
                }`}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Generating
                </span>
              ) : (
                'Generate Skill Tree'
              )}
            </button>
          </div>
          {error && (
            <p className="text-red-500 text-sm mt-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500" />
              {error}
            </p>
          )}
          {loading && (
            <div className="mt-6">
              <div className="h-2 bg-stone-100 dark:bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full transition-all duration-500"
                  style={{ width: '75%' }}
                />
              </div>
              <p className="text-stone-400 text-sm mt-3 text-center">AI is building your personalized skill tree...</p>
            </div>
          )}
        </div>

        {/* Existing trees */}
        {treeList.length > 0 && (
          <div className="animate-fade-in" style={{ animationDelay: '200ms' }}>
            <div className="flex items-center gap-2 mb-6">
              <span className="text-2xl">📚</span>
              <h3 className="font-semibold text-lg text-stone-800 dark:text-stone-100">My Skill Trees</h3>
            </div>
            <div className="grid gap-4">
              {treeList.map((tree, index) => {
                const learned = tree.nodes.filter((n) => n.status === 'learned').length
                const total = tree.nodes.length
                const percent = Math.round((learned / total) * 100)
                const isComplete = percent === 100
                return (
                  <button
                    key={tree.id}
                    onClick={() => {
                      setCurrentTree(tree)
                      router.push(`/tree/${tree.id}`)
                    }}
                    className="group bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl border border-stone-200/50 dark:border-slate-700/50 p-6 text-left hover:shadow-xl hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-300 animate-fade-in"
                    style={{ animationDelay: `${300 + index * 50}ms` }}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-lg text-stone-800 dark:text-stone-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                            {tree.topic}
                          </h4>
                          {isComplete && (
                            <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-600 text-xs font-medium">
                              Completed
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-stone-500 line-clamp-1">{tree.description}</p>
                      </div>
                      <div className="text-right ml-4">
                        <div className={`text-2xl font-bold ${isComplete ? 'text-green-500' : 'text-blue-500'}`}>
                          {percent}%
                        </div>
                        <div className="text-xs text-stone-400">
                          {learned}/{total} nodes
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-2 bg-stone-100 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            isComplete
                              ? 'bg-gradient-to-r from-green-400 to-emerald-500'
                              : 'bg-gradient-to-r from-blue-500 to-purple-500'
                          }`}
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                      <span className="text-sm text-stone-400 group-hover:text-blue-500 transition-colors">
                        View →
                      </span>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Empty state */}
        {treeList.length === 0 && !loading && (
          <div
            className="text-center py-16 px-6 rounded-2xl border-2 border-dashed border-stone-200 dark:border-slate-700 animate-fade-in"
            style={{ animationDelay: '200ms' }}
          >
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 flex items-center justify-center">
              <span className="text-4xl">🌱</span>
            </div>
            <h3 className="text-xl font-semibold text-stone-700 dark:text-stone-300 mb-2">
              No skill trees yet
            </h3>
            <p className="text-stone-500 max-w-sm mx-auto">
              Enter a learning topic above and let AI build your first skill tree to start your learning journey
            </p>
          </div>
        )}

        {/* Features section */}
        <div className="mt-16 grid md:grid-cols-3 gap-6 animate-fade-in" style={{ animationDelay: '400ms' }}>
          {[
            { icon: '🧠', title: 'AI Generation', desc: 'Enter a topic, automatically build complete knowledge graphs' },
            { icon: '📊', title: 'Progress Tracking', desc: 'Light up nodes, clearly track learning progress' },
            { icon: '✍️', title: 'Quiz Practice', desc: 'Answer questions to ensure you truly master skills' },
          ].map((f, i) => (
            <div
              key={i}
              className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-xl p-5 border border-stone-200/50 dark:border-slate-700/50 text-center hover:shadow-lg transition-all"
            >
              <span className="text-3xl mb-3 block">{f.icon}</span>
              <h4 className="font-semibold text-stone-800 dark:text-stone-100 mb-1">{f.title}</h4>
              <p className="text-sm text-stone-500">{f.desc}</p>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-16 py-8 text-center text-sm text-stone-400 border-t border-stone-200 dark:border-slate-800">
        <p>Built with Next.js + MiniMax AI</p>
      </footer>
    </div>
  )
}
