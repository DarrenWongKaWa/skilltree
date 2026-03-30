# SkillTree - AI-Powered Skill Tree Learning Platform

An AI-driven interactive skill tree learning tool with GPU-optimized rendering and smooth bezier curve animations.

![Next.js](https://img.shields.io/badge/Next.js-16.2-black)
![React Flow](https://img.shields.io/badge/React%20Flow-12.10-blue)
![Dagre](https://img.shields.io/badge/Layout-Dagre-green)
![Zustand](https://img.shields.io/badge/State-Zustand-purple)

## Features

- **AI-Generated Skill Trees** - Enter any topic and AI automatically generates a complete knowledge graph
- **Interactive Canvas** - Drag-to-pan, zoom (15%-250%), collapse/expand branches with GPU-optimized bezier edges
- **Fluorescent Flow Animation** - Smooth flowing sap effect on learned edges, hardware-accelerated via stroke-dashoffset
- **BFS Collapse/Expand** - Recursively hide/show all descendants with instant feedback
- **Dagre Layout Engine** - Automatic hierarchical positioning (Bottom-to-Top) with symmetric centering
- **Node Status Tracking** - Learned / Available / Locked states with visual distinction
- **Smart Quiz** - Click nodes to generate targeted practice questions
- **Day/Night Theme** - Dynamic forest-themed color palette with seed nodes and lime accents
- **Responsive Design** - Mobile sidebar drawer, touch-friendly controls

## Tech Stack

- **Framework**: Next.js 16.2 (App Router, Turbopack)
- **Canvas**: @xyflow/react v12 with custom edge types
- **Layout**: Dagre.js for hierarchical tree positioning
- **State Management**: Zustand with O(1) nodesMap lookups
- **Styling**: Tailwind CSS v4
- **AI Model**: MiniMax-M2

## Security & Validation

- **Input Validation**: All API endpoints validate request body schema
- **XSS Protection**: String sanitization on all user inputs
- **Rate Limiting Ready**: Client IP extraction for rate limiting
- **Type Safety**: Full TypeScript coverage with API request/response types

## Architecture

```
Layout Engine (Dagre)
  rankdir: 'BT' (Bottom-to-Top)
  nodesep: 120, ranksep: 220

Interaction (BFS Traversal)
  getAllDescendants() → Queue-based breadth-first search
  Hidden nodes/edges calculated on collapse

Rendering (React Flow)
  Custom treeEdge type with getBezierPath
  3-layer glow: ambient (12px) → neon halo (6px) → white core (1.5px)
  stroke-dashoffset animation: 2.5s linear infinite
```

## 🚀 Quick Start

### 1. Environment Setup

Set environment variables in Vercel or local `.env.local`:

```env
MINIMAX_API_KEY=your_api_key
MINIMAX_BASE_URL=https://api.minimaxi.com/v1
```

### 2. Local Development

```bash
git clone https://github.com/DarrenWongKaWa/skilltree.git
cd skilltree
npm install
npm run dev
```

Visit http://localhost:3000

### 3. Vercel Deployment

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/DarrenWongKaWa/skilltree)

## 📖 How to Use

1. **Generate Skill Tree** - Enter a topic (e.g., "Python", "Machine Learning")
2. **Explore Knowledge Graph** - Drag to pan, scroll to zoom, click nodes to select
3. **Collapse/Expand** - Click the minus icon on learned/available nodes to hide descendants
4. **Mark Mastery** - Click nodes to mark as learned (enables green flowing edges)
5. **Take Quizzes** - Click the quiz icon to test your knowledge

## 🎨 Live Demo

**https://skill-tree-rosy.vercel.app**

## Project Structure

```
skilltree/
├── app/
│   ├── api/
│   │   ├── generate/route.ts      # AI skill tree generation (Dagre layout)
│   │   ├── quiz/route.ts          # AI quiz generation
│   │   └── evaluate/route.ts      # Answer evaluation
│   ├── globals.css                # Theme variables, edgeFlow animation
│   ├── layout.tsx                 # Root layout with theme
│   ├── page.tsx                   # Landing page
│   └── tree/[id]/page.tsx        # Skill tree visualization
├── components/
│   ├── SkillTreeFlow.tsx          # React Flow canvas + Dagre layout
│   ├── SkillNodeFlow.tsx          # Custom node with collapse/expand
│   ├── TreeEdge.tsx               # Custom bezier edge with glow layers
│   ├── SeedNode.tsx               # Root seed node component
│   └── SkillListSidebar.tsx       # Left sidebar with tree list
├── store/
│   └── index.ts                   # Zustand store (trees, nodesMaps, collapsedNodes)
└── types/
    └── index.ts                   # TypeScript definitions
```

## ⚙️ Performance Optimizations

- **No CSS Filters** - All glow effects via layered SVG paths (no `filter: drop-shadow`)
- **Euclidean Path Estimation** - Avoids expensive `getTotalLength()` during drag
- **Memoized Callbacks** - `useCallback` on MiniMap nodeColor
- **Local Collapse State** - Immediate toggle before parent state update
- **`nodesFocusable={false}`** - Eliminates focus outline repaints during drag
- **React.memo & useMemo** - Minimizes unnecessary re-renders

## ♿ Accessibility

- **ARIA Labels** - Full screen reader support on all interactive nodes
- **Focus Indicators** - Visible focus rings for keyboard navigation
- **Semantic HTML** - Proper button elements and ARIA states

## 📜 License

MIT License
