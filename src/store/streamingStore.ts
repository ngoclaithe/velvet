import { create } from 'zustand'
import type { 
  Stream, 
  StreamSettings, 
  PrivateShow, 
  StreamCategory, 
  StreamTag,
  StreamStore,
  CreateStreamData,
  BookPrivateShowData 
} from '@/types/streaming'

interface StreamingState extends StreamStore {}

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

      const newStream: Stream = {
        id: `stream_${Date.now()}`,
        creatorId: 'current_user_id',
        creator: {} as any, // Would be populated from API
        title: data.title,
        description: data.description,
        category: data.category,
        tags: data.tags,
        isLive: false,
        isPrivate: data.isPrivate,
        viewerCount: 0,
        totalViewers: 0,
        duration: 0,
        quality: data.settings.quality ? [data.settings.quality] : [],
        createdAt: new Date(),
        updatedAt: new Date(),
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

  updateStream: async (id: string, data: Partial<Stream>) => {
    set({ isLoading: true, error: null })

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500))

      set((state) => ({
        streams: state.streams.map(stream =>
          stream.id === id
            ? { ...stream, ...data, updatedAt: new Date() }
            : stream
        ),
        currentStream: state.currentStream?.id === id
          ? { ...state.currentStream, ...data, updatedAt: new Date() }
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

      const startedAt = new Date()

      set((state) => ({
        streams: state.streams.map(stream =>
          stream.id === id
            ? { ...stream, isLive: true, startedAt }
            : stream
        ),
        currentStream: state.currentStream?.id === id
          ? { ...state.currentStream, isLive: true, startedAt }
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

      const endedAt = new Date()

      set((state) => ({
        streams: state.streams.map(stream =>
          stream.id === id
            ? { ...stream, isLive: false, endedAt }
            : stream
        ),
        currentStream: state.currentStream?.id === id
          ? { ...state.currentStream, isLive: false, endedAt }
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
