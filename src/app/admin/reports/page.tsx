'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Icons } from '@/components/common/Icons'
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

interface Report {
  id: string
  type: 'stream' | 'user' | 'chat'
  reportedBy: string
  targetId: string
  targetName: string
  reason: string
  description?: string
  status: 'pending' | 'resolved' | 'dismissed'
  createdAt: string
  priority: 'low' | 'medium' | 'high'
}

export default function ReportsPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [reports, setReports] = useState<Report[]>([])
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'pending' | 'resolved' | 'dismissed'>('all')

  // Load reports data
  useEffect(() => {
    const loadReportsData = async () => {
      setIsLoading(true)
      try {
        // Mock API call
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        setReports([
          {
            id: '1',
            type: 'stream',
            reportedBy: 'user123',
            targetId: 'stream456',
            targetName: 'Inappropriate Stream Content',
            reason: 'Nội dung không phù hợp',
            description: 'Stream có chứa nội dung bạo lực và không phù hợp với guidelines',
            status: 'pending',
            createdAt: '2024-01-20T09:00:00Z',
            priority: 'high'
          },
          {
            id: '2',
            type: 'user',
            reportedBy: 'moderator789',
            targetId: 'user999',
            targetName: 'Spammer Account',
            reason: 'Spam và quấy rối',
            description: 'User liên tục spam tin nhắn và quấy rối các creator',
            status: 'pending',
            createdAt: '2024-01-20T08:30:00Z',
            priority: 'medium'
          },
          {
            id: '3',
            type: 'chat',
            reportedBy: 'viewer456',
            targetId: 'chat123',
            targetName: 'Hate Speech in Chat',
            reason: 'Ngôn từ thù địch',
            description: 'Sử dụng ngôn từ phân biệt chủng tộc trong chat',
            status: 'resolved',
            createdAt: '2024-01-19T15:20:00Z',
            priority: 'high'
          },
          {
            id: '4',
            type: 'stream',
            reportedBy: 'user111',
            targetId: 'stream222',
            targetName: 'Copyright Violation',
            reason: 'Vi phạm bản quyền',
            description: 'Stream phát nhạc có bản quyền mà không có phép',
            status: 'dismissed',
            createdAt: '2024-01-19T12:10:00Z',
            priority: 'low'
          }
        ])
      } catch (error) {
        console.error('Failed to load reports data:', error)
        toast.error('Không thể tải dữ liệu báo cáo')
      } finally {
        setIsLoading(false)
      }
    }

    loadReportsData()
  }, [])

  const handleReportAction = async (reportId: string, action: 'resolve' | 'dismiss' | 'view') => {
    try {
      if (action === 'view') {
        toast.info('Mở chi tiết báo cáo...')
        return
      }

      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 500))

      setReports(prev => prev.map(r =>
        r.id === reportId
          ? { ...r, status: action === 'resolve' ? 'resolved' : 'dismissed' }
          : r
      ))

      toast.success(`Đã ${action === 'resolve' ? 'giải quyết' : 'bỏ qua'} báo cáo thành công`)
    } catch (error) {
      toast.error('Có lỗi xảy ra')
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

  const getPriorityBadge = (priority: Report['priority']) => {
    switch (priority) {
      case 'high':
        return <Badge className="bg-red-500">Cao</Badge>
      case 'medium':
        return <Badge className="bg-yellow-500">Trung bình</Badge>
      case 'low':
        return <Badge className="bg-gray-500">Thấp</Badge>
      default:
        return <Badge variant="secondary">Không xác định</Badge>
    }
  }

  const getTypeIcon = (type: Report['type']) => {
    switch (type) {
      case 'stream':
        return '📺'
      case 'user':
        return '👤'
      case 'chat':
        return '💬'
      default:
        return '❓'
    }
  }

  const filteredReports = reports.filter(report => 
    selectedFilter === 'all' || report.status === selectedFilter
  )

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <Icons.spinner className="h-8 w-8 animate-spin" />
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
              placeholder="Tìm kiếm báo cáo..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg">
        {[
          { key: 'all', label: 'Tất cả', count: reports.length },
          { key: 'pending', label: 'Chờ xử lý', count: reports.filter(r => r.status === 'pending').length },
          { key: 'resolved', label: 'Đã giải quyết', count: reports.filter(r => r.status === 'resolved').length },
          { key: 'dismissed', label: 'Đã bỏ qua', count: reports.filter(r => r.status === 'dismissed').length }
        ].map((filter) => (
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

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Chờ xử lý</p>
                <p className="text-2xl font-bold">{reports.filter(r => r.status === 'pending').length}</p>
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
                <p className="text-sm text-gray-600">Độ ưu tiên cao</p>
                <p className="text-2xl font-bold">{reports.filter(r => r.priority === 'high').length}</p>
              </div>
              <Badge className="bg-red-100 text-red-700">
                <AlertTriangle className="w-3 h-3 mr-1" />
                High
              </Badge>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Đã giải quyết</p>
                <p className="text-2xl font-bold">{reports.filter(r => r.status === 'resolved').length}</p>
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
                <p className="text-2xl font-bold">
                  {reports.filter(r => 
                    new Date(r.createdAt).toDateString() === new Date().toDateString()
                  ).length}
                </p>
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
                  <div className="text-2xl">{getTypeIcon(report.type)}</div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <p className="font-medium">{report.targetName}</p>
                      {getPriorityBadge(report.priority)}
                    </div>
                    <p className="text-sm text-muted-foreground mb-1">
                      Báo cáo bởi: {report.reportedBy} • Lý do: {report.reason}
                    </p>
                    {report.description && (
                      <p className="text-sm text-gray-600 mb-2">{report.description}</p>
                    )}
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
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleReportAction(report.id, 'view')}
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    Chi tiết
                  </Button>
                  {report.status === 'pending' && (
                    <>
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
    </div>
  )
}
