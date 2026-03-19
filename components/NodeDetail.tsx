'use client'

import { useState } from 'react'
import type { SkillNodeData } from '@/types'

interface NodeDetailProps {
  node: SkillNodeData | null
  onLearn: (node: SkillNodeData) => void
  onQuiz: (node: SkillNodeData) => void
  onDirectLight: (nodeId: string) => void
}

export default function NodeDetail({ node, onLearn, onQuiz, onDirectLight }: NodeDetailProps) {
  const [copied, setCopied] = useState(false)

  if (!node) {
    return (
      <div className="w-80 bg-stone-50/80 dark:bg-slate-800/80 backdrop-blur-sm border-l border-stone-200 dark:border-slate-700 flex items-center justify-center">
        <div className="text-center px-6">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-stone-100 dark:bg-slate-700 flex items-center justify-center">
            <span className="text-3xl">👈</span>
          </div>
          <p className="text-stone-500 dark:text-stone-400 text-sm">Click a node to view details</p>
        </div>
      </div>
    )
  }

  const handleCopyDescription = () => {
    navigator.clipboard.writeText(node.description)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const levelStyles: Record<string, string> = {
    'Beginner': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400',
    'Intermediate': 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400',
    'Advanced': 'bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-400',
  }

  return (
    <div className="w-80 bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm border-l border-stone-200 dark:border-slate-700 overflow-y-auto animate-slide-in-right">
      {/* Header */}
      <div className="p-5 border-b border-stone-100 dark:border-slate-700/50">
        <div className="flex items-start justify-between mb-3">
          <span className={`inline-block px-2.5 py-1 rounded-lg text-xs font-medium ${levelStyles[node.level] || levelStyles['Beginner']}`}>
            {node.level}
          </span>
          {node.status === 'learned' && (
            <span className="text-2xl">🎉</span>
          )}
        </div>
        <h2 className="text-lg font-bold text-stone-800 dark:text-stone-100 leading-tight">
          {node.name}
        </h2>
        <p className="text-stone-500 dark:text-stone-400 text-sm mt-2 leading-relaxed">
          {node.description}
        </p>
      </div>

      {/* Resources */}
      {node.resources && node.resources.length > 0 && (
        <div className="p-5 border-b border-stone-100 dark:border-slate-700/50">
          <h3 className="font-semibold text-stone-700 dark:text-stone-200 mb-3 flex items-center gap-2">
            <span className="text-lg">📚</span> Resources
          </h3>
          <div className="space-y-2">
            {node.resources.map((r, i) => (
              <a
                key={i}
                href={r.url || '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-stone-50 dark:hover:bg-slate-700/50 transition-colors group"
              >
                <span className="text-base">{r.type === 'book' ? '📖' : '🌐'}</span>
                <span className="text-sm text-blue-600 dark:text-blue-400 group-hover:underline flex-1 leading-tight">
                  {r.title}
                </span>
                {r.author && (
                  <span className="text-xs text-stone-400">{r.author}</span>
                )}
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Prerequisite Info */}
      {node.prerequisites && node.prerequisites.length > 0 && (
        <div className="p-5 border-b border-stone-100 dark:border-slate-700/50">
          <h3 className="font-semibold text-stone-700 dark:text-stone-200 mb-2 flex items-center gap-2">
            <span className="text-lg">🔗</span> Prerequisites
          </h3>
          <p className="text-sm text-stone-500 dark:text-stone-400">
            Complete {node.prerequisites.length} prerequisite{node.prerequisites.length > 1 ? 's' : ''} first
          </p>
        </div>
      )}

      {/* Status badge */}
      <div className="p-5 border-b border-stone-100 dark:border-slate-700/50">
        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${
          node.status === 'locked'
            ? 'bg-stone-100 text-stone-500 dark:bg-slate-700 dark:text-stone-400'
            : node.status === 'available'
              ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400'
              : 'bg-green-100 text-green-600 dark:bg-green-900/50 dark:text-green-400'
        }`}>
          {node.status === 'locked' && '🔒 Locked'}
          {node.status === 'available' && '✨ Available'}
          {node.status === 'learned' && '✓ Learned'}
        </div>
      </div>

      {/* Actions */}
      <div className="p-5 space-y-3">
        {node.status === 'locked' ? (
          <div className="text-center py-6 bg-stone-50 dark:bg-slate-700/30 rounded-xl">
            <span className="text-3xl mb-2 block">🔒</span>
            <p className="text-stone-500 dark:text-stone-400 text-sm">Complete prerequisites first</p>
          </div>
        ) : node.status === 'available' ? (
          <>
            <button
              onClick={() => onDirectLight(node.id)}
              className="w-full py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-xl font-semibold transition-all hover:shadow-lg active:scale-[0.98]"
            >
              ✨ Mark as Learned
            </button>
            <button
              onClick={() => onQuiz(node)}
              className="w-full py-3 bg-white dark:bg-slate-700 border-2 border-purple-500 dark:border-purple-400 text-purple-600 dark:text-purple-300 rounded-xl font-semibold hover:bg-purple-50 dark:hover:bg-purple-900/30 transition-all"
            >
              📝 Take Quiz
            </button>
          </>
        ) : (
          <div className="text-center py-6 bg-green-50 dark:bg-green-900/30 rounded-xl">
            <span className="text-4xl mb-2 block">🎉</span>
            <p className="text-green-600 dark:text-green-400 font-semibold">Learned!</p>
            <button
              onClick={() => onQuiz(node)}
              className="mt-3 text-sm text-purple-600 dark:text-purple-400 hover:underline font-medium"
            >
              Try Again →
            </button>
          </div>
        )}
      </div>

      {/* Copy button */}
      <div className="p-5 pt-0">
        <button
          onClick={handleCopyDescription}
          className="w-full py-2.5 text-sm text-stone-500 dark:text-stone-400 border border-stone-200 dark:border-slate-600 rounded-xl hover:bg-stone-50 dark:hover:bg-slate-700/50 transition-colors"
        >
          {copied ? '✓ Copied!' : '📋 Copy Description'}
        </button>
      </div>
    </div>
  )
}
