# 🌳 SkillTree - AI 驱动的技能树学习平台

一个基于 AI 的交互式技能树学习工具，帮助你系统化地规划学习路径。

![Next.js](https://img.shields.io/badge/Next.js-16.2-black)
![React](https://img.shields.io/badge/React-Flow-FF6B6B)
![MiniMax](https://img.shields.io/badge/AI-MiniMax-6366F1)

## ✨ 功能特点

- **🤖 AI 生成技能树** - 输入任意主题，AI 自动生成完整的知识图谱
- **📚 结构化学习路径** - 清晰的前置依赖关系，从入门到精通
- **❓ 智能Quiz** - 点击节点即可生成针对性练习题
- **🎯 节点状态追踪** - 标记掌握程度，追踪学习进度
- **📱 响应式设计** - 支持手机、平板、电脑多端访问

## 🛠️ 技术栈

- **框架**: Next.js 16 (App Router)
- **UI 组件**: React Flow (流程图可视化)
- **状态管理**: Zustand
- **样式**: Tailwind CSS
- **AI 模型**: MiniMax-M2.7

## 🚀 快速部署

### 1. 环境变量配置

在 Vercel 或本地 `.env.local` 中设置：

```env
MINIMAX_API_KEY=your_api_key
MINIMAX_BASE_URL=https://api.minimaxi.com/v1
```

### 2. 本地运行

```bash
git clone https://github.com/DarrenWongKaWa/skilltree.git
cd skilltree
npm install
npm run dev
```

访问 http://localhost:3000

### 3. Vercel 部署

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/DarrenWongKaWa/skilltree)

## 📖 使用指南

1. **生成技能树** - 在首页输入想学习的主题（如"Python"、"机器学习"）
2. **探索知识图谱** - 缩放、拖拽节点查看完整结构
3. **开始学习** - 点击节点查看详情和资源推荐
4. **测试掌握** - 使用 Quiz 功能检验学习效果
5. **标记进度** - 点击节点标记为"已学"

## 🎨 界面预览

```
┌─────────────────────────────────────────────┐
│  🔍 输入学习主题...              [生成]    │
├─────────────────────────────────────────────┤
│                                             │
│              ┌─────┐                        │
│              │ 根节点 │                       │
│              └──┬──┘                        │
│           ┌─────┼─────┐                     │
│        ┌──┴──┐    ┌──┴──┐                   │
│        │子节点│    │子节点│                  │
│        └──┬──┘    └──┬──┘                   │
│           │          │                      │
│        ┌──┴──┐    ┌──┴──┐                   │
│        │叶节点│    │叶节点│                  │
│        └─────┘    └─────┘                   │
│                                             │
└─────────────────────────────────────────────┘
```

## 📝 项目结构

```
skill-tree/
├── app/
│   ├── api/
│   │   ├── generate/    # AI 生成技能树 API
│   │   ├── quiz/        # AI 出题 API
│   │   └── evaluate/    # 答案评估 API
│   ├── page.tsx         # 首页
│   └── tree/[id]/       # 技能树详情页
├── components/
│   ├── TreeView.tsx      # 技能树可视化
│   ├── SkillNode.tsx     # 节点组件
│   └── QuizModal.tsx     # Quiz 弹窗
├── store/
│   └── index.ts          # Zustand 状态管理
└── types/
    └── index.ts          # TypeScript 类型定义
```

## 🔧 开发

```bash
# 安装依赖
npm install

# 开发模式
npm run dev

# 构建生产版本
npm run build

# 运行生产版本
npm start
```

## 📄 License

MIT
