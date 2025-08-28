'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/hooks/useAuth'
import { postsApi } from '@/lib/api/posts'
import {
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  Eye,
  MoreHorizontal,
  ArrowLeft,
  Play
} from 'lucide-react'

interface PostData {
  id: number
  userId: number
  creatorId: number | null
  content: string
  mediaType: string
  mediaUrls: string[]
  thumbnailUrl: string | null
  isPublic: boolean
  isPremium: boolean
  price: number | null
  viewCount: number
  likeCount: number
  commentCount: number
  shareCount: number
  status: string
  scheduledAt: string | null
  tags: string[]
  location: string | null
  isPromoted: boolean
  createdAt: string
  updatedAt: string
  user: {
    id: number
    username: string
    firstName: string
    lastName: string
    avatar: string | null
  }
  creator: any
  comments: any[]
}

export default function PostDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const { isAuthenticated } = useAuth()
  const postId = params.postId as string

  const [post, setPost] = useState<PostData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isLiked, setIsLiked] = useState(false)
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [likes, setLikes] = useState(0)

  useEffect(() => {
    if (postId) {
      loadPost()
    }
  }, [postId])

  const loadPost = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await postsApi.getPost(postId)

      if (response.success && response.data) {
        setPost(response.data)
        setLikes(response.data.likeCount)
      } else {
        setError('Không thể tải bài viết')
      }
    } catch (err) {
      console.error('Error loading post:', err)
      setError('Có lỗi xảy ra khi tải bài viết')
    } finally {
      setLoading(false)
    }
  }

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
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

  const handleLike = async () => {
    if (!isAuthenticated) {
      toast({
        title: "Yêu cầu đăng nhập",
        description: "Vui lòng đăng nhập để thích bài viết",
        variant: "destructive"
      })
      return
    }

    try {
      if (isLiked) {
        await postsApi.unlikePost(postId)
        setLikes(prev => prev - 1)
      } else {
        await postsApi.likePost(postId)
        setLikes(prev => prev + 1)
      }
      setIsLiked(!isLiked)
      
      toast({
        title: isLiked ? "Đã bỏ thích" : "Đã thích bài viết",
        description: "Thay đổi đã được lưu",
        variant: "default"
      })
    } catch (error) {
      // Fallback to local update if API fails
      setIsLiked(!isLiked)
      setLikes(prev => isLiked ? prev - 1 : prev + 1)
      
      toast({
        title: isLiked ? "Đã bỏ thích" : "Đã thích bài viết",
        description: "Thay đổi đã được lưu cục bộ",
        variant: "default"
      })
    }
  }

  const handleBookmark = async () => {
    if (!isAuthenticated) {
      toast({
        title: "Yêu cầu đăng nhập",
        description: "Vui lòng đăng nhập để lưu bài viết",
        variant: "destructive"
      })
      return
    }

    try {
      if (isBookmarked) {
        await postsApi.unbookmarkPost(postId)
      } else {
        await postsApi.bookmarkPost(postId)
      }
      setIsBookmarked(!isBookmarked)
      
      toast({
        title: isBookmarked ? "Đã bỏ lưu" : "Đã lưu bài viết",
        description: "Thay đổi đã được lưu",
        variant: "default"
      })
    } catch (error) {
      // Fallback to local update if API fails
      setIsBookmarked(!isBookmarked)
      
      toast({
        title: isBookmarked ? "Đã bỏ lưu" : "Đã lưu bài viết",
        description: "Thay đổi đ�� được lưu cục bộ",
        variant: "default"
      })
    }
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: post?.content.substring(0, 50) + '...',
          url: window.location.href
        })
      } catch (error) {
        console.log('Share cancelled')
      }
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(window.location.href)
        toast({
          title: "Đã sao chép liên kết",
          description: "Liên kết bài viết đã được sao chép vào clipboard",
          variant: "default"
        })
      } catch (error) {
        toast({
          title: "Không thể sao chép",
          description: "Có lỗi xảy ra khi sao chép liên kết",
          variant: "destructive"
        })
      }
    }
  }

  const renderMediaContent = () => {
    if (!post || !post.mediaUrls || post.mediaUrls.length === 0) return null

    if (post.mediaType === 'image') {
      return (
        <div className="relative aspect-[4/5] bg-gray-100 rounded-lg overflow-hidden mb-4">
          <img 
            src={post.mediaUrls[0]} 
            alt="Post content"
            className="w-full h-full object-cover"
            loading="lazy"
          />
          {!post.isPublic && !isAuthenticated && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center backdrop-blur-sm">
              <div className="text-center text-white">
                <div className="text-2xl mb-2">🔞</div>
                <p className="text-sm">Nội dung 18+</p>
                <Button size="sm" variant="secondary" className="mt-2">
                  Đăng nhập để xem
                </Button>
              </div>
            </div>
          )}
        </div>
      )
    }

    if (post.mediaType === 'video') {
      return (
        <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden mb-4">
          <img 
            src={post.thumbnailUrl || '/api/placeholder/600/400'} 
            alt="Video thumbnail"
            className="w-full h-full object-cover"
            loading="lazy"
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <Button size="lg" className="rounded-full bg-white/20 hover:bg-white/30 backdrop-blur">
              <Play className="w-8 h-8 text-white ml-1" />
            </Button>
          </div>
          {post.viewCount && (
            <div className="absolute bottom-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-sm">
              <Eye className="inline w-4 h-4 mr-1" />
              {post.viewCount.toLocaleString()}
            </div>
          )}
        </div>
      )
    }

    return null
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center mb-6">
              <Skeleton className="w-8 h-8 mr-4" />
              <Skeleton className="h-6 w-32" />
            </div>
            
            <Card className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-start gap-3">
                  <Skeleton className="w-12 h-12 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-3/4 mb-4" />
                <Skeleton className="aspect-video w-full rounded-lg mb-4" />
                <div className="flex items-center justify-between pt-3 border-t">
                  <div className="flex gap-6">
                    <Skeleton className="h-8 w-16" />
                    <Skeleton className="h-8 w-16" />
                    <Skeleton className="h-8 w-16" />
                  </div>
                  <Skeleton className="h-8 w-8" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
            <Button
              variant="ghost"
              onClick={() => router.back()}
              className="mb-6"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Quay lại
            </Button>
            
            <Card className="p-8 text-center">
              <div className="text-6xl mb-4">😕</div>
              <h1 className="text-xl font-semibold mb-2">
                {error || 'Không tìm thấy bài viết'}
              </h1>
              <p className="text-muted-foreground mb-4">
                Bài viết có thể đã bị xóa hoặc bạn không có quyền truy cập.
              </p>
              <Button onClick={() => router.push('/')}>
                Về trang chủ
              </Button>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  const displayName = post.user ? 
    `${post.user.firstName || ''} ${post.user.lastName || ''}`.trim() || post.user.username :
    'Unknown User'

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Quay lại
          </Button>

          <Card className="overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={post.user?.avatar || '/api/placeholder/40/40'} alt={displayName} />
                    <AvatarFallback className="bg-gradient-to-r from-pink-500 to-purple-500 text-white">
                      {displayName.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold">{displayName}</h4>
                      <div className="flex items-center gap-1">
                        {post.isPremium && (
                          <Badge className="text-xs bg-yellow-100 text-yellow-700">Premium</Badge>
                        )}
                        {!post.isPublic && (
                          <Badge className="text-xs bg-red-100 text-red-700">18+</Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>@{post.user?.username || 'unknown'}</span>
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

              {renderMediaContent()}

              <div className="flex items-center justify-between mt-4 pt-3 border-t">
                <div className="flex items-center gap-6">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={handleLike}
                    className={`${isLiked ? 'text-red-500' : 'text-muted-foreground'} hover:text-red-500`}
                  >
                    <Heart className={`w-5 h-5 mr-1 ${isLiked ? 'fill-current' : ''}`} />
                    {likes.toLocaleString()}
                  </Button>
                  <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-blue-500">
                    <MessageCircle className="w-5 h-5 mr-1" />
                    {post.commentCount}
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={handleShare}
                    className="text-muted-foreground hover:text-green-500"
                  >
                    <Share2 className="w-5 h-5 mr-1" />
                    {post.shareCount}
                  </Button>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleBookmark}
                  className={`${isBookmarked ? 'text-yellow-500' : 'text-muted-foreground'} hover:text-yellow-500`}
                >
                  <Bookmark className={`w-5 h-5 ${isBookmarked ? 'fill-current' : ''}`} />
                </Button>
              </div>

              {post.viewCount && (
                <div className="flex items-center gap-1 text-sm text-muted-foreground mt-2 pt-2 border-t">
                  <Eye className="w-4 h-4" />
                  <span>{post.viewCount.toLocaleString()} lượt xem</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
