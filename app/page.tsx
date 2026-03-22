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
  const [progress, setProgress] = useState(0)

  const treeList = Object.values(trees)

  const handleCreate = async () => {
    if (!topic.trim()) return
    setLoading(true)
    setError('')
    setProgress(0)

    // Progress animation - more dynamic
    let currentProgress = 0
    const progressInterval = setInterval(() => {
      // Slower increments as we approach 90%, creating anticipation
      const increment = currentProgress < 30 ? Math.random() * 12 :
                        currentProgress < 60 ? Math.random() * 8 :
                        currentProgress < 85 ? Math.random() * 5 : 2
      currentProgress = Math.min(currentProgress + increment, 89) // Cap at 89 while waiting
      setProgress(currentProgress)
    }, 400)

    // Timeout after 60 seconds
    const timeoutId = setTimeout(() => {
      clearInterval(progressInterval)
      setLoading(false)
      setError('Generation timed out, please try again')
      setProgress(0)
    }, 60000)

    try {
      const tree = await generateSkillTree(topic.trim()) as SkillTree
      clearInterval(progressInterval)
      clearTimeout(timeoutId)
      setProgress(100)

      // Brief celebration moment
      await new Promise(resolve => setTimeout(resolve, 300))

      addTree(tree)
      setCurrentTree(tree)
      router.push(`/tree/${tree.id}`)
    } catch (e) {
      clearInterval(progressInterval)
      clearTimeout(timeoutId)
      const errorMessage = e instanceof Error ? e.message : 'Generation failed'
      setError(errorMessage.includes('timeout') ? 'Generation timed out, please try again' : 'Generation failed, please try again')
      console.error(e)
    }
    setLoading(false)
    setProgress(0)
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
    <div className="min-h-screen relative overflow-hidden">
      {/* Forest background */}
      <div className="fixed inset-0 forest-bg z-0">
        {/* Multiple forest layers for depth */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#1e4d2e] via-[#143828] to-[#0f2518]" />

        {/* Tree silhouettes - back layer */}
        <svg className="absolute bottom-0 left-0 w-full h-[70%] opacity-40" preserveAspectRatio="none" viewBox="0 0 1200 500">
          <defs>
            <linearGradient id="forestGradBack" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#0d2818" />
              <stop offset="100%" stopColor="#061210" />
            </linearGradient>
          </defs>
          <path d="M0,500 L0,350 Q100,280 200,350 L200,250 Q350,150 500,250 L500,300 Q650,200 800,300 L800,280 Q950,180 1100,280 L1100,320 Q1150,280 1200,320 L1200,500 Z" fill="url(#forestGradBack)" />
        </svg>

        {/* Tree silhouettes - middle layer */}
        <svg className="absolute bottom-0 left-0 w-full h-[55%] opacity-60" preserveAspectRatio="none" viewBox="0 0 1200 400">
          <defs>
            <linearGradient id="forestGradMid" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#143d24" />
              <stop offset="100%" stopColor="#0a1f12" />
            </linearGradient>
          </defs>
          <path d="M0,400 L0,300 Q80,220 160,300 L160,200 Q280,80 400,200 L400,250 Q520,150 640,250 L640,220 Q760,120 880,220 L880,280 Q1000,180 1120,280 L1120,300 Q1160,260 1200,300 L1200,400 Z" fill="url(#forestGradMid)" />
        </svg>

        {/* Tree silhouettes - front layer */}
        <svg className="absolute bottom-0 left-0 w-full h-[40%] opacity-80" preserveAspectRatio="none" viewBox="0 0 1200 300">
          <defs>
            <linearGradient id="forestGradFront" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#1a4d2e" />
              <stop offset="100%" stopColor="#0d2818" />
            </linearGradient>
          </defs>
          <path d="M0,300 L0,220 Q60,160 120,220 L120,150 Q200,60 280,150 L280,180 Q360,100 440,180 L440,160 Q520,80 600,160 L600,190 Q680,110 760,190 L760,150 Q840,70 920,150 L920,200 Q1000,130 1080,200 L1080,210 Q1140,160 1200,210 L1200,300 Z" fill="url(#forestGradFront)" />
        </svg>

        {/* Fog layers */}
        <div className="absolute bottom-0 left-0 w-full h-48 bg-gradient-to-t from-[rgba(180,220,180,0.15)] to-transparent animate-mist-drift" />
        <div className="absolute bottom-16 left-0 w-full h-32 bg-gradient-to-t from-[rgba(160,200,160,0.1)] to-transparent animate-mist-drift-slow" />
        <div className="absolute bottom-24 left-0 w-full h-24 bg-gradient-to-t from-[rgba(140,180,140,0.08)] to-transparent animate-mist-drift" />

        {/* Fireflies / glowing particles */}
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1.5 h-1.5 rounded-full"
            style={{
              background: `rgba(${80 + (i % 40)}, ${200 + (i % 30)}, ${80 + (i % 40)}, 0.8)`,
              boxShadow: `0 0 8px 3px rgba(${80 + (i % 40)}, ${200 + (i % 30)}, ${80 + (i % 40)}, 0.5)`,
              left: `${5 + (i * 13) % 90}%`,
              bottom: `${10 + (i * 17) % 60}%`,
              animation: `firefly-${i % 3} ${2 + (i % 3)}s ease-in-out infinite`,
              animationDelay: `${i * 0.2}s`,
            }}
          />
        ))}

        {/* Ambient light rays */}
        <div className="absolute top-0 left-1/4 w-32 h-full bg-gradient-to-b from-[rgba(255,255,200,0.05)] to-transparent rotate-12 animate-gentle-float" />
        <div className="absolute top-0 left-2/3 w-24 h-full bg-gradient-to-b from-[rgba(200,255,200,0.04)] to-transparent -rotate-6 animate-gentle-float" style={{ animationDelay: '1s' }} />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 border-b backdrop-blur-xl shadow-xl bg-[rgba(15,35,22,0.90)] dark:bg-[rgba(10,25,15,0.92)]">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl forest-leaf border-2 border-[rgb(var(--lime-bright))] flex items-center justify-center shadow-lg animate-gentle-float">
              {/* Tree seedling icon */}
              <svg className="w-5 h-5 text-[rgb(var(--lime-bright))]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22V8" />
                <path d="M5 12H2a10 10 0 0 0 20 0h-3" />
                <circle cx="12" cy="5" r="3" fill="currentColor" />
              </svg>
            </div>
            <div>
              <h1
                className="text-xl font-bold text-[rgb(var(--lime-bright))]"
                style={{ fontFamily: "'Noto Serif', Georgia, serif" }}
              >
                SkillTree
              </h1>
              <p className="text-xs text-[rgb(var(--lime-medium))] opacity-80">Grow Your Knowledge</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 rounded-full bg-[rgba(35,65,45,0.8)] text-[rgb(var(--lime-bright))] text-sm font-medium border border-[rgb(var(--lime-medium))]/30">
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
            style={{ fontFamily: "'Noto Serif', Georgia, serif" }}
          >
            <span className="text-[rgb(var(--lime-bright))]">Grow</span>
            <span className="text-[rgb(var(--lime-medium))] mx-3 opacity-60">·</span>
            <span className="text-[rgb(var(--lime-medium))]">Branch</span>
            <span className="text-[rgb(var(--lime-medium))] mx-3 opacity-60">·</span>
            <span className="text-[rgb(var(--foreground))]">Flourish</span>
          </h2>
          <p
            className="text-lg text-[rgb(var(--lime-medium))] max-w-xl mx-auto mb-8 opacity-80"
            style={{ fontFamily: "'Noto Serif', Georgia, serif" }}
          >
            Enter any learning topic and AI generates a complete knowledge forest. Watch your skills grow from seed to towering mastery.
          </p>

          {/* Example topics */}
          <div className="flex flex-wrap justify-center gap-2 mb-8">
            {exampleTopics.map((t) => (
              <button
                key={t.label}
                onClick={() => setTopic(t.label)}
                className="px-4 py-2 rounded-full bg-[rgba(20,60,40,0.6)] border border-[rgb(var(--lime-medium))]/30 text-sm text-[rgb(var(--lime-bright))] hover:border-[rgb(var(--lime-medium))] hover:bg-[rgba(30,80,50,0.6)] transition-all hover:shadow-lg hover:shadow-[rgba(80,180,80,0.2)]"
              >
                <span style={{ fontFamily: 'var(--font-brush-chinese)' }}>{t.icon}</span> {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Create new card */}
        <div
          className="forest-card rounded-2xl shadow-xl border border-[rgb(var(--lime-medium))]/20 p-8 mb-10 animate-fade-in"
          style={{ animationDelay: '100ms' }}
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[rgb(var(--lime-medium))] to-[rgb(var(--lime-dark))] flex items-center justify-center text-white text-xl shadow-lg">
              <span style={{ fontFamily: 'var(--font-brush-chinese)' }}>✦</span>
            </div>
            <div>
              <h3
                className="font-semibold text-lg text-[rgb(var(--lime-bright))]"
                style={{ fontFamily: "'Noto Serif', Georgia, serif" }}
              >
                Plant Your Skill Tree
              </h3>
              <p className="text-sm text-[rgb(var(--lime-medium))] opacity-70">Enter a topic, AI cultivates your complete learning forest</p>
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
              className="flex-1 px-5 py-4 bg-[rgba(10,31,18,0.8)] border border-[rgb(var(--lime-medium))]/30 rounded-xl text-[rgb(var(--lime-bright))] placeholder:text-[rgb(var(--lime-medium))] placeholder:opacity-50 focus:ring-2 focus:ring-[rgb(var(--lime-medium))] focus:border-transparent disabled:opacity-50 transition-all"
            />
            <button
              onClick={handleCreate}
              disabled={!topic.trim() || loading}
              className={`px-8 py-4 rounded-xl font-semibold text-[rgb(var(--background))] shadow-lg transition-all ${
                !topic.trim() || loading
                  ? 'bg-[rgb(var(--muted))] cursor-not-allowed opacity-50'
                  : 'bg-gradient-to-r from-[rgb(var(--lime-medium))] to-[rgb(var(--lime-bright))] hover:shadow-xl hover:shadow-[rgba(80,180,80,0.3)] hover:scale-[1.02] active:scale-[0.98]'
              }`}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-5 h-5 border-2 border-[rgb(var(--background))]/30 border-t-[rgb(var(--background))] rounded-full animate-spin" />
                  Growing...
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

          {/* Dynamic progress bar */}
          {loading && (
            <div className="mt-6">
              <div className="relative h-3 bg-[rgba(15,35,22,0.9)] rounded-full overflow-hidden border border-[rgb(var(--lime-medium))]/30">
                {/* Progress fill */}
                <div
                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-[rgb(var(--lime-dark))] via-[rgb(var(--lime-medium))] to-[rgb(var(--lime-bright))] rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${progress}%` }}
                >
                  {/* Shimmer effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
                </div>

                {/* Progress particles */}
                {progress > 0 && progress < 100 && (
                  <div
                    className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-[rgb(var(--lime-bright))] shadow-[0_0_10px_rgba(180,220,80,0.8)]"
                    style={{
                      left: `calc(${progress}% - 6px)`,
                      transition: 'left 0.3s ease-out',
                    }}
                  />
                )}
              </div>

              {/* Progress text with forest growth stages */}
              <div className="flex items-center justify-between mt-3">
                <p className="text-sm text-[rgb(var(--lime-medium))]">
                  {progress < 25 ? '🌱 Sprouting roots...' :
                   progress < 50 ? '🌿 Growing branches...' :
                   progress < 75 ? '🌲 Building canopy...' :
                   progress < 100 ? '✨ Adding finishing touches...' :
                   '🎉 Your skill tree is ready!'}
                </p>
                <span className="text-sm font-medium text-[rgb(var(--lime-bright))]">
                  {Math.round(progress)}%
                </span>
              </div>

              {/* Forest growth visualization */}
              <div className="mt-4 flex justify-center">
                <div className="relative w-32 h-20">
                  {/* Seed */}
                  <div
                    className="absolute bottom-0 left-1/2 -translate-x-1/2 text-2xl transition-all duration-500"
                    style={{
                      opacity: progress < 10 ? 1 : 0,
                      transform: progress < 10 ? 'scale(1)' : 'scale(0)',
                    }}
                  >
                    🌰
                  </div>
                  {/* Sprout */}
                  <div
                    className="absolute bottom-2 left-1/2 -translate-x-1/2 text-2xl transition-all duration-500"
                    style={{
                      opacity: progress >= 10 && progress < 30 ? 1 : 0,
                      transform: progress >= 10 && progress < 30 ? 'scale(1)' : 'scale(0)',
                    }}
                  >
                    🌱
                  </div>
                  {/* Small tree */}
                  <div
                    className="absolute bottom-0 left-1/2 -translate-x-1/2 text-3xl transition-all duration-500"
                    style={{
                      opacity: progress >= 30 && progress < 60 ? 1 : 0,
                      transform: progress >= 30 && progress < 60 ? 'scale(1)' : 'scale(0)',
                    }}
                  >
                    🌳
                  </div>
                  {/* Full tree */}
                  <div
                    className="absolute bottom-0 left-1/2 -translate-x-1/2 text-4xl transition-all duration-500"
                    style={{
                      opacity: progress >= 60 && progress < 100 ? 1 : 0,
                      transform: progress >= 60 && progress < 100 ? 'scale(1)' : 'scale(0)',
                    }}
                  >
                    🌲
                  </div>
                  {/* Celebration */}
                  <div
                    className="absolute bottom-0 left-1/2 -translate-x-1/2 text-4xl transition-all duration-500"
                    style={{
                      opacity: progress >= 100 ? 1 : 0,
                      transform: progress >= 100 ? 'scale(1)' : 'scale(0)',
                    }}
                  >
                    🎄
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Existing trees */}
        {treeList.length > 0 && (
          <div className="animate-fade-in" style={{ animationDelay: '200ms' }}>
            <div className="flex items-center gap-2 mb-6">
              <span className="text-2xl">▤</span>
              <h3
                className="font-semibold text-lg text-[rgb(var(--lime-bright))]"
                style={{ fontFamily: "'Noto Serif', Georgia, serif" }}
              >
                My Skill Forests
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
                    className="group forest-card rounded-2xl border border-[rgb(var(--lime-medium))]/20 p-6 text-left hover:shadow-xl hover:border-[rgb(var(--lime-medium))]/50 transition-all duration-300 animate-fade-in"
                    style={{ animationDelay: `${300 + index * 50}ms` }}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4
                            className="font-semibold text-lg text-[rgb(var(--lime-bright))] group-hover:text-[rgb(var(--lime-bright))] transition-colors"
                            style={{ fontFamily: "'Noto Serif', Georgia, serif" }}
                          >
                            {tree.topic}
                          </h4>
                          {isComplete && (
                            <span className="px-2 py-0.5 rounded-full bg-[rgb(var(--lime-medium))]/20 text-[rgb(var(--lime-bright))] text-xs font-medium border border-[rgb(var(--lime-medium))]/50">
                              Completed
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-[rgb(var(--lime-medium))] opacity-70 line-clamp-1">{tree.description}</p>
                      </div>
                      <div className="text-right ml-4">
                        <div
                          className={`text-2xl font-bold ${isComplete ? 'text-[rgb(var(--lime-bright))]' : 'text-[rgb(var(--lime-medium))]'}`}
                          style={{ fontFamily: 'var(--font-brush-chinese)' }}
                        >
                          {percent}%
                        </div>
                        <div className="text-xs text-[rgb(var(--lime-medium))] opacity-60">
                          {learned}/{total} nodes
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-2 bg-[rgba(10,31,18,0.8)] rounded-full overflow-hidden border border-[rgb(var(--lime-medium))]/20">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            isComplete
                              ? 'bg-gradient-to-r from-[rgb(var(--lime-medium))] to-[rgb(var(--lime-bright))]'
                              : 'bg-gradient-to-r from-[rgb(var(--lime-dark))] to-[rgb(var(--lime-medium))]'
                          }`}
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                      <span className="text-sm text-[rgb(var(--lime-medium))] group-hover:text-[rgb(var(--lime-bright))] transition-colors">
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
            className="text-center py-16 px-6 rounded-2xl border-2 border-dashed border-[rgb(var(--lime-medium))]/30 animate-fade-in"
            style={{ animationDelay: '200ms' }}
          >
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-[rgba(20,60,40,0.6)] flex items-center justify-center border border-[rgb(var(--lime-medium))]/30">
              <span className="text-4xl" style={{ fontFamily: 'var(--font-brush-chinese)' }}>◈</span>
            </div>
            <h3
              className="text-xl font-semibold text-[rgb(var(--lime-bright))] mb-2"
              style={{ fontFamily: "'Noto Serif', Georgia, serif" }}
            >
              No Skill Trees Yet
            </h3>
            <p className="text-[rgb(var(--lime-medium))] max-w-sm mx-auto opacity-70">
              Plant your first seed above and watch your knowledge forest grow
            </p>
          </div>
        )}

        {/* Features section */}
        <div className="mt-16 grid md:grid-cols-3 gap-6 animate-fade-in" style={{ animationDelay: '400ms' }}>
          {[
            { icon: '◈', title: 'AI Generation', desc: 'Enter a topic, auto-build complete knowledge forest' },
            { icon: '◆', title: 'Progress Tracking', desc: 'Light up branches, watch your forest flourish' },
            { icon: '◇', title: 'Quiz Practice', desc: 'Answer questions, ensure true mastery of skills' },
          ].map((f, i) => (
            <div
              key={i}
              className="forest-card rounded-xl p-5 border border-[rgb(var(--lime-medium))]/20 text-center hover:shadow-lg transition-all"
            >
              <span
                className="text-3xl mb-3 block text-[rgb(var(--lime-bright))]"
                style={{ fontFamily: 'var(--font-brush-chinese)' }}
              >
                {f.icon}
              </span>
              <h4
                className="font-semibold text-[rgb(var(--lime-bright))] mb-1"
                style={{ fontFamily: "'Noto Serif', Georgia, serif" }}
              >
                {f.title}
              </h4>
              <p className="text-sm text-[rgb(var(--lime-medium))] opacity-70">{f.desc}</p>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-16 py-8 text-center text-sm text-[rgb(var(--lime-medium))] opacity-60 border-t border-[rgb(var(--lime-medium))]/20 relative z-10">
        <p style={{ fontFamily: "'Noto Serif', Georgia, serif" }}>Built with Next.js + MiniMax AI</p>
      </footer>
    </div>
  )
}
