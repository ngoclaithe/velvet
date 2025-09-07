'use client'

import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import {
  CheckCircle,
  UserX,
  Search,
  Filter,
  AlertTriangle,
  Clock,
  Eye
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import { reportApi, type ReportItem, type ReportStatus } from '@/lib/api/report'

export default function ReportsPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [reports, setReports] = useState<ReportItem[]>([])
  const [selectedFilter, setSelectedFilter] = useState<'all' | ReportStatus>('all')
  const [query, setQuery] = useState('')
  const [detail, setDetail] = useState<ReportItem | null>(null)
  const [notes, setNotes] = useState('')
  const [updating, setUpdating] = useState(false)

  const loadReports = async () => {
    setIsLoading(true)
    try {
      const res = await reportApi.getReports({ page: 1, limit: 50 })
      if (res.success) {
        const list: ReportItem[] = Array.isArray((res.data as any)?.reports)
          ? (res.data as any).reports
          : (Array.isArray(res.data) ? (res.data as any) : [])
        setReports(list)
      } else {
        toast.error(res.error || 'Không thể tải dữ liệu báo cáo')
        setReports([])
      }
    } catch (e) {
      toast.error('Không thể tải dữ liệu báo cáo')
      setReports([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadReports()
  }, [])

  const filteredReports = useMemo(() => {
    const base = selectedFilter === 'all' ? reports : reports.filter(r => r.status === selectedFilter)
    const q = query.trim().toLowerCase()
    if (!q) return base
    return base.filter(r =>
      r.reason.toLowerCase().includes(q) ||
      r.reporter?.username?.toLowerCase().includes(q) ||
      r.reportedUser?.username?.toLowerCase().includes(q) ||
      String(r.id).includes(q)
    )
  }, [reports, selectedFilter, query])

  const counts = useMemo(() => ({
    all: reports.length,
    pending: reports.filter(r => r.status === 'pending').length,
    under_review: reports.filter(r => r.status === 'under_review').length,
    resolved: reports.filter(r => r.status === 'resolved').length,
    dismissed: reports.filter(r => r.status === 'dismissed').length,
  }), [reports])

  const todayCount = useMemo(() => reports.filter(r => new Date(r.createdAt).toDateString() === new Date().toDateString()).length, [reports])

  const getReportStatusBadge = (status: ReportStatus) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-orange-500">Chờ xử lý</Badge>
      case 'under_review':
        return <Badge className="bg-blue-500">Đang xem xét</Badge>
      case 'resolved':
        return <Badge className="bg-green-500">Đã giải quyết</Badge>
      case 'dismissed':
        return <Badge variant="secondary">Đã bỏ qua</Badge>
      default:
        return <Badge variant="secondary">Không xác định</Badge>
    }
  }

  const getTypeEmoji = (type: ReportItem['type']) => {
    switch (type) {
      case 'harassment': return '🚫'
      case 'spam': return '🗑️'
      case 'inappropriate_content': return '⚠️'
      case 'fake_profile': return '🎭'
      default: return '❓'
    }
  }

  const openDetail = async (id: number) => {
    try {
      const res = await reportApi.getById(id)
      if (res.success && res.data) {
        setDetail(res.data as any)
        setNotes((res.data as any).adminNotes || '')
      } else {
        toast.error(res.error || 'Không thể mở chi tiết')
      }
    } catch {
      toast.error('Không thể mở chi tiết')
    }
  }

  const updateStatus = async (id: number, status: ReportStatus) => {
    try {
      setUpdating(true)
      const res = await reportApi.updateStatus(id, { status, adminNotes: notes || undefined })
      if (!res.success) throw new Error(res.error || 'C���p nhật thất bại')
      toast.success('Đã cập nhật trạng thái')
      setDetail(prev => prev && prev.id === id ? (res.data as any) : prev)
      setReports(prev => prev.map(r => r.id === id ? (res.data as any) : r))
    } catch (e: any) {
      toast.error(e?.message || 'Có lỗi xảy ra')
    } finally {
      setUpdating(false)
    }
  }

  const deleteReport = async (id: number) => {
    try {
      setUpdating(true)
      const res = await reportApi.delete(id)
      if (!res.success) throw new Error(res.error || 'Xóa thất bại')
      toast.success('Đã xóa báo cáo')
      setDetail(null)
      setReports(prev => prev.filter(r => r.id !== id))
    } catch (e: any) {
      toast.error(e?.message || 'Có lỗi xảy ra')
    } finally {
      setUpdating(false)
    }
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="h-8 w-8 border-2 border-gray-300 border-t-transparent rounded-full animate-spin" />
          <span className="ml-2">Đang tải dữ liệu báo cáo...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Báo cáo vi phạm</h1>
          <p className="text-gray-600">Xử lý các báo cáo từ người dùng</p>
        </div>
        <div className="flex items-center space-x-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Tìm kiếm báo cáo..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <Button variant="outline" onClick={loadReports}>
            Làm mới
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-1 mb-6 bg-gray-100 p-1 rounded-lg">
        {([
          { key: 'all', label: 'Tất cả', count: counts.all },
          { key: 'pending', label: 'Chờ xử lý', count: counts.pending },
          { key: 'under_review', label: 'Đang xem xét', count: counts.under_review },
          { key: 'resolved', label: 'Đã giải quyết', count: counts.resolved },
          { key: 'dismissed', label: 'Đã bỏ qua', count: counts.dismissed },
        ] as const).map((filter) => (
          <button
            key={filter.key}
            onClick={() => setSelectedFilter(filter.key as any)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              selectedFilter === filter.key
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {filter.label} ({filter.count})
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Chờ xử lý</p>
                <p className="text-2xl font-bold">{counts.pending}</p>
              </div>
              <Badge className="bg-orange-100 text-orange-700">
                <Clock className="w-3 h-3 mr-1" />
                Pending
              </Badge>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Đang xem xét</p>
                <p className="text-2xl font-bold">{counts.under_review}</p>
              </div>
              <Badge className="bg-blue-100 text-blue-700">Under review</Badge>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Đã giải quyết</p>
                <p className="text-2xl font-bold">{counts.resolved}</p>
              </div>
              <Badge className="bg-green-100 text-green-700">
                <CheckCircle className="w-3 h-3 mr-1" />
                Resolved
              </Badge>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Hôm nay</p>
                <p className="text-2xl font-bold">{todayCount}</p>
              </div>
              <Badge className="bg-blue-100 text-blue-700">Today</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Danh sách Báo cáo</CardTitle>
          <CardDescription>Quản lý và xử lý các báo cáo vi phạm từ người dùng</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredReports.map((report) => (
              <div key={report.id} className="flex items-start justify-between p-4 border rounded-lg">
                <div className="flex items-start space-x-4">
                  <div className="text-2xl">{getTypeEmoji(report.type)}</div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <p className="font-medium">#{report.id} • {report.reportedUser?.username || report.reportedUserId}</p>
                    </div>
                    <p className="text-sm text-muted-foreground mb-1">
                      Báo cáo bởi: {report.reporter?.username || report.reporterId} • Lý do: {report.reason}
                    </p>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline">{report.type}</Badge>
                      {getReportStatusBadge(report.status)}
                      <span className="text-xs text-gray-500">
                        {new Date(report.createdAt).toLocaleString('vi-VN')}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button size="sm" variant="outline" onClick={() => openDetail(report.id)}>
                    <Eye className="w-4 h-4 mr-1" />
                    Chi tiết
                  </Button>
                  {report.status === 'pending' && (
                    <>
                      <Button size="sm" onClick={() => updateStatus(report.id, 'resolved')} className="bg-green-600 hover:bg-green-700">
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Giải quyết
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => updateStatus(report.id, 'dismissed')}>
                        <UserX className="w-4 h-4 mr-1" />
                        Bỏ qua
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ))}

            {filteredReports.length === 0 && (
              <div className="text-center py-8">
                <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {selectedFilter === 'all' ? 'Không có báo cáo nào' : `Không có báo cáo ${selectedFilter}`}
                </h3>
                <p className="text-gray-500">
                  {selectedFilter === 'pending' ? 'Tất cả báo cáo đã được xử lý' : 'Hệ thống đang hoạt động bình thường'}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!detail} onOpenChange={(o) => { if (!o) setDetail(null) }}>
        <DialogContent className="max-w-2xl w-[95vw]">
          {detail && (
            <>
              <DialogHeader>
                <DialogTitle>Báo cáo #{detail.id}</DialogTitle>
                <DialogDescription>
                  Người báo cáo: {detail.reporter?.username || detail.reporterId} • Người bị báo cáo: {detail.reportedUser?.username || detail.reportedUserId}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Loại</p>
                  <Badge className="mt-1">{detail.type}</Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Lý do</p>
                  <p className="mt-1 whitespace-pre-line">{detail.reason}</p>
                </div>
                {Array.isArray(detail.evidence) && detail.evidence.length > 0 && (
                  <div>
                    <p className="text-sm text-muted-foreground">Chứng cứ</p>
                    <ul className="mt-1 list-disc list-inside space-y-1 text-sm">
                      {detail.evidence.map((u, i) => (
                        <li key={`${u}-${i}`}><a className="text-blue-600 underline" href={u} target="_blank" rel="noreferrer">{u}</a></li>
                      ))}
                    </ul>
                  </div>
                )}
                <div>
                  <p className="text-sm text-muted-foreground">Ghi chú quản trị (tùy chọn)</p>
                  <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={1000} placeholder="Thêm ghi chú về xử lý" />
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>Tạo lúc: {new Date(detail.createdAt).toLocaleString('vi-VN')}</span>
                  <span>•</span>
                  <span>Cập nhật: {new Date(detail.updatedAt).toLocaleString('vi-VN')}</span>
                </div>
              </div>
              <DialogFooter>
                <Button variant="destructive" onClick={() => deleteReport(detail.id)} disabled={updating}>Xóa</Button>
                <Button variant="outline" onClick={() => setDetail(null)}>Đóng</Button>
                {detail.status !== 'resolved' && (
                  <Button onClick={() => updateStatus(detail.id, 'resolved')} disabled={updating} className="bg-green-600 hover:bg-green-700">Đánh dấu đã giải quyết</Button>
                )}
                {detail.status !== 'dismissed' && (
                  <Button variant="outline" onClick={() => updateStatus(detail.id, 'dismissed')} disabled={updating}>Bỏ qua</Button>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
