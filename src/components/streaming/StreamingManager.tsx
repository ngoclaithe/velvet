'use client'

import { useState, useEffect, useRef } from 'react'
import io, { Socket } from 'socket.io-client'
import { toast } from 'react-hot-toast'
import type { StreamResponse, StreamSocketEvents } from '@/types/streaming'

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
  const [socket, setSocket] = useState<Socket | null>(null)
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const videoPreviewRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    initializeStreaming()
    return () => {
      cleanup()
    }
  }, [])

  useEffect(() => {
    onStatusChange(isConnected)
  }, [isConnected, onStatusChange])

  const initializeStreaming = async () => {
    try {
      // Kết nối socket
      const socketConnection = io(streamData.socketEndpoint, {
        transports: ['websocket'],
        autoConnect: true,
        timeout: 10000
      })

      // Socket event handlers
      socketConnection.on('connect', () => {
        console.log('Socket connected:', socketConnection.id)
        setIsConnected(true)
        
        // Thông báo bắt đầu streaming
        socketConnection.emit('start_streaming', {
          streamId: streamData.id,
          streamKey: streamData.streamKey
        })
      })

      socketConnection.on('disconnect', (reason) => {
        console.log('Socket disconnected:', reason)
        setIsConnected(false)
      })

      socketConnection.on('stream_started', (data: any) => {
        console.log('Stream started successfully:', data)
        toast.success('Streaming đã bắt đầu thành công!')
      })

      socketConnection.on('viewer_count_updated', (data: { count: number }) => {
        onViewerCountUpdate(data.count)
      })

      socketConnection.on('error', (error: any) => {
        console.error('Socket error:', error)
        toast.error('Lỗi socket: ' + error.message)
      })

      socketConnection.on('connect_error', (error) => {
        console.error('Connection error:', error)
        toast.error('Không thể kết nối tới server streaming')
      })

      setSocket(socketConnection)

      // Khởi tạo media capture
      await setupMediaCapture(socketConnection)

    } catch (error) {
      console.error('Error initializing streaming:', error)
      toast.error('Không thể khởi tạo streaming')
    }
  }

  const setupMediaCapture = async (socketConnection: Socket) => {
    try {
      const constraints: MediaStreamConstraints = {
        video: cameraEnabled ? {
          width: { ideal: 1920, max: 1920 },
          height: { ideal: 1080, max: 1080 },
          frameRate: { ideal: 30, max: 60 },
          facingMode: 'user'
        } : false,
        audio: micEnabled ? {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: { ideal: 48000 },
          channelCount: { ideal: 2 }
        } : false
      }

      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      setMediaStream(stream)

      // Hiển thị preview
      if (videoPreviewRef.current) {
        videoPreviewRef.current.srcObject = stream
        videoPreviewRef.current.muted = true // Tránh feedback
      }

      // Thiết lập MediaRecorder để encoding và streaming
      const mimeType = getSupportedMimeType()
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType,
        videoBitsPerSecond: 2500000, // 2.5 Mbps cho 1080p
        audioBitsPerSecond: 128000   // 128 kbps cho audio chất lượng cao
      })

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0 && socketConnection.connected) {
          // Chuyển blob thành ArrayBuffer và gửi qua socket
          event.data.arrayBuffer().then(buffer => {
            socketConnection.emit('video_data', {
              streamId: streamData.id,
              data: buffer,
              timestamp: Date.now(),
              mimeType: mimeType
            })
          }).catch(error => {
            console.error('Error converting blob to buffer:', error)
          })
        }
      }

      mediaRecorder.onerror = (event) => {
        console.error('MediaRecorder error:', event)
        toast.error('Lỗi recording media')
      }

      // Gửi data chunks mỗi 200ms để real-time streaming
      mediaRecorder.start(200)
      mediaRecorderRef.current = mediaRecorder

      console.log('Media capture setup completed')

    } catch (error) {
      console.error('Error setting up media capture:', error)
      
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
        console.log('Using MIME type:', type)
        return type
      }
    }

    console.warn('No supported MIME type found, using default')
    return 'video/webm'
  }

  const cleanup = () => {
    // Dừng media recorder
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
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
      setIsConnected(false)
    }

    console.log('Streaming cleanup completed')
  }

  const updateMediaSettings = async (newCameraEnabled: boolean, newMicEnabled: boolean) => {
    if (!mediaStream) return

    try {
      // Cập nhật video track
      const videoTracks = mediaStream.getVideoTracks()
      if (videoTracks.length > 0) {
        videoTracks[0].enabled = newCameraEnabled
      }

      // Cập nhật audio track
      const audioTracks = mediaStream.getAudioTracks()
      if (audioTracks.length > 0) {
        audioTracks[0].enabled = newMicEnabled
      }

      console.log(`Media settings updated - Camera: ${newCameraEnabled}, Mic: ${newMicEnabled}`)

    } catch (error) {
      console.error('Error updating media settings:', error)
      toast.error('Không thể cập nhật cài đặt media')
    }
  }

  // Update media settings when props change
  useEffect(() => {
    if (mediaStream) {
      updateMediaSettings(cameraEnabled, micEnabled)
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
            isConnected 
              ? 'bg-green-500 text-white' 
              : 'bg-red-500 text-white'
          }`}>
            {isConnected ? 'LIVE' : 'OFFLINE'}
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
      </div>

      {/* Debug info (only in development) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-4 p-2 bg-gray-100 rounded text-xs">
          <div>Socket: {isConnected ? 'Connected' : 'Disconnected'}</div>
          <div>Stream ID: {streamData.id}</div>
          <div>Endpoint: {streamData.socketEndpoint}</div>
          <div>Camera: {cameraEnabled ? 'On' : 'Off'}</div>
          <div>Mic: {micEnabled ? 'On' : 'Off'}</div>
        </div>
      )}
    </div>
  )
}

export default StreamingManager
