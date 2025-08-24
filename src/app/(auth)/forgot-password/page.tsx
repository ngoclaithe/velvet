'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Icons } from '@/components/common/Icons'
import { Mail, ArrowLeft } from 'lucide-react'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const { forgotPassword, error } = useAuth()

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate form
    const newErrors: Record<string, string> = {}
    
    if (!email) {
      newErrors.email = 'Email là bắt buộc'
    } else if (!validateEmail(email)) {
      newErrors.email = 'Email không hợp lệ'
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }
    
    setIsLoading(true)
    setErrors({})
    
    try {
      await forgotPassword({ email })
      setIsSuccess(true)
    } catch (error) {
      console.error('Forgot password failed:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (value: string) => {
    setEmail(value)
    
    // Clear error when user starts typing
    if (errors.email) {
      setErrors(prev => ({ ...prev, email: '' }))
    }
  }

  if (isSuccess) {
    return (
      <Card className="w-full shadow-xl border-0 bg-white/95 backdrop-blur-sm">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-green-600 to-blue-600 rounded-full flex items-center justify-center">
              <Mail className="w-6 h-6 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Email đã được gửi</CardTitle>
          <CardDescription>
            Chúng tôi đã gửi link khôi phục mật khẩu đến email của bạn
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center space-y-4">
            <p className="text-sm text-muted-foreground">
              Vui lòng kiểm tra hộp thư của bạn và click vào link trong email để đặt lại mật khẩu.
            </p>
            <p className="text-sm text-muted-foreground">
              Nếu bạn không thấy email, hãy kiểm tra thư mục spam.
            </p>
            
            <div className="flex flex-col space-y-2">
              <Button
                onClick={() => {
                  setIsSuccess(false)
                  setEmail('')
                }}
                variant="outline"
                className="w-full h-11"
              >
                Gửi lại email
              </Button>
              
              <Link href="/login">
                <Button variant="ghost" className="w-full h-11">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Quay lại đăng nhập
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full shadow-xl border-0 bg-white/95 backdrop-blur-sm">
      <CardHeader className="space-y-1 text-center">
        <div className="flex justify-center mb-4">
          <div className="w-12 h-12 bg-gradient-to-r from-orange-600 to-red-600 rounded-full flex items-center justify-center">
            <Mail className="w-6 h-6 text-white" />
          </div>
        </div>
        <CardTitle className="text-2xl font-bold">Quên mật khẩu</CardTitle>
        <CardDescription>
          Nh���p email của bạn để nhận link khôi phục mật khẩu
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <div className="space-y-2">
            <Input
              id="email"
              type="email"
              placeholder="Nhập email của bạn"
              value={email}
              onChange={(e) => handleInputChange(e.target.value)}
              required
              className={`h-11 ${errors.email ? 'border-red-500' : ''}`}
            />
            {errors.email && <p className="text-sm text-red-600">{errors.email}</p>}
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
            className="w-full h-11 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white font-medium"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                Đang gửi email...
              </>
            ) : (
              'Gửi link khôi phục'
            )}
          </Button>
        </form>
        
        <div className="text-center text-sm">
          <span className="text-muted-foreground">Nhớ mật khẩu rồi? </span>
          <Link
            href="/login"
            className="text-purple-600 hover:text-purple-500 hover:underline font-medium"
          >
            <ArrowLeft className="w-4 h-4 inline mr-1" />
            Quay lại đăng nhập
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
