'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'react-hot-toast'
import {
  Users,
  Eye,
  Search,
  Filter,
  Flame,
  Play,
  Calendar,
  Heart
} from 'lucide-react'
import { streamApi } from '@/lib/api'
import type { StreamResponse } from '@/types/streaming'

interface StreamCard {
  id: string
  title: string
  description: string
  category: string
  tags: string[]
  creator: {
    id: string
    username: string
    stageName: string
    avatar?: string
    isVerified: boolean
  }
  thumbnail?: string
  isLive: boolean
  viewerCount: number
  totalViews: number
  startedAt: string
  duration?: string
}

export default function StreamsPage() {
  const router = useRouter()
  const [streams, setStreams] = useState<StreamCard[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [sortBy, setSortBy] = useState('viewers')

  const categories = [
    { value: 'all', label: 'Tất cả' },
    { value: 'Gaming', label: 'Gaming' },
    { value: 'Music', label: 'Âm nhạc' },
    { value: 'Art', label: 'Nghệ thuật' },
    { value: 'Cooking', label: 'Nấu ăn' },
    { value: 'Technology', label: 'Công nghệ' },
    { value: 'Fitness', label: 'Thể dục' },
    { value: 'Education', label: 'Giáo dục' },
    { value: 'Entertainment', label: 'Giải trí' }
  ]

  const sortOptions = [
    { value: 'viewers', label: 'Số người xem' },
    { value: 'recent', label: 'Mới nhất' },
    { value: 'popular', label: 'Phổ biến' }
  ]

  // Mock data - thay thế bằng API call thực tế
  const mockStreams: StreamCard[] = [
    {
      id: '1',
      title: 'Epic Gaming Session - Boss Battles!',
      description: 'Join me for some intense gaming action as we take on the toughest bosses!',
      category: 'Gaming',
      tags: ['gaming', 'action', 'boss-fights'],
      creator: {
        id: '1',
        username: 'gamer123',
        stageName: 'ProGamer',
        avatar: '/avatars/gamer.jpg',
        isVerified: true
      },
      thumbnail: '/thumbnails/gaming1.jpg',
      isLive: true,
      viewerCount: 1247,
      totalViews: 15420,
      startedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
    },
    {
      id: '2',
      title: 'Cooking Traditional Vietnamese Food',
      description: 'Learning to cook authentic Vietnamese dishes from my grandmother\'s recipes',
      category: 'Cooking',
      tags: ['cooking', 'vietnamese', 'traditional'],
      creator: {
        id: '2',
        username: 'chef_anna',
        stageName: 'Chef Anna',
        avatar: '/avatars/chef.jpg',
        isVerified: false
      },
      thumbnail: '/thumbnails/cooking1.jpg',
      isLive: true,
      viewerCount: 856,
      totalViews: 8930,
      startedAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString()
    },
    {
      id: '3',
      title: 'Live Music Performance - Acoustic Session',
      description: 'Performing my latest songs and taking requests from the audience',
      category: 'Music',
      tags: ['music', 'acoustic', 'live'],
      creator: {
        id: '3',
        username: 'musician_mike',
        stageName: 'Mike Melodies',
        avatar: '/avatars/musician.jpg',
        isVerified: true
      },
      thumbnail: '/thumbnails/music1.jpg',
      isLive: true,
      viewerCount: 2105,
      totalViews: 25670,
      startedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString()
    },
    {
      id: '4',
      title: 'Digital Art Tutorial - Character Design',
      description: 'Step by step tutorial on creating fantasy character designs',
      category: 'Art',
      tags: ['art', 'tutorial', 'digital'],
      creator: {
        id: '4',
        username: 'artist_lily',
        stageName: 'ArtByLily',
        avatar: '/avatars/artist.jpg',
        isVerified: false
      },
      thumbnail: '/thumbnails/art1.jpg',
      isLive: false,
      viewerCount: 0,
      totalViews: 3450,
      startedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    }
  ]

  // Fetch streams
  useEffect(() => {
    const fetchStreams = async () => {
      try {
        setIsLoading(true)
        const apiParams: Record<string, string> = {}

        if (selectedCategory !== 'all') {
          apiParams.category = selectedCategory
        }

        if (searchQuery.trim()) {
          apiParams.search = searchQuery.trim()
        }

        apiParams.sort = sortBy

        const response = await streamApi.getLiveStreams(apiParams)

        if (response.success && response.data && 'streams' in response.data && Array.isArray(response.data.streams)) {
          // Transform API response to match our interface
          const transformedStreams = response.data.streams.map((stream: StreamResponse) => {
            const creator = stream.creator || {}
            const creatorId = creator.id?.toString() || stream.creatorId?.toString() || 'unknown'
            const creatorUsername = creator.displayName || (creator as any).username || 'unknown'
            const creatorStageName = creator.stageName || creator.displayName || 'Unknown Creator'

            return {
              id: stream.id?.toString() || 'unknown',
              title: stream.title || 'Untitled Stream',
              description: stream.description || '',
              category: stream.category || 'General',
              tags: Array.isArray(stream.tags) ? stream.tags : [],
              creator: {
                id: creatorId,
                username: creatorUsername,
                stageName: creatorStageName,
                avatar: creator.avatar || undefined,
                isVerified: Boolean(creator.isVerified)
              },
              thumbnail: stream.thumbnail || undefined,
              isLive: Boolean(stream.isLive),
              viewerCount: Number(stream.viewerCount) || 0,
              totalViews: Number(stream.maxViewers) || 0,
              startedAt: stream.startTime || new Date().toISOString()
            }
          })
          setStreams(transformedStreams)
        } else {
          // Fallback to mock data if API response is invalid
          console.warn('API response does not contain streams array:', response)
          setStreams(mockStreams.filter(stream => {
            const matchesCategory = selectedCategory === 'all' || stream.category === selectedCategory
            const matchesSearch = !searchQuery ||
              stream.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
              stream.creator.stageName.toLowerCase().includes(searchQuery.toLowerCase()) ||
              stream.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
            return matchesCategory && matchesSearch
          }))
        }
      } catch (error) {
        console.error('Error fetching streams:', error)
        // Use mock data on error
        setStreams(mockStreams.filter(stream => {
          const matchesCategory = selectedCategory === 'all' || stream.category === selectedCategory
          const matchesSearch = !searchQuery ||
            stream.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            stream.creator.stageName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            stream.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
          return matchesCategory && matchesSearch
        }))
      } finally {
        setIsLoading(false)
      }
    }

    fetchStreams()
  }, [selectedCategory, searchQuery, sortBy])

  const formatDuration = (startedAt: string) => {
    if (!startedAt) return '0m'

    try {
      const start = new Date(startedAt)
      const now = new Date()
      const diff = now.getTime() - start.getTime()
      const hours = Math.floor(diff / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

      if (hours > 0) {
        return `${hours}h ${minutes}m`
      }
      return `${minutes}m`
    } catch (error) {
      return '0m'
    }
  }

  const handleStreamClick = (streamId: string) => {
    router.push(`/watch/${streamId}`)
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Live Streams</h1>
            <p className="text-muted-foreground">Khám phá các stream đang trực tiếp</p>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="secondary" className="bg-red-500 text-white">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse mr-2" />
              {streams.filter(s => s.isLive).length} LIVE
            </Badge>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Tìm kiếm streams, creators, tags..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Category Filter */}
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Chọn danh mục" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.value} value={category.value}>
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Sort Filter */}
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Sắp xếp theo" />
                </SelectTrigger>
                <SelectContent>
                  {sortOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Loading */}
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <div className="aspect-video bg-muted rounded-t-lg" />
                <CardContent className="p-4">
                  <div className="space-y-2">
                    <div className="h-4 bg-muted rounded w-3/4" />
                    <div className="h-3 bg-muted rounded w-1/2" />
                    <div className="h-3 bg-muted rounded w-2/3" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Streams Grid */}
        {!isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {streams.map((stream) => (
              <Card 
                key={stream.id} 
                className="cursor-pointer hover:shadow-lg transition-shadow group"
                onClick={() => handleStreamClick(stream.id)}
              >
                <div className="relative aspect-video overflow-hidden rounded-t-lg">
                  {/* Thumbnail */}
                  <div className="w-full h-full bg-gradient-to-br from-purple-400 to-blue-600 flex items-center justify-center">
                    <Play className="w-12 h-12 text-white opacity-70 group-hover:opacity-100 transition-opacity" />
                  </div>
                  
                  {/* Live Badge */}
                  {stream.isLive && (
                    <Badge className="absolute top-2 left-2 bg-red-500 hover:bg-red-600">
                      <div className="w-2 h-2 bg-white rounded-full animate-pulse mr-1" />
                      LIVE
                    </Badge>
                  )}

                  {/* Viewer Count */}
                  <div className="absolute bottom-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-sm">
                    <Users className="inline w-3 h-3 mr-1" />
                    {stream.viewerCount.toLocaleString()}
                  </div>

                  {/* Duration */}
                  {stream.isLive && (
                    <div className="absolute bottom-2 left-2 bg-black/70 text-white px-2 py-1 rounded text-sm">
                      {formatDuration(stream.startedAt)}
                    </div>
                  )}
                </div>

                <CardContent className="p-4">
                  <div className="space-y-3">
                    {/* Title */}
                    <h3 className="font-semibold line-clamp-2 group-hover:text-primary transition-colors">
                      {stream.title}
                    </h3>

                    {/* Creator */}
                    <div className="flex items-center space-x-2">
                      <Avatar className="w-6 h-6">
                        <AvatarImage src={stream.creator.avatar || ''} />
                        <AvatarFallback className="text-xs">
                          {stream.creator.stageName.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm text-muted-foreground">
                        {stream.creator.stageName}
                        {stream.creator.isVerified && (
                          <span className="text-blue-500 ml-1">✓</span>
                        )}
                      </span>
                    </div>

                    {/* Category & Stats */}
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <Badge variant="outline" className="text-xs">
                        {stream.category}
                      </Badge>
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center">
                          <Eye className="w-3 h-3 mr-1" />
                          {stream.totalViews.toLocaleString()}
                        </div>
                      </div>
                    </div>

                    {/* Tags */}
                    {stream.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {stream.tags.slice(0, 3).map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            #{tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && streams.length === 0 && (
          <div className="text-center py-12">
            <div className="text-muted-foreground mb-4">
              <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg">Không tìm thấy stream nào</p>
              <p className="text-sm">Thử thay đổi bộ lọc hoặc tìm kiếm khác</p>
            </div>
            <Button variant="outline" onClick={() => {
              setSearchQuery('')
              setSelectedCategory('all')
            }}>
              Xóa bộ lọc
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
