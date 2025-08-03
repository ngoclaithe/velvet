'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Play, Users, Heart, Share2, Settings } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import ChatBox from '@/components/ChatBox'
import PermissionGate from '@/components/PermissionGate'
import StreamCard from '@/components/StreamCard'

export default function DemoPage() {
  const { user, isGuest, isAuthenticated } = useAuth()

  const currentStream = {
    id: 'demo-stream',
    title: 'Demo Stream - Gaming Night với Sarah',
    creator: 'sarah_gamer',
    viewers: 1234,
    category: 'Gaming',
    thumbnail: '/api/placeholder/400/225',
    isLive: true,
  }

  const relatedStreams = [
    {
      id: '1',
      title: 'Music & Chill Session',
      creator: 'music_mike',
      viewers: 856,
      category: 'Music',
      thumbnail: '/api/placeholder/400/225',
      isLive: true,
    },
    {
      id: '2',
      title: 'Art Tutorial: Digital Painting',
      creator: 'artist_anna',
      viewers: 623,
      category: 'Art',
      thumbnail: '/api/placeholder/400/225',
      isLive: true,
    },
    {
      id: '3',
      title: 'Private VIP Show',
      creator: 'vip_creator',
      viewers: 45,
      category: 'Entertainment',
      thumbnail: '/api/placeholder/400/225',
      isLive: true,
      isPrivate: true,
    },
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-bold">Demo Stream Page</h1>
              {isGuest && (
                <Badge variant="outline" className="border-yellow-500 text-yellow-700">
                  Chế độ khách
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              {isAuthenticated ? (
                <span className="text-sm">Xin chào, {user?.username}</span>
              ) : (
                <span className="text-sm text-muted-foreground">
                  Đang xem dưới dạng khách
                </span>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Video Player */}
            <Card>
              <CardContent className="p-0">
                <div className="aspect-video bg-gradient-to-br from-purple-900 to-blue-900 relative flex items-center justify-center">
                  <div className="text-center text-white">
                    <Play className="w-24 h-24 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium">Demo Video Player</p>
                    <p className="text-sm opacity-75">Stream đang phát trực tiếp</p>
                  </div>
                  <Badge className="absolute top-4 left-4 bg-red-500">
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse mr-2" />
                    LIVE
                  </Badge>
                  <div className="absolute bottom-4 right-4 bg-black/70 text-white px-3 py-1 rounded">
                    <Users className="inline w-4 h-4 mr-1" />
                    {currentStream.viewers.toLocaleString()}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Stream Info */}
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-xl">{currentStream.title}</CardTitle>
                    <p className="text-muted-foreground mt-1">
                      @{currentStream.creator} • {currentStream.category}
                    </p>
                  </div>
                  <Badge variant="secondary">{currentStream.category}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <PermissionGate 
                    action="comment" 
                    fallback={
                      <Button variant="outline" disabled>
                        <Heart className="w-4 h-4 mr-2" />
                        Like (Cần đăng nhập)
                      </Button>
                    }
                  >
                    <Button variant="outline">
                      <Heart className="w-4 h-4 mr-2" />
                      Like
                    </Button>
                  </PermissionGate>
                  
                  <Button variant="outline">
                    <Share2 className="w-4 h-4 mr-2" />
                    Chia sẻ
                  </Button>
                  
                  <PermissionGate 
                    action="post" 
                    fallback={
                      <Button variant="outline" disabled>
                        <Settings className="w-4 h-4 mr-2" />
                        Cài đặt (Cần đăng nhập)
                      </Button>
                    }
                  >
                    <Button variant="outline">
                      <Settings className="w-4 h-4 mr-2" />
                      Cài đặt Stream
                    </Button>
                  </PermissionGate>
                </div>
              </CardContent>
            </Card>

            {/* Post Section */}
            <Card>
              <CardHeader>
                <CardTitle>Đăng bài về stream</CardTitle>
              </CardHeader>
              <CardContent>
                <PermissionGate action="post">
                  <div className="space-y-4">
                    <textarea 
                      className="w-full p-3 border rounded-md resize-none" 
                      rows={3}
                      placeholder="Chia sẻ suy nghĩ về stream này..."
                    />
                    <Button>Đăng bài</Button>
                  </div>
                </PermissionGate>
              </CardContent>
            </Card>

            {/* Related Streams */}
            <Card>
              <CardHeader>
                <CardTitle>Streams liên quan</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {relatedStreams.map((stream) => (
                    <StreamCard 
                      key={stream.id} 
                      stream={stream} 
                      showWatchButton={false}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Chat */}
            <ChatBox streamId={currentStream.id} />

            {/* User Info if authenticated */}
            {isAuthenticated && (
              <Card>
                <CardHeader>
                  <CardTitle>Thông tin tài khoản</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p><strong>Username:</strong> {user?.username}</p>
                    <p><strong>Role:</strong> {user?.role}</p>
                    <p><strong>Email:</strong> {user?.email}</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Guest Info */}
            {isGuest && (
              <Card className="border-blue-200 bg-blue-50">
                <CardHeader>
                  <CardTitle className="text-blue-800">Chế độ khách</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-blue-700 mb-3">
                    Bạn đang xem nội dung dưới dạng khách. Tạo tài khoản để:
                  </p>
                  <ul className="text-sm text-blue-700 space-y-1 mb-4 list-disc list-inside">
                    <li>Tham gia chat trực tiếp</li>
                    <li>Đăng bài và bình luận</li>
                    <li>Like và follow streamer</li>
                    <li>Tạo stream riêng</li>
                  </ul>
                  <div className="flex gap-2">
                    <Button size="sm" className="flex-1">Đăng ký</Button>
                    <Button size="sm" variant="outline" className="flex-1">Đăng nhập</Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
