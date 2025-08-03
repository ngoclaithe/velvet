'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Play, Users, MessageCircle, Gift, Star, Zap } from 'lucide-react'

export default function HomePage() {
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
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 text-white">
        <div className="container mx-auto px-4 py-24">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Welcome to the Future of{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-400">
                Live Streaming
              </span>
            </h1>
            <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto text-white/90">
              Connect with creators, enjoy live content, and be part of an amazing community
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register">
                <Button size="lg" className="text-lg px-8 py-3 bg-white text-purple-600 hover:bg-gray-100">
                  Get Started
                  <Zap className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/stream">
                <Button size="lg" variant="outline" className="text-lg px-8 py-3 border-white text-white hover:bg-white/10">
                  Explore Streams
                  <Play className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Streams */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Live Now</h2>
            <p className="text-muted-foreground text-lg">
              Check out what's happening right now
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredStreams.map((stream) => (
              <Card key={stream.id} className="overflow-hidden hover:shadow-lg transition-shadow">
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
        </div>
      </section>

      {/* Features */}
      <section className="py-16 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Why Choose Our Platform?</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              We provide everything you need for an amazing streaming experience
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
          <h2 className="text-3xl font-bold mb-4">Ready to Start Streaming?</h2>
          <p className="text-xl mb-8 text-primary-foreground/90">
            Join thousands of creators and viewers on our platform
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register">
              <Button size="lg" variant="secondary" className="text-lg px-8 py-3">
                Create Account
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="text-lg px-8 py-3 border-primary-foreground text-primary-foreground hover:bg-primary-foreground/10">
                Sign In
              </Button>
            </Link>
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
                The best place to stream and watch live content.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li><Link href="/stream" className="hover:text-foreground">Browse Streams</Link></li>
                <li><Link href="/categories" className="hover:text-foreground">Categories</Link></li>
                <li><Link href="/creators" className="hover:text-foreground">Top Creators</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li><Link href="/about" className="hover:text-foreground">About</Link></li>
                <li><Link href="/support" className="hover:text-foreground">Support</Link></li>
                <li><Link href="/privacy" className="hover:text-foreground">Privacy</Link></li>
                <li><Link href="/terms" className="hover:text-foreground">Terms</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Resources</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li><Link href="/help" className="hover:text-foreground">Help Center</Link></li>
                <li><Link href="/guidelines" className="hover:text-foreground">Guidelines</Link></li>
                <li><Link href="/api" className="hover:text-foreground">API</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t mt-8 pt-8 text-center text-muted-foreground">
            <p>&copy; 2024 Streaming Platform. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
