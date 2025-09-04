import { io, Socket } from 'socket.io-client'

export interface SocketConnectionConfig {
  accessCode?: string
  clientType?: 'creator' | 'viewer' | 'client'
  streamId?: string
  streamKey?: string
  socketEndpoint?: string  // Use this endpoint path instead of constructing from streamKey
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
    if (this.socket && 
        this.currentConfig?.accessCode === config.accessCode && 
        this.currentConfig?.clientType === config.clientType &&
        this.isConnected) {
      return this.socket
    }

    this.disconnect()
    this.currentConfig = config

    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api2.scoliv2.com'
    const socketUrl = baseUrl.replace('/api/v2', '').replace('http://', 'ws://').replace('https://', 'wss://')

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
        this.isConnected = true
        this.joinRoom(config)
        resolve(this.socket!)
      })

      this.socket.on('disconnect', (reason) => {
        this.isConnected = false
        this.emitEvent('disconnect', { reason })
      })

      this.socket.on('connect_error', (error) => {
        this.isConnected = false
        this.emitEvent('connect_error', error)
        reject(error)
      })

      this.socket.on('reconnect', () => {
        this.isConnected = true
        
        if (this.currentConfig) {
          this.joinRoom(this.currentConfig)
        }
        
        this.emitEvent('reconnect', {})
      })

      this.socket.on('reconnect_error', (error) => {
        this.emitEvent('reconnect_error', error)
      })

      this.socket.on('reconnect_failed', () => {
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

    if (config.accessCode) {
      joinData.accessCode = config.accessCode
    }

    if (config.streamId) {
      joinData.streamId = config.streamId
    }

    if (config.streamKey) {
      joinData.streamKey = config.streamKey
    }
    let roomId: string
    if (config.socketEndpoint) {
      roomId = config.streamKey || 'unknown'
      console.log('🔌 Đây là streamKey as roomId:', roomId)
    } else if (config.clientType === 'creator') {
      roomId = config.streamKey || 'unknown'
      console.log('Đây là streamKey as roomId::', roomId)
    } else {
      // roomId = config.streamId || config.streamKey || config.accessCode || 'unknown'
      roomId = config.streamKey || 'unknow'
      console.log('Đây là streamKey as roomId:', roomId)
    }

    if (config.clientType === 'creator' || config.streamId) {
      this.socket.emit('join_room_stream', {
        roomId: roomId,
        userId: config.clientType === 'creator' ? 'creator_user' : 'viewer_user',
        username: config.clientType === 'creator' ? 'Creator' : 'Viewer',
        userType: config.clientType
      })
    } else {
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

  on(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set())
    }
    this.listeners.get(event)!.add(callback)

    if (this.socket) {
      this.socket.on(event, callback as any)
    }
  }

  off(event: string, callback?: Function) {
    if (!this.listeners.has(event)) return

    if (callback) {
      this.listeners.get(event)!.delete(callback)
      if (this.socket) {
        this.socket.off(event, callback as any)
      }
    } else {
      this.listeners.delete(event)
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
    return false
  }

  private emitEvent(event: string, data: any) {
    const listeners = this.listeners.get(event)
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(data)
        } catch (error) {
        }
      })
    }
  }

  getSocket(): Socket | null {
    return this.socket
  }

  getIsConnected(): boolean {
    return this.isConnected
  }

  getCurrentConfig(): SocketConnectionConfig | null {
    return this.currentConfig
  }

  startStreaming(streamId: string, streamKey: string) {
    return this.emit('start_streaming', {
      streamId,
      streamKey,
      timestamp: Date.now()
    })
  }

  stopStreaming(streamKey: string, streamId?: string) {
    // Use streamKey for leaving room (consistent with joining by streamKey for creators)
    this.emit('leave_room_stream', {
      roomId: streamKey
    })

    return this.emit('stop_streaming', {
      streamKey,
      streamId,
      timestamp: Date.now()
    })
  }

  async sendMp4InitSegment(roomId: string, initData: ArrayBuffer): Promise<boolean> {
    if (!this.socket || !this.isConnected) {
      return false
    }

    try {
      const initPayload = {
        roomId: roomId,
        initData: initData,
        timestamp: Date.now(),
        size: initData.byteLength
      }

      return new Promise((resolve) => {
        const timeout = setTimeout(() => {
          resolve(false)
        }, 5000)

        this.socket!.emit('mp4_init_segment', initPayload, (acknowledgment: any) => {
          clearTimeout(timeout)
          if (acknowledgment?.success) {
            resolve(true)
          } else {
            resolve(false)
          }
        })

        setTimeout(() => {
          clearTimeout(timeout)
          resolve(true)
        }, 100)
      })
    } catch (error) {
      return false
    }
  }

  async sendStreamChunk(streamId: number, streamKey: string, chunkData: ArrayBuffer, chunkNumber: number, mimeType: string): Promise<boolean> {
    if (!this.socket || !this.isConnected) {
      return false
    }

    try {
      const chunkPayload = {
        streamId: streamId,
        streamKey: streamKey,
        chunkData: chunkData,
        chunkNumber: chunkNumber,
        mimeType: mimeType,
        timestamp: Date.now(),
        size: chunkData.byteLength
      }

      return new Promise((resolve) => {
        const timeout = setTimeout(() => {
          resolve(false)
        }, 5000)

        this.socket!.emit('stream_chunk', chunkPayload, (acknowledgment: any) => {
          clearTimeout(timeout)
          if (acknowledgment?.success) {
            resolve(true)
          } else {
            resolve(false)
          }
        })

        setTimeout(() => {
          clearTimeout(timeout)
          resolve(true)
        }, 100)
      })
    } catch (error) {
      return false
    }
  }

  onStreamStarted(callback: (data: any) => void) {
    this.on('stream_started', callback)
  }

  onStreamLive(callback: (data: any) => void) {
    this.on('stream_live', callback)
  }

  onStreamEnded(callback: (data: any) => void) {
    this.on('stream_ended', callback)
  }

  onRoomJoined(callback: (data: any) => void) {
    this.on('room_joined', callback)
  }

  onViewerCountUpdated(callback: (data: { count: number }) => void) {
    this.on('viewer_count_updated', callback)
  }

  onChunkReceived(callback: (data: any) => void) {
    this.on('chunk_received', callback)
  }

  onStreamStats(callback: (data: any) => void) {
    this.on('stream_stats', callback)
  }

  onError(callback: (error: any) => void) {
    this.on('error', callback)
  }

  requestStreamStats(streamId: string) {
    return this.emit('request_stream_stats', {
      roomId: streamId
    })
  }
}

let globalSocketService: SocketService | null = null

export function getSocketService(): SocketService {
  if (!globalSocketService) {
    globalSocketService = new SocketService()
  }
  return globalSocketService
}

export default SocketService
