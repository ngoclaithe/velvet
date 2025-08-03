'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import StreamCard from '@/components/StreamCard'
import { 
  Play, 
  Users, 
  MessageCircle, 
  Gift, 
  Star, 
  Zap, 
  TrendingUp, 
  Award, 
  Shield, 
  Sparkles, 
  ArrowRight, 
  ChevronRight,
  Eye,
  Heart,
  Clock
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

export default function HomePage() {
  const { user, isAuthenticated, isGuest } = useAuth()

  const featuredStreams = [
    {
      id: '1',
      title: 'Epic Gaming Marathon - Chinh phục Boss cuối!',
      creator: 'sarah_gamer',
      viewers: 12847,
      category: 'Gaming',
      thumbnail: '/api/placeholder/400/225',
      isLive: true,
    },
    {
      id: '2',
      title: 'Live Music Session - Acoustic Cover Songs',
      creator: 'music_mike',
      viewers: 5632,
      category: 'Music',
      thumbnail: '/api/placeholder/400/225',
      isLive: true,
    },
    {
      id: '3',
      title: 'Digital Art Tutorial: Character Design',
      creator: 'artist_anna',
      viewers: 3421,
      category: 'Art',
      thumbnail: '/api/placeholder/400/225',
      isLive: true,
    },
    {
      id: '4',
      title: 'Cooking Show: Vietnamese Street Food',
      creator: 'chef_vietn',
      viewers: 2156,
      category: 'Cooking',
      thumbnail: '/api/placeholder/400/225',
      isLive: true,
    },
    {
      id: '5',
      title: 'Tech Talk: Latest AI Developments',
      creator: 'tech_guru',
      viewers: 1987,
      category: 'Technology',
      thumbnail: '/api/placeholder/400/225',
      isLive: true,
    },
    {
      id: '6',
      title: 'Fitness Live: Morning Yoga Session',
      creator: 'yoga_master',
      viewers: 1543,
      category: 'Fitness',
      thumbnail: '/api/placeholder/400/225',
      isLive: true,
    },
  ]

  const categories = [
    { name: 'Gaming', count: 1234, icon: '🎮', color: 'from-purple-500 to-pink-500' },
    { name: 'Music', count: 867, icon: '🎵', color: 'from-blue-500 to-cyan-500' },
    { name: 'Art', count: 543, icon: '🎨', color: 'from-green-500 to-emerald-500' },
    { name: 'Cooking', count: 432, icon: '👨‍🍳', color: 'from-orange-500 to-red-500' },
    { name: 'Technology', count: 321, icon: '💻', color: 'from-indigo-500 to-purple-500' },
    { name: 'Fitness', count: 234, icon: '💪', color: 'from-teal-500 to-green-500' },
  ]

  const features = [
    {
      icon: Zap,
      title: 'HD Live Streaming',
      description: 'Streaming chất lượng cao với độ trễ thấp và tính năng tương tác thời gian thực',
      gradient: 'from-yellow-500 to-orange-500'
    },
    {
      icon: MessageCircle,
      title: 'Chat Tương Tác',
      description: 'Hệ thống chat thông minh với emoji, sticker và tính năng moderation tự động',
      gradient: 'from-blue-500 to-purple-500'
    },
    {
      icon: Gift,
      title: 'Quà Tặng Ảo',
      description: 'Gửi và nhận quà tặng ảo độc đáo để hỗ trợ các creator yêu thích',
      gradient: 'from-pink-500 to-red-500'
    },
    {
      icon: Shield,
      title: 'An Toàn & Bảo Mật',
      description: 'Hệ thống bảo mật tiên tiến và kiểm duyệt nội dung tự động',
      gradient: 'from-green-500 to-teal-500'
    },
  ]

  const stats = [
    { label: 'Streamers Hoạt Động', value: '50K+', icon: Users },
    { label: 'Giờ Streaming/Tháng', value: '2M+', icon: Clock },
    { label: 'Cộng Đồng', value: '500K+', icon: Heart },
    { label: 'Quốc Gia', value: '100+', icon: Award },
  ]

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
          <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-20"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent"></div>
        </div>
        
        {/* Content */}
        <div className="relative container mx-auto px-4 py-24 lg:py-32">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center rounded-full border border-purple-200 bg-purple-50 px-3 py-1 text-sm font-medium text-purple-700 mb-6">
                <Sparkles className="w-4 h-4 mr-2" />
                Nền tảng streaming mới nhất 2024
              </div>
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6">
                Tương lai của{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400">
                  Live Streaming
                </span>
              </h1>
              <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-2xl">
                Kết nối với hàng triệu người xem, chia sẻ đam mê và kiếm tiền từ nội dung của bạn
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                {isAuthenticated ? (
                  <>
                    <Button size="lg" className="text-lg px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold">
                      <Zap className="mr-2 h-5 w-5" />
                      Bắt đầu Stream
                    </Button>
                    <Button size="lg" variant="outline" className="text-lg px-8 py-4 border-white/20 text-white hover:bg-white/10 backdrop-blur">
                      <Play className="mr-2 h-5 w-5" />
                      Khám phá Nội dung
                    </Button>
                  </>
                ) : (
                  <>
                    <Link href="/(auth)/register">
                      <Button size="lg" className="text-lg px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold">
                        <Zap className="mr-2 h-5 w-5" />
                        Tham gia ngay - Miễn phí
                      </Button>
                    </Link>
                    <Button size="lg" variant="outline" className="text-lg px-8 py-4 border-white/20 text-white hover:bg-white/10 backdrop-blur">
                      <Play className="mr-2 h-5 w-5" />
                      Xem Demo
                    </Button>
                  </>
                )}
              </div>
              
              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-12">
                {stats.map((stat, index) => (
                  <div key={index} className="text-center">
                    <div className="w-12 h-12 mx-auto mb-2 bg-white/10 rounded-full flex items-center justify-center backdrop-blur">
                      <stat.icon className="w-6 h-6 text-purple-300" />
                    </div>
                    <div className="text-2xl font-bold text-white">{stat.value}</div>
                    <div className="text-sm text-gray-300">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Hero Visual */}
            <div className="relative">
              <div className="relative z-10 grid grid-cols-2 gap-4">
                {featuredStreams.slice(0, 4).map((stream, index) => (
                  <div
                    key={stream.id}
                    className={`transform transition-transform hover:scale-105 ${
                      index % 2 === 0 ? 'translate-y-4' : '-translate-y-4'
                    }`}
                  >
                    <StreamCard stream={stream} showWatchButton={false} />
                  </div>
                ))}
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-purple-900/50 to-transparent pointer-events-none"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Khám phá theo Danh mục</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Tìm kiếm nội dung yêu thích của bạn trong hàng trăm danh mục đa dạng
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {categories.map((category, index) => (
              <Card key={index} className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer group">
                <CardContent className="p-6 text-center">
                  <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br ${category.color} flex items-center justify-center text-2xl transition-transform group-hover:scale-110`}>
                    {category.icon}
                  </div>
                  <h3 className="font-semibold mb-2">{category.name}</h3>
                  <p className="text-sm text-muted-foreground">{category.count} streams</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Streams */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">🔥 Đang Hot</h2>
              <p className="text-lg text-muted-foreground">
                Những stream được xem nhiều nhất hiện tại
              </p>
            </div>
            <Button variant="outline" className="hidden md:flex">
              Xem tất cả
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredStreams.map((stream) => (
              <StreamCard key={stream.id} stream={stream} />
            ))}
          </div>
          
          {!isAuthenticated && (
            <div className="text-center mt-12">
              <Card className="max-w-lg mx-auto border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-blue-50">
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center">
                    <MessageCircle className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Tham gia cuộc trò chuyện!</h3>
                  <p className="text-muted-foreground mb-4">
                    Đăng nhập để chat, gửi quà và tương tác với các streamer yêu thích
                  </p>
                  <Link href="/(auth)/login">
                    <Button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
                      Đăng nhập ngay
                      <ChevronRight className="ml-2 w-4 h-4" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </section>

      {/* Features */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Tại sao chọn StreamHub?</h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              Chúng tôi cung cấp công nghệ tiên tiến và tính năng độc đáo để mang đến trải nghiệm streaming tuyệt vời nhất
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="relative overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-2 group">
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-5 transition-opacity`}></div>
                <CardContent className="p-8 text-center relative">
                  <div className={`w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center transition-transform group-hover:scale-110`}>
                    <feature.icon className="h-8 w-8 text-white" />
                  </div>
                  <CardTitle className="text-xl mb-4 group-hover:text-purple-600 transition-colors">{feature.title}</CardTitle>
                  <CardDescription className="text-base leading-relaxed">{feature.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-20"></div>
        <div className="container mx-auto px-4 text-center relative">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              {isAuthenticated ? 'Sẵn sàng tỏa sáng?' : 'Bắt đầu hành trình của bạn'}
            </h2>
            <p className="text-xl md:text-2xl mb-8 text-white/90 leading-relaxed">
              {isAuthenticated
                ? 'Hàng triệu người đang chờ đón nội dung tuyệt vời từ bạn. Hãy bắt đầu streaming ngay hôm nay!'
                : 'Tham gia cùng hàng nghìn creator đang kiếm tiền và xây dựng cộng đồng trên StreamHub'
              }
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              {isAuthenticated ? (
                <>
                  <Button size="lg" variant="secondary" className="text-lg px-10 py-4 bg-white text-purple-600 hover:bg-gray-100 font-semibold">
                    <Zap className="mr-2 h-5 w-5" />
                    Bắt đầu Stream ngay
                  </Button>
                  <Button size="lg" variant="outline" className="text-lg px-10 py-4 border-white/30 text-white hover:bg-white/10 backdrop-blur">
                    <TrendingUp className="mr-2 h-5 w-5" />
                    Xem Analytics
                  </Button>
                </>
              ) : (
                <>
                  <Link href="/(auth)/register">
                    <Button size="lg" variant="secondary" className="text-lg px-10 py-4 bg-white text-purple-600 hover:bg-gray-100 font-semibold">
                      <Star className="mr-2 h-5 w-5" />
                      Tạo tài khoản miễn phí
                    </Button>
                  </Link>
                  <Link href="/(auth)/login">
                    <Button size="lg" variant="outline" className="text-lg px-10 py-4 border-white/30 text-white hover:bg-white/10 backdrop-blur">
                      <Users className="mr-2 h-5 w-5" />
                      Đã có tài khoản? Đăng nhập
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
