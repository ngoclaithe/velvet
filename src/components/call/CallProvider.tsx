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
          console.log('[CALL][EMIT] webrtc_offer', { callRoomId: roomId })
          socket.emit('webrtc_offer', { callRoomId: roomId, offer, token: session?.accessToken })
        }
      } catch {}
    }

    const onCallRejected = (payload: any) => {
      console.log('[CALL][EVT] call_rejected', payload)
      if (!mounted) return
      const roomId = payload?.callRoomId || payload?.roomId
      if (!roomId || roomId !== state.callRoomId) { console.log('[CALL][EVT] call_rejected ignored', roomId); return }
      try {
        // Clean up local call state when a call is rejected
        endCall()
      } catch (e) {
        console.log('[CALL][ERR] handling call_rejected', e)
      }
    }

    const onCallEnded = (payload: any) => {
      console.log('[CALL][EVT] call_ended', payload)
      if (!mounted) return
      const roomId = payload?.callRoomId || payload?.roomId
      if (!roomId || roomId !== state.callRoomId) { console.log('[CALL][EVT] call_ended ignored', roomId); return }
      try {
        // Ensure we clean up peer connection and media when call ends
        endCall()
      } catch (e) {
        console.log('[CALL][ERR] handling call_ended', e)
      }
    }

    const onWebrtcOffered = async (payload: any) => {
      console.log('[CALL][EVT] webrtc_offerd', payload)
      const roomId = payload?.callRoomId || payload?.roomId
      const offer = payload?.offer
      if (!roomId || roomId !== state.callRoomId || !offer) { console.log('[CALL][EVT] webrtc_offerd ignored'); return }
      try {
        await ensurePeerAndMedia(state.callType || 'video')
        if (!pcRef.current) return
        const desc = new RTCSessionDescription(offer)
        console.log('[CALL] setRemoteDescription(offer)')
        await pcRef.current.setRemoteDescription(desc)
        const answer = await pcRef.current.createAnswer()
        await pcRef.current.setLocalDescription(answer)
        console.log('[CALL][EMIT] webrtc_answer', { callRoomId: roomId })
        socket.emit('webrtc_answer', { callRoomId: roomId, answer, token: session?.accessToken })
      } catch (e) {
        console.log('[CALL][ERR] onWebrtcOffered', e)
      }
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

    const onWebrtcAnswered = async (payload: any) => {
      console.log('[CALL][EVT] webrtc_answered', payload)
      const roomId = payload?.callRoomId || payload?.roomId
      const answer = payload?.answer
      if (!roomId || roomId !== state.callRoomId || !answer) { console.log('[CALL][EVT] webrtc_answered ignored'); return }
      try {
        if (!pcRef.current) return
        const desc = new RTCSessionDescription(answer)
        console.log('[CALL] setRemoteDescription(answer)')
        await pcRef.current.setRemoteDescription(desc)
      } catch (e) {
        console.log('[CALL][ERR] onWebrtcAnswered', e)
      }
    }

    socket.on('call_answerd', onCallAnswered)
    socket.on('call_answered', onCallAnswered)
    socket.on('webrtc-offerd', onWebrtcOffered)
    socket.on('webrtc_offerd', onWebrtcOffered)
    socket.on('webrtc-offered', onWebrtcOffered)
    socket.on('webrtc_offered', onWebrtcOffered)
    socket.on('webrtc-answered', onWebrtcAnswered)
    socket.on('webrtc_answered', onWebrtcAnswered)
    socket.on('webrtc_answerd', onWebrtcAnswered)
    socket.on('ice_candidated', onIceCandidated)
    socket.on('ice_candidate_received', onIceCandidated)
    socket.on('call_rejected', onCallRejected)
    socket.on('call_ended', onCallEnded)

    return () => {
      mounted = false
      socket.off('call_answerd', onCallAnswered)
      socket.off('call_answered', onCallAnswered)
      socket.off('webrtc-offerd', onWebrtcOffered)
      socket.off('webrtc_offerd', onWebrtcOffered)
      socket.off('webrtc-offered', onWebrtcOffered)
      socket.off('webrtc_offered', onWebrtcOffered)
      socket.off('webrtc-answered', onWebrtcAnswered)
      socket.off('webrtc_answered', onWebrtcAnswered)
      socket.off('webrtc_answerd', onWebrtcAnswered)
      socket.off('ice_candidated', onIceCandidated)
      socket.off('ice_candidate_received', onIceCandidated)
      socket.off('call_rejected', onCallRejected)
      socket.off('call_ended', onCallEnded)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, state.callRoomId, state.callType, session?.accessToken, socket])

  const ensurePeerAndMedia = useCallback(async (type: CallType) => {
    if (!pcRef.current) {
      console.log('[CALL] create RTCPeerConnection')
      let pc: RTCPeerConnection
      // Build ICE servers dynamically. Use TURN in production if provided via env vars
      const cfg: RTCConfiguration = { iceServers: [] }
      try {
        const defaultStuns = [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
        ]
        cfg.iceServers = [...defaultStuns]
        // Optional TURN config via env
        const turnUrl = process.env.NEXT_PUBLIC_TURN_URL
        const turnUser = process.env.NEXT_PUBLIC_TURN_USER
        const turnPass = process.env.NEXT_PUBLIC_TURN_PASS
        if (turnUrl) {
          const turnEntry: any = { urls: turnUrl }
          if (turnUser) turnEntry.username = turnUser
          if (turnPass) turnEntry.credential = turnPass
          cfg.iceServers.push(turnEntry)
          console.log('[CALL] added TURN server from env')
        }
      } catch (e) {
        console.log('[CALL][ERROR] building iceServers', e)
      }
      try {
        pc = new RTCPeerConnection(cfg)
      } catch (e) {
        console.log('[CALL][ERROR] RTCPeerConnection config failed, fallback to default', e)
        pc = new RTCPeerConnection()
      }

      pc.onicecandidate = (event) => {
        if (event.candidate && state.callRoomId) {
          console.log('[CALL][EMIT] ice_candidate', event.candidate)
          socket.emit('ice_candidate', {
            callRoomId: state.callRoomId,
            candidate: event.candidate,
            token: session?.accessToken,
          })
        }
      }

      pc.onconnectionstatechange = () => {
        console.log('[CALL] pc.connectionState', pc.connectionState)
      }
      pc.oniceconnectionstatechange = () => {
        console.log('[CALL] pc.iceConnectionState', pc.iceConnectionState)
      }

      pc.ontrack = async (ev) => {
        const stream = ev.streams[0]
        if (!stream) return
        console.log('[CALL] ontrack, tracks:', ev.streams[0]?.getTracks().map(t=>t.kind))
        if (ev.track.kind === 'video') {
          if (remoteVideoRef.current) {
            try {
              // attach stream
              (remoteVideoRef.current as any).srcObject = stream
              remoteVideoRef.current.playsInline = true
              // only attempt play if element is still in document
              if (document.contains(remoteVideoRef.current)) {
                try {
                  await remoteVideoRef.current.play()
                  console.log('[CALL] remote video play ok')
                } catch (err) {
                  // play may be blocked or aborted if element removed; log and ignore
                  console.log('[CALL] remote video play blocked', err)
                }
              } else {
                console.log('[CALL] remote video element not in document, skipping play')
              }
            } catch (err) {
              console.log('[CALL] remote video attach error', err)
            }
          }
        } else if (ev.track.kind === 'audio') {
          if (remoteAudioRef.current) {
            try {
              (remoteAudioRef.current as any).srcObject = stream
              if (document.contains(remoteAudioRef.current)) {
                try {
                  await remoteAudioRef.current.play()
                  console.log('[CALL] remote audio play ok')
                } catch (err) {
                  console.log('[CALL] remote audio play blocked', err)
                }
              } else {
                console.log('[CALL] remote audio element not in document, skipping play')
              }
            } catch (err) {
              console.log('[CALL] remote audio attach error', err)
            }
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
        try {
          (localVideoRef.current as any).srcObject = stream
          localVideoRef.current.muted = true
          localVideoRef.current.playsInline = true
          if (document.contains(localVideoRef.current)) {
            try {
              await localVideoRef.current.play()
              console.log('[CALL] local video attached')
            } catch (err) {
              console.log('[CALL] local video play blocked', err)
            }
          } else {
            console.log('[CALL] local video element not in document, skipping play')
          }
        } catch (err) {
          console.log('[CALL] local video attach error', err)
        }
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
    console.log('[CALL][EMIT] join_call_room (accept)', { callRoomId })
    socket.emit('join_call_room', { token: session?.accessToken, callRoomId })
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
