import { create } from 'zustand'
import { persist } from 'zustand/middleware'
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
      user: guestUser, // Start with guest user
      session: null,
      isLoading: false,
      error: null,

      login: async (credentials: LoginCredentials) => {
        set({ isLoading: true, error: null })
        
        try {
          // Simulate API call
          await new Promise(resolve => setTimeout(resolve, 1000))
          
          // Mock user data
          const mockUser: User = {
            id: '1',
            username: 'user123',
            email: credentials.email,
            avatar: '/api/placeholder/150/150',
            firstName: 'John',
            lastName: 'Doe',
            bio: 'Welcome to my profile!',
            isVerified: true,
            isOnline: true,
            role: 'user',
            createdAt: new Date(),
            updatedAt: new Date(),
          }

          const mockSession: AuthSession = {
            user: mockUser,
            accessToken: 'mock-access-token',
            refreshToken: 'mock-refresh-token',
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
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
            error: 'Invalid email or password',
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
          user: guestUser, // Return to guest mode instead of null
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
        user: state.user,
        session: state.session,
      }),
    }
  )
)
