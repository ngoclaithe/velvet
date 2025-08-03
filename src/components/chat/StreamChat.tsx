'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Send,
  Smile,
  Gift,
  MoreVertical,
  Shield,
  Ban,
  Clock,
  Heart,
  Star,
  Zap,
  Users,
  Settings,
  Volume2,
  VolumeX
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

interface ChatMessage {
  id: string
  userId: string
  username: string
  avatar?: string
  message: string
  timestamp: Date
  type: 'message' | 'gift' | 'follow' | 'subscription' | 'system'
  role: 'viewer' | 'subscriber' | 'moderator' | 'vip' | 'streamer'
  gift?: {
    name: string
    value: number
    icon: string
  }
}

interface ChatUser {
  id: string
  username: string
  avatar?: string
  role: 'viewer' | 'subscriber' | 'moderator' | 'vip' | 'streamer'
  isOnline: boolean
}

export default function StreamChat() {
  const { user, isAuthenticated } = useAuth()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [connectedUsers, setConnectedUsers] = useState<ChatUser[]>([])
  const [isSoundEnabled, setIsSoundEnabled] = useState(true)
  const [chatMode, setChatMode] = useState<'all' | 'subscribers' | 'followers'>('all')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Mock data for demonstration
  useEffect(() => {
    const mockMessages: ChatMessage[] = [
      {
        id: '1',
        userId: 'user1',
        username: 'GamerPro123',
        avatar: '/api/placeholder/32/32',
        message: 'Awesome stream! Love the gameplay 🎮',
        timestamp: new Date(Date.now() - 300000),
        type: 'message',
        role: 'subscriber'
      },
      {
        id: '2',
        userId: 'user2',
        username: 'MusicLover',
        message: 'Just followed! Keep up the great content',
        timestamp: new Date(Date.now() - 240000),
        type: 'follow',
        role: 'viewer'
      },
      {
        id: '3',
        userId: 'user3',
        username: 'ArtisticSoul',
        message: 'Sent a virtual coffee ☕',
        timestamp: new Date(Date.now() - 180000),
        type: 'gift',
        role: 'viewer',
        gift: {
          name: 'Coffee',
          value: 5,
          icon: '☕'
        }
      },
      {
        id: '4',
        userId: 'mod1',
        username: 'ModeratorX',
        message: 'Welcome everyone to the stream! Please follow the chat rules.',
        timestamp: new Date(Date.now() - 120000),
        type: 'message',
        role: 'moderator'
      }
    ]
    setMessages(mockMessages)

    const mockUsers: ChatUser[] = [
      { id: 'user1', username: 'GamerPro123', role: 'subscriber', isOnline: true },
      { id: 'user2', username: 'MusicLover', role: 'viewer', isOnline: true },
      { id: 'user3', username: 'ArtisticSoul', role: 'viewer', isOnline: true },
      { id: 'mod1', username: 'ModeratorX', role: 'moderator', isOnline: true },
      { id: 'vip1', username: 'VIPFan', role: 'vip', isOnline: true },
    ]
    setConnectedUsers(mockUsers)
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleSendMessage = () => {
    if (!newMessage.trim() || !isAuthenticated) return

    const message: ChatMessage = {
      id: Date.now().toString(),
      userId: user?.id || 'current-user',
      username: user?.username || 'You',
      avatar: user?.avatar,
      message: newMessage,
      timestamp: new Date(),
      type: 'message',
      role: user?.role || 'viewer'
    }

    setMessages(prev => [...prev, message])
    setNewMessage('')
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'streamer': return 'text-purple-600 font-semibold'
      case 'moderator': return 'text-green-600 font-semibold'
      case 'vip': return 'text-yellow-600 font-semibold'
      case 'subscriber': return 'text-blue-600 font-semibold'
      default: return 'text-foreground'
    }
  }

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'streamer': return <Badge className="text-xs bg-purple-100 text-purple-700">STREAMER</Badge>
      case 'moderator': return <Badge className="text-xs bg-green-100 text-green-700">MOD</Badge>
      case 'vip': return <Badge className="text-xs bg-yellow-100 text-yellow-700">VIP</Badge>
      case 'subscriber': return <Badge className="text-xs bg-blue-100 text-blue-700">SUB</Badge>
      default: return null
    }
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const renderMessage = (msg: ChatMessage) => {
    if (msg.type === 'gift') {
      return (
        <div key={msg.id} className="flex items-center gap-2 p-2 bg-yellow-50 rounded-lg border border-yellow-200">
          <Gift className="w-4 h-4 text-yellow-600" />
          <span className="text-yellow-800">
            <span className={getRoleColor(msg.role)}>{msg.username}</span> sent {msg.gift?.icon} {msg.gift?.name} (${msg.gift?.value})
          </span>
        </div>
      )
    }

    if (msg.type === 'follow') {
      return (
        <div key={msg.id} className="flex items-center gap-2 p-2 bg-blue-50 rounded-lg border border-blue-200">
          <Heart className="w-4 h-4 text-blue-600" />
          <span className="text-blue-800">
            <span className={getRoleColor(msg.role)}>{msg.username}</span> {msg.message}
          </span>
        </div>
      )
    }

    return (
      <div key={msg.id} className="flex gap-3 p-2 hover:bg-muted/50 rounded-lg group">
        <Avatar className="w-8 h-8">
          <AvatarImage src={msg.avatar} alt={msg.username} />
          <AvatarFallback className="text-xs">
            {msg.username.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-sm font-medium ${getRoleColor(msg.role)}`}>
              {msg.username}
            </span>
            {getRoleBadge(msg.role)}
            <span className="text-xs text-muted-foreground">
              {formatTime(msg.timestamp)}
            </span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 h-6 w-6 p-0">
                  <MoreVertical className="w-3 h-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>
                  <Shield className="w-4 h-4 mr-2" />
                  Report
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Ban className="w-4 h-4 mr-2" />
                  Block User
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Clock className="w-4 h-4 mr-2" />
                  Timeout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <p className="text-sm text-foreground leading-relaxed break-words">
            {msg.message}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full max-h-[600px] bg-background border rounded-lg">
      {/* Chat Header */}
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Users className="w-5 h-5" />
            Chat ({connectedUsers.length})
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsSoundEnabled(!isSoundEnabled)}
            >
              {isSoundEnabled ? (
                <Volume2 className="w-4 h-4" />
              ) : (
                <VolumeX className="w-4 h-4" />
              )}
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <Settings className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setChatMode('all')}>
                  All Messages
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setChatMode('subscribers')}>
                  Subscribers Only
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setChatMode('followers')}>
                  Followers Only
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>

      <Separator />

      {/* Messages */}
      <CardContent className="flex-1 p-0 overflow-hidden">
        <ScrollArea className="h-full p-4">
          <div className="space-y-2">
            {messages.map(renderMessage)}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
      </CardContent>

      <Separator />

      {/* Message Input */}
      <CardContent className="p-4">
        {isAuthenticated ? (
          <div className="flex gap-2">
            <Input
              ref={inputRef}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              className="flex-1"
              maxLength={500}
            />
            <Button size="sm" onClick={handleSendMessage} disabled={!newMessage.trim()}>
              <Send className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm">
              <Smile className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm">
              <Gift className="w-4 h-4" />
            </Button>
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-muted-foreground mb-2">
              Đăng nhập để tham gia cuộc trò chuyện
            </p>
            <Button size="sm">Đăng nhập</Button>
          </div>
        )}
      </CardContent>
    </div>
  )
}
