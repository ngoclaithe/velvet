'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Play, Users, MessageCircle, Gift, Star, Zap, LogIn, UserPlus } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

export default function HomePage() {
  const { user, isAuthenticated, isGuest, logout } = useAuth()

  const featuredStreams = [
    {
      id: '1',
      title: 'Gaming Night with Sarah',
      creator: 'sarah_gamer',
      viewers: 1234,
      category: 'Gaming',
      thumbnail: '/api/placeholder/400/225',
      isLive: true,
    },
    {
      id: '2',
      title: 'Music & Chill Session',
      creator: 'music_mike',
      viewers: 856,
      category: 'Music',
      thumbnail: '/api/placeholder/400/225',
      isLive: true,
    },
    {
      id: '3',
      title: 'Art Tutorial: Digital Painting',
      creator: 'artist_anna',
      viewers: 623,
      category: 'Art',
      thumbnail: '/api/placeholder/400/225',
      isLive: true,
    },
  ]

  const features = [
    {
      icon: Play,
      title: 'Live Streaming',
      description: 'Stream in HD quality with real-time interaction',
    },
    {
      icon: MessageCircle,
      title: 'Interactive Chat',
      description: 'Engage with viewers through live chat and reactions',
    },
    {
      icon: Gift,
      title: 'Virtual Gifts',
      description: 'Send and receive virtual gifts to support creators',
    },
    {
      icon: Users,
      title: 'Private Shows',
      description: 'Book exclusive one-on-one sessions with creators',
    },
  ]

  return (
    <div className="min-h-screen">
      {/* Navigation/Auth Bar */}
      <nav className="bg-background border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-xl font-bold">
              Streaming Platform
            </Link>
            <div className="flex items-center gap-4">
              {isAuthenticated ? (
                <>
                  <span className="text-sm">
                    Xin chào, <span className="font-medium">{user?.username}</span>
                  </span>
                  <Button variant="outline" size="sm" onClick={logout}>
                    Đăng xuất
                  </Button>
                </>
              ) : (
                <>
                  <span className="text-sm text-muted-foreground">
                    Đang xem dưới dạng khách - Đăng nhập để đăng bài và bình luận
                  </span>
                  <Link href="/login">
                    <Button variant="outline" size="sm">
                      <LogIn className="w-4 h-4 mr-2" />
                      Đăng nhập
                    </Button>
                  </Link>
                  <Link href="/register">
                    <Button size="sm">
                      <UserPlus className="w-4 h-4 mr-2" />
                      Đăng ký
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 text-white">
        <div className="container mx-auto px-4 py-24">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Chào mừng đến với tương lai của{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-400">
                Live Streaming
              </span>
            </h1>
            <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto text-white/90">
              Kết nối với các streamer, thưởng thức nội dung trực tiếp và tham gia cộng đồng tuyệt vời
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {isAuthenticated ? (
                <>
                  <Button size="lg" className="text-lg px-8 py-3 bg-white text-purple-600 hover:bg-gray-100">
                    Bắt đầu Stream
                    <Zap className="ml-2 h-5 w-5" />
                  </Button>
                  <Button size="lg" variant="outline" className="text-lg px-8 py-3 border-white text-white hover:bg-white/10">
                    Khám phá Streams
                    <Play className="ml-2 h-5 w-5" />
                  </Button>
                </>
              ) : (
                <>
                  <Link href="/register">
                    <Button size="lg" className="text-lg px-8 py-3 bg-white text-purple-600 hover:bg-gray-100">
                      Bắt đầu ngay
                      <Zap className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>
                  <Button size="lg" variant="outline" className="text-lg px-8 py-3 border-white text-white hover:bg-white/10">
                    Khám phá Streams
                    <Play className="ml-2 h-5 w-5" />
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Featured Streams */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Đang Live</h2>
            <p className="text-muted-foreground text-lg">
              Xem những gì đang diễn ra ngay bây giờ
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredStreams.map((stream) => (
              <Card key={stream.id} className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
                <div className="relative">
                  <div className="aspect-video bg-gray-200 relative">
                    {stream.isLive && (
                      <Badge className="absolute top-2 left-2 bg-red-500 hover:bg-red-600">
                        <div className="w-2 h-2 bg-white rounded-full animate-pulse mr-1" />
                        LIVE
                      </Badge>
                    )}
                    <div className="absolute bottom-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-sm">
                      <Users className="inline w-4 h-4 mr-1" />
                      {stream.viewers.toLocaleString()}
                    </div>
                    {/* Play button overlay */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity bg-black/20">
                      <Button size="lg" className="rounded-full">
                        <Play className="w-6 h-6" />
                      </Button>
                    </div>
                  </div>
                </div>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg line-clamp-2">{stream.title}</CardTitle>
                  <div className="flex items-center justify-between">
                    <p className="text-muted-foreground">@{stream.creator}</p>
                    <Badge variant="secondary">{stream.category}</Badge>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
          
          {!isAuthenticated && (
            <div className="text-center mt-8">
              <Card className="max-w-md mx-auto p-6 border-yellow-200 bg-yellow-50">
                <CardContent className="text-center">
                  <MessageCircle className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
                  <p className="text-sm text-yellow-800 mb-3">
                    Đăng nhập để tham gia chat và tương tác với streamer!
                  </p>
                  <Link href="/login">
                    <Button size="sm" className="bg-yellow-600 hover:bg-yellow-700">
                      Đăng nhập ngay
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </section>

      {/* Features */}
      <section className="py-16 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Tại sao chọn nền tảng của chúng tôi?</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Chúng tôi cung cấp mọi thứ bạn cần cho trải nghiệm streaming tuyệt vời
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="text-center p-6">
                <div className="w-12 h-12 mx-auto mb-4 bg-primary/10 rounded-lg flex items-center justify-center">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-xl mb-2">{feature.title}</CardTitle>
                <CardDescription>{feature.description}</CardDescription>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">
            {isAuthenticated ? 'Sẵn sàng bắt đầu Stream?' : 'Sẵn sàng tham gia?'}
          </h2>
          <p className="text-xl mb-8 text-primary-foreground/90">
            {isAuthenticated
              ? 'Bắt đầu streaming và kết nối với khán giả của bạn ngay hôm nay'
              : 'Tham gia cùng hàng nghìn streamer và người xem trên nền tảng của chúng tôi'
            }
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {isAuthenticated ? (
              <>
                <Button size="lg" variant="secondary" className="text-lg px-8 py-3">
                  Bắt đầu Stream
                </Button>
                <Button size="lg" variant="outline" className="text-lg px-8 py-3 border-primary-foreground text-primary-foreground hover:bg-primary-foreground/10">
                  Khám phá thêm
                </Button>
              </>
            ) : (
              <>
                <Link href="/register">
                  <Button size="lg" variant="secondary" className="text-lg px-8 py-3">
                    Tạo tài khoản
                  </Button>
                </Link>
                <Link href="/login">
                  <Button size="lg" variant="outline" className="text-lg px-8 py-3 border-primary-foreground text-primary-foreground hover:bg-primary-foreground/10">
                    Đăng nhập
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-background border-t py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="font-bold text-lg mb-4">Streaming Platform</h3>
              <p className="text-muted-foreground">
                Nơi tốt nhất để stream và xem nội dung trực tiếp.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Sản phẩm</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li><Button variant="link" className="p-0 h-auto text-muted-foreground hover:text-foreground">Duyệt Streams</Button></li>
                <li><Button variant="link" className="p-0 h-auto text-muted-foreground hover:text-foreground">Danh mục</Button></li>
                <li><Button variant="link" className="p-0 h-auto text-muted-foreground hover:text-foreground">Top Streamers</Button></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Công ty</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li><Button variant="link" className="p-0 h-auto text-muted-foreground hover:text-foreground">Về chúng tôi</Button></li>
                <li><Button variant="link" className="p-0 h-auto text-muted-foreground hover:text-foreground">Hỗ trợ</Button></li>
                <li><Button variant="link" className="p-0 h-auto text-muted-foreground hover:text-foreground">Quyền riêng tư</Button></li>
                <li><Button variant="link" className="p-0 h-auto text-muted-foreground hover:text-foreground">Điều khoản</Button></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Tài nguyên</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li><Button variant="link" className="p-0 h-auto text-muted-foreground hover:text-foreground">Trung tâm trợ giúp</Button></li>
                <li><Button variant="link" className="p-0 h-auto text-muted-foreground hover:text-foreground">Hướng dẫn</Button></li>
                <li><Button variant="link" className="p-0 h-auto text-muted-foreground hover:text-foreground">API</Button></li>
              </ul>
            </div>
          </div>
          <div className="border-t mt-8 pt-8 text-center text-muted-foreground">
            <p>&copy; 2024 Streaming Platform. Bản quyền thuộc về chúng tôi.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
