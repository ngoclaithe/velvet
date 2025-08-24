'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Icons } from '@/components/common/Icons'
import { Lock, Eye, EyeOff, CheckCircle } from 'lucide-react'

export default function ResetPasswordPage() {
  const params = useParams()
  const router = useRouter()
  const token = params.token as string
  
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const { resetPassword, error } = useAuth()

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate form
    const newErrors: Record<string, string> = {}
    
    if (!formData.password) {
      newErrors.password = 'Mật khẩu là bắt buộc'
    } else {
      const passwordError = validatePassword(formData.password)
      if (passwordError) newErrors.password = passwordError
    }
    
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Xác nhận mật khẩu là bắt buộc'
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Mật khẩu không khớp'
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }
    
    setIsLoading(true)
    setErrors({})
    
    try {
      await resetPassword({
        token,
        password: formData.password,
        confirmPassword: formData.confirmPassword
      })
      setIsSuccess(true)
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        router.push('/login')
      }, 3000)
    } catch (error) {
      console.error('Reset password failed:', error)
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
    
    // Real-time password validation
    if (field === 'password') {
      const error = validatePassword(value)
      setErrors(prev => ({ ...prev, password: error }))
    }
  }

  if (isSuccess) {
    return (
      <Card className="w-full shadow-xl border-0 bg-white/95 backdrop-blur-sm">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-green-600 to-blue-600 rounded-full flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Đặt lại mật khẩu thành công</CardTitle>
          <CardDescription>
            Mật khẩu của bạn đã được cập nhật thành công
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center space-y-4">
            <p className="text-sm text-muted-foreground">
              Bạn sẽ được chuyển hướng đến trang đăng nhập trong 3 giây...
            </p>
            
            <Link href="/login">
              <Button className="w-full h-11 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white font-medium">
                Đăng nhập ngay
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full shadow-xl border-0 bg-white/95 backdrop-blur-sm">
      <CardHeader className="space-y-1 text-center">
        <div className="flex justify-center mb-4">
          <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
            <Lock className="w-6 h-6 text-white" />
          </div>
        </div>
        <CardTitle className="text-2xl font-bold">Đặt lại mật khẩu</CardTitle>
        <CardDescription>
          Nhập mật khẩu mới cho tài khoản của bạn
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* New Password */}
          <div className="space-y-2 relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Mật khẩu mới"
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
              placeholder="Xác nhận mật khẩu mới"
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

          {/* Password Requirements */}
          <div className="p-3 rounded-md bg-blue-50 border border-blue-200">
            <p className="text-sm font-medium text-blue-800 mb-2">Yêu cầu mật khẩu:</p>
            <ul className="text-xs text-blue-700 space-y-1">
              <li>• Ít nhất 8 ký tự</li>
              <li>• Chứa chữ hoa và chữ thường</li>
              <li>• Chứa ít nhất 1 số</li>
              <li>• Chứa ít nhất 1 ký tự đặc biệt (!@#$%^&*)</li>
            </ul>
          </div>

          {/* Global Error */}
          {error && (
            <div className="p-3 rounded-md bg-red-50 border border-red-200">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full h-11 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                Đang cập nhật mật khẩu...
              </>
            ) : (
              'Cập nhật mật khẩu'
            )}
          </Button>
        </form>
        
        <div className="text-center text-sm">
          <span className="text-muted-foreground">Nhớ mật khẩu rồi? </span>
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
