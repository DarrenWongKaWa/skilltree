import type { Metadata, Viewport } from 'next'
import { ThemeProvider } from '@/components/ThemeProvider'
import './globals.css'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  userScalable: false,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#fafcfa' },
    { media: '(prefers-color-scheme: dark)', color: '#0f1914' },
  ],
}

export const metadata: Metadata = {
  title: 'SkillTree - Ancient Serenity | AI Skill Tree Learning',
  description: 'AI-powered interactive skill tree learning platform for systematic learning path planning',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'SkillTree',
  },
  icons: {
    icon: '/favicon.ico',
    apple: [
      { url: '/apple-touch-icon.svg', sizes: '180x180', type: 'image/svg+xml' },
    ],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Noto+Serif:wght@400;600;700&family=Ma+Shan+Zheng&display=swap" rel="stylesheet" />
      </head>
      <body className="antialiased">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  )
}
