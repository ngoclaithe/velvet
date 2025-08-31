'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { toast } from 'react-hot-toast'
import {
  Send,
  Gift,
  MessageCircle,
  Users,
  Settings,
  Volume2,
  VolumeX
} from 'lucide-react'
import { chatWebSocket, getWebSocket } from '@/lib/websocket'
import { chatApi } from '@/lib/api/chat'
import { giftApi } from '@/lib/api/gift'
import { useAuth } from '@/hooks/useAuth'

interface ChatMessage {
  id: string
  userId: string
  username: string
  displayName: string
  message: string
  timestamp: string
  type: 'message' | 'gift' | 'tip' | 'system'
  giftType?: string
  amount?: number
  giftId?: string | number
  quantity?: number
  avatar?: string
}

interface GiftOption {
  id: string
  name: string
  icon: string
  price: number
  animation?: string
}

interface StreamChatBoxProps {
  streamId: string
  isCreator?: boolean
  chatEnabled?: boolean
  className?: string
  maxHeight?: string
}

const [giftOptions, setGiftOptions] = useState<GiftOption[]>([])
const [selectedQuantity, setSelectedQuantity] = useState<number>(1)

export default function StreamChatBox({ 
  streamId, 
  isCreator = false, 
  chatEnabled = true, 
  className = '', 
  maxHeight = '600px' 
}: StreamChatBoxProps) {
  const { user, isAuthenticated } = useAuth()
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [isWebSocketConnected, setIsWebSocketConnected] = useState(false)
  const [showGiftDialog, setShowGiftDialog] = useState(false)
  const [isSoundEnabled, setIsSoundEnabled] = useState(true)
  const [connectedUsers, setConnectedUsers] = useState(0)
  
  const chatScrollRef = useRef<HTMLDivElement>(null)
  const recentMessageKeysRef = useRef<Map<string, number>>(new Map())

  // Load gifts from API
  useEffect(() => {
    let mounted = true
    giftApi.getAllGifts()
      .then((resp: any) => {
        if (!mounted) return
        if (resp?.success && Array.isArray(resp.data)) {
          const mapped: GiftOption[] = resp.data.map((g: any) => ({
            id: String(g.id ?? g._id ?? g.giftId ?? ''),
            name: g.name,
            icon: g.icon || '',
            price: Number(g.price ?? g.cost ?? 0),
            animation: g.animationUrl || g.animation,
          })).filter((g: GiftOption) => g.id)
          setGiftOptions(mapped)
        }
      })
      .catch(() => {})
    return () => { mounted = false }
  }, [])

  // Chat messages will be populated through API on join and real-time via WebSocket events

  // Setup WebSocket for real-time chat
  useEffect(() => {
    if (!streamId || streamId === 'undefined' || streamId === 'null' || streamId.trim() === '' || !chatEnabled) return

    const webSocket = getWebSocket()
    
    const setupWebSocket = async () => {
      try {
        // Connect to WebSocket if not already connected
        if (!webSocket.isConnected()) {
          await webSocket.connect(user?.id)
        }
        
        // Join stream chat room
        console.log('Joining stream chat for streamId:', streamId)
        chatWebSocket.joinStreamChat(streamId)
        setIsWebSocketConnected(true)

        // Fetch initial messages
        try {
          const resp: any = await chatApi.getMessages(streamId)
          if (resp?.success && Array.isArray(resp.data)) {
            const initialMessages: ChatMessage[] = resp.data.map((m: any) => ({
              id: String(m.id || m.messageId || m._id || Date.now()),
              userId: String(m.userId || m.senderId || ''),
              username: m.username || m.sender?.username || '',
              displayName: m.displayName || m.sender?.username || m.username || '',
              message: m.content || m.message || '',
              timestamp: m.timestamp || m.createdAt || new Date().toISOString(),
              type: (m.type || m.messageType || 'message') as any,
              giftType: m.giftType,
              amount: m.amount,
              giftId: m.giftId,
              quantity: m.quantity,
              avatar: m.avatar || m.sender?.avatar,
            }))
            setChatMessages(initialMessages)
          }
        } catch (e) {
          // ignore fetch error
        }

        // Listen for new chat messages from backend 'stream_chat_message' event
        const handleNewMessage = (data: any) => {
          console.log('Received stream_chat_message:', data)
          // Backend sends: { messageId, streamId, userId, username, displayName, avatar, message, timestamp }
          const newMessage: ChatMessage = {
            id: data.messageId || data.id || Date.now().toString(),
            userId: (data.userId?.toString() || data.userId || '').toString(),
            username: data.username || data.displayName || '',
            displayName: data.displayName || data.username || '',
            message: data.message || data.content || '',
            timestamp: data.timestamp || data.createdAt || new Date().toISOString(),
            type: data.type || data.messageType || 'message',
            giftType: data.giftType,
            amount: data.amount,
            giftId: data.giftId,
            quantity: data.quantity,
            avatar: data.avatar
          }

          // Only add message if it's for this stream
          if (data.streamId === streamId) {
            const key = `${newMessage.userId}|${newMessage.type}|${newMessage.message}|${newMessage.giftId || ''}|${newMessage.quantity || ''}`
            const now = Date.now()
            const last = recentMessageKeysRef.current.get(key)
            if (last && now - last < 2000) {
              return
            }
            recentMessageKeysRef.current.set(key, now)

            setChatMessages(prev => {
              // Avoid duplicate messages by id as well
              const exists = prev.some(msg => msg.id === newMessage.id)
              if (exists) return prev
              return [...prev, newMessage]
            })

            // Play sound notification for new messages (except own messages)
            if (isSoundEnabled && data.userId?.toString() !== user?.id?.toString()) {
              // Could add sound notification here
            }
          }
        }
        
        // Listen for user count updates
        const handleUserCountUpdate = (data: any) => {
          setConnectedUsers(data.count || 0)
        }
        
        chatWebSocket.onStreamChatMessage(handleNewMessage)
        webSocket.on('chat_user_count', handleUserCountUpdate)

        console.log('WebSocket setup complete for stream:', streamId)
        
      } catch (error) {
        console.error('Error setting up WebSocket:', error)
        setIsWebSocketConnected(false)
      }
    }
    
    if (isAuthenticated) {
      setupWebSocket()
    }
    
    // Cleanup on unmount
    return () => {
      if (streamId) {
        console.log('Leaving stream chat for streamId:', streamId)
        chatWebSocket.leaveStreamChat(streamId)
        // Clean up event listeners to prevent memory leaks
        const ws = getWebSocket()
        ws.off('stream_chat_message')
        ws.off('chat_user_count')
      }
    }
  }, [streamId, chatEnabled, isAuthenticated, user?.id, isSoundEnabled])

  // Auto scroll to bottom
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight
    }
  }, [chatMessages])

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !isAuthenticated || !user) return
    if (!streamId || streamId === 'undefined' || streamId === 'null' || streamId.trim() === '') {
      toast.error('Stream chưa sẵn sàng, vui lòng thử lại')
      return
    }

    const messageText = newMessage.trim()
    setNewMessage('')

    try {
      await chatApi.sendMessage({
        streamId,
        content: messageText,
        messageType: 'message',
        messageTypes: 'message',
      })
    } catch (e) {
      // ignore; UI will still try websocket if available
    }

    if (isWebSocketConnected) {
      chatWebSocket.sendChatMessage(streamId, {
        userId: user.id,
        username: user.username,
        displayName: user.firstName || user.username,
        message: messageText,
        timestamp: new Date().toISOString(),
        type: 'message',
        avatar: user.avatar
      })
    } else {
      toast.error('Không thể gửi tin nhắn (mất kết nối)')
      setNewMessage(messageText)
    }
  }

  const handleSendGift = async (gift: GiftOption) => {
    if (!isAuthenticated || !user) {
      toast.error('Vui lòng đăng nhập để gửi quà')
      return
    }

    try {
      await chatApi.sendMessage({
        streamId,
        content: `gift:${gift.id}:x${selectedQuantity}`,
        messageType: 'gift',
        messageTypes: 'gift',
        giftId: gift.id,
        quantity: selectedQuantity,
      })
    } catch (e) {
      // ignore
    }

    if (isWebSocketConnected) {
      chatWebSocket.sendChatMessage(streamId, {
        userId: user.id,
        username: user.username,
        displayName: user.firstName || user.username,
        message: `Đã gửi ${gift.name} x${selectedQuantity} ${gift.icon || ''}`.trim(),
        timestamp: new Date().toISOString(),
        type: 'gift',
        avatar: user.avatar
      })
      setShowGiftDialog(false)
      toast.success(`Đã gửi ${gift.name} x${selectedQuantity}`)
    } else {
      toast.error('Không thể gửi quà (mất kết nối)')
    }
  }

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString('vi-VN', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  const getRoleIndicator = (message: ChatMessage) => {
    if (message.userId === user?.id && isCreator) {
      return <Badge className="bg-purple-500 text-white text-xs ml-1">STREAMER</Badge>
    }
    if (message.type === 'gift') {
      return <Badge className="bg-yellow-500 text-white text-xs ml-1">GIFT</Badge>
    }
    return null
  }

  if (!chatEnabled) {
    return (
      <Card className={`bg-gray-800 border-gray-700 ${className}`}>
        <CardContent className="p-6 text-center">
          <MessageCircle className="w-8 h-8 text-gray-500 mx-auto mb-2" />
          <p className="text-gray-400">Chat đã được tắt cho stream này</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={`bg-gray-800 border-gray-700 flex flex-col ${className}`} style={{ maxHeight }}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-white flex items-center space-x-2">
          <MessageCircle className="w-5 h-5" />
          <span>Chat {isCreator ? '(Creator)' : '(Viewer)'}</span>
          {isWebSocketConnected && (
            <div className="w-2 h-2 bg-green-500 rounded-full ml-2" title="Kết nối real-time" />
          )}
        </CardTitle>
        <div className="flex items-center space-x-2">
          {connectedUsers > 0 && (
            <Badge variant="outline" className="border-gray-600 text-gray-300">
              <Users className="w-3 h-3 mr-1" />
              {connectedUsers}
            </Badge>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsSoundEnabled(!isSoundEnabled)}
            className="text-gray-400 hover:text-white"
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
              <DialogContent className="bg-gray-800 border-gray-700">
                <DialogHeader>
                  <DialogTitle className="text-white">Gửi quà tặng</DialogTitle>
                </DialogHeader>
                <div className="mb-3 flex items-center justify-between">
                  <div className="text-sm text-gray-300">Số lượng</div>
                  <div className="flex items-center space-x-2">
                    <Button size="sm" variant="outline" onClick={() => setSelectedQuantity(q => Math.max(1, q - 1))}>-</Button>
                    <span className="w-8 text-center text-white">{selectedQuantity}</span>
                    <Button size="sm" variant="outline" onClick={() => setSelectedQuantity(q => q + 1)}>+</Button>
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-3">
                  {giftOptions.map((gift) => (
                    <div
                      key={gift.id}
                      onClick={() => handleSendGift(gift)}
                      className="p-3 bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-600 transition-colors text-center"
                    >
                      <div className="text-2xl mb-1">{gift.icon || '🎁'}</div>
                      <div className="text-xs text-white">{gift.name}</div>
                      <div className="text-xs text-yellow-400">{gift.price} xu</div>
                    </div>
                  ))}
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-4 space-y-4 min-h-0">
        {/* Messages */}
        <ScrollArea className="flex-1" ref={chatScrollRef}>
          <div className="space-y-3">
            {chatMessages.map((message) => (
              <div key={message.id} className="text-sm">
                <div className="flex items-start space-x-2">
                  <Avatar className="w-6 h-6">
                    <AvatarImage src={message.avatar} />
                    <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xs">
                      {message.displayName.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center space-x-1">
                      <span className="font-medium text-white text-xs">
                        {message.displayName}
                      </span>
                      {getRoleIndicator(message)}
                      <span className="text-gray-500 text-xs">
                        {formatTime(message.timestamp)}
                      </span>
                    </div>
                    <div className={`mt-1 ${
                      message.type === 'gift' 
                        ? 'text-yellow-400 font-medium' 
                        : message.type === 'system'
                        ? 'text-blue-400 italic'
                        : 'text-gray-300'
                    }`}>
                      {message.message}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        {/* Message Input */}
        {isAuthenticated ? (
          <div className="flex space-x-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder={`Nhập tin nhắn${isCreator ? ' (Creator)' : ''}...`}
              className="flex-1 bg-gray-700 border-gray-600 text-white"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleSendMessage()
                }
              }}
              maxLength={500}
            />
            <Button 
              onClick={handleSendMessage}
              disabled={!newMessage.trim()}
              size="sm"
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        ) : (
          <div className="text-center">
            <p className="text-gray-400 text-sm mb-2">
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
