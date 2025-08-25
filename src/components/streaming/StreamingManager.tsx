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
  const initSegmentSentRef = useRef(false)
  
  const socketService = getSocketService()

  const CHUNK_DURATION = 5000
  const MAX_QUEUE_SIZE = 10
  const CHUNK_SEND_INTERVAL = 50
  const RECONNECT_DELAY = 3000
  const MIN_BUFFER_SIZE = 3

  useEffect(() => {
    initializeStreaming()
    return () => {
      cleanup()
    }
  }, [])

  useEffect(() => {
    if (isRecording && socketService.getIsConnected()) {
      const statsInterval = setInterval(() => {
        socketService.requestStreamStats(streamData.id)
      }, 10000)

      return () => clearInterval(statsInterval)
    }
  }, [isRecording, streamData.id])

  useEffect(() => {
    onStatusChange(isConnected && isRecording)
  }, [isConnected, isRecording, onStatusChange])

  const initializeStreaming = async () => {
    try {
      const socketConfig: SocketConnectionConfig = {
        accessCode: streamData.streamKey,
        clientType: 'creator',
        streamId: streamData.id,
        streamKey: streamData.streamKey
      }

      setupSocketEventListeners()
      await socketService.connect(socketConfig)

      const connected = socketService.getIsConnected()
      setIsConnected(connected)

      socketService.startStreaming(streamData.id, streamData.streamKey)
      await setupOptimizedMediaCapture()

    } catch (error) {
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
      initializeStreaming()
    }, RECONNECT_DELAY)
  }, [])

  const setupSocketEventListeners = () => {
    socketService.on('connect', () => {
      const connected = socketService.getIsConnected()
      setIsConnected(connected)

      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
        reconnectTimeoutRef.current = null
      }

      if (isRecording && chunkQueueRef.current.length > 0 && !processingRef.current) {
        startChunkProcessor()
      }
    })

    socketService.onRoomJoined((data: any) => {
      const connected = socketService.getIsConnected()
      setIsConnected(connected)
      
      if (isRecording && chunkQueueRef.current.length > 0 && !processingRef.current) {
        startChunkProcessor()
      }
    })

    socketService.on('disconnect', (data: any) => {
      setIsConnected(false)
      setIsRecording(false)
      processingRef.current = false
      
      if (data.reason !== 'io client disconnect') {
        scheduleReconnect()
      }
    })

    socketService.on('connect_error', (error: any) => {
      setIsConnected(false)
      processingRef.current = false
      scheduleReconnect()
    })

    socketService.on('reconnect', () => {
      const connected = socketService.getIsConnected()
      setIsConnected(connected)
      
      if (streamData) {
        socketService.startStreaming(streamData.id, streamData.streamKey)
        if (mediaStream && !isRecording) {
          startOptimizedRecording(mediaStream)
        }
        if (chunkQueueRef.current.length > 0 && !processingRef.current) {
          startChunkProcessor()
        }
      }
    })

    socketService.onStreamStarted((data: any) => {
      toast.success('Stream đã khởi tạo thành công!')
    })

    socketService.onStreamLive((data: any) => {
      toast.success('Stream đã LIVE! Khán giả có thể xem được rồi 🎉')
    })

    socketService.onStreamEnded((data: any) => {
      setIsRecording(false)
      setIsConnected(false)
      if (data.reason === 'creator_left') {
        toast('Stream đã kết thúc', { icon: 'ℹ️' })
      }
    })

    socketService.onStreamStats((stats: any) => {
      if (stats.bufferHealth) {
        setBufferHealth(prev => ({
          ...prev,
          sent: stats.totalChunks || prev.sent,
          failed: stats.dropCount || prev.failed
        }))
      }
    })

    socketService.onViewerCountUpdated((data: { count: number }) => {
      onViewerCountUpdate(data.count)
    })

    socketService.onChunkReceived((data: any) => {
      setBufferHealth(prev => ({ ...prev, sent: prev.sent + 1 }))
    })

    socketService.onError((error: any) => {
      toast.error('Stream error: ' + (error.message || 'Unknown error'))
      setBufferHealth(prev => ({ ...prev, failed: prev.failed + 1 }))
    })
  }

  const setupOptimizedMediaCapture = async () => {
    try {
      const constraints: MediaStreamConstraints = {
        video: cameraEnabled ? {
          width: { ideal: 1920, min: 1280 },
          height: { ideal: 1080, min: 720 },
          frameRate: { ideal: 30, min: 24 },
          facingMode: 'user',
          aspectRatio: { ideal: 16/9 }
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
      handleMediaError(error)
    }
  }

  const startOptimizedRecording = async (stream: MediaStream) => {
    try {
      const mimeType = getBestSupportedMimeType()

      const options: MediaRecorderOptions = {
        mimeType,
        videoBitsPerSecond: 2500000,
        audioBitsPerSecond: 128000
      }

      const mediaRecorder = new MediaRecorder(stream, options)

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          event.data.arrayBuffer().then(buffer => {
            if (!initSegmentSentRef.current && mimeType.includes('mp4')) {
              sendMp4InitSegment(buffer)
              initSegmentSentRef.current = true
            } else {
              chunkCountRef.current++
              addChunkToQueue(buffer, chunkCountRef.current, mimeType)
            }
          }).catch(error => {
            setBufferHealth(prev => ({ ...prev, failed: prev.failed + 1 }))
          })
        }
      }

      mediaRecorder.onerror = (event) => {
        toast.error('Recording error occurred')
        setIsRecording(false)
        
        setTimeout(() => {
          if (stream.active) {
            startOptimizedRecording(stream)
          }
        }, 2000)
      }

      mediaRecorder.onstart = () => {
        setIsRecording(true)
        initSegmentSentRef.current = false

        if (socketService.getIsConnected()) {
          startChunkProcessor()
        }
      }

      mediaRecorder.onstop = () => {
        setIsRecording(false)
        processingRef.current = false
      }

      mediaRecorder.start(CHUNK_DURATION)
      mediaRecorderRef.current = mediaRecorder

    } catch (error) {
      toast.error('Không thể bắt đầu recording')
    }
  }

  const getBestSupportedMimeType = (): string => {
    const types = [
      'video/mp4;codecs=h264,aac',
      'video/mp4;codecs=avc1.42E01E,mp4a.40.2',
      'video/mp4',
      'video/webm;codecs=h264,opus',
      'video/webm;codecs=h264,aac',
      'video/webm;codecs=vp9,opus',
      'video/webm;codecs=vp8,opus',
      'video/webm'
    ]

    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) {
        return type
      }
    }

    return 'video/mp4'
  }

  const sendMp4InitSegment = async (initBuffer: ArrayBuffer) => {
    try {
      if (socketService.getIsConnected()) {
        await socketService.sendMp4InitSegment(streamData.id, initBuffer)
      }
    } catch (error) {
      setBufferHealth(prev => ({ ...prev, failed: prev.failed + 1 }))
    }
  }

  const addChunkToQueue = (buffer: ArrayBuffer, chunkNumber: number, mimeType: string) => {
    const chunkQueue = chunkQueueRef.current
    
    chunkQueue.push({
      buffer,
      number: chunkNumber,
      timestamp: Date.now()
    })

    setBufferHealth(prev => ({ ...prev, queued: chunkQueue.length }))

    if (chunkQueue.length > MAX_QUEUE_SIZE) {
      const removed = chunkQueue.shift()
      setBufferHealth(prev => ({ 
        ...prev, 
        queued: chunkQueue.length,
        failed: prev.failed + 1 
      }))
    }

    if (socketService.getIsConnected() && !processingRef.current && isRecording) {
      startChunkProcessor()
    }
  }

  const startChunkProcessor = () => {
    if (processingRef.current) {
      return
    }

    processingRef.current = true
    processChunkQueue()
  }

  const processChunkQueue = async () => {
    const socketConnected = socketService.getIsConnected()

    while (processingRef.current && socketConnected) {
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
            setBufferHealth(prev => ({
              ...prev,
              failed: prev.failed + 1
            }))
          }
        }
      }

      if (!socketService.getIsConnected()) {
        break
      }

      await sleep(CHUNK_SEND_INTERVAL)
    }
  }

  const sendChunkWithRetry = async (buffer: ArrayBuffer, chunkNumber: number, retries = 3): Promise<void> => {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        if (socketService.getIsConnected()) {
          const success = await socketService.sendStreamChunk(
            streamData.id,
            buffer,
            chunkNumber,
            getBestSupportedMimeType()
          )

          if (success) {
            return
          } else {
            throw new Error(`Backend rejected chunk #${chunkNumber}`)
          }
        } else {
          throw new Error('Socket not connected')
        }
      } catch (error) {
        if (attempt === retries) {
          throw error
        }

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
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }

    processingRef.current = false
    chunkQueueRef.current = []

    if (mediaRecorderRef.current) {
      if (mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop()
      }
      mediaRecorderRef.current = null
    }

    if (mediaStream) {
      mediaStream.getTracks().forEach(track => {
        track.stop()
      })
      setMediaStream(null)
    }

    if (socketService.getIsConnected()) {
      socketService.stopStreaming(streamData.id)
      socketService.disconnect()
    }

    setIsConnected(false)
    setIsRecording(false)
    chunkCountRef.current = 0
    setBufferHealth({ queued: 0, sent: 0, failed: 0 })
  }

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
    }
  }, [cameraEnabled, micEnabled, mediaStream])

  useEffect(() => {
    if (bufferHealth.queued > MAX_QUEUE_SIZE * 0.8) {
    }
  }, [bufferHealth.queued])

  return (
    <div className="streaming-manager">
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
