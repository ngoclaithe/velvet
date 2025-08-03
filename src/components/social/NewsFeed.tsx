'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Heart, 
  MessageCircle, 
  Share2, 
  Bookmark, 
  Eye,
  MoreHorizontal,
  Play,
  Image as ImageIcon,
  Video,
  Clock,
  TrendingUp,
  Users
} from 'lucide-react'

interface FeedPost {
  id: string
  type: 'text' | 'image' | 'video' | 'poll' | 'live'
  content: string
  author: {
    id: string
    username: string
    displayName: string
    avatar?: string
    isVerified: boolean
    isOnline?: boolean
  }
  media?: {
    type: 'image' | 'video'
    url: string
    thumbnail?: string
  }[]
  createdAt: Date
  likes: number
  comments: number
  shares: number
  views?: number
  isAdult: boolean
  isPremium: boolean
  isLiked?: boolean
  isBookmarked?: boolean
}

export default function NewsFeed() {
  const [activeTab, setActiveTab] = useState('for-you')
  
  const feedPosts: FeedPost[] = [
    {
      id: '1',
      type: 'image',
      content: 'Vừa hoàn thành bộ ảnh mới! Các bạn thấy concept này thế nào? 💕✨',
      author: {
        id: 'user1',
        username: 'luna_goddess',
        displayName: 'Luna Goddess',
        avatar: '/api/placeholder/40/40',
        isVerified: true,
        isOnline: true
      },
      media: [
        {
          type: 'image',
          url: '/api/placeholder/500/600',
          thumbnail: '/api/placeholder/500/600'
        }
      ],
      createdAt: new Date(Date.now() - 3600000),
      likes: 1247,
      comments: 89,
      shares: 23,
      views: 5421,
      isAdult: true,
      isPremium: true,
      isLiked: false,
      isBookmarked: false
    },
    {
      id: '2',
      type: 'text',
      content: 'Hôm nay mình sẽ livestream lúc 8pm! Ai free thì ghé chơi nha 🥰 Sẽ có nhiều surprises đấy!',
      author: {
        id: 'user2',
        username: 'angel_beauty',
        displayName: 'Angel Beauty',
        avatar: '/api/placeholder/40/40',
        isVerified: false,
        isOnline: false
      },
      createdAt: new Date(Date.now() - 7200000),
      likes: 892,
      comments: 156,
      shares: 34,
      isAdult: false,
      isPremium: false,
      isLiked: true,
      isBookmarked: true
    },
    {
      id: '3',
      type: 'video',
      content: 'Behind the scenes của buổi chụp hôm qua! Rất vui khi được làm việc với team tuyệt vời 🎬',
      author: {
        id: 'user3',
        username: 'ruby_star',
        displayName: 'Ruby Star',
        avatar: '/api/placeholder/40/40',
        isVerified: true,
        isOnline: true
      },
      media: [
        {
          type: 'video',
          url: '/api/placeholder/video',
          thumbnail: '/api/placeholder/500/300'
        }
      ],
      createdAt: new Date(Date.now() - 10800000),
      likes: 2341,
      comments: 278,
      shares: 67,
      views: 12450,
      isAdult: true,
      isPremium: false,
      isLiked: false,
      isBookmarked: false
    },
    {
      id: '4',
      type: 'live',
      content: '🔴 LIVE: Q&A Session với các fans! Hãy gửi câu hỏi nhé!',
      author: {
        id: 'user4',
        username: 'sakura_dreams',
        displayName: 'Sakura Dreams',
        avatar: '/api/placeholder/40/40',
        isVerified: true,
        isOnline: true
      },
      createdAt: new Date(Date.now() - 900000),
      likes: 567,
      comments: 89,
      shares: 12,
      views: 1234,
      isAdult: false,
      isPremium: true,
      isLiked: true,
      isBookmarked: false
    }
  ]

  const formatTimeAgo = (date: Date) => {
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (days > 0) return `${days} ngày trước`
    if (hours > 0) return `${hours} giờ trước`
    if (minutes > 0) return `${minutes} phút trước`
    return 'Vừa xong'
  }

  const renderMediaContent = (post: FeedPost) => {
    if (!post.media || post.media.length === 0) return null

    const media = post.media[0]
    
    if (media.type === 'image') {
      return (
        <div className="relative aspect-[4/5] bg-gray-100 rounded-lg overflow-hidden">
          <img 
            src={media.url} 
            alt="Post content"
            className="w-full h-full object-cover"
          />
          {post.isAdult && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center backdrop-blur-sm">
              <div className="text-center text-white">
                <div className="text-2xl mb-2">🔞</div>
                <p className="text-sm">Nội dung 18+</p>
                <Button size="sm" variant="secondary" className="mt-2">
                  Xem nội dung
                </Button>
              </div>
            </div>
          )}
        </div>
      )
    }

    if (media.type === 'video') {
      return (
        <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden">
          <img 
            src={media.thumbnail} 
            alt="Video thumbnail"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <Button size="lg" className="rounded-full bg-white/20 hover:bg-white/30 backdrop-blur">
              <Play className="w-8 h-8 text-white ml-1" />
            </Button>
          </div>
          {post.views && (
            <div className="absolute bottom-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-sm">
              <Eye className="inline w-4 h-4 mr-1" />
              {post.views.toLocaleString()}
            </div>
          )}
        </div>
      )
    }

    return null
  }

  const renderPost = (post: FeedPost) => (
    <Card key={post.id} className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Avatar className="w-12 h-12">
                <AvatarImage src={post.author.avatar} alt={post.author.displayName} />
                <AvatarFallback className="bg-gradient-to-r from-pink-500 to-purple-500 text-white">
                  {post.author.displayName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              {post.author.isOnline && (
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h4 className="font-semibold">{post.author.displayName}</h4>
                {post.author.isVerified && (
                  <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs">✓</span>
                  </div>
                )}
                <div className="flex items-center gap-1">
                  {post.isPremium && (
                    <Badge className="text-xs bg-yellow-100 text-yellow-700">Premium</Badge>
                  )}
                  {post.isAdult && (
                    <Badge className="text-xs bg-red-100 text-red-700">18+</Badge>
                  )}
                  {post.type === 'live' && (
                    <Badge className="text-xs bg-red-500 text-white">
                      <div className="w-2 h-2 bg-white rounded-full animate-pulse mr-1" />
                      LIVE
                    </Badge>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>@{post.author.username}</span>
                <span>•</span>
                <span>{formatTimeAgo(post.createdAt)}</span>
              </div>
            </div>
          </div>
          <Button variant="ghost" size="sm">
            <MoreHorizontal className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <p className="text-foreground mb-4 leading-relaxed">
          {post.content}
        </p>

        {renderMediaContent(post)}

        <div className="flex items-center justify-between mt-4 pt-3 border-t">
          <div className="flex items-center gap-6">
            <Button 
              variant="ghost" 
              size="sm" 
              className={`${post.isLiked ? 'text-red-500' : 'text-muted-foreground'} hover:text-red-500`}
            >
              <Heart className={`w-5 h-5 mr-1 ${post.isLiked ? 'fill-current' : ''}`} />
              {post.likes.toLocaleString()}
            </Button>
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-blue-500">
              <MessageCircle className="w-5 h-5 mr-1" />
              {post.comments}
            </Button>
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-green-500">
              <Share2 className="w-5 h-5 mr-1" />
              {post.shares}
            </Button>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            className={`${post.isBookmarked ? 'text-yellow-500' : 'text-muted-foreground'} hover:text-yellow-500`}
          >
            <Bookmark className={`w-5 h-5 ${post.isBookmarked ? 'fill-current' : ''}`} />
          </Button>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="max-w-2xl mx-auto">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="for-you" className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Dành cho bạn
          </TabsTrigger>
          <TabsTrigger value="following" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Đang theo dõi
          </TabsTrigger>
          <TabsTrigger value="live" className="flex items-center gap-2">
            <Video className="w-4 h-4" />
            Live
          </TabsTrigger>
        </TabsList>

        <TabsContent value="for-you" className="space-y-6">
          {feedPosts.map(renderPost)}
        </TabsContent>

        <TabsContent value="following" className="space-y-6">
          {feedPosts.filter(post => post.author.isVerified).map(renderPost)}
        </TabsContent>

        <TabsContent value="live" className="space-y-6">
          {feedPosts.filter(post => post.type === 'live').map(renderPost)}
        </TabsContent>
      </Tabs>
    </div>
  )
}
