'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import BlogPost from '@/components/social/BlogPost'
import NewsFeed from '@/components/social/NewsFeed'
import { 
  Users, 
  MessageCircle, 
  Heart, 
  Star, 
  Image as ImageIcon, 
  Video,
  Edit3,
  UserPlus,
  Crown,
  Flame,
  TrendingUp,
  Clock,
  Shield,
  Sparkles
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

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

  const categories = [
    { name: 'Lifestyle', count: 1234, icon: '✨', color: 'from-pink-500 to-rose-500' },
    { name: 'Fashion', count: 987, icon: '👗', color: 'from-purple-500 to-indigo-500' },
    { name: 'Beauty', count: 756, icon: '💄', color: 'from-red-500 to-pink-500' },
    { name: 'Photography', count: 543, icon: '📸', color: 'from-blue-500 to-cyan-500' },
    { name: 'Fitness', count: 432, icon: '💪', color: 'from-green-500 to-emerald-500' },
    { name: 'Art & Design', count: 321, icon: '🎨', color: 'from-yellow-500 to-orange-500' },
  ]

  const features = [
    {
      icon: MessageCircle,
      title: 'Kết nối & Chat',
      description: 'Tương tác trực tiếp với creators yêu thích qua tin nhắn riêng tư và chat groups',
      gradient: 'from-blue-500 to-purple-500'
    },
    {
      icon: ImageIcon,
      title: 'Chia sẻ Nội dung',
      description: 'Đăng ảnh, video, blog và content độc quyền với cộng đồng của bạn',
      gradient: 'from-pink-500 to-red-500'
    },
    {
      icon: Crown,
      title: 'Membership VIP',
      description: 'Truy cập nội dung premium, tính năng độc quyền và ưu đãi đặc biệt',
      gradient: 'from-yellow-500 to-orange-500'
    },
    {
      icon: Shield,
      title: 'An toàn & Riêng tư',
      description: 'Platform được bảo mật cao, kiểm duyệt nghiêm ngặt và bảo vệ quyền riêng tư',
      gradient: 'from-green-500 to-teal-500'
    },
  ]

  const stats = [
    { label: 'Thành viên hoạt động', value: '150K+', icon: Users },
    { label: 'Bài viết mỗi ngày', value: '25K+', icon: Edit3 },
    { label: 'Creators verified', value: '5K+', icon: Star },
    { label: 'Premium content', value: '50K+', icon: Crown },
  ]

  return (
    <div className="min-h-screen">
      {/* Age Verification Banner */}
      <div className="bg-red-600 text-white py-2 text-center text-sm">
        <div className="container mx-auto px-4">
          ⚠️ Trang web chỉ dành cho người trên 18 tuổi. Bằng việc tiếp tục, bạn xác nhận đã đủ tuổi theo quy định pháp luật.
        </div>
      </div>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-pink-900 via-purple-900 to-indigo-900">
          <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-20"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent"></div>
        </div>
        
        <div className="relative container mx-auto px-4 py-16 lg:py-24">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center rounded-full border border-pink-200 bg-pink-50 px-4 py-2 text-sm font-medium text-pink-700 mb-6">
              <Sparkles className="w-4 h-4 mr-2" />
              Cộng đồng adult 18+ hàng đầu Việt Nam
            </div>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6">
              Nơi kết nối{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-purple-400 to-indigo-400">
                không giới hạn
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto">
              Chia sẻ, khám phá và kết nối với những người cùng sở thích trong cộng đồng an toàn và thân thiện
            </p>
            
            {!isAuthenticated && (
              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
                <Link href="/(auth)/register">
                  <Button size="lg" className="text-lg px-8 py-4 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 text-white font-semibold">
                    <UserPlus className="mr-2 h-5 w-5" />
                    Tham gia miễn phí
                  </Button>
                </Link>
                <Button size="lg" variant="outline" className="text-lg px-8 py-4 border-white/20 text-white hover:bg-white/10 backdrop-blur">
                  <Users className="mr-2 h-5 w-5" />
                  Khám phá cộng đồng
                </Button>
              </div>
            )}
            
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="w-12 h-12 mx-auto mb-2 bg-white/10 rounded-full flex items-center justify-center backdrop-blur">
                    <stat.icon className="w-6 h-6 text-pink-300" />
                  </div>
                  <div className="text-2xl font-bold text-white">{stat.value}</div>
                  <div className="text-sm text-gray-300">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-12 bg-background">
        <div className="container mx-auto px-4">
          <Tabs defaultValue="newsfeed" className="w-full">
            <div className="flex flex-col lg:flex-row gap-8">
              {/* Sidebar */}
              <div className="lg:w-80 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Flame className="w-5 h-5 text-orange-500" />
                      Danh mục Hot
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {categories.map((category, index) => (
                      <div key={index} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${category.color} flex items-center justify-center text-lg`}>
                            {category.icon}
                          </div>
                          <div>
                            <p className="font-medium">{category.name}</p>
                            <p className="text-sm text-muted-foreground">{category.count} bài viết</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {!isAuthenticated && (
                  <Card className="border-2 border-pink-200 bg-gradient-to-br from-pink-50 to-purple-50">
                    <CardContent className="p-6 text-center">
                      <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-pink-600 to-purple-600 rounded-full flex items-center justify-center">
                        <Heart className="w-8 h-8 text-white" />
                      </div>
                      <h3 className="text-lg font-semibold mb-2">Tham gia cộng đồng!</h3>
                      <p className="text-muted-foreground text-sm mb-4">
                        Đăng ký để đăng bài, tương tác và khám phá nội dung độc quyền
                      </p>
                      <Link href="/(auth)/register">
                        <Button className="w-full bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700">
                          Đăng ký ngay
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Main Content */}
              <div className="flex-1">
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="newsfeed" className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    Bảng tin
                  </TabsTrigger>
                  <TabsTrigger value="blog" className="flex items-center gap-2">
                    <Edit3 className="w-4 h-4" />
                    Blog & Bài viết
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="newsfeed">
                  <NewsFeed />
                </TabsContent>

                <TabsContent value="blog" className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {blogPosts.map((post) => (
                      <BlogPost key={post.id} post={post} variant="card" />
                    ))}
                  </div>
                  
                  <div className="text-center">
                    <Button variant="outline" size="lg">
                      Xem thêm bài viết
                    </Button>
                  </div>
                </TabsContent>
              </div>
            </div>
          </Tabs>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Tại sao chọn VelvetSocial?</h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              Nền tảng mạng xã hội adult được thiết kế đặc biệt cho cộng đồng người lớn với các tính năng hiện đại và an toàn
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
                  <CardTitle className="text-xl mb-4 group-hover:text-pink-600 transition-colors">{feature.title}</CardTitle>
                  <CardDescription className="text-base leading-relaxed">{feature.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      {!isAuthenticated && (
        <section className="py-20 bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-20"></div>
          <div className="container mx-auto px-4 text-center relative">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                Sẵn sàng khám phá?
              </h2>
              <p className="text-xl md:text-2xl mb-8 text-white/90 leading-relaxed">
                Tham gia cộng đồng hàng nghìn thành viên đang chia sẻ và khám phá nội dung độc đáo mỗi ngày
              </p>
              <div className="flex flex-col sm:flex-row gap-6 justify-center">
                <Link href="/(auth)/register">
                  <Button size="lg" variant="secondary" className="text-lg px-10 py-4 bg-white text-pink-600 hover:bg-gray-100 font-semibold">
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
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
