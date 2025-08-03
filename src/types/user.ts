export interface UserProfile {
  id: string
  username: string
  displayName?: string
  email: string
  avatar?: string
  banner?: string
  bio?: string
  location?: string
  website?: string
  socialLinks: {
    twitter?: string
    instagram?: string
    youtube?: string
    tiktok?: string
  }
  isVerified: boolean
  isOnline: boolean
  lastSeen: Date
  followersCount: number
  followingCount: number
  totalTips: number
  totalGifts: number
  createdAt: Date
  updatedAt: Date
}

export interface CreatorProfile extends UserProfile {
  isLive: boolean
  streamTitle?: string
  category?: string
  tags: string[]
  subscribersCount: number
  totalEarnings: number
  averageViewers: number
  totalStreamTime: number
  streamQuality: StreamQuality[]
  privateShowRate?: number
  isAcceptingPrivateShows: boolean
  schedule?: StreamSchedule[]
}

export interface StreamQuality {
  resolution: '720p' | '1080p' | '4K'
  bitrate: number
  fps: number
}

export interface StreamSchedule {
  dayOfWeek: number
  startTime: string
  endTime: string
  timezone: string
}

export interface UserStats {
  totalWatched: number
  totalSpent: number
  totalTips: number
  totalGifts: number
  favoriteCreators: string[]
  watchHistory: WatchHistoryItem[]
}

export interface WatchHistoryItem {
  streamId: string
  creatorId: string
  creatorUsername: string
  streamTitle: string
  thumbnail?: string
  watchedAt: Date
  duration: number
}

export interface Follow {
  id: string
  followerId: string
  followingId: string
  createdAt: Date
}

export interface Block {
  id: string
  blockerId: string
  blockedId: string
  reason?: string
  createdAt: Date
}

export interface Report {
  id: string
  reporterId: string
  reportedId: string
  type: ReportType
  reason: string
  description?: string
  status: ReportStatus
  createdAt: Date
  resolvedAt?: Date
  resolvedBy?: string
}

export type ReportType = 'harassment' | 'spam' | 'inappropriate_content' | 'copyright' | 'other'
export type ReportStatus = 'pending' | 'reviewed' | 'resolved' | 'dismissed'

export interface UserSettings {
  privacy: {
    showOnlineStatus: boolean
    showLastSeen: boolean
    allowDirectMessages: boolean
    allowFollows: boolean
    showInSearch: boolean
  }
  notifications: {
    email: boolean
    push: boolean
    newFollowers: boolean
    tips: boolean
    gifts: boolean
    streamStart: boolean
    messages: boolean
  }
  streaming: {
    defaultQuality: string
    autoStart: boolean
    chatModeration: boolean
    allowGifts: boolean
    allowTips: boolean
    privateShows: boolean
  }
  appearance: {
    theme: 'light' | 'dark' | 'system'
    language: string
    timezone: string
  }
}
