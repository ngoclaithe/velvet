import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { cn } from '@/lib/utils'
// import { Toaster } from '@/components/ui/toaster'

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' })

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export const metadata: Metadata = {
  title: 'Streaming Platform',
  description: 'A modern streaming platform with live video, chat, and social features',
  keywords: ['streaming', 'live video', 'chat', 'social media'],
  authors: [{ name: 'Streaming Platform Team' }],
  openGraph: {
    title: 'Streaming Platform',
    description: 'A modern streaming platform with live video, chat, and social features',
    type: 'website',
    siteName: 'Streaming Platform',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Streaming Platform',
    description: 'A modern streaming platform with live video, chat, and social features',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn(
        'min-h-screen bg-background font-sans antialiased',
        inter.variable
      )}>
        {children}
        <Toaster />
      </body>
    </html>
  )
}
