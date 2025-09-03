"use client"

import React from 'react'
import type { Booking, BookingStatus, BookingType } from '@/lib/api/booking'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import { Calendar, Clock, DollarSign, Star } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import ImageUploader from '@/components/ImageUploader'
import { reviewApi } from '@/lib/api/review'
import { useToast } from '@/hooks/use-toast'

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
const canCancel = (role: RoleKind, status: BookingStatus) => role !== 'creator' && status === 'pending'

function initials(name?: string) {
  if (!name) return 'A'
  const parts = name.trim().split(/\s+/)
  const first = parts[0]?.[0] || ''
  const last = parts.length > 1 ? parts[parts.length - 1][0] : ''
  return (first + last).toUpperCase() || 'A'
}

function displayName(b: Booking, role: RoleKind): string {
  if (role === 'user') {
    return b.creator?.stageName || `Creator #${b.creatorId}`
  }
  if (role === 'creator') {
    const c = b.client
    const full = [c?.firstName, c?.lastName].filter(Boolean).join(' ').trim()
    return full || c?.username || `User #${b.userId}`
  }
  const userName = b.client?.username || `User #${b.userId}`
  const creatorName = b.creator?.stageName || `Creator #${b.creatorId}`
  return `${userName} → ${creatorName}`
}

function avatarInfo(b: Booking, role: RoleKind) {
  if (role === 'user') {
    const name = b.creator?.stageName || `Creator #${b.creatorId}`
    return { src: b.creator?.avatar || undefined, fallback: initials(name) }
  }
  const c = b.client
  const name = [c?.firstName, c?.lastName].filter(Boolean).join(' ').trim() || c?.username || `User #${b.userId}`
  return { src: c?.avatar || undefined, fallback: initials(name) }
}

export default function BookingList({ bookings, role, onAccept, onReject, onCancel, onComplete, loading }: BookingListProps) {
  const { toast } = useToast()
  const [reviewOpen, setReviewOpen] = React.useState(false)
  const [selected, setSelected] = React.useState<Booking | null>(null)
  const [rating, setRating] = React.useState<number>(5)
  const [hoverRating, setHoverRating] = React.useState<number>(0)
  const [comment, setComment] = React.useState('')
  const [images, setImages] = React.useState<string[]>([])
  const [isAnonymous, setIsAnonymous] = React.useState(false)
  const [submitting, setSubmitting] = React.useState(false)

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

  const openReview = (b: Booking) => {
    setSelected(b)
    setRating(5)
    setHoverRating(0)
    setComment('')
    setImages([])
    setIsAnonymous(false)
    setReviewOpen(true)
  }

  const submitReview = async () => {
    if (!selected) return
    try {
      if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
        toast({ title: 'Điểm đánh giá không hợp lệ', variant: 'destructive' })
        return
      }
      if (comment.length > 1000) {
        toast({ title: 'Bình luận tối đa 1000 ký tự', variant: 'destructive' })
        return
      }
      setSubmitting(true)
      const res = await reviewApi.postReview({
        creatorId: selected.creatorId,
        bookingId: selected.id,
        rating,
        comment: comment ? comment : undefined,
        images: images.length ? images.slice(0, 5) : undefined,
        isAnonymous,
      })
      if (!res.success) throw new Error(res.error || res.message || 'Gửi đánh giá thất bại')
      toast({ title: 'Đã gửi đánh giá' })
      setReviewOpen(false)
    } catch (e: any) {
      toast({ title: 'Lỗi', description: e?.message || 'Không thể gửi đánh giá', variant: 'destructive' })
    } finally {
      setSubmitting(false)
    }
  }

  if (!bookings || bookings.length === 0) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-muted-foreground">Chưa có booking nào</CardContent>
      </Card>
    )
  }

  return (
    <>
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
                }).map((b) => {
                  const who = displayName(b, role)
                  const av = avatarInfo(b, role)
                  const when = formatDate(b.scheduledTime)
                  const price = b.totalPrice || (b.pricePerMinute && b.duration ? (Number(b.pricePerMinute) * b.duration).toFixed(2) : undefined)
                  const paid = (b.paymentStatus || '').toString().toLowerCase() === 'paid'

                  const canReview = role === 'user' && b.status === 'completed' && !b.isRated

                  return (
                    <div key={b.id} className="rounded-md border p-4 hover:shadow-sm transition">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-start gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={av.src} alt={who} />
                            <AvatarFallback>{av.fallback}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="flex items-center gap-2">
                              {role === 'user' ? (
                                <Link href={`/creator/${b.creatorId}`} className="font-medium hover:underline">
                                  {who}
                                </Link>
                              ) : (
                                <span className="font-medium">{who}</span>
                              )}
                              {role === 'user' && b.creator?.rating && (
                                <span className="inline-flex items-center text-xs text-muted-foreground">
                                  <Star className="h-3 w-3 mr-1 text-yellow-500" />
                                  {Number(b.creator.rating).toFixed(2)}
                                </span>
                              )}
                            </div>
                            <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                              <span className="inline-flex items-center"><Calendar className="h-3 w-3 mr-1" />{when}</span>
                              <span className="inline-flex items-center"><Clock className="h-3 w-3 mr-1" />{b.duration} phút</span>
                              {typeof price !== 'undefined' && (
                                <span className="inline-flex items-center"><DollarSign className="h-3 w-3 mr-1" />{price}</span>
                              )}
                            </div>
                            {b.notes ? (
                              <div className="mt-1 text-sm text-muted-foreground">{b.notes}</div>
                            ) : null}
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <Badge className={cn('capitalize', statusClass[b.status])}>{statusText[b.status]}</Badge>
                          <Badge variant="secondary">{typeText[b.type]}</Badge>
                          {b.paymentStatus && (
                            <Badge variant={paid ? 'default' : 'outline'} className={paid ? 'bg-green-500/10 text-green-700' : ''}>
                              {paid ? 'Đã thanh toán' : String(b.paymentStatus)}
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div className="mt-3 flex flex-wrap items-center gap-2">
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
                        {canReview && (
                          <Button size="sm" className="bg-pink-600 hover:bg-pink-700" onClick={() => openReview(b)}>
                            <Star className="h-4 w-4 mr-1" /> Đánh giá
                          </Button>
                        )}
                      </div>
                    </div>
                  )
                })}
                <Separator />
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Dialog open={reviewOpen} onOpenChange={setReviewOpen}>
        <DialogContent className="max-w-lg w-[95vw]">
          <DialogHeader>
            <DialogTitle>Đánh giá booking</DialogTitle>
            <DialogDescription>Gửi đánh giá của bạn cho creator</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Chấm điểm</Label>
              <div className="flex items-center gap-1 mt-1">
                {Array.from({ length: 5 }).map((_, i) => {
                  const value = i + 1
                  const active = (hoverRating || rating) >= value
                  return (
                    <button
                      key={value}
                      type="button"
                      onMouseEnter={() => setHoverRating(value)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setRating(value)}
                      className="p-1"
                      aria-label={`Chấm ${value} sao`}
                    >
                      <Star className={cn('h-6 w-6', active ? 'fill-yellow-400 text-yellow-400' : 'text-gray-400')} />
                    </button>
                  )
                })}
              </div>
            </div>
            <div>
              <Label>Bình luận (tùy chọn)</Label>
              <Textarea value={comment} onChange={(e) => setComment(e.target.value)} maxLength={1000} placeholder="Chia sẻ trải nghiệm của bạn..." />
              <div className="text-xs text-right text-muted-foreground">{comment.length}/1000</div>
            </div>
            <div>
              <Label>Ảnh minh họa (tối đa 5)</Label>
              <ImageUploader
                compact
                autoUpload
                maxFiles={5}
                onUploadComplete={(results) => setImages(results.map(r => r.secure_url))}
              />
              {images.length > 0 && (
                <div className="mt-2 grid grid-cols-3 sm:grid-cols-5 gap-2">
                  {images.map((url) => (
                    <div key={url} className="relative">
                      <img src={url} alt="uploaded" className="w-full h-20 object-cover rounded" />
                      {submitting && (
                        <div className="absolute inset-0 bg-black/30 flex items-center justify-center rounded">
                          <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Switch id="anon" checked={isAnonymous} onCheckedChange={setIsAnonymous} />
              <Label htmlFor="anon">Ẩn danh</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReviewOpen(false)}>Hủy</Button>
            <Button onClick={submitReview} disabled={submitting}>
              {submitting ? 'Đang gửi...' : 'Gửi đánh giá'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
