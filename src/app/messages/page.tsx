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
import { 
  MessageCircle, 
  Send, 
  Search, 
  Plus, 
  MoreVertical,
  Phone,
  Video,
  Info,
  Archive,
  Trash2,
  Pin,
  Star,
  Image,
  Paperclip,
  Smile,
  Check,
  CheckCheck,
  Loader
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
  const { user, isLoading: authLoading, isAuthenticated } = useAuth()
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
    chatApi.getConversation(selectedConversationId)
      .then((resp: any) => {
        if (resp?.success && resp.data) setSelectedConversation(resp.data)
      })
      .catch(() => setSelectedConversation(null))
  }, [isAuthenticated, selectedConversationId])



  const getSelectedConversationData = () => {
    return selectedConversation as any
  }

  const getMessagesForConversation = (conversationId: string) => {
    return []
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

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [selectedConversation, selectedConversationId])

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !selectedConversation) return

    setIsSending(true)
    try {
      // Mock sending message
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // In real app, would update messages via API/WebSocket
      setMessageInput('')
    } catch (error) {
      console.error('Failed to send message:', error)
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
        <div className="w-1/3 border-r">
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
                    <div className="space-y-2">
                      {mockUsers.map(user => (
                        <div key={user.id} className="flex items-center space-x-3 p-2 hover:bg-gray-100 rounded-lg cursor-pointer">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={user.avatar} />
                            <AvatarFallback>{user.username.charAt(0).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{user.username}</span>
                          {user.isOnline && <Badge variant="secondary" className="bg-green-100 text-green-800">Online</Badge>}
                        </div>
                      ))}
                    </div>
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
                {filteredConversations.map((conversation) => {
                  const participant = conversation.participants[0]
                  const isSelected = selectedConversation === conversation.id
                  
                  return (
                    <div
                      key={conversation.id}
                      onClick={() => setSelectedConversation(conversation.id)}
                      className={`p-3 rounded-lg cursor-pointer transition-colors ${
                        isSelected ? 'bg-primary/10' : 'hover:bg-gray-100'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="relative">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={participant.avatar} />
                            <AvatarFallback>{participant.username.charAt(0).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          {participant.isOnline && (
                            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                          )}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <p className="font-medium truncate">{participant.username}</p>
                              {conversation.isPinned && <Pin className="h-3 w-3 text-muted-foreground" />}
                            </div>
                            <div className="flex items-center space-x-1">
                              {conversation.lastMessage && (
                                <span className="text-xs text-muted-foreground">
                                  {formatLastMessageTime(conversation.lastMessage.timestamp)}
                                </span>
                              )}
                              {conversation.unreadCount > 0 && (
                                <Badge variant="default" className="bg-blue-600 text-white h-5 w-5 text-xs rounded-full p-0 flex items-center justify-center">
                                  {conversation.unreadCount}
                                </Badge>
                              )}
                            </div>
                          </div>
                          {conversation.lastMessage && (
                            <p className="text-sm text-muted-foreground truncate">
                              {conversation.lastMessage.senderId === user?.id && 'Bạn: '}
                              {conversation.lastMessage.content}
                            </p>
                          )}
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
        <div className="flex-1 flex flex-col">
          {selectedConversation ? (
            <>
              {/* Chat Header */}
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={getSelectedConversationData()?.participants[0].avatar} />
                      <AvatarFallback>
                        {getSelectedConversationData()?.participants[0].username.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold">{getSelectedConversationData()?.participants[0].username}</h3>
                      <p className="text-sm text-muted-foreground">
                        {getSelectedConversationData()?.participants[0].isOnline ? (
                          <span className="text-green-600">Đang hoạt động</span>
                        ) : (
                          `Hoạt động ${formatMessageTime(getSelectedConversationData()?.participants[0].lastSeen || new Date())}`
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button size="icon" variant="ghost">
                      <Phone className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost">
                      <Video className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost">
                      <Info className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <Separator />

              {/* Messages */}
              <CardContent className="flex-1 p-0">
                <ScrollArea className="h-[calc(80vh-200px)] p-4">
                  <div className="space-y-4">
                    {getMessagesForConversation(selectedConversation).map((message) => {
                      const isOwnMessage = message.senderId === user?.id
                      
                      return (
                        <div
                          key={message.id}
                          className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                        >
                          <div className={`max-w-xs lg:max-w-md ${isOwnMessage ? 'order-2' : 'order-1'}`}>
                            <div
                              className={`px-4 py-2 rounded-lg ${
                                isOwnMessage
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-gray-100 text-gray-900'
                              }`}
                            >
                              <p className="text-sm">{message.content}</p>
                            </div>
                            <div className={`flex items-center mt-1 space-x-1 ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
                              <span className="text-xs text-muted-foreground">
                                {formatMessageTime(message.timestamp)}
                              </span>
                              {isOwnMessage && (
                                <div className="flex">
                                  {message.isDelivered ? (
                                    message.isRead ? (
                                      <CheckCheck className="h-3 w-3 text-blue-600" />
                                    ) : (
                                      <CheckCheck className="h-3 w-3 text-gray-400" />
                                    )
                                  ) : (
                                    <Check className="h-3 w-3 text-gray-400" />
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>
              </CardContent>

              {/* Message Input */}
              <div className="p-4 border-t">
                <div className="flex items-center space-x-2">
                  <Button size="icon" variant="ghost">
                    <Paperclip className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost">
                    <Image className="h-4 w-4" />
                  </Button>
                  <div className="flex-1 relative">
                    <Input
                      placeholder="Nhập tin nhắn..."
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      onKeyPress={handleKeyPress}
                      className="pr-10"
                    />
                    <Button size="icon" variant="ghost" className="absolute right-1 top-1/2 transform -translate-y-1/2">
                      <Smile className="h-4 w-4" />
                    </Button>
                  </div>
                  <Button 
                    size="icon" 
                    onClick={handleSendMessage}
                    disabled={!messageInput.trim() || isSending}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {isSending ? (
                      <Loader className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </>
          ) : (
            /* No Conversation Selected */
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
