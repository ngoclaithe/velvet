export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
  pagination?: PaginationInfo
}

export interface PaginationInfo {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

export interface ApiError {
  code: string
  message: string
  details?: Record<string, any>
  timestamp: Date
}

export interface UploadResponse {
  url: string
  filename: string
  size: number
  mimeType: string
  width?: number
  height?: number
  duration?: number
}

export interface WalletApiResponse {
  balance: number
  lockedBalance: number
  totalEarnings: number
  monthlyIncome: number
}

export interface RequestDepositApiResponse {
  success: boolean
  data: any[]
  pagination?: PaginationInfo
}

export interface SearchParams {
  query: string
  filters?: Record<string, any>
  sort?: string
  order?: 'asc' | 'desc'
  page?: number
  limit?: number
}

export interface WebSocketMessage {
  type: string
  payload: any
  timestamp: Date
  userId?: string
  streamId?: string
}

export interface NotificationData {
  id: string
  type: NotificationType
  title: string
  message: string
  data?: Record<string, any>
  isRead: boolean
  createdAt: Date
}

export type NotificationType = 
  | 'follow'
  | 'tip'
  | 'gift'
  | 'message'
  | 'stream_start'
  | 'subscription'
  | 'private_show'
  | 'system'

export interface AdminStats {
  users: {
    total: number
    active: number
    verified: number
    creators: number
  }
  streams: {
    total: number
    live: number
    private: number
    totalViewTime: number
  }
  revenue: {
    total: number
    commission: number
    payouts: number
    period: string
  }
  engagement: {
    messages: number
    tips: number
    gifts: number
    subscriptions: number
  }
}

export interface SystemHealth {
  status: 'healthy' | 'degraded' | 'down'
  services: {
    database: ServiceStatus
    redis: ServiceStatus
    websocket: ServiceStatus
    streaming: ServiceStatus
    payment: ServiceStatus
  }
  metrics: {
    cpu: number
    memory: number
    disk: number
    network: number
  }
  timestamp: Date
}

export interface ServiceStatus {
  status: 'up' | 'down' | 'warning'
  responseTime: number
  uptime: number
  lastCheck: Date
}

export interface RateLimitInfo {
  limit: number
  remaining: number
  reset: Date
  retryAfter?: number
}

export interface CacheInfo {
  key: string
  ttl: number
  hit: boolean
  size?: number
}

export interface AuditLog {
  id: string
  userId: string
  action: string
  resource: string
  resourceId?: string
  details?: Record<string, any>
  ipAddress: string
  userAgent: string
  createdAt: Date
}

export interface Feature {
  name: string
  enabled: boolean
  rolloutPercentage?: number
  conditions?: Record<string, any>
}

export interface FeatureFlags {
  [key: string]: Feature
}

export interface ServerConfig {
  features: FeatureFlags
  limits: {
    fileUpload: number
    streamBitrate: number
    messageLengh: number
    chatHistory: number
  }
  maintenance: {
    enabled: boolean
    message?: string
    estimatedEnd?: Date
  }
}
