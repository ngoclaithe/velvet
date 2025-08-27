'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Icons } from '@/components/common/Icons'
import {
  User as UserIcon,
  Edit3,
  Save,
  Camera,
  Heart,
  Users,
  Eye,
  Gift,
  Settings,
  MapPin,
  Calendar as CalendarIcon,
  Link as LinkIcon,
  Shield,
  Bell,
  Lock,
  UserPlus,
  FileText,
  Upload,
  CheckCircle,
  AlertCircle,
  Clock,
  X,
  Send
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import type { User } from '@/types/auth'
import { kycApi, type KycSubmission, type KycDocument, getKycStatusDescription, getVerificationLevelDescription, getDocumentTypeDescription } from '@/lib/api/kyc'
import type { ApiResponse } from '@/types/api'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'

type Gender = 'male' | 'female' | 'other';

interface FormData {
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  phoneNumber: string;
  bio: string;
  location: string;
  website: string;
  gender: Gender | '';
  dateOfBirth: string;
}

export default function ProfilePage() {
  const { user, updateProfile, isLoading: authLoading, isAuthenticated } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [formData, setFormData] = useState<FormData>({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    username: user?.username || '',
    email: user?.email || '',
    phoneNumber: user?.phoneNumber || '',
    bio: user?.bio || '',
    location: user?.location || '',
    website: user?.website || '',
    gender: user?.gender || '',
    dateOfBirth: user?.dateOfBirth ? new Date(user.dateOfBirth).toISOString().split('T')[0] : '',
  })

  const [privacySettings, setPrivacySettings] = useState({
    profileVisible: true,
    showEmail: false,
    showPhone: false,
    allowMessages: true,
    allowFollows: true,
  })

  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    pushNotifications: true,
    followNotifications: true,
    messageNotifications: true,
    likeNotifications: false,
    commentNotifications: true,
  })

  // KYC related state
  const [kycSubmission, setKycSubmission] = useState<KycSubmission | null>(null)
  const [kycStatus, setKycStatus] = useState<string>('draft')
  const [isLoadingKyc, setIsLoadingKyc] = useState(false)
  const [isUploadingDoc, setIsUploadingDoc] = useState(false)
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)
  const [selectedDocType, setSelectedDocType] = useState('')
  const [kycPersonalInfo, setKycPersonalInfo] = useState({
    fullName: '',
    dateOfBirth: '',
    nationality: 'Vietnam',
    address: '',
    phoneNumber: '',
    idNumber: '',
    idType: 'citizen_id' as 'citizen_id' | 'passport' | 'driver_license'
  })

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSave = async () => {
    if (!user) return
    
    setIsSaving(true)
    try {
      await updateProfile({
        ...formData,
        gender: formData.gender || undefined,
        dateOfBirth: formData.dateOfBirth ? new Date(formData.dateOfBirth) : undefined,
      } as Partial<User>)
      
      setIsEditing(false)
      toast({
        title: "Cập nhật thành công!",
        description: "Thông tin hồ sơ đã được cập nhật.",
        variant: "default"
      })
    } catch (error) {
      console.error('Update profile failed:', error)
      toast({
        title: "Lỗi cập nhật",
        description: "Không thể cập nhật thông tin. Vui lòng th��� lại.",
        variant: "destructive"
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        username: user.username || '',
        email: user.email || '',
        phoneNumber: user.phoneNumber || '',
        bio: user.bio || '',
        location: user.location || '',
        website: user.website || '',
        gender: user.gender || '',
        dateOfBirth: user.dateOfBirth ? new Date(user.dateOfBirth).toISOString().split('T')[0] : '',
      })
    }
    setIsEditing(false)
  }

  // KYC functions
  const fetchKycData = async () => {
    setIsLoadingKyc(true)
    try {
      const [statusResponse, submissionResponse] = await Promise.all([
        kycApi.getKycStatus(),
        kycApi.getCurrentSubmission()
      ]) as [ApiResponse<{ status: string }>, ApiResponse<KycSubmission>]

      if (statusResponse.success && statusResponse.data) {
        setKycStatus(statusResponse.data.status)
      }

      if (submissionResponse.success && submissionResponse.data) {
        setKycSubmission(submissionResponse.data)
        if (submissionResponse.data.personalInfo) {
          setKycPersonalInfo(submissionResponse.data.personalInfo)
        }
      }
    } catch (error) {
      console.error('Failed to fetch KYC data:', error)
      toast({
        title: "Lỗi tải dữ liệu KYC",
        description: "Không thể tải thông tin xác thực",
        variant: "destructive"
      })
    } finally {
      setIsLoadingKyc(false)
    }
  }

  const handleDocumentUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !selectedDocType) return

    setIsUploadingDoc(true)
    try {
      const response = await kycApi.uploadDocument(selectedDocType, file)
      if (response.success) {
        toast({
          title: "Tải lên thành công!",
          description: "Tài liệu đã được tải lên",
          variant: "default"
        })
        setUploadDialogOpen(false)
        fetchKycData()
      }
    } catch (error) {
      toast({
        title: "Lỗi tải lên",
        description: "Không thể tải lên tài liệu",
        variant: "destructive"
      })
    } finally {
      setIsUploadingDoc(false)
    }
  }

  const handleKycPersonalInfoUpdate = async () => {
    try {
      const response = await kycApi.updatePersonalInfo(kycPersonalInfo)
      if (response.success) {
        toast({
          title: "Cập nhật thành công!",
          description: "Th��ng tin cá nhân đã được cập nhật",
          variant: "default"
        })
        fetchKycData()
      }
    } catch (error) {
      toast({
        title: "Lỗi cập nhật",
        description: "Không thể cập nhật thông tin",
        variant: "destructive"
      })
    }
  }

  const handleSubmitKyc = async () => {
    try {
      const response = await kycApi.submitForReview()
      if (response.success) {
        toast({
          title: "Gửi xác thực thành công!",
          description: "Hồ sơ của bạn đang được xem xét",
          variant: "default"
        })
        fetchKycData()
      }
    } catch (error) {
      toast({
        title: "Lỗi gửi hồ sơ",
        description: "Không thể gửi hồ sơ xác thực",
        variant: "destructive"
      })
    }
  }

  const getKycStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge variant="default" className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Đã xác thực</Badge>
      case 'under_review':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800"><Clock className="w-3 h-3 mr-1" />Đang xem xét</Badge>
      case 'submitted':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3 mr-1" />Đã gửi</Badge>
      case 'rejected':
        return <Badge variant="destructive"><X className="w-3 h-3 mr-1" />Bị từ chối</Badge>
      default:
        return <Badge variant="outline"><AlertCircle className="w-3 h-3 mr-1" />Chưa xác thực</Badge>
    }
  }

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login')
    }
  }, [authLoading, isAuthenticated, router])

  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        username: user.username || '',
        email: user.email || '',
        phoneNumber: user.phoneNumber || '',
        bio: user.bio || '',
        location: user.location || '',
        website: user.website || '',
        gender: user.gender || '',
        dateOfBirth: user.dateOfBirth ? new Date(user.dateOfBirth).toISOString().split('T')[0] : '',
      })

      // Fetch KYC data when user is loaded
      fetchKycData()
    }
  }, [user])

  if (authLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <Icons.spinner className="h-8 w-8 animate-spin" />
        </div>
      </div>
    )
  }

  if (!isAuthenticated || !user) {
    return null // Component sẽ redirect trước khi render hoặc user chưa load
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="profile">Hồ sơ</TabsTrigger>
          <TabsTrigger value="kyc">Xác thực</TabsTrigger>
          <TabsTrigger value="privacy">Quyền riêng tư</TabsTrigger>
          <TabsTrigger value="notifications">Thông báo</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          {/* Profile Header */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6">
                <div className="relative">
                  <Avatar className="h-24 w-24">
                    <AvatarImage src={user?.avatar} alt={user?.username} />
                    <AvatarFallback className="bg-gradient-to-r from-purple-600 to-blue-600 text-white text-2xl">
                      {user?.username?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <Button
                    size="icon"
                    variant="secondary"
                    className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full"
                  >
                    <Camera className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="flex-1 text-center sm:text-left">
                  <h1 className="text-2xl font-bold">{user?.username}</h1>
                  <p className="text-muted-foreground">{user?.email}</p>
                  {user?.bio && <p className="text-sm mt-2">{user.bio}</p>}
                  
                  <div className="flex flex-wrap justify-center sm:justify-start gap-4 mt-4">
                    <div className="flex items-center space-x-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{user?.followers || 0} người theo dõi</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Heart className="h-4 w-4 text-red-500" />
                      <span className="text-sm">{user?.following || 0} đang theo dõi</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Eye className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{user?.totalViews || 0} lượt xem</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 mt-4">
                    <Badge variant="secondary">{user?.role}</Badge>
                    {user?.isVerified && <Badge variant="default" className="bg-blue-600">Đã xác minh</Badge>}
                  </div>
                </div>

                <Button
                  onClick={() => setIsEditing(!isEditing)}
                  variant={isEditing ? "outline" : "default"}
                  className="w-full sm:w-auto"
                >
                  <Edit3 className="h-4 w-4 mr-2" />
                  {isEditing ? 'Hủy chỉnh sửa' : 'Chỉnh sửa hồ sơ'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Become Creator Card - Only for regular users */}
          {user?.role === 'user' && (
            <Card className="border-2 border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50">
              <CardContent className="pt-6">
                <div className="flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0 sm:space-x-6">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center">
                      <UserPlus className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">Trở thành Creator</h3>
                      <p className="text-sm text-muted-foreground">
                        Chia sẻ đam mê, kiếm tiền từ nội dung và xây dựng cộng đồng riêng
                      </p>
                    </div>
                  </div>
                  <Button
                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                    onClick={() => router.push('/become-creator')}
                  >
                    <Gift className="w-4 h-4 mr-2" />
                    Bắt đầu ngay
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Profile Information */}
          <Card>
            <CardHeader>
              <CardTitle>Thông tin cá nhân</CardTitle>
              <CardDescription>
                Quản lý thông tin cá nhân của bạn
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="firstName">Tên</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                    disabled={!isEditing}
                    placeholder="Nhập tên của bạn"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Họ</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                    disabled={!isEditing}
                    placeholder="Nhập họ của bạn"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="username">Tên người dùng</Label>
                  <Input
                    id="username"
                    value={formData.username}
                    onChange={(e) => handleInputChange('username', e.target.value)}
                    disabled={!isEditing}
                    placeholder="Tên người dùng"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    disabled={!isEditing}
                    placeholder="Email của bạn"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="phoneNumber">Số điện thoại</Label>
                  <Input
                    id="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                    disabled={!isEditing}
                    placeholder="Số điện thoại"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gender">Giới tính</Label>
                  <Select 
                    value={formData.gender} 
                    onValueChange={(value) => handleInputChange('gender', value)}
                    disabled={!isEditing}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn giới tính" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Nam</SelectItem>
                      <SelectItem value="female">Nữ</SelectItem>
                      <SelectItem value="other">Khác</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="dateOfBirth">Ngày sinh</Label>
                  <Input
                    id="dateOfBirth"
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                    disabled={!isEditing}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Địa chỉ</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => handleInputChange('location', e.target.value)}
                    disabled={!isEditing}
                    placeholder="Thành phố, Quốc gia"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  value={formData.website}
                  onChange={(e) => handleInputChange('website', e.target.value)}
                  disabled={!isEditing}
                  placeholder="https://your-website.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Tiểu sử</Label>
                <Textarea
                  id="bio"
                  value={formData.bio}
                  onChange={(e) => handleInputChange('bio', e.target.value)}
                  disabled={!isEditing}
                  placeholder="Viết về bản thân bạn..."
                  rows={4}
                />
              </div>

              {isEditing && (
                <div className="flex space-x-4 pt-4">
                  <Button onClick={handleSave} disabled={isSaving}>
                    {isSaving ? (
                      <>
                        <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                        Đang lưu...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Lưu thay đổi
                      </>
                    )}
                  </Button>
                  <Button variant="outline" onClick={handleCancel}>
                    Hủy
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="kyc" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center space-x-2">
                    <Shield className="h-5 w-5" />
                    <span>Xác thực tài khoản (KYC)</span>
                  </CardTitle>
                  <CardDescription>
                    Xác thực danh tính để tăng độ tin cậy và m��� khóa các tính năng cao cấp
                  </CardDescription>
                </div>
                {getKycStatusBadge(kycStatus)}
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {isLoadingKyc ? (
                <div className="flex justify-center py-8">
                  <Icons.spinner className="h-8 w-8 animate-spin" />
                </div>
              ) : (
                <>
                  {/* Verification Levels */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {['basic', 'intermediate', 'advanced'].map((level) => (
                      <Card key={level} className={`p-4 ${kycSubmission?.verificationLevel === level ? 'border-blue-500 bg-blue-50' : ''}`}>
                        <div className="text-center">
                          <div className={`w-12 h-12 mx-auto mb-2 rounded-full flex items-center justify-center ${
                            level === 'basic' ? 'bg-green-100 text-green-600' :
                            level === 'intermediate' ? 'bg-yellow-100 text-yellow-600' :
                            'bg-purple-100 text-purple-600'
                          }`}>
                            <Shield className="w-6 h-6" />
                          </div>
                          <h3 className="font-medium capitalize">{level === 'basic' ? 'Cơ bản' : level === 'intermediate' ? 'Trung cấp' : 'Nâng cao'}</h3>
                          <p className="text-xs text-muted-foreground mt-1">
                            {getVerificationLevelDescription(level)}
                          </p>
                        </div>
                      </Card>
                    ))}
                  </div>

                  {/* Personal Information */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Thông tin cá nhân KYC</CardTitle>
                      <CardDescription>Thông tin này sẽ được sử dụng để xác thực danh tính</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Họ và tên đầy đủ</Label>
                          <Input
                            value={kycPersonalInfo.fullName}
                            onChange={(e) => setKycPersonalInfo(prev => ({ ...prev, fullName: e.target.value }))}
                            placeholder="Nhập họ và tên đầy đủ"
                            disabled={kycStatus === 'approved' || kycStatus === 'under_review'}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Ngày sinh</Label>
                          <Input
                            type="date"
                            value={kycPersonalInfo.dateOfBirth}
                            onChange={(e) => setKycPersonalInfo(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                            disabled={kycStatus === 'approved' || kycStatus === 'under_review'}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Số điện thoại</Label>
                          <Input
                            value={kycPersonalInfo.phoneNumber}
                            onChange={(e) => setKycPersonalInfo(prev => ({ ...prev, phoneNumber: e.target.value }))}
                            placeholder="Số điện thoại"
                            disabled={kycStatus === 'approved' || kycStatus === 'under_review'}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Quốc tịch</Label>
                          <Select
                            value={kycPersonalInfo.nationality}
                            onValueChange={(value) => setKycPersonalInfo(prev => ({ ...prev, nationality: value }))}
                            disabled={kycStatus === 'approved' || kycStatus === 'under_review'}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Vietnam">Việt Nam</SelectItem>
                              <SelectItem value="Other">Khác</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Địa chỉ thường trú</Label>
                        <Textarea
                          value={kycPersonalInfo.address}
                          onChange={(e) => setKycPersonalInfo(prev => ({ ...prev, address: e.target.value }))}
                          placeholder="Địa chỉ chi tiết"
                          disabled={kycStatus === 'approved' || kycStatus === 'under_review'}
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Loại giấy tờ</Label>
                          <Select
                            value={kycPersonalInfo.idType}
                            onValueChange={(value: any) => setKycPersonalInfo(prev => ({ ...prev, idType: value }))}
                            disabled={kycStatus === 'approved' || kycStatus === 'under_review'}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="citizen_id">CCCD/CMND</SelectItem>
                              <SelectItem value="passport">Hộ chiếu</SelectItem>
                              <SelectItem value="driver_license">Bằng lái xe</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Số giấy tờ</Label>
                          <Input
                            value={kycPersonalInfo.idNumber}
                            onChange={(e) => setKycPersonalInfo(prev => ({ ...prev, idNumber: e.target.value }))}
                            placeholder="Số CCCD/CMND/Hộ chiếu"
                            disabled={kycStatus === 'approved' || kycStatus === 'under_review'}
                          />
                        </div>
                      </div>

                      {(kycStatus === 'draft' || kycStatus === 'rejected') && (
                        <Button onClick={handleKycPersonalInfoUpdate}>
                          <Save className="w-4 h-4 mr-2" />
                          Lưu thông tin
                        </Button>
                      )}
                    </CardContent>
                  </Card>

                  {/* Documents */}
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle>Tài liệu xác thực</CardTitle>
                          <CardDescription>Tải lên các tài liệu cần thiết để xác thực</CardDescription>
                        </div>
                        {(kycStatus === 'draft' || kycStatus === 'rejected') && (
                          <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
                            <DialogTrigger asChild>
                              <Button>
                                <Upload className="w-4 h-4 mr-2" />
                                Tải lên
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Tải lên tài liệu</DialogTitle>
                                <DialogDescription>
                                  Chọn loại tài liệu và tải lên file
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div className="space-y-2">
                                  <Label>Loại tài liệu</Label>
                                  <Select value={selectedDocType} onValueChange={setSelectedDocType}>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Chọn loại tài liệu" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="citizen_id_front">Mặt trước CCCD/CMND</SelectItem>
                                      <SelectItem value="citizen_id_back">Mặt sau CCCD/CMND</SelectItem>
                                      <SelectItem value="passport">Hộ chiếu</SelectItem>
                                      <SelectItem value="selfie_with_id">Ảnh selfie cùng giấy tờ</SelectItem>
                                      <SelectItem value="proof_of_address">Giấy tờ chứng minh địa chỉ</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div className="space-y-2">
                                  <Label>File</Label>
                                  <Input
                                    type="file"
                                    accept="image/*,.pdf"
                                    onChange={handleDocumentUpload}
                                    disabled={isUploadingDoc || !selectedDocType}
                                  />
                                </div>
                                {isUploadingDoc && (
                                  <div className="flex items-center justify-center py-4">
                                    <Icons.spinner className="h-6 w-6 animate-spin mr-2" />
                                    <span>Đang tải lên...</span>
                                  </div>
                                )}
                              </div>
                            </DialogContent>
                          </Dialog>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {kycSubmission?.documents?.map((doc) => (
                          <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="flex items-center space-x-3">
                              <FileText className="h-5 w-5 text-muted-foreground" />
                              <div>
                                <p className="font-medium">{getDocumentTypeDescription(doc.type)}</p>
                                <p className="text-sm text-muted-foreground">{doc.fileName}</p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              {doc.status === 'approved' && <CheckCircle className="h-4 w-4 text-green-600" />}
                              {doc.status === 'rejected' && <X className="h-4 w-4 text-red-600" />}
                              {doc.status === 'pending' && <Clock className="h-4 w-4 text-yellow-600" />}
                              <Badge variant={doc.status === 'approved' ? 'default' : doc.status === 'rejected' ? 'destructive' : 'secondary'}>
                                {doc.status === 'approved' ? 'Đã duyệt' : doc.status === 'rejected' ? 'Bị từ chối' : 'Chờ duyệt'}
                              </Badge>
                            </div>
                          </div>
                        )) || (
                          <div className="text-center py-8">
                            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                            <p className="text-muted-foreground">Chưa có tài liệu nào được tải lên</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Submit Section */}
                  {kycStatus === 'draft' && (
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-center space-y-4">
                          <div className="bg-blue-50 p-4 rounded-lg">
                            <h4 className="font-medium text-blue-900 mb-2">Sẵn sàng gửi xác thực?</h4>
                            <p className="text-sm text-blue-800">
                              Hãy đảm bảo tất cả thông tin và tài liệu đã được điền đầy đủ và chính xác.
                            </p>
                          </div>
                          <Button onClick={handleSubmitKyc} size="lg">
                            <Send className="w-4 h-4 mr-2" />
                            Gửi hồ sơ xác thực
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {kycStatus === 'rejected' && kycSubmission?.rejectionReason && (
                    <Card className="border-red-200 bg-red-50">
                      <CardContent className="pt-6">
                        <div className="flex items-start space-x-3">
                          <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                          <div>
                            <h4 className="font-medium text-red-900">Hồ sơ bị từ chối</h4>
                            <p className="text-sm text-red-800 mt-1">{kycSubmission.rejectionReason}</p>
                            <p className="text-xs text-red-700 mt-2">Vui lòng chỉnh sửa thông tin và gửi lại hồ sơ.</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="privacy" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="h-5 w-5" />
                <span>Cài đặt quyền riêng tư</span>
              </CardTitle>
              <CardDescription>
                Quản lý ai có thể xem thông tin và tương tác với bạn
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Hồ sơ công khai</Label>
                  <p className="text-sm text-muted-foreground">
                    Cho phép mọi người xem hồ sơ của bạn
                  </p>
                </div>
                <Switch
                  checked={privacySettings.profileVisible}
                  onCheckedChange={(checked) =>
                    setPrivacySettings(prev => ({ ...prev, profileVisible: checked }))
                  }
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Hiển thị email</Label>
                  <p className="text-sm text-muted-foreground">
                    Cho phép người khác xem địa chỉ email của bạn
                  </p>
                </div>
                <Switch
                  checked={privacySettings.showEmail}
                  onCheckedChange={(checked) =>
                    setPrivacySettings(prev => ({ ...prev, showEmail: checked }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Hiển thị số điện thoại</Label>
                  <p className="text-sm text-muted-foreground">
                    Cho phép người khác xem số điện thoại của bạn
                  </p>
                </div>
                <Switch
                  checked={privacySettings.showPhone}
                  onCheckedChange={(checked) =>
                    setPrivacySettings(prev => ({ ...prev, showPhone: checked }))
                  }
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Cho phép tin nhắn</Label>
                  <p className="text-sm text-muted-foreground">
                    Cho phép người khác gửi tin nhắn cho bạn
                  </p>
                </div>
                <Switch
                  checked={privacySettings.allowMessages}
                  onCheckedChange={(checked) =>
                    setPrivacySettings(prev => ({ ...prev, allowMessages: checked }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Cho phép theo dõi</Label>
                  <p className="text-sm text-muted-foreground">
                    Cho phép người khác theo dõi bạn
                  </p>
                </div>
                <Switch
                  checked={privacySettings.allowFollows}
                  onCheckedChange={(checked) =>
                    setPrivacySettings(prev => ({ ...prev, allowFollows: checked }))
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Bell className="h-5 w-5" />
                <span>Cài đặt thông báo</span>
              </CardTitle>
              <CardDescription>
                Quản lý các loại thông báo bạn muốn nhận
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Thông báo qua email</Label>
                  <p className="text-sm text-muted-foreground">
                    Nhận thông báo qua email
                  </p>
                </div>
                <Switch
                  checked={notificationSettings.emailNotifications}
                  onCheckedChange={(checked) =>
                    setNotificationSettings(prev => ({ ...prev, emailNotifications: checked }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Thông báo đẩy</Label>
                  <p className="text-sm text-muted-foreground">
                    Nhận thông báo đẩy trên thiết bị
                  </p>
                </div>
                <Switch
                  checked={notificationSettings.pushNotifications}
                  onCheckedChange={(checked) =>
                    setNotificationSettings(prev => ({ ...prev, pushNotifications: checked }))
                  }
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Thông báo theo dõi</Label>
                  <p className="text-sm text-muted-foreground">
                    Khi có người theo dõi bạn
                  </p>
                </div>
                <Switch
                  checked={notificationSettings.followNotifications}
                  onCheckedChange={(checked) =>
                    setNotificationSettings(prev => ({ ...prev, followNotifications: checked }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Thông báo tin nhắn</Label>
                  <p className="text-sm text-muted-foreground">
                    Khi có tin nhắn mới
                  </p>
                </div>
                <Switch
                  checked={notificationSettings.messageNotifications}
                  onCheckedChange={(checked) =>
                    setNotificationSettings(prev => ({ ...prev, messageNotifications: checked }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Thông báo like</Label>
                  <p className="text-sm text-muted-foreground">
                    Khi có người thích bài viết của bạn
                  </p>
                </div>
                <Switch
                  checked={notificationSettings.likeNotifications}
                  onCheckedChange={(checked) =>
                    setNotificationSettings(prev => ({ ...prev, likeNotifications: checked }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Thông báo bình luận</Label>
                  <p className="text-sm text-muted-foreground">
                    Khi có người bình luận bài viết của bạn
                  </p>
                </div>
                <Switch
                  checked={notificationSettings.commentNotifications}
                  onCheckedChange={(checked) =>
                    setNotificationSettings(prev => ({ ...prev, commentNotifications: checked }))
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
