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
            <div className="flex flex-col lg:flex-row gap-4 sm:gap-6">
              {/* Sidebar */}
              <div className="lg:w-80 space-y-3 sm:space-y-4">
                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader className="pb-3 sm:pb-6">
                    <CardTitle className="flex items-center gap-2 text-white text-lg sm:text-xl">
                      <Flame className="w-4 h-4 sm:w-5 sm:h-5 text-orange-500" />
                      Creators nổi
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    {isLoadingCreators ? (
                      <div className="space-y-3">
                        {[...Array(3)].map((_, i) => (
                          <div key={i} className="flex items-center gap-3 p-3 animate-pulse">
                            <div className="w-10 h-10 bg-gray-700 rounded-full" />
                            <div className="flex-1 space-y-2">
                              <div className="h-3 bg-gray-700 rounded w-2/3" />
                              <div className="h-2 bg-gray-700 rounded w-1/2" />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : featuredCreators.length === 0 ? (
                      <div className="text-center py-6">
                        <Users className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                        <p className="text-gray-400 text-sm">Chưa có creators nổi bật</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {featuredCreators.map((creator) => (
                          <Link key={creator.id} href={`/creator/${creator.id}`}>
                            <div className="flex items-center justify-between p-2 sm:p-3 rounded-lg hover:bg-gray-700/50 cursor-pointer transition-colors">
                              <div className="flex items-center gap-3 flex-1 min-w-0">
                                <div className="relative flex-shrink-0">
                                  {creator.user.avatar ? (
                                    <img
                                      src={creator.user.avatar}
                                      alt={creator.stageName}
                                      className="w-9 h-9 sm:w-11 sm:h-11 rounded-full object-cover"
                                    />
                                  ) : (
                                    <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-gradient-to-r from-pink-500 to-violet-500 flex items-center justify-center">
                                      <span className="text-white text-xs sm:text-sm font-bold">
                                        {creator.stageName.charAt(0).toUpperCase()}
                                      </span>
                                    </div>
                                  )}
                                  <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-gray-800 rounded-full"></div>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-1">
                                    <p className="font-medium text-xs sm:text-sm text-white truncate">{creator.stageName}</p>
                                    {creator.isVerified && (
                                      <div className="w-3 h-3 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                                        <span className="text-white text-xs">✓</span>
                                      </div>
                                    )}
                                  </div>
                                  <p className="text-xs text-gray-400">{creator.followersCount} followers • {creator.user?.city || creator.city || ''}</p>
                                  <p className="text-xs text-gray-400 truncate">@{creator.user.username}</p>
                                </div>
                              </div>
                            </div>
                          </Link>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {!isAuthenticated && (
                  <Card className="border-2 border-pink-500/20 bg-gradient-to-br from-pink-900/20 to-purple-900/20 backdrop-blur">
                    <CardContent className="p-4 sm:p-6 text-center">
                      <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 bg-gradient-to-r from-pink-600 to-purple-600 rounded-full flex items-center justify-center">
                        <Heart className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                      </div>
                      <h3 className="text-base sm:text-lg font-semibold mb-2 text-white">Tham gia cộng đồng!</h3>
                      <p className="text-gray-300 text-xs sm:text-sm mb-3 sm:mb-4">
                        Đăng ký để đăng bài, tương tác và khám phá nội dung độc quyền
                      </p>
                      <Link href="/register">
                        <Button className="w-full bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 text-sm">
                          Đăng ký ngay
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                )}

              </div>

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

      {/* CTA Section */}
      {!isAuthenticated && (
        <section className="py-12 sm:py-16 bg-gray-800 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-pink-900/20 via-purple-900/20 to-indigo-900/20"></div>
          <div className="container mx-auto px-4 text-center relative">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 sm:mb-6 text-white">
                Sẵn sàng khám phá?
              </h2>
              <p className="text-base sm:text-lg md:text-xl mb-6 sm:mb-8 text-gray-300 leading-relaxed">
                Tham gia cộng đồng hàng nghìn thành viên đang chia sẻ và khám phá nội dung độc đáo mỗi ngày
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/register">
                  <Button size="lg" className="text-base sm:text-lg px-6 sm:px-8 py-3 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 font-semibold w-full sm:w-auto">
                    <Star className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                    Tạo tài khoản miễn phí
                  </Button>
                </Link>
                <Link href="/login">
                  <Button size="lg" variant="outline" className="text-base sm:text-lg px-6 sm:px-8 py-3 border-gray-600 text-gray-300 hover:bg-gray-700 w-full sm:w-auto">
                    <Users className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                    Đã có tài khoản? Đăng nhập
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
