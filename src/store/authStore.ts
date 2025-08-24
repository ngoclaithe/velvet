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
          // Simulate API call
          await new Promise(resolve => setTimeout(resolve, 1000))
          
          // Mock user creation
          const mockUser: User = {
            id: '1',
            username: data.username,
            email: data.email,
            firstName: data.firstName,
            lastName: data.lastName,
            bio: '',
            isVerified: false,
            isOnline: true,
            role: 'user',
            createdAt: new Date(),
            updatedAt: new Date(),
          }

          const mockSession: AuthSession = {
            user: mockUser,
            accessToken: 'mock-access-token',
            refreshToken: 'mock-refresh-token',
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
          }

          set({
            user: mockUser,
            session: mockSession,
            isLoading: false,
            error: null,
          })
        } catch (error) {
          set({
            isLoading: false,
            error: 'Registration failed. Please try again.',
          })
          throw error
        }
      },

      logout: () => {
        set({
          user: null, // Return to null state
          session: null,
          isLoading: false,
          error: null,
        })
      },

      refreshToken: async () => {
        const { session } = get()
        if (!session) return

        try {
          // Simulate token refresh
          await new Promise(resolve => setTimeout(resolve, 500))
          
          const newSession: AuthSession = {
            ...session,
            accessToken: 'new-access-token',
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
          // Simulate API call
          await new Promise(resolve => setTimeout(resolve, 500))
          
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
          set({
            isLoading: false,
            error: 'Failed to update profile',
          })
          throw error
        }
      },

      submitKYC: async (data) => {
        set({ isLoading: true, error: null })

        try {
          // Simulate KYC submission
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
          // Simulate forgot password
          await new Promise(resolve => setTimeout(resolve, 1000))
          
          set({
            isLoading: false,
            error: null,
          })
        } catch (error) {
          set({
            isLoading: false,
            error: 'Failed to send reset email',
          })
          throw error
        }
      },

      resetPassword: async (data) => {
        set({ isLoading: true, error: null })

        try {
          // Simulate password reset
          await new Promise(resolve => setTimeout(resolve, 1000))
          
          set({
            isLoading: false,
            error: null,
          })
        } catch (error) {
          set({
            isLoading: false,
            error: 'Failed to reset password',
          })
          throw error
        }
      },

      changePassword: async (data) => {
        set({ isLoading: true, error: null })

        try {
          // Simulate password change
          await new Promise(resolve => setTimeout(resolve, 1000))
          
          set({
            isLoading: false,
            error: null,
          })
        } catch (error) {
          set({
            isLoading: false,
            error: 'Failed to change password',
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
