'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Slider } from '@/components/ui/slider'
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Settings,
  Users,
  Heart,
  Share2,
  MoreVertical,
  Fullscreen,
  RotateCcw
} from 'lucide-react'

interface StreamPlayerProps {
  streamId: string
  title: string
  creator: string
  viewerCount: number
  isLive: boolean
  thumbnail?: string
  onViewerCountChange?: (count: number) => void
}

export default function StreamPlayer({
  streamId,
  title,
  creator,
  viewerCount,
  isLive,
  thumbnail,
  onViewerCountChange
}: StreamPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [volume, setVolume] = useState([80])
  const [isMuted, setIsMuted] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showControls, setShowControls] = useState(true)
  const [quality, setQuality] = useState('1080p')
  const [isLiked, setIsLiked] = useState(false)
  
  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let timeout: NodeJS.Timeout
    if (showControls) {
      timeout = setTimeout(() => {
        if (isPlaying) {
          setShowControls(false)
        }
      }, 3000)
    }
    return () => clearTimeout(timeout)
  }, [showControls, isPlaying])

  const togglePlay = () => {
    setIsPlaying(!isPlaying)
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause()
      } else {
        videoRef.current.play()
      }
    }
  }

  const toggleMute = () => {
    setIsMuted(!isMuted)
    if (videoRef.current) {
      videoRef.current.muted = !isMuted
    }
  }

  const handleVolumeChange = (value: number[]) => {
    setVolume(value)
    if (videoRef.current) {
      videoRef.current.volume = value[0] / 100
    }
  }

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }

  const handleMouseMove = () => {
    setShowControls(true)
  }

  const qualityOptions = ['4K', '1080p', '720p', '480p', '360p']

  return (
    <div 
      ref={containerRef}
      className="relative aspect-video bg-black rounded-lg overflow-hidden group"
      onMouseMove={handleMouseMove}
      onMouseLeave={() => isPlaying && setShowControls(false)}
    >
      {/* Video Element */}
      <video
        ref={videoRef}
        className="w-full h-full object-cover"
        poster={thumbnail}
        onClick={togglePlay}
      >
        <source src={`/api/stream/${streamId}`} type="video/mp4" />
        Your browser does not support the video tag.
      </video>

      {/* Live Indicator */}
      {isLive && (
        <Badge className="absolute top-4 left-4 bg-red-500 hover:bg-red-600 z-20">
          <div className="w-2 h-2 bg-white rounded-full animate-pulse mr-2" />
          LIVE
        </Badge>
      )}

      {/* Viewer Count */}
      <div className="absolute top-4 right-4 bg-black/70 text-white px-3 py-1 rounded-full text-sm z-20">
        <Users className="inline w-4 h-4 mr-1" />
        {viewerCount.toLocaleString()}
      </div>

      {/* Center Play Button */}
      {!isPlaying && (
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <Button
            size="lg"
            className="rounded-full w-20 h-20 bg-white/20 hover:bg-white/30 backdrop-blur border-2 border-white/50"
            onClick={togglePlay}
          >
            <Play className="w-8 h-8 text-white ml-1" />
          </Button>
        </div>
      )}

      {/* Controls Overlay */}
      <div 
        className={`absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40 transition-opacity duration-300 ${
          showControls ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {/* Top Controls */}
        <div className="absolute top-4 left-4 right-4 flex justify-between items-start z-20">
          <div className="flex-1">
            <h3 className="text-white font-semibold text-lg mb-1 line-clamp-1">{title}</h3>
            <p className="text-white/80 text-sm">@{creator}</p>
          </div>
          <div className="flex items-center space-x-2 ml-4">
            <Button
              size="sm"
              variant="ghost"
              className="text-white hover:bg-white/20"
              onClick={() => setIsLiked(!isLiked)}
            >
              <Heart className={`w-5 h-5 ${isLiked ? 'fill-red-500 text-red-500' : ''}`} />
            </Button>
            <Button size="sm" variant="ghost" className="text-white hover:bg-white/20">
              <Share2 className="w-5 h-5" />
            </Button>
            <Button size="sm" variant="ghost" className="text-white hover:bg-white/20">
              <MoreVertical className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Bottom Controls */}
        <div className="absolute bottom-0 left-0 right-0 p-4 z-20">
          <div className="flex items-center space-x-4">
            {/* Play/Pause */}
            <Button
              size="sm"
              variant="ghost"
              className="text-white hover:bg-white/20"
              onClick={togglePlay}
            >
              {isPlaying ? (
                <Pause className="w-5 h-5" />
              ) : (
                <Play className="w-5 h-5" />
              )}
            </Button>

            {/* Volume */}
            <div className="flex items-center space-x-2">
              <Button
                size="sm"
                variant="ghost"
                className="text-white hover:bg-white/20"
                onClick={toggleMute}
              >
                {isMuted || volume[0] === 0 ? (
                  <VolumeX className="w-5 h-5" />
                ) : (
                  <Volume2 className="w-5 h-5" />
                )}
              </Button>
              <Slider
                value={volume}
                onValueChange={handleVolumeChange}
                max={100}
                step={1}
                className="w-20"
              />
            </div>

            {/* Spacer */}
            <div className="flex-1" />

            {/* Quality Selector */}
            <select
              value={quality}
              onChange={(e) => setQuality(e.target.value)}
              className="bg-black/50 text-white text-sm px-2 py-1 rounded border border-white/20 focus:outline-none focus:border-white/40"
            >
              {qualityOptions.map((q) => (
                <option key={q} value={q} className="bg-black">
                  {q}
                </option>
              ))}
            </select>

            {/* Settings */}
            <Button size="sm" variant="ghost" className="text-white hover:bg-white/20">
              <Settings className="w-5 h-5" />
            </Button>

            {/* Fullscreen */}
            <Button
              size="sm"
              variant="ghost"
              className="text-white hover:bg-white/20"
              onClick={toggleFullscreen}
            >
              <Maximize className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Loading/Buffering Indicator */}
      {isPlaying && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {/* Add spinner here if needed */}
        </div>
      )}
    </div>
  )
}
