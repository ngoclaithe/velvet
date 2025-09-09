'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
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

// Mock streams used as fallback/demo data (18+ oriented)
const MOCK_STREAMS: StreamResponse[] = [
  {
    id: 'mock-1',
    creatorId: 1,
    title: 'Late Night Chill (18+)',
    description: 'Relaxing music, adult chat and tips',
    thumbnail: '',
    streamKey: 'mock-1-key',
    hlsUrl: '',
    isLive: true,
    isPrivate: false,
    viewerCount: 342,
    maxViewers: 1200,
    category: 'Adult',
    tags: ['18+', 'chill', 'adult'],
    quality: 'high',
    startTime: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
    chatEnabled: true,
    donationsEnabled: true,
    totalDonations: '0',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    creator: {
      id: 1,
      userId: 1,
      stageName: 'Lina',
      bio: '',
      tags: [],
      rating: '0',
      totalRatings: 0,
      isVerified: true,
      isLive: true,
      streamTitle: 'Late Night Chill (18+)',
      streamThumbnail: '',
      hourlyRate: '0',
      minBookingDuration: 0,
      maxConcurrentBookings: 0,
      currentBookingsCount: 0,
      totalEarnings: '0',
      availabilitySchedule: {},
      specialties: [],
      languages: [],
      isAvailableForBooking: true,
      bookingPrice: '0',
      subscriptionPrice: '0',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      displayName: 'Lina',
      avatar: ''
    },
    // explicit flag used by UI for 18+ badge (not in type)
    
  },
  {
    id: 'mock-2',
    creatorId: 2,
    title: 'Private Show: MaxPlays (18+)',
    description: 'Exclusive adult stream',
    thumbnail: '',
    streamKey: 'mock-2-key',
    hlsUrl: '',
    isLive: true,
    isPrivate: false,
    viewerCount: 1289,
    maxViewers: 5000,
    category: 'Adult',
    tags: ['18+', 'private'],
    quality: 'high',
    startTime: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    chatEnabled: true,
    donationsEnabled: true,
    totalDonations: '0',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    creator: {
      id: 2,
      userId: 2,
      stageName: 'MaxPlays',
      bio: '',
      tags: [],
      rating: '0',
      totalRatings: 0,
      isVerified: false,
      isLive: true,
      streamTitle: 'Private Show: MaxPlays (18+)',
      streamThumbnail: '',
      hourlyRate: '0',
      minBookingDuration: 0,
      maxConcurrentBookings: 0,
      currentBookingsCount: 0,
      totalEarnings: '0',
      availabilitySchedule: {},
      specialties: [],
      languages: [],
      isAvailableForBooking: true,
      bookingPrice: '0',
      subscriptionPrice: '0',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      displayName: 'Max',
      avatar: ''
    },
    
  },
  {
    id: 'mock-3',
    creatorId: 3,
    title: 'Cooking with Mai',
    description: 'Easy recipes and tips',
    thumbnail: '',
    streamKey: 'mock-3-key',
    hlsUrl: '',
    isLive: false,
    isPrivate: false,
    viewerCount: 56,
    maxViewers: 120,
    category: 'Cooking',
    tags: ['cooking', 'food'],
    quality: 'high',
    startTime: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    chatEnabled: true,
    donationsEnabled: true,
    totalDonations: '0',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    creator: {
      id: 3,
      userId: 3,
      stageName: 'ChefMai',
      bio: '',
      tags: [],
      rating: '0',
      totalRatings: 0,
      isVerified: false,
      isLive: false,
      streamTitle: 'Cooking with Mai',
      streamThumbnail: '',
      hourlyRate: '0',
      minBookingDuration: 0,
      maxConcurrentBookings: 0,
      currentBookingsCount: 0,
      totalEarnings: '0',
      availabilitySchedule: {},
      specialties: [],
      languages: [],
      isAvailableForBooking: true,
      bookingPrice: '0',
      subscriptionPrice: '0',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      displayName: 'Mai',
      avatar: ''
    },
    
  }
]

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
  const THUMBNAILS = [
    'https://stat.avstatic.com/cdn1/contents/videos_screenshots/94000/94900/preview.jpg',
    'https://pbs.twimg.com/media/G0Wf897XMAAzL22.jpg',
    'https://pbs.twimg.com/media/G0Ur9TEakAAsVnp?format=jpg&name=large',
  ]

  useEffect(() => {
    const fetchLiveStreams = async () => {
      try {
        setIsLoading(true)
        const response = await streamApi.getLiveStreams()

        // Prefer API data when available, otherwise fall back to mock data
        if (response && response.success && response.data) {
          const data = response.data as StreamsApiResponse['data']
          if (data && Array.isArray(data.streams) && data.streams.length > 0) {
            setLiveStreams(data.streams.slice(0, 6))
          } else {
            setLiveStreams(MOCK_STREAMS.slice(0, 6))
          }
        } else {
          setLiveStreams(MOCK_STREAMS.slice(0, 6))
        }
      } catch (error) {
        console.error('Error fetching live streams:', error)
        setLiveStreams(MOCK_STREAMS.slice(0, 6))
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
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="bg-gray-800 border-gray-700 animate-pulse">
              <div className="aspect-[8/9] sm:aspect-video bg-gray-700 rounded-t-lg" />
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
        </div>
        <div className="mt-2 sm:mt-0">
          <Button asChild variant="outline" size="sm">
            <Link href="/streams">Xem tất cả</Link>
          </Button>
        </div>
      </div>

      {liveStreams.length === 0 ? (
        <div className="text-center py-8 sm:py-12">
          <Video className="w-12 h-12 sm:w-16 sm:h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg sm:text-xl font-semibold text-white mb-2">Chưa có stream nào đang live</h3>
          <p className="text-gray-400 text-sm sm:text-base">Hãy quay lại sau để xem các creator yêu thích!</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {liveStreams.map((stream, idx) => (
              <Link key={stream.id} href={`/watch/${stream.id}`}>
                <Card className="bg-gray-800 border-gray-700 hover:border-red-500/50 transition-colors cursor-pointer group">
                  <div className="relative aspect-[3/5] sm:aspect-[3/4] lg:aspect-[9/8] overflow-hidden rounded-t-lg">
                    <img src={stream.thumbnail || stream.creator?.streamThumbnail || THUMBNAILS[idx % THUMBNAILS.length]} alt={stream.title} className="w-full h-full object-cover" />

                    <div className="absolute inset-0 bg-black/10 transition-colors" />

                    <div className="absolute bottom-3 left-3 z-20">
                      <div className="bg-black/60 text-white px-3 py-1 rounded-md font-semibold text-sm">
                        {stream.creator?.stageName || stream.creator?.displayName || 'Unknown'}
                      </div>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>

        </>
      )}
    </div>
  )
}

export default function HomePage() {
  const { user, isAuthenticated, isGuest } = useAuth()
  const searchParams = useSearchParams()
  const defaultTab = (searchParams?.get('tab') as string) || 'livestream'

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Main Content */}
      <section className="py-3 sm:py-6 bg-gray-900">
        <div className="container mx-auto px-3">
          <Tabs defaultValue={defaultTab} key={defaultTab} className="w-full">
            <div className="flex flex-col gap-4 sm:gap-6">

              {/* Main Content */}
              <div className="flex-1">
                <TabsList className="grid w-full grid-cols-3 sm:grid-cols-3 mb-2 bg-gray-800 border-gray-700 gap-0.5">
                  <TabsTrigger value="livestream" className="flex items-center gap-1 sm:gap-2 text-sm sm:text-base text-gray-300 data-[state=active]:text-white data-[state=active]:bg-gray-700 px-1 sm:px-3">
                    <Zap className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span>Live</span>
                  </TabsTrigger>
                  <TabsTrigger value="newsfeed" className="flex items-center gap-1 sm:gap-2 text-sm sm:text-base text-gray-300 data-[state=active]:text-white data-[state=active]:bg-gray-700 px-1 sm:px-3">
                    <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="inline">Bảng tin</span>
                  </TabsTrigger>
                  <TabsTrigger value="creators" className="flex items-center gap-1 sm:gap-2 text-sm sm:text-base text-gray-300 data-[state=active]:text-white data-[state=active]:bg-gray-700 px-1 sm:px-3">
                    <Users className="w-3 h-3 sm:w-4 sm:h-4" />
                    Creator
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="livestream" className="space-y-4 pt-2">
                  <LiveStreamsTab />
                </TabsContent>

                <TabsContent value="newsfeed">
                  <NewsFeed />
                </TabsContent>


                <TabsContent value="creators">
                  <CreatorList />
                </TabsContent>


              </div>
            </div>
          </Tabs>
        </div>
      </section>

    </div>
  )
}
