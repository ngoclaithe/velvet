import { create } from 'zustand'
import type {
  StreamResponse,
  StreamSettings,
  ViewerRole
} from '@/types/streaming'

// Define types that are missing from streaming types
interface PrivateShow {
  id: string
  streamId: string
  viewerId: string
  creatorId: string
  rate: number
  duration: number
  status: 'pending' | 'active' | 'completed' | 'cancelled'
  scheduledFor: Date
  totalCost: number
  createdAt: Date
}

interface CreateStreamData {
  title: string
  description: string
  category: string
  tags: string[]
  isPrivate: boolean
  settings: {
    quality?: string
    chatEnabled?: boolean
    donationsEnabled?: boolean
  }
}

interface BookPrivateShowData {
  streamId: string
  creatorId: string
  duration: number
  scheduledFor: Date
}

interface StreamingState {
  currentStream: StreamResponse | null
  streams: StreamResponse[]
  categories: string[]
  tags: string[]
  isLoading: boolean
  error: string | null
  createStream: (data: CreateStreamData) => Promise<StreamResponse>
  updateStream: (id: string, data: Partial<StreamResponse>) => Promise<void>
  deleteStream: (id: string) => Promise<void>
  startStream: (id: string) => Promise<void>
  endStream: (id: string) => Promise<void>
  joinStream: (id: string) => Promise<void>
  leaveStream: (id: string) => Promise<void>
  bookPrivateShow: (data: BookPrivateShowData) => Promise<PrivateShow>
  updateStreamSettings: (id: string, settings: StreamSettings) => Promise<void>
  getStreamAnalytics: (id: string, period: string) => Promise<any[]>
}

export const useStreamingStore = create<StreamingState>((set, get) => ({
  currentStream: null,
  streams: [],
  categories: [],
  tags: [],
  isLoading: false,
  error: null,

  createStream: async (data: CreateStreamData) => {
    set({ isLoading: true, error: null })

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))

      const newStream: StreamResponse = {
        id: `stream_${Date.now()}`,
        creatorId: 1,
        creator: {
          id: 1,
          userId: 1,
          stageName: 'Creator',
          displayName: 'Creator',
          bio: '',
          isVerified: false,
          rating: '5.0',
          totalRatings: 0,
          hourlyRate: '0.00',
          bookingPrice: '0.00',
          subscriptionPrice: '0.00'
        } as any,
        title: data.title,
        description: data.description,
        streamKey: `key_${Date.now()}`,
        hlsUrl: '',
        category: data.category,
        tags: data.tags,
        isLive: false,
        isPrivate: data.isPrivate,
        viewerCount: 0,
        maxViewers: 0,
        quality: data.settings.quality || 'HD',
        startTime: new Date().toISOString(),
        chatEnabled: data.settings.chatEnabled ?? true,
        donationsEnabled: data.settings.donationsEnabled ?? true,
        totalDonations: '0.00',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      set((state) => ({
        streams: [newStream, ...state.streams],
        currentStream: newStream,
        isLoading: false,
      }))

      return newStream
    } catch (error) {
      set({
        isLoading: false,
        error: 'Failed to create stream',
      })
      throw error
    }
  },

  updateStream: async (id: string, data: Partial<StreamResponse>) => {
    set({ isLoading: true, error: null })

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500))

      set((state) => ({
        streams: state.streams.map(stream =>
          stream.id === id
            ? { ...stream, ...data, updatedAt: new Date().toISOString() }
            : stream
        ),
        currentStream: state.currentStream?.id === id
          ? { ...state.currentStream, ...data, updatedAt: new Date().toISOString() }
          : state.currentStream,
        isLoading: false,
      }))
    } catch (error) {
      set({
        isLoading: false,
        error: 'Failed to update stream',
      })
    }
  },

  deleteStream: async (id: string) => {
    set({ isLoading: true, error: null })

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500))

      set((state) => ({
        streams: state.streams.filter(stream => stream.id !== id),
        currentStream: state.currentStream?.id === id ? null : state.currentStream,
        isLoading: false,
      }))
    } catch (error) {
      set({
        isLoading: false,
        error: 'Failed to delete stream',
      })
    }
  },

  startStream: async (id: string) => {
    set({ isLoading: true, error: null })

    try {
      // Simulate stream start
      await new Promise(resolve => setTimeout(resolve, 1000))

      const startedAt = new Date().toISOString()

      set((state) => ({
        streams: state.streams.map(stream =>
          stream.id === id
            ? { ...stream, isLive: true, startTime: startedAt }
            : stream
        ),
        currentStream: state.currentStream?.id === id
          ? { ...state.currentStream, isLive: true, startTime: startedAt }
          : state.currentStream,
        isLoading: false,
      }))
    } catch (error) {
      set({
        isLoading: false,
        error: 'Failed to start stream',
      })
    }
  },

  endStream: async (id: string) => {
    set({ isLoading: true, error: null })

    try {
      // Simulate stream end
      await new Promise(resolve => setTimeout(resolve, 500))

      const endedAt = new Date().toISOString()

      set((state) => ({
        streams: state.streams.map(stream =>
          stream.id === id
            ? { ...stream, isLive: false, endTime: endedAt }
            : stream
        ),
        currentStream: state.currentStream?.id === id
          ? { ...state.currentStream, isLive: false, endTime: endedAt }
          : state.currentStream,
        isLoading: false,
      }))
    } catch (error) {
      set({
        isLoading: false,
        error: 'Failed to end stream',
      })
    }
  },

  joinStream: async (id: string) => {
    try {
      // Simulate joining stream
      await new Promise(resolve => setTimeout(resolve, 300))

      // Increment viewer count
      set((state) => ({
        streams: state.streams.map(stream =>
          stream.id === id
            ? { ...stream, viewerCount: stream.viewerCount + 1 }
            : stream
        ),
        currentStream: state.currentStream?.id === id
          ? { ...state.currentStream, viewerCount: state.currentStream.viewerCount + 1 }
          : state.currentStream,
      }))
    } catch (error) {
      set({ error: 'Failed to join stream' })
    }
  },

  leaveStream: async (id: string) => {
    try {
      // Simulate leaving stream
      await new Promise(resolve => setTimeout(resolve, 300))

      // Decrement viewer count
      set((state) => ({
        streams: state.streams.map(stream =>
          stream.id === id
            ? { ...stream, viewerCount: Math.max(0, stream.viewerCount - 1) }
            : stream
        ),
        currentStream: state.currentStream?.id === id
          ? { ...state.currentStream, viewerCount: Math.max(0, state.currentStream.viewerCount - 1) }
          : state.currentStream,
      }))
    } catch (error) {
      set({ error: 'Failed to leave stream' })
    }
  },

  bookPrivateShow: async (data: BookPrivateShowData) => {
    set({ isLoading: true, error: null })

    try {
      // Simulate booking private show
      await new Promise(resolve => setTimeout(resolve, 1000))

      const privateShow: PrivateShow = {
        id: `private_show_${Date.now()}`,
        streamId: data.streamId,
        viewerId: 'current_user_id',
        creatorId: data.creatorId,
        rate: 100, // Mock rate
        duration: data.duration,
        status: 'pending',
        scheduledFor: data.scheduledFor,
        totalCost: 100 * data.duration,
        createdAt: new Date(),
      }

      set({ isLoading: false })
      return privateShow
    } catch (error) {
      set({
        isLoading: false,
        error: 'Failed to book private show',
      })
      throw error
    }
  },

  updateStreamSettings: async (id: string, settings: StreamSettings) => {
    set({ isLoading: true, error: null })

    try {
      // Simulate updating stream settings
      await new Promise(resolve => setTimeout(resolve, 500))

      set({ isLoading: false })
    } catch (error) {
      set({
        isLoading: false,
        error: 'Failed to update stream settings',
      })
    }
  },

  getStreamAnalytics: async (id: string, period: string) => {
    set({ isLoading: true, error: null })

    try {
      // Simulate getting analytics
      await new Promise(resolve => setTimeout(resolve, 500))

      // Mock analytics data
      const analytics = [
        {
          streamId: id,
          date: new Date(),
          peakViewers: 150,
          averageViewers: 85,
          totalViewers: 320,
          viewDuration: 1800, // 30 minutes
          chatMessages: 245,
          tips: 15,
          gifts: 8,
          newFollowers: 12,
          revenue: 150.50,
        },
      ]

      set({ isLoading: false })
      return analytics
    } catch (error) {
      set({
        isLoading: false,
        error: 'Failed to get analytics',
      })
      throw error
    }
  },
}))
