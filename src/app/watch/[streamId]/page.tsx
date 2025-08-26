'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import * as Hls from 'hls.js'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { toast } from 'react-hot-toast'
import {
  Heart,
  Users,
  Share2,
  MoreVertical,
  Send,
  Gift,
  Star,
  Crown,
  Gem,
  Volume2,
  VolumeX,
  Settings,
  ArrowLeft,
  Eye,
  MessageCircle
} from 'lucide-react'
import { streamApi, chatApi, paymentApi } from '@/lib/api'
import { useAuth } from '@/hooks/useAuth'

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

interface ChatMessage {
  id: string
  userId: string
  username: string
  displayName: string
  message: string
  timestamp: string
  type: 'message' | 'gift' | 'tip'
  giftType?: string
  amount?: number
}

interface GiftOption {
  id: string
  name: string
  icon: string
  price: number
  animation?: string
}

const giftOptions: GiftOption[] = [
  { id: '1', name: 'Hoa hồng', icon: '🌹', price: 1 },
  { id: '2', name: 'Tim', icon: '❤️', price: 2 },
  { id: '3', name: 'Kem', icon: '🍦', price: 5 },
  { id: '4', name: 'Pizza', icon: '🍕', price: 10 },
  { id: '5', name: 'Xe hơi', icon: '🚗', price: 50 },
  { id: '6', name: 'Nhà', icon: '����', price: 100 },
  { id: '7', name: 'Máy bay', icon: '✈️', price: 500 },
  { id: '8', name: 'Tên lửa', icon: '🚀', price: 1000 }
]

export default function WatchStreamPage() {
  const params = useParams()
  const router = useRouter()
  const { user, isAuthenticated } = useAuth()
  const streamId = params.streamId as string

  const [streamData, setStreamData] = useState<StreamData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [isMuted, setIsMuted] = useState(false)
  const [isFollowing, setIsFollowing] = useState(false)
  const [showGiftDialog, setShowGiftDialog] = useState(false)
  const [selectedGift, setSelectedGift] = useState<GiftOption | null>(null)

  const videoRef = useRef<HTMLVideoElement>(null)
  const chatScrollRef = useRef<HTMLDivElement>(null)
  const hlsRef = useRef<any>(null)

  useEffect(() => {
    const fetchStreamData = async () => {
      try {
        setIsLoading(true)
        const response = await streamApi.getStreamInfo(streamId)
        
        if (response.success && response.data) {
          // Type cast để đảm bảo response.data khớp với StreamData interface
          setStreamData(response.data as StreamData)
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
  }, [streamId, router])

  useEffect(() => {
    const fetchChatMessages = async () => {
      if (!streamData?.chatEnabled) return

      try {
        // TODO: Uncomment when backend is ready
        // const response = await chatApi.getMessages(streamId)
        // if (response.success && response.data) {
        //   setChatMessages(response.data)
        // }

        // Mock data for now
        const mockMessages: ChatMessage[] = [
          {
            id: '1',
            userId: 'user1',
            username: 'viewer1',
            displayName: 'Viewer One',
            message: 'Chào mọi người!',
            timestamp: new Date().toISOString(),
            type: 'message'
          },
          {
            id: '2',
            userId: 'user2',
            username: 'viewer2',
            displayName: 'Viewer Two',
            message: 'Stream hay quá!',
            timestamp: new Date().toISOString(),
            type: 'message'
          }
        ]
        setChatMessages(mockMessages)
      } catch (error) {
        console.error('Error fetching chat messages:', error)
      }
    }

    if (streamId && streamData) {
      fetchChatMessages()
      // TODO: Uncomment when backend is ready
      // const interval = setInterval(fetchChatMessages, 2000)
      // return () => clearInterval(interval)
    }
  }, [streamId, streamData])

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight
    }
  }, [chatMessages])

  // Initialize HLS player
  useEffect(() => {
    const video = videoRef.current
    if (!video || !streamData?.hlsUrl) return

    if (Hls.default && Hls.default.isSupported()) {
      // Clean up existing HLS instance
      if (hlsRef.current) {
        hlsRef.current.destroy()
      }

      const hls = new Hls.default({
        enableWorker: false,
        lowLatencyMode: true,
        backBufferLength: 90
      })

      hlsRef.current = hls
      hls.loadSource(streamData.hlsUrl)
      hls.attachMedia(video)

      hls.on(Hls.default.Events.MANIFEST_PARSED, () => {
        console.log('HLS manifest parsed, playing video')
        video.play().catch(console.error)
      })

      hls.on(Hls.default.Events.ERROR, (event, data) => {
        console.error('HLS error:', data)
        if (data.fatal) {
          switch (data.type) {
            case Hls.default.ErrorTypes.NETWORK_ERROR:
              console.log('Fatal network error encountered, trying to recover')
              hls.startLoad()
              break
            case Hls.default.ErrorTypes.MEDIA_ERROR:
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
    }
    // For Safari which has native HLS support
    else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = streamData.hlsUrl
      video.addEventListener('loadedmetadata', () => {
        video.play().catch(console.error)
      })
    }
    else {
      console.error('This browser does not support HLS')
      toast.error('Trình duyệt không hỗ trợ phát stream')
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy()
        hlsRef.current = null
      }
    }
  }, [streamData?.hlsUrl])

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !isAuthenticated || !user) return

    try {
      // TODO: Uncomment when backend is ready
      // const response = await chatApi.sendMessage(streamId, {
      //   message: newMessage.trim()
      // })

      // if (response.success) {
        setNewMessage('')
        const newMsg: ChatMessage = {
          id: Date.now().toString(),
          userId: user.id,
          username: user.username,
          displayName: user.firstName || user.username,
          message: newMessage.trim(),
          timestamp: new Date().toISOString(),
          type: 'message'
        }
        setChatMessages(prev => [...prev, newMsg])
      // }
    } catch (error) {
      toast.error('Không thể gửi tin nhắn')
    }
  }

  const handleSendGift = async (gift: GiftOption) => {
    if (!isAuthenticated || !user) {
      toast.error('Vui lòng đăng nhập để gửi quà')
      return
    }

    try {
      // TODO: Uncomment when backend is ready
      // const response = await paymentApi.sendGift({
      //   streamId,
      //   giftId: gift.id,
      //   amount: gift.price
      // })

      // if (response.success) {
        toast.success(`Đã gửi ${gift.name} ${gift.icon}`)
        setShowGiftDialog(false)

        const giftMsg: ChatMessage = {
          id: Date.now().toString(),
          userId: user.id,
          username: user.username,
          displayName: user.firstName || user.username,
          message: `Đã gửi ${gift.name} ${gift.icon}`,
          timestamp: new Date().toISOString(),
          type: 'gift',
          giftType: gift.name,
          amount: gift.price
        }
        setChatMessages(prev => [...prev, giftMsg])
      // }
    } catch (error) {
      toast.error('Không thể gửi quà')
    }
  }

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

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString('vi-VN', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
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

          {/* Chat & Gifts */}
          <div className="lg:col-span-1">
            <Card className="bg-gray-800 border-gray-700 h-[600px] flex flex-col">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-white flex items-center space-x-2">
                  <MessageCircle className="w-5 h-5" />
                  <span>Chat trực tiếp</span>
                </CardTitle>
                <div className="flex items-center space-x-2">
                  <Dialog open={showGiftDialog} onOpenChange={setShowGiftDialog}>
                    <DialogTrigger asChild>
                      <Button size="sm" className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600">
                        <Gift className="w-4 h-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-gray-800 border-gray-700">
                      <DialogHeader>
                        <DialogTitle className="text-white">Gửi quà tặng</DialogTitle>
                      </DialogHeader>
                      <div className="grid grid-cols-4 gap-3">
                        {giftOptions.map((gift) => (
                          <div
                            key={gift.id}
                            onClick={() => handleSendGift(gift)}
                            className="p-3 bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-600 transition-colors text-center"
                          >
                            <div className="text-2xl mb-1">{gift.icon}</div>
                            <div className="text-xs text-white">{gift.name}</div>
                            <div className="text-xs text-yellow-400">{gift.price} xu</div>
                          </div>
                        ))}
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>

              <CardContent className="flex-1 flex flex-col p-4 space-y-4">
                {/* Messages */}
                <ScrollArea className="flex-1" ref={chatScrollRef}>
                  <div className="space-y-3">
                    {chatMessages.map((message) => (
                      <div key={message.id} className="text-sm">
                        <div className="flex items-start space-x-2">
                          <Avatar className="w-6 h-6">
                            <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xs">
                              {message.displayName.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center space-x-1">
                              <span className="font-medium text-white text-xs">
                                {message.displayName}
                              </span>
                              <span className="text-gray-500 text-xs">
                                {formatTime(message.timestamp)}
                              </span>
                            </div>
                            <div className={`mt-1 ${
                              message.type === 'gift' 
                                ? 'text-yellow-400 font-medium' 
                                : 'text-gray-300'
                            }`}>
                              {message.message}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>

                {/* Message Input */}
                {streamData.chatEnabled && (
                  <div className="flex space-x-2">
                    <Input
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder={isAuthenticated ? "Nhập tin nhắn..." : "Đăng nhập để chat"}
                      className="flex-1 bg-gray-700 border-gray-600 text-white"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          handleSendMessage()
                        }
                      }}
                      disabled={!isAuthenticated}
                    />
                    <Button 
                      onClick={handleSendMessage}
                      disabled={!newMessage.trim() || !isAuthenticated}
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                )}

                {!isAuthenticated && (
                  <div className="text-center">
                    <p className="text-gray-400 text-sm mb-2">
                      Đăng nhập để tham gia chat
                    </p>
                    <Button size="sm" asChild>
                      <a href="/login">Đăng nhập</a>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
