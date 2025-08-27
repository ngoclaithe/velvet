import type { ApiResponse, ApiError, WalletApiResponse } from '@/types/api'
import type { StreamsApiResponse } from '@/types/streaming'
import type { Transaction } from '@/types/payments'

interface RequestConfig extends RequestInit {
  params?: Record<string, string>
}

class ApiClient {
  private baseURL: string
  private defaultHeaders: Record<string, string>

  constructor(baseURL?: string) {
    this.baseURL = baseURL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1'
    this.defaultHeaders = {
      'Content-Type': 'application/json',
    }

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

    if (this.baseURL.startsWith('http://') || this.baseURL.startsWith('https://')) {
      const cleanBase = this.baseURL.endsWith('/') ? this.baseURL.slice(0, -1) : this.baseURL
      const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`
      fullPath = `${cleanBase}${cleanEndpoint}`
    } else {
      const cleanBase = this.baseURL.endsWith('/') ? this.baseURL.slice(0, -1) : this.baseURL
      const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`
      fullPath = `${cleanBase}${cleanEndpoint}`
    }

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