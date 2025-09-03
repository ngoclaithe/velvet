'use client'

import Link from 'next/link'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  Heart, 
  MessageCircle, 
  Share2, 
  Bookmark, 
  Eye,
  Calendar,
  User
} from 'lucide-react'

interface BlogPost {
  id: string
  title: string
  excerpt: string
  content?: string
  author: {
    id: string
    username: string
    displayName: string
    avatar?: string
    isVerified: boolean
  }
  category: string
  tags: string[]
  thumbnail?: string
  publishedAt: Date
  readTime: number
  views: number
  likes: number
  comments: number
  isAdult: boolean
  isPremium: boolean
}

interface BlogPostProps {
  post: BlogPost
  variant?: 'card' | 'list' | 'featured'
  showExcerpt?: boolean
}

export default function BlogPost({ post, variant = 'card', showExcerpt = true }: BlogPostProps) {
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatReadTime = (minutes: number) => {
    return `${minutes} phút đọc`
  }

  if (variant === 'featured') {
    return (
      <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 group">
        <div className="relative">
          <div className="aspect-[16/9] bg-gradient-to-br from-pink-100 to-purple-100 relative overflow-hidden">
            {post.thumbnail ? (
              <img 
                src={post.thumbnail} 
                alt={post.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <User className="w-16 h-16 text-gray-400" />
              </div>
            )}
            {post.isPremium && (
              <Badge className="absolute top-3 left-3 bg-yellow-500 hover:bg-yellow-600">
                ⭐ Premium
              </Badge>
            )}
            {post.isAdult && (
              <Badge className="absolute top-3 right-3 bg-red-500 hover:bg-red-600">
                18+
              </Badge>
            )}
          </div>
        </div>
        
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3 mb-3">
            <Link href={`/user/${post.author.id}`}>
              <Avatar className="w-12 h-12 cursor-pointer hover:opacity-90">
                <AvatarImage src={post.author.avatar} alt={post.author.displayName} />
                <AvatarFallback className="bg-gradient-to-r from-pink-500 to-purple-500 text-white">
                  {post.author.displayName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </Link>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h4 className="font-semibold text-sm">{post.author.displayName}</h4>
                {post.author.isVerified && (
                  <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs">✓</span>
                  </div>
                )}
              </div>
              <p className="text-xs text-muted-foreground">@{post.author.username}</p>
            </div>
          </div>
          
          <Badge variant="secondary" className="w-fit mb-2">
            {post.category}
          </Badge>
          
          <Link href={`/blog/${post.id}`}>
            <h2 className="text-xl font-bold line-clamp-2 hover:text-pink-600 transition-colors">
              {post.title}
            </h2>
          </Link>
          
          {showExcerpt && (
            <p className="text-muted-foreground text-sm line-clamp-3 mt-2">
              {post.excerpt}
            </p>
          )}
        </CardHeader>
        
        <CardContent className="pt-0">
          <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {formatDate(post.publishedAt)}
              </span>
              <span className="flex items-center gap-1">
                <Eye className="w-4 h-4" />
                {post.views.toLocaleString()}
              </span>
            </div>
            <span>{formatReadTime(post.readTime)}</span>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600">
                <Heart className="w-4 h-4 mr-1" />
                {post.likes}
              </Button>
              <Button variant="ghost" size="sm">
                <MessageCircle className="w-4 h-4 mr-1" />
                {post.comments}
              </Button>
              <Button variant="ghost" size="sm">
                <Share2 className="w-4 h-4" />
              </Button>
            </div>
            <Button variant="ghost" size="sm">
              <Bookmark className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (variant === 'list') {
    return (
      <Card className="p-4 hover:shadow-md transition-shadow">
        <div className="flex gap-4">
          <div className="w-24 h-24 bg-gradient-to-br from-pink-100 to-purple-100 rounded-lg flex-shrink-0 overflow-hidden">
            {post.thumbnail ? (
              <img 
                src={post.thumbnail} 
                alt={post.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <User className="w-8 h-8 text-gray-400" />
              </div>
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="secondary" className="text-xs">
                {post.category}
              </Badge>
              {post.isPremium && (
                <Badge className="text-xs bg-yellow-100 text-yellow-700">Premium</Badge>
              )}
              {post.isAdult && (
                <Badge className="text-xs bg-red-100 text-red-700">18+</Badge>
              )}
            </div>
            
            <Link href={`/blog/${post.id}`}>
              <h3 className="font-semibold line-clamp-2 hover:text-pink-600 transition-colors mb-2">
                {post.title}
              </h3>
            </Link>
            
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              <span>bởi {post.author.displayName}</span>
              <span>•</span>
              <span>{formatDate(post.publishedAt)}</span>
              <span>•</span>
              <span>{formatReadTime(post.readTime)}</span>
            </div>
            
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Heart className="w-4 h-4" />
                {post.likes}
              </span>
              <span className="flex items-center gap-1">
                <MessageCircle className="w-4 h-4" />
                {post.comments}
              </span>
              <span className="flex items-center gap-1">
                <Eye className="w-4 h-4" />
                {post.views}
              </span>
            </div>
          </div>
        </div>
      </Card>
    )
  }

  // Default card variant
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow group">
      <div className="relative">
        <div className="aspect-video bg-gradient-to-br from-pink-100 to-purple-100 relative overflow-hidden">
          {post.thumbnail ? (
            <img 
              src={post.thumbnail} 
              alt={post.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <User className="w-12 h-12 text-gray-400" />
            </div>
          )}
          {post.isPremium && (
            <Badge className="absolute top-2 left-2 bg-yellow-500 hover:bg-yellow-600">
              ⭐ Premium
            </Badge>
          )}
          {post.isAdult && (
            <Badge className="absolute top-2 right-2 bg-red-500 hover:bg-red-600">
              18+
            </Badge>
          )}
        </div>
      </div>
      
      <CardHeader className="pb-2">
        <Badge variant="secondary" className="w-fit mb-2">
          {post.category}
        </Badge>
        
        <Link href={`/blog/${post.id}`}>
          <h3 className="font-semibold line-clamp-2 hover:text-pink-600 transition-colors">
            {post.title}
          </h3>
        </Link>
        
        {showExcerpt && (
          <p className="text-muted-foreground text-sm line-clamp-2 mt-2">
            {post.excerpt}
          </p>
        )}
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="flex items-center gap-2 mb-3">
          <Link href={`/user/${post.author.id}`}>
            <Avatar className="w-6 h-6 cursor-pointer hover:opacity-90">
              <AvatarImage src={post.author.avatar} alt={post.author.displayName} />
              <AvatarFallback className="text-xs bg-gradient-to-r from-pink-500 to-purple-500 text-white">
                {post.author.displayName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </Link>
          <Link href={`/user/${post.author.id}`} className="text-sm font-medium hover:underline">{post.author.displayName}</Link>
          {post.author.isVerified && (
            <div className="w-3 h-3 bg-blue-500 rounded-full flex items-center justify-center">
              <span className="text-white text-xs">✓</span>
            </div>
          )}
        </div>
        
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>{formatDate(post.publishedAt)}</span>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <Heart className="w-4 h-4" />
              {post.likes}
            </span>
            <span className="flex items-center gap-1">
              <MessageCircle className="w-4 h-4" />
              {post.comments}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
