"use client"

import React from 'react'
import { useAuth } from '@/hooks/useAuth'
import { bookingApi, type Booking, type BookingStatus, type BookingType } from '@/lib/api/booking'
import BookingList from '@/components/booking/BookingList'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'

const statusOptions: { value: 'all' | BookingStatus; label: string }[] = [
  { value: 'all', label: 'Tất cả trạng thái' },
  { value: 'pending', label: 'Chờ xác nhận' },
  { value: 'confirmed', label: 'Đã xác nhận' },
  { value: 'in_progress', label: 'Đang diễn ra' },
  { value: 'completed', label: 'Hoàn tất' },
  { value: 'cancelled', label: 'Đã hủy' },
  { value: 'no_show', label: 'Không tham dự' },
]

const typeOptions: { value: 'all' | BookingType; label: string }[] = [
  { value: 'all', label: 'Tất cả loại' },
  { value: 'private_show', label: 'Private show' },
  { value: 'private_chat', label: 'Private chat' },
  { value: 'cam2cam', label: 'Cam2Cam' },
  { value: 'byshot', label: 'Gói theo shot' },
  { value: 'byhour', label: 'Theo giờ' },
]

export default function BookingsPage() {
  const { isAuthenticated, isCreator, isAdmin } = useAuth()
  const role: 'user' | 'creator' | 'admin' = isAdmin() ? 'admin' : (isCreator() ? 'creator' : 'user')
  const [status, setStatus] = React.useState<'all' | BookingStatus>('all')
  const [type, setType] = React.useState<'all' | BookingType>('all')
  const [bookings, setBookings] = React.useState<Booking[]>([])
  const [loading, setLoading] = React.useState(false)
  const [actionLoading, setActionLoading] = React.useState<Record<number, boolean>>({})
  const { toast } = useToast()

  const fetchData = React.useCallback(async () => {
    if (!isAuthenticated) return
    setLoading(true)
    try {
      const opts = status === 'all' ? undefined : { status }
      const res = role === 'creator' || role === 'admin' ? await bookingApi.getCreatorBookings(opts) : await bookingApi.getUserBookings(opts)
      if (res.success && res.data) {
        const list = res.data.bookings || []
        setBookings(type === 'all' ? list : list.filter(b => b.type === type))
      } else {
        setBookings([])
        if (res.error) toast({ title: 'Lỗi', description: res.error, variant: 'destructive' })
      }
    } catch (e: any) {
      toast({ title: 'Lỗi', description: e?.message || 'Không thể tải danh sách', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [isAuthenticated, role, status, type, toast])

  React.useEffect(() => { fetchData() }, [fetchData])

  const withAction = async (id: number, fn: () => Promise<any>, successMsg: string) => {
    setActionLoading(prev => ({ ...prev, [id]: true }))
    try {
      const res = await fn()
      if (res.success) {
        toast({ title: successMsg })
        fetchData()
      } else {
        toast({ title: 'Thất bại', description: res.error || res.message || 'Có lỗi xảy ra', variant: 'destructive' })
      }
    } catch (e: any) {
      toast({ title: 'Lỗi', description: e?.message || 'Có lỗi xảy ra', variant: 'destructive' })
    } finally {
      setActionLoading(prev => ({ ...prev, [id]: false }))
    }
  }

  const handleAccept = (id: number) => withAction(id, () => bookingApi.acceptBooking(id), 'Đã chấp nhận booking')
  const handleReject = (id: number) => {
    const reason = window.prompt('Lý do từ chối (tối thiểu 10 ký tự):') || ''
    if (reason.trim().length < 10) {
      toast({ title: 'Lý do không hợp lệ', variant: 'destructive' })
      return
    }
    return withAction(id, () => bookingApi.rejectBooking(id, reason.trim()), 'Đã từ chối booking')
  }
  const handleCancel = (id: number) => {
    const reason = window.prompt('Lý do hủy (tuỳ chọn, <= 500 ký tự):') || undefined
    return withAction(id, () => bookingApi.cancelBooking(id, reason), 'Đã hủy booking')
  }
  const handleComplete = (id: number) => withAction(id, () => bookingApi.completeBooking(id), 'Đã hoàn tất booking')

  return (
    <div className="container py-6">
      <Card>
        <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="text-xl font-semibold">Quản lý Booking</CardTitle>
          <div className="flex flex-wrap gap-2">
            <Select value={status} onValueChange={(v) => setStatus(v as any)}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Trạng thái" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map(o => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={type} onValueChange={(v) => setType(v as any)}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Loại" />
              </SelectTrigger>
              <SelectContent>
                {typeOptions.map(o => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="secondary" onClick={fetchData} disabled={loading}>Làm mới</Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-10 text-center text-muted-foreground">Đang tải...</div>
          ) : (
            <BookingList
              bookings={bookings}
              role={role}
              onAccept={handleAccept}
              onReject={handleReject}
              onCancel={handleCancel}
              onComplete={handleComplete}
              loading={actionLoading}
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
