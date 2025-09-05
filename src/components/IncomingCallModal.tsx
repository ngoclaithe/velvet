"use client"

import { useEffect, useMemo, useRef, useState } from 'react'
import { connectMqtt, subscribeTopic } from '@/lib/mqttClient'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { PhoneOff, Video, Mic, MicOff, Check, X } from 'lucide-react'
import { useCall } from '@/components/call/CallProvider'
import { useNotification } from '@/components/notification/NotificationProvider'

interface IncomingPayload {
  type?: string
  title?: string
  message?: string
  data?: any
  mediaType?: 'audio' | 'video' | string
  callType?: 'audio' | 'video' | string
}

export default function IncomingCallModal() {
  const { isAuthenticated, user } = useAuth()
  const [open, setOpen] = useState(false)
  const [info, setInfo] = useState<{
    callerId?: string | number
    callerName?: string
    callerAvatar?: string
    callRoomId?: string
    mediaType: 'audio' | 'video'
  } | null>(null)
  const localVideoRef = useRef<HTMLVideoElement>(null)
  const mediaRef = useRef<MediaStream | null>(null)
  const [micOn, setMicOn] = useState(true)
  const [camOn, setCamOn] = useState(true)
  const call = useCall()
  const { clearIncomingCall } = useNotification()

  const userTopic = useMemo(() => (user?.id ? [`notifications/${user.id}`, `noti/${user.id}`] : []), [user?.id])

  useEffect(() => {
    if (!isAuthenticated || !user?.id) return
    let mounted = true

    const setup = async () => {
      const mqtt = await connectMqtt()
      if (!mqtt) return
      // subscribe both patterns for compatibility
      await Promise.all(userTopic.map(t => subscribeTopic(t)))

      const onMsg = async (topic: string, payloadBuf: Buffer) => {
        if (!mounted) return
        try {
          const raw = payloadBuf.toString('utf-8')
          const payload: IncomingPayload = JSON.parse(raw)
          const pData = payload?.data || {}
          const media: string = (payload.mediaType || payload.callType || pData.mediaType || pData.callType || '').toString().toLowerCase()
          const isCall = payload.type === 'call_request' || (media === 'audio' || media === 'video')
          if (!isCall) return
          const mediaType: 'audio' | 'video' = media === 'audio' ? 'audio' : 'video'
          const callerName = pData.callerUsername || pData.callerName || pData.username || payload.title || 'Người gọi'
          const callerAvatar = pData.callerAvatar || pData.avatar || ''
          const callRoomId = pData.callRoomId || pData.roomId || ''
          setInfo({ callerId: pData.callerId, callerName, callerAvatar, callRoomId, mediaType })
          setOpen(true)
          if (mediaType === 'video') {
            try {
              const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true })
              stream.getAudioTracks().forEach(t => (t.enabled = micOn))
              stream.getVideoTracks().forEach(t => (t.enabled = camOn))
              mediaRef.current = stream
              if (localVideoRef.current) {
                ;(localVideoRef.current as any).srcObject = stream
                localVideoRef.current.muted = true
                try { await localVideoRef.current.play() } catch {}
              }
            } catch {}
          }
        } catch {}
      }

      mqtt.on('message', onMsg)
      return () => {
        try { mqtt.off('message', onMsg as any) } catch {}
      }
    }

    const cleanupPromise = setup()
    return () => { mounted = false; (async () => { await cleanupPromise })() }
  }, [isAuthenticated, user?.id, userTopic, micOn, camOn])

  const toggleMic = () => {
    setMicOn(prev => {
      const next = !prev
      try { mediaRef.current?.getAudioTracks().forEach(t => (t.enabled = next)) } catch {}
      return next
    })
  }
  const toggleCam = () => {
    setCamOn(prev => {
      const next = !prev
      try { mediaRef.current?.getVideoTracks().forEach(t => (t.enabled = next)) } catch {}
      return next
    })
  }
  const endPreview = () => {
    try { mediaRef.current?.getTracks().forEach(t => t.stop()) } catch {}
    mediaRef.current = null
  }

  const onClose = () => {
    endPreview()
    setOpen(false)
    setInfo(null)
  }

  if (!open || !info) return null

  return (
    <div className="fixed inset-0 z-[80] bg-black/70 flex items-center justify-center">
      <div className="bg-background rounded-lg shadow-xl w-[92%] max-w-md p-5 relative">
        <div className="flex items-center gap-3 mb-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={info.callerAvatar} />
            <AvatarFallback>{(info.callerName || 'U').charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="font-semibold truncate">{info.callerName}</div>
            <div className="text-sm text-muted-foreground">Cuộc gọi {info.mediaType === 'audio' ? 'thoại' : 'video'}</div>
          </div>
        </div>

        {info.mediaType === 'video' ? (
          <div className="relative h-56 bg-black rounded mb-4 overflow-hidden">
            <video ref={localVideoRef} className="absolute inset-0 w-full h-full object-cover" playsInline muted />
          </div>
        ) : (
          <div className="h-24 flex items-center justify-center mb-4 text-4xl">📞</div>
        )}

        <div className="flex items-center justify-center gap-3">
          <Button size="icon" variant={micOn ? 'default' : 'secondary'} onClick={toggleMic} className="rounded-full h-10 w-10">
            {micOn ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
          </Button>
          {info.mediaType === 'video' && (
            <Button size="icon" variant={camOn ? 'default' : 'secondary'} onClick={toggleCam} className="rounded-full h-10 w-10">
              <Video className={`h-5 w-5 ${camOn ? '' : 'opacity-40'}`} />
            </Button>
          )}
          <Button size="icon" variant="destructive" onClick={onClose} className="rounded-full h-10 w-10">
            <PhoneOff className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  )
}
