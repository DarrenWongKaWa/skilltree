# 🌳 SkillTree - AI-Powered Skill Tree Learning Platform

An AI-driven interactive skill tree learning tool that helps you systematically plan your learning path.

![Next.js](https://img.shields.io/badge/Next.js-16.2-black)
![React](https://img.shields.io/badge/React-Flow-FF6B6B)
![MiniMax](https://img.shields.io/badge/AI-MiniMax-6366F1)

## ✨ Features

- **🤖 AI-Generated Skill Trees** - Enter any topic and AI automatically generates a complete knowledge graph
- **📚 Structured Learning Path** - Clear prerequisite dependencies, from beginner to expert
- **❓ Smart Quiz** - Click on nodes to generate targeted practice questions
- **🎯 Node Status Tracking** - Mark mastery levels and track learning progress
- **📱 Responsive Design** - Works on mobile, tablet, and desktop

## 🛠️ Tech Stack

- **Framework**: Next.js 16 (App Router)
- **UI Components**: React Flow (flowchart visualization)
- **State Management**: Zustand
- **Styling**: Tailwind CSS
- **AI Model**: MiniMax-M2.7

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

## 🎨 Interface Preview

```
┌─────────────────────────────────────────────┐
│  🔍 Enter learning topic...      [Generate] │
├─────────────────────────────────────────────┤
│                                             │
│              ┌─────┐                        │
│              │ Root │                       │
│              └──┬──┘                        │
│           ┌─────┼─────┐                     │
│        ┌──┴──┐    ┌──┴──┐                   │
│        │Child │    │Child │                  │
│        └──┬──┘    └──┬──┘                   │
│           │          │                      │
│        ┌──┴──┐    ┌──┴──┐                   │
│        │ Leaf │    │ Leaf │                 │
│        └─────┘    └─────┘                   │
│                                             │
└─────────────────────────────────────────────┘
```

## 📝 Project Structure

```
skill-tree/
├── app/
│   ├── api/
│   │   ├── generate/    # AI skill tree generation API
│   │   ├── quiz/      # AI quiz generation API
│   │   └── evaluate/   # Answer evaluation API
│   ├── page.tsx       # Homepage
│   └── tree/[id]/     # Skill tree detail page
├── components/
│   ├── TreeView.tsx      # Skill tree visualization
│   ├── SkillNode.tsx    # Node component
│   ├── NodeDetail.tsx   # Node detail sidebar
│   ├── QuizModal.tsx    # Quiz modal
│   ├── ThemeProvider.tsx # Theme context
│   └── ThemeToggle.tsx   # Theme toggle button
├── store/
│   └── index.ts          # Zustand state management
└── types/
    └── index.ts          # TypeScript type definitions
```

## 🔧 Development

```bash
# Install dependencies
npm install

# Development mode
npm run dev

# Build for production
npm run build

# Run production build
npm start
```

## 📄 License

MIT
