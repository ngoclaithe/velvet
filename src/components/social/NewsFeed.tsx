'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import Link from 'next/link'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/hooks/useAuth'
import { ImageGallery } from '@/components/ui/image-gallery'
import type { Post, FeedParams } from '@/types/posts'
import { postsApi, GetFeed, GetAllPosts } from '@/lib/api/posts'
import { commentApi } from '@/lib/api'
import { reactApi } from '@/lib/api/react'
import type { ReactionType } from '@/lib/api/react'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
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
  const [userReactions, setUserReactions] = useState<Record<string, ReactionType | undefined>>({})

  const currentFeed = feeds[activeTab]

  // Comments state
  const [openComments, setOpenComments] = useState<Record<string, boolean>>({})
  const [commentsByPost, setCommentsByPost] = useState<Record<string, any[]>>({})
  const [commentsLoading, setCommentsLoading] = useState<Record<string, boolean>>({})
  const [newComment, setNewComment] = useState<Record<string, string>>({})
  const [editingContent, setEditingContent] = useState<Record<string, string>>({})
  const [working, setWorking] = useState<Record<string, boolean>>({})
  const [visibleComments, setVisibleComments] = useState<Record<string, number>>({})

  // Transform API response to Post format
  const transformApiPostToPost = useCallback((apiPost: any): Post => {
    // Determine display name: if creator exists, use stageName, otherwise use firstName + lastName
    const displayName = apiPost.creator && apiPost.creator.stageName
      ? apiPost.creator.stageName
      : apiPost.user
        ? `${apiPost.user.firstName || ''} ${apiPost.user.lastName || ''}`.trim() || apiPost.user.username
        : 'Unknown User'

    return {
      id: apiPost.id.toString(),
      type: apiPost.mediaType === 'text' ? 'text' : apiPost.mediaType === 'video' ? 'video' : 'text',
      content: apiPost.content,
      author: {
        id: apiPost.user?.id?.toString() || apiPost.userId?.toString() || 'unknown',
        username: apiPost.user?.username || 'unknown',
        displayName: displayName,
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
          type: apiPost.mediaType === 'video' ? 'video' : 'image' as 'image' | 'video',
          url: url,
          thumbnail: apiPost.thumbnailUrl || undefined
        })) : undefined
    }
  }, [])

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
        // Use GetAllPosts for "Dành cho bạn" tab
        response = await GetAllPosts({
          page: page,
          limit: POSTS_PER_PAGE
        })
      } else if (tab === 'following') {
        // Use GetFeed for following tab
        if (isAuthenticated) {
          response = await GetFeed({
            page: page,
            limit: POSTS_PER_PAGE
          })
        } else {
          setFeeds(prev => ({
            ...prev,
            [feedKey]: {
              ...prev[feedKey],
              posts: [],
              loading: false,
              hasMore: false,
              page: page,
              total: 0,
              error: null
            }
          }))
          return
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
        let rawPosts: any[] = []
        let total = 0
        let pagination: any = null

        if (Array.isArray(response.data)) {
          rawPosts = response.data
          total = rawPosts.length
        } else if (response.data && typeof response.data === 'object') {
          const dataObj = response.data as any
          if ('posts' in dataObj) {
            rawPosts = dataObj.posts || []
            total = dataObj.total || dataObj.pagination?.totalPosts || rawPosts.length
            pagination = dataObj.pagination
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
            posts: posts,
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
      
      setFeeds(prev => ({
        ...prev,
        [feedKey]: {
          ...prev[feedKey],
          posts: [],
          loading: false,
          hasMore: false,
          page: page,
          total: 0,
          error: error instanceof Error ? error.message : 'Không thể tải bài viết. Vui lòng thử lại sau.'
        }
      }))

      toast({
        title: "Lỗi tải bài viết",
        description: error instanceof Error ? error.message : "Không thể tải bài viết. Vui lòng thử lại sau.",
        variant: "destructive"
      })
    }
  }, [isAuthenticated, user, transformApiPostToPost, toast])

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

  const VALID_REACTION_TYPES = useMemo(() => ['like', 'love', 'haha', 'wow', 'sad', 'angry'] as const, [])
  const REACTION_OPTIONS = useMemo(
    () => [
      { type: 'like' as ReactionType, emoji: '👍', label: 'Thích' },
      { type: 'love' as ReactionType, emoji: '❤️', label: 'Yêu thích' },
      { type: 'haha' as ReactionType, emoji: '😂', label: 'Haha' },
      { type: 'wow' as ReactionType, emoji: '😮', label: 'Wow' },
      { type: 'sad' as ReactionType, emoji: '😢', label: 'Buồn' },
      { type: 'angry' as ReactionType, emoji: '😡', label: 'Tức giận' },
    ],
    []
  )

  // Handle post interactions
  const toggleReaction = useCallback(async (postId: string, reactionType: (typeof VALID_REACTION_TYPES)[number]) => {
    if (!isAuthenticated) {
      toast({
        title: "Yêu cầu đăng nhập",
        description: "Vui lòng đăng nhập để tương tác bài viết",
        variant: "destructive"
      })
      return
    }

    if (!VALID_REACTION_TYPES.includes(reactionType)) {
      toast({
        title: 'Validation error',
        description: `Invalid reaction type. Must be one of: ${VALID_REACTION_TYPES.join(', ')}`,
        variant: 'destructive'
      })
      return
    }

    try {
      // Optimistic update for 'like' reaction affecting like counter/UI state
      if (reactionType === 'like') {
        setFeeds(prev => ({
          ...prev,
          [activeTab]: {
            ...prev[activeTab],
            posts: prev[activeTab].posts.map(post =>
              post.id === postId
                ? {
                    ...post,
                    isLiked: !post.isLiked,
                    likes: post.isLiked ? Math.max(post.likes - 1, 0) : post.likes + 1
                  }
                : post
            )
          }
        }))
      }

      const res = await reactApi.toggleReactionPost({
        postId,
        reactionType,
      })

      if (!res.success) {
        // revert optimistic update on failure
        if (reactionType === 'like') {
          setFeeds(prev => ({
            ...prev,
            [activeTab]: {
              ...prev[activeTab],
              posts: prev[activeTab].posts.map(post =>
                post.id === postId
                  ? {
                      ...post,
                      isLiked: !post.isLiked,
                      likes: post.isLiked ? post.likes + 1 : Math.max(post.likes - 1, 0)
                    }
                  : post
              )
            }
          }))
        }
        toast({ title: 'Lỗi', description: res.error || 'Không thể thực hiện thao tác. Vui lòng thử lại.', variant: 'destructive' })
      }
    } catch (error) {
      if (reactionType === 'like') {
        setFeeds(prev => ({
          ...prev,
          [activeTab]: {
            ...prev[activeTab],
            posts: prev[activeTab].posts.map(post =>
              post.id === postId
                ? {
                    ...post,
                    isLiked: !post.isLiked,
                    likes: post.isLiked ? post.likes + 1 : Math.max(post.likes - 1, 0)
                  }
                : post
            )
          }
        }))
      }

      toast({
        title: "Lỗi",
        description: "Không thể thực hiện thao tác. Vui lòng thử lại.",
        variant: "destructive"
      })
    }
  }, [isAuthenticated, activeTab, toast, VALID_REACTION_TYPES])

  const handleLike = useCallback(async (postId: string) => {
    return toggleReaction(postId, 'like')
  }, [toggleReaction])

  const handleBookmark = useCallback(async (postId: string) => {
    if (!isAuthenticated) {
      toast({
        title: "Yêu cầu đăng nhập",
        description: "Vui lòng đăng nhập để lưu bài viết",
        variant: "destructive"
      })
      return
    }

    try {
      // Optimistic update
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

      // TODO: Call API to bookmark/unbookmark post
      // await postsApi.bookmarkPost(postId)

    } catch (error) {
      // Revert optimistic update on error
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

      toast({
        title: "Lỗi",
        description: "Không thể thực hiện thao tác. Vui lòng thử lại.",
        variant: "destructive"
      })
    }
  }, [isAuthenticated, activeTab, toast])

  // Render media content with ImageGallery
  const renderMediaContent = useCallback((post: Post) => {
    if (!post.media || post.media.length === 0) return null

    // Transform post media to ImageGallery format
    const galleryMedia = post.media.map(media => ({
      id: media.id,
      type: media.type,
      url: media.url,
      thumbnail: media.thumbnail
    }))

    return (
      <div className="relative">
        <ImageGallery media={galleryMedia} className="mb-2" />
        {post.isAdult && !isAuthenticated && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center backdrop-blur-sm rounded-lg">
            <div className="text-center text-white">
              <div className="text-2xl mb-2">🔞</div>
              <p className="text-sm">Nội dung 18+</p>
              <Button size="sm" variant="secondary" className="mt-2">
                Đăng nhập để xem
              </Button>
            </div>
          </div>
        )}
        {post.views && post.media[0]?.type === 'video' && (
          <div className="absolute bottom-4 right-4 bg-black/70 text-white px-2 py-1 rounded text-sm">
            <Eye className="inline w-4 h-4 mr-1" />
            {post.views.toLocaleString()}
          </div>
        )}
      </div>
    )
  }, [isAuthenticated])

  // Toggle comments
  const toggleComments = useCallback(async (postId: string) => {
    setOpenComments(prev => ({ ...prev, [postId]: !prev[postId] }))
    const willOpen = !openComments[postId]
    if (willOpen && !commentsByPost[postId]) {
      setCommentsLoading(prev => ({ ...prev, [postId]: true }))
      const res = await commentApi.getPostComments(postId)
      const data = res && res.success ? (Array.isArray(res.data) ? res.data : (res.data as any)?.comments || []) : []
      setCommentsByPost(prev => ({ ...prev, [postId]: data }))
      setVisibleComments(prev => ({ ...prev, [postId]: 10 }))
      setCommentsLoading(prev => ({ ...prev, [postId]: false }))
    } else if (willOpen && visibleComments[postId] == null) {
      setVisibleComments(prev => ({ ...prev, [postId]: 10 }))
    }
  }, [openComments, commentsByPost, visibleComments])

  const submitNew = useCallback(async (postId: string) => {
    if (!isAuthenticated) {
      toast({ title: 'Yêu cầu đăng nhập', description: 'Vui lòng đăng nhập để bình luận', variant: 'destructive' })
      return
    }
    const content = (newComment[postId] || '').trim()
    if (!content) return
    setWorking(prev => ({ ...prev, [postId]: true }))
    const res = await commentApi.createComment(postId, { content })
    if (res.success && res.data) {
      const created = (res.data as any)
      setCommentsByPost(prev => ({ ...prev, [postId]: [created, ...(prev[postId] || [])] }))
      setNewComment(prev => ({ ...prev, [postId]: '' }))
      // bump post comment count
      setFeeds(prev => ({
        ...prev,
        [activeTab]: {
          ...prev[activeTab],
          posts: prev[activeTab].posts.map(p => p.id === postId ? { ...p, comments: (p.comments || 0) + 1 } : p)
        }
      }))
    } else {
      toast({ title: 'Lỗi', description: res.error || 'Không thể tạo bình luận', variant: 'destructive' })
    }
    setWorking(prev => ({ ...prev, [postId]: false }))
  }, [isAuthenticated, toast, newComment, activeTab])

  const saveEdit = useCallback(async (postId: string, commentId: string) => {
    const content = (editingContent[commentId] || '').trim()
    if (!content) return
    setWorking(prev => ({ ...prev, [commentId]: true }))
    const res = await commentApi.updateComment(commentId, { content })
    if (res.success) {
      setCommentsByPost(prev => ({
        ...prev,
        [postId]: (prev[postId] || []).map(c => c.id === commentId ? { ...c, content } : c)
      }))
      setEditingContent(prev => {
        const n = { ...prev }
        delete n[commentId]
        return n
      })
    } else {
      toast({ title: 'Lỗi', description: res.error || 'Không thể cập nhật bình luận', variant: 'destructive' })
    }
    setWorking(prev => ({ ...prev, [commentId]: false }))
  }, [editingContent, toast])

  const removeComment = useCallback(async (postId: string, commentId: string) => {
    setWorking(prev => ({ ...prev, [commentId]: true }))
    const res = await commentApi.deleteComment(commentId)
    if (res.success) {
      setCommentsByPost(prev => ({
        ...prev,
        [postId]: (prev[postId] || []).filter(c => c.id !== commentId)
      }))
      setFeeds(prev => ({
        ...prev,
        [activeTab]: {
          ...prev[activeTab],
          posts: prev[activeTab].posts.map(p => p.id === postId ? { ...p, comments: Math.max((p.comments || 1) - 1, 0) } : p)
        }
      }))
    } else {
      toast({ title: 'Lỗi', description: res.error || 'Không thể xóa bình luận', variant: 'destructive' })
    }
    setWorking(prev => ({ ...prev, [commentId]: false }))
  }, [activeTab, toast])

  // Render single post
  const renderPost = useCallback((post: Post) => (
    <Card key={post.id} className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Link href={`/user/${post.author.id}`}>
                <Avatar className="w-12 h-12 cursor-pointer hover:opacity-90">
                  <AvatarImage src={post.author.avatar} alt={post.author.displayName} />
                  <AvatarFallback className="bg-gradient-to-r from-pink-500 to-purple-500 text-white">
                    {post.author.displayName.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </Link>
              {post.author.isOnline && (
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <Link href={`/user/${post.author.id}`} className="font-semibold hover:underline">{post.author.displayName}</Link>
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
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className={`${post.isLiked ? 'text-red-500' : 'text-muted-foreground'} hover:text-red-500`}
                >
                  {userReactions[post.id] && userReactions[post.id] !== 'like' ? (
                    <span className="w-5 h-5 mr-1 text-lg leading-none">{REACTION_OPTIONS.find(r => r.type === userReactions[post.id])?.emoji}</span>
                  ) : (
                    <Heart className={`w-5 h-5 mr-1 ${post.isLiked ? 'fill-current' : ''}`} />
                  )}
                  {post.likes.toLocaleString()}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" side="top" className="px-2 py-1">
                <div className="flex items-center gap-2">
                  {REACTION_OPTIONS.map(opt => (
                    <button
                      key={opt.type}
                      onClick={() => {
                        setUserReactions(prev => ({ ...prev, [post.id]: opt.type }))
                        toggleReaction(post.id, opt.type)
                      }}
                      className="text-2xl leading-none hover:scale-110 transition-transform"
                      title={opt.label}
                      aria-label={opt.label}
                    >
                      {opt.emoji}
                    </button>
                  ))}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-blue-500" onClick={() => toggleComments(post.id)}>
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

        {openComments[post.id] && (
          <div className="mt-4 space-y-3">
            <div className="flex items-start gap-2">
              <Avatar className="w-8 h-8">
                <AvatarImage src={user?.avatar || ''} alt={user?.username || 'You'} />
                <AvatarFallback>U</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <Textarea
                  rows={1}
                  className="min-h-[40px] focus:min-h-[100px] transition-[min-height] duration-200 resize-none"
                  placeholder="Viết bình luận..."
                  value={newComment[post.id] || ''}
                  onChange={(e) => setNewComment(prev => ({ ...prev, [post.id]: e.target.value }))}
                />
                <div className="flex justify-end mt-2">
                  <Button size="sm" onClick={() => submitNew(post.id)} disabled={working[post.id] || !(newComment[post.id] || '').trim()}>
                    Gửi
                  </Button>
                </div>
              </div>
            </div>

            {commentsLoading[post.id] ? (
              <div className="text-sm text-muted-foreground">Đang tải bình luận...</div>
            ) : (
              <div className="space-y-3">
                {(() => {
                  const all = (commentsByPost[post.id] || [])
                  const count = visibleComments[post.id] ?? 10
                  const list = all.slice(0, count)
                  return (
                    <>
                      {list.map((c: any) => (
                        <div key={c.id} className="flex items-start gap-2">
                          <Avatar className="w-8 h-8">
                            <AvatarImage src={c.user?.avatar || c.author?.avatar || ''} alt={c.user?.username || c.author?.username || 'User'} />
                            <AvatarFallback>{(c.user?.username || c.author?.username || 'U').slice(0,1).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 bg-muted/30 rounded-md p-2">
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold">{c.user?.username || c.author?.displayName || c.author?.username || 'User'}</span>
                                <span className="text-xs text-muted-foreground">{new Date(c.createdAt).toLocaleString('vi-VN')}</span>
                              </div>
                              {(isAuthenticated && (c.userId?.toString?.() === user?.id?.toString?.() || c.user?.id?.toString?.() === user?.id?.toString?.() || c.author?.id?.toString?.() === user?.id?.toString?.())) && (
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-7 w-7">
                                      <MoreHorizontal className="w-4 h-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => setEditingContent(prev => ({ ...prev, [c.id]: c.content }))}>Sửa</DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => removeComment(post.id, c.id)}>Xóa</DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              )}
                            </div>
                            {editingContent[c.id] !== undefined ? (
                              <div className="mt-1">
                                <Textarea rows={2} value={editingContent[c.id]} onChange={(e) => setEditingContent(prev => ({ ...prev, [c.id]: e.target.value }))} />
                                <div className="flex gap-2 justify-end mt-1">
                                  <Button size="sm" variant="outline" onClick={() => setEditingContent(prev => { const n = { ...prev }; delete n[c.id]; return n })}>Hủy</Button>
                                  <Button size="sm" onClick={() => saveEdit(post.id, c.id)} disabled={working[c.id] || !(editingContent[c.id] || '').trim()}>Lưu</Button>
                                </div>
                              </div>
                            ) : (
                              <p className="text-sm mt-1 whitespace-pre-line">{c.content}</p>
                            )}
                          </div>
                        </div>
                      ))}
                      {all.length > count && (
                        <div className="pt-1">
                          <Button variant="ghost" size="sm" onClick={() => setVisibleComments(prev => ({ ...prev, [post.id]: count + 10 }))}>
                            Xem thêm bình luận
                          </Button>
                        </div>
                      )}
                    </>
                  )
                })()}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  ), [formatTimeAgo, renderMediaContent, handleLike, handleBookmark, openComments, commentsByPost, commentsLoading, newComment, working, isAuthenticated, user, toggleComments, submitNew, saveEdit, removeComment, userReactions, toggleReaction])

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
            <div className="space-y-4">
              <div className="text-6xl mb-4">😞</div>
              <h3 className="text-lg font-semibold text-red-600">Có lỗi xảy ra</h3>
              <p className="text-muted-foreground">{currentFeed.error}</p>
              <Button onClick={refreshFeed} variant="outline">
                Thử lại
              </Button>
            </div>
          </Card>
        )}
        
        {/* Page navigation for Facebook-style pagination */}
        {currentFeed.posts.length > 0 && (
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => loadPosts(activeTab, Math.max(1, currentFeed.page - 1), true)}
                  disabled={currentFeed.page <= 1 || currentFeed.loading}
                >
                  Trang trước
                </Button>
                <span className="text-sm text-muted-foreground">
                  Trang {currentFeed.page}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => loadPosts(activeTab, currentFeed.page + 1, true)}
                  disabled={!currentFeed.hasMore || currentFeed.loading}
                >
                  Trang tiếp
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                {currentFeed.posts.length} bài viết
              </p>
            </div>
          </Card>
        )}

        {!currentFeed.loading && !currentFeed.hasMore && currentFeed.posts.length > 0 && (
          <Card className="p-6 text-center">
            <p className="text-muted-foreground">
              Đây là trang cuối cùng!
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
                {activeTab === 'following' ? (!isAuthenticated ? 'Chưa đăng nhập' : 'Chưa theo dõi ai') :
                 activeTab === 'my-posts' ? 'Chưa có bài viết' :
                 'Chưa có bài viết'}
              </h3>
              <p className="text-muted-foreground">
                {activeTab === 'following'
                  ? (!isAuthenticated ? 'Hãy đăng nhập để xem các bài viết của creator đã follow' : 'Hãy theo dõi một số người để xem bài viết của họ tại đây')
                  : activeTab === 'my-posts'
                  ? 'Bắt đầu tạo bài viết đầu tiên của bạn!'
                  : 'Hiện tại chưa có bài viết nào. Hãy quay lại sau!'
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
