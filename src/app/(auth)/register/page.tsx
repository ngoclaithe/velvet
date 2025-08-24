'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Icons } from '@/components/common/Icons'
import { UserPlus, Eye, EyeOff } from 'lucide-react'
import { authApi } from '@/lib/api'
import { useToast } from '@/hooks/use-toast'

// Define types for API responses
interface CheckUsernameResponse {
  available: boolean;
  message?: string;
}

interface CheckEmailResponse {
  available: boolean;
  message?: string;
}

// Define gender type
type Gender = 'male' | 'female' | 'other' | undefined;

export default function RegisterPage() {
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
    referralCode: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [agreeToTerms, setAgreeToTerms] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [usernameChecking, setUsernameChecking] = useState(false)
  const [emailChecking, setEmailChecking] = useState(false)
  const { register } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  // Kiểm tra username có tồn tại không
  const checkUsername = async (username: string) => {
    if (username.length < 3) return

    setUsernameChecking(true)
    try {
      const response = await authApi.checkUsername(username)
      if (response.success && response.data) {
        const data = response.data as CheckUsernameResponse
        if (!data.available) {
          setErrors(prev => ({ ...prev, username: data.message || 'Username đã được sử dụng' }))
        } else {
          setErrors(prev => ({ ...prev, username: '' }))
        }
      } else {
        // Nếu API call thất bại, không hiện lỗi để không làm phiền user
        console.warn('Check username API failed:', response.error)
      }
    } catch (error) {
      console.error('Check username failed:', error)
      // Không hiện lỗi cho user, chỉ log để debug
    } finally {
      setUsernameChecking(false)
    }
  }

  // Kiểm tra email có tồn tại không
  const checkEmail = async (email: string) => {
    if (!email.includes('@')) return

    setEmailChecking(true)
    try {
      const response = await authApi.checkEmail(email)
      if (response.success && response.data) {
        const data = response.data as CheckEmailResponse
        if (!data.available) {
          setErrors(prev => ({ ...prev, email: data.message || 'Email đã được sử dụng' }))
        } else {
          setErrors(prev => ({ ...prev, email: '' }))
        }
      } else {
        // Nếu API call thất bại, không hiện lỗi để không làm phiền user
        console.warn('Check email API failed:', response.error)
      }
    } catch (error) {
      console.error('Check email failed:', error)
      // Không hiện lỗi cho user, chỉ log để debug
    } finally {
      setEmailChecking(false)
    }
  }

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
    // Basic mobile phone validation (Vietnamese format)
    const phoneRegex = /^(\+84|84|0)(3|5|7|8|9)\d{8}$/
    if (!phoneRegex.test(phone.replace(/\s/g, ''))) {
      return 'Số điện thoại không hợp lệ (VD: 0987654321 hoặc +84987654321)'
    }
    return ''
  }

  const validateReferralCode = (code: string) => {
    if (!code) return '' // Optional field
    if (code.length < 8 || code.length > 16) {
      return 'Mã giới thiệu phải từ 8-16 ký tự'
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

    // Optional fields validation
    const phoneError = validatePhoneNumber(formData.phoneNumber)
    if (phoneError) newErrors.phoneNumber = phoneError

    const referralError = validateReferralCode(formData.referralCode)
    if (referralError) newErrors.referralCode = referralError

    // firstName và lastName validation (nếu có)
    if (formData.firstName && (formData.firstName.length < 2 || formData.firstName.length > 50)) {
      newErrors.firstName = 'Tên phải từ 2-50 ký tự'
    }
    if (formData.lastName && (formData.lastName.length < 2 || formData.lastName.length > 50)) {
      newErrors.lastName = 'Họ phải từ 2-50 ký tự'
    }

    if (!agreeToTerms) {
      newErrors.terms = 'Vui lòng đồng ý với điều khoản sử dụng'
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }
    
    setIsLoading(true)
    try {
      // Convert gender to proper type before sending
      const registrationData = {
        ...formData,
        gender: formData.gender || undefined as Gender,
        agreeToTerms
      }
      await register(registrationData)

      // Hiện thông báo thành công
      toast({
        title: "Đăng ký thành công!",
        description: "Chào mừng bạn đến với nền tảng của chúng tôi. Bạn sẽ được chuyển về trang chủ.",
        variant: "default"
      })

      // Chuyển về trang chủ sau 2 giây
      setTimeout(() => {
        router.push('/')
      }, 2000)

    } catch (error) {
      console.error('Registration failed:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
    
    // Real-time validation
    if (field === 'username' && value.length >= 3) {
      checkUsername(value)
    }
    if (field === 'email' && value.includes('@')) {
      checkEmail(value)
    }
    if (field === 'password') {
      const error = validatePassword(value)
      setErrors(prev => ({ ...prev, password: error }))
    }
    if (field === 'phoneNumber') {
      const error = validatePhoneNumber(value)
      setErrors(prev => ({ ...prev, phoneNumber: error }))
    }
    if (field === 'referralCode') {
      const error = validateReferralCode(value)
      setErrors(prev => ({ ...prev, referralCode: error }))
    }
    if (field === 'firstName' && value) {
      const error = (value.length < 2 || value.length > 50) ? 'Tên phải từ 2-50 ký tự' : ''
      setErrors(prev => ({ ...prev, firstName: error }))
    }
    if (field === 'lastName' && value) {
      const error = (value.length < 2 || value.length > 50) ? 'Họ phải từ 2-50 ký tự' : ''
      setErrors(prev => ({ ...prev, lastName: error }))
    }
  }

  const handleGenderChange = (value: string) => {
    const genderValue = value as Gender
    setFormData(prev => ({ ...prev, gender: genderValue }))
  }

  return (
    <Card className="w-full shadow-xl border-0 bg-white/95 backdrop-blur-sm">
      <CardHeader className="space-y-1 text-center">
        <div className="flex justify-center mb-4">
          <div className="w-12 h-12 bg-gradient-to-r from-green-600 to-blue-600 rounded-full flex items-center justify-center">
            <UserPlus className="w-6 h-6 text-white" />
          </div>
        </div>
        <CardTitle className="text-2xl font-bold text-black">Đăng ký</CardTitle>
        <CardDescription>
          Tạo tài khoản mới để tham gia 
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Username */}
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
            {usernameChecking && <p className="text-sm text-blue-600">Đang kiểm tra...</p>}
            {errors.username && <p className="text-sm text-red-600">{errors.username}</p>}
          </div>

          {/* Email */}
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
            {emailChecking && <p className="text-sm text-blue-600">Đang kiểm tra...</p>}
            {errors.email && <p className="text-sm text-red-600">{errors.email}</p>}
          </div>

          {/* First Name & Last Name */}
          <div className="grid grid-cols-2 gap-3">
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

          {/* Phone Number */}
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

          {/* Gender & Date of Birth */}
          <div className="grid grid-cols-2 gap-3">
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

          {/* Referral Code */}
          <div className="space-y-2">
            <Input
              id="referralCode"
              type="text"
              placeholder="Mã giới thiệu (không bắt buộc)"
              value={formData.referralCode}
              onChange={(e) => handleInputChange('referralCode', e.target.value)}
              className={`h-11 ${errors.referralCode ? 'border-red-500' : ''}`}
            />
            {errors.referralCode && <p className="text-sm text-red-600">{errors.referralCode}</p>}
          </div>

          {/* Password */}
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
              {showPassword ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
            {errors.password && <p className="text-sm text-red-600">{errors.password}</p>}
          </div>

          {/* Confirm Password */}
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
              {showConfirmPassword ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
            {errors.confirmPassword && <p className="text-sm text-red-600">{errors.confirmPassword}</p>}
          </div>
          
          {/* Terms Agreement */}
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
          
          <Button
            type="submit"
            className="w-full h-11 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white font-medium"
            disabled={isLoading || usernameChecking || emailChecking}
          >
            {isLoading ? (
              <>
                <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                Đang tạo tài khoản...
              </>
            ) : (
              'Tạo tài khoản'
            )}
          </Button>
        </form>
        
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-2 text-muted-foreground">Hoặc đăng ký với</span>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          <Button variant="outline" className="h-11">
            <Icons.google className="mr-2 h-4 w-4" />
            Google
          </Button>
          <Button variant="outline" className="h-11">
            <Icons.github className="mr-2 h-4 w-4" />
            GitHub
          </Button>
        </div>
        
        <div className="text-center text-sm">
          <span className="text-muted-foreground">Đã có tài khoản? </span>
          <Link
            href="/login"
            className="text-purple-600 hover:text-purple-500 hover:underline font-medium"
          >
            Đăng nhập ngay
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
