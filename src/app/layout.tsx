import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import AuthProvider from '@/components/AuthProvider'
import { Toaster } from '@/components/ui/toaster'
import { NotificationProvider } from '@/components/notification/NotificationProvider'
import RootShell from '@/components/layout/RootShell'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'VelvetSocial - Mạng xã hội Adult 18+',
  description: 'Nền tảng mạng xã hội adult hàng đầu. Kết nối, chia sẻ và khám phá trong cộng đồng an toàn cho người từ 18 tuổi trở lên',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="vi">
      <body className={inter.className}>
        <AuthProvider>
          <NotificationProvider>
            <RootShell>
              {children}
            </RootShell>
            <Toaster />
          </NotificationProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
