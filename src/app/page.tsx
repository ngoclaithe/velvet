'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import NewsFeed from '@/components/social/NewsFeed'
import CreatorList from '@/components/creators/CreatorList'
import {
  Users,
  Heart,
  Star,
  Edit3,
  UserPlus,
  Crown,
  Flame,
  TrendingUp,
  Sparkles,
  MapPin,
  MessageCircle,
  Video,
  Play,
  Eye,
  Zap
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { streamApi } from '@/lib/api'
import { creatorAPI } from '@/lib/api/creator'
import type { StreamResponse, StreamsApiResponse } from '@/types/streaming'

interface Creator {
  id: number
  userId: number
  stageName: string
  bio: string
  tags: string[]
  rating: string
  totalRatings: number
  isVerified: boolean
  specialties: string[]
  bookingPrice: string | null
  subscriptionPrice: string | null
  followersCount: number
  user: {
    id: number
    username: string
    firstName: string
    lastName: string
    avatar: string | null
    city?: string
  }
  city?: string
}

interface FeaturedCreatorsResponse {
  success: boolean
  data: Creator[]
}

function LiveStreamsTab() {
  const [liveStreams, setLiveStreams] = useState<StreamResponse[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchLiveStreams = async () => {
      try {
        setIsLoading(true)
        const response = await streamApi.getLiveStreams()

        if (response.success && response.data) {
          // Type cast với proper StreamsApiResponse type
          const data = response.data as StreamsApiResponse['data']
          if (data && Array.isArray(data.streams)) {
            setLiveStreams(data.streams.slice(0, 6))
          } else {
            setLiveStreams([])
          }
        } else {
          setLiveStreams([])
        }
      } catch (error) {
        console.error('Error fetching live streams:', error)
        setLiveStreams([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchLiveStreams()
  }, [])

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-3">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">Live Streams</h2>
            <p className="text-gray-400 text-sm sm:text-base">Xem các creator đang stream trực tiếp</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="bg-gray-800 border-gray-700 animate-pulse">
              <div className="aspect-video bg-gray-700 rounded-t-lg" />
              <CardContent className="p-3 sm:p-4">
                <div className="space-y-2">
                  <div className="h-4 bg-gray-700 rounded w-3/4" />
                  <div className="h-3 bg-gray-700 rounded w-1/2" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">Live Streams</h2>
          <p className="text-gray-400 text-sm sm:text-base">Xem các creator đang stream trực tiếp</p>
        </div>
        <Link href="/streams">
          <Button variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-800 w-full sm:w-auto">
            Xem tất cả
          </Button>
        </Link>
      </div>

      {liveStreams.length === 0 ? (
        <div className="text-center py-8 sm:py-12">
          <Video className="w-12 h-12 sm:w-16 sm:h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg sm:text-xl font-semibold text-white mb-2">Chưa có stream nào đang live</h3>
          <p className="text-gray-400 text-sm sm:text-base">Hãy quay lại sau để xem các creator yêu thích!</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {liveStreams.map((stream) => (
              <Link key={stream.id} href={`/watch/${stream.id}`}>
                <Card className="bg-gray-800 border-gray-700 hover:border-red-500/50 transition-colors cursor-pointer group">
                  <div className="relative aspect-video overflow-hidden rounded-t-lg">
                    <div className="w-full h-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center">
                      <Play className="w-8 h-8 sm:w-12 sm:h-12 text-white opacity-70 group-hover:opacity-100 transition-opacity" />
                    </div>

                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />

                    <Badge className="absolute top-2 left-2 bg-red-500 hover:bg-red-600 text-xs">
                      <div className="w-2 h-2 bg-white rounded-full animate-pulse mr-1" />
                      LIVE
                    </Badge>

                    <div className="absolute bottom-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-xs">
                      <Eye className="inline w-3 h-3 mr-1" />
                      {stream.viewerCount?.toLocaleString() || '0'}
                    </div>

                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="w-14 h-14 sm:w-18 sm:h-18 bg-white/20 rounded-full flex items-center justify-center backdrop-blur">
                        <Play className="w-6 h-6 sm:w-8 sm:h-8 text-white ml-1" />
                      </div>
                    </div>
                  </div>

                  <CardContent className="p-3 sm:p-4">
                    <h3 className="font-semibold text-white mb-2 line-clamp-2 text-sm sm:text-base">{stream.title}</h3>
                    <div className="flex items-center space-x-2 mb-2">
                      <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-gradient-to-r from-pink-500 to-violet-500 flex items-center justify-center">
                        <span className="text-white text-xs font-bold">
                          {stream.creator?.stageName?.charAt(0) || stream.creator?.displayName?.charAt(0) || 'U'}
                        </span>
                      </div>
                      <span className="text-xs sm:text-sm text-gray-400">
                        {stream.creator?.stageName || stream.creator?.displayName || 'Unknown'}
                      </span>
                    </div>
                    <Badge variant="outline" className="text-xs border-gray-600 text-gray-300">
                      {stream.category || 'General'}
                    </Badge>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          <div className="text-center">
            <Link href="/streams">
              <Button size="lg" className="bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 w-full sm:w-auto">
                <Zap className="w-4 h-4 mr-2" />
                Xem tất cả Live Streams
              </Button>
            </Link>
          </div>
        </>
      )}
    </div>
  )
}

export default function HomePage() {
  const { user, isAuthenticated, isGuest } = useAuth()

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Main Content */}
      <section className="py-3 sm:py-6 bg-gray-900">
        <div className="container mx-auto px-3">
          <Tabs defaultValue="livestream" className="w-full">
            <div className="flex flex-col gap-4 sm:gap-6">

              {/* Main Content */}
              <div className="flex-1">
                <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 mb-3 sm:mb-4 bg-gray-800 border-gray-700 gap-1">
                  <TabsTrigger value="livestream" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm text-gray-300 data-[state=active]:text-white data-[state=active]:bg-gray-700 px-2 sm:px-3">
                    <Zap className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span>Live</span>
                  </TabsTrigger>
                  <TabsTrigger value="newsfeed" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm text-gray-300 data-[state=active]:text-white data-[state=active]:bg-gray-700 px-2 sm:px-3">
                    <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">Bảng tin</span>
                    <span className="sm:hidden">Tin</span>
                  </TabsTrigger>
                  <TabsTrigger value="my-posts" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm text-gray-300 data-[state=active]:text-white data-[state=active]:bg-gray-700 px-2 sm:px-3">
                    <Edit3 className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">Bài viết của tôi</span>
                    <span className="sm:hidden">Của tôi</span>
                  </TabsTrigger>
                  <TabsTrigger value="creators" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm text-gray-300 data-[state=active]:text-white data-[state=active]:bg-gray-700 px-2 sm:px-3">
                    <Users className="w-3 h-3 sm:w-4 sm:h-4" />
                    Creator
                  </TabsTrigger>
                  <TabsTrigger value="chat" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm text-gray-300 data-[state=active]:text-white data-[state=active]:bg-gray-700 px-2 sm:px-3">
                    <MessageCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">Chat</span>
                    <span className="sm:hidden">Chat</span>
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="livestream" className="space-y-4">
                  <LiveStreamsTab />
                </TabsContent>

                <TabsContent value="newsfeed">
                  <NewsFeed />
                </TabsContent>

                <TabsContent value="my-posts" className="space-y-6">
                  <NewsFeed activeTab="my-posts" />
                </TabsContent>

                <TabsContent value="creators">
                  <CreatorList />
                </TabsContent>

                <TabsContent value="chat" className="space-y-6">
                  <div className="text-center py-8 sm:py-12">
                    <MessageCircle className="w-12 h-12 sm:w-16 sm:h-16 text-gray-600 mx-auto mb-4" />
                    <h3 className="text-lg sm:text-xl font-semibold text-white mb-2">Chat 18+ đang được phát triển</h3>
                    <p className="text-gray-400 text-sm sm:text-base">Tính năng chat riêng tư và nhóm chat 18+ sẽ có sớm!</p>
                  </div>
                </TabsContent>

              </div>
            </div>
          </Tabs>
        </div>
      </section>

    </div>
  )
}
