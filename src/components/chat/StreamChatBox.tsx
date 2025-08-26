'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import {
  Send,
  Gift,
  Users,
  Volume2,
  VolumeX,
  MessageCircle,
  Heart,
  Star,
  Crown
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { getSocketService } from '@/lib/socket'
import { toast } from 'react-hot-toast'

export interface ChatMessage {
  id: string
  userId: string
  username: string
  displayName: string
  message: string
  timestamp: string
  type: 'message' | 'gift' | 'tip' | 'system'
  giftType?: string
  amount?: number
  role?: 'viewer' | 'subscriber' | 'moderator' | 'vip' | 'creator'
}

interface GiftOption {
  id: string
  name: string
  icon: string
  price: number
}

interface StreamChatBoxProps {
  streamId: string
  isCreator: boolean
  className?: string
  height?: string
}

const giftOptions: GiftOption[] = [
  { id: '1', name: 'Hoa hồng', icon: '🌹', price: 1 },
  { id: '2', name: 'Tim', icon: '❤️', price: 2 },
  { id: '3', name: 'Kem', icon: '🍦', price: 5 },
  { id: '4', name: 'Pizza', icon: '🍕', price: 10 },
  { id: '5', name: 'Xe hơi', icon: '🚗', price: 50 },
  { id: '6', name: 'Nhà', icon: '🏠', price: 100 },
  { id: '7', name: 'Máy bay', icon: '✈️', price: 500 },
  { id: '8', name: 'Tên lửa', icon: '🚀', price: 1000 }
]

export default function StreamChatBox({ 
  streamId, 
  isCreator, 
  className = '', 
  height = '500px' 
}: StreamChatBoxProps) {
  const { user, isAuthenticated } = useAuth()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [connectedUsers, setConnectedUsers] = useState(0)
  const [isSoundEnabled, setIsSoundEnabled] = useState(true)
  const [socketConnected, setSocketConnected] = useState(false)
  const [showGiftDialog, setShowGiftDialog] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const socketService = getSocketService()

  // Initialize socket connection for chat
  useEffect(() => {
    const initializeSocket = async () => {
      try {
        const socketConfig = {
          accessCode: streamId,
          clientType: isCreator ? 'creator' : 'viewer' as 'creator' | 'viewer',
          streamId: streamId
        }

        await socketService.connect(socketConfig)
        setSocketConnected(socketService.getIsConnected())

        // Set up chat event listeners
        socketService.on('chat_message', (data: any) => {
          const newMessage: ChatMessage = {
            id: data.id || Date.now().toString(),
            userId: data.userId,
            username: data.username,
            displayName: data.displayName || data.username,
            message: data.message,
            timestamp: data.timestamp || new Date().toISOString(),
            type: data.type || 'message',
            giftType: data.giftType,
            amount: data.amount,
            role: data.isCreator ? 'creator' : 'viewer'
          }
          setMessages(prev => [...prev, newMessage])
          
          // Play sound notification if enabled
          if (isSoundEnabled && data.userId !== user?.id) {
            playNotificationSound()
          }
        })

        socketService.on('user_joined', (data: any) => {
          const systemMessage: ChatMessage = {
            id: Date.now().toString(),
            userId: 'system',
            username: 'System',
            displayName: 'System',
            message: `${data.displayName || data.username} đã tham gia`,
            timestamp: new Date().toISOString(),
            type: 'system'
          }
          setMessages(prev => [...prev, systemMessage])
        })

        socketService.on('user_left', (data: any) => {
          const systemMessage: ChatMessage = {
            id: Date.now().toString(),
            userId: 'system',
            username: 'System', 
            displayName: 'System',
            message: `${data.displayName || data.username} đã rời khỏi`,
            timestamp: new Date().toISOString(),
            type: 'system'
          }
          setMessages(prev => [...prev, systemMessage])
        })

        socketService.on('gift_sent', (data: any) => {
          const giftMessage: ChatMessage = {
            id: data.id || Date.now().toString(),
            userId: data.senderId,
            username: data.senderUsername,
            displayName: data.senderDisplayName || data.senderUsername,
            message: `đã gửi ${data.giftName} ${data.giftIcon}`,
            timestamp: data.timestamp || new Date().toISOString(),
            type: 'gift',
            giftType: data.giftName,
            amount: data.amount
          }
          setMessages(prev => [...prev, giftMessage])
          
          if (isSoundEnabled) {
            playGiftSound()
          }
        })

        socketService.onViewerCountUpdated((data: { count: number }) => {
          setConnectedUsers(data.count)
        })

        // Load initial chat messages with sample data
        const initialMessages: ChatMessage[] = [
          {
            id: '1',
            userId: 'system',
            username: 'System',
            displayName: 'System',
            message: 'Chào mừng đến với live stream!',
            timestamp: new Date().toISOString(),
            type: 'system'
          }
        ]
        setMessages(initialMessages)

      } catch (error) {
        console.error('Error initializing socket:', error)
        setSocketConnected(false)
      }
    }

    if (streamId) {
      initializeSocket()
    }

    return () => {
      socketService.off('chat_message')
      socketService.off('user_joined')
      socketService.off('user_left')
      socketService.off('gift_sent')
    }
  }, [streamId, isCreator, socketService, isSoundEnabled, user?.id])

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const playNotificationSound = () => {
    // Simple beep sound for new messages
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()
      
      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)
      
      oscillator.frequency.value = 800
      gainNode.gain.value = 0.1
      
      oscillator.start()
      oscillator.stop(audioContext.currentTime + 0.1)
    } catch (e) {
      // Fallback if audio context not available
    }
  }

  const playGiftSound = () => {
    // Different sound for gifts
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()
      
      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)
      
      oscillator.frequency.value = 1200
      gainNode.gain.value = 0.15
      
      oscillator.start()
      oscillator.stop(audioContext.currentTime + 0.2)
    } catch (e) {
      // Fallback if audio context not available
    }
  }

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !isAuthenticated || !user) return

    try {
      // Send message via socket
      if (socketConnected) {
        const messageData = {
          streamId: streamId,
          userId: user.id,
          username: user.username,
          displayName: user.firstName || user.username,
          message: newMessage.trim(),
          timestamp: new Date().toISOString(),
          type: 'message',
          isCreator: isCreator
        }

        socketService.emit('send_chat_message', messageData)
        setNewMessage('')
        
        // Focus back to input
        inputRef.current?.focus()

      } else {
        toast.error('Không thể gửi tin nhắn - chưa kết nối socket')
      }
    } catch (error) {
      console.error('Error sending message:', error)
      toast.error('Không thể gửi tin nhắn')
    }
  }

  const handleSendGift = async (gift: GiftOption) => {
    if (!isAuthenticated || !user) {
      toast.error('Vui lòng đăng nhập để gửi quà')
      return
    }

    try {
      // Send gift via socket
      if (socketConnected) {
        const giftData = {
          streamId: streamId,
          giftId: gift.id,
          giftName: gift.name,
          giftIcon: gift.icon,
          amount: gift.price,
          senderId: user.id,
          senderUsername: user.username,
          senderDisplayName: user.firstName || user.username,
          timestamp: new Date().toISOString()
        }

        socketService.emit('send_gift', giftData)
        toast.success(`Đã gửi ${gift.name} ${gift.icon}`)
        setShowGiftDialog(false)
      } else {
        toast.error('Không thể gửi quà - chưa kết nối socket')
      }
    } catch (error) {
      console.error('Error sending gift:', error)
      toast.error('Không thể gửi quà')
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString('vi-VN', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  const getRoleIcon = (role?: string) => {
    switch (role) {
      case 'creator': return <Crown className="w-3 h-3 text-yellow-500" />
      case 'moderator': return <Star className="w-3 h-3 text-green-500" />
      case 'vip': return <Heart className="w-3 h-3 text-purple-500" />
      default: return null
    }
  }

  const getRoleColor = (role?: string) => {
    switch (role) {
      case 'creator': return 'text-yellow-600 font-semibold'
      case 'moderator': return 'text-green-600 font-semibold'
      case 'vip': return 'text-purple-600 font-semibold'
      default: return 'text-foreground'
    }
  }

  const renderMessage = (msg: ChatMessage) => {
    if (msg.type === 'system') {
      return (
        <div key={msg.id} className="flex justify-center py-2">
          <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
            {msg.message}
          </span>
        </div>
      )
    }

    if (msg.type === 'gift') {
      return (
        <div key={msg.id} className="flex items-center gap-2 p-2 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border border-yellow-200 my-1">
          <Gift className="w-4 h-4 text-yellow-600 flex-shrink-0" />
          <div className="flex items-center gap-1 flex-wrap">
            <span className={getRoleColor(msg.role)}>{msg.displayName}</span>
            <span className="text-yellow-800">{msg.message}</span>
            {msg.amount && (
              <Badge className="bg-yellow-500 text-white text-xs">{msg.amount} xu</Badge>
            )}
          </div>
        </div>
      )
    }

    return (
      <div key={msg.id} className="flex gap-2 p-2 hover:bg-muted/30 rounded group">
        <Avatar className="w-6 h-6 flex-shrink-0">
          <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xs">
            {msg.displayName.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1 mb-1">
            {getRoleIcon(msg.role)}
            <span className={`text-xs font-medium ${getRoleColor(msg.role)}`}>
              {msg.displayName}
            </span>
            <span className="text-xs text-muted-foreground">
              {formatTime(msg.timestamp)}
            </span>
          </div>
          <p className="text-sm text-foreground leading-relaxed break-words">
            {msg.message}
          </p>
        </div>
      </div>
    )
  }

  return (
    <Card className={`${className} flex flex-col`} style={{ height }}>
      {/* Chat Header */}
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="flex items-center space-x-2">
          <MessageCircle className="w-5 h-5" />
          <span>Chat trực tiếp</span>
          {connectedUsers > 0 && (
            <Badge variant="secondary">
              {connectedUsers}
            </Badge>
          )}
        </CardTitle>
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsSoundEnabled(!isSoundEnabled)}
          >
            {isSoundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </Button>
          
          {!isCreator && (
            <Dialog open={showGiftDialog} onOpenChange={setShowGiftDialog}>
              <DialogTrigger asChild>
                <Button size="sm" className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600">
                  <Gift className="w-4 h-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Gửi quà tặng</DialogTitle>
                </DialogHeader>
                <div className="grid grid-cols-4 gap-3">
                  {giftOptions.map((gift) => (
                    <div
                      key={gift.id}
                      onClick={() => handleSendGift(gift)}
                      className="p-3 bg-muted rounded-lg cursor-pointer hover:bg-muted/80 transition-colors text-center"
                    >
                      <div className="text-2xl mb-1">{gift.icon}</div>
                      <div className="text-xs font-medium">{gift.name}</div>
                      <div className="text-xs text-yellow-600">{gift.price} xu</div>
                    </div>
                  ))}
                </div>
              </DialogContent>
            </Dialog>
          )}

          <div className={`w-2 h-2 rounded-full ${socketConnected ? 'bg-green-500' : 'bg-red-500'}`} />
        </div>
      </CardHeader>

      <Separator />

      {/* Messages */}
      <CardContent className="flex-1 p-0 overflow-hidden">
        <ScrollArea className="h-full p-3">
          <div className="space-y-1">
            {messages.map(renderMessage)}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
      </CardContent>

      <Separator />

      {/* Message Input */}
      <CardContent className="p-3">
        {isAuthenticated ? (
          <div className="flex space-x-2">
            <Input
              ref={inputRef}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Nhập tin nhắn..."
              className="flex-1"
              maxLength={500}
            />
            <Button 
              onClick={handleSendMessage}
              disabled={!newMessage.trim() || !socketConnected}
              size="sm"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        ) : (
          <div className="text-center">
            <p className="text-muted-foreground text-sm mb-2">
              Đăng nhập để tham gia chat
            </p>
            <Button size="sm" asChild>
              <a href="/login">Đăng nhập</a>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
