'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Users, Play, MessageCircle, Lock } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import Link from 'next/link'

interface StreamData {
  id: string
  title: string
  creator: string
  viewers: number
  category: string
  thumbnail: string
  isLive: boolean
  isPrivate?: boolean
}

interface StreamCardProps {
  stream: StreamData
  showWatchButton?: boolean
}

export default function StreamCard({ stream, showWatchButton = true }: StreamCardProps) {
  const { isAuthenticated, isGuest } = useAuth()

  const handleWatchClick = () => {
    if (stream.isPrivate && !isAuthenticated) {
      // Redirect to login for private streams
      window.location.href = '/login'
      return
    }
    
    // Navigate to watch page
    window.location.href = `/watch/${stream.id}`
  }

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <div className="relative">
        <div className="aspect-video bg-gray-200 relative">
          {/* Stream thumbnail */}
          <div className="w-full h-full bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center">
            <Play className="w-16 h-16 text-gray-400" />
          </div>
          
          {/* Live badge */}
          {stream.isLive && (
            <Badge className="absolute top-2 left-2 bg-red-500 hover:bg-red-600">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse mr-1" />
              LIVE
            </Badge>
          )}
          
          {/* Private stream indicator */}
          {stream.isPrivate && (
            <Badge className="absolute top-2 right-2 bg-purple-500 hover:bg-purple-600">
              <Lock className="w-3 h-3 mr-1" />
              Private
            </Badge>
          )}
          
          {/* Viewer count */}
          <div className="absolute bottom-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-sm">
            <Users className="inline w-4 h-4 mr-1" />
            {stream.viewers.toLocaleString()}
          </div>
          
          {/* Watch button overlay */}
          {showWatchButton && (
            <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity bg-black/20">
              <Button 
                size="lg" 
                className="rounded-full"
                onClick={handleWatchClick}
              >
                <Play className="w-6 h-6" />
              </Button>
            </div>
          )}
        </div>
      </div>
      
      <CardHeader className="pb-2">
        <CardTitle className="text-lg line-clamp-2">{stream.title}</CardTitle>
        <div className="flex items-center justify-between">
          <p className="text-muted-foreground">@{stream.creator}</p>
          <Badge variant="secondary">{stream.category}</Badge>
        </div>
      </CardHeader>
      
      {/* Guest notification for interaction */}
      {isGuest && (
        <CardContent className="pt-0">
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
            <div className="flex items-center gap-2 text-yellow-800 text-sm">
              <MessageCircle className="w-4 h-4" />
              <span>Đăng nhập để chat và tương tác</span>
            </div>
            <Link href="/login" className="block mt-2">
              <Button size="sm" variant="outline" className="w-full border-yellow-300 text-yellow-700 hover:bg-yellow-100">
                Đăng nhập
              </Button>
            </Link>
          </div>
        </CardContent>
      )}
    </Card>
  )
}
