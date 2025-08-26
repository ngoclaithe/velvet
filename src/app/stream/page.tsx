'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'react-hot-toast'
import {
  Users,
  Eye,
  DollarSign,
  Heart,
  MessageCircle,
  Gift,
  Settings,
  Zap,
  Clock,
  Camera,
  Mic,
  MicOff,
  VideoOff,
  Share2,
  Save,
  Play,
  Square
} from 'lucide-react'
import { streamApi } from '@/lib/api'
import { useAuth } from '@/hooks/useAuth'
import type { StreamResponse } from '@/types/streaming'
import StreamingManager from '@/components/streaming/StreamingManager'

interface StreamData {
  title: string
  description: string
  category: string
  tags: string[]
  isPrivate: boolean
}

// Interface cho response từ startStream API
interface StartStreamResponse {
  id: string
  streamKey: string
  socketEndpoint: string
  title: string
  isLive: boolean
}

interface CurrentStream {
  id: string
  title: string
  isLive: boolean
  viewerCount: number
  startedAt: Date
  streamKey?: string
  socketEndpoint?: string
}


export default function StreamPage() {
  const { user, isLoading: authLoading } = useAuth()
  const router = useRouter()
  
  const [currentStream, setCurrentStream] = useState<CurrentStream | null>(null)
  const [isStartingStream, setIsStartingStream] = useState(false)
  const [isStoppingStream, setIsStoppingStream] = useState(false)
  const [cameraEnabled, setCameraEnabled] = useState(true)
  const [micEnabled, setMicEnabled] = useState(true)
  const [isConnected, setIsConnected] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  
  const [streamData, setStreamData] = useState<StreamData>({
    title: '',
    description: '',
    category: 'Gaming',
    tags: [],
    isPrivate: false
  })

  const categories = [
    'Gaming', 'Music', 'Art', 'Cooking', 'Technology', 'Fitness', 'Education', 'Entertainment'
  ]

  // Kiểm tra quyền truy cập
  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'creator')) {
      toast.error('Bạn cần đăng nhập với tài khoản creator để truy cập trang này')
      router.push('/login')
    }
  }, [user, authLoading, router])

  const handleInputChange = (key: keyof StreamData, value: any) => {
    setStreamData(prev => ({ ...prev, [key]: value }))
  }

  const handleTagsChange = (value: string) => {
    const tags = value.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0)
    setStreamData(prev => ({ ...prev, tags }))
  }

  const handleStartStream = async () => {
    console.log('🚀 handleStartStream called')

    if (!streamData.title.trim()) {
      console.log('❌ No stream title provided')
      toast.error('Vui lòng nhập tiêu đề stream')
      return
    }

    console.log('📝 Stream data to send:', streamData)

    setIsStartingStream(true)
    try {
      console.log('🌐 Calling streamApi.startStream...')
      const response = await streamApi.startStream({
        title: streamData.title,
        description: streamData.description,
        category: streamData.category,
        tags: streamData.tags,
        isPrivate: streamData.isPrivate
      })

      console.log('📨 API Response:', response)

      if (response.success && response.data) {
        const apiStreamData = response.data as StartStreamResponse
        console.log('✅ Stream API data:', apiStreamData)

        // Extract stream ID từ socketEndpoint hoặc sử dụng streamKey
        const streamId = apiStreamData.id || apiStreamData.streamKey || apiStreamData.socketEndpoint?.split('/').pop() || ''
        console.log('🆔 Generated stream ID:', streamId)

        const newCurrentStream: CurrentStream = {
          id: streamId,
          title: apiStreamData.title || streamData.title,
          isLive: apiStreamData.isLive || true,
          viewerCount: 0,
          startedAt: new Date(),
          streamKey: apiStreamData.streamKey,
          socketEndpoint: apiStreamData.socketEndpoint
        }

        console.log('📺 Setting currentStream:', newCurrentStream)
        setCurrentStream(newCurrentStream)

        toast.success('Stream đã được bắt đầu thành công!')
      } else {
        console.log('❌ Stream API failed:', response.error)
        toast.error(response.error || 'Không thể bắt đầu stream')
      }
    } catch (error) {
      console.error('💥 Error starting stream:', error)
      toast.error('Có lỗi xảy ra khi bắt đầu stream')
    } finally {
      setIsStartingStream(false)
      console.log('🏁 handleStartStream completed')
    }
  }

  const handleStreamingStatusChange = (connected: boolean) => {
    setIsConnected(connected)
  }

  const handleViewerCountUpdate = (count: number) => {
    if (currentStream) {
      setCurrentStream(prev => prev ? { ...prev, viewerCount: count } : null)
    }
  }

  const handleStopStream = async () => {
    if (!currentStream) return

    setIsStoppingStream(true)
    try {
      const response = await streamApi.stopStream(currentStream.id)

      if (response.success) {
        setCurrentStream(null)
        setIsConnected(false)
        toast.success('Stream đã được kết thúc')
      } else {
        toast.error(response.error || 'Không thể kết thúc stream')
      }
    } catch (error) {
      console.error('Error stopping stream:', error)
      toast.error('Có lỗi xảy ra khi kết thúc stream')
    } finally {
      setIsStoppingStream(false)
    }
  }

  const copyStreamLink = () => {
    if (currentStream) {
      const link = `${window.location.origin}/watch/${currentStream.id}`
      navigator.clipboard.writeText(link)
      toast.success('Link stream đã được sao chép!')
    }
  }

  if (authLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Đang tải...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!user || user.role !== 'creator') {
    return null
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Stream Dashboard</h1>
            <p className="text-muted-foreground">Quản lý stream của bạn (độ trễ ~7 giây)</p>
          </div>
          {currentStream && (
            <Badge variant="default" className="bg-orange-500 hover:bg-orange-600">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse mr-2" />
              STREAMING (DELAY)
            </Badge>
          )}
        </div>

        {/* Stream Controls */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Camera className="w-5 h-5" />
              Điều khiển Stream
            </CardTitle>
            <CardDescription>
              Quản lý thiết bị và stream (độ trễ 5-10 giây)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Button
                  variant={cameraEnabled ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCameraEnabled(!cameraEnabled)}
                  disabled={!!currentStream}
                >
                  {cameraEnabled ? <Camera className="w-4 h-4 mr-2" /> : <VideoOff className="w-4 h-4 mr-2" />}
                  Camera
                </Button>
                <Button
                  variant={micEnabled ? "default" : "outline"}
                  size="sm"
                  onClick={() => setMicEnabled(!micEnabled)}
                  disabled={!!currentStream}
                >
                  {micEnabled ? <Mic className="w-4 h-4 mr-2" /> : <MicOff className="w-4 h-4 mr-2" />}
                  Microphone
                </Button>
                {isConnected && (
                  <Badge variant="default" className="bg-green-500">
                    Recording (Delay ~7s)
                  </Badge>
                )}
                {currentStream && (
                  <Button variant="outline" size="sm" onClick={copyStreamLink}>
                    <Share2 className="w-4 h-4 mr-2" />
                    Chia sẻ
                  </Button>
                )}
              </div>
              <div className="flex items-center space-x-2">
                {!currentStream ? (
                  <Button 
                    onClick={handleStartStream} 
                    disabled={isStartingStream}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    {isStartingStream ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Đang bắt đầu...
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 mr-2" />
                        Bắt đầu Stream
                      </>
                    )}
                  </Button>
                ) : (
                  <Button 
                    onClick={handleStopStream} 
                    disabled={isStoppingStream}
                    variant="destructive"
                  >
                    {isStoppingStream ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Đang dừng...
                      </>
                    ) : (
                      <>
                        <Square className="w-4 h-4 mr-2" />
                        Dừng Stream
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stream Stats */}
        {currentStream && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Người xem</p>
                    <p className="text-2xl font-bold">{currentStream.viewerCount.toLocaleString()}</p>
                  </div>
                  <Users className="w-8 h-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Thời gian stream</p>
                    <p className="text-2xl font-bold">
                      {Math.floor((Date.now() - currentStream.startedAt.getTime()) / 60000)}m
                    </p>
                  </div>
                  <Clock className="w-8 h-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Tin nhắn</p>
                    <p className="text-2xl font-bold">0</p>
                  </div>
                  <MessageCircle className="w-8 h-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Quà tặng</p>
                    <p className="text-2xl font-bold">0</p>
                  </div>
                  <Gift className="w-8 h-8 text-yellow-500" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Streaming Preview & Manager */}
        {currentStream && (
          <Card>
            <CardHeader>
              <CardTitle>Stream Preview</CardTitle>
              <CardDescription>
                Xem trước stream của bạn (viewers sẽ thấy sau ~7 giây)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <StreamingManager
                streamData={{
                  id: currentStream.id,
                  streamKey: currentStream.streamKey || '',
                  socketEndpoint: currentStream.socketEndpoint || '',
                  title: currentStream.title,
                  isLive: currentStream.isLive
                } as StreamingManagerData}
                cameraEnabled={cameraEnabled}
                micEnabled={micEnabled}
                onStatusChange={handleStreamingStatusChange}
                onViewerCountUpdate={handleViewerCountUpdate}
              />
            </CardContent>
          </Card>
        )}

        {/* Stream Settings - Hidden during live stream unless toggled */}
        {(!currentStream || showSettings) && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Cài đặt Stream</CardTitle>
                  <CardDescription>
                    Cấu hình thông tin và cài đặt cho stream của bạn
                  </CardDescription>
                </div>
                {currentStream && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowSettings(false)}
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    Ẩn cài đặt
                  </Button>
                )}
              </div>
            </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Tiêu đề Stream</Label>
                <Input
                  id="title"
                  value={streamData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder="Nhập tiêu đề cho stream"
                  disabled={!!currentStream}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Danh mục</Label>
                <Select 
                  value={streamData.category} 
                  onValueChange={(value) => handleInputChange('category', value)}
                  disabled={!!currentStream}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn danh mục" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Mô tả</Label>
              <Textarea
                id="description"
                value={streamData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Mô tả về nội dung stream của bạn"
                rows={3}
                disabled={!!currentStream}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="tags">Tags (cách nhau bởi dấu phẩy)</Label>
              <Input
                id="tags"
                value={streamData.tags.join(', ')}
                onChange={(e) => handleTagsChange(e.target.value)}
                placeholder="gaming, live, entertainment"
                disabled={!!currentStream}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Stream riêng tư</Label>
                <p className="text-sm text-muted-foreground">
                  Chỉ những người được mời mới có thể xem
                </p>
              </div>
              <Switch
                checked={streamData.isPrivate}
                onCheckedChange={(checked) => handleInputChange('isPrivate', checked)}
                disabled={!!currentStream}
              />
            </div>
            
            {!currentStream && (
              <div className="flex justify-end">
                <Button onClick={handleStartStream} disabled={isStartingStream}>
                  <Save className="w-4 h-4 mr-2" />
                  Lưu & Bắt đầu Stream
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
        )}

        {/* Settings Toggle Button - Only show when live and settings are hidden */}
        {currentStream && !showSettings && (
          <Card className="border-dashed border-2 border-gray-300">
            <CardContent className="p-6">
              <div className="text-center">
                <Button
                  variant="outline"
                  onClick={() => setShowSettings(true)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Hiện cài đặt Stream
                </Button>
                <p className="text-sm text-muted-foreground mt-2">
                  Cài đặt stream đã được ẩn để tập trung vào việc livestream
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
