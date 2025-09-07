"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Flag } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/hooks/useAuth'
import { reportApi, type ReportType } from '@/lib/api/report'

interface ReportButtonProps {
  reportedUserId: number
  className?: string
  size?: 'icon' | 'sm' | 'default'
}

export default function ReportButton({ reportedUserId, className, size = 'icon' }: ReportButtonProps) {
  const [open, setOpen] = useState(false)
  const [type, setType] = useState<ReportType>('harassment')
  const [reason, setReason] = useState('')
  const [evidence, setEvidence] = useState<string[]>([])
  const [newEvidence, setNewEvidence] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const { toast } = useToast()
  const { isAuthenticated, user } = useAuth()

  const canReport = isAuthenticated && user?.id && Number(user.id) !== Number(reportedUserId)

  const addEvidence = () => {
    const url = newEvidence.trim()
    if (!url) return
    setEvidence(prev => [...prev, url])
    setNewEvidence('')
  }

  const removeEvidence = (idx: number) => {
    setEvidence(prev => prev.filter((_, i) => i !== idx))
  }

  const submit = async () => {
    if (!canReport) {
      toast({ title: 'Yêu cầu đăng nhập', description: 'Vui lòng đăng nhập để báo cáo', variant: 'destructive' })
      return
    }
    if (reason.trim().length < 10) {
      toast({ title: 'Lý do quá ngắn', description: 'Vui lòng nhập lý do tối thiểu 10 ký tự', variant: 'destructive' })
      return
    }
    try {
      setSubmitting(true)
      const res = await reportApi.create({ reportedUserId, reason: reason.trim(), type, evidence: evidence.length ? evidence : undefined })
      if (!res.success) throw new Error(res.error || res.message || 'Gửi báo cáo thất bại')
      toast({ title: 'Đã gửi báo cáo', description: 'Cảm ơn bạn đã phản hồi' })
      setOpen(false)
      setReason('')
      setEvidence([])
      setNewEvidence('')
    } catch (e: any) {
      toast({ title: 'Lỗi', description: e?.message || 'Không thể gửi báo cáo', variant: 'destructive' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <Button
        variant={size === 'icon' ? 'ghost' : 'outline'}
        size={size}
        onClick={() => {
          if (!canReport) {
            toast({ title: 'Yêu cầu đăng nhập', description: 'Vui lòng đăng nhập để báo cáo', variant: 'destructive' })
            return
          }
          setOpen(true)
        }}
        className={className}
        aria-label="Báo cáo người dùng"
      >
        <Flag className="w-4 h-4" />{size !== 'icon' ? <span className="ml-2">Báo cáo</span> : null}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg w-[95vw]">
          <DialogHeader>
            <DialogTitle>Báo cáo người dùng</DialogTitle>
            <DialogDescription>Vui lòng mô tả vấn đề bạn gặp phải</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Loại báo cáo</Label>
              <Select value={type} onValueChange={(v) => setType(v as ReportType)}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Chọn loại" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="harassment">Quấy rối</SelectItem>
                  <SelectItem value="spam">Spam</SelectItem>
                  <SelectItem value="inappropriate_content">Nội dung không phù hợp</SelectItem>
                  <SelectItem value="fake_profile">Giả mạo hồ sơ</SelectItem>
                  <SelectItem value="other">Khác</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Lý do</Label>
              <Textarea value={reason} onChange={(e) => setReason(e.target.value)} maxLength={1000} placeholder="Nhập lý do chi tiết (tối thiểu 10 ký tự)" />
              <div className="text-xs text-right text-muted-foreground">{reason.length}/1000</div>
            </div>

            <div>
              <Label>Chứng cứ (URL, tùy chọn)</Label>
              <div className="flex gap-2 mt-1">
                <Input value={newEvidence} onChange={(e) => setNewEvidence(e.target.value)} placeholder="Dán URL minh chứng" />
                <Button type="button" variant="secondary" onClick={addEvidence}>Thêm</Button>
              </div>
              {evidence.length > 0 && (
                <ul className="mt-2 space-y-1 text-sm">
                  {evidence.map((u, idx) => (
                    <li key={`${u}-${idx}`} className="flex items-center justify-between bg-muted/50 rounded px-2 py-1">
                      <span className="truncate mr-2" title={u}>{u}</span>
                      <Button variant="ghost" size="sm" onClick={() => removeEvidence(idx)}>Xóa</Button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Hủy</Button>
            <Button onClick={submit} disabled={submitting || reason.trim().length < 10}>{submitting ? 'Đang gửi...' : 'Gửi báo cáo'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
