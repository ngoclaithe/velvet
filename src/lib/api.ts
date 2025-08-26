import type { ApiResponse, ApiError } from '@/types/api'

interface RequestConfig extends RequestInit {
  params?: Record<string, string>
}

class ApiClient {
  private baseURL: string
  private defaultHeaders: Record<string, string>

  constructor(baseURL?: string) {
    // Sử dụng environment variable hoặc fallback
    this.baseURL = baseURL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1'
    this.defaultHeaders = {
      'Content-Type': 'application/json',
    }

    // Log để debug (chỉ trong development)
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
      console.log('🔗 API Base URL:', this.baseURL)
    }
  }

  private getAuthToken(): string | null {
    if (typeof window === 'undefined') return null
    
    try {
      const authData = localStorage.getItem('auth-storage')
      if (authData) {
        const parsed = JSON.parse(authData)
        return parsed.state?.session?.accessToken || null
      }
    } catch {
      return null
    }
    
    return null
  }

  private buildURL(endpoint: string, params?: Record<string, string>): string {
    let fullPath: string

    // Kiểm tra nếu baseURL là absolute URL (có http/https)
    if (this.baseURL.startsWith('http://') || this.baseURL.startsWith('https://')) {
      const cleanBase = this.baseURL.endsWith('/') ? this.baseURL.slice(0, -1) : this.baseURL
      const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`
      fullPath = `${cleanBase}${cleanEndpoint}`
    } else {
      // Xử lý relative URL (fallback)
      const cleanBase = this.baseURL.endsWith('/') ? this.baseURL.slice(0, -1) : this.baseURL
      const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`
      fullPath = `${cleanBase}${cleanEndpoint}`
    }

    // Thêm query parameters nếu có
    if (params && Object.keys(params).length > 0) {
      const searchParams = new URLSearchParams()
      Object.entries(params).forEach(([key, value]) => {
        searchParams.append(key, value)
      })
      fullPath += `?${searchParams.toString()}`
    }

    return fullPath
  }

  private async request<T>(
    endpoint: string,
    config: RequestConfig = {}
  ): Promise<ApiResponse<T>> {
    const { params, ...requestConfig } = config
    
    const headers: Record<string, string> = {
      ...this.defaultHeaders,
      ...(requestConfig.headers as Record<string, string> || {}),
    }

    // Add auth token if available
    const token = this.getAuthToken()
    if (token) {
      headers.Authorization = `Bearer ${token}`
    }

    const url = this.buildURL(endpoint, params)

    try {
      const response = await fetch(url, {
        ...requestConfig,
        headers,
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `HTTP ${response.status}`)
      }

      const data = await response.json()
      return data
    } catch (error) {
      const apiError: ApiError = {
        code: 'REQUEST_FAILED',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date(),
      }

      return {
        success: false,
        error: apiError.message,
      }
    }
  }

  async get<T>(endpoint: string, params?: Record<string, string>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET', params })
  }

  async post<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  async put<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  async patch<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' })
  }

  async upload<T>(endpoint: string, file: File | FormData): Promise<ApiResponse<T>> {
    const formData = file instanceof FormData ? file : new FormData()
    if (file instanceof File) {
      formData.append('file', file)
    }

    const headers: Record<string, string> = {}
    const token = this.getAuthToken()
    if (token) {
      headers.Authorization = `Bearer ${token}`
    }

    return this.request<T>(endpoint, {
      method: 'POST',
      body: formData,
      headers,
    })
  }
}

export const api = new ApiClient()

// Convenience functions for common API calls
export const authApi = {
  // Đăng nhập - POST /api/v1/auth/login
  login: (credentials: { loginField: string; password: string }) =>
    api.post('/auth/login', credentials),

  // Đăng ký - POST /api/v1/auth/register
  register: (data: {
    email: string;
    username: string;
    password: string;
    firstName?: string;
    lastName?: string;
    phoneNumber?: string;
    gender?: 'male' | 'female' | 'other';
    dateOfBirth?: string;
    referralCode?: string;
  }) => api.post('/auth/register', data),

  // Đăng xuất - POST /api/v1/auth/logout
  logout: () => api.post('/auth/logout'),

  // Lấy thông tin user hiện tại - GET /api/v1/auth/me
  getMe: () => api.get('/auth/me'),

  // Refresh token - POST /api/v1/auth/refresh-token
  refreshToken: () => api.post('/auth/refresh-token'),

  // Quên mật khẩu - POST /api/v1/auth/forgotpassword
  forgotPassword: (email: string) =>
    api.post('/auth/forgotpassword', { email }),

  // Reset mật khẩu - PUT /api/v1/auth/resetpassword/:resettoken
  resetPassword: (resettoken: string, password: string) =>
    api.put(`/auth/resetpassword/${encodeURIComponent(resettoken)}`, { password }),

  // Cập nhật thông tin cá nhân - PUT /api/v1/auth/updatedetails
  updateDetails: (data: any) => api.put('/auth/updatedetails', data),

  // Đổi mật khẩu - PUT /api/v1/auth/updatepassword
  updatePassword: (data: { currentPassword: string; newPassword: string }) =>
    api.put('/auth/updatepassword', data),

  // Kiểm tra username - GET /api/v1/auth/check-username/:username
  checkUsername: (username: string) => api.get(`/auth/check-username/${encodeURIComponent(username)}`),

  // Kiểm tra email - GET /api/v1/auth/check-email/:email
  checkEmail: (email: string) => api.get(`/auth/check-email/${encodeURIComponent(email)}`),

  // Đăng ký creator - POST /api/v1/auth/creator/register
  registerCreator: (data: {
    stageName: string;
    bio?: string;
    hourlyRate?: number;
    minBookingDuration?: number;
    bookingPrice?: number;
    subscriptionPrice?: number;
    height?: number;
    weight?: number;
  }) => api.post('/auth/creator/register', data),

  // Lấy thông tin creator profile - GET /api/v1/auth/creator/profile
  getCreatorProfile: () => api.get('/auth/creator/profile'),

  // Cập nhật creator profile - PUT /api/v1/auth/creator/profile
  updateCreatorProfile: (data: any) => api.put('/auth/creator/profile', data),
}

export const userApi = {
  getProfile: (userId: string) => api.get(`/users/${userId}`),
  
  updateProfile: (data: any) => api.patch('/users/me', data),
  
  uploadAvatar: (file: File) => api.upload('/users/me/avatar', file),
  
  follow: (userId: string) => api.post(`/users/${userId}/follow`),
  
  unfollow: (userId: string) => api.delete(`/users/${userId}/follow`),
  
  getFollowers: (userId: string) => api.get(`/users/${userId}/followers`),
  
  getFollowing: (userId: string) => api.get(`/users/${userId}/following`),
}

export const streamApi = {
  // Lấy danh sách streams đang live
  getLiveStreams: (params?: Record<string, string>) => api.get('/streams', params),

  // Lấy thông tin stream cụ thể
  getStreamInfo: (streamId: string) => api.get(`/streams/${streamId}/info`),

  // Tạo và bắt đầu stream session mới (cho creator)
  startStream: (data: {
    title: string;
    description?: string;
    category?: string;
    tags?: string[];
    isPrivate?: boolean;
  }) => api.post<{
    id: string;
    streamKey: string;
    socketEndpoint: string;
    title: string;
    isLive: boolean;
  }>('/streams/start', data),

  // Kết thúc stream (cho creator)
  stopStream: (streamId: string) => api.post(`/streams/${streamId}/stop`),

  // Lấy thống kê stream
  getStreamStats: () => api.get('/streams/stats'),

  // Legacy methods để tương thích với code cũ
  getStreams: (params?: Record<string, string>) => api.get('/streams/live', params),
  getStream: (streamId: string) => api.get(`/streams/${streamId}/info`),
  createStream: (data: any) => api.post('/streams/start', data),
  endStream: (streamId: string) => api.post(`/streams/${streamId}/stop`),
  joinStream: (streamId: string) => api.post(`/streams/${streamId}/join`),
  leaveStream: (streamId: string) => api.post(`/streams/${streamId}/leave`),
}

export const chatApi = {
  getMessages: (streamId: string, params?: Record<string, string>) =>
    api.get(`/streams/${streamId}/messages`, params),
  
  sendMessage: (streamId: string, data: any) =>
    api.post(`/streams/${streamId}/messages`, data),
  
  deleteMessage: (messageId: string) =>
    api.delete(`/messages/${messageId}`),
  
  getConversations: () => api.get('/conversations'),
  
  getConversation: (conversationId: string) =>
    api.get(`/conversations/${conversationId}`),
  
  sendDirectMessage: (conversationId: string, data: any) =>
    api.post(`/conversations/${conversationId}/messages`, data),
}

export const paymentApi = {
  getWallet: () => api.get('/wallet'),

  deposit: (data: any) => api.post('/wallet/deposit', data),

  withdraw: (data: any) => api.post('/wallet/withdraw', data),

  getTransactions: (params?: Record<string, string>) =>
    api.get('/wallet/transactions', params),

  sendTip: (data: any) => api.post('/payments/tip', data),

  sendGift: (data: any) => api.post('/payments/gift', data),

  subscribe: (creatorId: string, planId: string) =>
    api.post('/subscriptions', { creatorId, planId }),

  unsubscribe: (subscriptionId: string) =>
    api.delete(`/subscriptions/${subscriptionId}`),
}

export const postsApi = {
  // Lấy feed posts với pagination
  getFeed: (params?: Record<string, string>) =>
    api.get('/posts/feed', params),

  // Lấy posts của user cụ thể
  getUserPosts: (userId: string, params?: Record<string, string>) =>
    api.get(`/users/${userId}/posts`, params),

  // Lấy trending posts
  getTrendingPosts: (params?: Record<string, string>) =>
    api.get('/posts/trending', params),

  // Lấy posts theo tag
  getPostsByTag: (tag: string, params?: Record<string, string>) =>
    api.get(`/posts/tags/${encodeURIComponent(tag)}`, params),

  // Lấy chi tiết một post
  getPost: (postId: string) =>
    api.get(`/posts/${postId}`),

  // Tạo post mới
  createPost: (data: any) =>
    api.post('/posts', data),

  // Cập nhật post
  updatePost: (postId: string, data: any) =>
    api.patch(`/posts/${postId}`, data),

  // Xóa post
  deletePost: (postId: string) =>
    api.delete(`/posts/${postId}`),

  // Like/Unlike post
  likePost: (postId: string) =>
    api.post(`/posts/${postId}/like`),

  unlikePost: (postId: string) =>
    api.delete(`/posts/${postId}/like`),

  // Share post
  sharePost: (postId: string, data?: any) =>
    api.post(`/posts/${postId}/share`, data),

  // Bookmark/Unbookmark post
  bookmarkPost: (postId: string) =>
    api.post(`/posts/${postId}/bookmark`),

  unbookmarkPost: (postId: string) =>
    api.delete(`/posts/${postId}/bookmark`),

  // Lấy bookmarked posts
  getBookmarkedPosts: (params?: Record<string, string>) =>
    api.get('/posts/bookmarks', params),

  // Report post
  reportPost: (postId: string, data: any) =>
    api.post(`/posts/${postId}/report`, data),

  // Comments
  getComments: (postId: string, params?: Record<string, string>) =>
    api.get(`/posts/${postId}/comments`, params),

  createComment: (postId: string, data: any) =>
    api.post(`/posts/${postId}/comments`, data),

  updateComment: (commentId: string, data: any) =>
    api.patch(`/comments/${commentId}`, data),

  deleteComment: (commentId: string) =>
    api.delete(`/comments/${commentId}`),

  likeComment: (commentId: string) =>
    api.post(`/comments/${commentId}/like`),

  unlikeComment: (commentId: string) =>
    api.delete(`/comments/${commentId}/like`),

  // Media upload
  uploadMedia: (file: File) =>
    api.upload('/media/upload', file),

  // Poll voting
  votePoll: (postId: string, data: { optionIds: string[] }) =>
    api.post(`/posts/${postId}/poll/vote`, data),

  // Analytics (for creators/admins)
  getPostAnalytics: (postId: string) =>
    api.get(`/posts/${postId}/analytics`),

  getPostStats: (userId?: string) =>
    api.get('/posts/stats', userId ? { userId } : undefined),

  // Search posts
  searchPosts: (params: Record<string, string>) =>
    api.get('/posts/search', params),
}
