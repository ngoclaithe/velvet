"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { requestDeposit } from "@/lib/api/requestDeposit"
import { useToast } from "@/hooks/use-toast"
import { Icons } from "@/components/common/Icons"
import { RefreshCw, CheckCircle2, XCircle, Clock, Banknote, User as UserIcon, Hash } from "lucide-react"

type DepositStatus = "pending" | "approved" | "rejected"

interface AdminRequestDeposit {
  id: string
  amount: number
  infoPaymentId: number
  transactionCode?: string
  note?: string
  status: DepositStatus
  codePay?: string
  createdAt: string | Date
  user?: { id: string; username?: string; email?: string }
  infoPayment?: { bankName?: string; accountNumber?: string; accountName?: string; provider?: string; type?: string }
}

export default function AdminDepositsPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [requests, setRequests] = useState<AdminRequestDeposit[]>([])
  const [filter, setFilter] = useState<DepositStatus | "all">("pending")

  const filtered = useMemo(() => {
    if (filter === "all") return requests
    return requests.filter((r) => r.status === filter)
  }, [requests, filter])

  const loadData = async () => {
    setLoading(true)
    try {
      const res = await requestDeposit.getRequestDeposit()
      if (res.success && Array.isArray(res.data)) {
        setRequests(
          res.data.map((rd: any) => ({
            ...rd,
            createdAt: rd.createdAt ?? new Date().toISOString(),
          }))
        )
      } else {
        toast({
          title: "Không thể tải danh sách",
          description: res.error || "Vui lòng thử lại",
          variant: "destructive",
        })
      }
    } catch (e) {
      toast({ title: "Lỗi", description: "Không thể tải dữ liệu", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const updateStatus = async (id: string, status: Exclude<DepositStatus, "pending">) => {
    setUpdatingId(id)
    try {
      const res = await requestDeposit.updateRequestStatus(id, { status })
      if (res.success) {
        setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)))
        toast({
          title: status === "approved" ? "Đã phê duyệt" : "Đã từ chối",
          description: `Yêu cầu ${status === "approved" ? "được phê duyệt" : "bị từ chối"}.`,
          variant: "default",
        })
      } else {
        toast({ title: "Thao tác thất bại", description: res.error || "Vui lòng thử lại", variant: "destructive" })
      }
    } catch (e) {
      toast({ title: "Thao tác thất bại", description: "Không thể cập nhật trạng thái", variant: "destructive" })
    } finally {
      setUpdatingId(null)
    }
  }

  const formatVND = (n: number) => (Number(n) || 0).toLocaleString("vi-VN") + " VND"
  const formatDate = (d: string | Date) => new Date(d).toLocaleString("vi-VN")

  const StatBadge = ({ label, value, color }: { label: string; value: number; color: string }) => (
    <div className="flex items-center gap-2">
      <span className={`inline-flex h-2 w-2 rounded-full ${color}`} />
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  )

  const counts = useMemo(() => ({
    all: requests.length,
    pending: requests.filter((r) => r.status === "pending").length,
    approved: requests.filter((r) => r.status === "approved").length,
    rejected: requests.filter((r) => r.status === "rejected").length,
  }), [requests])

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Quản lý yêu cầu nạp tiền</h1>
          <p className="text-sm text-muted-foreground">Xem và phê duyệt các yêu cầu nạp tiền của người dùng</p>
        </div>
        <Button variant="ghost" onClick={loadData} disabled={loading}>
          {loading ? <Icons.spinner className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          <span className="ml-2">Làm mới</span>
        </Button>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <Banknote className="h-5 w-5 text-green-600" />
            Danh sách yêu cầu
          </CardTitle>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant={filter === "all" ? "default" : "secondary"} size="sm" onClick={() => setFilter("all")}>Tất cả ({counts.all})</Button>
            <Button variant={filter === "pending" ? "default" : "secondary"} size="sm" onClick={() => setFilter("pending")}>
              <Clock className="mr-1 h-4 w-4" /> Chờ duyệt ({counts.pending})
            </Button>
            <Button variant={filter === "approved" ? "default" : "secondary"} size="sm" onClick={() => setFilter("approved")}>
              <CheckCircle2 className="mr-1 h-4 w-4" /> Đã duyệt ({counts.approved})
            </Button>
            <Button variant={filter === "rejected" ? "default" : "secondary"} size="sm" onClick={() => setFilter("rejected")}>
              <XCircle className="mr-1 h-4 w-4" /> Từ chối ({counts.rejected})
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
              <Icons.spinner className="h-5 w-5 animate-spin" />
              <span className="ml-2">Đang tải dữ liệu...</span>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
              Không có yêu cầu nào
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full table-auto text-sm">
                <thead>
                  <tr className="border-b bg-muted/40 text-left">
                    <th className="px-3 py-2 font-medium">Mã</th>
                    <th className="px-3 py-2 font-medium">Người dùng</th>
                    <th className="px-3 py-2 font-medium">Số tiền</th>
                    <th className="px-3 py-2 font-medium">Phương thức</th>
                    <th className="px-3 py-2 font-medium">Trạng thái</th>
                    <th className="px-3 py-2 font-medium">Thời gian</th>
                    <th className="px-3 py-2 font-medium text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r) => (
                    <tr key={r.id} className="border-b">
                      <td className="px-3 py-2 align-top">
                        <div className="flex items-center gap-2">
                          <Hash className="h-3 w-3 text-muted-foreground" />
                          <div className="font-medium">{r.codePay || r.transactionCode || r.id}</div>
                        </div>
                      </td>
                      <td className="px-3 py-2 align-top">
                        <div className="flex items-center gap-2">
                          <UserIcon className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <div className="font-medium">{r.user?.username || r.user?.email || r.user?.id || "—"}</div>
                            {r.user?.email && (
                              <div className="text-xs text-muted-foreground">{r.user.email}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-2 align-top">
                        <div className="font-semibold text-green-700">{formatVND(r.amount)}</div>
                      </td>
                      <td className="px-3 py-2 align-top">
                        <div>
                          <div className="font-medium">{r.infoPayment?.bankName || r.infoPayment?.provider || "Chuyển khoản"}</div>
                          {r.infoPayment?.accountNumber && (
                            <div className="text-xs text-muted-foreground">{r.infoPayment.accountNumber}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-2 align-top">
                        {r.status === "approved" && (
                          <Badge className="bg-green-100 text-green-800">Đã duyệt</Badge>
                        )}
                        {r.status === "pending" && (
                          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Chờ duyệt</Badge>
                        )}
                        {r.status === "rejected" && (
                          <Badge variant="destructive">Từ chối</Badge>
                        )}
                      </td>
                      <td className="px-3 py-2 align-top whitespace-nowrap">{formatDate(r.createdAt)}</td>
                      <td className="px-3 py-2 align-top">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={r.status !== "pending" || updatingId === r.id}
                            onClick={() => updateStatus(r.id, "approved")}
                          >
                            {updatingId === r.id ? (
                              <Icons.spinner className="mr-1 h-4 w-4 animate-spin" />
                            ) : (
                              <CheckCircle2 className="mr-1 h-4 w-4 text-green-600" />
                            )}
                            Duyệt
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            disabled={r.status !== "pending" || updatingId === r.id}
                            onClick={() => updateStatus(r.id, "rejected")}
                          >
                            {updatingId === r.id ? (
                              <Icons.spinner className="mr-1 h-4 w-4 animate-spin" />
                            ) : (
                              <XCircle className="mr-1 h-4 w-4" />
                            )}
                            Từ chối
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="mt-4 flex flex-wrap items-center gap-4 text-xs">
        <StatBadge label="Tổng" value={counts.all} color="bg-slate-400" />
        <Separator orientation="vertical" className="h-4" />
        <StatBadge label="Chờ duyệt" value={counts.pending} color="bg-yellow-500" />
        <StatBadge label="Đã duyệt" value={counts.approved} color="bg-green-600" />
        <StatBadge label="Từ chối" value={counts.rejected} color="bg-red-600" />
      </div>
    </div>
  )
}
