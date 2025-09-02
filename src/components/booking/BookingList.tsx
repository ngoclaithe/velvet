"use client"

import React from 'react'
import type { Booking, BookingStatus, BookingType } from '@/lib/api/booking'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'

type RoleKind = 'user' | 'creator' | 'admin'

export interface BookingListProps {
  bookings: Booking[]
  role: RoleKind
  onAccept?: (bookingId: number) => void
  onReject?: (bookingId: number) => void
  onCancel?: (bookingId: number) => void
  onComplete?: (bookingId: number) => void
  loading?: Record<number, boolean>
}

function formatDate(value: string | null): string {
  if (!value) return 'Chưa đặt lịch'
  const d = new Date(value)
  const dd = d.toLocaleDateString('vi-VN', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' })
  const tt = d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
  return `${dd} • ${tt}`
}

function dayKey(value: string | null): string {
  if (!value) return 'Khác'
  const d = new Date(value)
  return d.toISOString().slice(0, 10)
}

const statusText: Record<BookingStatus, string> = {
  pending: 'Chờ xác nhận',
  confirmed: 'Đã xác nhận',
  in_progress: 'Đang diễn ra',
  completed: 'Hoàn tất',
  cancelled: 'Đã hủy',
  no_show: 'Không tham dự',
}

const typeText: Record<BookingType, string> = {
  private_show: 'Private show',
  private_chat: 'Private chat',
  cam2cam: 'Cam2Cam',
  byshot: 'Gói theo shot',
  byhour: 'Theo giờ',
}

const statusClass: Record<BookingStatus, string> = {
  pending: 'bg-yellow-500/10 text-yellow-600',
  confirmed: 'bg-blue-500/10 text-blue-600',
  in_progress: 'bg-purple-500/10 text-purple-600',
  completed: 'bg-green-500/10 text-green-600',
  cancelled: 'bg-red-500/10 text-red-600',
  no_show: 'bg-gray-500/10 text-gray-600',
}

const canAccept = (role: RoleKind, status: BookingStatus) => (role !== 'user') && status === 'pending'
const canReject = (role: RoleKind, status: BookingStatus) => (role !== 'user') && status === 'pending'
const canComplete = (role: RoleKind, status: BookingStatus) => (role !== 'user') && (status === 'in_progress' || status === 'confirmed')
const canCancel = (role: RoleKind, status: BookingStatus) => (status === 'pending' || status === 'confirmed')

export default function BookingList({ bookings, role, onAccept, onReject, onCancel, onComplete, loading }: BookingListProps) {
  const grouped = React.useMemo(() => {
    const map = new Map<string, Booking[]>()
    ;(bookings || []).forEach(b => {
      const key = dayKey(b.scheduledTime)
      const arr = map.get(key) || []
      arr.push(b)
      map.set(key, arr)
    })
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b))
  }, [bookings])

  if (!bookings || bookings.length === 0) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-muted-foreground">Chưa có booking nào</CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {grouped.map(([key, items]) => {
        const any = items[0]
        const label = any.scheduledTime ? new Date(any.scheduledTime).toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' }) : 'Khác'
        return (
          <Card key={key}>
            <CardHeader>
              <CardTitle className="text-base font-semibold">{label}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {items.sort((a, b) => {
                const ta = a.scheduledTime ? new Date(a.scheduledTime).getTime() : 0
                const tb = b.scheduledTime ? new Date(b.scheduledTime).getTime() : 0
                return ta - tb
              }).map((b, idx) => (
                <div key={b.id} className="flex flex-col gap-3 rounded-md border p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge className={cn('capitalize', statusClass[b.status])}>{statusText[b.status]}</Badge>
                      <Badge variant="secondary">{typeText[b.type]}</Badge>
                      <span className="text-sm text-muted-foreground">{b.duration} phút</span>
                    </div>
                    <div className="mt-1 text-sm font-medium">{formatDate(b.scheduledTime)}</div>
                    {b.notes ? (
                      <div className="mt-1 text-sm text-muted-foreground">{b.notes}</div>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {canAccept(role, b.status) && (
                      <Button size="sm" onClick={() => onAccept?.(b.id)} disabled={!!loading?.[b.id]}>Chấp nhận</Button>
                    )}
                    {canReject(role, b.status) && (
                      <Button size="sm" variant="destructive" onClick={() => onReject?.(b.id)} disabled={!!loading?.[b.id]}>Từ chối</Button>
                    )}
                    {canComplete(role, b.status) && (
                      <Button size="sm" variant="secondary" onClick={() => onComplete?.(b.id)} disabled={!!loading?.[b.id]}>Hoàn tất</Button>
                    )}
                    {canCancel(role, b.status) && (
                      <Button size="sm" variant="outline" onClick={() => onCancel?.(b.id)} disabled={!!loading?.[b.id]}>Hủy</Button>
                    )}
                  </div>
                </div>
              ))}
              <Separator />
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
