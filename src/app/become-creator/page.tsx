'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Icons } from '@/components/common/Icons'
import { Star, Video, DollarSign, Clock, Users, Target } from 'lucide-react'
import { toast } from 'react-hot-toast'

export default function BecomeCreatorPage() {
  const { user, upgradeToCreator, isLoading: authLoading } = useAuth()
  const router = useRouter()
  
  const [formData, setFormData] = useState({
    stageName: '',
    bio: '',
    hourlyRate: '',
    minBookingDuration: '',
    bookingPrice: '',
    subscriptionPrice: '',
    height: '',
    weight: ''
  })
  
  const [agreeToCreatorTerms, setAgreeToCreatorTerms] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Redirect if not logged in or already a creator
  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        toast.error('Bạn cần đăng nhập để trở thành Creator')
        router.push('/login')
        return
      }
      
      if (user.role === 'creator') {
        toast.error('Bạn đã là Creator rồi!')
        router.push('/stream')
        return
      }
    }
  }, [user, authLoading, router])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.stageName.trim()) {
      newErrors.stageName = 'Tên nghệ danh là bắt buộc'
    } else if (formData.stageName.trim().length < 3) {
      newErrors.stageName = 'Tên nghệ danh phải ít nhất 3 ký tự'
    }

    if (!formData.bio.trim()) {
      newErrors.bio = 'Mô tả về bạn là bắt buộc'
    } else if (formData.bio.trim().length < 50) {
      newErrors.bio = 'Mô tả phải ít nhất 50 ký tự'
    }

    // Validate numbers if provided
    if (formData.hourlyRate && (isNaN(Number(formData.hourlyRate)) || Number(formData.hourlyRate) < 0)) {
      newErrors.hourlyRate = 'Giá theo giờ không hợp lệ'
    }

    if (formData.minBookingDuration && (isNaN(Number(formData.minBookingDuration)) || Number(formData.minBookingDuration) < 0)) {
      newErrors.minBookingDuration = 'Thời gian booking tối thiểu không hợp lệ'
    }

    if (formData.bookingPrice && (isNaN(Number(formData.bookingPrice)) || Number(formData.bookingPrice) < 0)) {
      newErrors.bookingPrice = 'Giá booking không hợp lệ'
    }

    if (formData.subscriptionPrice && (isNaN(Number(formData.subscriptionPrice)) || Number(formData.subscriptionPrice) < 0)) {
      newErrors.subscriptionPrice = 'Giá subscription không hợp lệ'
    }

    if (formData.height && (isNaN(Number(formData.height)) || Number(formData.height) < 0)) {
      newErrors.height = 'Chiều cao không hợp lệ'
    }

    if (formData.weight && (isNaN(Number(formData.weight)) || Number(formData.weight) < 0)) {
      newErrors.weight = 'Cân nặng không hợp lệ'
    }

    if (!agreeToCreatorTerms) {
      newErrors.terms = 'Vui lòng đồng ý với điều khoản Creator'
    }

    return newErrors
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const newErrors = validateForm()
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setIsLoading(true)
    try {
      const creatorData = {
        stageName: formData.stageName.trim(),
        bio: formData.bio.trim(),
        ...(formData.hourlyRate && { hourlyRate: Number(formData.hourlyRate) }),
        ...(formData.minBookingDuration && { minBookingDuration: Number(formData.minBookingDuration) }),
        ...(formData.bookingPrice && { bookingPrice: Number(formData.bookingPrice) }),
        ...(formData.subscriptionPrice && { subscriptionPrice: Number(formData.subscriptionPrice) }),
        ...(formData.height && { height: Number(formData.height) }),
        ...(formData.weight && { weight: Number(formData.weight) })
      }

      await upgradeToCreator(creatorData)
      
      toast.success('Chúc mừng! Bạn đã trở thành Creator thành công!')
      router.push('/stream')
    } catch (error) {
      console.error('Upgrade to creator failed:', error)
      toast.error(error instanceof Error ? error.message : 'Có lỗi xảy ra')
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
  }

  if (authLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Đang tải...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!user || user.role === 'creator') {
    return null
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Video className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Trở thành Creator</h1>
          <p className="text-muted-foreground text-lg">
            Chia sẻ đam mê và kiếm tiền từ nội dung của bạn
          </p>
        </div>

        {/* Benefits */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6 text-center">
              <DollarSign className="w-12 h-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Kiếm tiền</h3>
              <p className="text-sm text-muted-foreground">
                Nhận donations, tips và thu nhập từ stream của bạn
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6 text-center">
              <Users className="w-12 h-12 text-blue-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Xây dựng cộng đồng</h3>
              <p className="text-sm text-muted-foreground">
                Tương tác với fans và xây dựng cộng đồng riêng
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6 text-center">
              <Target className="w-12 h-12 text-purple-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Công cụ Creator</h3>
              <p className="text-sm text-muted-foreground">
                Truy cập vào dashboard, analytics và nhiều tính năng khác
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle>Thông tin Creator</CardTitle>
            <CardDescription>
              Điền thông tin để hoàn tất việc trở thành Creator
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Info */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Tên nghệ danh *</label>
                  <Input
                    placeholder="Tên bạn muốn hiển thị cho khán giả"
                    value={formData.stageName}
                    onChange={(e) => handleInputChange('stageName', e.target.value)}
                    className={errors.stageName ? 'border-red-500' : ''}
                  />
                  {errors.stageName && <p className="text-sm text-red-600">{errors.stageName}</p>}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Mô tả về bạn *</label>
                  <Textarea
                    placeholder="Hãy chia sẻ về bản thân, sở thích và loại nội dung bạn sẽ tạo ra..."
                    value={formData.bio}
                    onChange={(e) => handleInputChange('bio', e.target.value)}
                    rows={4}
                    className={errors.bio ? 'border-red-500' : ''}
                  />
                  {errors.bio && <p className="text-sm text-red-600">{errors.bio}</p>}
                  <p className="text-xs text-muted-foreground">
                    {formData.bio.length}/50 ký tự tối thiểu
                  </p>
                </div>
              </div>

              {/* Pricing (Optional) */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Cài đặt giá (tùy chọn)</h3>
                <p className="text-sm text-muted-foreground">
                  Bạn có thể thiết lập sau trong dashboard
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Giá theo giờ (USD)</label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={formData.hourlyRate}
                      onChange={(e) => handleInputChange('hourlyRate', e.target.value)}
                      className={errors.hourlyRate ? 'border-red-500' : ''}
                    />
                    {errors.hourlyRate && <p className="text-sm text-red-600">{errors.hourlyRate}</p>}
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Thời gian booking tối thiểu (phút)</label>
                    <Input
                      type="number"
                      placeholder="30"
                      value={formData.minBookingDuration}
                      onChange={(e) => handleInputChange('minBookingDuration', e.target.value)}
                      className={errors.minBookingDuration ? 'border-red-500' : ''}
                    />
                    {errors.minBookingDuration && <p className="text-sm text-red-600">{errors.minBookingDuration}</p>}
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Giá booking (USD)</label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={formData.bookingPrice}
                      onChange={(e) => handleInputChange('bookingPrice', e.target.value)}
                      className={errors.bookingPrice ? 'border-red-500' : ''}
                    />
                    {errors.bookingPrice && <p className="text-sm text-red-600">{errors.bookingPrice}</p>}
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Giá subscription (USD/tháng)</label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={formData.subscriptionPrice}
                      onChange={(e) => handleInputChange('subscriptionPrice', e.target.value)}
                      className={errors.subscriptionPrice ? 'border-red-500' : ''}
                    />
                    {errors.subscriptionPrice && <p className="text-sm text-red-600">{errors.subscriptionPrice}</p>}
                  </div>
                </div>
              </div>

              {/* Physical Info (Optional) */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Thông tin cá nhân (tùy chọn)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Chiều cao (cm)</label>
                    <Input
                      type="number"
                      placeholder="170"
                      value={formData.height}
                      onChange={(e) => handleInputChange('height', e.target.value)}
                      className={errors.height ? 'border-red-500' : ''}
                    />
                    {errors.height && <p className="text-sm text-red-600">{errors.height}</p>}
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Cân nặng (kg)</label>
                    <Input
                      type="number"
                      placeholder="60"
                      value={formData.weight}
                      onChange={(e) => handleInputChange('weight', e.target.value)}
                      className={errors.weight ? 'border-red-500' : ''}
                    />
                    {errors.weight && <p className="text-sm text-red-600">{errors.weight}</p>}
                  </div>
                </div>
              </div>

              {/* Terms */}
              <div className="space-y-4">
                <div className="flex items-start space-x-2">
                  <Checkbox
                    id="creatorTerms"
                    checked={agreeToCreatorTerms}
                    onCheckedChange={(checked) => setAgreeToCreatorTerms(checked as boolean)}
                  />
                  <label
                    htmlFor="creatorTerms"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Tôi đồng ý với{' '}
                    <a href="/creator-terms" className="text-purple-600 hover:underline" target="_blank">
                      điều khoản Creator
                    </a>{' '}
                    và cam kết tuân thủ các quy định nội dung của nền tảng
                  </label>
                </div>
                {errors.terms && <p className="text-sm text-red-600">{errors.terms}</p>}
              </div>

              <Button
                type="submit"
                className="w-full h-12 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-medium"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                    Đang xử lý...
                  </>
                ) : (
                  <>
                    <Star className="mr-2 h-4 w-4" />
                    Trở thành Creator
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
