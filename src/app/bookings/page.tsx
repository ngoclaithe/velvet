"use client"

import React from 'react'
import { useAuth } from '@/hooks/useAuth'
import { bookingApi, type Booking, type BookingStatus, type BookingType } from '@/lib/api/booking'
import BookingList from '@/components/booking/BookingList'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { creatorAPI } from '@/lib/api/creator'
import { useToast } from '@/hooks/use-toast'
import { RefreshCw } from 'lucide-react'
import Link from 'next/link'

const statusOptions: { value: 'all' | BookingStatus; label: string }[] = [
  { value: 'all', label: 'Tất cả' },
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
  const [status, setStatus] = React.useState<'all' | BookingStatus>('pending')
  const [type, setType] = React.useState<'all' | BookingType>('all')
  const [bookings, setBookings] = React.useState<Booking[]>([])
  const [loading, setLoading] = React.useState(false)
  const [actionLoading, setActionLoading] = React.useState<Record<number, boolean>>({})
  const { toast } = useToast()

  const [createOpen, setCreateOpen] = React.useState(false)
  const [creators, setCreators] = React.useState<any[]>([])
  const [loadingCreators, setLoadingCreators] = React.useState(false)
  const [creatorSearch, setCreatorSearch] = React.useState('')
  const [selectedCreatorId, setSelectedCreatorId] = React.useState<string>('')

  const [newType, setNewType] = React.useState<BookingType>('private_show')
  const [newDuration, setNewDuration] = React.useState<number>(15)
  const [newTime, setNewTime] = React.useState<string>('')
  const [newNotes, setNewNotes] = React.useState<string>('')
  const [submitting, setSubmitting] = React.useState(false)

  const toLocalInput = React.useCallback((d: Date) => {
    const off = d.getTimezoneOffset()
    const local = new Date(d.getTime() - off * 60000)
    return local.toISOString().slice(0, 16)
  }, [])
  const minDateTime = React.useMemo(() => toLocalInput(new Date(Date.now() + 60 * 1000)), [toLocalInput])

  const minDuration = React.useMemo(() => (newType === 'byhour' ? 60 : newType === 'byshot' ? 1 : 5), [newType])

  React.useEffect(() => {
    if (createOpen && creators.length === 0) {
      ;(async () => {
        try {
          setLoadingCreators(true)
          const res: any = await creatorAPI.getAllCreators()
          const list = Array.isArray(res?.data) ? res.data : []
          setCreators(list)
        } catch {
          setCreators([])
        } finally {
          setLoadingCreators(false)
        }
      })()
    }
  }, [createOpen, creators.length])

  const loadCreators = async () => {
    try {
      setLoadingCreators(true)
      const res: any = await creatorAPI.getAllCreators()
      const list = Array.isArray(res?.data) ? res.data : []
      setCreators(list)
    } catch {
      setCreators([])
    } finally {
      setLoadingCreators(false)
    }
  }

  const filteredCreators = React.useMemo(() => {
    const q = creatorSearch.trim().toLowerCase()
    if (!q) return creators
    return creators.filter((c: any) => {
      const a = String(c.stageName || '').toLowerCase()
      const b = String(c.user?.username || '').toLowerCase()
      const full = [c.user?.firstName, c.user?.lastName].filter(Boolean).join(' ').toLowerCase()
      return a.includes(q) || b.includes(q) || full.includes(q)
    })
  }, [creators, creatorSearch])

  const onCreateBooking = async () => {
    try {
      if (!selectedCreatorId) {
        toast({ title: 'Vui lòng chọn creator', variant: 'destructive' })
        return
      }
      if (!newTime) {
        toast({ title: 'Vui lòng chọn thời gian', variant: 'destructive' })
        return
      }
      const payload = {
        creatorId: Number(selectedCreatorId),
        type: newType,
        duration: Number(newDuration),
        scheduledTime: newTime,
        notes: newNotes ? newNotes : undefined,
      }
      setSubmitting(true)
      const res = await bookingApi.createBooking(payload as any)
      if (!res.success) throw new Error(res.error || res.message || 'Tạo booking thất bại')
      toast({ title: 'Đã tạo booking' })
      setCreateOpen(false)
      setSelectedCreatorId('')
      setNewNotes('')
      setNewTime('')
      setNewDuration(minDuration)
      fetchData()
    } catch (e: any) {
      toast({ title: 'Lỗi', description: e?.message || 'Không thể tạo booking', variant: 'destructive' })
    } finally {
      setSubmitting(false)
    }
  }

  const fetchData = React.useCallback(async () => {
    if (!isAuthenticated) return
    setLoading(true)
    try {
      const opts = status === 'all' ? {} : { status }
      const res = role === 'creator' || role === 'admin' ? await bookingApi.getCreatorBookings(opts) : await bookingApi.getUserBookings(opts)
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
  }, [isAuthenticated, role, status, type, toast])

  React.useEffect(() => { fetchData() }, [fetchData])

  if (!isAuthenticated) {
    return (
      <div className="container py-10">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Quản lý Booking</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center gap-4 py-8 text-center">
              <p className="text-muted-foreground">Bạn cần đăng nhập để xem và tạo booking.</p>
              <Button asChild>
                <Link href="/login">Đăng nhập</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

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
            <Button variant="secondary" size="icon" onClick={fetchData} disabled={loading} aria-label="Làm mới" title="Làm mới">
              <RefreshCw className={loading ? 'animate-spin' : ''} />
            </Button>

            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
              <DialogTrigger asChild>
                <Button className="bg-green-600 hover:bg-green-700">Đặt lịch</Button>
              </DialogTrigger>
              <DialogContent className="max-w-xl">
                <DialogHeader>
                  <DialogTitle>Đặt lịch</DialogTitle>
                  <DialogDescription>Tạo booking mới</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Chọn creator</Label>
                    <div className="mt-1 flex items-center gap-2">
                      <Input placeholder="Tìm creator..." value={creatorSearch} onChange={(e)=>setCreatorSearch(e.target.value)} />
                      <Button type="button" variant="secondary" onClick={loadCreators} disabled={loadingCreators}>{loadingCreators ? 'Đang tải' : 'Tải lại'}</Button>
                    </div>
                    <div className="mt-2">
                      <Select value={selectedCreatorId} onValueChange={setSelectedCreatorId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Chọn creator" />
                        </SelectTrigger>
                        <SelectContent>
                          {filteredCreators.length === 0 ? (
                            <SelectItem value="__none__" disabled>Không có creator</SelectItem>
                          ) : filteredCreators.map((c: any) => (
                            <SelectItem key={c.id} value={String(c.id)}>
                              {c.stageName || c.user?.username || `Creator #${c.id}`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label>Loại</Label>
                      <Select value={newType} onValueChange={(v)=>setNewType(v as any)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Chọn loại" />
                        </SelectTrigger>
                        <SelectContent>
                          {typeOptions.filter(o=>o.value!== 'all').map(o=> (
                            <SelectItem key={o.value} value={o.value as any}>{o.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Thời lượng (phút)</Label>
                      <Input type="number" min={minDuration} step={1} value={newDuration} onChange={(e)=>setNewDuration(Number(e.target.value) || 0)} />
                      <div className="text-xs text-muted-foreground mt-1">Tối thiểu {minDuration} phút</div>
                    </div>
                  </div>

                  <div>
                    <Label>Thời gian</Label>
                    <Input type="datetime-local" min={minDateTime} value={newTime} onChange={(e)=>setNewTime(e.target.value)} />
                  </div>

                  <div>
                    <Label>Ghi chú</Label>
                    <Textarea value={newNotes} onChange={(e)=>setNewNotes(e.target.value)} maxLength={500} placeholder="Yêu cầu thêm (tối đa 500 ký tự)" />
                    <div className="text-xs text-right text-muted-foreground">{newNotes.length}/500</div>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={()=>setCreateOpen(false)}>Hủy</Button>
                  <Button type="button" onClick={onCreateBooking} disabled={submitting}>{submitting ? 'Đang tạo...' : 'Tạo booking'}</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
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
