'use client'

import { memo, useState } from 'react'
import type { SkillNodeData } from '@/types'

interface SkillListSidebarProps {
  nodes: SkillNodeData[]
  selectedNodeId: string | null
  onNodeSelect: (node: SkillNodeData) => void
  progress: number // 0-100, affects background style
}

const levelOrder = ['Beginner', 'Intermediate', 'Advanced'] as const

function SkillListSidebar({ nodes, selectedNodeId, onNodeSelect, progress }: SkillListSidebarProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterLevel, setFilterLevel] = useState<string | null>(null)
  const [filterStatus, setFilterStatus] = useState<string | null>(null)
  const [isCollapsed, setIsCollapsed] = useState(false)

  // Group nodes by level
  const groupedNodes = nodes.reduce((acc, node) => {
    if (!acc[node.level]) {
      acc[node.level] = []
    }
    acc[node.level].push(node)
    return acc
  }, {} as Record<string, SkillNodeData[]>)

  // Filter nodes
  const filteredNodes = nodes.filter(node => {
    const matchesSearch = node.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          node.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesLevel = !filterLevel || node.level === filterLevel
    const matchesStatus = !filterStatus || node.status === filterStatus
    return matchesSearch && matchesLevel && matchesStatus
  })

  // Determine background theme based on progress
  const getBackgroundTheme = () => {
    if (progress < 30) {
      return 'forest-theme' // Primitive forest
    } else if (progress < 70) {
      return 'transition-theme' // Mixed
    } else {
      return 'cyberpunk-theme' // Cyberpunk
    }
  }

  const backgroundTheme = getBackgroundTheme()

  return (
    <div className={`skill-sidebar ${backgroundTheme} h-full flex flex-col border-r border-[rgb(var(--border))] transition-all duration-300 ease-in-out ${isCollapsed ? 'w-12' : 'w-72'}`}>
      {/* Collapse Toggle Button */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute top-20 -right-3 z-30 w-6 h-6 rounded-full bg-[rgb(var(--card))] border border-[rgb(var(--border))] flex items-center justify-center shadow-md hover:bg-[rgb(var(--secondary))] transition-colors"
      >
        <svg
          className={`w-3 h-3 text-[rgb(var(--muted-foreground))] transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      {/* Header - Hidden when collapsed */}
      {!isCollapsed && (
        <div className="p-4 border-b border-[rgb(var(--border))]">
          <h2 className="text-lg font-semibold text-[rgb(var(--foreground))] mb-3 flex items-center gap-2"
              style={{ fontFamily: "'Noto Serif', Georgia, serif" }}>
            <span className="text-xl">🌿</span>
            Skill List
          </h2>

          {/* Search */}
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search skills..."
              className="w-full px-3 py-2 bg-[rgb(var(--background))] border border-[rgb(var(--border))] rounded-lg text-sm text-[rgb(var(--foreground))] placeholder:text-[rgb(var(--muted-foreground))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--lime-medium))]"
            />
            <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[rgb(var(--muted-foreground))]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          {/* Level Filter */}
          <div className="flex gap-2 mt-3">
            {levelOrder.map(level => (
              <button
                key={level}
                onClick={() => setFilterLevel(filterLevel === level ? null : level)}
                className={`px-2 py-1 text-xs rounded-full transition-all ${
                  filterLevel === level
                    ? 'bg-[rgb(var(--lime-medium))] text-white'
                    : 'bg-[rgb(var(--secondary))] text-[rgb(var(--muted-foreground))] hover:bg-[rgb(var(--lime-medium))]/30'
                }`}
              >
                {level}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Collapsed view - just show icons */}
      {isCollapsed && (
        <div className="flex flex-col items-center pt-4 gap-3">
          <span className="text-lg">🌿</span>
          <div className="flex flex-col gap-2">
            {levelOrder.map((level, idx) => (
              <span key={level} className="text-xs cursor-pointer" title={level}>
                {level === 'Beginner' ? '●' : level === 'Intermediate' ? '◆' : '▲'}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Progress indicator */}
      {!isCollapsed && (
        <div className="px-4 py-2 border-b border-[rgb(var(--border))] bg-[rgb(var(--background))]/50">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-[rgb(var(--muted-foreground))]">Overall Progress</span>
            <span className="font-medium text-[rgb(var(--lime-medium))]">{progress}%</span>
          </div>
          <div className="h-1.5 bg-[rgb(var(--secondary))] rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[rgb(var(--lime-medium))] to-[rgb(var(--lime-bright))] rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Skill List - Hidden when collapsed */}
      {!isCollapsed && (
        <div className="flex-1 overflow-y-auto">
        {levelOrder.map(level => {
          const levelNodes = filteredNodes.filter(n => n.level === level)
          if (levelNodes.length === 0) return null

          return (
            <div key={level} className="mb-2">
              <div className="px-4 py-2 bg-[rgb(var(--background))]/30">
                <h3 className="text-xs font-semibold text-[rgb(var(--muted-foreground))] uppercase tracking-wider flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${
                    level === 'Beginner' ? 'bg-[rgb(var(--lime-bright))]' :
                    level === 'Intermediate' ? 'bg-[rgb(var(--lime-medium))]' :
                    'bg-[rgb(var(--lime-dark))]'
                  }`} />
                  {level}
                  <span className="ml-auto text-[rgb(var(--muted))]">{levelNodes.length}</span>
                </h3>
              </div>

              <div className="px-2 py-1">
                {levelNodes.map(node => (
                  <button
                    key={node.id}
                    onClick={() => onNodeSelect(node)}
                    className={`w-full text-left px-3 py-2 rounded-lg mb-1 transition-all duration-300 ${
                      selectedNodeId === node.id
                        ? 'bg-[rgb(var(--lime-medium))]/20 border border-[rgb(var(--lime-medium))]/50'
                        : 'hover:bg-[rgb(var(--secondary))] border border-transparent'
                    } ${node.status === 'locked' ? 'opacity-50' : ''}`}
                  >
                    <div className="flex items-center gap-2">
                      {/* Status icon */}
                      <span className={`text-sm ${
                        node.status === 'learned' ? 'text-[rgb(var(--lime-medium))]' :
                        node.status === 'available' ? 'text-[rgb(var(--lime-bright))]' :
                        'text-[rgb(var(--muted))]'
                      }`}>
                        {node.status === 'learned' ? '✓' : node.status === 'available' ? '◆' : '◇'}
                      </span>
                      <span className={`text-sm font-medium truncate ${
                        node.status === 'locked'
                          ? 'text-[rgb(var(--muted-foreground))]'
                          : 'text-[rgb(var(--foreground))]'
                      }`}>
                        {node.name}
                      </span>
                    </div>
                    {selectedNodeId === node.id && (
                      <p className="text-xs text-[rgb(var(--muted-foreground))] mt-1 ml-5 line-clamp-2">
                        {node.description}
                      </p>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )
        })}

        {filteredNodes.length === 0 && (
          <div className="px-4 py-8 text-center text-[rgb(var(--muted-foreground))]">
            <span className="text-2xl mb-2 block">🔍</span>
            <p className="text-sm">No skills found</p>
          </div>
        )}
        </div>
      )}

      {/* Footer with stats - Hidden when collapsed */}
      {!isCollapsed && (
        <div className="p-4 border-t border-[rgb(var(--border))] bg-[rgb(var(--background))]/50">
          {/* Status filter labels */}
          <div className="flex justify-between text-xs mb-2">
            {(['learned', 'available', 'locked'] as const).map(status => (
              <button
                key={status}
                onClick={() => setFilterStatus(filterStatus === status ? null : status)}
                className={`flex items-center gap-1 px-2 py-1 rounded-full transition-all ${
                  filterStatus === status
                    ? status === 'learned' ? 'bg-[rgb(var(--lime-medium))] text-white' :
                      status === 'available' ? 'bg-[rgb(var(--lime-bright))] text-white' :
                      'bg-[rgb(var(--muted))] text-white'
                    : 'bg-[rgb(var(--secondary))] text-[rgb(var(--muted-foreground))] hover:bg-[rgb(var(--secondary))]/80'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${
                  status === 'learned' ? 'bg-[rgb(var(--lime-medium))]' :
                  status === 'available' ? 'bg-[rgb(var(--lime-bright))]' :
                  'bg-[rgb(var(--muted))]'
                } ${filterStatus === status ? 'bg-white' : ''}`} />
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
          {/* Stats numbers */}
          <div className="flex justify-between text-xs">
            <button
              onClick={() => setFilterStatus(filterStatus === 'learned' ? null : 'learned')}
              className={`flex-1 text-center py-1 rounded-lg transition-all ${
                filterStatus === 'learned' ? 'bg-[rgb(var(--lime-medium))]/20' : 'hover:bg-[rgb(var(--secondary))]/50'
              }`}
            >
              <div className="text-lg font-bold text-[rgb(var(--lime-medium))]">
                {nodes.filter(n => n.status === 'learned').length}
              </div>
              <div className="text-[rgb(var(--muted-foreground))] text-[10px]">Learned</div>
            </button>
            <button
              onClick={() => setFilterStatus(filterStatus === 'available' ? null : 'available')}
              className={`flex-1 text-center py-1 rounded-lg transition-all ${
                filterStatus === 'available' ? 'bg-[rgb(var(--lime-bright))]/20' : 'hover:bg-[rgb(var(--secondary))]/50'
              }`}
            >
              <div className="text-lg font-bold text-[rgb(var(--lime-bright))]">
                {nodes.filter(n => n.status === 'available').length}
              </div>
              <div className="text-[rgb(var(--muted-foreground))] text-[10px]">Available</div>
            </button>
            <button
              onClick={() => setFilterStatus(filterStatus === 'locked' ? null : 'locked')}
              className={`flex-1 text-center py-1 rounded-lg transition-all ${
                filterStatus === 'locked' ? 'bg-[rgb(var(--muted))]/20' : 'hover:bg-[rgb(var(--secondary))]/50'
              }`}
            >
              <div className="text-lg font-bold text-[rgb(var(--muted))]">
                {nodes.filter(n => n.status === 'locked').length}
              </div>
              <div className="text-[rgb(var(--muted-foreground))] text-[10px]">Locked</div>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default memo(SkillListSidebar)
