'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { toast } from 'react-hot-toast'
import {
  Users,
  Heart,
  Share2,
  Gift,
  UserPlus,
  Send,
  MoreVertical,
  Eye,
  Calendar,
  Tag,
  DollarSign
} from 'lucide-react'
import StreamPlayer from '@/components/streaming/StreamPlayer'
import LiveStreamViewer from '@/components/streaming/LiveStreamViewer'
import { streamApi } from '@/lib/api'
import { useAuth } from '@/hooks/useAuth'

interface StreamInfo {
  id: string
  title: string
  description: string
  category: string
  tags: string[]
  creator: {
    id: string
    username: string
    stageName: string
    avatar?: string
    followers: number
    isFollowing: boolean
  }
  isLive: boolean
  viewerCount: number
  totalViews: number
  startedAt: string
  thumbnail?: string
}

interface ChatMessage {
  id: string
  user: {
    username: string
    avatar?: string
    role: 'viewer' | 'subscriber' | 'moderator' | 'vip'
  }
  message: string
  timestamp: Date
}

export default function WatchStreamPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  
  const streamId = params.streamId as string
  const [streamInfo, setStreamInfo] = useState<StreamInfo | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isFollowing, setIsFollowing] = useState(false)
  const [chatMessage, setChatMessage] = useState('')
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      user: { username: 'viewer123', role: 'viewer' },
      message: 'Xin chào mọi người!',
      timestamp: new Date()
    },
    {
      id: '2',
      user: { username: 'fan456', role: 'subscriber', avatar: '/avatars/fan.jpg' },
      message: 'Stream hay quá!',
      timestamp: new Date()
    },
    {
      id: '3',
      user: { username: 'moderator1', role: 'moderator' },
      message: 'Chào mừng các bạn đến với stream!',
      timestamp: new Date()
    }
  ])

  // Fetch stream info
  useEffect(() => {
    const fetchStreamInfo = async () => {
      try {
        setIsLoading(true)
        const response = await streamApi.getStreamInfo(streamId)
        
        if (response.success && response.data) {
          setStreamInfo(response.data)
          setIsFollowing(response.data.creator.isFollowing || false)
        } else {
          setError(response.error || 'Không thể tải thông tin stream')
        }
      } catch (error) {
        console.error('Error fetching stream info:', error)
        setError('Có lỗi xảy ra khi tải stream')
      } finally {
        setIsLoading(false)
      }
    }

    if (streamId) {
      fetchStreamInfo()
    }
  }, [streamId])

  // Simulated viewer count update
  useEffect(() => {
    if (!streamInfo?.isLive) return

    const interval = setInterval(() => {
      setStreamInfo(prev => {
        if (!prev) return prev
        return {
          ...prev,
          viewerCount: prev.viewerCount + Math.floor(Math.random() * 10) - 5
        }
      })
    }, 5000)

    return () => clearInterval(interval)
  }, [streamInfo?.isLive])

  const handleFollow = async () => {
    if (!user) {
      toast.error('Vui lòng đăng nhập để follow')
      router.push('/login')
      return
    }

    try {
      // API call to follow/unfollow
      setIsFollowing(!isFollowing)
      toast.success(isFollowing ? 'Đã unfollow' : 'Đã follow thành công!')
    } catch (error) {
      toast.error('Có lỗi xảy ra')
    }
  }

  const handleSendMessage = () => {
    if (!user) {
      toast.error('Vui lòng đăng nhập để chat')
      return
    }

    if (!chatMessage.trim()) return

    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      user: {
        username: user.username,
        avatar: user.avatar,
        role: 'viewer'
      },
      message: chatMessage,
      timestamp: new Date()
    }

    setChatMessages(prev => [...prev, newMessage])
    setChatMessage('')
  }

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: streamInfo?.title,
        text: `Xem stream "${streamInfo?.title}" của ${streamInfo?.creator.stageName}`,
        url: window.location.href
      })
    } else {
      navigator.clipboard.writeText(window.location.href)
      toast.success('Link đã được sao chép!')
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'moderator': return 'text-green-500'
      case 'vip': return 'text-purple-500'
      case 'subscriber': return 'text-blue-500'
      default: return 'text-gray-500'
    }
  }

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'moderator': return 'MOD'
      case 'vip': return 'VIP'
      case 'subscriber': return 'SUB'
      default: return null
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Đang tải stream...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error || !streamInfo) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <p className="text-red-500 mb-4">{error || 'Stream không tồn tại'}</p>
            <Button onClick={() => router.push('/')}>
              Quay về trang chủ
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-4">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Video Area */}
        <div className="lg:col-span-3 space-y-4">
          {/* Video Player */}
          <div className="w-full">
            <LiveStreamViewer
              streamId={streamId}
              streamTitle={streamInfo.title}
              creatorName={streamInfo.creator.stageName}
              creatorAvatar={streamInfo.creator.avatar}
              isLive={streamInfo.isLive}
            />
          </div>

          {/* Stream Info */}
          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h1 className="text-2xl font-bold mb-2">{streamInfo.title}</h1>
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      <div className="flex items-center">
                        <Eye className="w-4 h-4 mr-1" />
                        {streamInfo.viewerCount.toLocaleString()} người xem
                      </div>
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1" />
                        Bắt đầu {new Date(streamInfo.startedAt).toLocaleTimeString()}
                      </div>
                      <Badge variant="secondary">{streamInfo.category}</Badge>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm" onClick={handleShare}>
                      <Share2 className="w-4 h-4 mr-2" />
                      Chia sẻ
                    </Button>
                    <Button variant="outline" size="sm">
                      <Gift className="w-4 h-4 mr-2" />
                      Tặng quà
                    </Button>
                  </div>
                </div>

                {/* Creator Info */}
                <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={streamInfo.creator.avatar} />
                      <AvatarFallback>
                        {streamInfo.creator.stageName.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold">{streamInfo.creator.stageName}</h3>
                      <p className="text-sm text-muted-foreground">
                        @{streamInfo.creator.username} • {streamInfo.creator.followers.toLocaleString()} followers
                      </p>
                    </div>
                  </div>
                  <Button
                    variant={isFollowing ? "outline" : "default"}
                    onClick={handleFollow}
                  >
                    <UserPlus className="w-4 h-4 mr-2" />
                    {isFollowing ? 'Đang follow' : 'Follow'}
                  </Button>
                </div>

                {/* Description */}
                {streamInfo.description && (
                  <div>
                    <p className="text-sm">{streamInfo.description}</p>
                  </div>
                )}

                {/* Tags */}
                {streamInfo.tags.length > 0 && (
                  <div className="flex items-center space-x-2">
                    <Tag className="w-4 h-4 text-muted-foreground" />
                    <div className="flex flex-wrap gap-1">
                      {streamInfo.tags.map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          #{tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Chat Sidebar */}
        <div className="lg:col-span-1">
          <Card className="h-[600px] flex flex-col">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Live Chat</CardTitle>
              <CardDescription>
                {streamInfo.viewerCount.toLocaleString()} người đang xem
              </CardDescription>
            </CardHeader>
            <Separator />
            
            {/* Chat Messages */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-3">
                {chatMessages.map((msg) => (
                  <div key={msg.id} className="flex space-x-2">
                    <Avatar className="w-6 h-6 mt-1">
                      <AvatarImage src={msg.user.avatar} />
                      <AvatarFallback className="text-xs">
                        {msg.user.username.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className={`text-sm font-medium ${getRoleColor(msg.user.role)}`}>
                          {msg.user.username}
                        </span>
                        {getRoleBadge(msg.user.role) && (
                          <Badge variant="outline" className="text-xs px-1 py-0">
                            {getRoleBadge(msg.user.role)}
                          </Badge>
                        )}
                        <span className="text-xs text-muted-foreground">
                          {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-sm break-words">{msg.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            {/* Chat Input */}
            <div className="p-4 border-t">
              {user ? (
                <div className="flex space-x-2">
                  <Input
                    value={chatMessage}
                    onChange={(e) => setChatMessage(e.target.value)}
                    placeholder="Nhập tin nhắn..."
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    className="flex-1"
                  />
                  <Button size="sm" onClick={handleSendMessage}>
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-2">
                    Đăng nhập để tham gia chat
                  </p>
                  <Button size="sm" onClick={() => router.push('/login')}>
                    Đăng nhập
                  </Button>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
