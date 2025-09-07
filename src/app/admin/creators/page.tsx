"use client"

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import ImageUploader from '@/components/ImageUploader'
import { adminAPI } from '@/lib/api/admin'
import { creatorAPI } from '@/lib/api/creator'
import { VIETNAM_CITIES } from '@/lib/constants'
import { toast } from 'react-hot-toast'

interface Credentials {
  email: string
  username: string
  password: string
  note?: string
}

const CREATOR_TYPES = [
  'stream',
  'chat',
  'callgirl',
  'stream+callgirl',
  'chat+callgirl',
]

const BODY_TYPES = [
  { value: 'slim', label: 'mình dây' },
  { value: 'chubby', label: 'chubby' },
  { value: 'curvy', label: 'đầy đặn' },
  { value: 'hourglass', label: 'Đồng hồ cát' },
  { value: 'triangle', label: 'Tam giác' },
  { value: 'inverted_triangle', label: 'Tam giác ngược' },
  { value: 'athletic', label: 'Athletic/Gym' },
]

const LANGUAGE_OPTIONS = [
  { value: 'vi', label: 'Tiếng Việt' },
  { value: 'en', label: 'Tiếng Anh' },
  { value: 'ja', label: 'Tiếng Nhật' },
  { value: 'ko', label: 'Tiếng Hàn' },
  { value: 'zh', label: 'Tiếng Trung' },
]

export default function CreatorsAdminPage() {
  const [submitting, setSubmitting] = useState(false)
  const [credentials, setCredentials] = useState<Credentials | null>(null)
  const [open, setOpen] = useState(false)

  const [creators, setCreators] = useState<any[]>([])
  const [loadingCreators, setLoadingCreators] = useState(false)

  const downloadCredentials = () => {
    if (!credentials) return
    const content = `Email: ${credentials.email}\nUsername: ${credentials.username}\nPassword: ${credentials.password}\n`
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `creator_credentials_${credentials.username}.txt`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  useEffect(() => {
    const fetch = async () => {
      try {
        setLoadingCreators(true)
        const res: any = await creatorAPI.getAllCreators()
        const list = Array.isArray(res?.data) ? res.data : []
        setCreators(list)
      } catch (e) {
        setCreators([])
      } finally {
        setLoadingCreators(false)
      }
    }
    fetch()
  }, [])

  const [form, setForm] = useState<any>({
    firstName: '',
    lastName: '',
    phoneNumber: '',
    dateOfBirth: '',
    avatar: '',
    gender: '',
    country: '',
    city: 'all',
    timezone: 'Asia/Ho_Chi_Minh',
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
    specialties: [] as string[], // Loại creator
    languages: ['vi'] as string[],
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

  const toggleArrayField = (key: string, value: string) => {
    setForm((prev: any) => {
      const arr: string[] = Array.isArray(prev[key]) ? prev[key] : []
      const next = arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value]
      return { ...prev, [key]: next }
    })
  }

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
              <Select value={form.gender} onValueChange={(v) => setField('gender', v)}>
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
            <div>
              <Label>Quốc gia</Label>
              <Input value={form.country} onChange={(e) => setField('country', e.target.value)} />
            </div>
            <div>
              <Label>Thành phố</Label>
              <Select value={form.city} onValueChange={(v) => setField('city', v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn thành phố" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Chưa chọn</SelectItem>
                  {VIETNAM_CITIES.map(c => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
              <Label>Loại creator</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {CREATOR_TYPES.map((type) => (
                  <label key={type} className="flex items-center gap-2 text-sm border rounded px-2 py-1">
                    <input
                      type="checkbox"
                      checked={Array.isArray(form.specialties) && form.specialties.includes(type)}
                      onChange={() => toggleArrayField('specialties', type)}
                    />
                    <span>{type}</span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <Label>Ngôn ngữ</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {LANGUAGE_OPTIONS.map((opt) => (
                  <label key={opt.value} className="flex items-center gap-2 text-sm border rounded px-2 py-1">
                    <input
                      type="checkbox"
                      checked={Array.isArray(form.languages) && form.languages.includes(opt.value)}
                      onChange={() => toggleArrayField('languages', opt.value)}
                    />
                    <span>{opt.label}</span>
                  </label>
                ))}
              </div>
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
              <Select value={form.bodyType} onValueChange={(v) => setField('bodyType', v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn dáng người" />
                </SelectTrigger>
                <SelectContent>
                  {BODY_TYPES.map((b) => (
                    <SelectItem key={b.value} value={b.value}>{b.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
              <Label>Các dịch vụ</Label>
              <Input value={form.service} onChange={(e) => setField('service', e.target.value)} />
            </div>
            <div>
              <Label>Đặc điểm nhận dạng</Label>
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
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>Thêm Creator</Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl w-[95vw]">
            <DialogHeader>
              <DialogTitle>Thêm Creator mới</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {/* Reuse form fields - simplify by showing summary */}
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
                  <Label>Email</Label>
                  <Input value={form.email} onChange={(e) => setField('email', e.target.value)} />
                </div>
                <div>
                  <Label>Số điện thoại</Label>
                  <Input value={form.phoneNumber} onChange={(e) => setField('phoneNumber', e.target.value)} />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Hủy</Button>
              <Button onClick={async () => { await onSubmit(); setOpen(false) }} disabled={submitting}>{submitting ? 'Đang tạo...' : 'Tạo'}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Credentials modal */}
      <Dialog open={Boolean(credentials)} onOpenChange={() => setCredentials(null)}>
        <DialogContent className="max-w-md w-[90vw]">
          <DialogHeader>
            <DialogTitle>Thông tin đăng nhập của Creator</DialogTitle>
          </DialogHeader>
          <CardContent className="space-y-2 text-sm">
            {credentials && (
              <>
                <div>Email: <b>{credentials.email}</b></div>
                <div>Username: <b>{credentials.username}</b></div>
                <div>Password: <b>{credentials.password}</b></div>
                {credentials.note && <div className="text-gray-600">{credentials.note}</div>}
                <div className="mt-3 flex gap-2">
                  <Button onClick={downloadCredentials}>Tải .txt</Button>
                  <Button variant="outline" onClick={() => { setCredentials(null) }}>Đóng</Button>
                </div>
              </>
            )}
          </CardContent>
        </DialogContent>
      </Dialog>

    </div>
  )
}
