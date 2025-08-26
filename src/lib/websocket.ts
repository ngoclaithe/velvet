import type { WebSocketMessage } from '@/types/api'

type EventCallback = (data: any) => void
type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error'

interface WebSocketOptions {
  url: string
  protocols?: string[]
  reconnectInterval?: number
  maxReconnectAttempts?: number
  heartbeatInterval?: number
}

export class WebSocketClient {
  private ws: WebSocket | null = null
  private options: Required<WebSocketOptions>
  private listeners: Map<string, Set<EventCallback>> = new Map()
  private status: ConnectionStatus = 'disconnected'
  private reconnectAttempts = 0
  private reconnectTimer: NodeJS.Timeout | null = null
  private heartbeatTimer: NodeJS.Timeout | null = null
  private userId: string | null = null

  constructor(options: WebSocketOptions) {
    this.options = {
      protocols: [],
      reconnectInterval: 3000,
      maxReconnectAttempts: 10,
      heartbeatInterval: 30000,
      ...options,
    }
  }

  connect(userId?: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        resolve()
        return
      }

      this.userId = userId || null
      this.status = 'connecting'
      this.emitStatusChange()

      try {
        this.ws = new WebSocket(this.options.url, this.options.protocols)

        this.ws.onopen = () => {
          this.status = 'connected'
          this.reconnectAttempts = 0
          this.emitStatusChange()
          this.startHeartbeat()
          
          // Send authentication if userId is provided
          if (this.userId) {
            this.send('auth', { userId: this.userId })
          }

          resolve()
        }

        this.ws.onmessage = (event) => {
          try {
            const message: WebSocketMessage = JSON.parse(event.data)
            this.handleMessage(message)
          } catch (error) {
            console.error('Failed to parse WebSocket message:', error)
          }
        }

        this.ws.onclose = (event) => {
          this.status = 'disconnected'
          this.emitStatusChange()
          this.stopHeartbeat()

          if (!event.wasClean && this.shouldReconnect()) {
            this.scheduleReconnect()
          }
        }

        this.ws.onerror = (error) => {
          this.status = 'error'
          this.emitStatusChange()
          console.error('WebSocket error:', error)
          reject(error)
        }
      } catch (error) {
        this.status = 'error'
        this.emitStatusChange()
        reject(error)
      }
    })
  }

  disconnect() {
    this.stopReconnect()
    this.stopHeartbeat()

    if (this.ws) {
      this.ws.close(1000, 'Client disconnect')
      this.ws = null
    }

    this.status = 'disconnected'
    this.emitStatusChange()
  }

  send(type: string, payload: any, targetUserId?: string, streamId?: string) {
    if (this.ws?.readyState !== WebSocket.OPEN) {
      console.warn('WebSocket is not connected')
      return false
    }

    const message: WebSocketMessage = {
      type,
      payload,
      timestamp: new Date(),
      userId: targetUserId,
      streamId,
    }

    try {
      this.ws.send(JSON.stringify(message))
      return true
    } catch (error) {
      console.error('Failed to send WebSocket message:', error)
      return false
    }
  }

  on(event: string, callback: EventCallback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set())
    }
    this.listeners.get(event)!.add(callback)
  }

  off(event: string, callback?: EventCallback) {
    if (!this.listeners.has(event)) return

    if (callback) {
      this.listeners.get(event)!.delete(callback)
    } else {
      this.listeners.delete(event)
    }
  }

  private handleMessage(message: WebSocketMessage) {
    const listeners = this.listeners.get(message.type)
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(message.payload)
        } catch (error) {
          console.error(`Error in ${message.type} listener:`, error)
        }
      })
    }

    // Handle special message types
    switch (message.type) {
      case 'ping':
        this.send('pong', {})
        break
      case 'auth_success':
        console.log('WebSocket authentication successful')
        break
      case 'auth_failed':
        console.error('WebSocket authentication failed')
        this.disconnect()
        break
    }
  }

  private shouldReconnect(): boolean {
    return this.reconnectAttempts < this.options.maxReconnectAttempts
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) return

    this.reconnectAttempts++
    const delay = this.options.reconnectInterval * Math.pow(1.5, this.reconnectAttempts - 1)

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null
      this.connect(this.userId || undefined).catch(() => {
        // Reconnection failed, will try again if attempts remaining
      })
    }, delay)
  }

  private stopReconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
  }

  private startHeartbeat() {
    this.heartbeatTimer = setInterval(() => {
      this.send('ping', {})
    }, this.options.heartbeatInterval)
  }

  private stopHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer)
      this.heartbeatTimer = null
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
    return this.status === 'connected' && this.ws?.readyState === WebSocket.OPEN
  }
}

// Global WebSocket instance
let globalWs: WebSocketClient | null = null

export function getWebSocket(): WebSocketClient {
  if (!globalWs) {
    const wsUrl = process.env.NEXT_PUBLIC_WEBSOCKET_URL || 'ws://localhost:5000'
    globalWs = new WebSocketClient({ url: wsUrl })
  }
  return globalWs
}

// WebSocket hooks for React components
export function useWebSocket() {
  return getWebSocket()
}

// Specific WebSocket handlers for different features
export const chatWebSocket = {
  joinStreamChat: (streamId: string) => {
    const ws = getWebSocket()
    ws.send('join_stream_chat', { streamId })
  },

  leaveStreamChat: (streamId: string) => {
    const ws = getWebSocket()
    ws.send('leave_stream_chat', { streamId })
  },

  sendChatMessage: (streamId: string, message: string) => {
    const ws = getWebSocket()
    ws.send('chat_message', { streamId, message })
  },

  sendDirectMessage: (recipientId: string, message: string) => {
    const ws = getWebSocket()
    ws.send('direct_message', { recipientId, message })
  },

  onChatMessage: (callback: EventCallback) => {
    const ws = getWebSocket()
    ws.on('chat_message', callback)
  },

  onDirectMessage: (callback: EventCallback) => {
    const ws = getWebSocket()
    ws.on('direct_message', callback)
  },
}

export const streamWebSocket = {
  subscribeToStreamUpdates: (streamId: string) => {
    const ws = getWebSocket()
    ws.send('subscribe_stream', { streamId })
  },

  unsubscribeFromStreamUpdates: (streamId: string) => {
    const ws = getWebSocket()
    ws.send('unsubscribe_stream', { streamId })
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
