'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/hooks/useAuth'
import { creatorAPI } from '@/lib/api/creator'
import { createConversation } from '@/lib/api/conversation'
import { subscribeTopic } from '@/lib/mqttClient'
import { userApi } from '@/lib/api/user'
import {
  UserPlus,
  UserMinus,
  MessageCircle,
  MapPin,
  Verified,
  ArrowLeft,
  Star,
  Clock,
  Calendar,
  DollarSign
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
  followersCount?: number
  isVerified?: boolean
  isOnline?: boolean
  category?: string
  location?: string
  isFollowing?: boolean
  isLive?: boolean
  streamTitle?: string
  hourlyRate?: string
  rating?: string
  totalRatings?: number
  isAvailableForBooking?: boolean
  bookingPrice?: string
  subscriptionPrice?: string
}

// Define the API response type
interface CreatorApiResponse {
  id: number
  userId: number
  stageName?: string
  bio?: string
  rating: string
  totalRatings: number
  isVerified: boolean
  isLive: boolean
  streamTitle?: string | null
  hourlyRate: string
  isAvailableForBooking: boolean
  bookingPrice: string
  subscriptionPrice: string
  category?: string
  location?: string
  isFollowing?: boolean
  followersCount?: number
  user?: {
    id: number
    username: string
    firstName: string
    lastName: string
    avatar?: string | null
    isOnline: boolean
  }
}

export default function CreatorDetailPage() {
  const params = useParams()
  const creatorId = params.creatorId as string
  const [creator, setCreator] = useState<Creator | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [chatLoading, setChatLoading] = useState(false)
  const { toast } = useToast()
  const { user, isAuthenticated } = useAuth()

  // Fetch creator details
  useEffect(() => {
    const fetchCreatorDetails = async () => {
      try {
        setLoading(true)
        const response = await creatorAPI.getCreatorById(Number(creatorId))
        
        if (response.success && response.data) {
          // Type assertion for the API response
          const apiData = response.data as CreatorApiResponse
          
          // Transform API response to match Creator interface
          const creatorDetail: Creator = {
            id: Number(apiData.id),
            userId: Number(apiData.userId),
            username: apiData.user?.username || '',
            firstName: apiData.user?.firstName || '',
            lastName: apiData.user?.lastName || '',
            stageName: apiData.stageName || '',
            avatar: apiData.user?.avatar || '',
            bio: apiData.bio || '',
            followersCount: Number(apiData.followersCount || 0),
            // followingCount: Number(apiData.followingCount || 0),
            isVerified: Boolean(apiData.isVerified),
            isOnline: Boolean(apiData.user?.isOnline),
            isLive: Boolean(apiData.isLive),
            category: apiData.category || '',
            location: apiData.location || '',
            isFollowing: Boolean(apiData.isFollowing),
            streamTitle: apiData.streamTitle || '',
            hourlyRate: apiData.hourlyRate || '0',
            rating: apiData.rating || '0',
            totalRatings: Number(apiData.totalRatings || 0),
            isAvailableForBooking: Boolean(apiData.isAvailableForBooking),
            bookingPrice: apiData.bookingPrice || '0',
            subscriptionPrice: apiData.subscriptionPrice || '0'
          }
          setCreator(creatorDetail)
        }
      } catch (error) {
        console.error('Error fetching creator details:', error)
        toast({
          title: "Lỗi",
          description: "Không thể tải thông tin creator",
          variant: "destructive"
        })
      } finally {
        setLoading(false)
      }
    }

    if (creatorId) {
      fetchCreatorDetails()
    }
  }, [creatorId, toast])

  // Handle follow/unfollow
  const handleFollow = async () => {
    if (!isAuthenticated) {
      toast({
        title: "Yêu cầu đăng nhập",
        description: "Vui lòng đăng nhập để theo dõi creator",
        variant: "destructive"
      })
      return
    }

    if (!creator) return

    try {
      setActionLoading(true)

      if (creator.isFollowing) {
        console.log("Giá trị id của creator là:", creator.id)
        await userApi.unfollowCreator(creator.id.toString())
        toast({
          title: "Đã bỏ theo dõi",
          description: "Bạn đã bỏ theo dõi creator này"
        })
      } else {
        await userApi.followCreator(creator.id.toString())
        toast({
          title: "Đã theo dõi",
          description: "Bạn đã theo dõi creator này"
        })
      }

      // Update local state
      setCreator(prev => prev ? {
        ...prev,
        isFollowing: !prev.isFollowing,
        followersCount: prev.isFollowing
          ? (prev.followersCount || 0) - 1
          : (prev.followersCount || 0) + 1
      } : null)

    } catch (error) {
      console.error('Error following/unfollowing creator:', error)
      toast({
        title: "Lỗi",
        description: "Không thể thực hiện hành động này",
        variant: "destructive"
      })
    } finally {
      setActionLoading(false)
    }
  }

  // Get display name
  const getDisplayName = (creator: Creator) => {
    if (creator.stageName) return creator.stageName
    const fullName = `${creator.firstName} ${creator.lastName}`.trim()
    return fullName || creator.username || 'Unknown'
  }

  // Format count
  const formatCount = (count?: number) => {
    if (!count) return '0'
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`
    return count.toString()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 p-6">
        <div className="max-w-4xl mx-auto">
          {/* Header skeleton */}
          <div className="flex items-center gap-4 mb-8">
            <Skeleton className="w-8 h-8 rounded-full" />
            <Skeleton className="h-6 w-32" />
          </div>

          {/* Profile skeleton */}
          <Card className="bg-gray-800 border-gray-700 mb-6">
            <CardContent className="p-8">
              <div className="flex items-start gap-6">
                <Skeleton className="w-32 h-32 rounded-full" />
                <div className="flex-1 space-y-4">
                  <Skeleton className="h-8 w-48" />
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-16 w-full" />
                  <div className="flex gap-4">
                    <Skeleton className="h-10 w-32" />
                    <Skeleton className="h-10 w-32" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (!creator) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <Card className="bg-gray-800 border-gray-700 p-8 text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Không tìm thấy creator</h2>
          <p className="text-gray-400 mb-6">Creator này không tồn tại hoặc đã bị xóa</p>
          <Button onClick={() => window.history.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Quay lại
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <div className="border-b border-gray-800 p-6">
        <div className="max-w-4xl mx-auto">
          <Button
            variant="ghost"
            onClick={() => window.history.back()}
            className="text-gray-400 hover:text-white mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Quay lại
          </Button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6">
        {/* Creator Profile */}
        <Card className="bg-gray-800 border-gray-700 mb-6">
          <CardContent className="p-8">
            <div className="flex items-start gap-6">
              {/* Avatar */}
              <div className="relative">
                <Avatar className="w-32 h-32">
                  <AvatarImage src={creator.avatar} alt={getDisplayName(creator)} />
                  <AvatarFallback className="bg-gradient-to-r from-pink-500 to-purple-500 text-white text-4xl">
                    {getDisplayName(creator).charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                {creator.isOnline && (
                  <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-500 border-4 border-gray-800 rounded-full"></div>
                )}
                {creator.isLive && (
                  <div className="absolute -top-2 -right-2">
                    <Badge className="bg-red-500 hover:bg-red-600 text-white">
                      LIVE
                    </Badge>
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl font-bold text-white">
                    {getDisplayName(creator)}
                  </h1>
                  {creator.isVerified && (
                    <Verified className="w-8 h-8 text-blue-500" />
                  )}
                </div>

                <p className="text-gray-400 text-lg mb-1">@{creator.username}</p>

                {creator.location && (
                  <div className="flex items-center gap-2 text-gray-400 mb-4">
                    <MapPin className="w-4 h-4" />
                    {creator.location}
                  </div>
                )}

                {creator.bio && (
                  <p className="text-gray-300 text-lg leading-relaxed mb-6">
                    {creator.bio}
                  </p>
                )}

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
                  <div className="text-center">
                    <p className="text-white font-bold text-2xl">{formatCount(creator.followersCount)}</p>
                    <p className="text-gray-400 text-sm">Followers</p>
                  </div>
                  {creator.rating && Number(creator.rating) > 0 && (
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Star className="w-5 h-5 text-yellow-400 fill-current" />
                        <span className="text-white font-bold text-2xl">{Number(creator.rating).toFixed(1)}</span>
                      </div>
                      <p className="text-gray-400 text-sm">{creator.totalRatings} đánh giá</p>
                    </div>
                  )}
                  {creator.hourlyRate && Number(creator.hourlyRate) > 0 && (
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <DollarSign className="w-5 h-5 text-green-400" />
                        <span className="text-white font-bold text-2xl">${creator.hourlyRate}</span>
                      </div>
                      <p className="text-gray-400 text-sm">Per hour</p>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                {isAuthenticated && creator.userId.toString() !== user?.id ? (
                  <div className="flex gap-4">
                    <Button
                      onClick={handleFollow}
                      disabled={actionLoading}
                      className={`flex-1 ${
                        creator.isFollowing
                          ? 'bg-gray-600 hover:bg-gray-700 text-white'
                          : 'bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700'
                      }`}
                    >
                      {actionLoading ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : creator.isFollowing ? (
                        <>
                          <UserMinus className="w-4 h-4 mr-2" />
                          Bỏ theo dõi
                        </>
                      ) : (
                        <>
                          <UserPlus className="w-4 h-4 mr-2" />
                          Theo dõi
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      className="border-gray-600 text-gray-300 hover:bg-gray-700"
                      disabled={chatLoading}
                      onClick={async () => {
                        if (!isAuthenticated) {
                          toast({ title: 'Yêu cầu đăng nhập', description: 'Vui lòng đăng nhập để nhắn tin', variant: 'destructive' })
                          return
                        }
                        try {
                          setChatLoading(true)
                          const resp = await createConversation({ receiverId: creator.userId })
                          if (!resp.success || !resp.data) {
                            throw new Error(resp.error || 'Không tạo được cuộc trò chuyện')
                          }
                          const topic = (resp.data as any).topic as string | undefined
                          if (topic) {
                            const ok = await subscribeTopic(topic)
                            if (ok) {
                              toast({ title: 'Đã mở chat', description: 'Đã subscribe topic ' + topic })
                            } else {
                              toast({ title: 'Subscribe thất bại', description: 'Không thể subscribe MQTT topic', variant: 'destructive' })
                            }
                          } else {
                            toast({ title: 'Thiếu topic', description: 'API không trả về topic để subscribe', variant: 'destructive' })
                          }
                        } catch (e: any) {
                          toast({ title: 'Lỗi', description: e?.message || 'Không thể nhắn tin', variant: 'destructive' })
                        } finally {
                          setChatLoading(false)
                        }
                      }}
                    >
                      {chatLoading ? (
                        <div className="w-4 h-4 border-2 border-gray-300 border-t-transparent rounded-full animate-spin mr-2" />
                      ) : (
                        <MessageCircle className="w-4 h-4 mr-2" />
                      )}
                      Nhắn tin
                    </Button>
                    {creator.isAvailableForBooking && (
                      <Button className="bg-green-600 hover:bg-green-700">
                        <Calendar className="w-4 h-4 mr-2" />
                        Đặt lịch
                      </Button>
                    )}
                  </div>
                ) : !isAuthenticated ? (
                  <div className="text-center">
                    <p className="text-gray-400 mb-4">Đăng nhập để theo dõi creator</p>
                    <Button
                      onClick={() => window.location.href = '/login'}
                      className="bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700"
                    >
                      Đăng nhập
                    </Button>
                  </div>
                ) : null}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Additional Information */}
        {creator.category && (
          <Card className="bg-gray-800 border-gray-700 mb-6">
            <CardContent className="p-6">
              <h3 className="text-xl font-semibold text-white mb-4">Thể loại</h3>
              <Badge variant="outline" className="border-gray-600 text-gray-300 px-4 py-2">
                {creator.category}
              </Badge>
            </CardContent>
          </Card>
        )}

        {creator.streamTitle && (
          <Card className="bg-gray-800 border-gray-700 mb-6">
            <CardContent className="p-6">
              <h3 className="text-xl font-semibold text-white mb-4">Stream hiện tại</h3>
              <p className="text-gray-300">{creator.streamTitle}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
