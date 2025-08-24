'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Icons } from '@/components/common/Icons'
import { Star, Eye, EyeOff, Video } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import type { CreatorRegisterData } from '@/types/auth'

type Gender = 'male' | 'female' | 'other' | undefined;

export default function RegisterCreatorPage() {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    phoneNumber: '',
    gender: '' as Gender,
    dateOfBirth: '',
    // Creator specific fields
    channelName: '',
    channelDescription: '',
    contentCategory: '',
    socialLinks: {
      facebook: '',
      instagram: '',
      youtube: '',
      tiktok: ''
    },
    experienceLevel: '',
    equipment: '',
    contentPlan: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [agreeToTerms, setAgreeToTerms] = useState(false)
  const [agreeToCreatorTerms, setAgreeToCreatorTerms] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const { registerCreator } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  const validatePassword = (password: string) => {
    const hasMinLength = password.length >= 8
    const hasUpperCase = /[A-Z]/.test(password)
    const hasLowerCase = /[a-z]/.test(password)
    const hasNumbers = /\d/.test(password)
    const hasSpecialChar = /[!@#$%^&*]/.test(password)
    
    if (!hasMinLength) return 'Mật khẩu phải có ít nhất 8 ký tự'
    if (!hasUpperCase) return 'Mật khẩu phải chứa chữ hoa'
    if (!hasLowerCase) return 'Mật khẩu phải chứa chữ thường'
    if (!hasNumbers) return 'Mật khẩu phải chứa số'
    if (!hasSpecialChar) return 'Mật khẩu phải chứa ký tự đặc biệt (!@#$%^&*)'
    
    return ''
  }

  const validateUsername = (username: string) => {
    if (username.length < 3 || username.length > 30) {
      return 'Username phải từ 3-30 ký tự'
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return 'Username chỉ được chứa chữ cái, số và dấu gạch dưới'
    }
    return ''
  }

  const validatePhoneNumber = (phone: string) => {
    if (!phone) return '' // Optional field
    const phoneRegex = /^(\+84|84|0)(3|5|7|8|9)\d{8}$/
    if (!phoneRegex.test(phone.replace(/\s/g, ''))) {
      return 'Số điện thoại không hợp lệ (VD: 0987654321 hoặc +84987654321)'
    }
    return ''
  }

  const validateChannelName = (name: string) => {
    if (name.length < 3 || name.length > 50) {
      return 'Tên kênh phải từ 3-50 ký tự'
    }
    return ''
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate form
    const newErrors: Record<string, string> = {}

    // Required fields
    if (!formData.username) newErrors.username = 'Username là bắt buộc'
    else {
      const usernameError = validateUsername(formData.username)
      if (usernameError) newErrors.username = usernameError
    }

    if (!formData.email) newErrors.email = 'Email là bắt buộc'
    if (!formData.password) newErrors.password = 'Mật khẩu là bắt buộc'
    else {
      const passwordError = validatePassword(formData.password)
      if (passwordError) newErrors.password = passwordError
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Mật khẩu không khớp'
    }

    // Creator specific validation
    if (!formData.channelName) newErrors.channelName = 'Tên kênh là bắt buộc'
    else {
      const channelError = validateChannelName(formData.channelName)
      if (channelError) newErrors.channelName = channelError
    }

    if (!formData.channelDescription) {
      newErrors.channelDescription = 'Mô tả kênh là bắt buộc'
    } else if (formData.channelDescription.length < 20) {
      newErrors.channelDescription = 'Mô tả kênh phải ít nhất 20 ký tự'
    }

    if (!formData.contentCategory) newErrors.contentCategory = 'Vui lòng chọn loại nội dung'
    if (!formData.experienceLevel) newErrors.experienceLevel = 'Vui lòng chọn trình độ kinh nghiệm'

    // Optional fields validation
    const phoneError = validatePhoneNumber(formData.phoneNumber)
    if (phoneError) newErrors.phoneNumber = phoneError

    if (formData.firstName && (formData.firstName.length < 2 || formData.firstName.length > 50)) {
      newErrors.firstName = 'Tên phải từ 2-50 ký tự'
    }
    if (formData.lastName && (formData.lastName.length < 2 || formData.lastName.length > 50)) {
      newErrors.lastName = 'Họ phải từ 2-50 ký tự'
    }

    if (!agreeToTerms) {
      newErrors.terms = 'Vui lòng đồng ý với điều khoản sử dụng'
    }

    if (!agreeToCreatorTerms) {
      newErrors.creatorTerms = 'Vui lòng đồng ý với điều khoản Creator'
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }
    
    setIsLoading(true)
    try {
      // Prepare creator registration data
      const registrationData = {
        ...formData,
        gender: formData.gender || undefined as Gender,
        agreeToTerms,
        agreeToCreatorTerms,
        // Creator specific data
        creatorProfile: {
          channelName: formData.channelName,
          channelDescription: formData.channelDescription,
          contentCategory: formData.contentCategory,
          socialLinks: formData.socialLinks,
          experienceLevel: formData.experienceLevel,
          equipment: formData.equipment,
          contentPlan: formData.contentPlan
        }
      }

      await registerCreator(registrationData)

      toast({
        title: "Đăng ký Creator thành công!",
        description: "Chào mừng bạn trở thành Creator! Bạn sẽ được chuyển về trang chủ.",
        variant: "default"
      })

      setTimeout(() => {
        router.push('/')
      }, 2000)

    } catch (error) {
      console.error('Creator registration failed:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    if (field.includes('.')) {
      // Handle nested fields (socialLinks)
      const [parent, child] = field.split('.')
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent as keyof typeof prev] as any,
          [child]: value
        }
      }))
    } else {
      setFormData(prev => ({ ...prev, [field]: value }))
    }
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
    
    // Real-time validation
    if (field === 'password') {
      const error = validatePassword(value)
      setErrors(prev => ({ ...prev, password: error }))
    }
    if (field === 'channelName') {
      const error = validateChannelName(value)
      setErrors(prev => ({ ...prev, channelName: error }))
    }
  }

  const handleGenderChange = (value: string) => {
    const genderValue = value as Gender
    setFormData(prev => ({ ...prev, gender: genderValue }))
  }

  return (
    <Card className="w-full max-w-3xl mx-auto shadow-xl border-0 bg-white/95 backdrop-blur-sm">
      <CardHeader className="space-y-1 text-center">
        <div className="flex justify-center mb-4">
          <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center">
            <Video className="w-6 h-6 text-white" />
          </div>
        </div>
        <CardTitle className="text-2xl font-bold text-black">Đăng ký Creator</CardTitle>
        <CardDescription>
          Trở thành nhà sáng tạo nội dung và chia sẻ đam mê của bạn
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Thông tin cơ bản</h3>
            
            {/* Username & Email */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Input
                  id="username"
                  type="text"
                  placeholder="Tên người dùng *"
                  value={formData.username}
                  onChange={(e) => handleInputChange('username', e.target.value)}
                  required
                  className={`h-11 ${errors.username ? 'border-red-500' : ''}`}
                />
                {errors.username && <p className="text-sm text-red-600">{errors.username}</p>}
              </div>
              <div className="space-y-2">
                <Input
                  id="email"
                  type="email"
                  placeholder="Email *"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  required
                  className={`h-11 ${errors.email ? 'border-red-500' : ''}`}
                />
                {errors.email && <p className="text-sm text-red-600">{errors.email}</p>}
              </div>
            </div>

            {/* Name */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Input
                  id="firstName"
                  type="text"
                  placeholder="Tên"
                  value={formData.firstName}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                  className={`h-11 ${errors.firstName ? 'border-red-500' : ''}`}
                />
                {errors.firstName && <p className="text-sm text-red-600">{errors.firstName}</p>}
              </div>
              <div className="space-y-2">
                <Input
                  id="lastName"
                  type="text"
                  placeholder="Họ"
                  value={formData.lastName}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                  className={`h-11 ${errors.lastName ? 'border-red-500' : ''}`}
                />
                {errors.lastName && <p className="text-sm text-red-600">{errors.lastName}</p>}
              </div>
            </div>

            {/* Phone, Gender, Date of Birth */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Input
                  id="phoneNumber"
                  type="tel"
                  placeholder="Số điện thoại"
                  value={formData.phoneNumber}
                  onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                  className={`h-11 ${errors.phoneNumber ? 'border-red-500' : ''}`}
                />
                {errors.phoneNumber && <p className="text-sm text-red-600">{errors.phoneNumber}</p>}
              </div>
              <div className="space-y-2">
                <Select value={formData.gender || ''} onValueChange={handleGenderChange}>
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Giới tính" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Nam</SelectItem>
                    <SelectItem value="female">Nữ</SelectItem>
                    <SelectItem value="other">Khác</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Input
                  id="dateOfBirth"
                  type="date"
                  placeholder="Ngày sinh"
                  value={formData.dateOfBirth}
                  onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                  className="h-11"
                />
              </div>
            </div>

            {/* Passwords */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Mật khẩu *"
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  required
                  className={`h-11 pr-10 ${errors.password ? 'border-red-500' : ''}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
                {errors.password && <p className="text-sm text-red-600">{errors.password}</p>}
              </div>
              <div className="space-y-2 relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Xác nhận mật khẩu *"
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                  required
                  className={`h-11 pr-10 ${errors.confirmPassword ? 'border-red-500' : ''}`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
                {errors.confirmPassword && <p className="text-sm text-red-600">{errors.confirmPassword}</p>}
              </div>
            </div>
          </div>

          {/* Creator Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Thông tin Creator</h3>
            
            {/* Channel Name */}
            <div className="space-y-2">
              <Input
                id="channelName"
                type="text"
                placeholder="Tên kênh của bạn *"
                value={formData.channelName}
                onChange={(e) => handleInputChange('channelName', e.target.value)}
                required
                className={`h-11 ${errors.channelName ? 'border-red-500' : ''}`}
              />
              {errors.channelName && <p className="text-sm text-red-600">{errors.channelName}</p>}
            </div>

            {/* Channel Description */}
            <div className="space-y-2">
              <Textarea
                id="channelDescription"
                placeholder="Mô tả về kênh và nội dung bạn sẽ t���o ra *"
                value={formData.channelDescription}
                onChange={(e) => handleInputChange('channelDescription', e.target.value)}
                required
                rows={4}
                className={`${errors.channelDescription ? 'border-red-500' : ''}`}
              />
              {errors.channelDescription && <p className="text-sm text-red-600">{errors.channelDescription}</p>}
            </div>

            {/* Content Category & Experience Level */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Select value={formData.contentCategory} onValueChange={(value) => handleInputChange('contentCategory', value)}>
                  <SelectTrigger className={`h-11 ${errors.contentCategory ? 'border-red-500' : ''}`}>
                    <SelectValue placeholder="Loại nội dung *" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gaming">Gaming</SelectItem>
                    <SelectItem value="music">Âm nhạc</SelectItem>
                    <SelectItem value="education">Giáo dục</SelectItem>
                    <SelectItem value="entertainment">Giải trí</SelectItem>
                    <SelectItem value="technology">Công nghệ</SelectItem>
                    <SelectItem value="cooking">Nấu ăn</SelectItem>
                    <SelectItem value="sports">Thể thao</SelectItem>
                    <SelectItem value="art">Nghệ thuật</SelectItem>
                    <SelectItem value="lifestyle">Lối sống</SelectItem>
                    <SelectItem value="other">Khác</SelectItem>
                  </SelectContent>
                </Select>
                {errors.contentCategory && <p className="text-sm text-red-600">{errors.contentCategory}</p>}
              </div>
              <div className="space-y-2">
                <Select value={formData.experienceLevel} onValueChange={(value) => handleInputChange('experienceLevel', value)}>
                  <SelectTrigger className={`h-11 ${errors.experienceLevel ? 'border-red-500' : ''}`}>
                    <SelectValue placeholder="Trình độ kinh nghiệm *" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">Mới bắt đầu</SelectItem>
                    <SelectItem value="intermediate">Trung bình</SelectItem>
                    <SelectItem value="advanced">Có kinh nghiệm</SelectItem>
                    <SelectItem value="professional">Chuyên nghiệp</SelectItem>
                  </SelectContent>
                </Select>
                {errors.experienceLevel && <p className="text-sm text-red-600">{errors.experienceLevel}</p>}
              </div>
            </div>

            {/* Equipment */}
            <div className="space-y-2">
              <Textarea
                id="equipment"
                placeholder="Thiết bị bạn sử dụng để tạo nội dung (camera, micro, phần mềm...)"
                value={formData.equipment}
                onChange={(e) => handleInputChange('equipment', e.target.value)}
                rows={3}
              />
            </div>

            {/* Content Plan */}
            <div className="space-y-2">
              <Textarea
                id="contentPlan"
                placeholder="Kế hoạch nội dung và mục tiêu của bạn"
                value={formData.contentPlan}
                onChange={(e) => handleInputChange('contentPlan', e.target.value)}
                rows={3}
              />
            </div>
          </div>

          {/* Social Links */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Mạng xã hội (tùy chọn)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                placeholder="Facebook"
                value={formData.socialLinks.facebook}
                onChange={(e) => handleInputChange('socialLinks.facebook', e.target.value)}
                className="h-11"
              />
              <Input
                placeholder="Instagram"
                value={formData.socialLinks.instagram}
                onChange={(e) => handleInputChange('socialLinks.instagram', e.target.value)}
                className="h-11"
              />
              <Input
                placeholder="YouTube"
                value={formData.socialLinks.youtube}
                onChange={(e) => handleInputChange('socialLinks.youtube', e.target.value)}
                className="h-11"
              />
              <Input
                placeholder="TikTok"
                value={formData.socialLinks.tiktok}
                onChange={(e) => handleInputChange('socialLinks.tiktok', e.target.value)}
                className="h-11"
              />
            </div>
          </div>

          {/* Terms Agreement */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="terms"
                checked={agreeToTerms}
                onCheckedChange={(checked) => setAgreeToTerms(checked as boolean)}
              />
              <label
                htmlFor="terms"
                className="text-sm text-black font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Tôi đồng ý với{' '}
                <Link href="/terms" className="text-purple-600 hover:underline">
                  điều khoản sử dụng
                </Link>{' '}
                và{' '}
                <Link href="/privacy" className="text-purple-600 hover:underline">
                  chính sách bảo mật
                </Link>
              </label>
            </div>
            {errors.terms && <p className="text-sm text-red-600">{errors.terms}</p>}

            <div className="flex items-center space-x-2">
              <Checkbox
                id="creatorTerms"
                checked={agreeToCreatorTerms}
                onCheckedChange={(checked) => setAgreeToCreatorTerms(checked as boolean)}
              />
              <label
                htmlFor="creatorTerms"
                className="text-sm text-black font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Tôi đồng ý với{' '}
                <Link href="/creator-terms" className="text-purple-600 hover:underline">
                  điều khoản Creator
                </Link>{' '}
                và cam kết tuân thủ các quy định nội dung
              </label>
            </div>
            {errors.creatorTerms && <p className="text-sm text-red-600">{errors.creatorTerms}</p>}
          </div>
          
          <Button
            type="submit"
            className="w-full h-12 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-medium"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                Đang tạo tài khoản Creator...
              </>
            ) : (
              <>
                <Star className="mr-2 h-4 w-4" />
                Trở thành Creator
              </>
            )}
          </Button>
        </form>
        
        <div className="text-center text-sm">
          <span className="text-muted-foreground">Đã có tài khoản? </span>
          <Link
            href="/login"
            className="text-purple-600 hover:text-purple-500 hover:underline font-medium"
          >
            Đăng nhập ngay
          </Link>
          <span className="text-muted-foreground"> hoặc </span>
          <Link
            href="/register"
            className="text-blue-600 hover:text-blue-500 hover:underline font-medium"
          >
            Đăng ký tài khoản thường
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
