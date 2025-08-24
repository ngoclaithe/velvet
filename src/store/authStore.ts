import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { authApi } from '@/lib/api'
import type { AuthStore, User, AuthSession, LoginCredentials, RegisterData } from '@/types/auth'

interface AuthState extends AuthStore {}

// Response types for API calls
interface LoginResponse {
  success: boolean
  message?: string
  error?: string
  token: string
  user: any
}

interface RegisterResponse {
  success: boolean
  error?: string
  message?: string
  user: any
  token: string
}

interface RefreshTokenResponse {
  success: boolean
  error?: string
  data?: {
    token: string
  }
}

// Default guest user
const guestUser: User = {
  id: 'guest',
  username: 'Guest',
  email: '',
  role: 'guest',
  isVerified: false,
  isOnline: true,
  createdAt: new Date(),
  updatedAt: new Date(),
}

// Helper function to ensure dates are Date objects
const ensureDate = (date: any): Date => {
  if (date instanceof Date) return date
  if (typeof date === 'string' || typeof date === 'number') return new Date(date)
  return new Date()
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null, // Start with null to prevent hydration mismatch
      session: null,
      isLoading: false,
      error: null,

      login: async (credentials: LoginCredentials) => {
        set({ isLoading: true, error: null })

        try {
          // Gọi API login thật
          const response = await authApi.login({
            loginField: credentials.loginField, // Backend nhận loginField (có thể là email hoặc username)
            password: credentials.password
          }) as LoginResponse

          if (!response.success || !response.user || !response.token) {
            throw new Error(response.error || response.message || 'Đăng nhập thất bại')
          }

          // Lấy thông tin user từ response (trực tiếp từ response, không qua response.data)
          const { user, token } = response

          const session: AuthSession = {
            user: {
              ...user,
              // Đảm bảo có đủ các field cần thiết
              isVerified: user.isVerified || false,
              isOnline: true,
              firstName: user.firstName || '',
              lastName: user.lastName || '',
              avatar: user.avatar || null,
              createdAt: ensureDate(user.createdAt || new Date()),
              updatedAt: ensureDate(user.updatedAt || new Date()),
            },
            accessToken: token,
            refreshToken: '', // Backend có thể không trả về refresh token
            expiresAt: ensureDate(Date.now() + 24 * 60 * 60 * 1000), // 24 hours từ token payload hoặc default
          }

          set({
            user: session.user,
            session: session,
            isLoading: false,
            error: null,
          })
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Đăng nhập thất bại'
          set({
            isLoading: false,
            error: errorMessage,
          })
          throw error
        }
      },

      register: async (data: RegisterData) => {
        set({ isLoading: true, error: null })

        try {
          // Chuẩn bị dữ liệu theo backend validation
          const registerData: any = {
            email: data.email,
            username: data.username,
            password: data.password,
          }

          // Thêm các optional fields nếu có giá trị
          if (data.firstName && data.firstName.trim()) {
            registerData.firstName = data.firstName.trim()
          }
          if (data.lastName && data.lastName.trim()) {
            registerData.lastName = data.lastName.trim()
          }
          if (data.phoneNumber && data.phoneNumber.trim()) {
            registerData.phoneNumber = data.phoneNumber.trim()
          }
          if (data.gender) {
            registerData.gender = data.gender
          }
          if (data.dateOfBirth) {
            // Convert date to ISO8601 format (YYYY-MM-DD -> YYYY-MM-DDTHH:mm:ss.sssZ)
            registerData.dateOfBirth = new Date(data.dateOfBirth).toISOString()
          }
          if (data.referralCode && data.referralCode.trim()) {
            registerData.referralCode = data.referralCode.trim()
          }

          // Gọi API register thật
          const response = await authApi.register(registerData) as RegisterResponse

          if (!response.success) {
            throw new Error(response.error || 'Đăng ký thất bại')
          }

          // API trả về user và token trực tiếp trong response, không qua response.data
          const { user, token } = response

          // Tạo session từ response
          const session: AuthSession = {
            user: {
              ...user,
              // Set default values cho các field không có trong response
              isVerified: false,
              isOnline: true,
              phoneNumber: user.phoneNumber || '',
              gender: user.gender || '',
              dateOfBirth: user.dateOfBirth ? ensureDate(user.dateOfBirth) : undefined,
              createdAt: ensureDate(user.createdAt || new Date()), // API không trả về createdAt
              updatedAt: ensureDate(user.updatedAt || new Date()), // API không trả về updatedAt
            },
            accessToken: token,
            refreshToken: '',
            expiresAt: ensureDate(Date.now() + 24 * 60 * 60 * 1000),
          }

          set({
            user: session.user,
            session: session,
            isLoading: false,
            error: null,
          })
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Đăng ký thất bại'
          set({
            isLoading: false,
            error: errorMessage,
          })
          throw error
        }
      },

      logout: async () => {
        try {
          // Gọi API logout để invalidate token
          await authApi.logout()
        } catch (error) {
          // Vẫn logout dù API call thất bại
          console.error('Logout API failed:', error)
        } finally {
          set({
            user: null,
            session: null,
            isLoading: false,
            error: null,
          })
        }
      },

      refreshToken: async () => {
        const { session } = get()
        if (!session) return

        try {
          const response = await authApi.refreshToken() as RefreshTokenResponse

          if (!response.success || !response.data) {
            throw new Error('Token refresh failed')
          }

          const newSession: AuthSession = {
            ...session,
            accessToken: response.data.token,
            expiresAt: ensureDate(Date.now() + 24 * 60 * 60 * 1000),
          }

          set({ session: newSession })
        } catch (error) {
          // If refresh fails, logout user
          get().logout()
          throw error
        }
      },

      updateProfile: async (data: Partial<User>) => {
        const { user } = get()
        if (!user) return

        set({ isLoading: true, error: null })

        try {
          const response = await authApi.updateDetails(data)

          if (!response.success) {
            throw new Error(response.error || 'Cập nhật thông tin thất bại')
          }

          const updatedUser: User = {
            ...user,
            ...data,
            updatedAt: ensureDate(new Date()),
          }

          set({
            user: updatedUser,
            isLoading: false,
            error: null,
          })
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Cập nhật thông tin thất bại'
          set({
            isLoading: false,
            error: errorMessage,
          })
          throw error
        }
      },

      submitKYC: async (data) => {
        set({ isLoading: true, error: null })

        try {
          // KYC functionality có thể implement sau
          await new Promise(resolve => setTimeout(resolve, 2000))

          set({
            isLoading: false,
            error: null,
          })
        } catch (error) {
          set({
            isLoading: false,
            error: 'KYC submission failed',
          })
          throw error
        }
      },

      forgotPassword: async (data) => {
        set({ isLoading: true, error: null })

        try {
          const response = await authApi.forgotPassword(data.email)

          if (!response.success) {
            throw new Error(response.error || 'Gửi email khôi phục thất bại')
          }

          set({
            isLoading: false,
            error: null,
          })
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Gửi email khôi phục thất bại'
          set({
            isLoading: false,
            error: errorMessage,
          })
          throw error
        }
      },

      resetPassword: async (data) => {
        set({ isLoading: true, error: null })

        try {
          const response = await authApi.resetPassword(data.token, data.password)

          if (!response.success) {
            throw new Error(response.error || 'Đặt lại mật khẩu thất bại')
          }

          set({
            isLoading: false,
            error: null,
          })
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Đặt lại mật khẩu thất bại'
          set({
            isLoading: false,
            error: errorMessage,
          })
          throw error
        }
      },

      changePassword: async (data) => {
        set({ isLoading: true, error: null })

        try {
          const response = await authApi.updatePassword({
            currentPassword: data.currentPassword,
            newPassword: data.newPassword,
          })

          if (!response.success) {
            throw new Error(response.error || 'Đổi mật khẩu thất bại')
          }

          set({
            isLoading: false,
            error: null,
          })
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Đổi mật khẩu thất bại'
          set({
            isLoading: false,
            error: errorMessage,
          })
          throw error
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        // Only persist authenticated users, not guest users
        user: state.user?.role !== 'guest' ? state.user : null,
        session: state.session,
      }),
      onRehydrateStorage: () => (state) => {
        // Convert string dates back to Date objects after rehydration
        if (state?.session?.expiresAt) {
          state.session.expiresAt = new Date(state.session.expiresAt)
        }
        if (state?.user?.createdAt) {
          state.user.createdAt = new Date(state.user.createdAt)
        }
        if (state?.user?.updatedAt) {
          state.user.updatedAt = new Date(state.user.updatedAt)
        }
        // Only convert dateOfBirth if it exists in the user object
        if (state?.user && 'dateOfBirth' in state.user && state.user.dateOfBirth) {
          (state.user as any).dateOfBirth = new Date((state.user as any).dateOfBirth)
        }
      },
    }
  )
)
