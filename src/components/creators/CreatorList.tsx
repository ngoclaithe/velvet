'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/hooks/useAuth'
import { creatorAPI } from '@/lib/api/creator'
import { userApi } from '@/lib/api/user'
import { postsApi } from '@/lib/api/posts'
import {
  Users,
  UserPlus,
  UserMinus,
  Eye,
  Heart,
  MessageCircle,
  MapPin,
  Star,
  Grid3X3,
  UserX,
  Crown,
  Verified,
  MoreHorizontal
} from 'lucide-react'

interface Creator {
  id: number
  userId: number
  username: string
  firstName: string
  lastName: string
  stageName?: string
  avatar?: string
  bio?: string
  followerCount?: number
  followingCount?: number
  isVerified?: boolean
  isOnline?: boolean
  category?: string
  location?: string
  isFollowing?: boolean
}

interface Post {
  id: string
  content: string
  media?: Array<{
    type: 'image' | 'video'
    url: string
    thumbnail?: string
  }>
  likes: number
  comments: number
  createdAt: Date
  isAdult?: boolean
  isPremium?: boolean
}

// Define the tab type explicitly
type TabType = 'all' | 'following' | 'followers'

export default function CreatorList() {
  const [activeTab, setActiveTab] = useState<TabType>('all')
  const [creators, setCreators] = useState<Creator[]>([])
  const [followingCreators, setFollowingCreators] = useState<Creator[]>([])
  const [followers, setFollowers] = useState<Creator[]>([])
  const [loading, setLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  // Removed creator detail modal state since we're navigating to a new page
  const { toast } = useToast()
  const { user, isAuthenticated } = useAuth()

  // Fetch all creators
  const fetchAllCreators = useCallback(async () => {
    try {
      setLoading(true)
      const response = await creatorAPI.getAllCreators()
      console.log("Giá trị reponse", response)
      if (response.success && response.data && Array.isArray(response.data)) {
        // Transform API response to match Creator interface
        const transformedCreators: Creator[] = response.data.map((item: any) => ({
          id: Number(item?.id || 0),
          userId: Number(item?.userId || 0),
          username: item?.user?.username || '',
          firstName: item?.user?.firstName || '',
          lastName: item?.user?.lastName || '',
          stageName: item?.stageName || '',
          avatar: item?.user?.avatar || '',
          bio: item?.bio || '',
          followerCount: Number(item?.followerCount || 0),
          followingCount: Number(item?.followingCount || 0),
          isVerified: Boolean(item?.isVerified),
          isOnline: Boolean(item?.isLive),
          category: item?.category || '',
          location: item?.location || '',
          isFollowing: Boolean(item?.isFollowing)
        }))
        setCreators(transformedCreators)
      } else {
        setCreators([])
      }
    } catch (error) {
      console.error('Error fetching creators:', error)
      setCreators([])
    } finally {
      setLoading(false)
    }
  }, [])

  // Fetch following creators
  const fetchFollowingCreators = useCallback(async () => {
    if (!isAuthenticated || !user?.id) return

    try {
      setLoading(true)
      const response = await userApi.getFollowing(user.id)
      if (response.success && response.data && Array.isArray(response.data)) {
        setFollowingCreators(response.data)
      } else {
        setFollowingCreators([])
      }
    } catch (error) {
      console.error('Error fetching following creators:', error)
      setFollowingCreators([])
    } finally {
      setLoading(false)
    }
  }, [isAuthenticated, user?.id])

  // Fetch followers (for creators)
  const fetchFollowers = useCallback(async () => {
    if (!isAuthenticated || user?.role !== 'creator') return

    try {
      setLoading(true)
      const response = await creatorAPI.getUsersFollowMe()
      if (response.success && response.data && Array.isArray(response.data)) {
        setFollowers(response.data)
      } else {
        setFollowers([])
      }
    } catch (error) {
      console.error('Error fetching followers:', error)
      setFollowers([])
    } finally {
      setLoading(false)
    }
  }, [isAuthenticated, user?.role])


  // Handle creator click to navigate to creator page
  const handleCreatorClick = (creatorId: number) => {
    window.location.href = `/creator/${creatorId}`
  }

  // Handle follow/unfollow
  const handleFollow = async (id: number, isCurrentlyFollowing: boolean) => {
    if (!isAuthenticated) {
      toast({
        title: "Yêu cầu đăng nhập",
        description: "Vui lòng đăng nhập để theo dõi creator",
        variant: "destructive"
      })
      return
    }

    try {
      setActionLoading(String(id))

      if (isCurrentlyFollowing) {
        await userApi.unfollowCreator(id.toString())
        toast({
          title: "Đã bỏ theo dõi",
          description: "Bạn đã bỏ theo dõi creator này"
        })
      } else {
        await userApi.followCreator(id.toString())
        toast({
          title: "Đã theo dõi",
          description: "Bạn đã theo dõi creator này"
        })
      }

      // Update local state
      setCreators(prev => prev.map(creator =>
        creator.id === id
          ? {
              ...creator,
              isFollowing: !isCurrentlyFollowing,
              followerCount: isCurrentlyFollowing
                ? (creator.followerCount || 0) - 1
                : (creator.followerCount || 0) + 1
            }
          : creator
      ))

      // Refresh following list if currently viewing it
      if (activeTab === 'following') {
        fetchFollowingCreators()
      }

    } catch (error) {
      console.error('Error following/unfollowing creator:', error)
      toast({
        title: "Lỗi",
        description: "Không thể th��c hiện hành động này",
        variant: "destructive"
      })
    } finally {
      setActionLoading(null)
    }
  }

  // Handle remove follower (for creators)
  const handleRemoveFollower = async (followerId: string) => {
    if (user?.role !== 'creator') return

    try {
      setActionLoading(followerId)
      await creatorAPI.deleteUserFollow(parseInt(followerId))
      
      setFollowers(prev => prev.filter(follower => follower.id.toString() !== followerId))
      
      toast({
        title: "Đã xóa follower",
        description: "Follower đã được xóa khỏi danh sách"
      })
    } catch (error) {
      console.error('Error removing follower:', error)
      toast({
        title: "Lỗi",
        description: "Không thể xóa follower",
        variant: "destructive"
      })
    } finally {
      setActionLoading(null)
    }
  }

  // Load data based on active tab
  useEffect(() => {
    switch (activeTab) {
      case 'all':
        fetchAllCreators()
        break
      case 'following':
        fetchFollowingCreators()
        break
      case 'followers':
        fetchFollowers()
        break
      case 'my-posts':
        fetchMyPosts()
        break
    }
  }, [activeTab, fetchAllCreators, fetchFollowingCreators, fetchFollowers, fetchMyPosts])

  // Format follower count
  const formatCount = (count?: number) => {
    if (!count) return '0'
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`
    return count.toString()
  }

  // Format time ago
  const formatTimeAgo = (date: Date) => {
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const days = Math.floor(diff / 86400000)
    const hours = Math.floor(diff / 3600000)
    const minutes = Math.floor(diff / 60000)

    if (days > 0) return `${days} ngày trước`
    if (hours > 0) return `${hours} giờ trước`
    if (minutes > 0) return `${minutes} phút trước`
    return 'Vừa xong'
  }

  // Safe function to get display name with fallback
  const getDisplayName = (creator: Creator) => {
    if (creator.stageName) return creator.stageName
    const fullName = `${creator.firstName} ${creator.lastName}`.trim()
    return fullName || creator.username || 'Unknown'
  }

  // Render creator card
  const renderCreatorCard = (creator: Creator, showRemoveButton = false) => (
    <Card
      key={creator.id}
      className="bg-gray-800 border-gray-700 hover:border-pink-500/50 transition-colors cursor-pointer"
      onClick={() => handleCreatorClick(creator.id as number)}
    >
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Avatar className="w-16 h-16">
                <AvatarImage src={creator.avatar} alt={getDisplayName(creator)} />
                <AvatarFallback className="bg-gradient-to-r from-pink-500 to-purple-500 text-white text-lg">
                  {getDisplayName(creator).charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              {creator.isOnline && (
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-gray-800 rounded-full"></div>
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-white text-lg">
                  {getDisplayName(creator)}
                </h3>
                {creator.isVerified && (
                  <Verified className="w-5 h-5 text-blue-500" />
                )}
              </div>
              <p className="text-gray-400 text-sm">@{creator.username || 'unknown'}</p>
            </div>
          </div>
          <Eye className="w-5 h-5 text-gray-400" />
        </div>

        {creator.bio && (
          <p className="text-gray-300 text-sm mb-4 leading-relaxed line-clamp-2">
            {creator.bio}
          </p>
        )}

        {showRemoveButton && (
          <div className="flex justify-end">
            <Button
              onClick={(e) => {
                e.stopPropagation()
                handleRemoveFollower(creator.id.toString())
              }}
              disabled={actionLoading === creator.id.toString()}
              variant="destructive"
              size="sm"
            >
              {actionLoading === creator.id.toString() ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <UserX className="w-4 h-4 mr-2" />
                  Xóa
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )

  // Render post card
  const renderPostCard = (post: Post) => (
    <Card key={post.id} className="bg-gray-800 border-gray-700">
      <CardContent className="p-4">
        <p className="text-white mb-3 leading-relaxed">{post.content}</p>
        
        {post.media && post.media.length > 0 && (
          <div className="mb-3">
            {post.media[0].type === 'image' ? (
              <img
                src={post.media[0].url}
                alt="Post content"
                className="w-full h-48 object-cover rounded-lg"
              />
            ) : (
              <div className="relative">
                <img
                  src={post.media[0].thumbnail || post.media[0].url}
                  alt="Video thumbnail"
                  className="w-full h-48 object-cover rounded-lg"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                    <div className="w-0 h-0 border-l-4 border-l-white border-y-2 border-y-transparent ml-1" />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="flex items-center justify-between text-gray-400 text-sm">
          <div className="flex items-center space-x-4">
            <div className="flex items-center gap-1">
              <Heart className="w-4 h-4" />
              {post.likes}
            </div>
            <div className="flex items-center gap-1">
              <MessageCircle className="w-4 h-4" />
              {post.comments}
            </div>
          </div>
          <span>{formatTimeAgo(post.createdAt)}</span>
        </div>

        {(post.isAdult || post.isPremium) && (
          <div className="flex gap-2 mt-2">
            {post.isAdult && (
              <Badge variant="destructive" className="text-xs">18+</Badge>
            )}
            {post.isPremium && (
              <Badge className="text-xs bg-yellow-600 hover:bg-yellow-700">Premium</Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )

  // Render loading skeleton
  const renderSkeleton = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i} className="bg-gray-800 border-gray-700">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4 mb-4">
              <Skeleton className="w-16 h-16 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
            <Skeleton className="h-3 w-full mb-2" />
            <Skeleton className="h-3 w-3/4 mb-4" />
            <Skeleton className="h-8 w-full" />
          </CardContent>
        </Card>
      ))}
    </div>
  )

  // Handle tab change with proper typing
  const handleTabChange = (value: string) => {
    setActiveTab(value as TabType)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Creators</h2>
          <p className="text-gray-400">Khám phá và theo dõi các creator yêu thích</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="grid w-full grid-cols-4 bg-gray-800 border-gray-700">
          <TabsTrigger value="all" className="flex items-center gap-2 text-gray-300 data-[state=active]:text-white">
            <Users className="w-4 h-4" />
            Tất cả
          </TabsTrigger>
          <TabsTrigger 
            value="following" 
            className="flex items-center gap-2 text-gray-300 data-[state=active]:text-white"
            disabled={!isAuthenticated}
          >
            <UserPlus className="w-4 h-4" />
            Đang theo dõi
          </TabsTrigger>
          {user?.role === 'creator' && (
            <TabsTrigger value="followers" className="flex items-center gap-2 text-gray-300 data-[state=active]:text-white">
              <Crown className="w-4 h-4" />
              Followers
            </TabsTrigger>
          )}
          <TabsTrigger 
            value="my-posts" 
            className="flex items-center gap-2 text-gray-300 data-[state=active]:text-white"
            disabled={!isAuthenticated}
          >
            <Grid3X3 className="w-4 h-4" />
            Bài viết của tôi
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-6">
          {loading ? (
            renderSkeleton()
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {creators.map(creator => renderCreatorCard(creator, false))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="following" className="space-y-6">
          {!isAuthenticated ? (
            <Card className="p-6 text-center bg-gray-800 border-gray-700">
              <p className="text-gray-400 mb-4">Đăng nhập để xem danh sách theo dõi</p>
              <Button onClick={() => window.location.href = '/login'}>
                Đăng nhập
              </Button>
            </Card>
          ) : loading ? (
            renderSkeleton()
          ) : followingCreators.length === 0 ? (
            <Card className="p-6 text-center bg-gray-800 border-gray-700">
              <Users className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">Chưa theo dõi ai</h3>
              <p className="text-gray-400 mb-4">H��y theo dõi một số creator để xem họ ��� đây</p>
              <Button onClick={() => setActiveTab('all')}>
                Khám phá creators
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {followingCreators.map(creator => renderCreatorCard(creator, false))}
            </div>
          )}
        </TabsContent>

        {user?.role === 'creator' && (
          <TabsContent value="followers" className="space-y-6">
            {loading ? (
              renderSkeleton()
            ) : followers.length === 0 ? (
              <Card className="p-6 text-center bg-gray-800 border-gray-700">
                <Users className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">Chưa có follower</h3>
                <p className="text-gray-400">Chia sẻ nội dung để thu hút followers</p>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {followers.map(follower => renderCreatorCard(follower, true))}
              </div>
            )}
          </TabsContent>
        )}

        <TabsContent value="my-posts" className="space-y-6">
          {!isAuthenticated ? (
            <Card className="p-6 text-center bg-gray-800 border-gray-700">
              <p className="text-gray-400 mb-4">Đăng nhập để xem bài viết của bạn</p>
              <Button onClick={() => window.location.href = '/login'}>
                Đăng nhập
              </Button>
            </Card>
          ) : loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <Card key={i} className="bg-gray-800 border-gray-700">
                  <CardContent className="p-4">
                    <Skeleton className="h-4 w-full mb-3" />
                    <Skeleton className="h-48 w-full mb-3" />
                    <Skeleton className="h-4 w-32" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : myPosts.length === 0 ? (
            <Card className="p-6 text-center bg-gray-800 border-gray-700">
              <Grid3X3 className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">Chưa có bài viết</h3>
              <p className="text-gray-400 mb-4">Bắt đầu chia sẻ nội dung c���a bạn</p>
              <Button onClick={() => window.location.href = '/create-post'}>
                Tạo bài viết đầu tiên
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {myPosts.map(renderPostCard)}
            </div>
          )}
        </TabsContent>
      </Tabs>

    </div>
  )
}
