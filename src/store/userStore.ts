import { create } from 'zustand'
import type { UserProfile, CreatorProfile, UserSettings, Follow } from '@/types/user'

interface UserState {
  currentProfile: UserProfile | null
  profiles: { [userId: string]: UserProfile }
  settings: UserSettings | null
  followers: Follow[]
  following: Follow[]
  isLoading: boolean
  error: string | null

  // Actions
  loadProfile: (userId: string) => Promise<void>
  updateProfile: (data: Partial<UserProfile>) => Promise<void>
  followUser: (userId: string) => Promise<void>
  unfollowUser: (userId: string) => Promise<void>
  blockUser: (userId: string) => Promise<void>
  unblockUser: (userId: string) => Promise<void>
  updateSettings: (settings: Partial<UserSettings>) => Promise<void>
  loadSettings: () => Promise<void>
}

export const useUserStore = create<UserState>((set, get) => ({
  currentProfile: null,
  profiles: {},
  settings: null,
  followers: [],
  following: [],
  isLoading: false,
  error: null,

  loadProfile: async (userId: string) => {
    set({ isLoading: true, error: null })

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500))

      const mockProfile: UserProfile = {
        id: userId,
        username: `user_${userId}`,
        displayName: 'Sample User',
        email: 'user@example.com',
        avatar: '/api/placeholder/150/150',
        banner: '/api/placeholder/800/200',
        bio: 'This is a sample user profile.',
        location: 'New York, USA',
        socialLinks: {
          twitter: '@sample_user',
          instagram: '@sample_user',
        },
        isVerified: Math.random() > 0.5,
        isOnline: Math.random() > 0.3,
        lastSeen: new Date(),
        followersCount: Math.floor(Math.random() * 10000),
        followingCount: Math.floor(Math.random() * 1000),
        totalTips: Math.floor(Math.random() * 50000),
        totalGifts: Math.floor(Math.random() * 20000),
        createdAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(),
      }

      set((state) => ({
        profiles: {
          ...state.profiles,
          [userId]: mockProfile,
        },
        currentProfile: mockProfile,
        isLoading: false,
      }))
    } catch (error) {
      set({
        isLoading: false,
        error: 'Failed to load profile',
      })
    }
  },

  updateProfile: async (data: Partial<UserProfile>) => {
    const { currentProfile } = get()
    if (!currentProfile) return

    set({ isLoading: true, error: null })

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500))

      const updatedProfile: UserProfile = {
        ...currentProfile,
        ...data,
        updatedAt: new Date(),
      }

      set((state) => ({
        currentProfile: updatedProfile,
        profiles: {
          ...state.profiles,
          [currentProfile.id]: updatedProfile,
        },
        isLoading: false,
      }))
    } catch (error) {
      set({
        isLoading: false,
        error: 'Failed to update profile',
      })
    }
  },

  followUser: async (userId: string) => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 300))

      const newFollow: Follow = {
        id: `follow_${Date.now()}`,
        followerId: 'current_user_id',
        followingId: userId,
        createdAt: new Date(),
      }

      set((state) => ({
        following: [...state.following, newFollow],
      }))
    } catch (error) {
      set({ error: 'Failed to follow user' })
    }
  },

  unfollowUser: async (userId: string) => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 300))

      set((state) => ({
        following: state.following.filter(f => f.followingId !== userId),
      }))
    } catch (error) {
      set({ error: 'Failed to unfollow user' })
    }
  },

  blockUser: async (userId: string) => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 300))
      
      // Remove from following if exists
      set((state) => ({
        following: state.following.filter(f => f.followingId !== userId),
      }))
    } catch (error) {
      set({ error: 'Failed to block user' })
    }
  },

  unblockUser: async (userId: string) => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 300))
    } catch (error) {
      set({ error: 'Failed to unblock user' })
    }
  },

  updateSettings: async (newSettings: Partial<UserSettings>) => {
    const { settings } = get()
    set({ isLoading: true, error: null })

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500))

      const updatedSettings: UserSettings = {
        ...settings,
        ...newSettings,
      } as UserSettings

      set({
        settings: updatedSettings,
        isLoading: false,
      })
    } catch (error) {
      set({
        isLoading: false,
        error: 'Failed to update settings',
      })
    }
  },

  loadSettings: async () => {
    set({ isLoading: true, error: null })

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500))

      const mockSettings: UserSettings = {
        privacy: {
          showOnlineStatus: true,
          showLastSeen: true,
          allowDirectMessages: true,
          allowFollows: true,
          showInSearch: true,
        },
        notifications: {
          email: true,
          push: true,
          newFollowers: true,
          tips: true,
          gifts: true,
          streamStart: true,
          messages: true,
        },
        streaming: {
          defaultQuality: '1080p',
          autoStart: false,
          chatModeration: true,
          allowGifts: true,
          allowTips: true,
          privateShows: true,
        },
        appearance: {
          theme: 'system',
          language: 'en',
          timezone: 'UTC',
        },
      }

      set({
        settings: mockSettings,
        isLoading: false,
      })
    } catch (error) {
      set({
        isLoading: false,
        error: 'Failed to load settings',
      })
    }
  },
}))
