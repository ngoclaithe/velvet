'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Icons } from '@/components/common/Icons'
import {
  Eye,
  MessageSquare,
  Ban,
  Search,
  Filter,
  Play,
  Users,
  Clock
} from 'lucide-react'
import { toast } from 'react-hot-toast'

interface Stream {
  id: string
  title: string
  creator: string
  viewers: number
  status: 'live' | 'ended' | 'scheduled'
  category: string
  startTime: string
  duration?: string
  thumbnail?: string
}

export default function StreamsPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [streams, setStreams] = useState<Stream[]>([])

  // Load streams data
  useEffect(() => {
    const loadStreamsData = async () => {
      setIsLoading(true)
      try {
        // Mock API call
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        setStreams([
          {
            id: '1',
            title: 'Gaming Stream - Playing Latest RPG',
            creator: 'streamer1',
            viewers: 245,
            status: 'live',
            category: 'Gaming',
            startTime: '2024-01-20T10:00:00Z'
          },
          {
            id: '2',
            title: 'Music Session - Acoustic Guitar',
            creator: 'musician2',
            viewers: 89,
            status: 'live',
            category: 'Music',
            startTime: '2024-01-20T11:30:00Z'
          },
          {
            id: '3',
            title: 'Cooking Tutorial - Vietnamese Cuisine',
            creator: 'chef123',
            viewers: 0,
            status: 'ended',
            category: 'Lifestyle',
            startTime: '2024-01-19T15:00:00Z',
            duration: '2h 15m'
          },
          {
            id: '4',
            title: 'Art Stream - Digital Painting',
            creator: 'artist456',
            viewers: 0,
            status: 'scheduled',
            category: 'Art',
            startTime: '2024-01-21T14:00:00Z'
          }
        ])
      } catch (error) {
        console.error('Failed to load streams data:', error)
        toast.error('Không thể tải dữ liệu streams')
      } finally {
        setIsLoading(false)
      }
    }

    loadStreamsData()
  }, [])

  const handleStreamAction = async (streamId: string, action: 'view' | 'chat' | 'ban') => {
    try {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 500))
      
      switch (action) {
        case 'ban':
          setStreams(prev => prev.map(s =>
            s.id === streamId
              ? { ...s, status: 'ended' as const }
              : s
          ))
          toast.success('Đã dừng stream thành công')
          break
        case 'view':
          // Open stream viewer
          console.log('Mở stream viewer...')
          break
        case 'chat':
          // Open chat moderator
          console.log('Mở chat moderator...')
          break
      }
    } catch (error) {
      toast.error('Có lỗi xảy ra')
    }
  }

  const getStreamStatusBadge = (status: Stream['status']) => {
    switch (status) {
      case 'live':
        return <Badge className="bg-red-500 animate-pulse">LIVE</Badge>
      case 'ended':
        return <Badge variant="secondary">Đã kết thúc</Badge>
      case 'scheduled':
        return <Badge className="bg-blue-500">Đã lên lịch</Badge>
      default:
        return <Badge variant="secondary">Không xác định</Badge>
    }
  }

  const formatDuration = (startTime: string, endTime?: string) => {
    const start = new Date(startTime)
    const end = endTime ? new Date(endTime) : new Date()
    const diff = end.getTime() - start.getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    return `${hours}h ${minutes}m`
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <Icons.spinner className="h-8 w-8 animate-spin" />
          <span className="ml-2">Đang tải dữ liệu streams...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý Streams</h1>
          <p className="text-gray-600">Theo dõi và quản lý các stream đang diễn ra</p>
        </div>
        
        <div className="flex items-center space-x-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Tìm kiếm streams..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <Button variant="outline">
            <Filter className="w-4 h-4 mr-2" />
            Lọc
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Đang Live</p>
                <p className="text-2xl font-bold">{streams.filter(s => s.status === 'live').length}</p>
              </div>
              <div className="flex items-center space-x-1">
                <div className="h-2 w-2 bg-red-500 rounded-full animate-pulse"></div>
                <Badge className="bg-red-100 text-red-700">Live</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Tổng Viewers</p>
                <p className="text-2xl font-bold">{streams.filter(s => s.status === 'live').reduce((sum, s) => sum + s.viewers, 0)}</p>
              </div>
              <Badge className="bg-blue-100 text-blue-700">
                <Users className="w-3 h-3 mr-1" />
                Online
              </Badge>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Đã lên lịch</p>
                <p className="text-2xl font-bold">{streams.filter(s => s.status === 'scheduled').length}</p>
              </div>
              <Badge className="bg-blue-100 text-blue-700">
                <Clock className="w-3 h-3 mr-1" />
                Scheduled
              </Badge>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Đã kết thúc</p>
                <p className="text-2xl font-bold">{streams.filter(s => s.status === 'ended').length}</p>
              </div>
              <Badge className="bg-gray-100 text-gray-700">Ended</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Danh sách Streams</CardTitle>
          <CardDescription>Quản lý tất cả các stream trong hệ thống</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {streams.map((stream) => (
              <div key={stream.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-12 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
                    <Play className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="font-medium">{stream.title}</p>
                    <p className="text-sm text-muted-foreground">
                      Creator: {stream.creator} • Category: {stream.category}
                    </p>
                    <div className="flex items-center space-x-2 mt-1">
                      {getStreamStatusBadge(stream.status)}
                      {stream.status === 'live' && (
                        <Badge variant="outline">
                          <Users className="w-3 h-3 mr-1" />
                          {stream.viewers} viewers
                        </Badge>
                      )}
                      {stream.duration && (
                        <Badge variant="outline">
                          <Clock className="w-3 h-3 mr-1" />
                          {stream.duration}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {stream.status === 'live' && `Bắt đầu: ${new Date(stream.startTime).toLocaleString('vi-VN')}`}
                      {stream.status === 'ended' && `Kết thúc: ${new Date(stream.startTime).toLocaleString('vi-VN')}`}
                      {stream.status === 'scheduled' && `Lên lịch: ${new Date(stream.startTime).toLocaleString('vi-VN')}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleStreamAction(stream.id, 'view')}
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    Xem
                  </Button>
                  {stream.status === 'live' && (
                    <>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleStreamAction(stream.id, 'chat')}
                      >
                        <MessageSquare className="w-4 h-4 mr-1" />
                        Chat
                      </Button>
                      <Button 
                        size="sm" 
                        variant="destructive"
                        onClick={() => handleStreamAction(stream.id, 'ban')}
                      >
                        <Ban className="w-4 h-4 mr-1" />
                        Dừng
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
