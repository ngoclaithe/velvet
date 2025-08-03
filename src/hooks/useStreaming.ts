import { useEffect, useRef, useState } from 'react'
import { useStreamingStore } from '@/store/streamingStore'
import type { Stream, StreamSettings } from '@/types/streaming'

export function useStreaming() {
  const {
    currentStream,
    streams,
    isLoading,
    error,
    createStream,
    updateStream,
    deleteStream,
    startStream,
    endStream,
    joinStream,
    leaveStream,
    bookPrivateShow,
    updateStreamSettings,
    getStreamAnalytics,
  } = useStreamingStore()

  const getLiveStreams = () => {
    return streams.filter(stream => stream.isLive)
  }

  const getStreamsByCategory = (category: string) => {
    return streams.filter(stream => stream.category === category)
  }

  const getStreamsByTag = (tag: string) => {
    return streams.filter(stream => stream.tags.includes(tag))
  }

  return {
    // State
    currentStream,
    streams,
    isLoading,
    error,

    // Actions
    createStream,
    updateStream,
    deleteStream,
    startStream,
    endStream,
    joinStream,
    leaveStream,
    bookPrivateShow,
    updateStreamSettings,
    getStreamAnalytics,

    // Utility functions
    getLiveStreams,
    getStreamsByCategory,
    getStreamsByTag,
  }
}

export function useWebRTC() {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null)
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const localVideoRef = useRef<HTMLVideoElement>(null)
  const remoteVideoRef = useRef<HTMLVideoElement>(null)
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null)

  const startLocalStream = async (constraints: MediaStreamConstraints = { video: true, audio: true }) => {
    setIsLoading(true)
    setError(null)

    try {
      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      setLocalStream(stream)

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream
      }
    } catch (err) {
      setError('Failed to access camera/microphone')
      console.error('Error accessing media devices:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const stopLocalStream = () => {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop())
      setLocalStream(null)
    }

    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null
    }
  }

  const initializePeerConnection = () => {
    const configuration: RTCConfiguration = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        // Add TURN servers for production
      ],
    }

    const peerConnection = new RTCPeerConnection(configuration)

    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        // Send ICE candidate to remote peer
        console.log('ICE candidate:', event.candidate)
      }
    }

    peerConnection.ontrack = (event) => {
      setRemoteStream(event.streams[0])
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0]
      }
    }

    peerConnection.onconnectionstatechange = () => {
      setIsConnected(peerConnection.connectionState === 'connected')
    }

    peerConnectionRef.current = peerConnection
    return peerConnection
  }

  const addLocalStreamToPeer = (peerConnection: RTCPeerConnection) => {
    if (localStream) {
      localStream.getTracks().forEach(track => {
        peerConnection.addTrack(track, localStream)
      })
    }
  }

  const createOffer = async () => {
    if (!peerConnectionRef.current) return null

    try {
      const offer = await peerConnectionRef.current.createOffer()
      await peerConnectionRef.current.setLocalDescription(offer)
      return offer
    } catch (err) {
      setError('Failed to create offer')
      console.error('Error creating offer:', err)
      return null
    }
  }

  const createAnswer = async (offer: RTCSessionDescriptionInit) => {
    if (!peerConnectionRef.current) return null

    try {
      await peerConnectionRef.current.setRemoteDescription(offer)
      const answer = await peerConnectionRef.current.createAnswer()
      await peerConnectionRef.current.setLocalDescription(answer)
      return answer
    } catch (err) {
      setError('Failed to create answer')
      console.error('Error creating answer:', err)
      return null
    }
  }

  const handleAnswer = async (answer: RTCSessionDescriptionInit) => {
    if (!peerConnectionRef.current) return

    try {
      await peerConnectionRef.current.setRemoteDescription(answer)
    } catch (err) {
      setError('Failed to handle answer')
      console.error('Error handling answer:', err)
    }
  }

  const addIceCandidate = async (candidate: RTCIceCandidateInit) => {
    if (!peerConnectionRef.current) return

    try {
      await peerConnectionRef.current.addIceCandidate(candidate)
    } catch (err) {
      setError('Failed to add ICE candidate')
      console.error('Error adding ICE candidate:', err)
    }
  }

  const disconnect = () => {
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close()
      peerConnectionRef.current = null
    }

    setRemoteStream(null)
    setIsConnected(false)

    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null
    }
  }

  useEffect(() => {
    return () => {
      stopLocalStream()
      disconnect()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return {
    // State
    localStream,
    remoteStream,
    isConnected,
    isLoading,
    error,

    // Refs
    localVideoRef,
    remoteVideoRef,

    // Actions
    startLocalStream,
    stopLocalStream,
    initializePeerConnection,
    addLocalStreamToPeer,
    createOffer,
    createAnswer,
    handleAnswer,
    addIceCandidate,
    disconnect,
  }
}

export function useStreamPlayer(streamId?: string) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [volume, setVolume] = useState(1)
  const [quality, setQuality] = useState('720p')
  const [isFullscreen, setIsFullscreen] = useState(false)

  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const play = () => {
    if (videoRef.current) {
      videoRef.current.play()
      setIsPlaying(true)
    }
  }

  const pause = () => {
    if (videoRef.current) {
      videoRef.current.pause()
      setIsPlaying(false)
    }
  }

  const togglePlay = () => {
    if (isPlaying) {
      pause()
    } else {
      play()
    }
  }

  const changeVolume = (newVolume: number) => {
    if (videoRef.current) {
      videoRef.current.volume = Math.max(0, Math.min(1, newVolume))
      setVolume(newVolume)
    }
  }

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted
    }
  }

  const changeQuality = (newQuality: string) => {
    setQuality(newQuality)
    // Implement quality change logic
  }

  const toggleFullscreen = () => {
    if (!containerRef.current) return

    if (!isFullscreen) {
      if (containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen()
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen()
      }
    }
  }

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
    }
  }, [])

  return {
    // State
    isPlaying,
    volume,
    quality,
    isFullscreen,

    // Refs
    videoRef,
    containerRef,

    // Actions
    play,
    pause,
    togglePlay,
    changeVolume,
    toggleMute,
    changeQuality,
    toggleFullscreen,
  }
}
