'use client'

import { useState, useEffect, useRef } from 'react'
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
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const videoPreviewRef = useRef<HTMLVideoElement>(null)
  const chunkCountRef = useRef(0)
  const socketService = getSocketService()

  // Delay config - 7 giây cho mỗi chunk
  const CHUNK_DURATION = 7000 // 7 seconds

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
      console.log('Initializing streaming with SocketService...')

      // Configure socket connection for creator
      const socketConfig: SocketConnectionConfig = {
        accessCode: streamData.streamKey,
        clientType: 'creator',
        streamId: streamData.id,
        streamKey: streamData.streamKey
      }

      // Setup event listeners before connecting
      setupSocketEventListeners()

      // Connect to socket service
      await socketService.connect(socketConfig)

      console.log('Socket connected successfully')
      setIsConnected(true)

      // Start streaming session
      socketService.startStreaming(streamData.id, streamData.streamKey)

      // Setup media capture after socket connected
      await setupMediaCapture()

    } catch (error) {
      console.error('Error initializing streaming:', error)
      toast.error('Không thể khởi tạo streaming')
      setIsConnected(false)
    }
  }

  const setupSocketEventListeners = () => {
    // Connection events
    socketService.on('connect', () => {
      console.log('Socket connected via service')
      setIsConnected(true)
    })

    socketService.on('disconnect', (data: any) => {
      console.log('Socket disconnected:', data.reason)
      setIsConnected(false)
      setIsRecording(false)
    })

    socketService.on('connect_error', (error: any) => {
      console.error('Connection error:', error)
      toast.error('Không thể kết nối tới server streaming')
      setIsConnected(false)
    })

    socketService.on('reconnect', () => {
      console.log('Socket reconnected successfully')
      setIsConnected(true)
      // Restart streaming session after reconnection
      if (streamData) {
        socketService.startStreaming(streamData.id, streamData.streamKey)
      }
    })

    // Streaming events
    socketService.onStreamStarted((data: any) => {
      console.log('Stream session started:', data)
      toast.success('Stream session đã được khởi tạo!')
    })

    socketService.onViewerCountUpdated((data: { count: number }) => {
      onViewerCountUpdate(data.count)
    })

    socketService.onChunkReceived((data: any) => {
      console.log(`Chunk #${data.chunkNumber} received successfully`)
    })

    socketService.onError((error: any) => {
      console.error('Socket error:', error)
      toast.error('Lỗi socket: ' + (error.message || 'Unknown error'))
    })
  }

  const setupMediaCapture = async () => {
    try {
      const constraints: MediaStreamConstraints = {
        video: cameraEnabled ? {
          width: { ideal: 1280, max: 1920 },
          height: { ideal: 720, max: 1080 },
          frameRate: { ideal: 30 }
        } : false,
        audio: micEnabled ? {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: { ideal: 44100 }
        } : false
      }

      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      setMediaStream(stream)

      // Hiển thị preview
      if (videoPreviewRef.current) {
        videoPreviewRef.current.srcObject = stream
        videoPreviewRef.current.muted = true
      }

      // Start recording với delay chunks
      await startDelayedRecording(stream)

    } catch (error) {
      console.error('Error setting up media capture:', error)
      handleMediaError(error)
    }
  }

  const startDelayedRecording = async (stream: MediaStream) => {
    try {
      const mimeType = getSupportedMimeType()
      console.log('Starting recording with MIME type:', mimeType)

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType,
        videoBitsPerSecond: 1500000, // 1.5 Mbps - chất lượng vừa phải
        audioBitsPerSecond: 96000    // 96 kbps - audio chất lượng tốt
      })

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0 && socketService.getIsConnected()) {
          chunkCountRef.current++

          console.log(`Sending chunk #${chunkCountRef.current}, size: ${(event.data.size / 1024).toFixed(2)}KB`)

          // Send chunk data via SocketService (delay 7 seconds)
          event.data.arrayBuffer().then(buffer => {
            if (socketService.getIsConnected()) {
              socketService.sendStreamChunk(
                streamData.id,
                buffer,
                chunkCountRef.current,
                mimeType
              )
            }
          }).catch(error => {
            console.error('Error converting chunk to buffer:', error)
          })
        }
      }

      mediaRecorder.onerror = (event) => {
        console.error('MediaRecorder error:', event)
        toast.error('Lỗi recording media')
        setIsRecording(false)
      }

      mediaRecorder.onstart = () => {
        console.log('MediaRecorder started')
        setIsRecording(true)
      }

      mediaRecorder.onstop = () => {
        console.log('MediaRecorder stopped')
        setIsRecording(false)
      }

      // Bắt đầu recording với chunks 7 giây
      mediaRecorder.start(CHUNK_DURATION)
      mediaRecorderRef.current = mediaRecorder

      console.log(`Recording started with ${CHUNK_DURATION}ms chunks`)

    } catch (error) {
      console.error('Error starting delayed recording:', error)
      toast.error('Không thể bắt đầu recording')
    }
  }

  const getSupportedMimeType = (): string => {
    const types = [
      'video/webm;codecs=vp9,opus',
      'video/webm;codecs=vp8,opus', 
      'video/webm;codecs=h264,opus',
      'video/webm',
      'video/mp4;codecs=h264,aac',
      'video/mp4'
    ]

    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) {
        return type
      }
    }

    console.warn('No optimal MIME type found, using default webm')
    return 'video/webm'
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
          toast.error('Camera hoặc microphone đang được sử dụng bởi ứng dụng khác')
          break
        default:
          toast.error('Không thể truy cập thiết bị media: ' + error.message)
      }
    } else {
      toast.error('Lỗi không xác định khi setup media')
    }
  }

  const cleanup = () => {
    console.log('Starting cleanup...')

    // Dừng recording
    if (mediaRecorderRef.current) {
      if (mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop()
      }
      mediaRecorderRef.current = null
    }

    // Dừng tất cả media tracks
    if (mediaStream) {
      mediaStream.getTracks().forEach(track => {
        track.stop()
        console.log(`Stopped ${track.kind} track`)
      })
      setMediaStream(null)
    }

    // Ngắt kết nối socket
    if (socket) {
      socket.emit('stop_streaming', { streamId: streamData.id })
      socket.disconnect()
      setSocket(null)
    }

    setIsConnected(false)
    setIsRecording(false)
    chunkCountRef.current = 0

    console.log('Cleanup completed')
  }

  // Update media settings khi props thay đổi
  useEffect(() => {
    if (mediaStream) {
      // Cập nhật video track
      const videoTracks = mediaStream.getVideoTracks()
      videoTracks.forEach(track => {
        track.enabled = cameraEnabled
      })

      // Cập nhật audio track  
      const audioTracks = mediaStream.getAudioTracks()
      audioTracks.forEach(track => {
        track.enabled = micEnabled
      })

      console.log(`Media settings updated - Camera: ${cameraEnabled}, Mic: ${micEnabled}`)
    }
  }, [cameraEnabled, micEnabled, mediaStream])

  return (
    <div className="streaming-manager">
      {/* Video preview */}
      <div className="relative">
        <video
          ref={videoPreviewRef}
          autoPlay
          playsInline
          muted
          className="w-full max-w-md h-auto rounded-lg border-2 border-gray-300"
          style={{ display: cameraEnabled ? 'block' : 'none' }}
        />
        {!cameraEnabled && (
          <div className="w-full max-w-md h-48 rounded-lg border-2 border-gray-300 bg-gray-100 flex items-center justify-center">
            <span className="text-gray-500">Camera đã tắt</span>
          </div>
        )}
        
        {/* Status indicators */}
        <div className="absolute top-2 left-2 flex gap-2">
          <div className={`px-2 py-1 rounded text-xs font-semibold ${
            isRecording 
              ? 'bg-red-500 text-white animate-pulse' 
              : isConnected
              ? 'bg-yellow-500 text-white'
              : 'bg-gray-500 text-white'
          }`}>
            {isRecording ? 'RECORDING' : isConnected ? 'CONNECTED' : 'OFFLINE'}
          </div>
          
          {cameraEnabled && (
            <div className="px-2 py-1 rounded text-xs font-semibold bg-blue-500 text-white">
              CAM
            </div>
          )}
          
          {micEnabled && (
            <div className="px-2 py-1 rounded text-xs font-semibold bg-purple-500 text-white">
              MIC
            </div>
          )}
        </div>

        {/* Delay info */}
        <div className="absolute bottom-2 left-2">
          <div className="px-2 py-1 rounded text-xs bg-black bg-opacity-70 text-white">
            Delay: ~{CHUNK_DURATION / 1000}s
          </div>
        </div>
      </div>

      {/* Recording info */}
      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
        <div className="flex items-center gap-2 text-sm text-blue-800">
          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
          <span>
            Stream sẽ có độ trễ khoảng {CHUNK_DURATION / 1000} giây so với thời gian thực
          </span>
        </div>
        {isRecording && (
          <div className="mt-2 text-xs text-blue-600">
            Đã gửi {chunkCountRef.current} chunks tới server
          </div>
        )}
      </div>

      {/* Debug info (only in development) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-4 p-2 bg-gray-100 rounded text-xs space-y-1">
          <div>Socket: {isConnected ? 'Connected' : 'Disconnected'}</div>
          <div>Recording: {isRecording ? 'Active' : 'Inactive'}</div>
          <div>Stream ID: {streamData.id}</div>
          <div>Chunk Duration: {CHUNK_DURATION}ms</div>
          <div>Chunks Sent: {chunkCountRef.current}</div>
          <div>Camera: {cameraEnabled ? 'On' : 'Off'}</div>
          <div>Mic: {micEnabled ? 'On' : 'Off'}</div>
        </div>
      )}
    </div>
  )
}

export default StreamingManager
