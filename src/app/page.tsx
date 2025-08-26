'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import BlogPost from '@/components/social/BlogPost'
import NewsFeed from '@/components/social/NewsFeed'
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

function LiveStreamsTab() {
  const [liveStreams, setLiveStreams] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchLiveStreams = async () => {
      try {
        setIsLoading(true)
        const response = await streamApi.getLiveStreams()

        if (response.success && response.data?.streams) {
          setLiveStreams(response.data.streams.slice(0, 6))
        }
      } catch (error) {
        console.error('Error fetching live streams:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchLiveStreams()
  }, [])

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">Live Streams</h2>
            <p className="text-gray-400">Xem các creator đang stream trực tiếp</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="bg-gray-800 border-gray-700 animate-pulse">
              <div className="aspect-video bg-gray-700 rounded-t-lg" />
              <CardContent className="p-4">
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
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Live Streams</h2>
          <p className="text-gray-400">Xem các creator đang stream trực tiếp</p>
        </div>
        <Link href="/streams">
          <Button variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-800">
            Xem tất cả
          </Button>
        </Link>
      </div>

      {liveStreams.length === 0 ? (
        <div className="text-center py-12">
          <Video className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">Chưa có stream nào đang live</h3>
          <p className="text-gray-400">Hãy quay lại sau để xem các creator yêu thích!</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {liveStreams.map((stream) => (
              <Link key={stream.id} href={`/watch/${stream.id}`}>
                <Card className="bg-gray-800 border-gray-700 hover:border-red-500/50 transition-colors cursor-pointer group">
                  <div className="relative aspect-video overflow-hidden rounded-t-lg">
                    <div className="w-full h-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center">
                      <Play className="w-12 h-12 text-white opacity-70 group-hover:opacity-100 transition-opacity" />
                    </div>

                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />

                    <Badge className="absolute top-2 left-2 bg-red-500 hover:bg-red-600">
                      <div className="w-2 h-2 bg-white rounded-full animate-pulse mr-1" />
                      LIVE
                    </Badge>

                    <div className="absolute bottom-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-sm">
                      <Eye className="inline w-3 h-3 mr-1" />
                      {stream.viewerCount?.toLocaleString() || '0'}
                    </div>

                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center backdrop-blur">
                        <Play className="w-8 h-8 text-white ml-1" />
                      </div>
                    </div>
                  </div>

                  <CardContent className="p-4">
                    <h3 className="font-semibold text-white mb-2 line-clamp-2">{stream.title}</h3>
                    <div className="flex items-center space-x-2 mb-2">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-r from-pink-500 to-violet-500 flex items-center justify-center">
                        <span className="text-white text-xs font-bold">
                          {stream.creator?.stageName?.charAt(0) || stream.creator?.displayName?.charAt(0) || 'U'}
                        </span>
                      </div>
                      <span className="text-sm text-gray-400">
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
              <Button size="lg" className="bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700">
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

  const blogPosts = [
    {
      id: '1',
      title: 'Bí quyết chụp ảnh đẹp tại nhà với ánh sáng tự nhiên',
      excerpt: 'Chia sẻ những mẹo hay để có những bức ảnh chất lượng cao ngay tại nhà mà không cần studio đắt tiền...',
      author: {
        id: 'user1',
        username: 'luna_photo',
        displayName: 'Luna Photography',
        avatar: '/api/placeholder/40/40',
        isVerified: true
      },
      category: 'Photography',
      tags: ['photography', 'tips', 'lighting'],
      thumbnail: '/api/placeholder/400/250',
      publishedAt: new Date(Date.now() - 86400000),
      readTime: 5,
      views: 2341,
      likes: 189,
      comments: 23,
      isAdult: false,
      isPremium: false
    },
    {
      id: '2', 
      title: 'Cách xây dựng brand cá nhân trên social media',
      excerpt: 'Từ việc tạo content đến tương tác với audience, mình sẽ chia sẻ journey xây dựng personal brand...',
      author: {
        id: 'user2',
        username: 'angel_brand',
        displayName: 'Angel Branding',
        avatar: '/api/placeholder/40/40',
        isVerified: true
      },
      category: 'Business',
      tags: ['branding', 'social-media', 'marketing'],
      thumbnail: '/api/placeholder/400/250',
      publishedAt: new Date(Date.now() - 172800000),
      readTime: 8,
      views: 1876,
      likes: 145,
      comments: 34,
      isAdult: false,
      isPremium: true
    },
    {
      id: '3',
      title: 'Review bộ sưu tập lingerie mới từ thương hiệu nổi tiếng',
      excerpt: 'Đánh giá chi tiết về chất lượng, design và comfort của bộ sưu tập mới nhất. Có hình ảnh thực tế...',
      author: {
        id: 'user3',
        username: 'ruby_fashion',
        displayName: 'Ruby Fashion',
        avatar: '/api/placeholder/40/40',
        isVerified: false
      },
      category: 'Fashion',
      tags: ['fashion', 'review', 'lingerie'],
      thumbnail: '/api/placeholder/400/250',
      publishedAt: new Date(Date.now() - 259200000),
      readTime: 6,
      views: 3421,
      likes: 298,
      comments: 67,
      isAdult: true,
      isPremium: true
    }
  ]

  const trendingCreators = [
    {
      name: 'Luna Goddess',
      username: 'luna_goddess',
      followers: '125K',
      avatar: '/api/placeholder/40/40',
      isVerified: true,
      isOnline: true,
      specialty: 'Fashion & Beauty'
    },
    {
      name: 'Angel Beauty',
      username: 'angel_beauty',
      followers: '89K',
      avatar: '/api/placeholder/40/40',
      isVerified: true,
      isOnline: false,
      specialty: 'Lifestyle'
    },
    {
      name: 'Ruby Star',
      username: 'ruby_star',
      followers: '156K',
      avatar: '/api/placeholder/40/40',
      isVerified: true,
      isOnline: true,
      specialty: 'Photography'
    },
    {
      name: 'Sakura Dreams',
      username: 'sakura_dreams',
      followers: '203K',
      avatar: '/api/placeholder/40/40',
      isVerified: true,
      isOnline: true,
      specialty: 'Art & Design'
    },
    {
      name: 'Velvet Rose',
      username: 'velvet_rose',
      followers: '78K',
      avatar: '/api/placeholder/40/40',
      isVerified: false,
      isOnline: false,
      specialty: 'Fitness'
    },
    {
      name: 'Diamond Queen',
      username: 'diamond_queen',
      followers: '134K',
      avatar: '/api/placeholder/40/40',
      isVerified: true,
      isOnline: true,
      specialty: 'Fashion'
    },
  ]



  return (
    <div className="min-h-screen bg-gray-900">
      {/* Age Verification Banner */}
      <div className="bg-red-600 text-white py-2 text-center text-sm">
        <div className="container mx-auto px-4">
          ⚠️ Trang web chỉ dành cho người trên 18 tuổi. Bằng việc tiếp tục, bạn xác nhận đã đủ tuổi theo quy định pháp luật.
        </div>
      </div>

      {/* Main Content */}
      <section className="py-8 bg-gray-900">
        <div className="container mx-auto px-4">
          <Tabs defaultValue="newsfeed" className="w-full">
            <div className="flex flex-col lg:flex-row gap-8">
              {/* Sidebar */}
              <div className="lg:w-80 space-y-6">
                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-white">
                      <Flame className="w-5 h-5 text-orange-500" />
                      Creators nổi
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {trendingCreators.map((creator, index) => (
                      <div key={index} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-700/50 cursor-pointer transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <img
                              src={creator.avatar}
                              alt={creator.name}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                            {creator.isOnline && (
                              <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-gray-800 rounded-full"></div>
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-1">
                              <p className="font-medium text-sm text-white">{creator.name}</p>
                              {creator.isVerified && (
                                <div className="w-3 h-3 bg-blue-500 rounded-full flex items-center justify-center">
                                  <span className="text-white text-xs">✓</span>
                                </div>
                              )}
                            </div>
                            <p className="text-xs text-gray-400">{creator.followers} followers</p>
                            <p className="text-xs text-gray-400">{creator.specialty}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {!isAuthenticated && (
                  <Card className="border-2 border-pink-500/20 bg-gradient-to-br from-pink-900/20 to-purple-900/20 backdrop-blur">
                    <CardContent className="p-6 text-center">
                      <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-pink-600 to-purple-600 rounded-full flex items-center justify-center">
                        <Heart className="w-8 h-8 text-white" />
                      </div>
                      <h3 className="text-lg font-semibold mb-2 text-white">Tham gia cộng đồng!</h3>
                      <p className="text-gray-300 text-sm mb-4">
                        Đăng ký để đăng bài, tương tác và khám phá nội dung độc quyền
                      </p>
                      <Link href="/register">
                        <Button className="w-full bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700">
                          Đăng ký ngay
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                )}

                {isAuthenticated && user?.role === 'user' && (
                  <Card className="border-2 border-purple-500/20 bg-gradient-to-br from-purple-900/20 to-blue-900/20 backdrop-blur">
                    <CardContent className="p-6 text-center">
                      <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center">
                        <Video className="w-8 h-8 text-white" />
                      </div>
                      <h3 className="text-lg font-semibold mb-2 text-white">Trở thành Creator!</h3>
                      <p className="text-gray-300 text-sm mb-4">
                        Bắt đầu streaming, kiếm tiền từ nội dung và xây dựng cộng đồng riêng
                      </p>
                      <Link href="/become-creator">
                        <Button className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
                          Bắt đầu ngay
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Main Content */}
              <div className="flex-1">
                <TabsList className="grid w-full grid-cols-6 mb-6 bg-gray-800 border-gray-700">
                  <TabsTrigger value="newsfeed" className="flex items-center gap-2 text-gray-300 data-[state=active]:text-white data-[state=active]:bg-gray-700">
                    <TrendingUp className="w-4 h-4" />
                    Bảng tin
                  </TabsTrigger>
                  <TabsTrigger value="live" className="flex items-center gap-2 text-gray-300 data-[state=active]:text-white data-[state=active]:bg-gray-700">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse mr-1" />
                    Live Streams
                  </TabsTrigger>
                  <TabsTrigger value="blog" className="flex items-center gap-2 text-gray-300 data-[state=active]:text-white data-[state=active]:bg-gray-700">
                    <Edit3 className="w-4 h-4" />
                    Blog & Bài viết
                  </TabsTrigger>
                  <TabsTrigger value="creators" className="flex items-center gap-2 text-gray-300 data-[state=active]:text-white data-[state=active]:bg-gray-700">
                    <MapPin className="w-4 h-4" />
                    Creator theo địa điểm
                  </TabsTrigger>
                  <TabsTrigger value="chat" className="flex items-center gap-2 text-gray-300 data-[state=active]:text-white data-[state=active]:bg-gray-700">
                    <MessageCircle className="w-4 h-4" />
                    Chat 18+
                  </TabsTrigger>
                  <TabsTrigger value="video" className="flex items-center gap-2 text-gray-300 data-[state=active]:text-white data-[state=active]:bg-gray-700">
                    <Video className="w-4 h-4" />
                    Video 18+
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="newsfeed">
                  <NewsFeed />
                </TabsContent>

                <TabsContent value="live" className="space-y-6">
                  <LiveStreamsTab />
                </TabsContent>

                <TabsContent value="blog" className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {blogPosts.map((post) => (
                      <BlogPost key={post.id} post={post} variant="card" />
                    ))}
                  </div>

                  <div className="text-center">
                    <Button variant="outline" size="lg" className="border-gray-600 text-gray-300 hover:bg-gray-800">
                      Xem thêm b��i viết
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent value="creators" className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {trendingCreators.map((creator, index) => (
                      <Card key={index} className="bg-gray-800 border-gray-700 hover:border-pink-500/50 transition-colors">
                        <CardContent className="p-6 text-center">
                          <div className="relative w-20 h-20 mx-auto mb-4">
                            <img
                              src={creator.avatar}
                              alt={creator.name}
                              className="w-full h-full rounded-full object-cover"
                            />
                            {creator.isOnline && (
                              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-gray-800 rounded-full"></div>
                            )}
                          </div>
                          <h3 className="font-semibold text-white mb-1">{creator.name}</h3>
                          <p className="text-gray-400 text-sm mb-2">@{creator.username}</p>
                          <p className="text-gray-300 text-sm mb-3">{creator.specialty}</p>
                          <p className="text-pink-400 text-sm font-medium">{creator.followers} followers</p>
                          <Button size="sm" className="mt-4 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700">
                            Theo dõi
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="chat" className="space-y-6">
                  <div className="text-center py-12">
                    <MessageCircle className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-white mb-2">Chat 18+ đang được phát triển</h3>
                    <p className="text-gray-400">Tính năng chat riêng tư và nhóm chat 18+ sẽ có sớm!</p>
                  </div>
                </TabsContent>

                <TabsContent value="video" className="space-y-6">
                  <div className="text-center py-12">
                    <Video className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-white mb-2">Video 18+ đang được phát triển</h3>
                    <p className="text-gray-400">Kho video 18+ với nội dung độc quyền sẽ có sớm!</p>
                  </div>
                </TabsContent>
              </div>
            </div>
          </Tabs>
        </div>
      </section>



      {/* CTA Section */}
      {!isAuthenticated && (
        <section className="py-16 bg-gray-800 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-pink-900/20 via-purple-900/20 to-indigo-900/20"></div>
          <div className="container mx-auto px-4 text-center relative">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold mb-6 text-white">
                Sẵn sàng khám phá?
              </h2>
              <p className="text-lg md:text-xl mb-8 text-gray-300 leading-relaxed">
                Tham gia cộng đồng hàng nghìn thành viên đang chia sẻ và khám phá nội dung độc đáo mỗi ngày
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/register">
                  <Button size="lg" className="text-lg px-8 py-3 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 font-semibold">
                    <Star className="mr-2 h-5 w-5" />
                    Tạo tài khoản miễn phí
                  </Button>
                </Link>
                <Link href="/login">
                  <Button size="lg" variant="outline" className="text-lg px-8 py-3 border-gray-600 text-gray-300 hover:bg-gray-700">
                    <Users className="mr-2 h-5 w-5" />
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
