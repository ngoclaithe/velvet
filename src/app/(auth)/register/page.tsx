'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Icons } from '@/components/common/Icons'
import { UserPlus, Eye, EyeOff } from 'lucide-react'

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [agreeToTerms, setAgreeToTerms] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { register } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (formData.password !== formData.confirmPassword) {
      alert('Mật khẩu không khớp!')
      return
    }
    if (!agreeToTerms) {
      alert('Vui lòng đồng ý với điều khoản sử dụng!')
      return
    }
    
    setIsLoading(true)
    try {
      await register(formData.username, formData.email, formData.password)
    } catch (error) {
      console.error('Registration failed:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <Card className="w-full shadow-xl border-0 bg-white/95 backdrop-blur-sm">
      <CardHeader className="space-y-1 text-center">
        <div className="flex justify-center mb-4">
          <div className="w-12 h-12 bg-gradient-to-r from-green-600 to-blue-600 rounded-full flex items-center justify-center">
            <UserPlus className="w-6 h-6 text-white" />
          </div>
        </div>
        <CardTitle className="text-2xl font-bold">Đăng ký</CardTitle>
        <CardDescription>
          Tạo tài khoản mới để tham gia cộng đồng streaming
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Input
              id="username"
              type="text"
              placeholder="Tên người dùng"
              value={formData.username}
              onChange={(e) => handleInputChange('username', e.target.value)}
              required
              className="h-11"
            />
          </div>
          <div className="space-y-2">
            <Input
              id="email"
              type="email"
              placeholder="Email của bạn"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              required
              className="h-11"
            />
          </div>
          <div className="space-y-2 relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Mật khẩu"
              value={formData.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
              required
              className="h-11 pr-10"
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
          </div>
          <div className="space-y-2 relative">
            <Input
              id="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              placeholder="Xác nhận mật khẩu"
              value={formData.confirmPassword}
              onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
              required
              className="h-11 pr-10"
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
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox
              id="terms"
              checked={agreeToTerms}
              onCheckedChange={(checked) => setAgreeToTerms(checked as boolean)}
            />
            <label
              htmlFor="terms"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
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
          
          <Button
            type="submit"
            className="w-full h-11 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white font-medium"
            disabled={isLoading}
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
            href="/(auth)/login"
            className="text-purple-600 hover:text-purple-500 hover:underline font-medium"
          >
            Đăng nhập ngay
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
