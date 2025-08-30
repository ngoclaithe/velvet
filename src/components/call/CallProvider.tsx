"use client"

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { chatApi } from '@/lib/api/chat'
import { getSocketService } from '@/lib/socket'

export type CallType = 'audio' | 'video'
export type CallStatus = 'idle' | 'waiting' | 'active'

interface CallState {
  callRoomId: string | null
  callType: CallType | null
  status: CallStatus
}

interface CallContextValue {
  state: CallState
  isMicOn: boolean
  isCamOn: boolean
  localVideoRef: React.RefObject<HTMLVideoElement>
  remoteVideoRef: React.RefObject<HTMLVideoElement>
  remoteAudioRef: React.RefObject<HTMLAudioElement>
  initiateCall: (type: CallType, conversationId: string) => Promise<void>
  joinCallRoom: (callRoomId: string) => void
  acceptCall: (callRoomId: string, type: CallType) => void
  rejectCall: (callRoomId: string) => void
  endCall: () => void
  toggleMic: () => void
  toggleCam: () => void
}

const CallContext = createContext<CallContextValue | undefined>(undefined)

export function useCall() {
  const ctx = useContext(CallContext)
  if (!ctx) throw new Error('useCall must be used within CallProvider')
  return ctx
}

export const CallProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, session } = useAuth()
  const [state, setState] = useState<CallState>({ callRoomId: null, callType: null, status: 'idle' })
  const [isMicOn, setIsMicOn] = useState(true)
  const [isCamOn, setIsCamOn] = useState(true)
  const localVideoRef = useRef<HTMLVideoElement>(null)
  const remoteVideoRef = useRef<HTMLVideoElement>(null)
  const remoteAudioRef = useRef<HTMLAudioElement>(null)
  const mediaStreamRef = useRef<MediaStream | null>(null)
  const pcRef = useRef<RTCPeerConnection | null>(null)
  const initiatorRef = useRef<boolean>(false)

  const socket = useMemo(() => getSocketService(), [])

  useEffect(() => {
    if (!isAuthenticated) return
    let mounted = true
    console.log('[CALL] connecting socket as client')
    socket.connect({ clientType: 'client' }).then(() => console.log('[CALL] socket connected')).catch((e) => console.log('[CALL] socket connect error', e))

    const onCallAnswered = async (payload: any) => {
      console.log('[CALL][EVT] call_answerd', payload)
      if (!mounted) return
      const roomId = payload?.callRoomId || payload?.roomId
      if (!roomId || roomId !== state.callRoomId) { console.log('[CALL][EVT] call_answerd ignored roomId', roomId, 'current', state.callRoomId); return }
      setState(s => ({ ...s, status: 'active' }))
      try {
        await ensurePeerAndMedia(state.callType || 'video')
        if (initiatorRef.current && pcRef.current) {
          console.log('[CALL] creating local offer')
          const offer = await pcRef.current.createOffer()
          await pcRef.current.setLocalDescription(offer)
          console.log('[CALL][EMIT] webrtc-offer', { callRoomId: roomId })
          socket.emit('webrtc-offer', { callRoomId: roomId, offer, token: session?.accessToken })
        }
      } catch {}
    }

    const onWebrtcOffered = async (payload: any) => {
      console.log('[CALL][EVT] webrtc-offerd', payload)
      const roomId = payload?.callRoomId || payload?.roomId
      const offer = payload?.offer
      if (!roomId || roomId !== state.callRoomId || !offer) { console.log('[CALL][EVT] webrtc-offerd ignored'); return }
      try {
        await ensurePeerAndMedia(state.callType || 'video')
        if (!pcRef.current) return
        const desc = new RTCSessionDescription(offer)
        console.log('[CALL] setRemoteDescription(offer)')
        await pcRef.current.setRemoteDescription(desc)
        // Note: Spec only asked to handle offer; answer event not specified.
      } catch {}
    }

    const onIceCandidated = async (payload: any) => {
      console.log('[CALL][EVT] ice_candidated', payload)
      const roomId = payload?.callRoomId || payload?.roomId
      const cand = payload?.candidate
      if (!roomId || roomId !== state.callRoomId || !cand) { console.log('[CALL][EVT] ice_candidated ignored'); return }
      try {
        if (!pcRef.current) return
        console.log('[CALL] addIceCandidate')
        await pcRef.current.addIceCandidate(new RTCIceCandidate(cand))
      } catch {}
    }

    socket.on('call_answerd', onCallAnswered)
    socket.on('webrtc-offerd', onWebrtcOffered)
    socket.on('ice_candidated', onIceCandidated)

    return () => {
      mounted = false
      socket.off('call_answerd', onCallAnswered)
      socket.off('webrtc-offerd', onWebrtcOffered)
      socket.off('ice_candidated', onIceCandidated)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, state.callRoomId, state.callType, session?.accessToken, socket])

  const ensurePeerAndMedia = useCallback(async (type: CallType) => {
    if (!pcRef.current) {
      console.log('[CALL] create RTCPeerConnection')
      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:global.stun.twilio.com:3478?transport=udp' },
        ],
      })

      pc.onicecandidate = (event) => {
        if (event.candidate && state.callRoomId) {
          console.log('[CALL][EMIT] ice_candidate')
          socket.emit('ice_candidate', {
            callRoomId: state.callRoomId,
            candidate: event.candidate,
            token: session?.accessToken,
          })
        }
      }

      pc.ontrack = async (ev) => {
        const stream = ev.streams[0]
        if (!stream) return
        if (ev.track.kind === 'video') {
          if (remoteVideoRef.current) {
            ;(remoteVideoRef.current as any).srcObject = stream
            try { await remoteVideoRef.current.play() } catch {}
          }
        } else if (ev.track.kind === 'audio') {
          if (remoteAudioRef.current) {
            ;(remoteAudioRef.current as any).srcObject = stream
            try { await remoteAudioRef.current.play() } catch {}
          }
        }
      }

      pcRef.current = pc
    }

    if (!mediaStreamRef.current) {
      const constraints: MediaStreamConstraints = type === 'audio' ? { audio: true, video: false } : { audio: true, video: true }
      console.log('[CALL] getUserMedia constraints', constraints)
      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      stream.getAudioTracks().forEach(t => (t.enabled = isMicOn))
      stream.getVideoTracks().forEach(t => (t.enabled = type === 'video' ? isCamOn : false))
      mediaStreamRef.current = stream
      if (type === 'video' && localVideoRef.current) {
        ;(localVideoRef.current as any).srcObject = stream
        localVideoRef.current.muted = true
        try { await localVideoRef.current.play() } catch {}
        console.log('[CALL] local video attached')
      }
      stream.getTracks().forEach(t => pcRef.current?.addTrack(t, stream))
      console.log('[CALL] local tracks added to PC')
    }
  }, [isCamOn, isMicOn, socket, state.callRoomId])

  const initiateCall = useCallback(async (type: CallType, conversationId: string) => {
    if (!conversationId) return
    console.log('[CALL][API] sendDirectMessage initiateCall', { conversationId, type })
    const resp: any = await chatApi.sendDirectMessage(String(conversationId), { content: null, messageType: type })
    console.log('[CALL][API] response', resp)
    const callRoom = resp?.data?.callRoom || resp?.data?.data?.callRoom || resp?.callRoom
    const roomId: string | undefined = callRoom?.roomId
    const callType: CallType = (callRoom?.callType === 'audio') ? 'audio' : 'video'
    if (roomId) {
      initiatorRef.current = true
      setState({ callRoomId: roomId, callType, status: 'waiting' })
      console.log('[CALL][EMIT] join_call_room', { callRoomId: roomId })
      socket.emit('join_call_room', { token: session?.accessToken, callRoomId: roomId })
    }
  }, [session?.accessToken, socket])

  const joinCallRoom = useCallback((callRoomId: string) => {
    if (!callRoomId) return
    console.log('[CALL][EMIT] join_call_room', { callRoomId })
    socket.emit('join_call_room', { token: session?.accessToken, callRoomId })
  }, [session?.accessToken, socket])

  const acceptCall = useCallback(async (callRoomId: string, type: CallType) => {
    if (!callRoomId) return
    initiatorRef.current = false
    setState({ callRoomId, callType: type, status: 'active' })
    console.log('[CALL][EMIT] call_answer', { callRoomId })
    socket.emit('call_answer', { token: session?.accessToken, callRoomId })
    await ensurePeerAndMedia(type)
  }, [ensurePeerAndMedia, session?.accessToken, socket])

  const rejectCall = useCallback((callRoomId: string) => {
    if (!callRoomId) return
    console.log('[CALL][EMIT] call_reject', { callRoomId })
    socket.emit('call_reject', { token: session?.accessToken, callRoomId })
    endCall()
  }, [session?.accessToken, socket])

  const endCall = useCallback(() => {
    try { pcRef.current?.getSenders?.().forEach(s => { try { s.track?.stop() } catch {} }) } catch {}
    try { pcRef.current?.close() } catch {}
    pcRef.current = null
    try { mediaStreamRef.current?.getTracks().forEach(t => t.stop()) } catch {}
    mediaStreamRef.current = null
    initiatorRef.current = false
    console.log('[CALL] endCall()')
    setState({ callRoomId: null, callType: null, status: 'idle' })
  }, [])

  const toggleMic = useCallback(() => {
    setIsMicOn(prev => {
      const next = !prev
      try { mediaStreamRef.current?.getAudioTracks().forEach(t => (t.enabled = next)) } catch {}
      return next
    })
  }, [])

  const toggleCam = useCallback(() => {
    setIsCamOn(prev => {
      const next = !prev
      try { mediaStreamRef.current?.getVideoTracks().forEach(t => (t.enabled = next)) } catch {}
      return next
    })
  }, [])

  const value: CallContextValue = {
    state,
    isMicOn,
    isCamOn,
    localVideoRef,
    remoteVideoRef,
    remoteAudioRef,
    initiateCall,
    joinCallRoom,
    acceptCall,
    rejectCall,
    endCall,
    toggleMic,
    toggleCam,
  }

  return <CallContext.Provider value={value}>{children}</CallContext.Provider>
}
