export interface Post {
  id: string
  type: 'text' | 'image' | 'video' | 'poll' | 'live'
  content: string
  author: {
    id: string
    username: string
    displayName: string
    avatar?: string
    isVerified: boolean
    isOnline?: boolean
  }
  media?: PostMedia[]
  poll?: Poll
  createdAt: Date
  updatedAt: Date
  likes: number
  comments: number
  shares: number
  views?: number
  isAdult: boolean
  isPremium: boolean
  isLiked?: boolean
  isBookmarked?: boolean
  tags?: string[]
  location?: string
  visibility: 'public' | 'followers' | 'premium' | 'private'
  streamData?: {
    streamId: string
    viewerCount: number
    category?: string
    tags?: string[]
    isLive: boolean
  }
}

export interface PostMedia {
  id: string
  type: 'image' | 'video'
  url: string
  thumbnail?: string
  width?: number
  height?: number
  duration?: number
  size?: number
  blurhash?: string
}

export interface Poll {
  id: string
  question: string
  options: PollOption[]
  allowMultiple: boolean
  expiresAt?: Date
  isExpired: boolean
  totalVotes: number
  userVote?: string[]
}

export interface PollOption {
  id: string
  text: string
  votes: number
  percentage: number
}

export interface CreatePostData {
  content: string
  type: 'text' | 'image' | 'video' | 'poll'
  mediaIds?: string[]
  poll?: CreatePollData
  tags?: string[]
  location?: string
  visibility: 'public' | 'followers' | 'premium' | 'private'
  isAdult: boolean
  isPremium: boolean
}

export interface CreatePollData {
  question: string
  options: string[]
  allowMultiple: boolean
  expiresAt?: Date
}

export interface UpdatePostData {
  content?: string
  tags?: string[]
  location?: string
  visibility?: 'public' | 'followers' | 'premium' | 'private'
  isAdult?: boolean
  isPremium?: boolean
}

export interface PostComment {
  id: string
  content: string
  author: {
    id: string
    username: string
    displayName: string
    avatar?: string
    isVerified: boolean
  }
  postId: string
  parentId?: string
  replies?: PostComment[]
  likes: number
  createdAt: Date
  updatedAt: Date
  isLiked?: boolean
  isOwner?: boolean
}

export interface CreateCommentData {
  content: string
  parentId?: string
}

export interface PostLike {
  id: string
  userId: string
  postId: string
  createdAt: Date
}

export interface PostShare {
  id: string
  userId: string
  postId: string
  platform?: string
  createdAt: Date
}

export interface PostBookmark {
  id: string
  userId: string
  postId: string
  createdAt: Date
}

export interface FeedParams {
  type?: 'for-you' | 'following' | 'trending' | 'live'
  page?: number
  limit?: number
  tags?: string[]
  userId?: string
  includeAdult?: boolean
  includePremium?: boolean
  sort?: 'latest' | 'popular' | 'trending'
  timeRange?: '1h' | '6h' | '24h' | '7d' | '30d' | 'all'
}

export interface TrendingPost extends Post {
  trendingScore: number
  engagementRate: number
  viralityIndex: number
}

export interface FeedResponse {
  posts: Post[]
  hasMore: boolean
  nextCursor?: string
  totalCount?: number
}

export interface PostStats {
  totalPosts: number
  totalLikes: number
  totalComments: number
  totalShares: number
  totalViews: number
  engagementRate: number
  topPerformingPosts: Post[]
  trendingTags: string[]
}

export interface ContentModerationData {
  postId: string
  reason: string
  details?: string
  action: 'warn' | 'hide' | 'remove' | 'ban'
}

export interface ReportPostData {
  reason: 'spam' | 'adult' | 'harassment' | 'copyright' | 'violence' | 'other'
  details?: string
}

export interface PostAnalytics {
  postId: string
  views: number
  uniqueViews: number
  likes: number
  comments: number
  shares: number
  bookmarks: number
  engagementRate: number
  reachRate: number
  demographics: {
    age: Record<string, number>
    gender: Record<string, number>
    location: Record<string, number>
  }
  timeline: {
    date: string
    views: number
    likes: number
    comments: number
    shares: number
  }[]
}
