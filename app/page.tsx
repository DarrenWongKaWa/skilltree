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
      setError('Generation failed, please try again')
      console.error(e)
    }
    setLoading(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !loading) handleCreate()
  }

  const exampleTopics = [
    { label: 'Machine Learning', icon: '◈' },
    { label: 'Photography', icon: '◈' },
    { label: 'Guitar', icon: '◈' },
    { label: 'Cooking', icon: '◈' },
  ]

  return (
    <div className="min-h-screen bg-rice-paper relative">
      {/* Decorative ink wash mountains background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <img
          src="/ink-wash-mountains.svg"
          alt=""
          className="w-full h-full object-cover opacity-30 dark:opacity-15 animate-mist-drift"
        />
      </div>

      {/* Header */}
      <header className="border-b backdrop-blur-sm bg-[rgb(var(--card))]/80 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl jade-tablet border-2 border-[rgb(var(--jade-pale))] flex items-center justify-center text-[rgb(var(--jade-aged))] text-xl shadow-lg animate-gentle-float">
              <span style={{ fontFamily: 'var(--font-brush-chinese)' }}>木</span>
            </div>
            <div>
              <h1
                className="text-xl font-bold text-[rgb(var(--foreground))]"
                style={{ fontFamily: 'var(--font-noto-serif), serif' }}
              >
                SkillTree
              </h1>
              <p className="text-xs text-[rgb(var(--muted-foreground))]">Ancient Serenity · AI Learning</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 rounded-full bg-[rgb(var(--secondary))] text-[rgb(var(--muted-foreground))] text-sm font-medium border border-[rgb(var(--border))]">
              {treeList.length} skill tree{treeList.length !== 1 ? 's' : ''}
            </span>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-4xl mx-auto px-6 py-12 relative z-10">

        {/* Hero Section */}
        <div className="text-center mb-12 animate-fade-in">
          <h2
            className="text-4xl md:text-5xl font-bold mb-4 tracking-tight"
            style={{ fontFamily: 'var(--font-noto-serif), serif' }}
          >
            <span className="text-[rgb(var(--foreground))]">悟</span>
            <span className="text-[rgb(var(--muted-foreground))] mx-3">·</span>
            <span className="text-[rgb(var(--foreground))]">修</span>
            <span className="text-[rgb(var(--muted-foreground))] mx-3">·</span>
            <span className="text-[rgb(var(--foreground))]">行</span>
          </h2>
          <p
            className="text-lg text-[rgb(var(--muted-foreground))] max-w-xl mx-auto mb-8"
            style={{ fontFamily: 'var(--font-noto-serif), serif' }}
          >
            Enter any learning topic and AI generates a complete knowledge graph and learning path. From beginner to master, every step is clear.
          </p>

          {/* Example topics */}
          <div className="flex flex-wrap justify-center gap-2 mb-8">
            {exampleTopics.map((t) => (
              <button
                key={t.label}
                onClick={() => setTopic(t.label)}
                className="px-4 py-2 rounded-full bg-[rgb(var(--card))] border border-[rgb(var(--border))] text-sm text-[rgb(var(--muted-foreground))] hover:border-[rgb(var(--jade-aged))] hover:text-[rgb(var(--jade-aged))] transition-all hover:shadow-md"
              >
                <span style={{ fontFamily: 'var(--font-brush-chinese)' }}>{t.icon}</span> {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Create new card */}
        <div
          className="bg-[rgb(var(--card))]/90 backdrop-blur-sm rounded-2xl shadow-xl border border-[rgb(var(--border))] p-8 mb-10 animate-fade-in"
          style={{ animationDelay: '100ms' }}
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-[rgb(var(--primary))] flex items-center justify-center text-[rgb(var(--primary-foreground))] text-xl shadow-lg">
              <span style={{ fontFamily: 'var(--font-brush-chinese)' }}>✦</span>
            </div>
            <div>
              <h3
                className="font-semibold text-lg text-[rgb(var(--foreground))]"
                style={{ fontFamily: 'var(--font-noto-serif), serif' }}
              >
                Begin Your Learning Journey
              </h3>
              <p className="text-sm text-[rgb(var(--muted-foreground))]">Enter a topic, AI builds your complete skill tree</p>
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
              className="flex-1 px-5 py-4 bg-[rgb(var(--background))] border border-[rgb(var(--border))] rounded-xl text-[rgb(var(--foreground))] placeholder:text-[rgb(var(--muted-foreground))] focus:ring-2 focus:ring-[rgb(var(--primary))] focus:border-transparent disabled:opacity-50 transition-all"
            />
            <button
              onClick={handleCreate}
              disabled={!topic.trim() || loading}
              className={`px-8 py-4 rounded-xl font-semibold text-[rgb(var(--primary-foreground))] shadow-lg transition-all
                ${!topic.trim() || loading
                  ? 'bg-[rgb(var(--muted))] cursor-not-allowed'
                  : 'bg-[rgb(var(--primary))] hover:bg-[rgb(var(--primary))]/90 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]'
                }`}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-5 h-5 border-2 border-[rgb(var(--primary-foreground))]/30 border-t-[rgb(var(--primary-foreground))] rounded-full animate-spin" />
                  Generating
                </span>
              ) : (
                'Generate Skill Tree'
              )}
            </button>
          </div>
          {error && (
            <p className="text-[rgb(var(--destructive))] text-sm mt-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[rgb(var(--destructive))]" />
              {error}
            </p>
          )}
          {loading && (
            <div className="mt-6">
              <div className="h-2 bg-[rgb(var(--secondary))] rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[rgb(var(--jade-aged))] to-[rgb(var(--jade-pale))] rounded-full transition-all duration-500"
                  style={{ width: '75%' }}
                />
              </div>
              <p className="text-[rgb(var(--muted-foreground))] text-sm mt-3 text-center">AI is building your personalized skill tree...</p>
            </div>
          )}
        </div>

        {/* Existing trees */}
        {treeList.length > 0 && (
          <div className="animate-fade-in" style={{ animationDelay: '200ms' }}>
            <div className="flex items-center gap-2 mb-6">
              <span className="text-2xl" style={{ fontFamily: 'var(--font-brush-chinese)' }}>▤</span>
              <h3
                className="font-semibold text-lg text-[rgb(var(--foreground))]"
                style={{ fontFamily: 'var(--font-noto-serif), serif' }}
              >
                My Skill Trees
              </h3>
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
                    className="group bg-[rgb(var(--card))]/80 backdrop-blur-sm rounded-2xl border border-[rgb(var(--border))] p-6 text-left hover:shadow-xl hover:border-[rgb(var(--jade-aged))] transition-all duration-300 animate-fade-in"
                    style={{ animationDelay: `${300 + index * 50}ms` }}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4
                            className="font-semibold text-lg text-[rgb(var(--foreground))] group-hover:text-[rgb(var(--jade-aged))] transition-colors"
                            style={{ fontFamily: 'var(--font-noto-serif), serif' }}
                          >
                            {tree.topic}
                          </h4>
                          {isComplete && (
                            <span className="px-2 py-0.5 rounded-full bg-[rgb(var(--jade-aged-bg))] text-[rgb(var(--jade-aged))] text-xs font-medium border border-[rgb(var(--jade-aged))]">
                              Completed
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-[rgb(var(--muted-foreground))] line-clamp-1">{tree.description}</p>
                      </div>
                      <div className="text-right ml-4">
                        <div
                          className={`text-2xl font-bold ${isComplete ? 'text-[rgb(var(--jade-aged))]' : 'text-[rgb(var(--primary))]'}`}
                          style={{ fontFamily: 'var(--font-brush-chinese)' }}
                        >
                          {percent}%
                        </div>
                        <div className="text-xs text-[rgb(var(--muted-foreground))]">
                          {learned}/{total} nodes
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-2 bg-[rgb(var(--secondary))] rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            isComplete
                              ? 'bg-gradient-to-r from-[rgb(var(--jade-aged))] to-[rgb(var(--jade-pale))]'
                              : 'bg-gradient-to-r from-[rgb(var(--jade-aged))] to-[rgb(var(--accent))]'
                          }`}
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                      <span className="text-sm text-[rgb(var(--muted-foreground))] group-hover:text-[rgb(var(--jade-aged))] transition-colors">
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
            className="text-center py-16 px-6 rounded-2xl border-2 border-dashed border-[rgb(var(--border))] animate-fade-in"
            style={{ animationDelay: '200ms' }}
          >
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-[rgb(var(--secondary))] flex items-center justify-center">
              <span className="text-4xl" style={{ fontFamily: 'var(--font-brush-chinese)' }}>◈</span>
            </div>
            <h3
              className="text-xl font-semibold text-[rgb(var(--foreground))] mb-2"
              style={{ fontFamily: 'var(--font-noto-serif), serif' }}
            >
              No Skill Trees Yet
            </h3>
            <p className="text-[rgb(var(--muted-foreground))] max-w-sm mx-auto">
              Enter a learning topic above and let AI build your first skill tree to begin your journey
            </p>
          </div>
        )}

        {/* Features section */}
        <div className="mt-16 grid md:grid-cols-3 gap-6 animate-fade-in" style={{ animationDelay: '400ms' }}>
          {[
            { icon: '◈', title: 'AI Generation', desc: 'Enter a topic, auto-build complete knowledge graph' },
            { icon: '◆', title: 'Progress Tracking', desc: 'Light up nodes, track learning progress clearly' },
            { icon: '◇', title: 'Quiz Practice', desc: 'Answer questions, ensure true mastery of skills' },
          ].map((f, i) => (
            <div
              key={i}
              className="bg-[rgb(var(--card))]/60 backdrop-blur-sm rounded-xl p-5 border border-[rgb(var(--border))] text-center hover:shadow-lg transition-all"
            >
              <span
                className="text-3xl mb-3 block text-[rgb(var(--jade-aged))]"
                style={{ fontFamily: 'var(--font-brush-chinese)' }}
              >
                {f.icon}
              </span>
              <h4
                className="font-semibold text-[rgb(var(--foreground))] mb-1"
                style={{ fontFamily: 'var(--font-noto-serif), serif' }}
              >
                {f.title}
              </h4>
              <p className="text-sm text-[rgb(var(--muted-foreground))]">{f.desc}</p>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-16 py-8 text-center text-sm text-[rgb(var(--muted-foreground))] border-t border-[rgb(var(--border))] relative z-10">
        <p style={{ fontFamily: 'var(--font-noto-serif), serif' }}>Built with Next.js + MiniMax AI</p>
      </footer>
    </div>
  )
}
