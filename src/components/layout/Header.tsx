'use client'

import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import {
  Search,
  Bell,
  LogIn,
  UserPlus,
  User,
  Settings,
  LogOut,
  Zap,
  DollarSign,
  Heart,
  MessageCircle,
  Shield,
  PhoneOff,
  Video,
  Mic,
  MicOff
} from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from '@/hooks/use-toast'
import type { MqttClient } from 'mqtt'
import { connectMqtt, subscribeTopic } from '@/lib/mqttClient'


interface AppNotification {
  id: string
  type: string
  title?: string
  message?: string
  data?: any
  topic?: string
  read?: boolean
  receivedAt: number
}

export default function Header() {
  const { user, session, isAuthenticated, isGuest, logout } = useAuth()
  const router = useRouter()
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  // IncomingCallModal will handle call popups globally
  const [callOverlay, setCallOverlay] = useState<{ active: boolean; roomId: string | null; type: 'audio' | 'video'; status: 'waiting' | 'active' }>({ active: false, roomId: null, type: 'video', status: 'waiting' })
  const [isMicOn, setIsMicOn] = useState(true)
  const [isCamOn, setIsCamOn] = useState(true)
  const localVideoRef = useRef<HTMLVideoElement>(null)
  const remoteVideoRef = useRef<HTMLVideoElement>(null)
  const remoteAudioRef = useRef<HTMLAudioElement>(null)
  const mediaStreamRef = useRef<MediaStream | null>(null)
  const peerRef = useRef<RTCPeerConnection | null>(null)
  const wsRef = useRef<ReturnType<typeof getWebSocket> | null>(null)
  const initiatorRef = useRef<boolean>(false)
  const acceptedRef = useRef<boolean>(false)
  const roleRef = useRef<'caller' | 'answerer' | null>(null)
  const lastAnsweredRef = useRef<{ roomId: string; at: number } | null>(null)
  const mqttRef = useRef<MqttClient | null>(null)

  // Subscribe to per-user notifications and listen for incoming messages
  useEffect(() => {
    let isMounted = true
    const setup = async () => {
      if (!isAuthenticated || !user?.id) return
      try {
        const client = await connectMqtt()
        if (!client) return
        mqttRef.current = client
        const userTopic = `notifications/${user.id}`
        await subscribeTopic(userTopic)

        const handler = (topic: string, payload: Buffer) => {
          if (!isMounted) return
          if (topic !== userTopic) return
          try {
            const raw = payload.toString('utf-8')
            const data = JSON.parse(raw)

            let title = data?.title
            let message = data?.message
            if ((data?.type || '') === 'message') {
              const sender = data?.data?.senderUsername || data?.data?.senderName || ''
              title = 'Cuộc trò chuyện mới'
              message = sender ? `${sender} đã bắt đầu cuộc trò chuyện với bạn` : 'Bạn có cuộc trò chuyện mới'
            }

            const n: AppNotification = {
              id: `${Date.now()}_${Math.random().toString(16).slice(2)}`,
              type: data?.type || 'info',
              title,
              message,
              data: data?.data,
              topic,
              read: false,
              receivedAt: Date.now(),
            }
            setNotifications((prev) => [n, ...prev].slice(0, 50))
            if (n.type !== 'message' && (n.title || n.message)) {
              toast({ title: n.title, description: n.message })
            }
          } catch {}
        }
        client.on('message', handler)

        return () => {
          try { client.off('message', handler as any) } catch {}
        }
      } catch {}
    }
    const cleanup = setup()
    return () => {
      ;(async () => { await cleanup })()
      isMounted = false
    }
  }, [isAuthenticated, user?.id])

  const unreadCount = useMemo(() => notifications.filter(n => !n.read).length, [notifications])

  // Call handling moved to IncomingCallModal
  const handleAcceptCall = async () => {
    if (!incomingCall?.data?.callRoomId || !user?.id) return
    try {
      const ws = getWebSocket()
      wsRef.current = ws
      acceptedRef.current = true
      initiatorRef.current = false
      console.log('[CALL][Header] accept click:', incomingCall)
      await ws.connect(String(user.id))
      console.log('[CALL][Header] emit call_answer', { callRoomId: incomingCall.data.callRoomId, token: session?.accessToken })
      ws.emit('call_answer', { callRoomId: incomingCall.data.callRoomId, token: session?.accessToken })
      const t: 'audio' | 'video' = (incomingCall?.data?.callType === 'audio') ? 'audio' : 'video'
      roleRef.current = 'answerer'
      setCallOverlay({ active: true, roomId: incomingCall.data.callRoomId, type: t, status: 'active' })
    } catch (e) {
      console.error('[CALL][Header] call_answer error', e)
    }
    setIncomingCall(null)
  }

  const handleRejectCall = async () => {
    if (!incomingCall?.data?.callRoomId || !user?.id) return
    try {
      const ws = getWebSocket()
      console.log('[CALL][Header] reject click:', incomingCall)
      await ws.connect(String(user.id))
      console.log('[CALL][Header] emit call_reject', { callRoomId: incomingCall.data.callRoomId })
      ws.emit('call_reject', { callRoomId: incomingCall.data.callRoomId })
    } catch (e) {
      console.error('[CALL][Header] call_reject error', e)
    }
    setIncomingCall(null)
  }

  useEffect(() => {
    // Socket/WebRTC logic removed from Header; handled globally via IncomingCallModal (MQTT)
  }, [isAuthenticated, user?.id])

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

  const endOverlayCall = () => {
    initiatorRef.current = false
    acceptedRef.current = false
    try { peerRef.current?.getSenders?.().forEach(s => { try { s.track?.stop() } catch {} }) } catch {}
    try { peerRef.current?.close() } catch {}
    peerRef.current = null
    try { mediaStreamRef.current?.getTracks().forEach(t => t.stop()) } catch {}
    mediaStreamRef.current = null
    roleRef.current = null
    try { sessionStorage.removeItem('active_call_room') } catch {}
    setCallOverlay({ active: false, roomId: null, type: 'video', status: 'waiting' })
  }

  return (
    <>
    {/* IncomingCallModal renders globally; Header no longer shows call popup */}
    {/* incomingCall UI removed */}
    {false && (
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60">
        <div className="bg-background rounded-lg shadow-xl p-6 w-[92%] max-w-md text-center">
          <div className="text-lg font-semibold mb-2">{incomingCall.title || 'Video Call'}</div>
          <div className="text-sm text-muted-foreground mb-4">{incomingCall.message || 'Bạn đang có cuộc gọi'}</div>
          <div className="flex items-center justify-center gap-3">
            <Button className="bg-green-600 hover:bg-green-700" onClick={handleAcceptCall}>Đồng ý</Button>
            <Button variant="destructive" onClick={handleRejectCall}>Từ chối</Button>
          </div>
        </div>
      </div>
    )}
    {callOverlay.active && (
      <div className="fixed inset-0 z-[70] bg-black/70 flex items-center justify-center">
        <div className="relative w-[92%] max-w-3xl">
          <div className="h-[420px] md:h-[520px] bg-black rounded-lg overflow-hidden">
            {callOverlay.type === 'video' ? (
              <div className="relative w-full h-full">
                <video ref={remoteVideoRef} className="absolute inset-0 w-full h-full object-cover" playsInline />
                <div className="absolute bottom-3 right-3 w-40 h-28 bg-black/60 rounded-md overflow-hidden shadow">
                  <video ref={localVideoRef} className="w-full h-full object-cover" playsInline muted />
                </div>
              </div>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-white gap-3">
                <div className="h-20 w-20 rounded-full bg-white/10 flex items-center justify-center text-3xl">📞</div>
                <div className="text-sm text-white/80">{callOverlay.status === 'waiting' ? 'Đang gọi...' : 'Đã kết nối'}</div>
                <audio ref={remoteAudioRef} className="hidden" />
              </div>
            )}
          </div>
          <div className="absolute inset-x-0 -bottom-14 flex items-center justify-center gap-3">
            <Button size="icon" variant={isMicOn ? 'default' : 'secondary'} onClick={toggleMic} className="rounded-full h-10 w-10">
              {isMicOn ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
            </Button>
            {callOverlay.type === 'video' && (
              <Button size="icon" variant={isCamOn ? 'default' : 'secondary'} onClick={toggleCam} className="rounded-full h-10 w-10">
                <Video className={`h-5 w-5 ${isCamOn ? '' : 'opacity-40'}`} />
              </Button>
            )}
            <Button size="icon" variant="destructive" onClick={endOverlayCall} className="rounded-full h-10 w-10">
              <PhoneOff className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    )}

    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-2 sm:px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-2">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-r from-pink-600 to-purple-600 flex items-center justify-center">
            <Heart className="h-5 w-5 text-white" />
          </div>
          <span className="font-bold text-xl bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
            VelvetSocial
          </span>
          <Badge className="text-xs bg-red-100 text-red-700 ml-2">18+</Badge>
        </Link>

        {/* Search */}
        <div className="hidden md:flex flex-1 max-w-md mx-2 md:mx-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <input
              type="text"
              placeholder="Tìm kiếm bài viết, người dùng, nội dung..."
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
            />
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex items-center space-x-2 md:space-x-4">
          {isAuthenticated ? (
            <>
              {/* Quick Actions */}
              <Link href="/streams">
                <Button variant="ghost" size="sm" className="px-2 md:px-3">
                  <Zap className="h-4 w-4 md:mr-2" />
                  <span className="hidden md:inline">Live Streams</span>
                </Button>
              </Link>

              {user?.role === 'creator' && (
                <Link href="/stream">
                  <Button variant="ghost" size="sm" className="text-red-600 px-2 md:px-3">
                    <Zap className="h-4 w-4 md:mr-2" />
                    <span className="hidden md:inline">Go Live</span>
                  </Button>
                </Link>
              )}

              <Link href="/create-post">
                <Button variant="ghost" size="sm" className="text-pink-600 px-2 md:px-3">
                  <MessageCircle className="h-4 w-4 md:mr-2" />
                  <span className="hidden md:inline">Tạo bài viết</span>
                </Button>
              </Link>
              
              {/* Mobile search trigger */}
              <Link href="/search" className="md:hidden">
                <Button variant="ghost" size="icon">
                  <Search className="h-5 w-5" />
                </Button>
              </Link>

              {/* Notifications */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                      <Badge className="absolute -top-1 -right-1 h-5 min-w-[20px] rounded-full p-0 text-xs flex items-center justify-center">
                        {unreadCount}
                      </Badge>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-80" align="end">
                  <DropdownMenuLabel>Thông báo</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {notifications.length === 0 ? (
                    <div className="p-4 text-sm text-muted-foreground">Không có thông báo</div>
                  ) : (
                    notifications.slice(0, 10).map((n) => (
                      <DropdownMenuItem
                        key={n.id}
                        className="flex flex-col items-start space-y-1"
                      >
                        <div className="w-full flex items-center justify-between">
                          <span className="font-medium text-sm">{n.title || 'Thông báo'}</span>
                          {!n.read && <span className="ml-2 h-2 w-2 rounded-full bg-blue-600" />}
                        </div>
                        {n.message && <span className="text-xs text-muted-foreground">{n.message}</span>}
                      </DropdownMenuItem>
                    ))
                  )}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={user?.avatar} alt={user?.username} />
                      <AvatarFallback className="bg-gradient-to-r from-purple-600 to-blue-600 text-white">
                        {user?.username?.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-64" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user?.username}</p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user?.email}
                      </p>
                      <div className="flex items-center space-x-2 mt-2">
                        <Badge variant="secondary" className="text-xs">
                          <DollarSign className="h-3 w-3 mr-1" />
                          $0
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          <Heart className="h-3 w-3 mr-1 text-red-500" />
                          0
                        </Badge>
                      </div>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="cursor-pointer">
                      <User className="mr-2 h-4 w-4" />
                      <span>Hồ sơ</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/wallet" className="cursor-pointer">
                      <DollarSign className="mr-2 h-4 w-4" />
                      <span>Ví của tôi</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/streams" className="cursor-pointer">
                      <Zap className="mr-2 h-4 w-4" />
                      <span>Live Streams</span>
                    </Link>
                  </DropdownMenuItem>
                  {user?.role === 'creator' ? (
                    <DropdownMenuItem asChild>
                      <Link href="/stream" className="cursor-pointer">
                        <Zap className="mr-2 h-4 w-4 text-red-500" />
                        <span>Stream Dashboard</span>
                      </Link>
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem asChild>
                      <Link href="/become-creator" className="cursor-pointer">
                        <UserPlus className="mr-2 h-4 w-4 text-purple-500" />
                        <span>Become Creator</span>
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem asChild>
                    <Link href="/messages" className="cursor-pointer">
                      <MessageCircle className="mr-2 h-4 w-4" />
                      <span>Tin nhắn</span>
                    </Link>
                  </DropdownMenuItem>
                  {user?.role === 'admin' && (
                    <DropdownMenuItem asChild>
                      <Link href="/admin" className="cursor-pointer">
                        <Shield className="mr-2 h-4 w-4 text-blue-500" />
                        <span>Admin Dashboard</span>
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout} className="cursor-pointer text-red-600">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Đăng xuất</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              {isGuest && (
                <div className="hidden md:flex items-center space-x-2 text-sm text-muted-foreground">
                  <span>Đang xem dưới dạng khách</span>
                </div>
              )}
              <Link href="/login">
                <Button variant="ghost" size="sm" className="px-2 md:px-3">
                  <LogIn className="w-4 h-4 md:mr-2" />
                  <span className="hidden md:inline">Đăng nhập</span>
                </Button>
              </Link>
              <Link href="/register">
                <Button size="sm" className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 px-2 md:px-3">
                  <UserPlus className="w-4 h-4 md:mr-2" />
                  <span className="hidden md:inline">Đăng ký</span>
                </Button>
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
    </>
  )
}
