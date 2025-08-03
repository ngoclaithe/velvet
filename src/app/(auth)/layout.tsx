import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Authentication - Streaming Platform',
  description: 'Login, register, and manage your account',
}

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-purple-900 dark:to-violet-900">
      <div className="w-full max-w-md p-6">
        {children}
      </div>
    </div>
  )
}
