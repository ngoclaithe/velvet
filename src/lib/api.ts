import type { ApiResponse, ApiError } from '@/types/api'

interface RequestConfig extends RequestInit {
  params?: Record<string, string>
}

class ApiClient {
  private baseURL: string
  private defaultHeaders: Record<string, string>

  constructor(baseURL: string = '/api') {
    this.baseURL = baseURL
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
    const url = new URL(endpoint, this.baseURL)
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, value)
      })
    }
    
    return url.toString()
  }

  private async request<T>(
    endpoint: string,
    config: RequestConfig = {}
  ): Promise<ApiResponse<T>> {
    const { params, ...requestConfig } = config
    
    const headers = {
      ...this.defaultHeaders,
      ...requestConfig.headers,
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
  login: (credentials: { email: string; password: string }) =>
    api.post('/auth/login', credentials),
  
  register: (data: { username: string; email: string; password: string }) =>
    api.post('/auth/register', data),
  
  logout: () => api.post('/auth/logout'),
  
  refreshToken: () => api.post('/auth/refresh'),
  
  forgotPassword: (email: string) =>
    api.post('/auth/forgot-password', { email }),
  
  resetPassword: (data: { token: string; password: string }) =>
    api.post('/auth/reset-password', data),
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
