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
      <div className="w-80 bg-[rgb(var(--card))] border-l border-[rgb(var(--border))] flex items-center justify-center shadow-[inset_4px_0_12px_rgba(0,0,0,0.03)]">
        <div className="text-center px-6">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[rgb(var(--secondary))] flex items-center justify-center">
            <span className="text-3xl" style={{ fontFamily: 'var(--font-brush-chinese)' }}>◈</span>
          </div>
          <p className="text-[rgb(var(--muted-foreground))] text-sm">Select a node to view details</p>
        </div>
      </div>
    )
  }

  const handleCopyDescription = () => {
    navigator.clipboard.writeText(node.description)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  // Lime color scheme for levels
  const levelStyles: Record<string, string> = {
    'Beginner': 'bg-[rgb(var(--lime-bright-bg))] text-[rgb(var(--lime-dark))] dark:bg-[rgb(var(--lime-bright-bg))] dark:text-[rgb(var(--lime-bright))]',
    'Intermediate': 'bg-[rgb(var(--lime-medium-bg))] text-[rgb(var(--lime-dark))] dark:bg-[rgb(var(--lime-medium-bg))] dark:text-[rgb(var(--lime-medium))]',
    'Advanced': 'bg-[rgb(var(--lime-dark-bg))] text-[rgb(var(--lime-dark))] dark:bg-[rgb(var(--lime-dark-bg))] dark:text-[rgb(var(--lime-dark))]',
  }

  return (
    <div className="w-80 bg-[rgb(var(--card))] border-l border-[rgb(var(--border))] overflow-y-auto animate-slide-in-right shadow-[inset_4px_0_12px_rgba(0,0,0,0.03)]">
      {/* Header - scroll banner style */}
      <div className="p-5 border-b border-[rgb(var(--border))] bg-[rgb(var(--secondary))]/30">
        <div className="flex items-start justify-between mb-3">
          <span className={`inline-block px-2.5 py-1 rounded-lg text-xs font-medium ${levelStyles[node.level] || levelStyles['Beginner']}`}>
            {node.level}
          </span>
          {node.status === 'learned' && (
            <span className="text-[rgb(var(--lime-medium))] text-xl font-bold">✓</span>
          )}
        </div>
        <h2 className="text-lg font-bold text-[rgb(var(--foreground))] leading-tight" style={{ fontFamily: "'Noto Serif', Georgia, serif" }}>
          {node.name}
        </h2>
        <p className="text-[rgb(var(--muted-foreground))] text-sm mt-2 leading-relaxed">
          {node.description}
        </p>
      </div>

      {/* Resources */}
      {node.resources && node.resources.length > 0 && (
        <div className="p-5 border-b border-[rgb(var(--border))]">
          <h3 className="font-semibold text-[rgb(var(--foreground))] mb-3 flex items-center gap-2" style={{ fontFamily: "'Noto Serif', Georgia, serif" }}>
            <span className="text-[rgb(var(--accent))]">◆</span> Resources
          </h3>
          <div className="space-y-2">
            {node.resources.map((r, i) => (
              <a
                key={i}
                href={r.url || '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-[rgb(var(--secondary))]/50 transition-colors group"
              >
                <span className="text-base text-[rgb(var(--accent))]">{r.type === 'book' ? '▤' : '◇'}</span>
                <span className="text-sm text-[rgb(var(--primary))] group-hover:underline flex-1 leading-tight">
                  {r.title}
                </span>
                {r.author && (
                  <span className="text-xs text-[rgb(var(--muted-foreground))]">{r.author}</span>
                )}
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Prerequisite Info */}
      {node.prerequisites && node.prerequisites.length > 0 && (
        <div className="p-5 border-b border-[rgb(var(--border))]">
          <h3 className="font-semibold text-[rgb(var(--foreground))] mb-2 flex items-center gap-2" style={{ fontFamily: "'Noto Serif', Georgia, serif" }}>
            <span className="text-[rgb(var(--accent))]">◇</span> Prerequisites
          </h3>
          <p className="text-sm text-[rgb(var(--muted-foreground))]">
            Complete {node.prerequisites.length} prerequisite{node.prerequisites.length > 1 ? 's' : ''} first
          </p>
        </div>
      )}

      {/* Status badge */}
      <div className="p-5 border-b border-[rgb(var(--border))]">
        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${
          node.status === 'locked'
            ? 'bg-[rgb(var(--muted))] text-[rgb(var(--muted-foreground))]'
            : node.status === 'available'
              ? 'bg-[rgb(var(--lime-medium-bg))] text-[rgb(var(--lime-medium))]'
              : 'bg-[rgb(var(--lime-bright-bg))] text-[rgb(var(--lime-medium))]'
        }`}>
          {node.status === 'locked' && '○ Locked'}
          {node.status === 'available' && '◉ Available'}
          {node.status === 'learned' && '✓ Mastered'}
        </div>
      </div>

      {/* Actions */}
      <div className="p-5 space-y-3">
        {node.status === 'locked' ? (
          <div className="text-center py-6 bg-[rgb(var(--secondary))]/30 rounded-xl">
            <span className="text-[rgb(var(--muted-foreground))] text-2xl mb-2 block">○</span>
            <p className="text-[rgb(var(--muted-foreground))] text-sm">Complete prerequisites to unlock</p>
          </div>
        ) : node.status === 'available' ? (
          <>
            <button
              onClick={() => onDirectLight(node.id)}
              className="w-full py-3 bg-[rgb(var(--primary))] hover:bg-[rgb(var(--primary))]/90 text-[rgb(var(--primary-foreground))] rounded-xl font-semibold transition-all hover:shadow-lg active:scale-[0.98] border border-[rgb(var(--border))]"
              style={{ fontFamily: "'Noto Serif', Georgia, serif" }}
            >
              ◉ Mark as Mastered
            </button>
            <button
              onClick={() => onQuiz(node)}
              className="w-full py-3 bg-[rgb(var(--card))] border-2 border-[rgb(var(--accent))] text-[rgb(var(--accent))] rounded-xl font-semibold hover:bg-[rgb(var(--accent))]/10 transition-all"
            >
              ◇ Take Quiz
            </button>
          </>
        ) : (
          <div className="text-center py-6 bg-[rgb(var(--lime-bright-bg))]/50 rounded-xl">
            <span className="text-[rgb(var(--lime-medium))] text-3xl mb-2 block font-bold">✓</span>
            <p className="text-[rgb(var(--lime-medium))] font-semibold">Mastered!</p>
            <button
              onClick={() => onQuiz(node)}
              className="mt-3 text-sm text-[rgb(var(--accent))] hover:underline font-medium"
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
          className="w-full py-2.5 text-sm text-[rgb(var(--muted-foreground))] border border-[rgb(var(--border))] rounded-xl hover:bg-[rgb(var(--secondary))]/50 transition-colors"
        >
          {copied ? '✓ Copied!' : '◇ Copy Description'}
        </button>
      </div>
    </div>
  )
}
