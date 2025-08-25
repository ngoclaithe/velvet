'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  Users,
  Eye,
  Play,
  Heart,
  Share2,
  Volume2,
  VolumeX
} from 'lucide-react'

interface LiveStreamPreviewProps {
  streamId: string
  title: string
  creatorName: string
  creatorAvatar?: string
  viewerCount: number
  thumbnail?: string
  category?: string
  tags?: string[]
}

export function LiveStreamPreview({
  streamId,
  title,
  creatorName,
  creatorAvatar,
  viewerCount,
  thumbnail,
  category,
  tags = []
}: LiveStreamPreviewProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [isMuted, setIsMuted] = useState(true)

  const handleMuteToggle = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsMuted(!isMuted)
  }

  const handleLike = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    // TODO: Implement like functionality
  }

  const handleShare = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const url = `${window.location.origin}/watch/${streamId}`
    navigator.clipboard.writeText(url)
  }

  return (
    <Card 
      className="overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Link href={`/watch/${streamId}`}>
        {/* Video Preview Area */}
        <div className="relative aspect-video overflow-hidden bg-gradient-to-br from-purple-500 to-blue-600">
          {/* Thumbnail/Video Preview */}
          {thumbnail ? (
            <img 
              src={thumbnail} 
              alt={title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white">
              <Play className="w-16 h-16 opacity-70" />
            </div>
          )}

          {/* Live Badge */}
          <div className="absolute top-3 left-3">
            <Badge className="bg-red-500 hover:bg-red-600 text-white font-bold">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse mr-2" />
              LIVE
            </Badge>
          </div>

          {/* Viewer Count */}
          <div className="absolute top-3 right-3">
            <Badge variant="secondary" className="bg-black/70 text-white backdrop-blur-sm">
              <Eye className="w-3 h-3 mr-1" />
              {viewerCount.toLocaleString()}
            </Badge>
          </div>

          {/* Hover Controls */}
          {isHovered && (
            <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
              <div className="flex items-center space-x-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleMuteToggle}
                  className="text-white hover:bg-white/20 backdrop-blur-sm"
                >
                  {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                </Button>
                
                <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <Play className="w-6 h-6 text-white ml-1" />
                </div>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLike}
                  className="text-white hover:bg-white/20 backdrop-blur-sm"
                >
                  <Heart className="w-5 h-5" />
                </Button>
              </div>
            </div>
          )}

          {/* Mini Progress Bar (simulated) */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/30">
            <div className="h-full bg-red-500 animate-pulse" style={{ width: '60%' }} />
          </div>
        </div>

        {/* Stream Info */}
        <CardContent className="p-4">
          <div className="space-y-3">
            {/* Creator Info */}
            <div className="flex items-center space-x-3">
              <Avatar className="w-10 h-10">
                <AvatarImage src={creatorAvatar} alt={creatorName} />
                <AvatarFallback className="bg-gradient-to-r from-purple-600 to-blue-600 text-white">
                  {creatorName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm line-clamp-2 group-hover:text-primary transition-colors">
                  {title}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {creatorName}
                </p>
              </div>
            </div>

            {/* Category & Stats */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {category && (
                  <Badge variant="outline" className="text-xs">
                    {category}
                  </Badge>
                )}
                <div className="flex items-center text-xs text-muted-foreground">
                  <Users className="w-3 h-3 mr-1" />
                  {viewerCount} viewers
                </div>
              </div>

              <Button 
                variant="ghost" 
                size="sm"
                onClick={handleShare}
                className="h-8 w-8 p-0"
              >
                <Share2 className="w-4 h-4" />
              </Button>
            </div>

            {/* Tags */}
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {tags.slice(0, 3).map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    #{tag}
                  </Badge>
                ))}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center space-x-2 pt-2">
              <Button 
                size="sm" 
                className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              >
                <Play className="w-4 h-4 mr-2" />
                Xem ngay
              </Button>
              
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleLike}
                className="px-3"
              >
                <Heart className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Link>
    </Card>
  )
}

export default LiveStreamPreview
