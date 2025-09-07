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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { creatorAPI } from '@/lib/api/creator'
import {
  Search,
  Bell,
  LogIn,
  UserPlus,
  User,
  Zap,
  DollarSign,
  Heart,
  MessageCircle,
  Shield,
  Calendar,
  Users,
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useNotification } from '@/components/notification/NotificationProvider'
import { walletAPI } from '@/lib/api/wallet'

function FeaturedCreatorsList({ onSelect }: { onSelect?: (id: number) => void }) {
  const [creators, setCreators] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetch = async () => {
      try {
        setLoading(true)
        const res = await creatorAPI.getFeaturedCreator()
        if (res && res.success && res.data && Array.isArray(res.data)) {
          setCreators(res.data.slice(0, 8))
        } else {
          setCreators([])
        }
      } catch (e) {
        console.error('Failed to load featured creators:', e)
        setCreators([])
      } finally {
        setLoading(false)
      }
    }

    fetch()
  }, [])

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-3 bg-gray-900 border border-gray-700 rounded">
            <div className="w-10 h-10 bg-gray-700 rounded-full" />
            <div className="flex-1">
              <div className="h-4 bg-gray-700 rounded w-3/4 mb-2" />
              <div className="h-3 bg-gray-700 rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
      {creators.map((c) => (
        <div key={c.id} className="flex items-center gap-3 p-3 bg-gray-900 border border-gray-700 rounded hover:bg-gray-800/60 cursor-pointer" onClick={() => onSelect?.(Number(c.id))}>
          <div className="relative flex-shrink-0">
            {c?.user?.avatar ? (
              <img src={c.user.avatar} alt={c.stageName} className="w-12 h-12 rounded-full object-cover" />
            ) : (
              <div className="w-12 h-12 rounded-full bg-gradient-to-r from-pink-500 to-violet-500 flex items-center justify-center text-white font-bold">{(c.stageName || (c.user && c.user.username) || 'U').charAt(0)}</div>
            )}
            {c.isLive && <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-red-500 border-2 border-gray-900 rounded-full" />}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <div className="font-semibold text-sm text-white truncate">{c.stageName || c.user?.displayName || c.user?.username}</div>
              {c.isVerified && <div className="w-3 h-3 bg-blue-500 rounded-full flex items-center justify-center"><span className="text-white text-[10px]">✓</span></div>}
            </div>
            <div className="text-xs text-gray-400">{Number(c.followersCount || 0).toLocaleString()} followers</div>
          </div>
        </div>
      ))}
    </div>
  )
}

export default function Header() {
  const { user, isAuthenticated, isGuest, logout } = useAuth()
  const router = useRouter()
  const { notifications, unreadCount } = useNotification()
  const [searchText, setSearchText] = useState('')
  const [tokens, setTokens] = useState<number>(0)
  const [showCreators, setShowCreators] = useState(false)

  const openNotification = (n: any) => {
    const isCall = ['audio', 'video', 'call'].includes(String(n.type))
    if (isCall) {
      const convId = n.data?.conversationId?.toString?.() || n.data?.conversation?.id?.toString?.()
      const topic = n.data?.topic || n.data?.mqttTopic
      const callRoomId = n.data?.callRoomId || n.data?.roomId
      const callType = (n.data?.callType || n.data?.mediaType || n.type)
      const params = new URLSearchParams()
      if (convId) params.set('conversationId', convId)
      if (topic) params.set('mqttTopic', String(topic))
      if (callRoomId) {
        params.set('callRoomId', String(callRoomId))
        params.set('incoming', '1')
        if (callType) params.set('callType', String(callType))
      }
      router.push(`/messages${params.toString() ? `?${params.toString()}` : ''}`)
    }
  }

  useEffect(() => {
    const fetchWallet = async () => {
      try {
        if (!isAuthenticated) return
        const res = await walletAPI.getWallet()
        if (res && res.success && res.data) {
          setTokens(Number((res.data as any).tokens) || 0)
        }
      } catch (e) {
        console.error('Failed to load wallet in header:', e)
      }
    }

    fetchWallet()
  }, [isAuthenticated])

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-between px-2 sm:px-4">
        <Link href="/" className="flex items-center space-x-2">
          <div className="hidden sm:flex h-8 w-8 rounded-lg bg-gradient-to-r from-pink-600 to-purple-600 items-center justify-center">
            <Heart className="h-5 w-5 text-white" />
          </div>
          <span className="font-bold text-base md:text-xl bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
            VelvetSocial
          </span>
          <Badge className="hidden sm:inline-flex text-xs bg-red-100 text-red-700 ml-2">18+</Badge>
        </Link>

        <div className="hidden md:flex items-center space-x-2 max-w-[520px] mx-1 md:mx-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <input
              type="text"
              placeholder="Tìm kiếm bài viết, người dùng, nội dung..."
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const q = searchText.trim()
                  if (q) router.push(`/search?query=${encodeURIComponent(q)}&limit=5`)
                }
              }}
            />
          </div>

          {/* Featured creators modal trigger */}
          <Button variant="ghost" size="sm" className="px-2 md:px-3" onClick={() => setShowCreators(true)}>
            <Users className="h-4 w-4 md:mr-2" />
            <span className="hidden md:inline">Creators nổi bật</span>
          </Button>
        </div>

        <nav className="flex items-center space-x-2 md:space-x-4">
          {isAuthenticated ? (
            <>
    
              {user?.role === 'creator' && (
                <Link href="/stream">
                  <Button variant="ghost" size="sm" className="text-red-600 px-2 md:px-3">
                    <Zap className="h-4 w-4 md:mr-2" />
                    <span className="hidden md:inline">Go Live</span>
                  </Button>
                </Link>
              )}

              <Link href="/wallet?tab=deposit">
                <Button variant="ghost" size="sm" className="text-pink-600 px-2 md:px-3">
                  <DollarSign className="h-4 w-4 md:mr-2" />
                  <span className="hidden md:inline">Nạp tiền</span>
                </Button>
              </Link>

              {(user?.role === 'user' || user?.role === 'admin') && (
                <Link href="/bookings">
                  <Button variant="ghost" size="sm" className="text-yellow-400 px-2 md:px-3">
                    <Calendar className="h-4 w-4 md:mr-2" />
                    <span className="hidden md:inline">Booking</span>
                  </Button>
                </Link>
              )}

              <Link href="/search" className="md:hidden">
                <Button variant="ghost" size="icon">
                  <Search className="h-5 w-5" />
                </Button>
              </Link>

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
                        className="flex flex-col items-start space-y-1 cursor-pointer"
                        onClick={() => openNotification(n)}
                      >
                        <div className="w-full flex items-center justify-between">
                          <span className="font-medium text-sm">{n.title || 'Thông báo'}</span>
                          {!n.read && <span className="ml-2 h-2 w-2 rounded-full bg-blue-600" />}
                        </div>
                        {n.message && <span className="text-xs text-muted-foreground">{n.message}</span>}
                        {(() => {
                          const t = (n as any)?.data?.timestamp || (n as any)?.timestamp || n.receivedAt
                          if (!t) return null
                          const d = new Date(typeof t === 'string' ? t : Number(t))
                          const txt = d.toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })
                          return <span className="text-[10px] text-muted-foreground">{txt}</span>
                        })()}
                      </DropdownMenuItem>
                    ))
                  )}
                </DropdownMenuContent>
              </DropdownMenu>

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
                      <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                      <div className="flex items-center space-x-2 mt-2">
                        <Badge variant="secondary" className="text-xs">
                          <DollarSign className="h-3 w-3 mr-1" />
                          {tokens}
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
                    <Link href="/profile/posts" className="cursor-pointer">
                      <User className="mr-2 h-4 w-4" />
                      <span>Trang cá nhân</span>
                    </Link>
                  </DropdownMenuItem>
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
                    <Link href="/create-post" className="cursor-pointer">
                      <MessageCircle className="mr-2 h-4 w-4" />
                      <span>Tạo bài viết</span>
                    </Link>
                  </DropdownMenuItem>
                  {(user?.role === 'creator' || user?.role === 'admin') && (
                    <DropdownMenuItem asChild>
                      <Link href="/streams" className="cursor-pointer">
                        <Zap className="mr-2 h-4 w-4" />
                        <span>Live Streams</span>
                      </Link>
                    </DropdownMenuItem>
                  )}
                  {user?.role === 'creator' ? (
                    <DropdownMenuItem asChild>
                      <Link href="/stream" className="cursor-pointer">
                        <Zap className="mr-2 h-4 w-4 text-red-500" />
                        <span>Stream Dashboard</span>
                      </Link>
                    </DropdownMenuItem>
                  ) : null }
                  <DropdownMenuItem asChild>
                    <Link href="/messages" className="cursor-pointer">
                      <MessageCircle className="mr-2 h-4 w-4" />
                      <span>Tin nhắn</span>
                    </Link>
                  </DropdownMenuItem>
                  {user?.role !== 'creator' && (
                    <DropdownMenuItem asChild>
                      <Link href="/bookings" className="cursor-pointer">
                        <Calendar className="mr-2 h-4 w-4" />
                        <span>Booking</span>
                      </Link>
                    </DropdownMenuItem>
                  )}
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
                    <LogIn className="mr-2 h-4 w-4 rotate-180" />
                    <span>Đăng xuất</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Link href="/bookings">
                <Button variant="ghost" size="sm" className="text-yellow-400 px-2 md:px-3">
                  <Calendar className="h-4 w-4 md:mr-2" />
                  <span className="hidden md:inline">Booking</span>
                </Button>
              </Link>
              <Link href="/login">
                <Button size="sm" className="group relative overflow-hidden rounded-full h-9 md:h-10 px-3 md:px-5 text-white font-semibold bg-gradient-to-r from-fuchsia-600 via-pink-600 to-violet-600 hover:from-fuchsia-500 hover:via-pink-500 hover:to-violet-500 shadow-lg shadow-fuchsia-500/30 hover:shadow-fuchsia-500/50 ring-1 ring-white/10 hover:ring-white/20 transition-all">
                  <LogIn className="w-4 h-4 mr-1 md:mr-2" />
                  <span className="md:inline hidden">Đăng nhập / Đăng ký</span>
                  <span className="inline md:hidden">Đăng nhập</span>
                </Button>
              </Link>
            </>
          )}
        </nav>
      </div>
      {/* Creators Dialog */}
      <Dialog open={showCreators} onOpenChange={setShowCreators}>
        <DialogContent className="max-w-4xl w-full">
          <DialogHeader>
            <DialogTitle>Creators nổi bật</DialogTitle>
          </DialogHeader>
          <div className="mt-2">
            <FeaturedCreatorsList onSelect={(id) => { setShowCreators(false); router.push(`/creator/${id}`) }} />
          </div>
        </DialogContent>
      </Dialog>
    </header>
  )
}
