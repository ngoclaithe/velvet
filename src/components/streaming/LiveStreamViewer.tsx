'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { toast } from 'react-hot-toast'
import { getSocketService } from '@/lib/socket'
import {
  Heart,
  MessageCircle,
  Share2,
  Users,
  Volume2,
  VolumeX,
  Maximize,
  Settings,
  Gift,
  ThumbsUp,
  Eye
} from 'lucide-react'

interface LiveStreamViewerProps {
  streamId: string
  streamTitle?: string
  creatorName?: string
  creatorAvatar?: string
  isLive?: boolean
}

interface StreamData {
  hlsUrl?: string
  masterUrl?: string
  qualities?: Array<{
    resolution: string
    url: string
  }>
}

export function LiveStreamViewer({ 
  streamId, 
  streamTitle = "Live Stream", 
  creatorName = "Creator",
  creatorAvatar,
  isLive = false 
}: LiveStreamViewerProps) {
  const [isConnected, setIsConnected] = useState(false)
  const [streamData, setStreamData] = useState<StreamData | null>(null)
  const [viewerCount, setViewerCount] = useState(0)
  const [isMuted, setIsMuted] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [selectedQuality, setSelectedQuality] = useState('1080p')
  const [isLoading, setIsLoading] = useState(true)
  
  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const socketService = getSocketService()

  useEffect(() => {
    initializeViewer()
    return () => {
      cleanup()
    }
  }, [streamId])

  const initializeViewer = async () => {
    try {
      console.log(`Initializing viewer for stream ${streamId}`)
      setIsLoading(true)

      // Connect to socket with viewer config
      await socketService.connect({
        accessCode: streamId,
        clientType: 'viewer',
        streamId: streamId
      })

      setupSocketEventListeners()
      setIsConnected(true)
      
      console.log(`Viewer connected to stream ${streamId}`)
    } catch (error) {
      console.error('Error initializing viewer:', error)
      toast.error('Không thể kết nối đến stream')
      setIsLoading(false)
    }
  }

  const setupSocketEventListeners = () => {
    // Listen for stream live event with HLS URLs
    socketService.onStreamLive((data: any) => {
      console.log('Stream is live, received data:', data)
      
      if (data.hlsUrl || data.masterUrl) {
        setStreamData({
          hlsUrl: data.hlsUrl,
          masterUrl: data.masterUrl,
          qualities: data.qualities || []
        })
        
        // Load video stream
        loadVideoStream(data.hlsUrl || data.masterUrl)
        setIsLoading(false)
        toast.success('Stream đã bắt đầu! 🎉')
      }
    })

    // Listen for viewer count updates
    socketService.onViewerCountUpdated((data: { count: number }) => {
      setViewerCount(data.count)
    })

    // Listen for stream ended
    socketService.onStreamEnded((data: any) => {
      console.log('Stream ended:', data.reason)
      setStreamData(null)
      setIsLoading(false)
      toast('Stream đã kết thúc', { icon: '👋' })
      
      if (videoRef.current) {
        videoRef.current.src = ''
      }
    })

    // Listen for room joined confirmation
    socketService.onRoomJoined((data: any) => {
      console.log('Joined stream room as viewer:', data)
      setViewerCount(data.viewerCount || 0)
      
      if (data.streamStarted && !streamData) {
        // Stream is already live, request current stream URL
        console.log('Stream already started, waiting for stream_live event...')
      }
      
      setIsLoading(false)
    })

    socketService.on('connect', () => {
      setIsConnected(true)
    })

    socketService.on('disconnect', () => {
      setIsConnected(false)
      setStreamData(null)
    })
  }

  const loadVideoStream = (url: string) => {
    if (!videoRef.current) return

    try {
      console.log('Loading video stream:', url)
      
      // Check if HLS is supported
      if (videoRef.current.canPlayType('application/vnd.apple.mpegurl')) {
        videoRef.current.src = url
      } else {
        // Try to load with HLS.js if available
        if (typeof window !== 'undefined' && (window as any).Hls) {
          const Hls = (window as any).Hls
          if (Hls.isSupported()) {
            const hls = new Hls({
              enableWorker: true,
              lowLatencyMode: true,
              backBufferLength: 90
            })
            hls.loadSource(url)
            hls.attachMedia(videoRef.current)
            hls.on(Hls.Events.MANIFEST_PARSED, () => {
              console.log('HLS manifest parsed, starting playback')
              videoRef.current?.play()
            })
          }
        } else {
          // Fallback to direct URL
          videoRef.current.src = url
        }
      }

      videoRef.current.addEventListener('loadedmetadata', () => {
        videoRef.current?.play()
      })

    } catch (error) {
      console.error('Error loading video stream:', error)
      toast.error('Không thể tải stream')
    }
  }

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted
      setIsMuted(videoRef.current.muted)
    }
  }

  const toggleFullscreen = () => {
    if (!containerRef.current) return

    try {
      if (!isFullscreen) {
        if (containerRef.current.requestFullscreen) {
          containerRef.current.requestFullscreen()
        }
      } else {
        if (document.exitFullscreen) {
          document.exitFullscreen()
        }
      }
    } catch (error) {
      console.error('Fullscreen error:', error)
    }
  }

  const changeQuality = (quality: string) => {
    if (!streamData?.qualities) return
    
    const qualityOption = streamData.qualities.find(q => q.resolution === quality)
    if (qualityOption && videoRef.current) {
      const currentTime = videoRef.current.currentTime
      setSelectedQuality(quality)
      loadVideoStream(qualityOption.url)
      
      // Try to resume from same time
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.currentTime = currentTime
        }
      }, 1000)
    }
  }

  const sendLike = () => {
    // TODO: Implement like functionality
    toast.success('❤️ Đã gửi like!')
  }

  const sendGift = () => {
    // TODO: Implement gift functionality  
    toast.success('🎁 Tính năng quà tặng sẽ sớm có!')
  }

  const shareStream = () => {
    const url = `${window.location.origin}/watch/${streamId}`
    navigator.clipboard.writeText(url)
    toast.success('📋 Đã sao chép link stream!')
  }

  const cleanup = () => {
    if (socketService.getIsConnected()) {
      socketService.stopStreaming(streamId)
      socketService.disconnect()
    }
    
    if (videoRef.current) {
      videoRef.current.src = ''
    }
  }

  // Handle fullscreen change
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  return (
    <div className="w-full">
      {/* Video Player */}
      <div ref={containerRef} className="relative bg-black rounded-xl overflow-hidden shadow-2xl">
        {/* Video Element */}
        <video
          ref={videoRef}
          className="w-full aspect-video"
          autoPlay
          playsInline
          muted={isMuted}
          controls={false}
          style={{ backgroundColor: '#000' }}
        />

        {/* Loading State */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80">
            <div className="text-center text-white">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
              <p className="text-lg">Đang kết nối đến stream...</p>
              <p className="text-sm text-gray-300">Vui lòng chờ trong giây lát</p>
            </div>
          </div>
        )}

        {/* No Stream State */}
        {!isLoading && !streamData && (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800">
            <div className="text-center text-white">
              <div className="text-6xl mb-4">📺</div>
              <p className="text-xl mb-2">Stream chưa bắt đầu</p>
              <p className="text-gray-300">Creator sẽ live sớm thôi!</p>
            </div>
          </div>
        )}

        {/* Live Indicator */}
        {streamData && (
          <div className="absolute top-4 left-4">
            <Badge className="bg-red-500 hover:bg-red-600 text-white font-bold">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse mr-2" />
              LIVE
            </Badge>
          </div>
        )}

        {/* Viewer Count */}
        {streamData && (
          <div className="absolute top-4 right-4">
            <Badge variant="secondary" className="bg-black/70 text-white">
              <Eye className="w-3 h-3 mr-1" />
              {viewerCount.toLocaleString()}
            </Badge>
          </div>
        )}

        {/* Video Controls */}
        {streamData && (
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleMute}
                  className="text-white hover:bg-white/20"
                >
                  {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </Button>

                {/* Quality Selector */}
                {streamData.qualities && streamData.qualities.length > 0 && (
                  <select
                    value={selectedQuality}
                    onChange={(e) => changeQuality(e.target.value)}
                    className="bg-black/50 text-white text-sm rounded px-2 py-1 border border-white/20"
                  >
                    {streamData.qualities.map((quality) => (
                      <option key={quality.resolution} value={quality.resolution}>
                        {quality.resolution}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={sendLike}
                  className="text-white hover:bg-white/20"
                >
                  <Heart className="w-4 h-4" />
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={sendGift}
                  className="text-white hover:bg-white/20"
                >
                  <Gift className="w-4 h-4" />
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={shareStream}
                  className="text-white hover:bg-white/20"
                >
                  <Share2 className="w-4 h-4" />
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleFullscreen}
                  className="text-white hover:bg-white/20"
                >
                  <Maximize className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Stream Info */}
      <Card className="mt-4">
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <Avatar className="h-12 w-12">
                <AvatarImage src={creatorAvatar} alt={creatorName} />
                <AvatarFallback className="bg-gradient-to-r from-purple-600 to-blue-600 text-white">
                  {creatorName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              
              <div>
                <h2 className="text-lg font-semibold">{streamTitle}</h2>
                <p className="text-sm text-muted-foreground">{creatorName}</p>
                {streamData && (
                  <div className="flex items-center space-x-2 mt-1">
                    <Badge variant="outline" className="text-xs">
                      <Users className="w-3 h-3 mr-1" />
                      {viewerCount} viewers
                    </Badge>
                    <Badge className="bg-red-500 text-xs">LIVE</Badge>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" onClick={sendLike}>
                <ThumbsUp className="w-4 h-4 mr-2" />
                Like
              </Button>
              
              <Button variant="outline" size="sm" onClick={shareStream}>
                <Share2 className="w-4 h-4 mr-2" />
                Chia sẻ
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Connection Status */}
      {!isConnected && (
        <Card className="mt-4 border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 text-red-700">
              <div className="w-2 h-2 bg-red-500 rounded-full" />
              <span className="text-sm">Mất kết nối - đang thử kết nối lại...</span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default LiveStreamViewer
