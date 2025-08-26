export interface StreamResponse {
  id: string | number
  creatorId: number
  title: string
  description: string
  thumbnail?: string
  streamKey: string
  streamUrl?: string
  hlsUrl: string
  isLive: boolean
  isPrivate: boolean
  viewerCount: number
  maxViewers: number
  category: string
  tags: string[]
  quality: string
  startTime: string
  endTime?: string
  duration?: string
  recordingUrl?: string
  chatEnabled: boolean
  donationsEnabled: boolean
  pricePerMinute?: number
  totalDonations: string
  createdAt: string
  updatedAt: string
  creator: {
    id: number
    userId: number
    stageName: string
    bio: string
    tags: string[]
    rating: string
    totalRatings: number
    isVerified: boolean
    isLive: boolean
    streamTitle?: string
    streamThumbnail?: string
    hourlyRate: string
    minBookingDuration: number
    maxConcurrentBookings: number
    currentBookingsCount: number
    totalEarnings: string
    availabilitySchedule: Record<string, any>
    specialties: string[]
    languages: string[]
    bodyType?: string
    height?: number
    weight?: number
    eyeColor?: string
    hairColor?: string
    isAvailableForBooking: boolean
    bookingPrice: string
    subscriptionPrice: string
    createdAt: string
    updatedAt: string
    displayName: string
    avatar?: string
  }
}

export interface StreamsApiResponse {
  success: boolean
  data: {
    streams: StreamResponse[]
    total: number
    limit: number
    offset: number
  }
}

export interface ChatMessage {
  id: string
  streamId: string
  userId: string
  username: string
  displayName: string
  message: string
  type: 'message' | 'gift' | 'tip' | 'system'
  giftType?: string
  amount?: number
  timestamp: string
  createdAt: string
}

export interface StreamStats {
  streamId: string
  viewerCount: number
  totalViews: number
  duration: number
  peakViewers: number
  chatMessages: number
  gifts: number
  totalDonations: number
}

export interface GiftOption {
  id: string
  name: string
  icon: string
  price: number
  animation?: string
  rarity?: 'common' | 'rare' | 'epic' | 'legendary'
}

export interface StreamSettings {
  quality: 'auto' | 'high' | 'medium' | 'low'
  volume: number
  isMuted: boolean
  isFullscreen: boolean
  chatVisible: boolean
  autoQuality: boolean
}
