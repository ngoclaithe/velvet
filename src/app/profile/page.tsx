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
import { useCloudinaryUpload } from '@/hooks/useCloudinaryUpload'
import type { User } from '@/types/auth'
import { kycApi, getKycStatusDescription, getVerificationLevelDescription, getDocumentTypeDescription } from '@/lib/api/kyc'
import type { KycSubmission, KycSubmissionData, DocumentType, KycStatus } from '@/types/kyc'
import type { ApiResponse } from '@/types/api'
import type { CloudinaryUploadResponse } from '@/types/cloudinary'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import ImageUploader from '@/components/ImageUploader'

type Gender = 'male' | 'female' | 'other';

interface FormData {
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  phoneNumber: string;
  bio: string;
  location: string;
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
  const [avatarUploadDialogOpen, setAvatarUploadDialogOpen] = useState(false)
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
  const [kycUploadDialogOpen, setKycUploadDialogOpen] = useState(false)
  const [selectedKycDocType, setSelectedKycDocType] = useState('')

  // State để lưu 3 file ảnh KYC cục bộ (chưa upload) - giống logic create-post
  const [kycDocuments, setKycDocuments] = useState({
    documentFrontFile: null as File | null,
    documentBackFile: null as File | null,
    selfieFile: null as File | null
  })

  // State để lưu preview URLs cho hiển thị
  const [kycPreviewUrls, setKycPreviewUrls] = useState({
    documentFrontUrl: '',
    documentBackUrl: '',
    selfieUrl: ''
  })

  const [kycPersonalInfo, setKycPersonalInfo] = useState({
    fullName: '',
    dateOfBirth: '',
    nationality: 'Vietnam',
    address: '',
    documentNumber: '',
    documentType: 'id_card' as DocumentType
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
        description: "Không thể cập nhật thông tin. Vui lòng thử lại.",
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
        gender: user.gender || '',
        dateOfBirth: user.dateOfBirth ? new Date(user.dateOfBirth).toISOString().split('T')[0] : '',
      })
    }
    setIsEditing(false)
  }

  // Avatar upload handlers
  const handleAvatarUploadComplete = async (results: CloudinaryUploadResponse[]) => {
    if (results.length > 0 && user) {
      setIsUploadingAvatar(true)
      try {
        await updateProfile({
          avatar: results[0].secure_url
        } as Partial<User>)

        setAvatarUploadDialogOpen(false)
        toast({
          title: "Cập nhật avatar thành công!",
          description: "Ảnh đại diện của bạn đã được cập nhật.",
          variant: "default"
        })
      } catch (error) {
        console.error('Update avatar failed:', error)
        toast({
          title: "Lỗi cập nhật avatar",
          description: "Không thể cập nhật ảnh đại diện. Vui lòng thử lại.",
          variant: "destructive"
        })
      } finally {
        setIsUploadingAvatar(false)
      }
    }
  }

  const handleAvatarUploadError = (error: string) => {
    toast({
      title: "Lỗi tải lên",
      description: error,
      variant: "destructive"
    })
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

        // Nếu có submission, load dữ liệu từ submission
        setKycPersonalInfo({
          fullName: submissionResponse.data.fullName || '',
          dateOfBirth: submissionResponse.data.dateOfBirth ? submissionResponse.data.dateOfBirth.split('T')[0] : '',
          nationality: submissionResponse.data.nationality || 'Vietnam',
          address: submissionResponse.data.address || '',
          documentNumber: submissionResponse.data.documentNumber || '',
          documentType: submissionResponse.data.documentType || 'id_card'
        })

        // Clear local preview URLs nếu đã có submission
        if (submissionResponse.data.status !== 'draft') {
          setKycPreviewUrls({
            documentFrontUrl: '',
            documentBackUrl: '',
            selfieUrl: ''
          })
          setKycDocuments({
            documentFrontFile: null,
            documentBackFile: null,
            selfieFile: null
          })
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

  // Handler để upload ảnh KYC qua ImageUploader (học theo create-post)
  const handleKycImageUpload = (docType: string) => {
    return (results: CloudinaryUploadResponse[]) => {
      if (results.length > 0) {
        const fileKey = docType.replace('Url', 'File') as keyof typeof kycDocuments
        const urlKey = docType as keyof typeof kycPreviewUrls

        const fakeFile = new File([''], results[0].original_filename || 'document.jpg', {
          type: 'image/jpeg'
        })

        setKycDocuments(prev => ({
          ...prev,
          [fileKey]: fakeFile
        }))

        setKycPreviewUrls(prev => ({
          ...prev,
          [urlKey]: results[0].secure_url
        }))

        toast({
          title: "Tải ảnh thành công!",
          description: `${getDocumentTypeDescription(docType)} đã được tải lên`,
          variant: "default"
        })

        setKycUploadDialogOpen(false)
        setSelectedKycDocType('')
      }
    }
  }

  const handleKycImageUploadError = (error: string) => {
    toast({
      title: "Lỗi tải lên",
      description: error,
      variant: "destructive"
    })
  }

  // Đã loại bỏ handleDocumentUpload legacy

  // Đã loại bỏ handleKycPersonalInfoUpdate vì không cần thiết

  // Kiểm tra xem đã có đủ thông tin KYC chưa - sửa để check URLs thay vì files
  const isKycDataComplete = () => {
    const hasAllDocuments = kycPreviewUrls.documentFrontUrl &&
                           kycPreviewUrls.documentBackUrl &&
                           kycPreviewUrls.selfieUrl
    const hasPersonalInfo = kycPersonalInfo.fullName &&
                           kycPersonalInfo.dateOfBirth &&
                           kycPersonalInfo.documentNumber &&
                           kycPersonalInfo.documentType
    return hasAllDocuments && hasPersonalInfo
  }

  // Cloudinary upload hook
  const {
    uploadMultiple,
    uploading: cloudinaryUploading,
    progress: uploadProgress,
    error: uploadError,
    clearError: clearUploadError
  } = useCloudinaryUpload()

  // Submit toàn bộ KYC data - logic đơn giản hơn vì ảnh đã upload sẵn
  const handleSubmitKyc = async () => {
    if (!isKycDataComplete()) {
      toast({
        title: "Thông tin chưa đầy đủ",
        description: "Vui lòng điền đầy đủ thông tin cá nhân và tải lên 3 ảnh (mặt trước, mặt sau, selfie)",
        variant: "destructive"
      })
      return
    }

    setIsUploadingDoc(true)

    try {
      const kycData: KycSubmissionData = {
        fullName: kycPersonalInfo.fullName,
        dateOfBirth: kycPersonalInfo.dateOfBirth,
        nationality: kycPersonalInfo.nationality || 'Vietnam',
        address: kycPersonalInfo.address,
        documentType: kycPersonalInfo.documentType,
        documentNumber: kycPersonalInfo.documentNumber,

        documentFrontUrl: kycPreviewUrls.documentFrontUrl,
        documentBackUrl: kycPreviewUrls.documentBackUrl,
        selfieUrl: kycPreviewUrls.selfieUrl
      }

      const response = await kycApi.createSubmission(kycData)

      if (response.success) {
        toast({
          title: "Gửi xác thực thành công!",
          description: "Hồ sơ KYC của bạn đã được gửi và đang được xem xét",
          variant: "default"
        })

        setKycDocuments({
          documentFrontFile: null,
          documentBackFile: null,
          selfieFile: null
        })

        setKycPreviewUrls({
          documentFrontUrl: '',
          documentBackUrl: '',
          selfieUrl: ''
        })

        fetchKycData()
      }

    } catch (error) {
      console.error('❌ Submit KYC failed:', error)
      toast({
        title: "Lỗi gửi hồ sơ",
        description: error instanceof Error ? error.message : "Không thể gửi hồ sơ xác thực. Vui lòng thử lại.",
        variant: "destructive"
      })
    } finally {
      setIsUploadingDoc(false)
    }
  }

  const getKycStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge variant="default" className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Đã xác thực</Badge>
      case 'under_review':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800"><Clock className="w-3 h-3 mr-1" />Đang xem xét</Badge>
      case 'pending':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800"><Clock className="w-3 h-3 mr-1" />Đang chờ xử lý</Badge>
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
        gender: user.gender || '',
        dateOfBirth: user.dateOfBirth ? new Date(user.dateOfBirth).toISOString().split('T')[0] : '',
      })

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
    <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8 max-w-4xl">
      <Tabs defaultValue="profile" className="space-y-4 sm:space-y-6">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 h-auto">
          <TabsTrigger value="profile" className="text-xs sm:text-sm">Hồ sơ</TabsTrigger>
          <TabsTrigger value="kyc" className="text-xs sm:text-sm">Xác thực</TabsTrigger>
          <TabsTrigger value="privacy" className="text-xs sm:text-sm">Quyền riêng tư</TabsTrigger>
          <TabsTrigger value="notifications" className="text-xs sm:text-sm">Thông báo</TabsTrigger>
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
                  <Dialog open={avatarUploadDialogOpen} onOpenChange={setAvatarUploadDialogOpen}>
                    <DialogTrigger asChild>
                      <Button
                        size="icon"
                        variant="secondary"
                        className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full"
                        disabled={isUploadingAvatar}
                      >
                        {isUploadingAvatar ? (
                          <Icons.spinner className="h-4 w-4 animate-spin" />
                        ) : (
                          <Camera className="h-4 w-4" />
                        )}
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Cập nhật ảnh đại diện</DialogTitle>
                        <DialogDescription>
                          Chọn ảnh mới để làm ảnh đại diện của bạn
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <ImageUploader
                          onUploadComplete={handleAvatarUploadComplete}
                          onUploadError={handleAvatarUploadError}
                          maxFiles={1}
                          compact={true}
                          hideResults={true}
                          acceptedTypes="image/jpeg,image/png,image/webp"
                          disabled={isUploadingAvatar}
                        />
                      </div>
                    </DialogContent>
                  </Dialog>
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

          {/* Profile Information */}
          <Card>
            <CardHeader>
              <CardTitle>Thông tin cá nhân</CardTitle>
              <CardDescription>
                Quản lý thông tin cá nhân của bạn
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 sm:space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
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
                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4 pt-4">
                  <Button onClick={handleSave} disabled={isSaving} className="w-full sm:w-auto">
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
                  <Button variant="outline" onClick={handleCancel} className="w-full sm:w-auto">
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
                    Xác thực danh tính để tăng độ tin cậy và mở khóa các tính năng cao cấp
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                    {['basic', 'intermediate', 'advanced'].map((level) => (
                      <Card key={level} className={`p-3 sm:p-4 ${kycSubmission?.verificationLevel === level ? 'border-blue-500 bg-blue-50' : ''}`}>
                        <div className="text-center">
                          <div className={`w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-2 rounded-full flex items-center justify-center ${
                            level === 'basic' ? 'bg-green-100 text-green-600' :
                            level === 'intermediate' ? 'bg-yellow-100 text-yellow-600' :
                            'bg-purple-100 text-purple-600'
                          }`}>
                            <Shield className="w-5 h-5 sm:w-6 sm:h-6" />
                          </div>
                          <h3 className="font-medium text-sm sm:text-base">{level === 'basic' ? 'Cơ bản' : level === 'intermediate' ? 'Trung cấp' : 'Nâng cao'}</h3>
                          <p className="text-xs text-muted-foreground mt-1 leading-tight">
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
                      <CardDescription>
                        {kycSubmission && (kycStatus === 'pending' || kycStatus === 'submitted' || kycStatus === 'under_review')
                          ? 'Thông tin đã gửi - đang chờ xét duyệt'
                          : 'Thông tin này sẽ được sử dụng để xác thực danh tính'
                        }
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Hiển thị thông tin đã submit nếu có submission pending/submitted/under_review */}
                      {kycSubmission && (kycStatus === 'pending' || kycStatus === 'submitted' || kycStatus === 'under_review') ? (
                        <div className="space-y-4">
                          <div className="bg-blue-50 p-3 sm:p-4 rounded-lg border border-blue-200">
                            <div className="flex items-center space-x-2 mb-3">
                              <Clock className="h-5 w-5 text-blue-600" />
                              <h4 className="font-medium text-blue-900">Thông tin đã gửi</h4>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-sm">
                              <div>
                                <p className="text-gray-700 font-medium">Họ và tên:</p>
                                <p className="text-gray-900 break-words">{kycSubmission.fullName}</p>
                              </div>
                              <div>
                                <p className="text-gray-700 font-medium">Ngày sinh:</p>
                                <p className="text-gray-900">
                                  {kycSubmission.dateOfBirth ? new Date(kycSubmission.dateOfBirth).toLocaleDateString('vi-VN') : 'Chưa cập nhật'}
                                </p>
                              </div>
                              <div>
                                <p className="text-gray-700 font-medium">Quốc tịch:</p>
                                <p className="text-gray-900">{kycSubmission.nationality}</p>
                              </div>
                              <div>
                                <p className="text-gray-700 font-medium">Loại giấy tờ:</p>
                                <p className="text-gray-900">
                                  {kycSubmission.documentType === 'id_card' ? 'CCCD/CMND' :
                                   kycSubmission.documentType === 'passport' ? 'Hộ chiếu' :
                                   kycSubmission.documentType === 'driving_license' ? 'Bằng lái xe' : kycSubmission.documentType}
                                </p>
                              </div>
                              <div>
                                <p className="text-gray-700 font-medium">Số giấy tờ:</p>
                                <p className="text-gray-900 break-all">{kycSubmission.documentNumber}</p>
                              </div>
                              <div>
                                <p className="text-gray-700 font-medium">Ngày gửi:</p>
                                <p className="text-gray-900">
                                  {new Date(kycSubmission.createdAt).toLocaleDateString('vi-VN')}
                                </p>
                              </div>
                              {kycSubmission.address && (
                                <div className="sm:col-span-2">
                                  <p className="text-gray-700 font-medium">Địa chỉ:</p>
                                  <p className="text-gray-900 break-words">{kycSubmission.address}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ) : (
                        // Hiển thị form chỉ khi draft hoặc rejected
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                          <div className="space-y-2">
                            <Label>Họ và tên đầy đủ</Label>
                            <Input
                              value={kycPersonalInfo.fullName}
                              onChange={(e) => setKycPersonalInfo(prev => ({ ...prev, fullName: e.target.value }))}
                              placeholder="Nhập họ và tên đầy đủ"
                              disabled={kycStatus === 'approved'}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Ngày sinh</Label>
                            <Input
                              type="date"
                              value={kycPersonalInfo.dateOfBirth}
                              onChange={(e) => setKycPersonalInfo(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                              disabled={kycStatus === 'approved'}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Quốc tịch</Label>
                            <Select
                              value={kycPersonalInfo.nationality}
                              onValueChange={(value) => setKycPersonalInfo(prev => ({ ...prev, nationality: value }))}
                              disabled={kycStatus === 'approved'}
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
                          <div className="space-y-2">
                            <Label>Loại giấy tờ *</Label>
                            <Select
                              value={kycPersonalInfo.documentType}
                              onValueChange={(value: DocumentType) => setKycPersonalInfo(prev => ({ ...prev, documentType: value }))}
                              disabled={kycStatus === 'approved'}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="id_card">CCCD/CMND</SelectItem>
                                <SelectItem value="passport">Hộ chiếu</SelectItem>
                                <SelectItem value="driving_license">Bằng lái xe</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="sm:col-span-2 space-y-2">
                            <Label>Địa chỉ thường trú</Label>
                            <Textarea
                              value={kycPersonalInfo.address}
                              onChange={(e) => setKycPersonalInfo(prev => ({ ...prev, address: e.target.value }))}
                              placeholder="Địa chỉ chi tiết (tối đa 500 ký tự)"
                              maxLength={500}
                              disabled={kycStatus === 'approved'}
                            />
                            <p className="text-xs text-muted-foreground text-right">
                              {kycPersonalInfo.address.length}/500
                            </p>
                          </div>
                          <div className="sm:col-span-2 space-y-2">
                            <Label>Số giấy tờ *</Label>
                            <Input
                              value={kycPersonalInfo.documentNumber}
                              onChange={(e) => setKycPersonalInfo(prev => ({ ...prev, documentNumber: e.target.value }))}
                              placeholder="Số CCCD/CMND/Hộ chiếu (3-50 ký tự)"
                              maxLength={50}
                              disabled={kycStatus === 'approved'}
                            />
                            <p className="text-xs text-muted-foreground">
                              Chỉ được chứa chữ, số, dấu gạch ngang và khoảng trắng
                            </p>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Documents - Hiển thị 3 ảnh cần thiết */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Tài liệu xác thực</CardTitle>
                      <CardDescription>
                        {kycSubmission && (kycStatus === 'pending' || kycStatus === 'submitted' || kycStatus === 'under_review')
                          ? 'Tài liệu đã gửi - đang chờ xét duyệt'
                          : 'Cần tải lên đủ 3 ảnh: mặt trước giấy tờ, mặt sau giấy tờ và ảnh selfie'
                        }
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-6">
                        {/* Hiển thị tài liệu đã submit nếu có submission pending/submitted/under_review */}
                        {kycSubmission && (kycStatus === 'pending' || kycStatus === 'submitted' || kycStatus === 'under_review') ? (
                          <div className="space-y-4">
                            <div className="bg-blue-50 p-3 sm:p-4 rounded-lg border border-blue-200">
                              <div className="flex items-center space-x-2 mb-4">
                                <CheckCircle className="h-5 w-5 text-blue-600" />
                                <h4 className="font-medium text-blue-900">Tài liệu đã gửi</h4>
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                                {[
                                  { url: kycSubmission.documentFrontUrl, label: 'Mặt trước giấy tờ', icon: '🆔' },
                                  { url: kycSubmission.documentBackUrl, label: 'Mặt sau giấy tờ', icon: '🔄' },
                                  { url: kycSubmission.selfieUrl, label: 'Ảnh selfie', icon: '🤳' }
                                ].map((doc, index) => (
                                  <div key={index} className="text-center">
                                    <div className="mb-2">
                                      <span className="text-xl sm:text-2xl">{doc.icon}</span>
                                      <p className="text-xs sm:text-sm font-medium text-gray-900">{doc.label}</p>
                                    </div>
                                    {doc.url ? (
                                      <div className="space-y-2">
                                        <img
                                          src={doc.url}
                                          alt={doc.label}
                                          className="w-full h-20 sm:h-24 object-cover rounded border"
                                        />
                                        <div className="flex items-center justify-center space-x-1">
                                          <CheckCircle className="h-3 w-3 text-green-600" />
                                          <span className="text-xs text-green-600">Đã gửi</span>
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="h-20 sm:h-24 bg-gray-100 rounded border flex items-center justify-center">
                                        <span className="text-xs text-gray-500">Không có ảnh</span>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        ) : (
                          // Hiển thị form upload chỉ khi draft hoặc rejected
                          <>
                            {[
                              { key: 'documentFrontUrl', fileKey: 'documentFrontFile', label: 'Mặt trước giấy tờ', icon: '🆔' },
                              { key: 'documentBackUrl', fileKey: 'documentBackFile', label: 'Mặt sau giấy tờ', icon: '🔄' },
                              { key: 'selfieUrl', fileKey: 'selfieFile', label: 'Ảnh selfie với giấy tờ', icon: '🤳' }
                            ].map((docType) => (
                              <div key={docType.key} className="border rounded-lg p-4">
                                <div className="flex items-center justify-between mb-3">
                                  <div className="flex items-center space-x-2">
                                    <span className="text-2xl">{docType.icon}</span>
                                    <div>
                                      <h4 className="font-medium">{docType.label}</h4>
                                      <p className="text-sm text-muted-foreground">
                                        {kycDocuments[docType.fileKey as keyof typeof kycDocuments] ? 'Đã chọn ảnh' : 'Chưa chọn ảnh'}
                                      </p>
                                    </div>
                                  </div>

                                  {(kycStatus === 'draft' || kycStatus === 'rejected') && (
                                    <Dialog
                                      open={kycUploadDialogOpen && selectedKycDocType === docType.key}
                                      onOpenChange={(open) => {
                                        setKycUploadDialogOpen(open)
                                        if (open) setSelectedKycDocType(docType.key)
                                        else setSelectedKycDocType('')
                                      }}
                                    >
                                      <DialogTrigger asChild>
                                        <Button variant="outline" size="sm">
                                          <Upload className="w-4 h-4 mr-2" />
                                          {kycPreviewUrls[docType.key as keyof typeof kycPreviewUrls] ? 'Thay đổi' : 'Tải lên'}
                                        </Button>
                                      </DialogTrigger>
                                      <DialogContent>
                                        <DialogHeader>
                                          <DialogTitle>Tải lên {docType.label}</DialogTitle>
                                        </DialogHeader>
                                        <div className="space-y-4">
                                          <ImageUploader
                                            onUploadComplete={handleKycImageUpload(docType.key)}
                                            onUploadError={handleKycImageUploadError}
                                            maxFiles={1}
                                            compact={true}
                                            hideResults={true}
                                            acceptedTypes="image/jpeg,image/png,image/webp"
                                          />
                                        </div>
                                      </DialogContent>
                                    </Dialog>
                                  )}
                                </div>

                                {/* Preview ảnh đã upload */}
                                {kycPreviewUrls[docType.key as keyof typeof kycPreviewUrls] && (
                                  <div className="mt-3">
                                    <img
                                      src={kycPreviewUrls[docType.key as keyof typeof kycPreviewUrls]}
                                      alt={docType.label}
                                      className="w-full max-w-xs h-32 object-cover rounded border"
                                    />
                                  </div>
                                )}

                                {/* Status indicator */}
                                <div className="mt-3 flex items-center space-x-2">
                                  {kycPreviewUrls[docType.key as keyof typeof kycPreviewUrls] ? (
                                    <>
                                      <CheckCircle className="h-4 w-4 text-green-600" />
                                      <span className="text-sm text-green-600">Đã tải lên</span>
                                    </>
                                  ) : (
                                    <>
                                      <AlertCircle className="h-4 w-4 text-yellow-600" />
                                      <span className="text-sm text-yellow-600">Cần tải lên</span>
                                    </>
                                  )}
                                </div>
                              </div>
                            ))}

                            {/* Trạng thái tổng quan */}
                            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                              <div className="flex items-center justify-between">
                                <div>
                                  <h4 className="font-medium">Tiến độ tải ảnh</h4>
                                  <p className="text-sm text-muted-foreground">
                                    {Object.values(kycPreviewUrls).filter(url => url).length}/3 ảnh đã tải lên
                                  </p>
                                </div>
                                <div className="flex items-center space-x-2">
                                  {isKycDataComplete() ? (
                                    <>
                                      <CheckCircle className="h-5 w-5 text-green-600" />
                                      <span className="text-sm text-green-600 font-medium">Sẵn sàng gửi</span>
                                    </>
                                  ) : (
                                    <>
                                      <Clock className="h-5 w-5 text-yellow-600" />
                                      <span className="text-sm text-yellow-600">Chưa đầy đủ</span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Submit Section - chỉ hiển thị khi draft hoặc rejected */}
                  {(kycStatus === 'draft' || kycStatus === 'rejected') && (
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-center space-y-4">
                          {isKycDataComplete() ? (
                            <div className="bg-green-50 p-4 rounded-lg">
                              <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-600" />
                              <h4 className="font-medium text-green-900 mb-2">Sẵn sàng gửi xác thực!</h4>
                              <p className="text-sm text-green-800">
                                Tất cả thông tin và tài liệu đã được điền đầy đủ. Bạn có thể gửi hồ sơ để xem xét.
                              </p>
                            </div>
                          ) : (
                            <div className="bg-yellow-50 p-4 rounded-lg">
                              <AlertCircle className="w-8 h-8 mx-auto mb-2 text-yellow-600" />
                              <h4 className="font-medium text-yellow-900 mb-2">Thông tin chưa đầy đủ</h4>
                              <p className="text-sm text-yellow-800 mb-3">
                                Vui lòng hoàn thành các mục sau trước khi gửi:
                              </p>
                              <ul className="text-sm text-yellow-800 text-left space-y-1">
                                {!kycPersonalInfo.fullName && <li>• Điền họ và tên đầy đủ</li>}
                                {!kycPersonalInfo.dateOfBirth && <li>• Chọn ngày sinh</li>}
                                {!kycPersonalInfo.documentNumber && <li>• Nhập số giấy tờ</li>}
                                {!kycPreviewUrls.documentFrontUrl && <li>• Tải lên ảnh mặt trước giấy tờ</li>}
                                {!kycPreviewUrls.documentBackUrl && <li>• Tải lên ảnh mặt sau giấy tờ</li>}
                                {!kycPreviewUrls.selfieUrl && <li>• Tải lên ảnh selfie</li>}
                              </ul>
                            </div>
                          )}

                          {/* Upload Progress */}
                          {isUploadingDoc && (
                            <div className="space-y-3">
                              <div className="text-center">
                                <Icons.spinner className="w-6 h-6 mx-auto animate-spin mb-2" />
                                <p className="text-sm font-medium">Đang gửi hồ sơ xác thực...</p>
                              </div>
                            </div>
                          )}

                          <Button
                            onClick={handleSubmitKyc}
                            size="lg"
                            disabled={!isKycDataComplete() || isUploadingDoc}
                            className={isKycDataComplete() ? 'bg-green-600 hover:bg-green-700' : ''}
                          >
                            {isUploadingDoc ? (
                              <>
                                <Icons.spinner className="w-4 h-4 mr-2 animate-spin" />
                                Đang gửi...
                              </>
                            ) : (
                              <>
                                <Send className="w-4 h-4 mr-2" />
                                {kycStatus === 'rejected' ? 'Gửi lại hồ sơ' : 'Gửi hồ sơ xác thực'}
                              </>
                            )}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Pending/Under Review Status */}
                  {(kycStatus === 'pending' || kycStatus === 'submitted' || kycStatus === 'under_review') && (
                    <Card className="border-blue-200 bg-blue-50">
                      <CardContent className="pt-6">
                        <div className="text-center space-y-4">
                          <div className="flex items-center justify-center space-x-2">
                            <Clock className="h-8 w-8 text-blue-600" />
                            <div>
                              <h4 className="font-medium text-blue-900">Đang chờ xét duyệt</h4>
                              <p className="text-sm text-blue-800">
                                Hồ sơ của bạn đã được gửi thành công và hiện đang được xem xét bởi đội ngũ của chúng tôi
                              </p>
                            </div>
                          </div>
                          {kycSubmission && (
                            <div className="text-xs text-blue-700 space-y-1">
                              <p>Ngày gửi: {new Date(kycSubmission.createdAt).toLocaleDateString('vi-VN')}</p>
                              <p>Thường mất 1-3 ngày làm việc để hoàn thành xét duyệt</p>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Rejection Notice */}
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

                  {/* Approved Status */}
                  {kycStatus === 'approved' && (
                    <Card className="border-green-200 bg-green-50">
                      <CardContent className="pt-6">
                        <div className="text-center space-y-4">
                          <div className="flex items-center justify-center space-x-2">
                            <CheckCircle className="h-8 w-8 text-green-600" />
                            <div>
                              <h4 className="font-medium text-green-900">Xác thực thành công!</h4>
                              <p className="text-sm text-green-800">
                                Tài khoản của bạn đã được xác thực. Bây giờ bạn có thể sử dụng đầy đủ các tính năng.
                              </p>
                            </div>
                          </div>
                          {kycSubmission?.verifiedAt && (
                            <p className="text-xs text-green-700">
                              Xác thực vào: {new Date(kycSubmission.verifiedAt).toLocaleDateString('vi-VN')}
                            </p>
                          )}
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
