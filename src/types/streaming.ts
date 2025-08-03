export interface Stream {
  id: string
  creatorId: string
  creator: CreatorProfile
  title: string
  description?: string
  category: string
  tags: string[]
  thumbnail?: string
  isLive: boolean
  isPrivate: boolean
  viewerCount: number
  totalViewers: number
  duration: number
  quality: StreamQuality[]
  startedAt?: Date
  endedAt?: Date
  createdAt: Date
  updatedAt: Date
}

export interface StreamSettings {
  quality: {
    resolution: '720p' | '1080p' | '4K'
    bitrate: number
    fps: 30 | 60
  }
  audio: {
    enabled: boolean
    bitrate: number
    sampleRate: number
  }
  chat: {
    enabled: boolean
    subscribersOnly: boolean
    slowMode: number
    moderationEnabled: boolean
  }
  recording: {
    enabled: boolean
    autoSave: boolean
    quality: string
  }
}

export interface PrivateShow {
  id: string
  streamId: string
  viewerId: string
  creatorId: string
  rate: number
  duration: number
  status: PrivateShowStatus
  scheduledFor?: Date
  startedAt?: Date
  endedAt?: Date
  totalCost: number
  createdAt: Date
}

export type PrivateShowStatus = 'pending' | 'accepted' | 'rejected' | 'active' | 'completed' | 'cancelled'

export interface StreamViewer {
  id: string
  userId: string
  username: string
  avatar?: string
  role: ViewerRole
  joinedAt: Date
  isMuted: boolean
  isBanned: boolean
}

export type ViewerRole = 'viewer' | 'subscriber' | 'moderator' | 'vip'

export interface StreamAnalytics {
  streamId: string
  date: Date
  peakViewers: number
  averageViewers: number
  totalViewers: number
  viewDuration: number
  chatMessages: number
  tips: number
  gifts: number
  newFollowers: number
  revenue: number
}

export interface StreamCategory {
  id: string
  name: string
  description?: string
  thumbnail?: string
  isActive: boolean
  streamCount: number
}

export interface StreamTag {
  id: string
  name: string
  category?: string
  usageCount: number
}

export interface WebRTCConnection {
  id: string
  streamId: string
  viewerId: string
  status: ConnectionStatus
  quality: string
  latency: number
  createdAt: Date
}

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'failed'

export interface StreamRecording {
  id: string
  streamId: string
  filename: string
  duration: number
  size: number
  quality: string
  url: string
  createdAt: Date
}

export interface StreamStore {
  currentStream: Stream | null
  streams: Stream[]
  categories: StreamCategory[]
  tags: StreamTag[]
  isLoading: boolean
  error: string | null
  
  // Actions
  createStream: (data: CreateStreamData) => Promise<Stream>
  updateStream: (id: string, data: Partial<Stream>) => Promise<void>
  deleteStream: (id: string) => Promise<void>
  startStream: (id: string) => Promise<void>
  endStream: (id: string) => Promise<void>
  joinStream: (id: string) => Promise<void>
  leaveStream: (id: string) => Promise<void>
  bookPrivateShow: (data: BookPrivateShowData) => Promise<PrivateShow>
  updateStreamSettings: (id: string, settings: StreamSettings) => Promise<void>
  getStreamAnalytics: (id: string, period: string) => Promise<StreamAnalytics[]>
}

export interface CreateStreamData {
  title: string
  description?: string
  category: string
  tags: string[]
  isPrivate: boolean
  privateShowRate?: number
  settings: StreamSettings
}

export interface BookPrivateShowData {
  streamId: string
  creatorId: string
  duration: number
  scheduledFor?: Date
  message?: string
}
