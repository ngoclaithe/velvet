'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { Icons } from '@/components/common/Icons'
import {
  Save,
  RefreshCw,
  Server,
  Shield,
  Mail,
  Database,
  Globe,
  Bell,
  Users,
  DollarSign
} from 'lucide-react'
import { toast } from 'react-hot-toast'

interface SystemSettings {
  siteName: string
  siteDescription: string
  maintenanceMode: boolean
  userRegistration: boolean
  creatorVerification: boolean
  maxUploadSize: number
  streamingQuality: string
  emailNotifications: boolean
  autoModeration: boolean
  minimumAge: number
  commissionRate: number
}

export default function SettingsPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [settings, setSettings] = useState<SystemSettings>({
    siteName: 'VelvetSocial',
    siteDescription: 'Nền tảng mạng xã hội adult hàng đầu',
    maintenanceMode: false,
    userRegistration: true,
    creatorVerification: true,
    maxUploadSize: 100,
    streamingQuality: 'HD',
    emailNotifications: true,
    autoModeration: true,
    minimumAge: 18,
    commissionRate: 10
  })

  // Load settings data
  useEffect(() => {
    const loadSettings = async () => {
      setIsLoading(true)
      try {
        // Mock API call
        await new Promise(resolve => setTimeout(resolve, 1000))
        // Settings already initialized above
      } catch (error) {
        console.error('Failed to load settings:', error)
        toast.error('Không thể tải cài đặt hệ thống')
      } finally {
        setIsLoading(false)
      }
    }

    loadSettings()
  }, [])

  const handleSaveSettings = async () => {
    setIsSaving(true)
    try {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      toast.success('Đã lưu cài đặt thành công')
    } catch (error) {
      toast.error('Có lỗi xảy ra khi lưu cài đặt')
    } finally {
      setIsSaving(false)
    }
  }

  const handleSystemAction = async (action: 'restart' | 'backup' | 'cache') => {
    try {
      setIsSaving(true)
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      switch (action) {
        case 'restart':
          toast.success('Đã khởi động lại hệ thống')
          break
        case 'backup':
          toast.success('Đã tạo backup thành công')
          break
        case 'cache':
          toast.success('Đã xóa cache thành công')
          break
      }
    } catch (error) {
      toast.error('Có lỗi xảy ra')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <Icons.spinner className="h-8 w-8 animate-spin" />
          <span className="ml-2">Đang tải cài đặt...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Cài đặt hệ thống</h1>
          <p className="text-gray-600">Quản lý cấu hình và tùy chỉnh hệ thống</p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            onClick={handleSaveSettings}
            disabled={isSaving}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isSaving ? (
              <Icons.spinner className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Lưu cài đặt
          </Button>
        </div>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="general">Chung</TabsTrigger>
          <TabsTrigger value="moderation">Kiểm duyệt</TabsTrigger>
          <TabsTrigger value="system">Hệ thống</TabsTrigger>
          <TabsTrigger value="business">Kinh doanh</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Globe className="w-5 h-5 mr-2" />
                Thông tin trang web
              </CardTitle>
              <CardDescription>Cấu hình thông tin cơ bản của trang web</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="siteName">Tên trang web</Label>
                  <Input
                    id="siteName"
                    value={settings.siteName}
                    onChange={(e) => setSettings(prev => ({ ...prev, siteName: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="minimumAge">Độ tuổi tối thiểu</Label>
                  <Input
                    id="minimumAge"
                    type="number"
                    value={settings.minimumAge}
                    onChange={(e) => setSettings(prev => ({ ...prev, minimumAge: parseInt(e.target.value) }))}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="siteDescription">Mô tả trang web</Label>
                <Input
                  id="siteDescription"
                  value={settings.siteDescription}
                  onChange={(e) => setSettings(prev => ({ ...prev, siteDescription: e.target.value }))}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="w-5 h-5 mr-2" />
                Cài đặt người dùng
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Cho phép đăng ký mới</Label>
                  <p className="text-sm text-gray-500">Người dùng có thể tạo tài khoản mới</p>
                </div>
                <Switch
                  checked={settings.userRegistration}
                  onCheckedChange={(checked) => setSettings(prev => ({ ...prev, userRegistration: checked }))}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Yêu cầu xác thực Creator</Label>
                  <p className="text-sm text-gray-500">Creator cần được admin xác thực</p>
                </div>
                <Switch
                  checked={settings.creatorVerification}
                  onCheckedChange={(checked) => setSettings(prev => ({ ...prev, creatorVerification: checked }))}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Thông báo email</Label>
                  <p className="text-sm text-gray-500">Gửi email thông báo cho người dùng</p>
                </div>
                <Switch
                  checked={settings.emailNotifications}
                  onCheckedChange={(checked) => setSettings(prev => ({ ...prev, emailNotifications: checked }))}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="moderation" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="w-5 h-5 mr-2" />
                Kiểm duyệt tự động
              </CardTitle>
              <CardDescription>Cấu hình hệ thống kiểm duyệt nội dung</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Bật kiểm duyệt tự động</Label>
                  <p className="text-sm text-gray-500">Hệ thống sẽ tự động kiểm duyệt nội dung</p>
                </div>
                <Switch
                  checked={settings.autoModeration}
                  onCheckedChange={(checked) => setSettings(prev => ({ ...prev, autoModeration: checked }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxUploadSize">Kích thước file tối đa (MB)</Label>
                <Input
                  id="maxUploadSize"
                  type="number"
                  value={settings.maxUploadSize}
                  onChange={(e) => setSettings(prev => ({ ...prev, maxUploadSize: parseInt(e.target.value) }))}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Server className="w-5 h-5 mr-2" />
                Quản lý hệ thống
              </CardTitle>
              <CardDescription>Thực hiện các tác vụ quản trị hệ thống</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Chế độ bảo trì</Label>
                  <p className="text-sm text-gray-500">Tạm dừng truy cập từ người dùng</p>
                </div>
                <Switch
                  checked={settings.maintenanceMode}
                  onCheckedChange={(checked) => setSettings(prev => ({ ...prev, maintenanceMode: checked }))}
                />
              </div>
              
              <div className="pt-4 border-t">
                <h4 className="font-medium mb-4">Tác vụ hệ thống</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button
                    variant="outline"
                    onClick={() => handleSystemAction('restart')}
                    disabled={isSaving}
                    className="flex items-center justify-center"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Khởi động lại
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleSystemAction('backup')}
                    disabled={isSaving}
                    className="flex items-center justify-center"
                  >
                    <Database className="w-4 h-4 mr-2" />
                    Backup dữ liệu
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleSystemAction('cache')}
                    disabled={isSaving}
                    className="flex items-center justify-center"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Xóa cache
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="business" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <DollarSign className="w-5 h-5 mr-2" />
                Cài đặt kinh doanh
              </CardTitle>
              <CardDescription>Cấu hình các thông số liên quan đến doanh thu</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="commissionRate">Tỷ lệ hoa hồng (%)</Label>
                <Input
                  id="commissionRate"
                  type="number"
                  value={settings.commissionRate}
                  onChange={(e) => setSettings(prev => ({ ...prev, commissionRate: parseFloat(e.target.value) }))}
                />
                <p className="text-sm text-gray-500">Tỷ lệ hoa hồng mà platform thu từ creator</p>
              </div>
              
              <div className="pt-4 border-t">
                <h4 className="font-medium mb-2">Thống kê doanh thu</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-green-50 rounded-lg">
                    <p className="text-sm text-green-600">Doanh thu tháng này</p>
                    <p className="text-2xl font-bold text-green-700">$24,580</p>
                  </div>
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-600">Hoa hồng thu được</p>
                    <p className="text-2xl font-bold text-blue-700">$2,458</p>
                  </div>
                  <div className="p-4 bg-purple-50 rounded-lg">
                    <p className="text-sm text-purple-600">Giao dịch thành công</p>
                    <p className="text-2xl font-bold text-purple-700">1,234</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
