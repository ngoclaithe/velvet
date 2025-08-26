import { io, Socket } from 'socket.io-client'

export interface SocketConnectionConfig {
  accessCode?: string
  clientType?: 'creator' | 'viewer' | 'client'
  streamId?: string
  streamKey?: string
}

export interface ChatMessage {
  id: string
  userId: string
  username: string
  displayName: string
  message: string
  timestamp: string
  type: 'message' | 'gift' | 'tip' | 'system'
  giftType?: string
  amount?: number
  avatar?: string
}

type EventCallback = (data: any) => void
type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error'

export class WebSocketClient {
  private socket: Socket | null = null
  private _isConnected: boolean = false
  private currentUserId: string | null = null
  private listeners: Map<string, Set<EventCallback>> = new Map()
  private connectionPromise: Promise<Socket> | null = null
  private status: ConnectionStatus = 'disconnected'

  constructor() {
    this.socket = null
    this._isConnected = false
    this.currentUserId = null
    this.listeners = new Map()
    this.connectionPromise = null
    this.status = 'disconnected'
  }

  async connect(userId?: string): Promise<Socket> {
    if (this.socket && this._isConnected && this.currentUserId === userId) {
      return this.socket
    }

    this.disconnect()
    this.currentUserId = userId || null

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
        query: userId ? {
          userId: userId
        } : {}
      })

      this.socket.on('connect', () => {
        this._isConnected = true
        this.status = 'connected'
        this.emitStatusChange()
        resolve(this.socket!)
      })

      this.socket.on('disconnect', (reason) => {
        this._isConnected = false
        this.status = 'disconnected'
        this.emitStatusChange()
        this.emitEvent('disconnect', { reason })
      })

      this.socket.on('connect_error', (error) => {
        this._isConnected = false
        this.status = 'error'
        this.emitStatusChange()
        this.emitEvent('connect_error', error)
        reject(error)
      })

      this.socket.on('reconnect', () => {
        this._isConnected = true
        this.status = 'connected'
        this.emitStatusChange()
        this.emitEvent('reconnect', {})
      })

      this.socket.on('reconnect_error', (error) => {
        this.emitEvent('reconnect_error', error)
      })

      this.socket.on('reconnect_failed', () => {
        this.emitEvent('reconnect_failed', {})
      })

      // Setup all existing listeners on the new socket
      this.listeners.forEach((callbacks, event) => {
        callbacks.forEach(callback => {
          this.socket!.on(event, callback as any)
        })
      })
    })

    return this.connectionPromise
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
    }
    this._isConnected = false
    this.status = 'disconnected'
    this.currentUserId = null
    this.connectionPromise = null
    this.emitStatusChange()
  }

  on(event: string, callback: EventCallback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set())
    }
    this.listeners.get(event)!.add(callback)

    if (this.socket) {
      this.socket.on(event, callback as any)
    }
  }

  off(event: string, callback?: EventCallback) {
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
    if (this.socket && this._isConnected) {
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
          console.error(`Error in ${event} listener:`, error)
        }
      })
    }
  }

  private emitStatusChange() {
    const listeners = this.listeners.get('status_change')
    if (listeners) {
      listeners.forEach(callback => callback(this.status))
    }
  }

  getStatus(): ConnectionStatus {
    return this.status
  }

  isConnected(): boolean {
    return this._isConnected && this.socket?.connected === true
  }
}

// Global WebSocket instance
let globalWs: WebSocketClient | null = null

export function getWebSocket(): WebSocketClient {
  if (!globalWs) {
    globalWs = new WebSocketClient()
  }
  return globalWs
}

// WebSocket hooks for React components
export function useWebSocket() {
  return getWebSocket()
}

// Specific WebSocket handlers for chat functionality following the user's required flow
export const chatWebSocket = {
  // Tham gia phòng chat - Client gửi lên: { streamId: 'ID_CUA_STREAM' }
  joinStreamChat: (streamId: string) => {
    const ws = getWebSocket()
    return ws.emit('join_stream_chat', { streamId })
  },

  // Rời phòng chat - Client gửi lên: { streamId: 'ID_CUA_STREAM' }
  leaveStreamChat: (streamId: string) => {
    const ws = getWebSocket()
    return ws.emit('leave_stream_chat', { streamId })
  },

  // Gửi tin nhắn - Client gửi lên: { streamId, userId, username, displayName, message, timestamp, type, avatar }
  sendChatMessage: (streamId: string, messageData: {
    userId: string
    username: string
    displayName: string
    message: string
    timestamp: string
    type?: string
    avatar?: string
  }) => {
    const ws = getWebSocket()
    return ws.emit('chat_message', {
      streamId,
      userId: messageData.userId,
      username: messageData.username,
      displayName: messageData.displayName,
      message: messageData.message,
      timestamp: messageData.timestamp,
      type: messageData.type || 'message',
      avatar: messageData.avatar
    })
  },

  // Gửi tin nhắn trực tiếp
  sendDirectMessage: (recipientId: string, message: string) => {
    const ws = getWebSocket()
    return ws.emit('direct_message', { recipientId, message })
  },

  // L��ng nghe tin nhắn chat mới - Backend emits 'stream_chat_message'
  onChatMessage: (callback: EventCallback) => {
    const ws = getWebSocket()
    ws.on('stream_chat_message', callback)
  },

  // Lắng nghe tin nhắn trực tiếp
  onDirectMessage: (callback: EventCallback) => {
    const ws = getWebSocket()
    ws.on('direct_message', callback)
  },

  // Lắng nghe cập nhật số người dùng trong phòng chat
  onUserCountUpdate: (callback: EventCallback) => {
    const ws = getWebSocket()
    ws.on('chat_user_count', callback)
  },

  // Lắng nghe khi người dùng tham gia phòng chat
  onUserJoined: (callback: EventCallback) => {
    const ws = getWebSocket()
    ws.on('user_joined_chat', callback)
  },

  // Lắng nghe khi người dùng rời phòng chat
  onUserLeft: (callback: EventCallback) => {
    const ws = getWebSocket()
    ws.on('user_left_chat', callback)
  },
}

export const streamWebSocket = {
  subscribeToStreamUpdates: (streamId: string) => {
    const ws = getWebSocket()
    return ws.emit('subscribe_stream', { streamId })
  },

  unsubscribeFromStreamUpdates: (streamId: string) => {
    const ws = getWebSocket()
    return ws.emit('unsubscribe_stream', { streamId })
  },

  onStreamStart: (callback: EventCallback) => {
    const ws = getWebSocket()
    ws.on('stream_start', callback)
  },

  onStreamEnd: (callback: EventCallback) => {
    const ws = getWebSocket()
    ws.on('stream_end', callback)
  },

  onViewerCountUpdate: (callback: EventCallback) => {
    const ws = getWebSocket()
    ws.on('viewer_count_update', callback)
  },
}

export const notificationWebSocket = {
  onNotification: (callback: EventCallback) => {
    const ws = getWebSocket()
    ws.on('notification', callback)
  },

  onTipReceived: (callback: EventCallback) => {
    const ws = getWebSocket()
    ws.on('tip_received', callback)
  },

  onGiftReceived: (callback: EventCallback) => {
    const ws = getWebSocket()
    ws.on('gift_received', callback)
  },

  onNewFollower: (callback: EventCallback) => {
    const ws = getWebSocket()
    ws.on('new_follower', callback)
  },
}
