'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Icons } from '@/components/common/Icons'
import {
  Users,
  Video,
  DollarSign,
  Settings,
  Shield,
  BarChart3,
  UserCheck,
  UserX,
  Eye,
  Edit,
  Trash,
  AlertTriangle,
  CheckCircle,
  Clock,
  Ban,
  MessageSquare,
  TrendingUp,
  Activity
} from 'lucide-react'
import { toast } from 'react-hot-toast'

interface AdminStats {
  totalUsers: number
  totalCreators: number
  activeStreams: number
  totalRevenue: number
  pendingVerifications: number
  reportedContent: number
}

interface User {
  id: string
  username: string
  email: string
  role: 'user' | 'creator' | 'admin'
  status: 'active' | 'suspended' | 'banned'
  createdAt: string
  lastLogin?: string
  isVerified: boolean
}

interface Stream {
  id: string
  title: string
  creator: string
  viewers: number
  status: 'live' | 'ended' | 'scheduled'
  category: string
  startTime: string
  duration?: string
}

interface Report {
  id: string
  type: 'stream' | 'user' | 'chat'
  reportedBy: string
  targetId: string
  targetName: string
  reason: string
  status: 'pending' | 'resolved' | 'dismissed'
  createdAt: string
}

interface PaymentInfo {
  id: string
  bankName: string
  accountNumber: string
  accountHolderName: string
  qrCodeUrl?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export default function AdminDashboard() {
  const { user, isLoading: authLoading, isAuthenticated } = useAuth()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')

  // Mock data - would come from API
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    totalCreators: 0,
    activeStreams: 0,
    totalRevenue: 0,
    pendingVerifications: 0,
    reportedContent: 0
  })

  const [users, setUsers] = useState<User[]>([])
  const [streams, setStreams] = useState<Stream[]>([])
  const [reports, setReports] = useState<Report[]>([])
  const [paymentInfos, setPaymentInfos] = useState<PaymentInfo[]>([])

  // Payment info form states
  const [isEditingPayment, setIsEditingPayment] = useState(false)
  const [editingPaymentId, setEditingPaymentId] = useState<string | null>(null)
  const [paymentForm, setPaymentForm] = useState({
    bankName: '',
    accountNumber: '',
    accountHolderName: '',
    qrCodeUrl: '',
    isActive: true
  })

  // Check admin access
  useEffect(() => {
    if (!authLoading && (!isAuthenticated || user?.role !== 'admin')) {
      toast.error('Bạn không có quyền truy cập trang này')
      router.push('/')
    }
  }, [user, authLoading, isAuthenticated, router])

  // Load admin data
  useEffect(() => {
    const loadAdminData = async () => {
      if (!user || user.role !== 'admin') return

      setIsLoading(true)
      try {
        // Mock API calls - replace with real API
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        // Mock stats
        setStats({
          totalUsers: 15420,
          totalCreators: 1240,
          activeStreams: 89,
          totalRevenue: 245800,
          pendingVerifications: 23,
          reportedContent: 7
        })

        // Mock users data
        setUsers([
          {
            id: '1',
            username: 'user123',
            email: 'user@example.com',
            role: 'user',
            status: 'active',
            createdAt: '2024-01-15',
            lastLogin: '2024-01-20',
            isVerified: true
          },
          {
            id: '2',
            username: 'creator456',
            email: 'creator@example.com',
            role: 'creator',
            status: 'active',
            createdAt: '2024-01-10',
            lastLogin: '2024-01-19',
            isVerified: false
          }
        ])

        // Mock streams data
        setStreams([
          {
            id: '1',
            title: 'Gaming Stream',
            creator: 'streamer1',
            viewers: 245,
            status: 'live',
            category: 'Gaming',
            startTime: '2024-01-20T10:00:00Z'
          },
          {
            id: '2',
            title: 'Music Session',
            creator: 'musician2',
            viewers: 89,
            status: 'live',
            category: 'Music',
            startTime: '2024-01-20T11:30:00Z'
          }
        ])

        // Mock reports data
        setReports([
          {
            id: '1',
            type: 'stream',
            reportedBy: 'user123',
            targetId: 'stream456',
            targetName: 'Inappropriate Stream',
            reason: 'Nội dung không phù hợp',
            status: 'pending',
            createdAt: '2024-01-20T09:00:00Z'
          }
        ])

        // Mock payment info data
        setPaymentInfos([
          {
            id: '1',
            bankName: 'Vietcombank',
            accountNumber: '1234567890',
            accountHolderName: 'NGUYEN VAN A',
            qrCodeUrl: 'https://example.com/qr1.jpg',
            isActive: true,
            createdAt: '2024-01-15T10:00:00Z',
            updatedAt: '2024-01-15T10:00:00Z'
          },
          {
            id: '2',
            bankName: 'Techcombank',
            accountNumber: '0987654321',
            accountHolderName: 'TRAN THI B',
            qrCodeUrl: '',
            isActive: false,
            createdAt: '2024-01-10T15:30:00Z',
            updatedAt: '2024-01-18T09:20:00Z'
          }
        ])

      } catch (error) {
        console.error('Failed to load admin data:', error)
        toast.error('Không thể tải dữ liệu admin')
      } finally {
        setIsLoading(false)
      }
    }

    loadAdminData()
  }, [user])

  const handleUserAction = async (userId: string, action: 'suspend' | 'ban' | 'verify' | 'activate') => {
    try {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 500))
      
      setUsers(prev => prev.map(u => {
        if (u.id === userId) {
          switch (action) {
            case 'suspend':
              return { ...u, status: 'suspended' }
            case 'ban':
              return { ...u, status: 'banned' }
            case 'verify':
              return { ...u, isVerified: true }
            case 'activate':
              return { ...u, status: 'active' }
            default:
              return u
          }
        }
        return u
      }))

      toast.success(`Đã ${action} user thành công`)
    } catch (error) {
      toast.error('Có lỗi xảy ra')
    }
  }

  const handleReportAction = async (reportId: string, action: 'resolve' | 'dismiss') => {
    try {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 500))

      setReports(prev => prev.map(r =>
        r.id === reportId
          ? { ...r, status: action === 'resolve' ? 'resolved' : 'dismissed' }
          : r
      ))

      toast.success(`Đã ${action} báo cáo thành công`)
    } catch (error) {
      toast.error('Có lỗi xảy ra')
    }
  }

  const handleCreatePaymentInfo = async () => {
    try {
      // Validation
      if (!paymentForm.bankName || !paymentForm.accountNumber || !paymentForm.accountHolderName) {
        toast.error('Vui lòng điền đầy đủ thông tin bắt buộc')
        return
      }

      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 500))

      const newPaymentInfo: PaymentInfo = {
        id: Date.now().toString(),
        bankName: paymentForm.bankName,
        accountNumber: paymentForm.accountNumber,
        accountHolderName: paymentForm.accountHolderName,
        qrCodeUrl: paymentForm.qrCodeUrl || '',
        isActive: paymentForm.isActive,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      setPaymentInfos(prev => [newPaymentInfo, ...prev])
      setPaymentForm({
        bankName: '',
        accountNumber: '',
        accountHolderName: '',
        qrCodeUrl: '',
        isActive: true
      })
      setIsEditingPayment(false)

      toast.success('Đã tạo thông tin thanh toán thành công')
    } catch (error) {
      toast.error('Có lỗi xảy ra khi tạo thông tin thanh toán')
    }
  }

  const handleUpdatePaymentInfo = async () => {
    try {
      if (!editingPaymentId) return

      // Validation
      if (!paymentForm.bankName || !paymentForm.accountNumber || !paymentForm.accountHolderName) {
        toast.error('Vui lòng điền đầy đủ thông tin bắt buộc')
        return
      }

      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 500))

      setPaymentInfos(prev => prev.map(info =>
        info.id === editingPaymentId
          ? {
              ...info,
              bankName: paymentForm.bankName,
              accountNumber: paymentForm.accountNumber,
              accountHolderName: paymentForm.accountHolderName,
              qrCodeUrl: paymentForm.qrCodeUrl || '',
              isActive: paymentForm.isActive,
              updatedAt: new Date().toISOString()
            }
          : info
      ))

      setPaymentForm({
        bankName: '',
        accountNumber: '',
        accountHolderName: '',
        qrCodeUrl: '',
        isActive: true
      })
      setIsEditingPayment(false)
      setEditingPaymentId(null)

      toast.success('Đã cập nhật thông tin thanh toán thành công')
    } catch (error) {
      toast.error('Có lỗi xảy ra khi cập nhật thông tin thanh toán')
    }
  }

  const handleEditPaymentInfo = (paymentInfo: PaymentInfo) => {
    setPaymentForm({
      bankName: paymentInfo.bankName,
      accountNumber: paymentInfo.accountNumber,
      accountHolderName: paymentInfo.accountHolderName,
      qrCodeUrl: paymentInfo.qrCodeUrl || '',
      isActive: paymentInfo.isActive
    })
    setEditingPaymentId(paymentInfo.id)
    setIsEditingPayment(true)
  }

  const handleDeletePaymentInfo = async (paymentId: string) => {
    try {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 500))

      setPaymentInfos(prev => prev.filter(info => info.id !== paymentId))

      toast.success('Đã xóa thông tin thanh toán thành công')
    } catch (error) {
      toast.error('Có lỗi xảy ra khi xóa thông tin thanh toán')
    }
  }

  const handleTogglePaymentStatus = async (paymentId: string) => {
    try {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 500))

      setPaymentInfos(prev => prev.map(info =>
        info.id === paymentId
          ? { ...info, isActive: !info.isActive, updatedAt: new Date().toISOString() }
          : info
      ))

      toast.success('Đã cập nhật trạng thái thành công')
    } catch (error) {
      toast.error('Có lỗi xảy ra')
    }
  }

  const getUserStatusBadge = (status: User['status']) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500">Hoạt động</Badge>
      case 'suspended':
        return <Badge className="bg-yellow-500">Tạm khóa</Badge>
      case 'banned':
        return <Badge className="bg-red-500">Cấm</Badge>
      default:
        return <Badge variant="secondary">Không xác định</Badge>
    }
  }

  const getStreamStatusBadge = (status: Stream['status']) => {
    switch (status) {
      case 'live':
        return <Badge className="bg-red-500 animate-pulse">LIVE</Badge>
      case 'ended':
        return <Badge variant="secondary">Đã kết thúc</Badge>
      case 'scheduled':
        return <Badge className="bg-blue-500">Đã lên lịch</Badge>
      default:
        return <Badge variant="secondary">Không xác định</Badge>
    }
  }

  const getReportStatusBadge = (status: Report['status']) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-orange-500">Chờ xử lý</Badge>
      case 'resolved':
        return <Badge className="bg-green-500">Đã giải quyết</Badge>
      case 'dismissed':
        return <Badge variant="secondary">Đã bỏ qua</Badge>
      default:
        return <Badge variant="secondary">Không xác định</Badge>
    }
  }

  if (authLoading || isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <Icons.spinner className="h-8 w-8 animate-spin" />
          <span className="ml-2">Đang tải dashboard...</span>
        </div>
      </div>
    )
  }

  if (!isAuthenticated || user?.role !== 'admin') {
    return null
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Shield className="w-8 h-8 text-blue-600" />
            Admin Dashboard
          </h1>
          <p className="text-muted-foreground">Quản lý hệ thống streaming platform</p>
        </div>
        <Button variant="outline" onClick={() => window.location.reload()}>
          <Activity className="w-4 h-4 mr-2" />
          Làm mới
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Users className="w-4 h-4 mr-2 text-blue-600" />
              Tổng Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers.toLocaleString()}</div>
            <p className="text-xs text-green-600">+12% tháng này</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Video className="w-4 h-4 mr-2 text-purple-600" />
              Creators
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCreators.toLocaleString()}</div>
            <p className="text-xs text-green-600">+8% tháng này</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Activity className="w-4 h-4 mr-2 text-red-600" />
              Streams Live
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeStreams}</div>
            <p className="text-xs text-muted-foreground">Hiện tại</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <DollarSign className="w-4 h-4 mr-2 text-green-600" />
              Doanh thu
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-green-600">+15% tháng này</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Clock className="w-4 h-4 mr-2 text-orange-600" />
              Chờ xác thực
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingVerifications}</div>
            <p className="text-xs text-orange-600">Cần xử lý</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <AlertTriangle className="w-4 h-4 mr-2 text-red-600" />
              Báo cáo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.reportedContent}</div>
            <p className="text-xs text-red-600">Chờ xử lý</p>
          </CardContent>
        </Card>
      </div>

      {/* Admin Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Tổng quan</TabsTrigger>
          <TabsTrigger value="users">Quản lý Users</TabsTrigger>
          <TabsTrigger value="streams">Quản lý Streams</TabsTrigger>
          <TabsTrigger value="reports">Báo cáo</TabsTrigger>
          <TabsTrigger value="payments">Thông tin thanh toán</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="w-5 h-5 mr-2" />
                  Hoạt động gần đây
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">User đăng ký mới</span>
                    <Badge>+142 hôm nay</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Streams được tạo</span>
                    <Badge>+23 hôm nay</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Giao dịch thành công</span>
                    <Badge>+1,234 hôm nay</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Báo cáo mới</span>
                    <Badge variant="destructive">+3 hôm nay</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="w-5 h-5 mr-2" />
                  Thống kê nhanh
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Tỷ lệ Creator hoạt động</span>
                      <span>78%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-green-600 h-2 rounded-full" style={{ width: '78%' }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Streams thành công</span>
                      <span>92%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-blue-600 h-2 rounded-full" style={{ width: '92%' }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Mức độ hài lòng</span>
                      <span>85%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-purple-600 h-2 rounded-full" style={{ width: '85%' }}></div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Quản lý Users</CardTitle>
              <CardDescription>Quản lý tài khoản người dùng và creator</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {users.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div>
                        <p className="font-medium">{user.username}</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge variant="outline">{user.role}</Badge>
                          {getUserStatusBadge(user.status)}
                          {user.isVerified && <Badge className="bg-blue-500">Xác thực</Badge>}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {!user.isVerified && user.role === 'creator' && (
                        <Button
                          size="sm"
                          onClick={() => handleUserAction(user.id, 'verify')}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          <UserCheck className="w-4 h-4 mr-1" />
                          Xác thực
                        </Button>
                      )}
                      {user.status === 'active' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleUserAction(user.id, 'suspend')}
                        >
                          <Clock className="w-4 h-4 mr-1" />
                          Tạm khóa
                        </Button>
                      )}
                      {user.status === 'suspended' && (
                        <Button
                          size="sm"
                          onClick={() => handleUserAction(user.id, 'activate')}
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Kích hoạt
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleUserAction(user.id, 'ban')}
                      >
                        <Ban className="w-4 h-4 mr-1" />
                        Cấm
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="streams" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Quản lý Streams</CardTitle>
              <CardDescription>Theo dõi và quản lý các stream đang diễn ra</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {streams.map((stream) => (
                  <div key={stream.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div>
                        <p className="font-medium">{stream.title}</p>
                        <p className="text-sm text-muted-foreground">
                          Creator: {stream.creator} • Category: {stream.category}
                        </p>
                        <div className="flex items-center space-x-2 mt-1">
                          {getStreamStatusBadge(stream.status)}
                          <Badge variant="outline">{stream.viewers} viewers</Badge>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button size="sm" variant="outline">
                        <Eye className="w-4 h-4 mr-1" />
                        Xem
                      </Button>
                      <Button size="sm" variant="outline">
                        <MessageSquare className="w-4 h-4 mr-1" />
                        Chat
                      </Button>
                      <Button size="sm" variant="destructive">
                        <Ban className="w-4 h-4 mr-1" />
                        Dừng
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Báo cáo vi phạm</CardTitle>
              <CardDescription>Xử lý các báo cáo từ người dùng</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {reports.map((report) => (
                  <div key={report.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div>
                        <p className="font-medium">{report.targetName}</p>
                        <p className="text-sm text-muted-foreground">
                          Báo cáo bởi: {report.reportedBy} • Lý do: {report.reason}
                        </p>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge variant="outline">{report.type}</Badge>
                          {getReportStatusBadge(report.status)}
                        </div>
                      </div>
                    </div>
                    {report.status === 'pending' && (
                      <div className="flex items-center space-x-2">
                        <Button
                          size="sm"
                          onClick={() => handleReportAction(report.id, 'resolve')}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Giải quyết
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleReportAction(report.id, 'dismiss')}
                        >
                          <UserX className="w-4 h-4 mr-1" />
                          Bỏ qua
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
