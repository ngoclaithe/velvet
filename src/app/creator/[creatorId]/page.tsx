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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { bookingApi, type BookingType } from '@/lib/api/booking'
import { reviewApi, type Review } from '@/lib/api/review'
import { useCloudinaryUpload } from '@/hooks/useCloudinaryUpload'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'
import ReportButton from '@/components/report/ReportButton'
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
  Scissors,
  ArrowRight,
  Flag
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

  const [openBooking, setOpenBooking] = useState(false)
  const [bookingType, setBookingType] = useState<BookingType>('private_chat')
  const [duration, setDuration] = useState<number>(5)
  const [scheduledTime, setScheduledTime] = useState<string>('')
  const [notes, setNotes] = useState<string>('')
  const [submittingBooking, setSubmittingBooking] = useState(false)

  // Reviews state
  const [reviews, setReviews] = useState<Review[]>([])
  const [page, setPage] = useState(1)
  const [limit] = useState(5)
  const [total, setTotal] = useState(0)
  const [loadingReviews, setLoadingReviews] = useState(false)
  const [filterRating, setFilterRating] = useState<number | 'all'>('all')

  // New review form state
  const [rvRating, setRvRating] = useState(5)
  const [rvHover, setRvHover] = useState(0)
  const [rvComment, setRvComment] = useState('')
  const [rvFiles, setRvFiles] = useState<File[]>([])
  const [rvPreviews, setRvPreviews] = useState<string[]>([])
  const [rvAnon, setRvAnon] = useState(false)
  const [rvSubmitting, setRvSubmitting] = useState(false)
  const [reviewOpen, setReviewOpen] = useState(false)
  const [lightbox, setLightbox] = useState<{ images: string[]; index: number } | null>(null)
  const { uploadMultiple, uploading } = useCloudinaryUpload()
  const removeRvFile = (index: number) => {
    setRvFiles(prev => prev.filter((_, i) => i !== index))
    setRvPreviews(prev => {
      if (prev[index]) URL.revokeObjectURL(prev[index])
      return prev.filter((_, i) => i !== index)
    })
  }
  const clearRvMedia = () => {
    setRvFiles([])
    setRvPreviews(prev => { prev.forEach(u => URL.revokeObjectURL(u)); return [] })
  }

  const languageLabel = (code: string) =>
    ({ vi: 'Tiếng Việt', en: 'Tiếng Anh', ja: 'Tiếng Nhật', ko: 'Tiếng Hàn', zh: 'Tiếng Trung' } as Record<string, string>)[code] || code

  const formatMoney = (v?: string | null) => {
    if (!v) return '-'
    const n = Number(v)
    if (Number.isNaN(n) || n <= 0) return '-'
    return `${n.toFixed(2)}`
  }

  // Fetch reviews
  useEffect(() => {
    const fetchReviews = async () => {
      if (!creatorId) return
      try {
        setLoadingReviews(true)
        const res = await reviewApi.getReviews(Number(creatorId), {
          page,
          limit,
          rating: filterRating === 'all' ? undefined : filterRating,
          sortBy: 'createdAt',
          order: 'desc',
        })
        if (res.success && res.data) {
          const data: any = res.data
          const list: Review[] = Array.isArray(data.reviews) ? data.reviews : (Array.isArray(data) ? data as any : [])
          setReviews(list)
          setTotal(Number(data.total || list.length || 0))
        } else {
          setReviews([])
          setTotal(0)
        }
      } catch (e) {
        setReviews([])
        setTotal(0)
      } finally {
        setLoadingReviews(false)
      }
    }
    fetchReviews()
  }, [creatorId, page, limit, filterRating])

  // Submit new review
  const submitNewReview = async () => {
    if (!creator) return
    if (!isAuthenticated) {
      toast({ title: 'Yêu cầu đăng nhập', description: 'Vui lòng đăng nhập để đánh giá', variant: 'destructive' })
      return
    }
    try {
      setRvSubmitting(true)
      let uploadedUrls: string[] = []
      if (rvFiles.length) {
        const uploadRes = await uploadMultiple(rvFiles, { resource_type: 'image' })
        uploadedUrls = uploadRes.map(r => r.secure_url)
      }
      const res = await reviewApi.postReview({
        creatorId: creator.id,
        rating: rvRating,
        comment: rvComment || undefined,
        images: uploadedUrls.length ? uploadedUrls.slice(0, 5) : undefined,
        isAnonymous: rvAnon,
      })
      if (!res.success) throw new Error(res.error || res.message || 'Gửi đánh giá thất bại')
      toast({ title: 'Đã gửi đánh giá' })
      setReviewOpen(false)
      // reset form
      setRvRating(5); setRvHover(0); setRvComment(''); clearRvMedia(); setRvAnon(false)
      // refresh list
      setPage(1)
      const refreshed = await reviewApi.getReviews(creator.id, { page: 1, limit, sortBy: 'createdAt', order: 'desc' })
      if (refreshed.success && refreshed.data) {
        const data: any = refreshed.data
        const list: Review[] = Array.isArray(data.reviews) ? data.reviews : (Array.isArray(data) ? data as any : [])
        setReviews(list)
        setTotal(Number(data.total || list.length || 0))
      }
    } catch (e: any) {
      toast({ title: 'Lỗi', description: e?.message || 'Không thể gửi đánh giá', variant: 'destructive' })
    } finally {
      setRvSubmitting(false)
    }
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
        // toast({ title: 'Đã bỏ theo dõi', description: 'Bạn đã bỏ theo dõi creator này' })
      } else {
        await userApi.followCreator(creator.id.toString())
        // toast({ title: 'Đã theo dõi', description: 'Bạn đã theo dõi creator này' })
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

  const minDurationForType = (type: BookingType) => {
    if (type === 'byhour') return 60
    if (type === 'byshot') return 1
    return 5
  }
  const maxDurationForType = (type: BookingType) => {
    if (type === 'byshot') return 60
    return 24 * 60
  }

  const openBookingModal = () => {
    if (!isAuthenticated) {
      toast({ title: 'Yêu cầu đăng nhập', description: 'Vui lòng đăng nhập để đặt lịch', variant: 'destructive' })
      return
    }
    const initialType: BookingType = 'private_chat'
    setBookingType(initialType)
    const baseMin = Math.max(minDurationForType(initialType), creator?.minBookingDuration || 0)
    setDuration(Math.max(5, baseMin))
    setScheduledTime('')
    setNotes('')
    setOpenBooking(true)
  }

  const handleSubmitBooking = async () => {
    if (!creator) return
    try {
      setSubmittingBooking(true)
      const payload = {
        creatorId: creator.id,
        type: bookingType,
        duration: duration,
        scheduledTime: scheduledTime ? scheduledTime : undefined,
        notes: notes ? notes : undefined,
      }
      const resp = await bookingApi.createBooking(payload)
      if (!resp.success) {
        throw new Error(resp.error || resp.message || 'Đặt lịch thất bại')
      }
      toast({ title: 'Thành công', description: 'Đã tạo booking thành công' })
      setOpenBooking(false)
    } catch (e: any) {
      toast({ title: 'Lỗi', description: e?.message || 'Không thể đặt lịch', variant: 'destructive' })
    } finally {
      setSubmittingBooking(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 p-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <Skeleton className="w-8 h-8 rounded-full" />
            <Skeleton className="h-5 w-28" />
          </div>
          <Card className="bg-gray-800 border-gray-700 mb-4">
            <CardContent className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4">
                <Skeleton className="w-24 h-24 rounded-full" />
                <div className="flex-1 space-y-3">
                  <Skeleton className="h-7 w-44" />
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-14 w-full" />
                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                    <Skeleton className="h-10 w-28" />
                    <Skeleton className="h-10 w-28" />
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
        <Card className="bg-gray-800 border-gray-700 p-6 text-center">
          <h2 className="text-xl font-bold text-white mb-3">Không tìm thấy creator</h2>
          <p className="text-gray-400 mb-4">Creator này không tồn tại hoặc đã bị xóa</p>
          <Button onClick={() => router.push('/?tab=creators')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Quay lại
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="border-b border-gray-800 p-4">
        <div className="max-w-6xl mx-auto">
          <Button variant="ghost" onClick={() => router.push('/?tab=creators')} className="text-gray-400 hover:text-white mb-3">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Quay lại
          </Button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className="lg:col-span-4">
            <div className="lg:sticky lg:top-4 space-y-4">
              <Card className="bg-gray-800 border-gray-700">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex flex-col items-center text-center gap-3">
                    <div className="relative">
                      <Avatar className="w-24 h-24 sm:w-28 sm:h-28">
                        <AvatarImage src={creator.avatar} alt={getDisplayName(creator)} loading="lazy" decoding="async" />
                        <AvatarFallback className="bg-gradient-to-r from-pink-500 to-purple-500 text-white text-3xl">
                          {getDisplayName(creator).charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      {creator.isOnline && <div className="absolute -bottom-2 -right-2 w-7 h-7 bg-green-500 border-4 border-gray-800 rounded-full" />}
                      {creator.isLive && (
                        <div className="absolute -top-2 -right-2">
                          <Badge className="bg-red-500 hover:bg-red-600 text-white">LIVE</Badge>
                        </div>
                      )}
                    </div>

                    <div className="w-full min-w-0">
                      <div className="flex items-center justify-center gap-2 mb-1.5">
                        <h1 className="text-2xl font-bold text-white break-words">{getDisplayName(creator)}</h1>
                        {creator.isVerified && <Verified className="w-6 h-6 text-blue-500" />}
                      </div>
                      <p className="text-gray-400 text-sm mb-1 break-all">@{creator.username}</p>

                      {creator.titleBio && (
                        <div className="bg-gradient-to-r from-pink-500/20 to-purple-500/20 rounded-lg p-2.5 mb-2">
                          <p className="text-pink-300 font-semibold text-sm leading-relaxed">{creator.titleBio}</p>
                        </div>
                      )}

                      {creator.location && (
                        <div className="flex items-center justify-center gap-2 text-gray-400 text-xs mb-2">
                          <MapPin className="w-4 h-4" />
                          {creator.location}
                        </div>
                      )}
                      {creator.bio && <p className="text-gray-300 text-sm leading-relaxed mb-3 whitespace-pre-line break-words">{creator.bio}</p>}

                      {creator.tags && creator.tags.length > 0 && (
                        <div className="flex flex-wrap justify-center gap-2 mb-3">
                          {creator.tags.map((t) => (
                            <Badge key={t} variant="secondary" className="bg-gray-700 text-gray-200">#{t}</Badge>
                          ))}
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-3 mb-3">
                        <div className="text-center">
                          <p className="text-white font-bold text-lg">{formatCount(creator.followersCount)}</p>
                          <p className="text-gray-400 text-xs">Followers</p>
                        </div>
                        {creator.rating && Number(creator.rating) > 0 && (
                          <div className="text-center">
                            <div className="flex items-center justify-center gap-1">
                              <Star className="w-5 h-5 text-yellow-400 fill-current" />
                              <span className="text-white font-bold text-lg">{Number(creator.rating).toFixed(1)}</span>
                            </div>
                            <p className="text-gray-400 text-xs">{creator.totalRatings} đánh giá</p>
                          </div>
                        )}
                      </div>

                      {isAuthenticated && creator.userId.toString() !== user?.id ? (
                        <div className="grid grid-cols-2 gap-2">
                          <Button onClick={handleFollow} disabled={actionLoading} className={`${creator.isFollowing ? 'bg-gray-600 hover:bg-gray-700 text-white' : 'bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700'} w-full`}>
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
                            className="border-gray-600 text-gray-300 hover:bg-gray-700 w-full"
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
                            <Button className="bg-green-600 hover:bg-green-700 w-full" onClick={openBookingModal}>
                              <Calendar className="w-4 h-4 mr-2" />
                              Đặt lịch
                            </Button>
                          )}
                          <ReportButton reportedUserId={creator.userId} size="default" className="w-full" />
                        </div>
                      ) : !isAuthenticated ? (
                        <div className="text-center">
                          <p className="text-gray-400 mb-3">Đăng nhập để theo dõi creator</p>
                          <Button onClick={() => (window.location.href = '/login')} className="bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700">
                            Đăng nhập
                          </Button>
                        </div>
                      ) : null}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {creator.service && (
                <Card className="bg-gray-800 border-gray-700">
                  <CardContent className="p-4">
                    <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                      <Award className="w-5 h-5 text-pink-400" />
                      Dịch vụ
                    </h3>
                    <div className="bg-gray-700/50 rounded-lg p-3">
                      <p className="text-gray-300 whitespace-pre-line leading-relaxed">{creator.service}</p>
                    </div>
                  </CardContent>
                </Card>
              )}

            </div>
          </div>

          <div className="lg:col-span-8 space-y-4">
            {galleryMedia.length > 0 && (
              <Card className="bg-gray-800 border-gray-700">
                <CardContent className="p-4">
                  <h3 className="text-lg font-semibold text-white mb-3">Hình ảnh</h3>
                  <ImageGallery media={galleryMedia} />
                </CardContent>
              </Card>
            )}

            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-4">
                <h3 className="text-lg font-semibold text-white mb-3">Thông tin chi tiết</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-300">
                  <div className="space-y-3">
                    <h4 className="text-base font-semibold text-pink-300 mb-2.5 flex items-center gap-2">
                      <DollarSign className="w-5 h-5" />
                      Thông tin giá
                    </h4>
                    <div className="space-y-2.5">
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

                  <div className="space-y-3">
                    <h4 className="text-base font-semibold text-blue-300 mb-2.5 flex items-center gap-2">
                      <Clock className="w-5 h-5" />
                      Thông tin booking
                    </h4>
                    <div className="space-y-2.5">
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

                  {((creator.languages && creator.languages.length > 0) || (creator.specialties && creator.specialties.length > 0)) && (
                    <div className="md:col-span-2 space-y-3">
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

                  <div className="md:col-span-2">
                    <h4 className="text-base font-semibold text-green-300 mb-2.5 flex items-center gap-2">
                      <Users className="w-5 h-5" />
                      Thông tin hình thể
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
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

                  <div className="md:col-span-2">
                    <h4 className="text-base font-semibold text-purple-300 mb-2.5 flex items-center gap-2">
                      <Palette className="w-5 h-5" />
                      Thông tin ngoại hình
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
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
                      <div className="mt-3 p-3 bg-gray-700/50 rounded-lg">
                        <div className="text-sm text-gray-400 mb-1.5 flex items-center gap-2">
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
              <Card className="bg-gray-800 border-gray-700">
                <CardContent className="p-4">
                  <h3 className="text-lg font-semibold text-white mb-3">Stream hiện tại</h3>
                  <p className="text-gray-300">{creator.streamTitle}</p>
                </CardContent>
              </Card>
            )}

            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-4 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <h3 className="text-lg font-semibold text-white">Đánh giá</h3>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400 text-sm">Lọc:</span>
                    <Select value={String(filterRating)} onValueChange={(v) => { setFilterRating(v === 'all' ? 'all' : Number(v) as any); setPage(1) }}>
                      <SelectTrigger className="w-32">
                        <SelectValue placeholder="Tất cả" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tất cả</SelectItem>
                        {[5,4,3,2,1].map(v => (
                          <SelectItem key={v} value={String(v)}>{v} sao</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {isAuthenticated && creator.userId.toString() !== user?.id && (
                      <Button className="bg-pink-600 hover:bg-pink-700 ml-2" onClick={() => setReviewOpen(true)}>
                        Thêm đánh giá
                      </Button>
                    )}
                  </div>
                </div>

                {loadingReviews ? (
                  <div className="py-6 text-center text-gray-400">Đang tải đánh giá...</div>
                ) : reviews.length === 0 ? (
                  <div className="py-6 text-center text-gray-400">Chưa có đánh giá</div>
                ) : (
                  <div className="space-y-3">
                    {reviews.map((r) => (
                      <div key={r.id} className="border border-gray-700 rounded-md p-3">
                        <div className="flex items-start gap-3">
                          <Avatar className="h-9 w-9">
                            <AvatarImage src={r.user?.avatar || undefined} alt={r.user?.username || 'User'} />
                            <AvatarFallback>{(r.user?.username || 'U').slice(0,2).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <div className="flex items-center gap-1 text-yellow-400">
                                {Array.from({ length: 5 }).map((_, i) => (
                                  <Star key={i} className={cn('h-4 w-4', i < r.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-600')} />
                                ))}
                              </div>
                              <span className="text-xs text-gray-500">{new Date(r.createdAt).toLocaleDateString('vi-VN')}</span>
                            </div>
                            <div className="mt-1 text-sm text-gray-200 whitespace-pre-line break-words">
                              {r.comment || ''}
                            </div>
                            {r.images && r.images.length > 0 && (
                              <div className="mt-2 grid grid-cols-3 sm:grid-cols-5 gap-2">
                            {r.images.map((u, idx) => (
                              <button key={`${r.id}-${idx}`} type="button" onClick={() => setLightbox({ images: r.images || [], index: idx })} className="block focus:outline-none">
                                <img src={u} alt={`rv-${idx}`} className="w-full h-16 sm:h-20 object-cover rounded cursor-zoom-in" loading="lazy" decoding="async" />
                              </button>
                            ))}
                          </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    {total > limit && (
                      <div className="pt-2 flex items-center justify-between">
                        <Button variant="outline" className="border-gray-600" disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p-1))}>Trước</Button>
                        <span className="text-sm text-gray-400">Trang {page}</span>
                        <Button variant="outline" className="border-gray-600" disabled={page * limit >= total} onClick={() => setPage(p => p+1)}>Sau</Button>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Dialog open={reviewOpen} onOpenChange={(open) => { if (!open) clearRvMedia(); setReviewOpen(open) }}>
        <DialogContent className="max-w-lg w-[95vw]">
          <DialogHeader>
            <DialogTitle>Thêm đánh giá</DialogTitle>
            <DialogDescription>Chia sẻ trải nghiệm của bạn về creator</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Chấm điểm</Label>
              <div className="flex items-center gap-1 mt-1">
                {Array.from({ length: 5 }).map((_, i) => {
                  const value = i + 1
                  const active = (rvHover || rvRating) >= value
                  return (
                    <button
                      key={value}
                      type="button"
                      onMouseEnter={() => setRvHover(value)}
                      onMouseLeave={() => setRvHover(0)}
                      onClick={() => setRvRating(value)}
                      className="p-1"
                      aria-label={`Chấm ${value} sao`}
                    >
                      <Star className={cn('h-6 w-6', active ? 'fill-yellow-400 text-yellow-400' : 'text-gray-400')} />
                    </button>
                  )
                })}
              </div>
            </div>
            <div>
              <Label>Bình luận (tùy chọn)</Label>
              <Textarea value={rvComment} onChange={(e) => setRvComment(e.target.value)} maxLength={1000} placeholder="Chia sẻ trải nghiệm của bạn..." />
              <div className="text-xs text-right text-muted-foreground">{rvComment.length}/1000</div>
            </div>
            <div>
              <Label>Ảnh minh họa (tối đa 5)</Label>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => {
                  const files = Array.from(e.target.files || []).slice(0, 5)
                  setRvFiles(files)
                  setRvPreviews(prev => { prev.forEach(u => URL.revokeObjectURL(u)); return files.map(f => URL.createObjectURL(f)) })
                }}
                className="mt-2 block w-full text-sm text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-gray-700 file:text-gray-200 hover:file:bg-gray-600"
              />
              {rvPreviews.length > 0 && (
                <div className="mt-2 grid grid-cols-3 sm:grid-cols-5 gap-2">
                  {rvPreviews.map((u, idx) => (
                    <div key={u} className="relative">
                      <img src={u} alt={`preview-${idx}`} className="w-full h-16 object-cover rounded" />
                      {(rvSubmitting || uploading) && (
                        <div className="absolute inset-0 bg-black/30 flex items-center justify-center rounded">
                          <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => removeRvFile(idx)}
                        className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600"
                        aria-label="Xóa ảnh"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Switch id="rv-anon" checked={rvAnon} onCheckedChange={setRvAnon} />
              <Label htmlFor="rv-anon">Ẩn danh</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReviewOpen(false)}>Hủy</Button>
            <Button onClick={submitNewReview} disabled={rvSubmitting || uploading}>{rvSubmitting || uploading ? 'Đang gửi...' : 'Gửi đánh giá'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Review images lightbox */}
      <Dialog open={!!lightbox} onOpenChange={(open) => { if (!open) setLightbox(null) }}>
        <DialogContent className="max-w-3xl w-[95vw] p-0 bg-black/90">
          {lightbox && (
            <div className="relative">
              <img src={lightbox?.images[lightbox?.index ?? 0]} alt="review" className="max-h-[80vh] w-full object-contain" />
              <button
                type="button"
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white rounded-full p-2"
                onClick={() =>
                  setLightbox((prev) =>
                    prev ? { images: prev.images, index: (prev.index - 1 + prev.images.length) % prev.images.length } : prev
                  )
                }
                aria-label="Ảnh trước"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
              <button
                type="button"
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white rounded-full p-2"
                onClick={() =>
                  setLightbox((prev) =>
                    prev ? { images: prev.images, index: (prev.index + 1) % prev.images.length } : prev
                  )
                }
                aria-label="Ảnh sau"
              >
                <ArrowRight className="w-6 h-6" />
              </button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={openBooking} onOpenChange={setOpenBooking}>
        <DialogContent className="bg-gray-900 border border-gray-700 text-gray-100">
          <DialogHeader>
            <DialogTitle>Đặt lịch với {getDisplayName(creator)}</DialogTitle>
            <DialogDescription>Điền thông tin bên dưới để tạo booking</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <Label htmlFor="type">Loại booking</Label>
                <Select value={bookingType} onValueChange={(v) => { const t = v as BookingType; setBookingType(t); const min = Math.max(minDurationForType(t), creator.minBookingDuration || 0); setDuration(Math.max(min, 1)); }}>
                  <SelectTrigger id="type">
                    <SelectValue placeholder="Chọn loại" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="private_show">Private show</SelectItem>
                    <SelectItem value="private_chat">Private chat</SelectItem>
                    <SelectItem value="cam2cam">Cam2Cam</SelectItem>
                    <SelectItem value="byshot">By shot</SelectItem>
                    <SelectItem value="byhour">By hour</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-400 mt-1">{bookingType === 'byhour' ? 'Tối thiểu 60 phút' : bookingType === 'byshot' ? 'Tối đa 60 phút' : 'Tối thiểu 5 phút'}</p>
              </div>
              <div>
                <Label htmlFor="duration">Thời lượng (phút)</Label>
                <Input
                  id="duration"
                  type="number"
                  min={Math.max(minDurationForType(bookingType), creator.minBookingDuration || 0)}
                  max={maxDurationForType(bookingType)}
                  value={duration}
                  onChange={(e) => setDuration(Math.max(parseInt(e.target.value || '0', 10) || 0, 0))}
                  placeholder="Số phút"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <Label htmlFor="scheduledTime">Thời gian (tùy chọn)</Label>
                <Input
                  id="scheduledTime"
                  type="datetime-local"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                />
                <p className="text-xs text-gray-400 mt-1">Để trống nếu muốn bắt đầu ngay khi được chấp nhận</p>
              </div>
              <div>
                <Label htmlFor="notes">Ghi chú (tùy chọn)</Label>
                <Textarea id="notes" maxLength={500} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Yêu cầu chi tiết..." />
                <div className="text-xs text-gray-500 mt-1 text-right">{notes.length}/500</div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" className="border-gray-600" onClick={() => setOpenBooking(false)}>Hủy</Button>
            <Button onClick={handleSubmitBooking} disabled={submittingBooking} className="bg-green-600 hover:bg-green-700">
              {submittingBooking ? <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" /> : null}
              Xác nhận đặt lịch
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
