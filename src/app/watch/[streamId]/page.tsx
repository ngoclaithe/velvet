'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
// Remove hls.js import - sẽ dùng dynamic import
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { toast } from 'react-hot-toast'
import {
  Heart,
  Users,
  Share2,
  MoreVertical
} from 'lucide-react'
import { streamApi, chatApi, paymentApi } from '@/lib/api'
import { useAuth } from '@/hooks/useAuth'
import StreamChatBox from '@/components/chat/StreamChatBox'

interface StreamData {
  streamId: number
  title: string
  description: string
  category: string
  tags: string[]
  quality: string
  isLive: boolean
  isPrivate: boolean
  viewerCount: number
  maxViewers: number
  startTime: string
  endTime?: string
  duration?: number
  hlsUrl: string
  streamKey: string
  thumbnail?: string
  creator: {
    id: number
    userId: number
    stageName: string
    displayName: string
    avatar?: string
    isVerified: boolean
    bio: string
    rating: string
    totalRatings: number
    hourlyRate: string
    bookingPrice: string
    subscriptionPrice: string
  }
  chatEnabled: boolean
  donationsEnabled: boolean
  pricePerMinute?: string
  totalDonations: string
}


export default function WatchStreamPage() {
  const params = useParams()
  const router = useRouter()
  const { user, isAuthenticated } = useAuth()
  const streamId = params.streamId as string

  const [streamData, setStreamData] = useState<StreamData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isMuted, setIsMuted] = useState(false)
  const [isFollowing, setIsFollowing] = useState(false)
  const [isCreator, setIsCreator] = useState(false)

  const videoRef = useRef<HTMLVideoElement>(null)
  const hlsRef = useRef<any>(null)

  useEffect(() => {
    const fetchStreamData = async () => {
      try {
        setIsLoading(true)
        const response = await streamApi.getStreamInfo(streamId)

        if (response.success && response.data) {
          // Kiểm tra và validate response data
          const streamData = response.data
          if (streamData && typeof streamData === 'object' && 'streamId' in streamData) {
            setStreamData(streamData as StreamData)
            // Check if current user is the creator
            if (user && streamData.creator && streamData.creator.userId === user.id) {
              setIsCreator(true)
            }
          } else {
            console.error('Invalid stream data format:', streamData)
            throw new Error('Dữ liệu stream không hợp lệ')
          }
        } else {
          // Fallback sample data
          const sampleData: StreamData = {
            streamId: parseInt(streamId) || 0,
            title: 'Sample Live Stream',
            description: 'This is a sample stream description',
            category: 'Gaming',
            tags: ['gaming', 'fun'],
            quality: 'HD',
            isLive: true,
            isPrivate: false,
            viewerCount: 1247,
            maxViewers: 1247,
            startTime: new Date().toISOString(),
            hlsUrl: 'sample.m3u8',
            streamKey: 'sample-key',
            creator: {
              id: 1,
              userId: 1,
              stageName: 'Sample Creator',
              displayName: 'Sample User',
              avatar: undefined,
              isVerified: true,
              bio: 'Sample bio',
              rating: '5.00',
              totalRatings: 10,
              hourlyRate: '10.00',
              bookingPrice: '15.00',
              subscriptionPrice: '20.00'
            },
            chatEnabled: true,
            donationsEnabled: true,
            totalDonations: '0.00'
          }
          setStreamData(sampleData)
        }
      } catch (error) {
        console.error('Error fetching stream data:', error)
        toast.error('Không thể tải thông tin stream')
        // Set sample data instead of redirecting
        const sampleData: StreamData = {
          streamId: parseInt(streamId) || 0,
          title: 'Sample Live Stream',
          description: 'This is a sample stream description',
          category: 'Gaming',
          tags: ['gaming', 'fun'],
          quality: 'HD',
          isLive: true,
          isPrivate: false,
          viewerCount: 1247,
          maxViewers: 1247,
          startTime: new Date().toISOString(),
          hlsUrl: 'sample.m3u8',
          streamKey: 'sample-key',
          creator: {
            id: 1,
            userId: 1,
            stageName: 'Sample Creator',
            displayName: 'Sample User',
            avatar: undefined,
            isVerified: true,
            bio: 'Sample bio',
            rating: '5.00',
            totalRatings: 10,
            hourlyRate: '10.00',
            bookingPrice: '15.00',
            subscriptionPrice: '20.00'
          },
          chatEnabled: true,
          donationsEnabled: true,
          totalDonations: '0.00'
        }
        setStreamData(sampleData)
      } finally {
        setIsLoading(false)
      }
    }

    if (streamId) {
      fetchStreamData()
    }
  }, [streamId, router, user])


  // Initialize HLS player với dynamic import
  useEffect(() => {
    const video = videoRef.current
    if (!video || !streamData?.hlsUrl) return

    // Dynamic import hls.js để tránh lỗi SSR và import
    const initializeHLS = async () => {
      try {
        // Kiểm tra native HLS support trước (Safari)
        if (video.canPlayType('application/vnd.apple.mpegurl')) {
          console.log('Using native HLS support')
          video.src = streamData.hlsUrl
          video.addEventListener('loadedmetadata', () => {
            video.play().catch(console.error)
          })
          return
        }

        // Dynamic import hls.js
        const HlsModule = await import('hls.js')
        const Hls = HlsModule.default

        if (Hls && Hls.isSupported()) {
          console.log('Using HLS.js')

          // Clean up existing HLS instance
          if (hlsRef.current) {
            hlsRef.current.destroy()
          }

          const hls = new Hls({
            enableWorker: false,
            lowLatencyMode: true,
            backBufferLength: 90
          })

          hlsRef.current = hls
          hls.loadSource(streamData.hlsUrl)
          hls.attachMedia(video)

          hls.on(Hls.Events.MANIFEST_PARSED, () => {
            console.log('HLS manifest parsed, playing video')
            video.play().catch(console.error)
          })

          hls.on(Hls.Events.ERROR, (event, data) => {
            console.error('HLS error:', data)
            if (data.fatal) {
              switch (data.type) {
                case Hls.ErrorTypes.NETWORK_ERROR:
                  console.log('Fatal network error encountered, trying to recover')
                  hls.startLoad()
                  break
                case Hls.ErrorTypes.MEDIA_ERROR:
                  console.log('Fatal media error encountered, trying to recover')
                  hls.recoverMediaError()
                  break
                default:
                  console.log('Fatal error, destroying HLS instance')
                  hls.destroy()
                  break
              }
            }
          })
        } else {
          console.error('HLS is not supported in this browser')
          toast.error('Trình duyệt không hỗ trợ phát stream')
        }
      } catch (error) {
        console.error('Failed to load HLS.js:', error)
        toast.error('Không thể tải HLS player')
      }
    }

    initializeHLS()

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy()
        hlsRef.current = null
      }
    }
  }, [streamData?.hlsUrl])


  const handleToggleFollow = async () => {
    if (!isAuthenticated) {
      toast.error('Vui lòng đăng nhập để theo dõi')
      return
    }

    try {
      if (isFollowing) {
        setIsFollowing(false)
        toast.success('Đã bỏ theo dõi')
      } else {
        setIsFollowing(true)
        toast.success('Đã theo dõi')
      }
    } catch (error) {
      toast.error('Không thể thực hiện thao tác')
    }
  }


  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white">Đang tải...</div>
      </div>
    )
  }

  if (!streamData) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white">Không tìm thấy stream</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="container mx-auto px-4 py-4">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Video Player */}
          <div className="lg:col-span-3">
            <div className="space-y-4">
              {/* Video */}
              <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
                <video
                  ref={videoRef}
                  className="w-full h-full"
                  controls
                  muted={isMuted}
                  playsInline
                  autoPlay={false}
                >
                  Your browser does not support the video tag.
                </video>
                
                {streamData.isLive && (
                  <Badge className="absolute top-4 left-4 bg-red-500">
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse mr-1" />
                    LIVE
                  </Badge>
                )}

                <div className="absolute bottom-4 right-4 text-white text-sm bg-black/50 px-2 py-1 rounded">
                  <Users className="inline w-4 h-4 mr-1" />
                  {streamData.viewerCount.toLocaleString()}
                </div>
              </div>

              {/* Stream Info */}
              <Card className="bg-gray-800 border-gray-700">
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h1 className="text-2xl font-bold text-white mb-2">
                          {streamData.title}
                        </h1>
                        <p className="text-gray-400 mb-4">
                          {streamData.description}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="outline" className="border-gray-600 text-gray-300">
                            {streamData.category}
                          </Badge>
                          {streamData.tags.map((tag) => (
                            <Badge key={tag} variant="secondary" className="bg-gray-700 text-gray-300">
                              #{tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-gray-600 text-gray-300"
                        >
                          <Share2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-gray-600 text-gray-300"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    <Separator className="bg-gray-700" />

                    {/* Creator Info */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <Avatar className="w-12 h-12">
                          <AvatarImage src={streamData.creator.avatar} />
                          <AvatarFallback className="bg-gradient-to-r from-pink-500 to-violet-500 text-white">
                            {streamData.creator.stageName.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center space-x-2">
                            <h3 className="font-semibold text-white">
                              {streamData.creator.stageName}
                            </h3>
                            {streamData.creator.isVerified && (
                              <Badge className="bg-blue-500 text-white text-xs">
                                ✓
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-400">
                            @{streamData.creator.displayName}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          onClick={handleToggleFollow}
                          className={`${
                            isFollowing
                              ? 'bg-gray-600 hover:bg-gray-700'
                              : 'bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700'
                          }`}
                        >
                          <Heart className={`w-4 h-4 mr-2 ${isFollowing ? 'fill-current' : ''}`} />
                          {isFollowing ? 'Đang theo dõi' : 'Theo dõi'}
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Chat */}
          <div className="lg:col-span-1">
            <StreamChatBox
              streamId={streamId}
              isCreator={isCreator}
              height="600px"
              className="h-full"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
