'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Icons } from '@/components/common/Icons'
import { LogIn, Eye, EyeOff } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export default function LoginPage() {
  const [loginField, setLoginField] = useState('') // Email hoặc username
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const { login, error } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate form
    const newErrors: Record<string, string> = {}
    
    if (!loginField) {
      newErrors.loginField = 'Email hoặc username là bắt buộc'
    }
    
    if (!password) {
      newErrors.password = 'Mật khẩu là bắt buộc'
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }
    
    setIsLoading(true)
    setErrors({})

    try {
      await login({
        loginField, // Backend nhận loginField (có thể là email hoặc username)
        password,
        rememberMe
      })

      // Hiện thông báo thành công
      toast({
        title: "Đăng nhập thành công!",
        description: "Chào mừng bạn trở lại!",
        variant: "default"
      })

      // Redirect dựa trên role của user
      // Cần delay nhỏ để đảm bảo user context được cập nhật
      setTimeout(() => {
        // Note: Cần access user role từ response hoặc context sau khi login
        // Tạm thời redirect về trang chủ, logic này có thể cần cập nhật
        // khi có thông tin user sau login
        router.push('/')
      }, 100)

    } catch (error) {
      console.error('Login failed:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    if (field === 'loginField') {
      setLoginField(value)
    } else if (field === 'password') {
      setPassword(value)
    }
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  return (
    <Card className="w-full shadow-xl border-0 bg-white/95 backdrop-blur-sm">
      <CardHeader className="space-y-1 text-center">
        <div className="flex justify-center mb-4">
          <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center">
            <LogIn className="w-6 h-6 text-white" />
          </div>
        </div>
        <CardTitle className="text-2xl text-black font-bold">Đăng nhập</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Login Field (Email hoặc Username) */}
          <div className="space-y-2">
            <Input
              id="loginField"
              type="text"
              placeholder="Email hoặc tên người dùng"
              value={loginField}
              onChange={(e) => handleInputChange('loginField', e.target.value)}
              required
              className={`h-11 ${errors.loginField ? 'border-red-500' : ''}`}
            />
            {errors.loginField && <p className="text-sm text-red-600">{errors.loginField}</p>}
          </div>

          {/* Password */}
          <div className="space-y-2 relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Mật khẩu"
              value={password}
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

          {/* Remember Me & Forgot Password */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="remember"
                checked={rememberMe}
                onCheckedChange={(checked) => setRememberMe(checked as boolean)}
              />
              <label
                htmlFor="remember"
                className="text-sm text-black font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Ghi nhớ đăng nhập
              </label>
            </div>
            <Link
              href="/forgot-password"
              className="text-sm text-purple-600 hover:text-purple-500 hover:underline"
            >
              Quên mật khẩu?
            </Link>
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
            className="w-full h-11 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-medium"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                Đang đăng nhập...
              </>
            ) : (
              'Đăng nhập'
            )}
          </Button>
        </form>
        
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-2 text-muted-foreground">Hoặc tiếp tục với</span>
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
          <span className="text-muted-foreground">Chưa có tài khoản? </span>
          <Link
            href="/register"
            className="text-purple-600 hover:text-purple-500 hover:underline font-medium"
          >
            Đăng ký ngay
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
