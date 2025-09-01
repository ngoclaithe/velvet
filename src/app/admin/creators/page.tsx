"use client"

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import ImageUploader from '@/components/ImageUploader'
import { adminAPI } from '@/lib/api/admin'
import { toast } from 'react-hot-toast'

interface Credentials {
  email: string
  username: string
  password: string
  note?: string
}

export default function CreatorsAdminPage() {
  const [submitting, setSubmitting] = useState(false)
  const [credentials, setCredentials] = useState<Credentials | null>(null)

  const [form, setForm] = useState<any>({
    firstName: '',
    lastName: '',
    phoneNumber: '',
    dateOfBirth: '',
    avatar: '',
    gender: '',
    country: '',
    city: '',
    timezone: '',
    language: 'vi',
    referralCode: '',
    stageName: '',
    titleBio: '',
    bio: '',
    bioUrls: [] as string[],
    tags: [] as string[],
    isVerified: false,
    hourlyRate: '',
    minBookingDuration: '',
    specialties: [] as string[],
    languages: [] as string[],
    bodyType: '',
    height: '',
    weight: '',
    measurement: '',
    eyeColor: '',
    service: '',
    isTatto: false,
    signature: '',
    hairColor: '',
    cosmeticSurgery: false,
    bookingPrice: '',
    subscriptionPrice: '',
    availabilitySchedule: {} as Record<string, any>,
  })

  const setField = (key: string, value: any) => setForm((prev: any) => ({ ...prev, [key]: value }))

  const onSubmit = async () => {
    setSubmitting(true)
    setCredentials(null)
    try {
      const payload: any = {
        ...form,
        hourlyRate: form.hourlyRate ? Number(form.hourlyRate) : undefined,
        minBookingDuration: form.minBookingDuration ? Number(form.minBookingDuration) : undefined,
        height: form.height ? Number(form.height) : undefined,
        weight: form.weight ? Number(form.weight) : undefined,
        bookingPrice: form.bookingPrice ? Number(form.bookingPrice) : undefined,
        subscriptionPrice: form.subscriptionPrice ? Number(form.subscriptionPrice) : undefined,
        tags: Array.isArray(form.tags) ? form.tags : String(form.tags || '')?.split(',').map((s: string) => s.trim()).filter(Boolean),
        specialties: Array.isArray(form.specialties) ? form.specialties : String(form.specialties || '')?.split(',').map((s: string) => s.trim()).filter(Boolean),
        languages: Array.isArray(form.languages) ? form.languages : String(form.languages || '')?.split(',').map((s: string) => s.trim()).filter(Boolean),
        bioUrls: Array.isArray(form.bioUrls) ? form.bioUrls : [],
      }

      const res: any = await adminAPI.createCreator(payload)
      if (res?.success === false) throw new Error(res?.message || res?.error || 'Tạo creator thất bại')

      const data = res?.data ?? {}
      setCredentials(data?.credentials || null)
      toast.success('Admin đã tạo profile creator thành công')
    } catch (e: any) {
      console.error(e)
      toast.error(e?.message || 'Có lỗi xảy ra khi tạo creator')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Quản lý thông tin Creator</h1>
        <p className="text-gray-600">Tạo hồ sơ creator mới</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Thông tin cơ bản</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Họ</Label>
              <Input value={form.firstName} onChange={(e) => setField('firstName', e.target.value)} />
            </div>
            <div>
              <Label>Tên</Label>
              <Input value={form.lastName} onChange={(e) => setField('lastName', e.target.value)} />
            </div>
            <div>
              <Label>Số điện thoại</Label>
              <Input value={form.phoneNumber} onChange={(e) => setField('phoneNumber', e.target.value)} />
            </div>
            <div>
              <Label>Ngày sinh</Label>
              <Input type="date" value={form.dateOfBirth} onChange={(e) => setField('dateOfBirth', e.target.value)} />
            </div>
            <div>
              <Label>Giới tính</Label>
              <Input value={form.gender} onChange={(e) => setField('gender', e.target.value)} placeholder="male/female/other" />
            </div>
            <div>
              <Label>Ngôn ngữ</Label>
              <Input value={form.language} onChange={(e) => setField('language', e.target.value)} />
            </div>
            <div>
              <Label>Quốc gia</Label>
              <Input value={form.country} onChange={(e) => setField('country', e.target.value)} />
            </div>
            <div>
              <Label>Thành phố</Label>
              <Input value={form.city} onChange={(e) => setField('city', e.target.value)} />
            </div>
            <div>
              <Label>Múi giờ</Label>
              <Input value={form.timezone} onChange={(e) => setField('timezone', e.target.value)} placeholder="Asia/Ho_Chi_Minh" />
            </div>
            <div>
              <Label>Mã giới thiệu</Label>
              <Input value={form.referralCode} onChange={(e) => setField('referralCode', e.target.value)} />
            </div>
            <div>
              <Label>Nghệ danh</Label>
              <Input value={form.stageName} onChange={(e) => setField('stageName', e.target.value)} />
            </div>
            <div>
              <Label>Tiêu đề Bio</Label>
              <Input value={form.titleBio} onChange={(e) => setField('titleBio', e.target.value)} />
            </div>
            <div className="md:col-span-2">
              <Label>Bio</Label>
              <Textarea value={form.bio} onChange={(e) => setField('bio', e.target.value)} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Ảnh đại diện và Bộ sưu tập</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label className="mb-2 block">Avatar (1 ảnh)</Label>
            <ImageUploader
              maxFiles={1}
              compact
              onUploadComplete={(results) => {
                const url = results?.[0]?.secure_url
                if (url) setField('avatar', url)
              }}
              hideResults
            />
            {form.avatar && (
              <div className="mt-3">
                <img src={form.avatar} alt="avatar" className="h-20 w-20 rounded-full object-cover border" />
              </div>
            )}
          </div>
          <div>
            <Label className="mb-2 block">Ảnh Bio (nhiều ảnh)</Label>
            <ImageUploader
              maxFiles={10}
              compact
              onUploadComplete={(results) => {
                const urls = results.map((r) => r.secure_url).filter(Boolean)
                setField('bioUrls', [...form.bioUrls, ...urls])
              }}
              hideResults
            />
            {form.bioUrls?.length > 0 && (
              <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {form.bioUrls.map((u: string, i: number) => (
                  <div key={i} className="relative">
                    <img src={u} alt={`bio-${i}`} className="h-24 w-full object-cover rounded border" />
                    <button
                      type="button"
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6"
                      onClick={() => setField('bioUrls', form.bioUrls.filter((_: string, idx: number) => idx !== i))}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Thông tin chi tiết</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Tags (phân tách bằng dấu phẩy)</Label>
              <Input value={Array.isArray(form.tags) ? form.tags.join(', ') : form.tags} onChange={(e) => setField('tags', e.target.value)} />
            </div>
            <div>
              <Label>Chuyên môn (phân tách bằng dấu phẩy)</Label>
              <Input value={Array.isArray(form.specialties) ? form.specialties.join(', ') : form.specialties} onChange={(e) => setField('specialties', e.target.value)} />
            </div>
            <div>
              <Label>Ngôn ngữ (phân tách bằng dấu phẩy)</Label>
              <Input value={Array.isArray(form.languages) ? form.languages.join(', ') : form.languages} onChange={(e) => setField('languages', e.target.value)} />
            </div>
            <div>
              <Label>Giá theo giờ</Label>
              <Input type="number" value={form.hourlyRate} onChange={(e) => setField('hourlyRate', e.target.value)} />
            </div>
            <div>
              <Label>Thời lượng đặt tối thiểu (phút)</Label>
              <Input type="number" value={form.minBookingDuration} onChange={(e) => setField('minBookingDuration', e.target.value)} />
            </div>
            <div>
              <Label>Giá đặt lịch</Label>
              <Input type="number" value={form.bookingPrice} onChange={(e) => setField('bookingPrice', e.target.value)} />
            </div>
            <div>
              <Label>Giá subscription</Label>
              <Input type="number" value={form.subscriptionPrice} onChange={(e) => setField('subscriptionPrice', e.target.value)} />
            </div>
            <div>
              <Label>Dáng người</Label>
              <Input value={form.bodyType} onChange={(e) => setField('bodyType', e.target.value)} />
            </div>
            <div>
              <Label>Chiều cao (cm)</Label>
              <Input type="number" value={form.height} onChange={(e) => setField('height', e.target.value)} />
            </div>
            <div>
              <Label>Cân nặng (kg)</Label>
              <Input type="number" value={form.weight} onChange={(e) => setField('weight', e.target.value)} />
            </div>
            <div>
              <Label>Số đo</Label>
              <Input value={form.measurement} onChange={(e) => setField('measurement', e.target.value)} />
            </div>
            <div>
              <Label>Màu mắt</Label>
              <Input value={form.eyeColor} onChange={(e) => setField('eyeColor', e.target.value)} />
            </div>
            <div>
              <Label>Dịch vụ</Label>
              <Input value={form.service} onChange={(e) => setField('service', e.target.value)} />
            </div>
            <div>
              <Label>Chữ ký</Label>
              <Input value={form.signature} onChange={(e) => setField('signature', e.target.value)} />
            </div>
            <div>
              <Label>Màu tóc</Label>
              <Input value={form.hairColor} onChange={(e) => setField('hairColor', e.target.value)} />
            </div>
            <div className="flex items-center gap-2">
              <input id="isVerified" type="checkbox" checked={form.isVerified} onChange={(e) => setField('isVerified', e.target.checked)} />
              <Label htmlFor="isVerified">Đã xác thực</Label>
            </div>
            <div className="flex items-center gap-2">
              <input id="isTatto" type="checkbox" checked={form.isTatto} onChange={(e) => setField('isTatto', e.target.checked)} />
              <Label htmlFor="isTatto">Có xăm</Label>
            </div>
            <div className="flex items-center gap-2">
              <input
                id="cosmeticSurgery"
                type="checkbox"
                checked={form.cosmeticSurgery}
                onChange={(e) => setField('cosmeticSurgery', e.target.checked)}
              />
              <Label htmlFor="cosmeticSurgery">Phẫu thuật thẩm mỹ</Label>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-end gap-3">
        <Button variant="outline" onClick={() => window.history.back()}>Hủy</Button>
        <Button onClick={onSubmit} disabled={submitting}>
          {submitting ? 'Đang tạo...' : 'Tạo Creator'}
        </Button>
      </div>

      {credentials && (
        <Card>
          <CardHeader>
            <CardTitle>Thông tin đăng nhập của Creator</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div>Email: <b>{credentials.email}</b></div>
            <div>Username: <b>{credentials.username}</b></div>
            <div>Password: <b>{credentials.password}</b></div>
            {credentials.note && <div className="text-gray-600">{credentials.note}</div>}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
