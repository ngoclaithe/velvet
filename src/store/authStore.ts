import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { authApi } from '@/lib/api'
import type { AuthStore, User, AuthSession, LoginCredentials, RegisterData } from '@/types/auth'

interface AuthState extends AuthStore {}

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
            loginField: credentials.email, // Backend nhận loginField (có thể là email hoặc username)
            password: credentials.password
          })

          if (!response.success || !response.data) {
            throw new Error(response.error || 'Đăng nhập thất bại')
          }

          // Lấy thông tin user từ response
          const { user, token } = response.data

          const session: AuthSession = {
            user: {
              ...user,
              createdAt: new Date(user.createdAt),
              updatedAt: new Date(user.updatedAt),
            },
            accessToken: token,
            refreshToken: '', // Backend có thể không trả về refresh token
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours từ token payload hoặc default
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
          // Gọi API register thật
          const response = await authApi.register({
            email: data.email,
            username: data.username,
            password: data.password,
            firstName: data.firstName,
            lastName: data.lastName,
          })

          if (!response.success || !response.data) {
            throw new Error(response.error || 'Đăng ký thất bại')
          }

          // Lấy thông tin user từ response
          const { user, token } = response.data

          const session: AuthSession = {
            user: {
              ...user,
              createdAt: new Date(user.createdAt),
              updatedAt: new Date(user.updatedAt),
            },
            accessToken: token,
            refreshToken: '',
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
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
          const response = await authApi.refreshToken()

          if (!response.success || !response.data) {
            throw new Error('Token refresh failed')
          }

          const newSession: AuthSession = {
            ...session,
            accessToken: response.data.token,
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
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
            updatedAt: new Date(),
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
    }
  )
)
