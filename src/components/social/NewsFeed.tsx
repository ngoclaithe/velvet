'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/hooks/useAuth'
import type { Post, FeedParams } from '@/types/posts'
import { postsApi } from '@/lib/api/posts'
import {
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  Eye,
  MoreHorizontal,
  Play,
  TrendingUp,
  Users,
  Loader2,
  RefreshCw
} from 'lucide-react'

interface FeedState {
  posts: Post[]
  loading: boolean
  error: string | null
  hasMore: boolean
  page: number
  total: number
}

const POSTS_PER_PAGE = 10

interface NewsFeedProps {
  activeTab?: 'for-you' | 'following' | 'my-posts'
}

export default function NewsFeed({ activeTab: propActiveTab }: NewsFeedProps = {}) {
  const [activeTab, setActiveTab] = useState<'for-you' | 'following' | 'my-posts'>(propActiveTab || 'for-you')
  const [feeds, setFeeds] = useState<Record<string, FeedState>>({
    'for-you': { posts: [], loading: false, error: null, hasMore: true, page: 1, total: 0 },
    'following': { posts: [], loading: false, error: null, hasMore: true, page: 1, total: 0 },
    'my-posts': { posts: [], loading: false, error: null, hasMore: true, page: 1, total: 0 }
  })
  const [refreshing, setRefreshing] = useState(false)
  const { toast } = useToast()
  const { isAuthenticated, user } = useAuth()

  const currentFeed = feeds[activeTab]

  // Transform API response to Post format
  const transformApiPostToPost = useCallback((apiPost: any): Post => {
    return {
      id: apiPost.id.toString(),
      type: apiPost.mediaType === 'text' ? 'text' : apiPost.mediaType === 'video' ? 'video' : 'text',
      content: apiPost.content,
      author: {
        id: apiPost.user?.id?.toString() || apiPost.userId?.toString() || 'unknown',
        username: apiPost.user?.username || 'unknown',
        displayName: apiPost.user ?
          `${apiPost.user.firstName || ''} ${apiPost.user.lastName || ''}`.trim() || apiPost.user.username :
          'Unknown User',
        avatar: apiPost.user?.avatar || '/api/placeholder/40/40',
        isVerified: apiPost.user?.isVerified || false,
        isOnline: false
      },
      createdAt: new Date(apiPost.createdAt),
      updatedAt: new Date(apiPost.updatedAt),
      likes: apiPost.likeCount || 0,
      comments: apiPost.commentCount || 0,
      shares: apiPost.shareCount || 0,
      views: apiPost.viewCount || 0,
      isAdult: !apiPost.isPublic || false,
      isPremium: apiPost.isPremium || false,
      isLiked: false,
      isBookmarked: false,
      visibility: apiPost.isPublic ? 'public' : 'private',
      media: apiPost.mediaUrls && apiPost.mediaUrls.length > 0 ?
        apiPost.mediaUrls.map((url: string, index: number) => ({
          id: `${apiPost.id}-media-${index}`,
          type: apiPost.mediaType === 'image' ? 'image' : 'video' as 'image' | 'video',
          url: url,
          thumbnail: apiPost.thumbnailUrl
        })) : undefined
    }
  }, [])

  // Mock data cho demo khi chưa có backend
  const getMockPosts = useCallback((tab: string, page: number): Post[] => {
    // Nếu chưa có bài viết thì trả về mảng rỗng
    if ((tab === 'following' || tab === 'my-posts') && !isAuthenticated) {
      return []
    }

    // Demo posts cho "for-you" và khi đã đăng nhập
    const mockPosts: Post[] = [
      {
        id: '1',
        type: 'text',
        content: 'Chào mừng bạn đến với nền tảng! 🎉 Hãy bắt đầu khám phá các tính năng thú vị của chúng tôi.',
        author: {
          id: 'admin',
          username: 'admin',
          displayName: 'Admin',
          avatar: '/api/placeholder/40/40',
          isVerified: true,
          isOnline: true
        },
        createdAt: new Date(Date.now() - 3600000),
        updatedAt: new Date(Date.now() - 3600000),
        likes: 125,
        comments: 8,
        shares: 3,
        views: 450,
        isAdult: false,
        isPremium: false,
        isLiked: false,
        isBookmarked: false,
        visibility: 'public' as const
      }
    ]


    if (tab === 'my-posts' && isAuthenticated) {
      // Mock posts matching API response format
      const mockApiPosts = [
        {
          id: 5,
          userId: user?.id || 13,
          creatorId: null,
          content: 'Đây là bài viết đầu tiên của tôi trên n���n tảng! 🎉',
          mediaType: 'text',
          mediaUrls: [],
          thumbnailUrl: null,
          isPublic: true,
          isPremium: false,
          price: null,
          viewCount: 15,
          likeCount: 5,
          commentCount: 2,
          shareCount: 1,
          status: 'published',
          scheduledAt: null,
          tags: [],
          location: null,
          isPromoted: false,
          createdAt: new Date(Date.now() - 1800000).toISOString(),
          updatedAt: new Date(Date.now() - 1800000).toISOString(),
          user: {
            id: user?.id || 13,
            username: user?.username || 'user1',
            firstName: user?.firstName || 'User',
            lastName: user?.lastName || 'Name',
            avatar: user?.avatar || null
          },
          creator: null
        }
      ]

      // Transform to Post format
      const mockMyPosts: Post[] = mockApiPosts.map(apiPost => ({
        id: apiPost.id.toString(),
        type: 'text',
        content: apiPost.content,
        author: {
          id: apiPost.user.id.toString(),
          username: apiPost.user.username,
          displayName: `${apiPost.user.firstName} ${apiPost.user.lastName}`.trim() || apiPost.user.username,
          avatar: apiPost.user.avatar || '/api/placeholder/40/40',
          isVerified: false,
          isOnline: true
        },
        createdAt: new Date(apiPost.createdAt),
        updatedAt: new Date(apiPost.updatedAt),
        likes: apiPost.likeCount,
        comments: apiPost.commentCount,
        shares: apiPost.shareCount,
        views: apiPost.viewCount,
        isAdult: false,
        isPremium: apiPost.isPremium,
        isLiked: false,
        isBookmarked: false,
        visibility: 'public' as const,
        media: apiPost.mediaUrls.length > 0 ? apiPost.mediaUrls.map((url, index) => ({
          id: `${apiPost.id}-media-${index}`,
          type: apiPost.mediaType === 'image' ? 'image' : 'video' as 'image' | 'video',
          url: url,
          thumbnail: apiPost.thumbnailUrl
        })) : undefined
      }))

      return page === 1 ? mockMyPosts : []
    }

    return page === 1 ? mockPosts : [] // Chỉ có 1 trang mock data
  }, [isAuthenticated, user])

  // Load posts cho tab hiện tại
  const loadPosts = useCallback(async (
    tab: string,
    page: number = 1,
    refresh: boolean = false
  ) => {
    const feedKey = tab as keyof typeof feeds

    setFeeds(prev => ({
      ...prev,
      [feedKey]: {
        ...prev[feedKey],
        loading: true,
        error: null
      }
    }))

    try {
      let response;

      // Use appropriate API based on tab
      if (tab === 'for-you') {
        // Use getFeed for "Dành cho bạn" tab
        response = await postsApi.getFeed({
          page: page.toString(),
          limit: POSTS_PER_PAGE.toString()
        })
      } else if (tab === 'following') {
        // For following tab, we could use a different API endpoint if available
        // For now, we'll use getFeed with a following filter or fallback to mock
        if (isAuthenticated) {
          response = await postsApi.getFeed({
            page: page.toString(),
            limit: POSTS_PER_PAGE.toString(),
            type: 'following'
          })
        } else {
          throw new Error('Authentication required')
        }
      } else if (tab === 'my-posts') {
        // Use getUserPosts for current user's posts
        if (isAuthenticated && user?.id) {
          response = await postsApi.getUserPosts(user.id.toString(), {
            page: page.toString(),
            limit: POSTS_PER_PAGE.toString()
          })
        } else {
          throw new Error('Authentication required')
        }
      }

      if (response && response.success && response.data) {
        // Handle different response formats
        let rawPosts = []
        let total = 0
        let pagination = null

        if (Array.isArray(response.data)) {
          rawPosts = response.data
          total = rawPosts.length
        } else if (response.data && typeof response.data === 'object') {
          if ('posts' in response.data) {
            rawPosts = response.data.posts || []
            total = response.data.total || rawPosts.length
            pagination = response.data.pagination
          } else {
            // Single post wrapped in data
            rawPosts = [response.data]
            total = 1
          }
        } else {
          rawPosts = []
          total = 0
        }

        // Transform API posts to Post format
        const posts = rawPosts.map(transformApiPostToPost)

        // Use pagination info if available
        const hasMore = pagination
          ? pagination.hasNext
          : posts.length === POSTS_PER_PAGE && (page * POSTS_PER_PAGE) < total

        setFeeds(prev => ({
          ...prev,
          [feedKey]: {
            ...prev[feedKey],
            posts: refresh ? posts : [...prev[feedKey].posts, ...posts],
            loading: false,
            hasMore: hasMore,
            page: page,
            total: total
          }
        }))
      } else {
        throw new Error('Invalid response format')
      }

    } catch (error) {
      console.error('Error loading posts:', error)

      // Fallback to mock data if API fails
      const mockPosts = getMockPosts(tab, page)

      setFeeds(prev => ({
        ...prev,
        [feedKey]: {
          ...prev[feedKey],
          posts: refresh ? mockPosts : [...prev[feedKey].posts, ...mockPosts],
          loading: false,
          hasMore: false, // No more pages for mock data
          page: page,
          total: mockPosts.length,
          error: 'Sử dụng dữ liệu demo (API chưa sẵn sàng)'
        }
      }))
    }
  }, [getMockPosts, isAuthenticated, user, transformApiPostToPost])

  // Load more posts (infinite scroll)
  const loadMore = useCallback(() => {
    if (currentFeed.loading || !currentFeed.hasMore) return
    
    loadPosts(activeTab, currentFeed.page + 1, false)
  }, [activeTab, currentFeed.loading, currentFeed.hasMore, currentFeed.page, loadPosts])

  // Refresh feed
  const refreshFeed = useCallback(async () => {
    setRefreshing(true)
    await loadPosts(activeTab, 1, true)
    setRefreshing(false)
  }, [activeTab, loadPosts])

  // Sync activeTab with prop
  useEffect(() => {
    if (propActiveTab && propActiveTab !== activeTab) {
      setActiveTab(propActiveTab)
    }
  }, [propActiveTab, activeTab])

  // Load initial data khi tab thay đổi
  useEffect(() => {
    if (currentFeed.posts.length === 0 && !currentFeed.loading) {
      loadPosts(activeTab, 1, true)
    }
  }, [activeTab, currentFeed.posts.length, currentFeed.loading, loadPosts])

  // Infinite scroll
  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + document.documentElement.scrollTop
        >= document.documentElement.offsetHeight - 1000
      ) {
        loadMore()
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [loadMore])

  // Format time ago
  const formatTimeAgo = useCallback((date: Date) => {
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (days > 0) return `${days} ngày trước`
    if (hours > 0) return `${hours} giờ trước`
    if (minutes > 0) return `${minutes} phút trước`
    return 'Vừa xong'
  }, [])

  // Handle post interactions (chỉ local update, không gọi API)
  const handleLike = useCallback((postId: string) => {
    if (!isAuthenticated) {
      toast({
        title: "Yêu cầu đăng nhập",
        description: "Vui lòng đăng nhập để thích bài viết",
        variant: "destructive"
      })
      return
    }

    // Chỉ update local state, không gọi API
    setFeeds(prev => ({
      ...prev,
      [activeTab]: {
        ...prev[activeTab],
        posts: prev[activeTab].posts.map(post =>
          post.id === postId
            ? {
                ...post,
                isLiked: !post.isLiked,
                likes: post.isLiked ? post.likes - 1 : post.likes + 1
              }
            : post
        )
      }
    }))

    // Hiển thị thông báo thành công
    const post = currentFeed.posts.find(p => p.id === postId)
    toast({
      title: post?.isLiked ? "Đã bỏ thích" : "Đã thích bài viết",
      description: "Thay đổi đã được lưu cục bộ",
      variant: "default"
    })
  }, [isAuthenticated, activeTab, currentFeed.posts, toast])

  const handleBookmark = useCallback((postId: string) => {
    if (!isAuthenticated) {
      toast({
        title: "Yêu cầu đăng nhập",
        description: "Vui lòng đăng nhập để lưu bài viết",
        variant: "destructive"
      })
      return
    }

    // Chỉ update local state, không gọi API
    setFeeds(prev => ({
      ...prev,
      [activeTab]: {
        ...prev[activeTab],
        posts: prev[activeTab].posts.map(post =>
          post.id === postId
            ? { ...post, isBookmarked: !post.isBookmarked }
            : post
        )
      }
    }))

    // Hiển thị thông báo thành công
    const post = currentFeed.posts.find(p => p.id === postId)
    toast({
      title: post?.isBookmarked ? "Đã bỏ lưu" : "Đã lưu bài viết",
      description: "Thay đổi đã được lưu cục bộ",
      variant: "default"
    })
  }, [isAuthenticated, activeTab, currentFeed.posts, toast])

  // Render media content
  const renderMediaContent = useCallback((post: Post) => {
    if (!post.media || post.media.length === 0) return null

    const media = post.media[0]
    
    if (media.type === 'image') {
      return (
        <div className="relative aspect-[4/5] bg-gray-100 rounded-lg overflow-hidden">
          <img 
            src={media.url} 
            alt="Post content"
            className="w-full h-full object-cover"
            loading="lazy"
          />
          {post.isAdult && !isAuthenticated && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center backdrop-blur-sm">
              <div className="text-center text-white">
                <div className="text-2xl mb-2">🔞</div>
                <p className="text-sm">Nội dung 18+</p>
                <Button size="sm" variant="secondary" className="mt-2">
                  ��ăng nhập để xem
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
            loading="lazy"
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
  }, [isAuthenticated])

  // Render single post
  const renderPost = useCallback((post: Post) => (
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
                    <span className="text-white text-xs">��</span>
                  </div>
                )}
                <div className="flex items-center gap-1">
                  {post.isPremium && (
                    <Badge className="text-xs bg-yellow-100 text-yellow-700">Premium</Badge>
                  )}
                  {post.isAdult && (
                    <Badge className="text-xs bg-red-100 text-red-700">18+</Badge>
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
              onClick={() => handleLike(post.id)}
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
            onClick={() => handleBookmark(post.id)}
            className={`${post.isBookmarked ? 'text-yellow-500' : 'text-muted-foreground'} hover:text-yellow-500`}
          >
            <Bookmark className={`w-5 h-5 ${post.isBookmarked ? 'fill-current' : ''}`} />
          </Button>
        </div>
      </CardContent>
    </Card>
  ), [formatTimeAgo, renderMediaContent, handleLike, handleBookmark])

  // Render loading skeleton
  const renderSkeletons = useCallback(() => (
    <>
      {Array.from({ length: 3 }).map((_, i) => (
        <Card key={i} className="overflow-hidden">
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
            <Skeleton className="aspect-video w-full rounded-lg" />
            <div className="flex items-center justify-between mt-4 pt-3 border-t">
              <div className="flex gap-6">
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-8 w-16" />
              </div>
              <Skeleton className="h-8 w-8" />
            </div>
          </CardContent>
        </Card>
      ))}
    </>
  ), [])

  return (
    <div className="max-w-2xl mx-auto">
      {!propActiveTab && (
        <div className="flex items-center justify-between mb-6">
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="flex-1">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="for-you" className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Dành cho bạn
              </TabsTrigger>
              <TabsTrigger value="following" className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Đang theo dõi
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <Button
            variant="ghost"
            size="sm"
            onClick={refreshFeed}
            disabled={refreshing}
            className="ml-4"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      )}

      <div className="space-y-6">
        {currentFeed.posts.map(renderPost)}
        
        {currentFeed.loading && renderSkeletons()}
        
        {currentFeed.error && (
          <Card className="p-6 text-center">
            <p className="text-red-600 mb-4">{currentFeed.error}</p>
            <p className="text-muted-foreground text-sm">
              Backend chưa sẵn sàng. Sử dụng mock data để demo.
            </p>
          </Card>
        )}
        
        {!currentFeed.loading && !currentFeed.hasMore && currentFeed.posts.length > 0 && (
          <Card className="p-6 text-center">
            <p className="text-muted-foreground">
              Bạn đã xem hết tất cả bài viết!
            </p>
          </Card>
        )}
        
        {!currentFeed.loading && currentFeed.posts.length === 0 && !currentFeed.error && (
          <Card className="p-6 text-center">
            <div className="space-y-4">
              <div className="text-6xl mb-4">
                {activeTab === 'following' ? '👥' :
                 activeTab === 'my-posts' ? '✍️' : '📝'}
              </div>
              <h3 className="text-lg font-semibold">
                {activeTab === 'following' ? 'Chưa theo d��i ai' :

                 activeTab === 'my-posts' ? 'Chưa có bài viết' :
                 'Chưa có bài vi���t'}
              </h3>
              <p className="text-muted-foreground">
                {activeTab === 'following'
                  ? 'Hãy theo dõi một số người để xem bài viết của họ tại đây'
                  : activeTab === 'my-posts'
                  ? 'Bắt đầu tạo bài viết đầu tiên của bạn!'
                  : 'Bắt đầu tạo bài viết đầu tiên của bạn!'
                }
              </p>
              {activeTab === 'following' && (
                <div className="space-y-2">
                  <Button onClick={() => setActiveTab('for-you')}>
                    Khám phá bài viết
                  </Button>
                  {!isAuthenticated && (
                    <p className="text-sm text-muted-foreground">
                      <Button variant="link" className="p-0 h-auto" onClick={() => window.location.href = '/login'}>
                        Đăng nhập
                      </Button>
                      {' '}để theo dõi người khác
                    </p>
                  )}
                </div>
              )}
              {activeTab === 'my-posts' && (
                <div className="space-y-2">
                  <Button onClick={() => window.location.href = '/create-post'}>
                    Tạo bài viết đầu tiên
                  </Button>
                  {!isAuthenticated && (
                    <p className="text-sm text-muted-foreground">
                      <Button variant="link" className="p-0 h-auto" onClick={() => window.location.href = '/login'}>
                        Đăng nhập
                      </Button>
                      {' '}để tạo bài viết
                    </p>
                  )}
                </div>
              )}
            </div>
          </Card>
        )}
        
        {currentFeed.loading && currentFeed.hasMore && currentFeed.posts.length > 0 && (
          <div className="flex justify-center p-4">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        )}
      </div>
    </div>
  )
}
