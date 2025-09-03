"use client"

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle } from 'lucide-react'
import { bookingApi, type Booking, type BookingStatus, type BookingType } from '@/lib/api/booking'
import BookingList from '@/components/booking/BookingList'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'

const statusOptions: { value: BookingStatus; label: string }[] = [
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

export default function AdminBookingsPage() {
  const [status, setStatus] = React.useState<BookingStatus>('pending')
  const [type, setType] = React.useState<'all' | BookingType>('all')
  const [bookings, setBookings] = React.useState<Booking[]>([])
  const [loading, setLoading] = React.useState(false)
  const [actionLoading, setActionLoading] = React.useState<Record<number, boolean>>({})
  const { toast } = useToast()

  const fetchData = React.useCallback(async () => {
    setLoading(true)
    try {
      // Hiện tại lib/api/booking.ts chưa có API cho admin để lấy tất cả booking.
      // Tạm thời dùng getCreatorBookings() để hiển thị nếu admin là creator (thường sẽ rỗng).
      const opts = { status }
      const res = await bookingApi.getCreatorBookings(opts)
      if (res.success && res.data) {
        const raw: any = res.data as any
        const list: any[] = Array.isArray(raw) ? raw : (Array.isArray(raw.bookings) ? raw.bookings : [])
        const filtered = type === 'all' ? list : list.filter((b: any) => b.type === type)
        setBookings(filtered as any)
      } else {
        setBookings([])
        if (res.error) toast({ title: 'Lỗi', description: res.error, variant: 'destructive' })
      }
    } catch (e: any) {
      toast({ title: 'Lỗi', description: e?.message || 'Không thể tải danh sách', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [status, type, toast])

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
    <div className="p-6">
      <div className="mx-auto max-w-6xl">
        <Card>
          <CardHeader className="space-y-2">
            <CardTitle className="text-xl">Quản lý Booking (Admin)</CardTitle>
            <CardDescription className="flex items-start gap-2 text-amber-600">
              <AlertTriangle className="h-4 w-4 mt-0.5" />
              <span>Hiện chưa có API dành cho Admin để xem tất cả booking trong lib/api/booking.ts. Cần bổ sung endpoint backend (ví dụ: /bookings/admin) và hàm getAllBookings(). Trang hiện hiển thị dữ liệu nếu tài khoản admin đồng thời là creator.</span>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4 flex flex-wrap gap-2">
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
            {loading ? (
              <div className="py-10 text-center text-muted-foreground">Đang tải...</div>
            ) : (
              <BookingList
                bookings={bookings}
                role="admin"
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
    </div>
  )
}
