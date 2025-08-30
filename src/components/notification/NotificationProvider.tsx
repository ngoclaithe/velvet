"use client"

import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react'
import type { MqttClient } from 'mqtt'
import { connectMqtt, subscribeTopic } from '@/lib/mqttClient'
import { useAuth } from '@/hooks/useAuth'

export interface AppNotification {
  id: string
  type: string
  title?: string
  message?: string
  data?: any
  topic?: string
  read?: boolean
  receivedAt: number
}

interface IncomingCallInfo {
  conversationId?: string
  callRoomId?: string
  callType?: 'audio' | 'video'
  mqttTopic?: string
}

interface NotificationContextValue {
  notifications: AppNotification[]
  unreadCount: number
  latestIncomingCall: IncomingCallInfo | null
  clearIncomingCall: () => void
}

const NotificationContext = createContext<NotificationContextValue | undefined>(undefined)

export function useNotification() {
  const ctx = useContext(NotificationContext)
  if (!ctx) throw new Error('useNotification must be used within NotificationProvider')
  return ctx
}

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, user } = useAuth()
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const [incoming, setIncoming] = useState<IncomingCallInfo | null>(null)
  const mqttRef = useRef<MqttClient | null>(null)

  const unreadCount = useMemo(() => notifications.filter(n => !n.read).length, [notifications])

  useEffect(() => {
    let mounted = true
    const setup = async () => {
      if (!isAuthenticated || !user?.id) return
      const client = await connectMqtt()
      if (!client) return
      mqttRef.current = client
      const topics = [`notifications/${user.id}`, `noti/${user.id}`]
      await Promise.all(topics.map(t => subscribeTopic(t)))
      const onMsg = (topic: string, payload: Buffer) => {
        if (!mounted) return
        try {
          const raw = payload.toString('utf-8')
          const data = JSON.parse(raw)
          const type = String(data?.type || 'info')
          const note: AppNotification = {
            id: `${Date.now()}_${Math.random().toString(16).slice(2)}`,
            type,
            title: data?.title,
            message: data?.message,
            data: data?.data,
            topic,
            read: false,
            receivedAt: Date.now(),
          }
          setNotifications(prev => [note, ...prev].slice(0, 50))

          const media = (data?.mediaType || data?.callType || data?.data?.mediaType || data?.data?.callType || '').toString().toLowerCase()
          const isCall = type === 'call' || media === 'audio' || media === 'video'
          if (isCall) {
            const p = data?.data || {}
            setIncoming({
              conversationId: (p.conversationId || p.conversation?.id)?.toString?.(),
              callRoomId: p.callRoomId || p.roomId,
              callType: (p.callType || p.mediaType || 'video').toLowerCase(),
              mqttTopic: p.topic || data?.mqttTopic || topic,
            })
          }
        } catch {}
      }
      client.on('message', onMsg)
      return () => { try { client.off('message', onMsg as any) } catch {} }
    }
    const cleanup = setup()
    return () => { (async () => { await cleanup })(); mounted = false }
  }, [isAuthenticated, user?.id])

  const value: NotificationContextValue = {
    notifications,
    unreadCount,
    latestIncomingCall: incoming,
    clearIncomingCall: () => setIncoming(null),
  }

  return (
    <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>
  )
}
