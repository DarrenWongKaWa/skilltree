# SkillTree - AI-Powered Skill Tree Learning Platform

An AI-driven interactive skill tree learning tool that helps you systematically plan your learning path.

![Next.js](https://img.shields.io/badge/Next.js-15-black)
![React](https://img.shields.io/badge/React-19-61DAFB)
![MiniMax](https://img.shields.io/badge/AI-MiniMax-6366F1)

## Features

- **AI-Generated Skill Trees** - Enter any topic and AI automatically generates a complete knowledge graph
- **Structured Learning Path** - Clear prerequisite dependencies, from beginner to expert
- **Smart Quiz** - Click on nodes to generate targeted practice questions
- **Node Status Tracking** - Mark mastery levels and track learning progress
- **Responsive Design** - Works on mobile, tablet, and desktop
- **Interactive Canvas** - Drag-to-pan, zoom (40%-200%), collapse/expand branches
- **Day/Night Theme** - Dynamic theme with forest-to-cyberpunk background evolution

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **UI**: Custom SVG canvas with fruit-style nodes
- **State Management**: Zustand
- **Styling**: Tailwind CSS
- **AI Model**: MiniMax-M2

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

1. **Generate Skill Tree** - Enter a topic you want to learn (e.g., "Python", "Machine Learning")
2. **Explore Knowledge Graph** - Zoom and drag nodes to view the complete structure
3. **Start Learning** - Click nodes to view details and resource recommendations
4. **Test Mastery** - Use Quiz to verify your learning
5. **Track Progress** - Click nodes to mark them as "learned"

## 🎨 Live Demo

**https://skill-tree-rosy.vercel.app**

## Project Structure

```
skilltree/
├── app/                          # Next.js App Router
│   ├── api/                      # Backend API routes
│   │   ├── generate/             # AI skill tree generation endpoint
│   │   │   └── route.ts
│   │   ├── quiz/                 # AI quiz generation endpoint
│   │   ├── evaluate/             # Answer evaluation endpoint
│   │   └── test/
│   ├── layout.tsx                # Root layout with theme provider
│   ├── page.tsx                  # Landing page
│   ├── globals.css               # Global styles + theme variables
│   └── tree/
│       └── [id]/
│           └── page.tsx          # Skill tree visualization page
├── components/
│   ├── TreeView.tsx              # Main tree page orchestrator
│   ├── SkillTreeCanvas.tsx       # Canvas viewport, pan/zoom, layout
│   ├── SkillNode.tsx             # Individual node (fruit) renderer
│   ├── TreeBranch.tsx            # SVG bezier curve branches
│   ├── SkillListSidebar.tsx      # Left sidebar with filtering
│   ├── BackgroundEvolution.tsx   # Dynamic background effect
│   ├── NodeDetail.tsx            # Node detail panel
│   ├── SkillNodeCard.tsx         # Card variant for nodes
│   ├── QuizModal.tsx             # Quiz dialog
│   ├── ThemeToggle.tsx           # Dark/light mode toggle
│   └── ThemeProvider.tsx         # Theme context provider
├── store/
│   └── index.ts                  # Zustand store (tree data + nodesMap)
├── lib/
│   └── api.ts                    # API client functions
├── types/
│   └── index.ts                  # TypeScript type definitions
└── package.json
```

## ⚙️ Development

```bash
# Clone repository
git clone https://github.com/DarrenWongKaWa/skilltree.git
cd skilltree

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Deploy to production
npm start
```

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
