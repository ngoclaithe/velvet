"use client"

import { useState, useRef, useEffect, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'

import { Icons } from '@/components/common/Icons'
import { chatApi } from '@/lib/api/chat'
import { subscribeTopic, connectMqtt, publishTopic } from '@/lib/mqttClient'
import { getConversationById } from '@/lib/api/conversation'

import ImageUploader from '@/components/ImageUploader'
import {
  MessageCircle,
  Send,
  Search,
  Plus,
  MoreVertical,
  Phone,
  Video,
  Image,
  Smile,
  CheckCheck,
  Loader,
  AlertCircle,
  PhoneOff,
  Mic,
  MicOff
} from 'lucide-react'
import { format, isToday, isYesterday, isThisWeek } from 'date-fns'
import { vi } from 'date-fns/locale'
import { CallProvider, useCall } from '@/components/call/CallProvider'
import { useNotification } from '@/components/notification/NotificationProvider'
import IncomingCallModal from '@/components/IncomingCallModal'

interface User {
  id: string
  username: string
  avatar?: string
  isOnline: boolean
  lastSeen?: Date
}

interface Message {
  id: string
  senderId: string
  receiverId: string
  content: string
  type: 'text' | 'image' | 'file'
  timestamp: Date
  isRead: boolean
  isDelivered: boolean
}

interface Conversation {
  id: string
  participants: User[]
  lastMessage?: Message
  unreadCount: number
  isPinned: boolean
  isArchived: boolean
  updatedAt: Date
}

function MessagesInner() {
  const { user, session, isLoading: authLoading, isAuthenticated } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const call = useCall()
  const { latestIncomingCall, clearIncomingCall } = useNotification()

  const [conversations, setConversations] = useState<any[]>([])
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null)
  const [selectedConversation, setSelectedConversation] = useState<any | null>(null)
  const [messageInput, setMessageInput] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [isNewMessageDialogOpen, setIsNewMessageDialogOpen] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const [messagesByConv, setMessagesByConv] = useState<Record<string, any[]>>({})
  const [showImageUpload, setShowImageUpload] = useState(false)
  const [showEmojiPad, setShowEmojiPad] = useState(false)
  const quickIcons = ['😀','😂','❤️','👍','🔥']
  const seenMsgKeysRef = useRef<Map<string, number>>(new Map())
  const lastConvRef = useRef<string | null>(null)
  const lastCountRef = useRef<number>(0)

  // scroll / pagination state for messages view
  const [loadingOlder, setLoadingOlder] = useState(false)
  const [hasMoreOlder, setHasMoreOlder] = useState(true)

  useEffect(() => {
    if (!isAuthenticated) return
    chatApi.getConversations()
      .then((resp: any) => {
        if (resp?.success && resp.data) {
          const list = Array.isArray(resp.data.conversations) ? resp.data.conversations : (Array.isArray(resp.data) ? resp.data : [])
          setConversations(list)
          const qId = searchParams.get('conversationId')
          if (qId) {
            setSelectedConversationId(qId)
          } else if (list.length > 0) {
            setSelectedConversationId(list[0].id?.toString?.() || String(list[0].id))
          }
        }
      })
      .catch(() => {})
  }, [isAuthenticated, searchParams])

  useEffect(() => {
    if (!isAuthenticated || !selectedConversationId) {
      setSelectedConversation(null)
      return
    }
    const urlTopic = searchParams.get('mqttTopic') || undefined

    getConversationById(String(selectedConversationId))
      .then(async (resp: any) => {
        if (resp?.success && resp.data) {
          const payload = resp.data
          const conv = (payload as any).conversation || payload
          let topic: string | undefined = (conv as any)?.topic
          if (!topic && urlTopic) topic = urlTopic
          const merged = topic ? { ...conv, topic } : conv
          setSelectedConversation(merged)

          // Fetch historical messages for this conversation
          try {
            const convId = String(selectedConversationId || merged.id)
            const msgsResp: any = await chatApi.getConversation(convId)
            if (msgsResp?.success && msgsResp.data) {
              const list = Array.isArray(msgsResp.data.messages) ? msgsResp.data.messages : (Array.isArray(msgsResp.data) ? msgsResp.data : [])
              let normalized = list.map((m: any) => ({
                id: String(m.id),
                clientMessageId: undefined,
                senderId: String(m.sender?.id || m.senderId || ''),
                receiverId: String(m.receiver?.id || m.receiverId || ''),
                content: m.content || '',
                type: (m.messageType || 'text'),
                timestamp: new Date(m.createdAt || m.timestamp || Date.now()),
                isRead: false,
                isDelivered: true,
              }))
              // ensure messages are sorted oldest -> newest
              normalized.sort((a: any, b: any) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
              setMessagesByConv(prev => ({ ...prev, [convId]: normalized }))
            }
          } catch (e) {
            console.log('[MESSAGES] fetch conv messages error', e)
          }

          if (topic) {
            try {
              await subscribeTopic(topic)
              const client = await connectMqtt()
              const onMsg = (t: string, buf: Buffer) => {
                if (t !== topic) return
                try {
                  const data = JSON.parse(buf.toString('utf-8'))
                  if (data?.type === 'chat_message' && (data.conversationId?.toString?.() === selectedConversationId)) {
                    const contentStr = String(data.content || '').trim()
                    const key = String(data.messageId || data.clientMessageId || `${data.conversationId}:${data.senderId}:${contentStr}`)
                    const now = Date.now()
                    const seenAt = seenMsgKeysRef.current.get(key)
                    if (seenAt && now - seenAt < 6000) {
                      return
                    }
                    seenMsgKeysRef.current.set(key, now)
                    seenMsgKeysRef.current.forEach((ts, k) => { if (now - ts > 15000) seenMsgKeysRef.current.delete(k) })

                    setMessagesByConv(prev => {
                      const arr = prev[selectedConversationId] ? [...prev[selectedConversationId]] : []
                      const cid = data.clientMessageId ? String(data.clientMessageId) : undefined
                      const idCandidate = String(data.messageId || cid || `${data.timestamp || now}`)
                      let idx = cid ? arr.findIndex((m: any) => m.id === cid || m.clientMessageId === cid) : -1
                      if (idx < 0 && String(data.senderId || '') === String(user?.id)) {
                        const arrivedTs = Number(data.timestamp || now)
                        idx = arr.findIndex((m: any) => {
                          const mt = new Date(m.timestamp as any).getTime()
                          const within = Math.abs((arrivedTs || now) - (mt || now)) < 15000
                          const contentMatch = m.content === contentStr
                          const self = String(m.senderId) === String(user?.id)
                          return self && contentMatch && within
                        })
                      }
                      const msgObj = {
                        id: idCandidate,
                        clientMessageId: cid,
                        senderId: String(data.senderId || ''),
                        receiverId: '',
                        content: contentStr,
                        type: 'text',
                        timestamp: new Date(data.timestamp || now),
                        isRead: false,
                        isDelivered: true,
                      }
                      if (idx >= 0) {
                        arr[idx] = { ...arr[idx], ...msgObj }
                      } else {
                        arr.push(msgObj)
                      }
                      return { ...prev, [selectedConversationId!]: arr }
                    })
                  }
                } catch {}
              }
              client?.on('message', onMsg)

              return () => {
                try { client?.off('message', onMsg as any) } catch {}
              }
            } catch {}
          }
        }
      })
      .catch(() => setSelectedConversation(null))
  }, [isAuthenticated, selectedConversationId, searchParams, user?.id])

  // Removed receiver MQTT fallback; now sourced from NotificationProvider

  const getSelectedConversationData = () => selectedConversation as any
  const getMessagesForConversation = (conversationId: string) => messagesByConv[conversationId] || []

  const formatMessageTime = (date: Date) => {
    if (isToday(date)) return format(date, 'HH:mm')
    if (isYesterday(date)) return 'Hôm qua'
    if (isThisWeek(date)) return format(date, 'EEEE', { locale: vi })
    return format(date, 'dd/MM/yyyy')
  }
  const formatLastMessageTime = (date: Date) => {
    if (isToday(date)) return format(date, 'HH:mm')
    if (isYesterday(date)) return 'Hôm qua'
    return format(date, 'dd/MM')
  }

  const isImageUrl = (s: string) => {
    try {
      if (!s) return false
      const u = s.toString()
      return /^https?:\/\//.test(u) && /(\.png|\.jpe?g|\.webp|\.gif|cloudinary\.com\/.+\.(png|jpe?g|webp|gif))/i.test(u)
    } catch { return false }
  }

  const scrollToBottom = (instant = true) => {
    const el = messagesContainerRef.current
    if (el) {
      try {
        if (instant) el.scrollTop = el.scrollHeight
        else el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
      } catch {
        el.scrollTop = el.scrollHeight
      }
    } else {
      messagesEndRef.current?.scrollIntoView({ behavior: instant ? 'auto' : 'smooth' })
    }
  }

  const handleScroll = async (e: any) => {
    const el = e.currentTarget
    if (el.scrollTop <= 80 && !loadingOlder && hasMoreOlder && selectedConversationId) {
      // load older messages
      await loadOlderMessages()
    }
  }

  const loadOlderMessages = async () => {
    if (!selectedConversationId) return
    if (loadingOlder) return
    setLoadingOlder(true)
    try {
      const convId = String(selectedConversationId)
      const resp: any = await chatApi.getConversation(convId)
      if (resp?.success && resp.data) {
        const list = Array.isArray(resp.data.messages) ? resp.data.messages : (Array.isArray(resp.data) ? resp.data : [])
        const normalized = list.map((m: any) => ({
          id: String(m.id),
          clientMessageId: undefined,
          senderId: String(m.sender?.id || m.senderId || ''),
          receiverId: String(m.receiver?.id || m.receiverId || ''),
          content: m.content || '',
          type: (m.messageType || 'text'),
          timestamp: new Date(m.createdAt || m.timestamp || Date.now()),
          isRead: false,
          isDelivered: true,
        }))

        setMessagesByConv(prev => {
          const existing = prev[convId] || []
          // determine earliest timestamp we already have
          const earliestTs = existing.length > 0 ? new Date(existing[0].timestamp).getTime() : Infinity
          // keep only messages older than earliestTs
          const older = normalized.filter((m: any) => new Date(m.timestamp).getTime() < earliestTs)
          if (older.length === 0) {
            // if no older messages found, assume no more
            setHasMoreOlder(false)
            return prev
          }
          // sort older ascending
          older.sort((a: any, b: any) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())

          const container = messagesContainerRef.current
          const prevScrollHeight = container?.scrollHeight || 0

          const merged = [...older, ...existing]

          // after DOM update, adjust scroll so user's viewport stays at the same message
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              if (container) {
                const newScrollHeight = container.scrollHeight
                // keep view stable
                container.scrollTop = newScrollHeight - prevScrollHeight
              }
            })
          })

          return { ...prev, [convId]: merged }
        })
      }
    } catch (e) {
      console.log('[MESSAGES] loadOlderMessages error', e)
    } finally {
      setLoadingOlder(false)
    }
  }

  const currentMessages = useMemo(() => selectedConversationId ? (messagesByConv[selectedConversationId] || []) : [], [messagesByConv, selectedConversationId])

  // helper: group messages with date separators
  const groupedItems = useMemo(() => {
    const items: any[] = []
    let lastDateKey: string | null = null
    for (const m of currentMessages) {
      const d = new Date(m.timestamp)
      const key = d.toDateString()
      if (lastDateKey !== key) {
        // push date separator
        let label = ''
        if (isToday(d)) label = 'Hôm nay'
        else if (isYesterday(d)) label = 'Hôm qua'
        else label = format(d, 'dd/MM/yyyy')
        items.push({ type: 'date', id: `date-${key}`, label, date: d })
        lastDateKey = key
      }
      items.push({ type: 'msg', id: m.id, message: m })
    }
    return items
  }, [currentMessages])

  // scroll to bottom when switching conversations
  useEffect(() => {
    if (!selectedConversationId) return
    requestAnimationFrame(() => scrollToBottom(true))
    lastConvRef.current = selectedConversationId
    lastCountRef.current = (messagesByConv[selectedConversationId] || []).length
  }, [selectedConversationId])

  useEffect(() => {
    if (selectedConversationId !== lastConvRef.current) {
      lastConvRef.current = selectedConversationId
      lastCountRef.current = currentMessages.length
      return
    }
    if (currentMessages.length > lastCountRef.current) {
      const last = currentMessages[currentMessages.length - 1]
      const el = messagesContainerRef.current
      const nearBottom = () => {
        if (!el) return true
        const threshold = 120
        return el.scrollHeight - el.scrollTop - el.clientHeight < threshold
      }
      if (String(last?.senderId) === String(user?.id) || nearBottom()) {
        requestAnimationFrame(() => scrollToBottom())
      }
      lastCountRef.current = currentMessages.length
    }
  }, [currentMessages.length, selectedConversationId, user?.id])

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !selectedConversation) return

    const conversationId = selectedConversationId as string
    const content = messageInput.trim()
    const topic = (selectedConversation as any)?.topic as string | undefined
    const clientMessageId = `c:${user?.id}:${Date.now()}:${Math.random().toString(16).slice(2)}`

    const optimisticMsg = {
      id: clientMessageId,
      clientMessageId,
      senderId: String(user?.id || ''),
      receiverId: '',
      content,
      type: isImageUrl(content) ? 'image' : 'text',
      timestamp: new Date(),
      isRead: false,
      isDelivered: false,
      status: 'sending',
    }
    setMessagesByConv(prev => {
      const arr = prev[conversationId] ? [...prev[conversationId]] : []
      arr.push(optimisticMsg)
      return { ...prev, [conversationId]: arr }
    })

    // scroll to bottom for optimistic message
    requestAnimationFrame(() => scrollToBottom(false))

    setMessageInput('')
    setIsSending(true)
    try {
      const resp = await chatApi.sendDirectMessage(conversationId, { content, clientMessageId })
      if (resp?.success) {
        setMessagesByConv(prev => {
          const arr = prev[conversationId] ? [...prev[conversationId]] : []
          const idx = arr.findIndex((m: any) => m.id === clientMessageId || m.clientMessageId === clientMessageId)
          if (idx >= 0) arr[idx] = { ...arr[idx], status: 'sent', isDelivered: true }
          return { ...prev, [conversationId]: arr }
        })
        if (topic) {
          try {
            await publishTopic(topic, { type: 'chat_message', conversationId, senderId: user?.id, content, timestamp: Date.now(), clientMessageId })
          } catch {}
        }
      } else {
        setMessagesByConv(prev => {
          const arr = prev[conversationId] ? [...prev[conversationId]] : []
          const idx = arr.findIndex((m: any) => m.id === clientMessageId || m.clientMessageId === clientMessageId)
          if (idx >= 0) arr[idx] = { ...arr[idx], status: 'error' }
          return { ...prev, [conversationId]: arr }
        })
      }
    } catch (error) {
      setMessagesByConv(prev => {
        const arr = prev[conversationId] ? [...prev[conversationId]] : []
        const idx = arr.findIndex((m: any) => m.id === clientMessageId || m.clientMessageId === clientMessageId)
        if (idx >= 0) arr[idx] = { ...arr[idx], status: 'error' }
        return { ...prev, [conversationId]: arr }
      })
    } finally {
      setIsSending(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const filteredConversations = useMemo(() => {
    const list = conversations
    if (!searchQuery) return list
    return list.filter((conv: any) => {
      const participant: any = conv.otherUser || (conv.participants && conv.participants[0])
      const name = participant?.username || participant?.displayName || ''
      return name.toLowerCase().includes(searchQuery.toLowerCase())
    })
  }, [conversations, searchQuery])

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login')
    }
  }, [authLoading, isAuthenticated, router])

  const callRoomIdParam = searchParams.get('callRoomId')
  const incoming = searchParams.get('incoming')
  const callTypeParam = (searchParams.get('callType') || (latestIncomingCall?.callType || 'video')).toLowerCase() as 'audio' | 'video'
  const effectiveCallRoomId = callRoomIdParam || latestIncomingCall?.callRoomId || null
  const shouldShowIncoming = (!!incoming && !!effectiveCallRoomId && call.state.status === 'idle') || (!!latestIncomingCall && call.state.status === 'idle' && (!incoming))
  useEffect(() => { console.log('[MESSAGES] params', { callRoomIdParam, incoming, callTypeParam, latestIncomingCall, effectiveCallRoomId, shouldShowIncoming }); }, [callRoomIdParam, incoming, callTypeParam, latestIncomingCall, effectiveCallRoomId, shouldShowIncoming])

  if (authLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <Icons.spinner className="h-8 w-8 animate-spin" />
        </div>
      </div>
    )
  }
  if (!isAuthenticated) return null

  const initiateCall = async (type: 'audio' | 'video') => {
    if (!selectedConversationId) return
    await call.initiateCall(type, String(selectedConversationId))
  }

  const acceptIncoming = async () => {
    console.log('[MESSAGES] acceptIncoming click', { callRoomIdParam, callTypeParam })
    const roomId = effectiveCallRoomId
    if (roomId) {
      await call.acceptCall(roomId, callTypeParam)
      clearIncomingCall()
    }
  }
  const rejectIncoming = () => {
    console.log('[MESSAGES] rejectIncoming click', { callRoomIdParam })
    const roomId = effectiveCallRoomId
    if (roomId) {
      call.rejectCall(roomId)
      clearIncomingCall()
    }
  }

  return (
    <div className="container mx-auto p-4 max-w-7xl">
      <Card className="h-[80vh] flex">
        <div className="hidden md:block md:w-1/3 border-r">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Tin nhắn</h2>
              <Dialog open={isNewMessageDialogOpen} onOpenChange={setIsNewMessageDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="icon" variant="outline">
                    <Plus className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Tin nhắn mới</DialogTitle>
                    <DialogDescription>
                      Tìm và nhắn tin cho người dùng khác
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <Input placeholder="Tìm người dùng..." />
                    <div className="space-y-2"></div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Tìm cuộc trò chuyện..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[calc(80vh-140px)]">
              <div className="space-y-1 p-3">
                {filteredConversations.map((conversation: any) => {
                  const participant: any = conversation.otherUser || (conversation.participants && conversation.participants[0])
                  const isSelected = selectedConversationId === (conversation.id?.toString?.() || String(conversation.id))
                  const displayName = participant?.displayName || participant?.username || 'Người dùng'
                  const avatar = participant?.avatar
                  return (
                    <div
                      key={conversation.id}
                      onClick={() => setSelectedConversationId(conversation.id?.toString?.() || String(conversation.id))}
                      className={`p-3 rounded-lg cursor-pointer transition-colors ${
                        isSelected ? 'bg-primary/10' : 'hover:bg-gray-100'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="relative">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={avatar} />
                            <AvatarFallback>{displayName.charAt(0).toUpperCase()}</AvatarFallback>
                          </Avatar>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <p className="font-medium truncate">{displayName}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </ScrollArea>
          </CardContent>
        </div>

        <div className="flex-1 flex flex-col min-h-0">
          {selectedConversationId ? (
            <>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={(getSelectedConversationData() as any)?.otherUser?.avatar || (getSelectedConversationData() as any)?.participants?.[0]?.avatar} />
                      <AvatarFallback>
                        {(getSelectedConversationData() as any)?.otherUser?.username?.charAt(0)?.toUpperCase() || (getSelectedConversationData() as any)?.participants?.[0]?.username?.charAt(0)?.toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold">{(getSelectedConversationData() as any)?.otherUser?.username || (getSelectedConversationData() as any)?.participants?.[0]?.username || 'Cuộc trò chuyện'}</h3>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button size="icon" variant="ghost" onClick={() => initiateCall('audio')} disabled={call.state.status !== 'idle'}>
                      <Phone className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => initiateCall('video')} disabled={call.state.status !== 'idle'}>
                      <Video className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <Separator />

              <CardContent className="flex-1 p-0 min-h-0 overflow-hidden">
                {/* Incoming calls are handled by the overlay modal */}
                <IncomingCallModal />

                {call.state.status !== 'idle' && (
                  <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
                    <div className="w-full max-w-4xl h-[80vh] bg-black rounded-md overflow-hidden relative">
                      {call.state.callType === 'video' ? (
                        <div className="w-full h-full relative">
                          <video ref={call.remoteVideoRef} className="absolute inset-0 w-full h-full object-cover" playsInline />
                          <div className="absolute top-4 right-4 w-40 h-28 bg-black/60 rounded-md overflow-hidden shadow">
                            <video ref={call.localVideoRef} className="w-full h-full object-cover" playsInline muted />
                          </div>
                        </div>
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-white gap-3">
                          <div className="h-20 w-20 rounded-full bg-white/10 flex items-center justify-center text-3xl">📞</div>
                          <div className="text-sm text-white/80">{call.state.status === 'waiting' ? 'Đang gọi...' : 'Đã kết nối'}</div>
                          <audio ref={call.remoteAudioRef} className="hidden" />
                        </div>
                      )}

                      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center gap-3">
                        <Button size="icon" variant={call.isMicOn ? 'default' : 'secondary'} onClick={call.toggleMic} className="rounded-full h-12 w-12">
                          {call.isMicOn ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
                        </Button>
                        {call.state.callType === 'video' && (
                          <Button size="icon" variant={call.isCamOn ? 'default' : 'secondary'} onClick={call.toggleCam} className="rounded-full h-12 w-12">
                            {call.isCamOn ? <Video className="h-5 w-5" /> : <Video className="h-5 w-5 opacity-40" />}
                          </Button>
                        )}
                        <Button size="icon" variant="destructive" onClick={call.endCall} className="rounded-full h-12 w-12">
                          <PhoneOff className="h-5 w-5" />
                        </Button>
                      </div>

                      <div className="absolute top-3 left-3 text-xs text-muted-foreground bg-background/60 rounded px-2 py-1">
                        {call.state.callType === 'audio' ? 'Gọi thoại' : 'Gọi video'} · {call.state.status}
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesContainerRef} onScroll={handleScroll} className="h-full overflow-y-auto p-4">
                  <div className="space-y-4">
                    {selectedConversationId && groupedItems.map((item: any) => {
                      if (item.type === 'date') {
                        return (
                          <div key={item.id} className="w-full flex justify-center">
                            <div className="text-xs px-3 py-1 rounded-full bg-background/60 text-muted-foreground">{item.label}</div>
                          </div>
                        )
                      }
                      const message = item.message
                      const isOwnMessage = String(message.senderId) === String(user?.id)
                      const other = (getSelectedConversationData() as any)?.otherUser || (getSelectedConversationData() as any)?.participants?.[0]
                      const otherName = other?.displayName || other?.username || 'Người dùng'
                      const otherAvatar = other?.avatar
                      const selfAvatar = user?.avatar

                      return (
                        <div key={item.id} className={`flex items-end ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
                          {!isOwnMessage && (
                            <Avatar className="h-8 w-8 mr-2">
                              <AvatarImage src={otherAvatar} />
                              <AvatarFallback>{otherName.charAt(0).toUpperCase()}</AvatarFallback>
                            </Avatar>
                          )}
                          <div className={`max-w-xs lg:max-w-md ${isOwnMessage ? 'items-end text-right' : 'items-start text-left'}`}>
                            {!isOwnMessage && (
                              <p className="text-xs text-muted-foreground mb-1">{otherName}</p>
                            )}
                            <div className="px-4 py-2 rounded-lg" style={isOwnMessage ? { backgroundColor: '#2563eb', color: '#ffffff' } : { backgroundColor: '#f3f4f6', color: '#111827' }}>
                              {isImageUrl(String(message.content)) || message.type === 'image' ? (
                                <img src={message.content} alt="image" className="max-w-full rounded" />
                              ) : (
                                <p className="text-sm break-words whitespace-pre-wrap">{message.content}</p>
                              )}
                            </div>
                            <div className={`flex items-center mt-1 space-x-1 ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
                              <span className="text-xs text-muted-foreground">{formatMessageTime(message.timestamp)}</span>
                              {isOwnMessage && (
                                <div className="flex items-center">
                                  {message.status === 'sending' ? (
                                    <Loader className="h-3 w-3 text-gray-400 animate-spin" />
                                  ) : message.status === 'error' ? (
                                    <AlertCircle className="h-3 w-3 text-red-500" />
                                  ) : (
                                    <CheckCheck className="h-3 w-3 text-gray-400" />
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                          {isOwnMessage && (
                            <Avatar className="h-8 w-8 ml-2">
                              <AvatarImage src={selfAvatar} />
                              <AvatarFallback>{String(user?.username || 'U').charAt(0).toUpperCase()}</AvatarFallback>
                            </Avatar>
                          )}
                        </div>
                      )
                    })}
                    <div ref={messagesEndRef} />
                  </div>
                </div>
              </CardContent>

              <div className="p-4 border-t">
                <div className="flex items-center space-x-2">
                  <Button size="icon" variant="ghost" onClick={() => setShowImageUpload(v => !v)}>
                    <Image className="h-4 w-4" />
                  </Button>
                  <div className="relative">
                    <Button size="icon" variant="ghost" aria-label="Chèn biểu tượng" onClick={() => setShowEmojiPad(v => !v)}>
                      <Smile className="h-4 w-4" />
                    </Button>
                    {showEmojiPad && (
                      <div className="absolute bottom-10 left-0 z-50 bg-background border rounded shadow-md p-2">
                        <div className="flex items-center gap-2">
                          {quickIcons.map((ic, idx) => (
                            <button key={idx} className="text-xl" title={`Icon ${idx+1}`} onClick={() => { setMessageInput(prev => prev + ic); setShowEmojiPad(false) }}>
                              {ic}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 relative">
                    <Input placeholder="Nhập tin nhắn..." value={messageInput} onChange={(e) => setMessageInput(e.target.value)} onKeyPress={handleKeyPress} />
                  </div>
                  <Button size="icon" onClick={handleSendMessage} disabled={isSending || !messageInput.trim()} className="bg-blue-600 hover:bg-blue-700">
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              {showImageUpload && (
                <div className="border-t p-3">
                  <ImageUploader
                    compact
                    maxFiles={3}
                    hideResults
                    onUploadComplete={async (results) => {
                      const convId = selectedConversationId as string
                      const topic = (selectedConversation as any)?.topic as string | undefined
                      for (const r of results) {
                        const url = (r as any).secure_url || (r as any).url || ''
                        if (!url) continue
                        const clientMessageId = `img:${Date.now()}:${Math.random().toString(16).slice(2)}`
                        setMessagesByConv(prev => {
                          const arr = prev[convId] ? [...prev[convId]] : []
                          arr.push({
                            id: clientMessageId,
                            clientMessageId,
                            senderId: String(user?.id || ''),
                            receiverId: '',
                            content: url,
                            type: 'image',
                            timestamp: new Date(),
                            isRead: false,
                            isDelivered: false,
                            status: 'sending',
                          })
                          return { ...prev, [convId]: arr }
                        })
                        try {
                          const resp = await chatApi.sendDirectMessage(convId, { content: url, clientMessageId })
                          if (resp?.success) {
                            setMessagesByConv(prev => {
                              const arr = prev[convId] ? [...prev[convId]] : []
                              const idx = arr.findIndex((m: any) => m.id === clientMessageId || m.clientMessageId === clientMessageId)
                              if (idx >= 0) arr[idx] = { ...arr[idx], status: 'sent', isDelivered: true }
                              return { ...prev, [convId]: arr }
                            })
                            if (topic) {
                              try { await publishTopic(topic, { type: 'chat_message', conversationId: convId, senderId: user?.id, content: url, timestamp: Date.now(), clientMessageId }) } catch {}
                            }
                          } else {
                            setMessagesByConv(prev => {
                              const arr = prev[convId] ? [...prev[convId]] : []
                              const idx = arr.findIndex((m: any) => m.id === clientMessageId || m.clientMessageId === clientMessageId)
                              if (idx >= 0) arr[idx] = { ...arr[idx], status: 'error' }
                              return { ...prev, [convId]: arr }
                            })
                          }
                        } catch {
                          setMessagesByConv(prev => {
                            const arr = prev[convId] ? [...prev[convId]] : []
                            const idx = arr.findIndex((m: any) => m.id === clientMessageId || m.clientMessageId === clientMessageId)
                            if (idx >= 0) arr[idx] = { ...arr[idx], status: 'error' }
                            return { ...prev, [convId]: arr }
                          })
                        }
                      }
                      setShowImageUpload(false)
                    }}
                  />
                </div>
              )}
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Chọn một cuộc trò chuyện</h3>
                <p className="text-muted-foreground">Chọn cuộc trò chuyện từ danh sách bên trái để bắt đầu nhắn tin</p>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}

export default function MessagesPage() {
  return (
    <CallProvider>
      <MessagesInner />
    </CallProvider>
  )
}
