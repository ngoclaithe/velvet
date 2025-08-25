// Example usage of the new SocketService
// This file demonstrates how to use the SocketService for different client types

import { getSocketService, type SocketConnectionConfig } from '@/lib/socket'

// Example 1: Creator connecting for streaming
export async function connectAsCreator(streamId: string, streamKey: string) {
  const socketService = getSocketService()
  
  const config: SocketConnectionConfig = {
    accessCode: streamKey,
    clientType: 'creator',
    streamId: streamId,
    streamKey: streamKey
  }
  
  try {
    // Setup event listeners before connecting
    socketService.onStreamStarted((data) => {
      console.log('Stream started:', data)
    })
    
    socketService.onViewerCountUpdated((data) => {
      console.log('Viewer count updated:', data.count)
    })
    
    socketService.onError((error) => {
      console.error('Stream error:', error)
    })
    
    // Connect
    await socketService.connect(config)
    console.log('Creator connected successfully')
    
    // Start streaming
    socketService.startStreaming(streamId, streamKey)
    
    return socketService
  } catch (error) {
    console.error('Failed to connect as creator:', error)
    throw error
  }
}

// Example 2: Viewer connecting to watch a stream
export async function connectAsViewer(accessCode: string) {
  const socketService = getSocketService()
  
  const config: SocketConnectionConfig = {
    accessCode: accessCode,
    clientType: 'viewer'
  }
  
  try {
    // Setup viewer-specific event listeners
    socketService.on('user_joined', (data) => {
      console.log('User joined:', data)
    })
    
    socketService.on('user_left', (data) => {
      console.log('User left:', data)
    })
    
    socketService.onViewerCountUpdated((data) => {
      console.log('Viewer count updated:', data.count)
    })
    
    // Connect
    await socketService.connect(config)
    console.log('Viewer connected successfully')
    
    return socketService
  } catch (error) {
    console.error('Failed to connect as viewer:', error)
    throw error
  }
}

// Example 3: Reconnection handling
export function setupReconnectionHandling(socketService: ReturnType<typeof getSocketService>) {
  socketService.on('disconnect', (data) => {
    console.log('Disconnected:', data.reason)
    // Handle UI updates for disconnect state
  })
  
  socketService.on('reconnect', () => {
    console.log('Reconnected successfully')
    // Handle UI updates for reconnect state
  })
  
  socketService.on('connect_error', (error) => {
    console.error('Connection error:', error)
    // Handle connection error UI
  })
  
  socketService.on('reconnect_failed', () => {
    console.error('Reconnection failed')
    // Handle failed reconnection UI
  })
}

// Example 4: Cleanup when component unmounts
export function cleanupSocketConnection() {
  const socketService = getSocketService()
  
  // Disconnect and cleanup
  socketService.disconnect()
  console.log('Socket connection cleaned up')
}

// Example 5: Send custom events (if needed)
export function sendCustomEvent(eventName: string, data: any) {
  const socketService = getSocketService()
  
  if (socketService.getIsConnected()) {
    const success = socketService.emit(eventName, data)
    if (!success) {
      console.warn(`Failed to send event: ${eventName}`)
    }
  } else {
    console.warn('Cannot send event: not connected')
  }
}

// Example 6: Check connection status
export function getConnectionStatus() {
  const socketService = getSocketService()
  
  return {
    isConnected: socketService.getIsConnected(),
    currentConfig: socketService.getCurrentConfig(),
    socket: socketService.getSocket()
  }
}
