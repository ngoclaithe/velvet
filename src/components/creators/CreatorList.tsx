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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { VIETNAM_CITIES } from '@/lib/constants'
import {
  Users,
  UserPlus,
  UserMinus,
  Eye,
  Heart,
  MessageCircle,
  MapPin,
  Star,
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


// Define the tab type explicitly
type TabType = 'all' | 'following' | 'followers' | 'callgirl'

export default function CreatorList() {
  const [activeTab, setActiveTab] = useState<TabType>('all')
  const [creators, setCreators] = useState<Creator[]>([])
  const [followingCreators, setFollowingCreators] = useState<Creator[]>([])
  const [followers, setFollowers] = useState<Creator[]>([])
  const [loading, setLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  // Callgirl tab state
  const [callgirls, setCallgirls] = useState<Creator[]>([])
  const [callgirlLoading, setCallgirlLoading] = useState(false)
  const [callgirlCity, setCallgirlCity] = useState<string>('all')
  const [minPrice, setMinPrice] = useState<string>('')
  const [maxPrice, setMaxPrice] = useState<string>('')
  const [cgPage, setCgPage] = useState(1)
  const [cgLimit, setCgLimit] = useState(9)
  const [cgTotalPages, setCgTotalPages] = useState(1)
  const [cgTotal, setCgTotal] = useState(0)

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
        description: "Không thể thực hiện hành động này",
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

  // Fetch callgirls
  const fetchCallgirls = useCallback(async () => {
    try {
      setCallgirlLoading(true)
      const params: any = { page: cgPage, limit: cgLimit }
      if (callgirlCity && callgirlCity !== 'all') params.city = callgirlCity
      if (minPrice) params.minPrice = Number(minPrice)
      if (maxPrice) params.maxPrice = Number(maxPrice)
      const res: any = await creatorAPI.getCallgirl(params)
      if (res?.success) {
        const list = Array.isArray(res.data) ? res.data : Array.isArray((res.data as any)?.items) ? (res.data as any).items : []
        const transformed: Creator[] = list.map((item: any) => ({
          id: Number(item?.id || item?.userId || 0),
          userId: Number(item?.userId || 0),
          username: item?.user?.username || '',
          firstName: item?.user?.firstName || '',
          lastName: item?.user?.lastName || '',
          stageName: item?.stageName || '',
          avatar: item?.user?.avatar || '',
          bio: item?.bio || '',
          followerCount: Number(item?.followersCount || item?.followerCount || 0),
          followingCount: Number(item?.followingCount || 0),
          isVerified: Boolean(item?.isVerified),
          isOnline: Boolean(item?.isLive),
          category: 'callgirl',
          location: item?.user?.city || item?.city || '',
          isFollowing: Boolean(item?.isFollowing)
        }))
        setCallgirls(transformed)
        const pag = (res as any).pagination || (res.data as any)?.pagination || {}
        setCgTotal(Number(pag.total || pag.totalItems || transformed.length))
        setCgTotalPages(Number(pag.totalPages || Math.ceil((pag.total || transformed.length) / cgLimit) || 1))
      } else {
        setCallgirls([])
        setCgTotal(0)
        setCgTotalPages(1)
      }
    } catch (e) {
      console.error('Error fetching callgirls', e)
      setCallgirls([])
      setCgTotal(0)
      setCgTotalPages(1)
    } finally {
      setCallgirlLoading(false)
    }
  }, [cgPage, cgLimit, callgirlCity, minPrice, maxPrice])

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
      case 'callgirl':
        fetchCallgirls()
        break
    }
  }, [activeTab, fetchAllCreators, fetchFollowingCreators, fetchFollowers, fetchCallgirls])

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
    return 'V���a xong'
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
        <TabsList className={`grid w-full ${isAuthenticated && (user?.role === 'user' || user?.role === 'admin') ? 'grid-cols-3' : 'grid-cols-2'} bg-gray-800 border-gray-700`}>
          <TabsTrigger value="all" className="flex items-center gap-2 text-gray-300 data-[state=active]:text-white">
            <Users className="w-4 h-4" />
            Tất cả
          </TabsTrigger>
          {isAuthenticated && (user?.role === 'user' || user?.role === 'admin') && (
            <TabsTrigger
              value="following"
              className="flex items-center gap-2 text-gray-300 data-[state=active]:text-white"
            >
              <UserPlus className="w-4 h-4" />
              Đang theo dõi
            </TabsTrigger>
          )}
          <TabsTrigger value="callgirl" className="flex items-center gap-2 text-gray-300 data-[state=active]:text-white">
            <Heart className="w-4 h-4" />
            Callgirl
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
              <p className="text-gray-400 mb-4">Hãy theo dõi một số creator để xem họ ở đây</p>
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

        <TabsContent value="callgirl" className="space-y-4">
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div>
                  <label className="text-xs text-gray-400">Thành phố</label>
                  <Select value={callgirlCity} onValueChange={(v) => { setCallgirlCity(v); setCgPage(1) }}>
                    <SelectTrigger className="mt-1 bg-gray-900 border-gray-700 text-gray-200">
                      <SelectValue placeholder="Chọn thành phố" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-900 border-gray-700">
                      <SelectItem value="all">Tất cả</SelectItem>
                      {VIETNAM_CITIES.map(c => (
                        <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs text-gray-400">Giá tối thiểu (VND)</label>
                  <Input type="number" className="mt-1 bg-gray-900 border-gray-700 text-gray-200" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} placeholder="0" />
                </div>
                <div>
                  <label className="text-xs text-gray-400">Giá tối đa (VND)</label>
                  <Input type="number" className="mt-1 bg-gray-900 border-gray-700 text-gray-200" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} placeholder="" />
                </div>
                <div className="flex items-end gap-2">
                  <Button onClick={() => { setCgPage(1); fetchCallgirls() }}>Lọc</Button>
                  <Button variant="outline" onClick={() => { setCallgirlCity(''); setMinPrice(''); setMaxPrice(''); setCgPage(1); fetchCallgirls() }}>Xóa lọc</Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {callgirlLoading ? (
            renderSkeleton()
          ) : callgirls.length === 0 ? (
            <Card className="p-6 text-center bg-gray-800 border-gray-700">
              <h3 className="text-white">Không tìm thấy kết quả</h3>
            </Card>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {callgirls.map(c => renderCreatorCard(c, false))}
              </div>
              <div className="flex items-center justify-between pt-2">
                <div className="text-sm text-gray-400">Trang {cgPage}/{cgTotalPages} • Tổng {cgTotal.toLocaleString('vi-VN')}</div>
                <div className="flex gap-2">
                  <Button variant="outline" disabled={cgPage <= 1} onClick={() => setCgPage(p => Math.max(1, p - 1))}>Trước</Button>
                  <Button variant="outline" disabled={cgPage >= cgTotalPages} onClick={() => setCgPage(p => Math.min(cgTotalPages, p + 1))}>Sau</Button>
                </div>
              </div>
            </>
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

      </Tabs>

    </div>
  )
}
