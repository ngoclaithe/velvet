'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { toast } from 'react-hot-toast'
import { getSocketService, type SocketConnectionConfig } from '@/lib/socket'
import type { StreamResponse } from '@/types/streaming'

interface StreamingManagerProps {
  streamData: StreamResponse
  cameraEnabled: boolean
  micEnabled: boolean
  onStatusChange: (connected: boolean) => void
  onViewerCountUpdate: (count: number) => void
}

export function StreamingManager({
  streamData,
  cameraEnabled,
  micEnabled,
  onStatusChange,
  onViewerCountUpdate
}: StreamingManagerProps) {
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [bufferHealth, setBufferHealth] = useState({ queued: 0, sent: 0, failed: 0 })
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const videoPreviewRef = useRef<HTMLVideoElement>(null)
  const chunkCountRef = useRef(0)
  const chunkQueueRef = useRef<Array<{ buffer: ArrayBuffer, number: number, timestamp: number }>>([])
  const processingRef = useRef(false)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  
  const socketService = getSocketService()

  // Optimized chunk settings
  const CHUNK_DURATION = 5000 // 5 seconds - tối ưu cho buffer management
  const MAX_QUEUE_SIZE = 12   // Maximum 12 chunks in queue (60 seconds buffer)
  const CHUNK_SEND_INTERVAL = 200 // 200ms delay between chunk sends
  const RECONNECT_DELAY = 3000

  useEffect(() => {
    initializeStreaming()
    return () => {
      cleanup()
    }
  }, [])

  useEffect(() => {
    onStatusChange(isConnected && isRecording)
  }, [isConnected, isRecording, onStatusChange])

  const initializeStreaming = async () => {
    try {
      console.log('Initializing optimized streaming...')

      const socketConfig: SocketConnectionConfig = {
        accessCode: streamData.streamKey,
        clientType: 'creator',
        streamId: streamData.id,
        streamKey: streamData.streamKey
      }

      setupSocketEventListeners()
      await socketService.connect(socketConfig)

      console.log('Socket connected successfully')
      setIsConnected(true)

      socketService.startStreaming(streamData.id, streamData.streamKey)
      await setupOptimizedMediaCapture()

    } catch (error) {
      console.error('Error initializing streaming:', error)
      toast.error('Không thể khởi tạo streaming')
      setIsConnected(false)
      scheduleReconnect()
    }
  }

  const scheduleReconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
    }
    
    reconnectTimeoutRef.current = setTimeout(() => {
      console.log('Attempting to reconnect...')
      initializeStreaming()
    }, RECONNECT_DELAY)
  }, [])

  const setupSocketEventListeners = () => {
    socketService.on('connect', () => {
      console.log('Socket connected via service')
      setIsConnected(true)
      
      // Clear reconnect timeout on successful connection
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
        reconnectTimeoutRef.current = null
      }
    })

    socketService.on('disconnect', (data: any) => {
      console.log('Socket disconnected:', data.reason)
      setIsConnected(false)
      setIsRecording(false)
      
      // Auto reconnect unless it's intentional disconnect
      if (data.reason !== 'io client disconnect') {
        scheduleReconnect()
      }
    })

    socketService.on('connect_error', (error: any) => {
      console.error('Connection error:', error)
      setIsConnected(false)
      scheduleReconnect()
    })

    socketService.on('reconnect', () => {
      console.log('Socket reconnected successfully')
      setIsConnected(true)
      if (streamData) {
        socketService.startStreaming(streamData.id, streamData.streamKey)
        // Resume recording if media stream exists
        if (mediaStream && !isRecording) {
          startOptimizedRecording(mediaStream)
        }
      }
    })

    socketService.onStreamStarted((data: any) => {
      console.log('Stream session started:', data)
      toast.success('Stream đã khởi tạo thành công!')
    })

    socketService.onViewerCountUpdated((data: { count: number }) => {
      onViewerCountUpdate(data.count)
    })

    socketService.onChunkReceived((data: any) => {
      console.log(`Chunk #${data.chunkNumber} processed successfully`)
      setBufferHealth(prev => ({ ...prev, sent: prev.sent + 1 }))
    })

    socketService.onError((error: any) => {
      console.error('Socket error:', error)
      toast.error('Stream error: ' + (error.message || 'Unknown error'))
      setBufferHealth(prev => ({ ...prev, failed: prev.failed + 1 }))
    })
  }

  const setupOptimizedMediaCapture = async () => {
    try {
      // Enhanced constraints for 1080p quality
      const constraints: MediaStreamConstraints = {
        video: cameraEnabled ? {
          width: { ideal: 1920, min: 1280 },
          height: { ideal: 1080, min: 720 },
          frameRate: { ideal: 30, min: 24 },
          facingMode: 'user',
          // Advanced constraints for better quality
          aspectRatio: { ideal: 16/9 },
          resizeMode: 'crop-and-scale'
        } : false,
        audio: micEnabled ? {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: { ideal: 48000, min: 44100 },
          channelCount: { ideal: 2 }
        } : false
      }

      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      setMediaStream(stream)

      if (videoPreviewRef.current) {
        videoPreviewRef.current.srcObject = stream
        videoPreviewRef.current.muted = true
      }

      await startOptimizedRecording(stream)

    } catch (error) {
      console.error('Error setting up optimized media capture:', error)
      handleMediaError(error)
    }
  }

  const startOptimizedRecording = async (stream: MediaStream) => {
    try {
      const mimeType = getBestSupportedMimeType()
      console.log('Starting optimized recording with MIME type:', mimeType)

      // Enhanced MediaRecorder options
      const options: MediaRecorderOptions = {
        mimeType,
        videoBitsPerSecond: 2500000, // 2.5 Mbps for high quality
        audioBitsPerSecond: 128000   // 128 kbps for crystal clear audio
      }

      const mediaRecorder = new MediaRecorder(stream, options)

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunkCountRef.current++
          
          event.data.arrayBuffer().then(buffer => {
            addChunkToQueue(buffer, chunkCountRef.current, mimeType)
          }).catch(error => {
            console.error('Error converting chunk to buffer:', error)
            setBufferHealth(prev => ({ ...prev, failed: prev.failed + 1 }))
          })
        }
      }

      mediaRecorder.onerror = (event) => {
        console.error('MediaRecorder error:', event)
        toast.error('Recording error occurred')
        setIsRecording(false)
        
        // Try to restart recording
        setTimeout(() => {
          if (stream.active) {
            startOptimizedRecording(stream)
          }
        }, 2000)
      }

      mediaRecorder.onstart = () => {
        console.log('Optimized MediaRecorder started')
        setIsRecording(true)
        startChunkProcessor() // Start processing queued chunks
      }

      mediaRecorder.onstop = () => {
        console.log('MediaRecorder stopped')
        setIsRecording(false)
        processingRef.current = false
      }

      // Start recording with optimized chunk duration
      mediaRecorder.start(CHUNK_DURATION)
      mediaRecorderRef.current = mediaRecorder

      console.log(`Optimized recording started with ${CHUNK_DURATION}ms chunks`)

    } catch (error) {
      console.error('Error starting optimized recording:', error)
      toast.error('Không thể bắt đầu recording')
    }
  }

  const getBestSupportedMimeType = (): string => {
    const types = [
      'video/webm;codecs=vp9,opus',   // Best quality
      'video/webm;codecs=vp8,opus',   // Good compatibility
      'video/webm;codecs=h264,opus',  // Hardware acceleration
      'video/webm',                   // Fallback
      'video/mp4;codecs=h264,aac',    // Alternative
      'video/mp4'                     // Last resort
    ]

    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) {
        console.log('Selected MIME type:', type)
        return type
      }
    }

    console.warn('No optimal MIME type found, using default webm')
    return 'video/webm'
  }

  const addChunkToQueue = (buffer: ArrayBuffer, chunkNumber: number, mimeType: string) => {
    const chunkQueue = chunkQueueRef.current
    
    // Add to queue with timestamp
    chunkQueue.push({
      buffer,
      number: chunkNumber,
      timestamp: Date.now()
    })

    // Update buffer health
    setBufferHealth(prev => ({ ...prev, queued: chunkQueue.length }))

    // Maintain queue size - remove oldest if too large
    if (chunkQueue.length > MAX_QUEUE_SIZE) {
      const removed = chunkQueue.shift()
      console.warn(`Queue overflow: removed chunk #${removed?.number}`)
      setBufferHealth(prev => ({ 
        ...prev, 
        queued: chunkQueue.length,
        failed: prev.failed + 1 
      }))
    }

    console.log(`Chunk #${chunkNumber} queued (${(buffer.byteLength / 1024).toFixed(2)}KB). Queue size: ${chunkQueue.length}`)
  }

  const startChunkProcessor = () => {
    if (processingRef.current) return

    processingRef.current = true
    processChunkQueue()
  }

  const processChunkQueue = async () => {
    while (processingRef.current && isConnected) {
      const chunkQueue = chunkQueueRef.current

      if (chunkQueue.length > 0) {
        const chunk = chunkQueue.shift()
        if (chunk) {
          try {
            await sendChunkWithRetry(chunk.buffer, chunk.number)
            setBufferHealth(prev => ({ 
              ...prev, 
              queued: chunkQueue.length,
              sent: prev.sent + 1 
            }))
          } catch (error) {
            console.error(`Failed to send chunk #${chunk.number}:`, error)
            setBufferHealth(prev => ({ 
              ...prev, 
              failed: prev.failed + 1 
            }))
          }
        }
      }

      // Wait before processing next chunk to avoid overwhelming
      await sleep(CHUNK_SEND_INTERVAL)
    }

    console.log('Chunk processor stopped')
  }

  const sendChunkWithRetry = async (buffer: ArrayBuffer, chunkNumber: number, retries = 3): Promise<void> => {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        if (socketService.getIsConnected()) {
          await socketService.sendStreamChunk(
            streamData.id,
            buffer,
            chunkNumber,
            getBestSupportedMimeType()
          )
          return // Success
        } else {
          throw new Error('Socket not connected')
        }
      } catch (error) {
        console.warn(`Chunk #${chunkNumber} send attempt ${attempt} failed:`, error)
        
        if (attempt === retries) {
          throw error // Final attempt failed
        }
        
        // Wait before retry with exponential backoff
        await sleep(100 * attempt)
      }
    }
  }

  const sleep = (ms: number): Promise<void> => {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  const handleMediaError = (error: any) => {
    if (error instanceof DOMException) {
      switch (error.name) {
        case 'NotAllowedError':
          toast.error('Vui lòng cấp quyền truy cập camera và microphone')
          break
        case 'NotFoundError':
          toast.error('Không tìm thấy camera hoặc microphone')
          break
        case 'NotReadableError':
          toast.error('Camera/microphone đang được sử dụng bởi ứng dụng khác')
          break
        case 'OverconstrainedError':
          toast.error('Thiết bị không hỗ trợ chất lượng yêu cầu')
          break
        default:
          toast.error('Không thể truy cập thiết bị media: ' + error.message)
      }
    } else {
      toast.error('Lỗi không xác định khi setup media')
    }
  }

  const cleanup = () => {
    console.log('Starting comprehensive cleanup...')

    // Clear reconnect timeout
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }

    // Stop chunk processing
    processingRef.current = false

    // Clear chunk queue
    chunkQueueRef.current = []

    // Stop recording
    if (mediaRecorderRef.current) {
      if (mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop()
      }
      mediaRecorderRef.current = null
    }

    // Stop all media tracks
    if (mediaStream) {
      mediaStream.getTracks().forEach(track => {
        track.stop()
        console.log(`Stopped ${track.kind} track`)
      })
      setMediaStream(null)
    }

    // Stop streaming and disconnect socket
    if (socketService.getIsConnected()) {
      socketService.stopStreaming(streamData.id)
      socketService.disconnect()
    }

    setIsConnected(false)
    setIsRecording(false)
    chunkCountRef.current = 0
    setBufferHealth({ queued: 0, sent: 0, failed: 0 })

    console.log('Comprehensive cleanup completed')
  }

  // Update media settings when props change
  useEffect(() => {
    if (mediaStream) {
      const videoTracks = mediaStream.getVideoTracks()
      videoTracks.forEach(track => {
        track.enabled = cameraEnabled
      })

      const audioTracks = mediaStream.getAudioTracks()
      audioTracks.forEach(track => {
        track.enabled = micEnabled
      })

      console.log(`Media settings updated - Camera: ${cameraEnabled}, Mic: ${micEnabled}`)
    }
  }, [cameraEnabled, micEnabled, mediaStream])

  // Monitor buffer health and show warnings
  useEffect(() => {
    if (bufferHealth.queued > MAX_QUEUE_SIZE * 0.8) {
      console.warn('Buffer queue is getting full:', bufferHealth.queued)
    }
  }, [bufferHealth.queued])

  return (
    <div className="streaming-manager">
      {/* Enlarged Video Preview */}
      <div className="relative mb-6">
        <video
          ref={videoPreviewRef}
          autoPlay
          playsInline
          muted
          className="w-full max-w-4xl h-auto rounded-xl border-4 border-purple-500 shadow-2xl mx-auto"
          style={{ display: cameraEnabled ? 'block' : 'none' }}
        />
        {!cameraEnabled && (
          <div className="w-full max-w-4xl h-96 rounded-xl border-4 border-gray-300 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center shadow-2xl mx-auto">
            <div className="text-center">
              <div className="text-6xl mb-4">📹</div>
              <span className="text-gray-600 text-xl font-medium">Camera đã tắt</span>
            </div>
          </div>
        )}
        
        {/* Simplified Status Indicators */}
        <div className="absolute top-4 left-4 flex gap-3">
          <div className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
            isRecording
              ? 'bg-red-500 text-white animate-pulse shadow-xl'
              : isConnected
              ? 'bg-green-500 text-white shadow-lg'
              : 'bg-gray-500 text-white'
          }`}>
            {isRecording ? '🔴 ĐANG LIVE' : isConnected ? '✅ SẴN SÀNG' : '⚫ OFFLINE'}
          </div>

          {cameraEnabled && isRecording && (
            <div className="px-3 py-2 rounded-lg text-sm font-semibold bg-blue-500 text-white shadow-lg">
              📹 1080p HD
            </div>
          )}

          {micEnabled && isRecording && (
            <div className="px-3 py-2 rounded-lg text-sm font-semibold bg-purple-500 text-white shadow-lg">
              🎤 128k Audio
            </div>
          )}
        </div>
      </div>

      {/* Simplified Stream Quality Info - Only when recording */}
      {isRecording && (
        <div className="mt-6 text-center">
          <div className="inline-flex items-center gap-4 px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full text-white shadow-lg">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
              <span className="font-semibold">Streaming chất lượng cao 1080p</span>
            </div>
            <div className="text-white/80 text-sm">
              📹 2.5Mbps • 🎤 128kbps
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default StreamingManager
