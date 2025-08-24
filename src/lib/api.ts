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
  getStreams: (params?: Record<string, string>) => api.get('/streams', params),
  
  getStream: (streamId: string) => api.get(`/streams/${streamId}`),
  
  createStream: (data: any) => api.post('/streams', data),
  
  updateStream: (streamId: string, data: any) =>
    api.patch(`/streams/${streamId}`, data),
  
  deleteStream: (streamId: string) => api.delete(`/streams/${streamId}`),
  
  startStream: (streamId: string) => api.post(`/streams/${streamId}/start`),
  
  endStream: (streamId: string) => api.post(`/streams/${streamId}/end`),
  
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
