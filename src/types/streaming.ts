import type { CreatorProfile } from './user'

export interface StreamQuality {
  resolution: '720p' | '1080p' | '4K'
  bitrate: number
  fps: number
}

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

export interface StreamResponse {
  id: string
  streamKey: string
  socketEndpoint: string
  title: string
  isLive: boolean
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

export type ViewerRole = 'viewer' | 'subscriber' | 'moderator' | 'vip' | 'streamer'

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

export interface StreamSocketEvents {
  // Creator events
  'start_streaming': {
    streamId: string
    streamKey: string
  }
  'stop_streaming': {
    streamId: string
  }
  'video_data': {
    streamId: string
    data: ArrayBuffer
    timestamp: number
  }
  'audio_data': {
    streamId: string
    data: ArrayBuffer
    timestamp: number
  }
  
  // Viewer events
  'join_room_stream': {
    roomId: string
    userId: string
    username: string
    userType: ViewerRole
  }
  'leave_room_stream': {
    roomId: string
  }
  
  // Server responses
  'stream_started': {
    streamId: string
    success: boolean
  }
  'stream_stopped': {
    streamId: string
    success: boolean
  }
  'room_joined': {
    roomId: string
    viewerCount: number
    timestamp: number
  }
  'user_joined': {
    userId: string
    username: string
    userType: ViewerRole
    timestamp: number
  }
  'user_left': {
    userId: string
    username: string
    timestamp: number
  }
  'viewer_count_updated': {
    count: number
  }
  'error': {
    message: string
  }
}
