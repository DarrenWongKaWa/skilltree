import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'SkillTree - 技能树学习引擎',
  description: '输入任何你想学习的主题，快速生成学习路径和技能树',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh">
      <body>{children}</body>
    </html>
  )
}
