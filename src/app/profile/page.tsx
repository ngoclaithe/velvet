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
import ImageUploader from '@/components/ImageUploader'
import type { User } from '@/types/auth'
import { kycApi, getKycStatusDescription, getVerificationLevelDescription, getDocumentTypeDescription } from '@/lib/api/kyc'
import type { KycSubmission, KycSubmissionData, DocumentType, KycStatus } from '@/types/kyc'
import type { ApiResponse } from '@/types/api'
import type { CloudinaryUploadResponse } from '@/types/cloudinary'
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
  const [avatarUploadDialogOpen, setAvatarUploadDialogOpen] = useState(false)
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
  const [kycUploadDialogOpen, setKycUploadDialogOpen] = useState(false)
  const [selectedKycDocType, setSelectedKycDocType] = useState('')

  // State để lưu 3 file ảnh KYC cục bộ (chưa upload)
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
        website: user.website || '',
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
        if (submissionResponse.data.personalInfo) {
          setKycPersonalInfo({
            fullName: submissionResponse.data.personalInfo.fullName || '',
            dateOfBirth: submissionResponse.data.personalInfo.dateOfBirth || '',
            nationality: submissionResponse.data.personalInfo.nationality || 'Vietnam',
            address: submissionResponse.data.personalInfo.address || '',
            documentNumber: submissionResponse.data.documentNumber || '',
            documentType: submissionResponse.data.documentType || 'id_card'
          })
        }

        // Không load URLs vào state nữa vì chúng ta dùng files local
        // URLs chỉ hiển thị ở kycSubmission để xem kết quả đã submit
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

  // Handler để chọn file ảnh KYC (chưa upload)
  const handleKycFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !selectedKycDocType) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "File không hợp lệ",
        description: "Vui lòng chọn file ảnh (JPG, PNG, WEBP)",
        variant: "destructive"
      })
      return
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File quá lớn",
        description: "Kích thước file không được vượt quá 10MB",
        variant: "destructive"
      })
      return
    }

    try {
      // Lưu file vào state và tạo preview URL
      const fileKey = selectedKycDocType.replace('Url', 'File') as keyof typeof kycDocuments
      const urlKey = selectedKycDocType as keyof typeof kycPreviewUrls

      // Clear previous preview URL
      if (kycPreviewUrls[urlKey]) {
        URL.revokeObjectURL(kycPreviewUrls[urlKey])
      }

      // Create new preview URL
      const previewUrl = URL.createObjectURL(file)

      setKycDocuments(prev => ({
        ...prev,
        [fileKey]: file
      }))

      setKycPreviewUrls(prev => ({
        ...prev,
        [urlKey]: previewUrl
      }))

      toast({
        title: "Chọn ảnh thành công!",
        description: `${getDocumentTypeDescription(selectedKycDocType)} đã được chọn`,
        variant: "default"
      })

      setKycUploadDialogOpen(false)
      setSelectedKycDocType('')
    } catch (error) {
      console.error('File selection failed:', error)
      toast({
        title: "Lỗi chọn file",
        description: "Không thể chọn file. Vui lòng thử lại.",
        variant: "destructive"
      })
    }
  }

  // Legacy function - keeping for backward compatibility
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

  // Đã loại bỏ handleKycPersonalInfoUpdate vì không cần thiết

  // Kiểm tra xem đã có đủ thông tin KYC chưa
  const isKycDataComplete = () => {
    const hasAllDocuments = kycDocuments.documentFrontFile &&
                           kycDocuments.documentBackFile &&
                           kycDocuments.selfieFile
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

  // Submit toàn bộ KYC data
  const handleSubmitKyc = async () => {
    if (!isKycDataComplete()) {
      toast({
        title: "Thông tin chưa đầy đủ",
        description: "Vui lòng điền đầy đủ thông tin cá nhân và chọn 3 ảnh (mặt trước, mặt sau, selfie)",
        variant: "destructive"
      })
      return
    }

    setIsUploadingDoc(true)
    clearUploadError()

    try {
      // Bước 1: Upload 3 ảnh lên Cloudinary
      const filesToUpload = [
        kycDocuments.documentFrontFile!,
        kycDocuments.documentBackFile!,
        kycDocuments.selfieFile!
      ]

      console.log('🚀 Bắt đầu upload 3 ảnh KYC lên Cloudinary...')
      const uploadResults = await uploadMultiple(filesToUpload)

      if (uploadResults.length !== 3) {
        throw new Error('Không thể tải lên đủ 3 ảnh. Vui lòng thử lại.')
      }

      console.log('✅ Upload Cloudinary thành công:', uploadResults.map(r => r.secure_url))

      // Bước 2: Tạo KYC submission với URLs từ Cloudinary
      const kycData: KycSubmissionData = {
        // Thông tin cá nhân
        fullName: kycPersonalInfo.fullName,
        dateOfBirth: kycPersonalInfo.dateOfBirth,
        nationality: kycPersonalInfo.nationality || 'Vietnam',
        address: kycPersonalInfo.address,
        documentType: kycPersonalInfo.documentType,
        documentNumber: kycPersonalInfo.documentNumber,

        // URLs từ Cloudinary (theo thứ tự: front, back, selfie)
        documentFrontUrl: uploadResults[0].secure_url,
        documentBackUrl: uploadResults[1].secure_url,
        selfieUrl: uploadResults[2].secure_url
      }

      console.log('🚀 Gọi API tạo KYC submission...')
      const response = await kycApi.createSubmission(kycData)

      if (response.success) {
        toast({
          title: "Gửi xác thực thành công!",
          description: "Hồ sơ KYC của bạn đã được gửi và đang được xem xét",
          variant: "default"
        })

        // Reset form sau khi gửi thành công
        setKycDocuments({
          documentFrontFile: null,
          documentBackFile: null,
          selfieFile: null
        })

        // Clear preview URLs
        Object.values(kycPreviewUrls).forEach(url => {
          if (url) URL.revokeObjectURL(url)
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
                        <div className="space-y-2">
                          <Label>Loại giấy tờ *</Label>
                          <Select
                            value={kycPersonalInfo.documentType}
                            onValueChange={(value: DocumentType) => setKycPersonalInfo(prev => ({ ...prev, documentType: value }))}
                            disabled={kycStatus === 'approved' || kycStatus === 'under_review'}
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
                      </div>

                      <div className="space-y-2">
                        <Label>Địa chỉ thường trú</Label>
                        <Textarea
                          value={kycPersonalInfo.address}
                          onChange={(e) => setKycPersonalInfo(prev => ({ ...prev, address: e.target.value }))}
                          placeholder="Địa chỉ chi tiết (tối đa 500 ký tự)"
                          maxLength={500}
                          disabled={kycStatus === 'approved' || kycStatus === 'under_review'}
                        />
                        <p className="text-xs text-muted-foreground text-right">
                          {kycPersonalInfo.address.length}/500
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label>Số giấy tờ *</Label>
                        <Input
                          value={kycPersonalInfo.documentNumber}
                          onChange={(e) => setKycPersonalInfo(prev => ({ ...prev, documentNumber: e.target.value }))}
                          placeholder="Số CCCD/CMND/Hộ chiếu (3-50 ký tự)"
                          maxLength={50}
                          disabled={kycStatus === 'approved' || kycStatus === 'under_review'}
                        />
                        <p className="text-xs text-muted-foreground">
                          Chỉ được chứa chữ, số, dấu gạch ngang và khoảng trắng
                        </p>
                      </div>

                      {/* Đã loại bỏ nút "Lưu thông tin" vì không cần thiết */}
                    </CardContent>
                  </Card>

                  {/* Documents - Hiển thị 3 ảnh cần thiết */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Tài liệu xác thực</CardTitle>
                      <CardDescription>Cần tải lên đủ 3 ảnh: mặt trước giấy tờ, mặt sau giấy tờ và ảnh selfie</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-6">
                        {/* Hiển thị 3 loại ảnh cần upload */}
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
                                      {kycDocuments[docType.fileKey as keyof typeof kycDocuments] ? 'Thay đổi' : 'Chọn ảnh'}
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent>
                                    <DialogHeader>
                                      <DialogTitle>Chọn {docType.label}</DialogTitle>
                                      <DialogDescription>
                                        Chọn file ảnh {docType.label.toLowerCase()} từ thiết bị của bạn
                                      </DialogDescription>
                                    </DialogHeader>
                                    <div className="space-y-4">
                                      <div className="space-y-2">
                                        <Label htmlFor={`file-${docType.key}`}>Chọn file ảnh</Label>
                                        <Input
                                          id={`file-${docType.key}`}
                                          type="file"
                                          accept="image/jpeg,image/png,image/webp"
                                          onChange={handleKycFileSelect}
                                          className="cursor-pointer"
                                        />
                                        <p className="text-xs text-muted-foreground">
                                          Hỗ trợ: JPG, PNG, WEBP. Tối đa 10MB.
                                        </p>
                                      </div>
                                    </div>
                                  </DialogContent>
                                </Dialog>
                              )}
                            </div>

                            {/* Preview ảnh đã chọn */}
                            {kycPreviewUrls[docType.key as keyof typeof kycPreviewUrls] && (
                              <div className="mt-3">
                                <img
                                  src={kycPreviewUrls[docType.key as keyof typeof kycPreviewUrls]}
                                  alt={docType.label}
                                  className="w-full max-w-xs h-32 object-cover rounded border"
                                />
                                <p className="text-xs text-muted-foreground mt-1">
                                  {kycDocuments[docType.fileKey as keyof typeof kycDocuments]?.name}
                                </p>
                              </div>
                            )}

                            {/* Status indicator */}
                            <div className="mt-3 flex items-center space-x-2">
                              {kycDocuments[docType.fileKey as keyof typeof kycDocuments] ? (
                                <>
                                  <CheckCircle className="h-4 w-4 text-green-600" />
                                  <span className="text-sm text-green-600">Đã chọn</span>
                                </>
                              ) : (
                                <>
                                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                                  <span className="text-sm text-yellow-600">Cần chọn</span>
                                </>
                              )}
                            </div>
                          </div>
                        ))}

                        {/* Trạng thái tổng quan */}
                        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-medium">Tiến độ chọn ảnh</h4>
                              <p className="text-sm text-muted-foreground">
                                {Object.values(kycDocuments).filter(file => file).length}/3 ảnh đã chọn
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
                      </div>
                    </CardContent>
                  </Card>

                  {/* Submit Section */}
                  {kycStatus === 'draft' && (
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
                                {!kycDocuments.documentFrontFile && <li>• Chọn ảnh mặt trước giấy tờ</li>}
                                {!kycDocuments.documentBackFile && <li>• Chọn ảnh mặt sau giấy tờ</li>}
                                {!kycDocuments.selfieFile && <li>• Chọn ảnh selfie</li>}
                              </ul>
                            </div>
                          )}

                          {/* Upload Progress */}
                          {(isUploadingDoc || cloudinaryUploading) && (
                            <div className="space-y-3">
                              <div className="text-center">
                                <Icons.spinner className="w-6 h-6 mx-auto animate-spin mb-2" />
                                <p className="text-sm font-medium">
                                  {cloudinaryUploading ? 'Đang tải ảnh lên Cloudinary...' : 'Đang gửi hồ sơ...'}
                                </p>
                              </div>

                              {/* Upload progress bars */}
                              {Object.keys(uploadProgress).length > 0 && (
                                <div className="space-y-2">
                                  {Object.entries(uploadProgress).map(([fileIndex, progress]) => (
                                    <div key={fileIndex} className="space-y-1">
                                      <div className="flex justify-between text-xs">
                                        <span>
                                          {parseInt(fileIndex) === 0 ? 'Mặt trước' :
                                           parseInt(fileIndex) === 1 ? 'Mặt sau' : 'Selfie'}
                                        </span>
                                        <span>{progress}%</span>
                                      </div>
                                      <div className="w-full bg-gray-200 rounded-full h-2">
                                        <div
                                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                          style={{ width: `${progress}%` }}
                                        />
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}

                          <Button
                            onClick={handleSubmitKyc}
                            size="lg"
                            disabled={!isKycDataComplete() || isUploadingDoc || cloudinaryUploading}
                            className={isKycDataComplete() ? 'bg-green-600 hover:bg-green-700' : ''}
                          >
                            {(isUploadingDoc || cloudinaryUploading) ? (
                              <>
                                <Icons.spinner className="w-4 h-4 mr-2 animate-spin" />
                                {cloudinaryUploading ? 'Đang tải ảnh...' : 'Đang gửi...'}
                              </>
                            ) : (
                              <>
                                <Send className="w-4 h-4 mr-2" />
                                Gửi hồ sơ xác thực
                              </>
                            )}
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
