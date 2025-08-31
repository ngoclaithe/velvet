// App configuration
export const APP_CONFIG = {
  name: 'Streaming Platform',
  version: '1.0.0',
  description: 'A modern streaming platform with live video, chat, and social features',
  url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  api: {
    baseUrl: process.env.NEXT_PUBLIC_API_URL || '/api',
    timeout: 30000,
  },
  websocket: {
    url: process.env.NEXT_PUBLIC_WEBSOCKET_URL || 'ws://localhost:3001',
    reconnectInterval: 3000,
    maxReconnectAttempts: 10,
    heartbeatInterval: 30000,
  },
} as const

// Stream categories
export const STREAM_CATEGORIES = [
  { id: 'gaming', name: 'Gaming', icon: '🎮' },
  { id: 'music', name: 'Music', icon: '🎵' },
  { id: 'art', name: 'Art & Creative', icon: '🎨' },
  { id: 'talk', name: 'Just Chatting', icon: '💬' },
  { id: 'fitness', name: 'Fitness & Health', icon: '💪' },
  { id: 'cooking', name: 'Food & Cooking', icon: '🍳' },
  { id: 'education', name: 'Education', icon: '📚' },
  { id: 'technology', name: 'Technology', icon: '💻' },
  { id: 'travel', name: 'Travel & Outdoors', icon: '🌍' },
  { id: 'lifestyle', name: 'Lifestyle', icon: '✨' },
  { id: 'sports', name: 'Sports', icon: '⚽' },
  { id: 'entertainment', name: 'Entertainment', icon: '🎭' },
  { id: 'other', name: 'Other', icon: '📺' },
] as const

// Stream quality options
export const STREAM_QUALITIES = [
  { value: '480p', label: '480p', bitrate: 2500, width: 854, height: 480 },
  { value: '720p', label: '720p HD', bitrate: 5000, width: 1280, height: 720 },
  { value: '1080p', label: '1080p FHD', bitrate: 8000, width: 1920, height: 1080 },
  { value: '1440p', label: '1440p QHD', bitrate: 16000, width: 2560, height: 1440 },
  { value: '4K', label: '4K UHD', bitrate: 35000, width: 3840, height: 2160 },
] as const

// Chat settings
export const CHAT_CONFIG = {
  maxMessageLength: 500,
  slowModeMax: 300, // seconds
  messageHistoryLimit: 1000,
  rateLimitMessages: 10,
  rateLimitWindow: 60000, // 1 minute
  bannedWordsDefault: [
    'spam', 'scam', 'hack', 'cheat',
    // Add more banned words as needed
  ],
} as const

// File upload limits
export const UPLOAD_LIMITS = {
  avatar: {
    maxSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
    dimensions: { width: 400, height: 400 },
  },
  banner: {
    maxSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
    dimensions: { width: 1920, height: 480 },
  },
  chatImage: {
    maxSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  },
  chatVideo: {
    maxSize: 100 * 1024 * 1024, // 100MB
    allowedTypes: ['video/mp4', 'video/webm'],
    maxDuration: 60, // seconds
  },
  documents: {
    maxSize: 50 * 1024 * 1024, // 50MB
    allowedTypes: ['application/pdf', 'image/jpeg', 'image/png'],
  },
} as const

// Payment settings
export const PAYMENT_CONFIG = {
  currency: 'USD',
  minDeposit: 5,
  maxDeposit: 10000,
  minWithdrawal: 10,
  maxWithdrawal: 50000,
  minTip: 1,
  maxTip: 10000,
  commissionRate: 0.15, // 15%
  payoutSchedule: 'weekly',
  payoutMinimum: 50,
} as const

// Gift items
export const GIFT_ITEMS: ReadonlyArray<{
  id: string
  name: string
  image?: string
  cost: number
  rarity?: 'common' | 'rare' | 'epic' | 'legendary'
}> = [] as const

// User roles and permissions
export const USER_ROLES = {
  user: {
    name: 'User',
    permissions: ['view_streams', 'chat', 'tip', 'follow'],
  },
  creator: {
    name: 'Creator',
    permissions: ['view_streams', 'chat', 'tip', 'follow', 'stream', 'private_shows'],
  },
  moderator: {
    name: 'Moderator',
    permissions: [
      'view_streams', 'chat', 'tip', 'follow', 'stream', 'private_shows',
      'moderate_chat', 'ban_users', 'delete_messages',
    ],
  },
  admin: {
    name: 'Administrator',
    permissions: [
      'view_streams', 'chat', 'tip', 'follow', 'stream', 'private_shows',
      'moderate_chat', 'ban_users', 'delete_messages',
      'manage_users', 'manage_content', 'view_analytics', 'system_settings',
    ],
  },
} as const

// Notification types
export const NOTIFICATION_TYPES = {
  follow: { icon: '👤', color: 'blue' },
  tip: { icon: '💰', color: 'green' },
  gift: { icon: '🎁', color: 'purple' },
  message: { icon: '💬', color: 'blue' },
  stream_start: { icon: '🔴', color: 'red' },
  subscription: { icon: '⭐', color: 'yellow' },
  private_show: { icon: '🔒', color: 'pink' },
  system: { icon: '🔔', color: 'gray' },
} as const

// Validation patterns
export const VALIDATION_PATTERNS = {
  username: /^[a-zA-Z0-9_]{3,20}$/,
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  password: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/,
  phoneNumber: /^\+?[\d\s\-\(\)]+$/,
  url: /^https?:\/\/.+\..+/,
  socialHandle: /^[a-zA-Z0-9_]{1,50}$/,
} as const

// API endpoints
export const API_ENDPOINTS = {
  auth: {
    login: '/auth/login',
    register: '/auth/register',
    logout: '/auth/logout',
    refresh: '/auth/refresh',
    forgotPassword: '/auth/forgot-password',
    resetPassword: '/auth/reset-password',
  },
  users: {
    profile: (id: string) => `/users/${id}`,
    updateProfile: '/users/me',
    uploadAvatar: '/users/me/avatar',
    follow: (id: string) => `/users/${id}/follow`,
    followers: (id: string) => `/users/${id}/followers`,
    following: (id: string) => `/users/${id}/following`,
  },
  streams: {
    list: '/streams',
    create: '/streams',
    get: (id: string) => `/streams/${id}`,
    update: (id: string) => `/streams/${id}`,
    delete: (id: string) => `/streams/${id}`,
    start: (id: string) => `/streams/${id}/start`,
    end: (id: string) => `/streams/${id}/end`,
    join: (id: string) => `/streams/${id}/join`,
    leave: (id: string) => `/streams/${id}/leave`,
  },
  chat: {
    messages: (streamId: string) => `/streams/${streamId}/messages`,
    sendMessage: (streamId: string) => `/streams/${streamId}/messages`,
    deleteMessage: (id: string) => `/messages/${id}`,
    conversations: '/conversations',
    conversation: (id: string) => `/conversations/${id}`,
  },
  payments: {
    wallet: '/wallet',
    deposit: '/wallet/deposit',
    withdraw: '/wallet/withdraw',
    transactions: '/wallet/transactions',
    tip: '/payments/tip',
    gift: '/payments/gift',
    subscribe: '/subscriptions',
    unsubscribe: (id: string) => `/subscriptions/${id}`,
  },
} as const

// Date and time formats
export const DATE_FORMATS = {
  full: 'MMMM d, yyyy \'at\' h:mm a',
  short: 'MMM d, yyyy',
  time: 'h:mm a',
  relative: 'relative',
  iso: 'yyyy-MM-dd\'T\'HH:mm:ss.SSSxxx',
} as const

// Theme configuration
export const THEME_CONFIG = {
  colors: {
    primary: {
      50: '#eff6ff',
      500: '#3b82f6',
      900: '#1e3a8a',
    },
    streaming: {
      live: '#ef4444',
      offline: '#6b7280',
      private: '#8b5cf6',
    },
    chat: {
      user: '#3b82f6',
      streamer: '#f59e0b',
      moderator: '#10b981',
      vip: '#8b5cf6',
    },
  },
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },
} as const

// Local storage keys
export const STORAGE_KEYS = {
  auth: 'auth-storage',
  theme: 'theme-preference',
  language: 'language-preference',
  chatSettings: 'chat-settings',
  playerSettings: 'player-settings',
  recentSearches: 'recent-searches',
} as const

// Error messages
export const ERROR_MESSAGES = {
  network: 'Network error. Please check your connection.',
  unauthorized: 'You are not authorized to perform this action.',
  forbidden: 'Access denied.',
  notFound: 'The requested resource was not found.',
  serverError: 'Internal server error. Please try again later.',
  validation: 'Please check your input and try again.',
  generic: 'Something went wrong. Please try again.',
} as const

// Success messages
export const SUCCESS_MESSAGES = {
  login: 'Successfully logged in!',
  register: 'Account created successfully!',
  profileUpdated: 'Profile updated successfully!',
  streamCreated: 'Stream created successfully!',
  messageSent: 'Message sent!',
  tipSent: 'Tip sent successfully!',
  followed: 'User followed!',
  unfollowed: 'User unfollowed!',
} as const
