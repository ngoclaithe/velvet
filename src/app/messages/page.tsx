'use client'

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
import { getWebSocket } from '@/lib/websocket'
import ImageUploader from '@/components/ImageUploader'
import {
  MessageCircle,
  Send,
  Search,
  Plus,
  MoreVertical,
  Phone,
  Video,
  Archive,
  Trash2,
  Pin,
  Star,
  Image,
  Smile,
  Check,
  CheckCheck,
  Loader,
  AlertCircle,
  PhoneOff,
  Mic,
  MicOff
} from 'lucide-react'
import { format, isToday, isYesterday, isThisWeek } from 'date-fns'
import { vi } from 'date-fns/locale'

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

export default function MessagesPage() {
  const { user, session, isLoading: authLoading, isAuthenticated } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
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
  const [callState, setCallState] = useState<{
    callRoomId: string | null
    callType: 'audio' | 'video' | null
    status: 'idle' | 'waiting' | 'active'
    participants: number
  }>({ callRoomId: null, callType: null, status: 'idle', participants: 0 })
  const localVideoRef = useRef<HTMLVideoElement>(null)
  const remoteVideoRef = useRef<HTMLVideoElement>(null)
  const remoteAudioRef = useRef<HTMLAudioElement>(null)
  const mediaStreamRef = useRef<MediaStream | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const wsRef = useRef<ReturnType<typeof getWebSocket> | null>(null)
  const peerRef = useRef<RTCPeerConnection | null>(null)
  const initiatorRef = useRef<boolean>(false)
  const [isMicOn, setIsMicOn] = useState(true)
  const [isCamOn, setIsCamOn] = useState(true)
  const seenMsgKeysRef = useRef<Map<string, number>>(new Map())
  const lastConvRef = useRef<string | null>(null)
  const lastCountRef = useRef<number>(0)
  const [showImageUpload, setShowImageUpload] = useState(false)
  const [showEmojiPad, setShowEmojiPad] = useState(false)
  const quickIcons = ['😀','😂','❤️','👍','🔥']

  // WebSocket connect for 1-1 call events
  useEffect(() => {
    if (!isAuthenticated || !user?.id) return
    const ws = getWebSocket()
    wsRef.current = ws
    ws.connect(String(user.id)).catch(() => {})

    const onJoined = (data: any) => {
      if (!data?.callRoomId) return
      console.log('[CALL] call_room_joined', data)
      setCallState({
        callRoomId: data.callRoomId,
        callType: (data.callType === 'audio' ? 'audio' : 'video'),
        status: data.status === 'active' ? 'active' : 'waiting',
        participants: Number(data.participants || 1)
      })
      console.log('[CALL][DEBUG] state after join', { state: callState, initiator: initiatorRef.current })
    }

    const onStarted = (data: any) => {
      if (!data?.callRoomId) return
      if (peerRef.current) return
      console.log('[CALL] call_started', data)
      const type: 'audio' | 'video' = (data.callType === 'audio') ? 'audio' : 'video'
      setCallState(prev => ({ ...prev, callRoomId: data.callRoomId, status: 'active', participants: Number(data.participants || prev.participants || 2), callType: type }))
      console.log('[CALL][DEBUG] onStarted => will start legacy stream', { type, room: data.callRoomId })
      startSendingStream(data.callRoomId, type)
    }

    const onReceiveStream = async (data: any) => {
      if (!data?.callRoomId || data.callRoomId !== callState.callRoomId) return
      try {
        console.log('[CALL] receive_stream', { roomId: data.callRoomId, type: data.streamType, size: data.streamData?.length || 0 })
        const base64 = data.streamData
        const byteCharacters = atob(base64)
        const byteNumbers = new Array(byteCharacters.length)
        for (let i = 0; i < byteCharacters.length; i++) byteNumbers[i] = byteCharacters.charCodeAt(i)
        const byteArray = new Uint8Array(byteNumbers)
        const blob = new Blob([byteArray], { type: data.streamType === 'audio' ? 'audio/webm' : 'video/webm' })
        const url = URL.createObjectURL(blob)
        if (data.streamType === 'audio') {
          if (remoteAudioRef.current) {
            remoteAudioRef.current.src = url
            try { await remoteAudioRef.current.play() } catch {}
          }
        } else {
          if (remoteVideoRef.current) {
            remoteVideoRef.current.src = url
            try { await remoteVideoRef.current.play() } catch {}
          }
        }
      } catch {}
    }

    ws.on('call_room_joined', onJoined)
    ws.on('call_started', onStarted)
    ws.on('receive_stream', onReceiveStream)

    return () => {
      try {
        ws.off('call_room_joined', onJoined)
        ws.off('call_started', onStarted)
        ws.off('receive_stream', onReceiveStream)
      } catch {}
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, user?.id, callState.callRoomId])

  // Load conversations and selected
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
                    // Drop duplicates within 6s window
                    if (seenAt && now - seenAt < 6000) {
                      return
                    }
                    // Record key
                    seenMsgKeysRef.current.set(key, now)
                    // Prune old
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
  }, [isAuthenticated, selectedConversationId, searchParams])



  const getSelectedConversationData = () => {
    return selectedConversation as any
  }

  const getMessagesForConversation = (conversationId: string) => {
    return messagesByConv[conversationId] || []
  }

  const formatMessageTime = (date: Date) => {
    if (isToday(date)) {
      return format(date, 'HH:mm')
    } else if (isYesterday(date)) {
      return 'Hôm qua'
    } else if (isThisWeek(date)) {
      return format(date, 'EEEE', { locale: vi })
    } else {
      return format(date, 'dd/MM/yyyy')
    }
  }

  const formatLastMessageTime = (date: Date) => {
    if (isToday(date)) {
      return format(date, 'HH:mm')
    } else if (isYesterday(date)) {
      return 'Hôm qua'
    } else {
      return format(date, 'dd/MM')
    }
  }

  const isImageUrl = (s: string) => {
    try {
      if (!s) return false
      const u = s.toString()
      return /^https?:\/\//.test(u) && /(\.png|\.jpe?g|\.webp|\.gif|cloudinary\.com\/.+\.(png|jpe?g|webp|gif))/i.test(u)
    } catch { return false }
  }

  const scrollToBottom = () => {
    const el = messagesContainerRef.current
    if (el) {
      el.scrollTop = el.scrollHeight
    } else {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }

  const currentMessages = useMemo(() => selectedConversationId ? (messagesByConv[selectedConversationId] || []) : [], [messagesByConv, selectedConversationId])
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
        const raf = requestAnimationFrame(() => scrollToBottom())
        // Note: no cleanup needed for one-off raf
      }
      lastCountRef.current = currentMessages.length
    }
  }, [currentMessages.length, selectedConversationId])

  const startSendingStream = async (roomId: string, type: 'audio' | 'video') => {
    try {
      console.log('[CALL] startSendingStream', { roomId, type })
      const constraints: MediaStreamConstraints = type === 'audio' ? { audio: true, video: false } : { audio: true, video: true }
      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints)
      mediaStreamRef.current = mediaStream
      if (localVideoRef.current && type === 'video') {
        ;(localVideoRef.current as any).srcObject = mediaStream
        localVideoRef.current.muted = true
        try { await localVideoRef.current.play() } catch {}
      }
      const mime = type === 'audio' ? 'audio/webm' : 'video/webm;codecs=vp8'
      const recorder = new MediaRecorder(mediaStream, { mimeType: mime })
      mediaRecorderRef.current = recorder
      recorder.ondataavailable = async (ev: BlobEvent) => {
        if (!ev.data || ev.data.size === 0) return
        const buf = await ev.data.arrayBuffer()
        const bytes = new Uint8Array(buf)
        let binary = ''
        const chunk = 0x8000
        for (let i = 0; i < bytes.length; i += chunk) {
          binary += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + chunk)))
        }
        const base64Data = btoa(binary)
        wsRef.current?.emit('send_stream', { callRoomId: roomId, streamData: base64Data, streamType: type, token: session?.accessToken })
      }
      recorder.start(1000)
    } catch (e) {
      console.error('[CALL] startSendingStream error', e)
    }
  }

  const stopSendingStream = () => {
    try { mediaRecorderRef.current?.stop() } catch {}
    mediaRecorderRef.current = null
    try { mediaStreamRef.current?.getTracks().forEach(t => t.stop()) } catch {}
    mediaStreamRef.current = null
  }

  // Local media/WebRTC now handled by Header overlay to avoid duplication
  const ensureLocalMedia = async (type: 'audio' | 'video') => {
    if (mediaStreamRef.current) return mediaStreamRef.current
    const constraints: MediaStreamConstraints = type === 'audio' ? { audio: true, video: false } : { audio: true, video: true }
    const stream = await navigator.mediaDevices.getUserMedia(constraints)
    try { stream.getAudioTracks().forEach(t => t.enabled = isMicOn) } catch {}
    try { stream.getVideoTracks().forEach(t => t.enabled = type === 'video' ? isCamOn : false) } catch {}
    mediaStreamRef.current = stream
    if (type === 'video' && localVideoRef.current) {
      ;(localVideoRef.current as any).srcObject = stream
      localVideoRef.current.muted = true
      try { await localVideoRef.current.play() } catch {}
    }
    return stream
  }

  // Deprecated in Messages: kept for backward compatibility but not used
  const initPeerConnection = async (type: 'audio' | 'video') => {
    try { peerRef.current?.close() } catch {}
    peerRef.current = null

    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:global.stun.twilio.com:3478?transport=udp' }
      ]
    })

    console.log('[CALL][DEBUG] initPeerConnection', { type })

    pc.onicecandidate = (event) => {
      if (event.candidate && callState.callRoomId) {
        console.log('[CALL] -> ice_candidate', event.candidate)
        const ok = wsRef.current?.emit('ice_candidate', {
          callRoomId: callState.callRoomId,
          candidate: event.candidate,
          token: session?.accessToken,
        })
        console.log('[CALL][EMIT ice_candidate] sent?', ok)
      }
    }

    pc.ontrack = async (ev) => {
      const stream = ev.streams[0]
      if (!stream) return
      const trackKind = ev.track.kind
      if (trackKind === 'video') {
        if (remoteVideoRef.current) {
          ;(remoteVideoRef.current as any).srcObject = stream
          try { await remoteVideoRef.current.play() } catch {}
        }
      } else if (trackKind === 'audio') {
        if (remoteAudioRef.current) {
          ;(remoteAudioRef.current as any).srcObject = stream
          try { await remoteAudioRef.current.play() } catch {}
        }
      }
    }

    const local = await ensureLocalMedia(type)
    local.getTracks().forEach((t) => pc.addTrack(t, local))

    peerRef.current = pc
    return pc
  }

  // Deprecated in Messages
  const createAndSendOffer = async (roomId: string) => {
    const pc = peerRef.current
    if (!pc) return
    const offer = await pc.createOffer()
    await pc.setLocalDescription(offer)
    console.log('[CALL] -> media_stream (offer)', { roomId, sdpLen: offer.sdp?.length })
    const ok = wsRef.current?.emit('media_stream', {
      callRoomId: roomId,
      streamData: { type: 'offer', sdp: offer.sdp },
      token: session?.accessToken,
    })
    console.log('[CALL][EMIT media_stream] sent?', ok)
  }

  // Deprecated in Messages
  const handleIncomingSDP = async (sd: { type: 'offer' | 'answer'; sdp: string }) => {
    let pc = peerRef.current
    if (!pc) { await initPeerConnection(callState.callType || 'video'); pc = peerRef.current }
    if (!pc) return
    console.log('[CALL][DEBUG] handleIncomingSDP', sd.type)
    const desc = new RTCSessionDescription({ type: sd.type, sdp: sd.sdp })
    if (sd.type === 'offer') {
      await pc.setRemoteDescription(desc)
      const ans = await pc.createAnswer()
      await pc.setLocalDescription(ans)
      if (callState.callRoomId) {
        console.log('[CALL] -> media_stream (answer)', { roomId: callState.callRoomId, sdpLen: ans.sdp?.length })
        const ok = wsRef.current?.emit('media_stream', {
          callRoomId: callState.callRoomId,
          streamData: { type: 'answer', sdp: ans.sdp },
          token: session?.accessToken,
        })
        console.log('[CALL][EMIT media_stream] sent?', ok)
      }
    } else if (sd.type === 'answer') {
      if (!pc.currentRemoteDescription) {
        await pc.setRemoteDescription(desc)
      }
    }
  }

  // Deprecated in Messages
  const handleIncomingIce = async (cand: RTCIceCandidateInit) => {
    let pc = peerRef.current
    if (!pc) { await initPeerConnection(callState.callType || 'video'); pc = peerRef.current }
    if (!pc) return
    try { await pc.addIceCandidate(cand) } catch (e) { console.error('[CALL] addIceCandidate error', e) }
  }

  const toggleMic = () => {
    setIsMicOn(prev => {
      const next = !prev
      try { mediaStreamRef.current?.getAudioTracks().forEach(t => t.enabled = next) } catch {}
      return next
    })
  }

  const toggleCam = () => {
    setIsCamOn(prev => {
      const next = !prev
      try { mediaStreamRef.current?.getVideoTracks().forEach(t => t.enabled = next) } catch {}
      return next
    })
  }

  const endCall = () => {
    initiatorRef.current = false
    try { peerRef.current?.getSenders?.().forEach(s => { try { s.track?.stop() } catch {} }) } catch {}
    try { peerRef.current?.close() } catch {}
    peerRef.current = null
    try { mediaStreamRef.current?.getTracks().forEach(t => t.stop()) } catch {}
    mediaStreamRef.current = null
    stopSendingStream()
    setCallState({ callRoomId: null, callType: null, status: 'idle', participants: 0 })
  }

  const initiateCall = async (type: 'audio' | 'video') => {
    if (!selectedConversationId || !selectedConversation) return
    try {
      console.log('[CALL] initiateCall -> sendDirectMessage', { conversationId: String(selectedConversationId), type })
      const resp: any = await chatApi.sendDirectMessage(String(selectedConversationId), { content: null, messageType: type })
      console.log('[CALL] API response', resp)
      const callRoom = resp?.data?.callRoom || resp?.data?.data?.callRoom || resp?.callRoom
      const roomId = callRoom?.roomId
      const callType = (callRoom?.callType === 'audio') ? 'audio' : 'video'
      if (roomId) {
        const ws = wsRef.current || getWebSocket()
        await ws.connect(String(user?.id || ''))
        console.log('[CALL] emit join_call_room', { callRoomId: roomId })
        ws.emit('join_call_room', { callRoomId: roomId, token: session?.accessToken })
        initiatorRef.current = true
        try { sessionStorage.setItem('active_call_room', JSON.stringify({ roomId, type: callType, initiator: true, ts: Date.now() })) } catch {}
        setCallState({ callRoomId: roomId, callType, status: 'waiting', participants: 1 })
        console.log('[CALL][DEBUG] initiateCall set waiting', { roomId, callType, initiator: initiatorRef.current })
      } else {
        console.warn('[CALL] No roomId from API')
      }
    } catch (e) {
      console.error('[CALL] initiateCall error', e)
    }
  }

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !selectedConversation) return

    const conversationId = selectedConversationId as string
    const content = messageInput.trim()
    const topic = (selectedConversation as any)?.topic as string | undefined
    const clientMessageId = `c:${user?.id}:${Date.now()}:${Math.random().toString(16).slice(2)}`

    // Optimistically add message with 'sending' status
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

    setMessageInput('')
    setIsSending(true)
    try {
      const resp = await chatApi.sendDirectMessage(conversationId, { content, clientMessageId })
      if (resp?.success) {
        setMessagesByConv(prev => {
          const arr = prev[conversationId] ? [...prev[conversationId]] : []
          const idx = arr.findIndex((m: any) => m.id === clientMessageId || m.clientMessageId === clientMessageId)
          if (idx >= 0) {
            arr[idx] = { ...arr[idx], status: 'sent', isDelivered: true }
          }
          return { ...prev, [conversationId]: arr }
        })
        if (topic) {
          try {
            await publishTopic(topic, {
              type: 'chat_message',
              conversationId,
              senderId: user?.id,
              content,
              timestamp: Date.now(),
              clientMessageId,
            })
          } catch {}
        }
      } else {
        setMessagesByConv(prev => {
          const arr = prev[conversationId] ? [...prev[conversationId]] : []
          const idx = arr.findIndex((m: any) => m.id === clientMessageId || m.clientMessageId === clientMessageId)
          if (idx >= 0) {
            arr[idx] = { ...arr[idx], status: 'error' }
          }
          return { ...prev, [conversationId]: arr }
        })
      }
    } catch (error) {
      setMessagesByConv(prev => {
        const arr = prev[conversationId] ? [...prev[conversationId]] : []
        const idx = arr.findIndex((m: any) => m.id === clientMessageId || m.clientMessageId === clientMessageId)
        if (idx >= 0) {
          arr[idx] = { ...arr[idx], status: 'error' }
        }
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

  if (authLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <Icons.spinner className="h-8 w-8 animate-spin" />
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null // Component sẽ redirect trước khi render
  }

  return (
    <div className="container mx-auto p-4 max-w-7xl">
      <Card className="h-[80vh] flex">
        {/* Conversations List */}
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

        {/* Chat Area */}
        <div className="flex-1 flex flex-col min-h-0">
          {selectedConversationId ? (
            <>
              {/* Chat Header */}
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
                      <p className="text-sm text-muted-foreground"></p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button size="icon" variant="ghost" onClick={() => initiateCall('audio')} disabled={callState.status !== 'idle'}>
                      <Phone className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => initiateCall('video')} disabled={callState.status !== 'idle'}>
                      <Video className="h-4 w-4" />
                    </Button>

                    <Button size="icon" variant="ghost">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <Separator />

              {/* Messages */}
              <CardContent className="flex-1 p-0 min-h-0 overflow-hidden">
                {/* Call UI moved to Header overlay to avoid duplication */}
                <div ref={messagesContainerRef} className="h-full overflow-y-auto p-4">
                  <div className="space-y-4">
                    {getMessagesForConversation(selectedConversationId).map((message: any) => {
                      const isOwnMessage = String(message.senderId) === String(user?.id)
                      const other = (getSelectedConversationData() as any)?.otherUser || (getSelectedConversationData() as any)?.participants?.[0]
                      const otherName = other?.displayName || other?.username || 'Người dùng'
                      const otherAvatar = other?.avatar
                      const selfAvatar = user?.avatar

                      return (
                        <div
                          key={message.id}
                          className={`flex items-end ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                        >
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
                            <div
                              className={`px-4 py-2 rounded-lg ${
                                isOwnMessage
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-gray-100 text-gray-900'
                              }`}
                            >
                              {isImageUrl(String(message.content)) || message.type === 'image' ? (
                                <img src={message.content} alt="image" className="max-w-full rounded" />
                              ) : (
                                <p className="text-sm break-words whitespace-pre-wrap">{message.content}</p>
                              )}
                            </div>
                            <div className={`flex items-center mt-1 space-x-1 ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
                              <span className="text-xs text-muted-foreground">
                                {formatMessageTime(message.timestamp)}
                              </span>
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

              {/* Message Input */}
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
                    <Input
                      placeholder="Nhập tin nhắn..."
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      onKeyPress={handleKeyPress}
                    />
                  </div>
                  <Button
                    size="icon"
                    onClick={handleSendMessage}
                    disabled={isSending || !messageInput.trim()}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
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
                        // Optimistic image message
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
                              if (idx >= 0) {
                                arr[idx] = { ...arr[idx], status: 'sent', isDelivered: true }
                              }
                              return { ...prev, [convId]: arr }
                            })
                            if (topic) {
                              try { await publishTopic(topic, { type: 'chat_message', conversationId: convId, senderId: user?.id, content: url, timestamp: Date.now(), clientMessageId }) } catch {}
                            }
                          } else {
                            setMessagesByConv(prev => {
                              const arr = prev[convId] ? [...prev[convId]] : []
                              const idx = arr.findIndex((m: any) => m.id === clientMessageId || m.clientMessageId === clientMessageId)
                              if (idx >= 0) {
                                arr[idx] = { ...arr[idx], status: 'error' }
                              }
                              return { ...prev, [convId]: arr }
                            })
                          }
                        } catch {
                          setMessagesByConv(prev => {
                            const arr = prev[convId] ? [...prev[convId]] : []
                            const idx = arr.findIndex((m: any) => m.id === clientMessageId || m.clientMessageId === clientMessageId)
                            if (idx >= 0) {
                              arr[idx] = { ...arr[idx], status: 'error' }
                            }
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
            /* No Conversation Selected */
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Chọn một cuộc trò chuyện</h3>
                <p className="text-muted-foreground">Chọn cuộc trò chuyện từ danh sách bên trái để b���t đầu nhắn tin</p>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}
