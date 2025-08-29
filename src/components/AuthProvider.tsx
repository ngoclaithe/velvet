'use client'

import { useEffect, ReactNode } from 'react'
import { useAuthStore } from '@/store/authStore'
import { useHydration } from '@/hooks/useHydration'
import type { User } from '@/types/auth'
import { subscribeUserNotifications, unsubscribeAll, disconnectMqtt } from '@/lib/mqttClient'

// Default guest user
const guestUser: User = {
  id: 'guest',
  username: 'Guest',
  email: '',
  role: 'guest',
  isVerified: false,
  isOnline: true,
  createdAt: new Date(),
  updatedAt: new Date(),
}

interface AuthProviderProps {
  children: ReactNode
}

export default function AuthProvider({ children }: AuthProviderProps) {
  const isHydrated = useHydration()
  const { user, session } = useAuthStore()

  // Subscribe to per-user notifications when logged in
  useEffect(() => {
    const doSub = async () => {
      if (user && user.id && user.id !== 'guest') {
        await subscribeUserNotifications(user.id)
      }
    }
    doSub()

    return () => {
      // Cleanup on unmount/change
      unsubscribeAll()
    }
  }, [user?.id])

  // Disconnect on app unmount
  useEffect(() => {
    return () => {
      disconnectMqtt()
    }
  }, [])

  useEffect(() => {
    if (isHydrated && !user && !session) {
      // Set guest user only after hydration
      useAuthStore.setState({ user: guestUser })
    }
  }, [isHydrated, user, session])

  if (!isHydrated) {
    // Return loading state during hydration to prevent mismatch
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  return <>{children}</>
}
