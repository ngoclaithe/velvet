import { io, Socket } from 'socket.io-client'

export interface SocketConnectionConfig {
  accessCode?: string
  clientType?: 'creator' | 'viewer' | 'client'
  streamId?: string
  streamKey?: string
}

export interface JoinRoomData {
  accessCode?: string
  clientType: string
  timestamp: number
  viewType?: string
  streamId?: string
  streamKey?: string
}

export interface StreamRoomData {
  roomId: string
  userId: string
  username: string
  userType: string
}

export class SocketService {
  private socket: Socket | null = null
  private isConnected: boolean = false
  private currentConfig: SocketConnectionConfig | null = null
  private listeners: Map<string, Set<Function>> = new Map()
  private connectionPromise: Promise<Socket> | null = null

  constructor() {
    this.socket = null
    this.isConnected = false
    this.currentConfig = null
    this.listeners = new Map()
    this.connectionPromise = null
  }

  async connect(config: SocketConnectionConfig): Promise<Socket> {
    // Check if already connected with same config
    if (this.socket && 
        this.currentConfig?.accessCode === config.accessCode && 
        this.currentConfig?.clientType === config.clientType &&
        this.isConnected) {
      return this.socket
    }

    // Disconnect existing connection
    this.disconnect()
    this.currentConfig = config

    // Get socket URL from environment
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'
    const socketUrl = baseUrl.replace('/api/v1', '').replace('http://', 'ws://').replace('https://', 'wss://')

    this.connectionPromise = new Promise((resolve, reject) => {
      this.socket = io(socketUrl, {
        transports: ['websocket', 'polling'],
        upgrade: true,
        forceNew: true,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        timeout: 20000,
        query: config.accessCode ? {
          accessCode: config.accessCode
        } : {}
      })

      this.socket.on('connect', () => {
        console.log('Socket connected:', this.socket?.id)
        this.isConnected = true
        
        // Join room after connection
        this.joinRoom(config)
        
        resolve(this.socket!)
      })

      this.socket.on('disconnect', (reason) => {
        console.log('Socket disconnected:', reason)
        this.isConnected = false
        this.emitEvent('disconnect', { reason })
      })

      this.socket.on('connect_error', (error) => {
        console.error('Socket connection error:', error)
        this.isConnected = false
        this.emitEvent('connect_error', error)
        reject(error)
      })

      // Auto-reconnect when connection is restored
      this.socket.on('reconnect', () => {
        console.log('Socket reconnected')
        this.isConnected = true
        
        // Rejoin room after reconnection
        if (this.currentConfig) {
          this.joinRoom(this.currentConfig)
        }
        
        this.emitEvent('reconnect', {})
      })

      this.socket.on('reconnect_error', (error) => {
        console.error('Socket reconnection error:', error)
        this.emitEvent('reconnect_error', error)
      })

      this.socket.on('reconnect_failed', () => {
        console.error('Socket reconnection failed')
        this.emitEvent('reconnect_failed', {})
      })
    })

    return this.connectionPromise
  }

  private joinRoom(config: SocketConnectionConfig) {
    if (!this.socket) return

    const joinData: JoinRoomData = {
      clientType: config.clientType || 'client',
      timestamp: Date.now(),
      viewType: 'intro'
    }

    // Add specific data based on client type
    if (config.accessCode) {
      joinData.accessCode = config.accessCode
    }

    if (config.streamId) {
      joinData.streamId = config.streamId
    }

    if (config.streamKey) {
      joinData.streamKey = config.streamKey
    }

    console.log('Joining room with data:', joinData)

    // Use correct event name based on backend expectations
    if (config.clientType === 'creator' || config.streamId) {
      // For streaming use join_room_stream as expected by backend
      this.socket.emit('join_room_stream', {
        roomId: config.streamId || config.streamKey || config.accessCode,
        userId: 'creator_user', // TODO: get from auth
        username: 'Creator', // TODO: get from auth
        userType: config.clientType
      })
    } else {
      // For general room joining use join_room
      this.socket.emit('join_room', joinData)
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
    }
    this.isConnected = false
    this.currentConfig = null
    this.connectionPromise = null
    this.listeners.clear()
  }

  // Event management
  on(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set())
    }
    this.listeners.get(event)!.add(callback)

    // Also listen on the actual socket if connected
    if (this.socket) {
      this.socket.on(event, callback as any)
    }
  }

  off(event: string, callback?: Function) {
    if (!this.listeners.has(event)) return

    if (callback) {
      this.listeners.get(event)!.delete(callback)
      // Remove from socket too
      if (this.socket) {
        this.socket.off(event, callback as any)
      }
    } else {
      this.listeners.delete(event)
      // Remove all listeners for this event from socket
      if (this.socket) {
        this.socket.removeAllListeners(event)
      }
    }
  }

  emit(event: string, data: any) {
    if (this.socket && this.isConnected) {
      this.socket.emit(event, data)
      return true
    }
    console.warn(`Cannot emit ${event}: socket not connected`)
    return false
  }

  private emitEvent(event: string, data: any) {
    const listeners = this.listeners.get(event)
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(data)
        } catch (error) {
          console.error(`Error in ${event} listener:`, error)
        }
      })
    }
  }

  // Getters
  getSocket(): Socket | null {
    return this.socket
  }

  getIsConnected(): boolean {
    return this.isConnected
  }

  getCurrentConfig(): SocketConnectionConfig | null {
    return this.currentConfig
  }

  // Streaming-specific methods
  startStreaming(streamId: string, streamKey: string) {
    console.log(`Starting streaming session for room ${streamId}`)
    return this.emit('start_streaming', {
      streamId,
      streamKey,
      timestamp: Date.now()
    })
  }

  stopStreaming(streamId: string) {
    console.log(`Stopping streaming session for room ${streamId}`)
    // Use leave_room_stream to properly cleanup backend resources
    this.emit('leave_room_stream', {
      roomId: streamId
    })

    return this.emit('stop_streaming', {
      streamId,
      timestamp: Date.now()
    })
  }

  async sendStreamChunk(streamId: string, chunkData: ArrayBuffer, chunkNumber: number, mimeType: string): Promise<boolean> {
    console.log(`📡 sendStreamChunk called - streamId: ${streamId}, chunkNumber: ${chunkNumber}`)
    console.log(`🔌 Socket status - connected: ${this.isConnected}, socket exists: ${!!this.socket}`)

    if (!this.socket || !this.isConnected) {
      console.warn('❌ Cannot send chunk: socket not connected')
      return false
    }

    try {
      // Match backend expected format exactly
      const chunkPayload = {
        streamId: streamId, // Backend expects this as roomId internally
        chunkData: chunkData,
        chunkNumber: chunkNumber,
        mimeType: mimeType,
        timestamp: Date.now(),
        size: chunkData.byteLength
      }

      console.log(`📊 Chunk payload:`, {
        streamId: chunkPayload.streamId,
        chunkNumber: chunkPayload.chunkNumber,
        mimeType: chunkPayload.mimeType,
        size: chunkPayload.size,
        timestamp: chunkPayload.timestamp
      })

      console.log(`🚀 Sending chunk #${chunkNumber} (${(chunkData.byteLength / 1024).toFixed(2)}KB) to backend`)

      return new Promise((resolve) => {
        console.log(`⏱️  Setting up timeout and emitting stream_chunk event...`)

        // Add timeout for chunk sending
        const timeout = setTimeout(() => {
          console.warn(`⏰ Chunk #${chunkNumber} send timeout`)
          resolve(false)
        }, 5000) // 5 second timeout

        console.log(`🚀 Emitting 'stream_chunk' event to backend...`)
        this.socket!.emit('stream_chunk', chunkPayload, (acknowledgment: any) => {
          console.log(`📨 Received acknowledgment for chunk #${chunkNumber}:`, acknowledgment)
          clearTimeout(timeout)
          if (acknowledgment?.success) {
            console.log(`✅ Chunk #${chunkNumber} acknowledged by backend`)
            resolve(true)
          } else {
            console.warn(`❌ Chunk #${chunkNumber} not acknowledged:`, acknowledgment)
            resolve(false)
          }
        })

        // If no ack support, resolve immediately
        setTimeout(() => {
          console.log(`⏲️  Auto-resolving chunk #${chunkNumber} after 100ms (no ack expected)`)
          clearTimeout(timeout)
          resolve(true)
        }, 100)
      })
    } catch (error) {
      console.error(`Error sending chunk #${chunkNumber}:`, error)
      return false
    }
  }

  // Common event listeners for streaming (matching backend events)
  onStreamStarted(callback: (data: any) => void) {
    this.on('stream_started', callback)
  }

  onStreamLive(callback: (data: any) => void) {
    this.on('stream_live', callback) // Backend emits this when stream goes live
  }

  onStreamEnded(callback: (data: any) => void) {
    this.on('stream_ended', callback) // Backend emits this when stream ends
  }

  onRoomJoined(callback: (data: any) => void) {
    this.on('room_joined', callback) // Backend confirms room join
  }

  onViewerCountUpdated(callback: (data: { count: number }) => void) {
    this.on('viewer_count_updated', callback)
  }

  onChunkReceived(callback: (data: any) => void) {
    this.on('chunk_received', callback)
  }

  onStreamStats(callback: (data: any) => void) {
    this.on('stream_stats', callback) // Backend provides stream statistics
  }

  onError(callback: (error: any) => void) {
    this.on('error', callback)
  }

  // Request stream stats from backend
  requestStreamStats(streamId: string) {
    return this.emit('request_stream_stats', {
      roomId: streamId
    })
  }
}

// Global socket service instance
let globalSocketService: SocketService | null = null

export function getSocketService(): SocketService {
  if (!globalSocketService) {
    globalSocketService = new SocketService()
  }
  return globalSocketService
}

export default SocketService
