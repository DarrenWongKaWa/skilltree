import type { Metadata } from 'next'
import { Noto_Serif, Ma_Shan_Zheng } from 'next/font/google'
import { ThemeProvider } from '@/components/ThemeProvider'
import './globals.css'

const notoSerif = Noto_Serif({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  variable: '--font-noto-serif',
  display: 'swap',
})

const maShanZheng = Ma_Shan_Zheng({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-brush-chinese',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'SkillTree - 古朴静谧 | AI Skill Tree Learning',
  description: 'AI-powered interactive skill tree learning platform for systematic learning path planning',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning className={`${notoSerif.variable} ${maShanZheng.variable}`}>
      <body className="antialiased">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  )
}
