'use client'

import { useState, useEffect, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
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
import { ImageGallery } from '@/components/ui/image-gallery'
import {
  UserPlus,
  UserMinus,
  MessageCircle,
  MapPin,
  Verified,
  ArrowLeft,
  Star,
  Calendar,
  DollarSign,
  Clock,
  Users,
  Award,
  Palette,
  Scissors
} from 'lucide-react'

interface Creator {
  id: number
  userId: number
  username: string
  firstName: string
  lastName: string
  stageName?: string
  avatar?: string
  titleBio?: string
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
  minBookingDuration?: number
  maxConcurrentBookings?: number
  currentBookingsCount?: number
  totalEarnings?: string
  availabilitySchedule?: object
  rating?: string
  totalRatings?: number
  isAvailableForBooking?: boolean
  bookingPrice?: string
  subscriptionPrice?: string
  tags?: string[]
  specialties?: string[]
  languages?: string[]
  bodyType?: string | null
  height?: number | null
  weight?: number | null
  measurement?: string | null
  eyeColor?: string | null
  hairColor?: string | null
  service?: string | null
  isTatto?: boolean
  signature?: string | null
  cosmeticSurgery?: string | null
  createdAt?: string
  updatedAt?: string
  mediaUrls?: string[]
}

// Define the API response type (partial and flexible)
interface CreatorApiResponse {
  id: number
  userId: number
  stageName?: string
  titleBio?: string
  bio?: string
  rating?: string
  totalRatings?: number
  isVerified?: boolean
  isLive?: boolean
  streamTitle?: string | null
  hourlyRate?: string
  minBookingDuration?: number
  maxConcurrentBookings?: number
  currentBookingsCount?: number
  totalEarnings?: string
  availabilitySchedule?: object
  isAvailableForBooking?: boolean
  bookingPrice?: string | null
  subscriptionPrice?: string | null
  category?: string
  location?: string
  isFollowing?: boolean
  followersCount?: number
  tags?: string[]
  specialties?: string[]
  languages?: string[]
  bodyType?: string | null
  height?: number | null
  weight?: number | null
  measurement?: string | null
  eyeColor?: string | null
  hairColor?: string | null
  service?: string | null
  isTatto?: boolean
  signature?: string | null
  cosmeticSurgery?: string | null
  createdAt?: string
  updatedAt?: string
  bioUrls?: string[]
  streamThumbnail?: string | null
  user?: {
    id: number
    username: string
    firstName: string
    lastName: string
    avatar?: string | null
    isOnline?: boolean
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
  const router = useRouter()

  const languageLabel = (code: string) =>
    ({ vi: 'Tiếng Việt', en: 'Tiếng Anh', ja: 'Tiếng Nhật', ko: 'Tiếng Hàn', zh: 'Tiếng Trung' } as Record<string, string>)[code] || code

  const formatMoney = (v?: string | null) => {
    if (!v) return '-'
    const n = Number(v)
    if (Number.isNaN(n) || n <= 0) return '-'
    return `${n.toFixed(2)}`
  }

  // Fetch creator details
  useEffect(() => {
    const fetchCreatorDetails = async () => {
      try {
        setLoading(true)
        const response = await creatorAPI.getCreatorById(Number(creatorId))
        if (response?.success && response?.data) {
          const apiData = response.data as CreatorApiResponse
          const mediaCandidates: string[] = []
          if (Array.isArray(apiData.bioUrls)) mediaCandidates.push(...apiData.bioUrls)

          const creatorDetail: Creator = {
            id: Number(apiData.id),
            userId: Number(apiData.userId),
            username: apiData.user?.username || '',
            firstName: apiData.user?.firstName || '',
            lastName: apiData.user?.lastName || '',
            stageName: apiData.stageName || '',
            avatar: apiData.user?.avatar || '',
            titleBio: apiData.titleBio || '',
            bio: apiData.bio || '',
            followersCount: Number(apiData.followersCount || 0),
            isVerified: Boolean(apiData.isVerified),
            isOnline: Boolean(apiData.user?.isOnline),
            isLive: Boolean(apiData.isLive),
            category: apiData.category || '',
            location: apiData.location || '',
            isFollowing: Boolean(apiData.isFollowing),
            streamTitle: apiData.streamTitle || '',
            hourlyRate: apiData.hourlyRate || '0',
            minBookingDuration: apiData.minBookingDuration || 0,
            maxConcurrentBookings: apiData.maxConcurrentBookings || 0,
            currentBookingsCount: apiData.currentBookingsCount || 0,
            totalEarnings: apiData.totalEarnings || '0',
            availabilitySchedule: apiData.availabilitySchedule || {},
            rating: apiData.rating || '0',
            totalRatings: Number(apiData.totalRatings || 0),
            isAvailableForBooking: Boolean(apiData.isAvailableForBooking),
            bookingPrice: apiData.bookingPrice || '0',
            subscriptionPrice: apiData.subscriptionPrice || '0',
            tags: Array.isArray(apiData.tags) ? apiData.tags : [],
            specialties: Array.isArray(apiData.specialties) ? apiData.specialties : [],
            languages: Array.isArray(apiData.languages) ? apiData.languages : [],
            bodyType: apiData.bodyType ?? null,
            height: apiData.height ?? null,
            weight: apiData.weight ?? null,
            measurement: apiData.measurement ?? null,
            eyeColor: apiData.eyeColor ?? null,
            hairColor: apiData.hairColor ?? null,
            service: apiData.service ?? null,
            isTatto: Boolean(apiData.isTatto),
            signature: apiData.signature ?? null,
            cosmeticSurgery: apiData.cosmeticSurgery ?? null,
            createdAt: apiData.createdAt,
            updatedAt: apiData.updatedAt,
            mediaUrls: mediaCandidates.filter(Boolean)
          }
          setCreator(creatorDetail)
        }
      } catch (error) {
        console.error('Error fetching creator details:', error)
        toast({ title: 'Lỗi', description: 'Không thể tải thông tin creator', variant: 'destructive' })
      } finally {
        setLoading(false)
      }
    }

    if (creatorId) fetchCreatorDetails()
  }, [creatorId, toast])

  const galleryMedia = useMemo(() => {
    if (!creator?.mediaUrls || creator.mediaUrls.length === 0) return []
    return creator.mediaUrls.map((url, idx) => ({ id: `media-${idx}`, type: 'image' as const, url }))
  }, [creator?.mediaUrls])

  // Handle follow/unfollow
  const handleFollow = async () => {
    if (!isAuthenticated) {
      toast({ title: 'Yêu cầu đăng nhập', description: 'Vui lòng đăng nhập để theo dõi creator', variant: 'destructive' })
      return
    }
    if (!creator) return

    try {
      setActionLoading(true)
      if (creator.isFollowing) {
        await userApi.unfollowCreator(creator.id.toString())
        toast({ title: 'Đã bỏ theo dõi', description: 'Bạn đã bỏ theo dõi creator này' })
      } else {
        await userApi.followCreator(creator.id.toString())
        toast({ title: 'Đã theo dõi', description: 'Bạn đã theo dõi creator này' })
      }
      setCreator(prev => prev ? { ...prev, isFollowing: !prev.isFollowing, followersCount: (prev.followersCount || 0) + (prev.isFollowing ? -1 : 1) } : null)
    } catch (error) {
      console.error('Error following/unfollowing creator:', error)
      toast({ title: 'Lỗi', description: 'Không thể thực hiện hành động này', variant: 'destructive' })
    } finally {
      setActionLoading(false)
    }
  }

  const getDisplayName = (creator: Creator) => {
    if (creator.stageName) return creator.stageName
    const fullName = `${creator.firstName} ${creator.lastName}`.trim()
    return fullName || creator.username || 'Unknown'
  }

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
          <div className="flex items-center gap-4 mb-8">
            <Skeleton className="w-8 h-8 rounded-full" />
            <Skeleton className="h-6 w-32" />
          </div>
          <Card className="bg-gray-800 border-gray-700 mb-6">
            <CardContent className="p-4 sm:p-8">
              <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6">
                <Skeleton className="w-32 h-32 rounded-full" />
                <div className="flex-1 space-y-4">
                  <Skeleton className="h-8 w-48" />
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-16 w-full" />
                  <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
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
      <div className="border-b border-gray-800 p-6">
        <div className="max-w-4xl mx-auto">
          <Button variant="ghost" onClick={() => window.history.back()} className="text-gray-400 hover:text-white mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Quay lại
          </Button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6">
        <Card className="bg-gray-800 border-gray-700 mb-6">
          <CardContent className="p-4 sm:p-8">
            <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6">
              <div className="relative">
                <Avatar className="w-24 h-24 sm:w-32 sm:h-32">
                  <AvatarImage src={creator.avatar} alt={getDisplayName(creator)} />
                  <AvatarFallback className="bg-gradient-to-r from-pink-500 to-purple-500 text-white text-4xl">
                    {getDisplayName(creator).charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                {creator.isOnline && <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-500 border-4 border-gray-800 rounded-full" />}
                {creator.isLive && (
                  <div className="absolute -top-2 -right-2">
                    <Badge className="bg-red-500 hover:bg-red-600 text-white">LIVE</Badge>
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-2xl sm:text-3xl font-bold text-white break-words">{getDisplayName(creator)}</h1>
                  {creator.isVerified && <Verified className="w-6 h-6 sm:w-8 sm:h-8 text-blue-500" />}
                </div>
                <p className="text-gray-400 text-sm sm:text-base mb-1 break-all">@{creator.username}</p>
                
                {creator.titleBio && (
                  <div className="bg-gradient-to-r from-pink-500/20 to-purple-500/20 rounded-lg p-3 mb-4">
                    <p className="text-pink-300 font-semibold text-sm sm:text-base leading-relaxed">{creator.titleBio}</p>
                  </div>
                )}

                {creator.location && (
                  <div className="flex items-center gap-2 text-gray-400 text-xs sm:text-sm mb-4">
                    <MapPin className="w-4 h-4" />
                    {creator.location}
                  </div>
                )}
                {creator.bio && <p className="text-gray-300 text-sm sm:text-base md:text-lg leading-relaxed mb-6 whitespace-pre-line break-words">{creator.bio}</p>}

                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
                  <div className="text-center">
                    <p className="text-white font-bold text-lg sm:text-2xl">{formatCount(creator.followersCount)}</p>
                    <p className="text-gray-400 text-sm">Followers</p>
                  </div>
                  {creator.rating && Number(creator.rating) > 0 && (
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Star className="w-5 h-5 text-yellow-400 fill-current" />
                        <span className="text-white font-bold text-lg sm:text-2xl">{Number(creator.rating).toFixed(1)}</span>
                      </div>
                      <p className="text-gray-400 text-sm">{creator.totalRatings} đánh giá</p>
                    </div>
                  )}
                  {creator.hourlyRate && Number(creator.hourlyRate) > 0 && (
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <DollarSign className="w-5 h-5 text-green-400" />
                        <span className="text-white font-bold text-lg sm:text-2xl">{creator.hourlyRate}</span>
                      </div>
                      <p className="text-gray-400 text-sm">Per hour</p>
                    </div>
                  )}
                  {creator.totalEarnings && Number(creator.totalEarnings) > 0 && (
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Award className="w-5 h-5 text-yellow-400" />
                        <span className="text-white font-bold text-lg sm:text-2xl">{formatMoney(creator.totalEarnings)}</span>
                      </div>
                      <p className="text-gray-400 text-sm">Total Earnings</p>
                    </div>
                  )}
                </div>

                {isAuthenticated && creator.userId.toString() !== user?.id ? (
                  <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                    <Button onClick={handleFollow} disabled={actionLoading} className={`flex-1 ${creator.isFollowing ? 'bg-gray-600 hover:bg-gray-700 text-white' : 'bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700'}`}>
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
                          if (!resp.success || !resp.data || !(resp.data as any).conversation) {
                            throw new Error(resp.error || 'Không tạo được cuộc trò chuyện')
                          }
                          const { conversation, mqttTopic } = resp.data as any
                          const topic = mqttTopic || conversation?.topic
                          if (topic) { try { await subscribeTopic(topic) } catch {} }
                          router.push(`/messages?conversationId=${conversation.id}`)
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
                    <Button onClick={() => (window.location.href = '/login')} className="bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700">
                      Đăng nhập
                    </Button>
                  </div>
                ) : null}
              </div>
            </div>
          </CardContent>
        </Card>

        {galleryMedia.length > 0 && (
          <Card className="bg-gray-800 border-gray-700 mb-6">
            <CardContent className="p-4">
              <h3 className="text-xl font-semibold text-white mb-3">Hình ảnh</h3>
              <ImageGallery media={galleryMedia} />
            </CardContent>
          </Card>
        )}

        {creator.service && (
          <Card className="bg-gray-800 border-gray-700 mb-6">
            <CardContent className="p-6">
              <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <Award className="w-6 h-6 text-pink-400" />
                Dịch vụ
              </h3>
              <div className="bg-gray-700/50 rounded-lg p-4">
                <p className="text-gray-300 whitespace-pre-line leading-relaxed">{creator.service}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {(creator.category || (creator.tags && creator.tags.length > 0)) && (
          <Card className="bg-gray-800 border-gray-700 mb-6">
            <CardContent className="p-6">
              <h3 className="text-xl font-semibold text-white mb-4">Phân loại & Tags</h3>
              <div className="flex flex-wrap gap-2">
                {creator.category && (
                  <Badge variant="outline" className="border-gray-600 text-gray-300 px-4 py-2">{creator.category}</Badge>
                )}
                {creator.tags?.map((t) => (
                  <Badge key={t} variant="secondary" className="bg-gray-700 text-gray-200">#{t}</Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="bg-gray-800 border-gray-700 mb-6">
          <CardContent className="p-6">
            <h3 className="text-xl font-semibold text-white mb-4">Thông tin chi tiết</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-gray-300">
              {/* Pricing Information */}
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-pink-300 mb-3 flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  Thông tin giá
                </h4>
                <div className="space-y-3">
                  <div>
                    <div className="text-sm text-gray-400">Giá theo giờ</div>
                    <div className="font-semibold">{formatMoney(creator.hourlyRate)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-400">Giá đặt lịch</div>
                    <div className="font-semibold">{formatMoney(creator.bookingPrice)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-400">Giá subscription</div>
                    <div className="font-semibold">{formatMoney(creator.subscriptionPrice)}</div>
                  </div>
                </div>
              </div>

              {/* Booking Information */}
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-blue-300 mb-3 flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Thông tin booking
                </h4>
                <div className="space-y-3">
                  <div>
                    <div className="text-sm text-gray-400">Thời gian tối thiểu (phút)</div>
                    <div className="font-semibold">{creator.minBookingDuration || '-'}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-400">Số booking tối đa</div>
                    <div className="font-semibold">{creator.maxConcurrentBookings || '-'}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-400">Booking hiện tại</div>
                    <div className="font-semibold">{creator.currentBookingsCount || 0}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-400">Có thể booking</div>
                    <div className={`font-semibold ${creator.isAvailableForBooking ? 'text-green-400' : 'text-red-400'}`}>
                      {creator.isAvailableForBooking ? 'Có' : 'Không'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Languages and Specialties */}
              {((creator.languages && creator.languages.length > 0) || (creator.specialties && creator.specialties.length > 0)) && (
                <div className="md:col-span-2 space-y-4">
                  {creator.languages && creator.languages.length > 0 && (
                    <div>
                      <div className="text-sm text-gray-400 mb-2">Ngôn ngữ</div>
                      <div className="flex flex-wrap gap-2">
                        {creator.languages.map((l) => (
                          <Badge key={l} variant="outline" className="border-gray-600 text-gray-300">{languageLabel(l)}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {creator.specialties && creator.specialties.length > 0 && (
                    <div>
                      <div className="text-sm text-gray-400 mb-2">Loại creator</div>
                      <div className="flex flex-wrap gap-2">
                        {creator.specialties.map((s) => (
                          <Badge key={s} className="bg-purple-600/20 text-purple-300">{s}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Physical Information */}
              <div className="md:col-span-2">
                <h4 className="text-lg font-semibold text-green-300 mb-3 flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Thông tin hình thể
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <div className="text-sm text-gray-400">Chiều cao</div>
                    <div className="font-semibold">{creator.height ? `${creator.height} cm` : '-'}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-400">Cân nặng</div>
                    <div className="font-semibold">{creator.weight ? `${creator.weight} kg` : '-'}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-400">Dáng người</div>
                    <div className="font-semibold">{creator.bodyType || '-'}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-400">Số đo</div>
                    <div className="font-semibold">{creator.measurement || '-'}</div>
                  </div>
                </div>
              </div>

              {/* Appearance Information */}
              <div className="md:col-span-2">
                <h4 className="text-lg font-semibold text-purple-300 mb-3 flex items-center gap-2">
                  <Palette className="w-5 h-5" />
                  Thông tin ngoại hình
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <div className="text-sm text-gray-400">Màu mắt</div>
                    <div className="font-semibold">{creator.eyeColor || '-'}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-400">Màu tóc</div>
                    <div className="font-semibold">{creator.hairColor || '-'}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-400">Có hình xăm</div>
                    <div className={`font-semibold ${creator.isTatto ? 'text-pink-400' : 'text-gray-400'}`}>
                      {creator.isTatto ? 'Có' : 'Không'}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-400">Phẫu thuật thẩm mỹ</div>
                    <div className={`font-semibold ${creator.cosmeticSurgery === 'true' ? 'text-blue-400' : 'text-gray-400'}`}>
                      {creator.cosmeticSurgery === 'true' ? 'Có' : creator.cosmeticSurgery === 'false' ? 'Không' : '-'}
                    </div>
                  </div>
                </div>
                {creator.signature && (
                  <div className="mt-4 p-4 bg-gray-700/50 rounded-lg">
                    <div className="text-sm text-gray-400 mb-2 flex items-center gap-2">
                      <Scissors className="w-4 h-4" />
                      Đặc điểm nổi bật
                    </div>
                    <div className="font-semibold text-pink-300">{creator.signature}</div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

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