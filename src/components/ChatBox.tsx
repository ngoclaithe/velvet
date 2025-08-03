'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Send, MessageCircle } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import PermissionGate from './PermissionGate'

interface ChatMessage {
  id: string
  username: string
  message: string
  role: 'guest' | 'user' | 'creator' | 'moderator' | 'admin'
  timestamp: Date
}

interface ChatBoxProps {
  streamId?: string
  className?: string
}

export default function ChatBox({ streamId, className }: ChatBoxProps) {
  const { user, canComment } = useAuth()
  const [message, setMessage] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      username: 'sarah_gamer',
      message: 'Chào mọi người! Cảm ơn đã join stream nhé!',
      role: 'creator',
      timestamp: new Date(Date.now() - 300000), // 5 minutes ago
    },
    {
      id: '2', 
      username: 'viewer123',
      message: 'Game này hay quá! Mình cũng đang chơi',
      role: 'user',
      timestamp: new Date(Date.now() - 120000), // 2 minutes ago
    },
    {
      id: '3',
      username: 'mod_anna',
      message: 'Nhớ follow các rule chat nhé mọi người!',
      role: 'moderator', 
      timestamp: new Date(Date.now() - 60000), // 1 minute ago
    }
  ])

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim() || !canComment() || !user) return

    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      username: user.username,
      message: message.trim(),
      role: user.role,
      timestamp: new Date(),
    }

    setMessages([...messages, newMessage])
    setMessage('')
  }

  const getRoleColor = (role: ChatMessage['role']) => {
    switch (role) {
      case 'creator':
        return 'bg-yellow-500 text-white'
      case 'moderator':
        return 'bg-green-500 text-white'
      case 'admin':
        return 'bg-red-500 text-white'
      case 'user':
        return 'bg-blue-500 text-white'
      default:
        return 'bg-gray-500 text-white'
    }
  }

  const getRoleText = (role: ChatMessage['role']) => {
    switch (role) {
      case 'creator':
        return 'Streamer'
      case 'moderator':
        return 'Mod'
      case 'admin':
        return 'Admin'
      case 'user':
        return 'User'
      default:
        return 'Guest'
    }
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="w-5 h-5" />
          Chat trực tiếp
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Messages */}
        <ScrollArea className="h-96 border rounded-md p-3">
          <div className="space-y-3">
            {messages.map((msg) => (
              <div key={msg.id} className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <Badge className={`text-xs px-2 py-1 ${getRoleColor(msg.role)}`}>
                    {getRoleText(msg.role)}
                  </Badge>
                  <span className="font-medium text-sm">{msg.username}</span>
                  <span className="text-xs text-muted-foreground">
                    {msg.timestamp.toLocaleTimeString('vi-VN', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </span>
                </div>
                <p className="text-sm ml-2">{msg.message}</p>
              </div>
            ))}
          </div>
        </ScrollArea>

        {/* Message Input */}
        <PermissionGate action="comment">
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Nhập tin nhắn..."
              className="flex-1"
              maxLength={500}
            />
            <Button type="submit" size="sm" disabled={!message.trim()}>
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </PermissionGate>
      </CardContent>
    </Card>
  )
}
