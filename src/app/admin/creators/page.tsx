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
  { value: 'slim', label: 'Mảnh mai' },
  { value: 'athletic', label: 'Vận động/Thể hình' },
  { value: 'average', label: 'Trung bình' },
  { value: 'curvy', label: 'Đẫy đà' },
  { value: 'plus-size', label: 'Ngoại cỡ' },
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

  const getInitialForm = () => ({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    dateOfBirth: '',
    avatar: '',
    gender: '',
    country: 'Việt Nam',
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
    minBookingDuration: '',
    maxConcurrentBookings: '',
    specialties: [] as string[],
    languages: ['vi'] as string[],
    bodyType: '',
    height: '',
    weight: '',
    measurement: '',
    eyeColor: '',
    service: '',
    signature: '',
    hairColor: '',
    cosmeticSurgery: false,
    isTatto: false,
    hourlyRate: '',
    bookingPrice: '',
    subscriptionPrice: '',
    availabilitySchedule: {} as Record<string, any>,
    placeOfOperation: '',
    telegram: '',
    instagram: '',
    facebook: '',
  })

  const [form, setForm] = useState<any>(getInitialForm())

  const setField = (key: string, value: any) => setForm((prev: any) => ({ ...prev, [key]: value }))

  const toggleArrayField = (key: string, value: string) => {
    setForm((prev: any) => {
      const arr: string[] = Array.isArray(prev[key]) ? prev[key] : []
      const next = arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value]
      return { ...prev, [key]: next }
    })
  }

  // Edit modal state
  const [selectedCreatorId, setSelectedCreatorId] = useState<number | null>(null)
  const [editOpen, setEditOpen] = useState(false)

  const fetchCreatorAndOpen = async (id: number) => {
    try {
      setLoadingCreators(true)
      const res: any = await creatorAPI.getCreatorById(id)
      const data = res?.data || res
      
      // Reset form to initial state first
      const initialForm = getInitialForm()
      
      // Map all fields from the response properly
      const mappedForm = {
        ...initialForm,
        // User fields
        firstName: data.user?.firstName || '',
        lastName: data.user?.lastName || '',
        email: data.user?.email || '',
        phoneNumber: data.user?.phoneNumber || '',
        dateOfBirth: data.user?.dateOfBirth ? data.user.dateOfBirth.split('T')[0] : '',
        avatar: data.user?.avatar || '',
        gender: data.user?.gender || '',
        country: data.user?.country || '',
        city: data.user?.city || 'all',
        timezone: data.user?.timezone || 'Asia/Ho_Chi_Minh',
        language: data.user?.language || 'vi',
        referralCode: data.user?.affiliateCode || '',
        
        // Creator fields
        stageName: data.stageName || '',
        titleBio: data.titleBio || '',
        bio: data.bio || '',
        bioUrls: Array.isArray(data.bioUrls) ? data.bioUrls : [],
        tags: Array.isArray(data.tags) ? data.tags : [],
        isVerified: Boolean(data.isVerified),
        hourlyRate: data.hourlyRate ? String(data.hourlyRate) : '',
        minBookingDuration: data.minBookingDuration ? String(data.minBookingDuration) : '',
        maxConcurrentBookings: data.maxConcurrentBookings ? String(data.maxConcurrentBookings) : '',
        specialties: Array.isArray(data.specialties) ? data.specialties : [],
        languages: Array.isArray(data.languages) && data.languages.length > 0 ? data.languages : ['vi'],
        bodyType: data.bodyType || '',
        height: data.height ? String(data.height) : '',
        weight: data.weight ? String(data.weight) : '',
        measurement: data.measurement || '',
        eyeColor: data.eyeColor || '',
        service: data.service || '',
        signature: data.signature || '',
        hairColor: data.hairColor || '',
        cosmeticSurgery: Boolean(data.cosmeticSurgery),
        isTatto: Boolean(data.isTatto),
        bookingPrice: data.bookingPrice ? String(data.bookingPrice) : '',
        subscriptionPrice: data.subscriptionPrice ? String(data.subscriptionPrice) : '',
        availabilitySchedule: data.availabilitySchedule || {},
        // Social / location fields
        placeOfOperation: data.placeOfOperation || data.place || data.operatingPlace || '',
        telegram: data.telegram || data.user?.telegram || '',
        instagram: data.instagram || data.user?.instagram || '',
        facebook: data.facebook || data.user?.facebook || '',
      }
      
      setForm(mappedForm)
      setSelectedCreatorId(id)
      setEditOpen(true)
    } catch (e) {
      console.error(e)
      toast.error('Không thể lấy chi tiết creator')
    } finally {
      setLoadingCreators(false)
    }
  }

  const onSubmit = async () => {
    setSubmitting(true)
    setCredentials(null)
    try {
      const payload: any = {
        ...form,
        hourlyRate: form.hourlyRate ? Number(form.hourlyRate) : undefined,
        minBookingDuration: form.minBookingDuration ? parseInt(String(form.minBookingDuration), 10) : undefined,
        maxConcurrentBookings: form.maxConcurrentBookings ? parseInt(String(form.maxConcurrentBookings), 10) : undefined,
        height: form.height ? Number(form.height) : undefined,
        weight: form.weight ? Number(form.weight) : undefined,
        bookingPrice: form.bookingPrice ? Number(form.bookingPrice) : undefined,
        subscriptionPrice: form.subscriptionPrice ? Number(form.subscriptionPrice) : undefined,
        service: Array.isArray(form.service)
          ? form.service
          : String(form.service || '')
              .split(/,|\n/)
              .map((s: string) => s.trim())
              .filter(Boolean),
        tags: Array.isArray(form.tags) ? form.tags : String(form.tags || '')?.split(',').map((s: string) => s.trim()).filter(Boolean),
        specialties: Array.isArray(form.specialties) ? form.specialties : String(form.specialties || '')?.split(',').map((s: string) => s.trim()).filter(Boolean),
        languages: Array.isArray(form.languages) ? form.languages : String(form.languages || '')?.split(',').map((s: string) => s.trim()).filter(Boolean),
        bioUrls: Array.isArray(form.bioUrls) ? form.bioUrls : [],
      }
      // Normalize city: 'all' means not selected
      if (payload.city === 'all') delete payload.city
      // Remove non-selected gender
      if (!payload.gender || payload.gender === 'none') delete payload.gender
      // Filter invalid enum values to satisfy BE validation
      const allowedBodyTypes = ['slim','athletic','average','curvy','plus-size']
      if (payload.bodyType && !allowedBodyTypes.includes(payload.bodyType)) delete payload.bodyType

      // Parse availabilitySchedule if admin entered JSON string
      if (typeof payload.availabilitySchedule === 'string') {
        try {
          payload.availabilitySchedule = JSON.parse(payload.availabilitySchedule)
        } catch (e) {
          payload.availabilitySchedule = {}
        }
      }
      const res: any = await adminAPI.createCreator(payload)
      if (res?.success === false) throw new Error(res?.message || res?.error || 'Tạo creator thất bại')

      const data = res?.data ?? {}
      setCredentials(data?.credentials || null)
      toast.success('Admin đã tạo profile creator thành công')
      // refresh list
      const all: any = await creatorAPI.getAllCreators()
      setCreators(Array.isArray(all?.data) ? all.data : [])
    } catch (e: any) {
      console.error(e)
      toast.error(e?.message || 'Có lỗi xảy ra khi tạo creator')
    } finally {
      setSubmitting(false)
    }
  }

  const onEditSubmit = async () => {
    if (!selectedCreatorId) return
    setSubmitting(true)
    try {
      const payload: any = {
        ...form,
        hourlyRate: form.hourlyRate ? Number(form.hourlyRate) : undefined,
        minBookingDuration: form.minBookingDuration ? parseInt(String(form.minBookingDuration), 10) : undefined,
        maxConcurrentBookings: form.maxConcurrentBookings ? parseInt(String(form.maxConcurrentBookings), 10) : undefined,
        height: form.height ? Number(form.height) : undefined,
        weight: form.weight ? Number(form.weight) : undefined,
        bookingPrice: form.bookingPrice ? Number(form.bookingPrice) : undefined,
        subscriptionPrice: form.subscriptionPrice ? Number(form.subscriptionPrice) : undefined,
        service: Array.isArray(form.service)
          ? form.service
          : String(form.service || '')
              .split(/,|\n/)
              .map((s: string) => s.trim())
              .filter(Boolean),
        tags: Array.isArray(form.tags) ? form.tags : String(form.tags || '')?.split(',').map((s: string) => s.trim()).filter(Boolean),
        specialties: Array.isArray(form.specialties) ? form.specialties : String(form.specialties || '')?.split(',').map((s: string) => s.trim()).filter(Boolean),
        languages: Array.isArray(form.languages) ? form.languages : String(form.languages || '')?.split(',').map((s: string) => s.trim()).filter(Boolean),
        bioUrls: Array.isArray(form.bioUrls) ? form.bioUrls : [],
      }
      if (payload.city === 'all') delete payload.city
      if (!payload.gender || payload.gender === 'none') delete payload.gender
      const allowedBodyTypes = ['slim','athletic','average','curvy','plus-size']
      if (payload.bodyType && !allowedBodyTypes.includes(payload.bodyType)) delete payload.bodyType
      // Parse availabilitySchedule if admin entered JSON string
      if (typeof payload.availabilitySchedule === 'string') {
        try {
          payload.availabilitySchedule = JSON.parse(payload.availabilitySchedule)
        } catch (e) {
          payload.availabilitySchedule = {}
        }
      }
      const res: any = await creatorAPI.updateCreator(selectedCreatorId, payload)
      if (res?.success === false) throw new Error(res?.message || res?.error || 'Cập nhật thất bại')
      toast.success('Cập nhật creator thành công')
      // refresh list
      const all: any = await creatorAPI.getAllCreators()
      setCreators(Array.isArray(all?.data) ? all.data : [])
      setEditOpen(false)
    } catch (e: any) {
      console.error(e)
      toast.error(e?.message || 'Có lỗi xảy ra khi cập nhật')
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
          <CardTitle>Danh sách creators</CardTitle>
        </CardHeader>
        <CardContent>
          {loadingCreators ? (
            <div className="space-y-2">
              <div className="h-6 bg-gray-200 rounded w-1/3 animate-pulse" />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="p-4 bg-gray-50 rounded border" />
                ))}
              </div>
            </div>
          ) : creators.length === 0 ? (
            <div className="text-gray-600">Chưa có creators</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white text-gray-900">
                <thead>
                  <tr className="text-left bg-gray-50">
                    <th className="px-4 py-2 text-sm font-medium text-gray-700">Avatar</th>
                    <th className="px-4 py-2 text-sm font-medium text-gray-700">Name / Username</th>
                    <th className="px-4 py-2 text-sm font-medium text-gray-700">Nơi hoạt động</th>
                    <th className="px-4 py-2 text-sm font-medium text-gray-700">Followers</th>
                  </tr>
                </thead>
                <tbody>
                  {creators.map((c: any) => (
                    <tr key={c.id} className="border-t hover:bg-gray-50 cursor-pointer" onClick={() => fetchCreatorAndOpen(Number(c.id))}>
                      <td className="px-4 py-3 align-top text-gray-900">
                        <img src={c.avatar || c.user?.avatar} alt={c.stageName || c.user?.username || c.username} className="w-10 h-10 rounded-full object-cover" />
                      </td>
                      <td className="px-4 py-3 align-top text-gray-900">
                        <div className="font-semibold text-gray-900">{c.stageName || `${c.firstName || ''} ${c.lastName || ''}`.trim() || c.user?.username || c.username}</div>
                        <div className="text-xs text-gray-500">@{c.user?.username || c.username}</div>
                      </td>
                      <td className="px-4 py-3 align-top text-gray-900">{c.placeOfOperation || c.user?.placeOfOperation || c.user?.city || c.city || '-'}</td>
                      <td className="px-4 py-3 align-top text-gray-900">{c.followersCount ?? '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex items-center justify-end gap-3">
        <Button variant="outline" onClick={() => window.history.back()}>Hủy</Button>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (v) { setSelectedCreatorId(null); setForm(getInitialForm()) } }}>
          <DialogTrigger asChild>
            <Button>Thêm Creator</Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl w-[95vw] p-0">
            <div className="flex flex-col max-h-[80vh] w-full">
              <DialogHeader>
                <DialogTitle>Thêm Creator mới</DialogTitle>
              </DialogHeader>

              <div className="p-4 sm:p-6 overflow-auto flex-1">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                        <SelectValue placeholder="Chọn" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Chưa chọn</SelectItem>
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
                    <Label>Múi giờ</Label>
                    <Input value={form.timezone} onChange={(e) => setField('timezone', e.target.value)} />
                  </div>
                  <div>
                    <Label>Mã giới thiệu (referral code)</Label>
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
                  <div>
                    <Label>Thành phố</Label>
                    <Select value={form.city} onValueChange={(v) => setField('city', v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn thành phố" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Chưa chọn</SelectItem>
                        {VIETNAM_CITIES.map(c => (
                          <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Nơi hoạt động (placeOfOperation)</Label>
                    <Input value={form.placeOfOperation} onChange={(e) => setField('placeOfOperation', e.target.value)} />
                  </div>

                  <div>
                    <Label>Telegram</Label>
                    <Input value={form.telegram} onChange={(e) => setField('telegram', e.target.value)} placeholder="@username hoặc link" />
                  </div>

                  <div>
                    <Label>Instagram</Label>
                    <Input value={form.instagram} onChange={(e) => setField('instagram', e.target.value)} placeholder="username hoặc link" />
                  </div>

                  <div>
                    <Label>Facebook</Label>
                    <Input value={form.facebook} onChange={(e) => setField('facebook', e.target.value)} placeholder="profile hoặc link" />
                  </div>

                  <div className="sm:col-span-2">
                    <Label>Bio</Label>
                    <Textarea value={form.bio} onChange={(e) => setField('bio', e.target.value)} />
                  </div>

                  <div>
                    <Label>Tags (phân tách bằng dấu phẩy)</Label>
                    <Input value={Array.isArray(form.tags) ? form.tags.join(', ') : form.tags} onChange={(e) => setField('tags', e.target.value)} />
                  </div>

                  <div>
                    <Label>Ngôn ngữ</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {LANGUAGE_OPTIONS.map(opt => (
                        <label key={opt.value} className="flex items-center gap-2 text-sm border rounded px-2 py-1">
                          <input type="checkbox" checked={Array.isArray(form.languages) && form.languages.includes(opt.value)} onChange={() => toggleArrayField('languages', opt.value)} />
                          <span>{opt.label}</span>
                        </label>
                      ))}
                    </div>
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
                    <Label>Loại thân hình</Label>
                    <Select value={form.bodyType} onValueChange={(v) => setField('bodyType', v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn" />
                      </SelectTrigger>
                      <SelectContent>
                        {BODY_TYPES.map(b => (
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
                    <Label>Màu tóc</Label>
                    <Input value={form.hairColor} onChange={(e) => setField('hairColor', e.target.value)} />
                  </div>

                  <div>
                    <Label>Dịch vụ</Label>
                    <Textarea value={form.service} onChange={(e) => setField('service', e.target.value)} />
                  </div>

                  <div>
                    <Label>Đặc điểm nhận dạng</Label>
                    <Input value={form.signature} onChange={(e) => setField('signature', e.target.value)} />
                  </div>

                  <div>
                    <Label>Giờ công / hourly rate</Label>
                    <Input type="number" value={form.hourlyRate} onChange={(e) => setField('hourlyRate', e.target.value)} />
                  </div>

                  <div>
                    <Label>Thời lượng đặt tối thi��u (phút)</Label>
                    <Input type="number" value={form.minBookingDuration} onChange={(e) => setField('minBookingDuration', e.target.value)} />
                  </div>

                  <div>
                    <Label>Số booking cùng lúc tối đa</Label>
                    <Input type="number" value={form.maxConcurrentBookings} onChange={(e) => setField('maxConcurrentBookings', e.target.value)} />
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
                    <Label>Ảnh avatar</Label>
                    <ImageUploader maxFiles={1} compact onUploadComplete={(results) => {
                      const url = results?.[0]?.secure_url
                      if (url) setField('avatar', url)
                    }} hideResults />
                    {form.avatar && <div className="mt-2"><img src={form.avatar} className="w-20 h-20 rounded-full object-cover" /></div>}
                  </div>

                  <div className="sm:col-span-2">
                <Label>Ảnh Bio (nhiều ảnh)</Label>
                <ImageUploader maxFiles={10} compact onUploadComplete={(results) => {
                  const urls = results.map((r:any) => r.secure_url).filter(Boolean)
                  setField('bioUrls', [...form.bioUrls, ...urls])
                }} hideResults />
                {Array.isArray(form.bioUrls) && form.bioUrls.length > 0 && (
                  <div className="mt-2 grid grid-cols-5 sm:grid-cols-8 gap-2">
                    {form.bioUrls.map((url: string, idx: number) => (
                      <img key={idx} src={url} className="w-16 h-16 object-cover rounded" alt={`bio-${idx}`} />
                    ))}
                  </div>
                )}
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
                    <input id="cosmeticSurgery" type="checkbox" checked={form.cosmeticSurgery} onChange={(e) => setField('cosmeticSurgery', e.target.checked)} />
                    <Label htmlFor="cosmeticSurgery">Phẫu thuật thẩm mỹ</Label>
                  </div>
                  <div className="sm:col-span-2">
                    <Label>Lịch khả dụng (JSON)</Label>
                    <Textarea value={typeof form.availabilitySchedule === 'string' ? form.availabilitySchedule : JSON.stringify(form.availabilitySchedule || {}, null, 2)} onChange={(e) => setField('availabilitySchedule', e.target.value)} />
                  </div>
                </div>
              </div>

              <div className="flex-shrink-0 bg-card/90 backdrop-blur border-t px-4 py-3 sm:px-6">
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setOpen(false)}>Hủy</Button>
                  <Button onClick={async () => { await onSubmit(); setOpen(false) }} disabled={submitting}>{submitting ? 'Đang tạo...' : 'Tạo'}</Button>
                </div>
              </div>
            </div>
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

      {/* Edit Creator modal */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-4xl w-[95vw] p-0">
        <div className="flex flex-col max-h-[80vh] w-full">
          <DialogHeader>
            <DialogTitle>Chi tiết Creator - {form.stageName || form.firstName + ' ' + form.lastName}</DialogTitle>
          </DialogHeader>

          <div className="p-4 sm:p-6 overflow-auto flex-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                <Input value={form.email} disabled className="bg-gray-100" />
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
                    <SelectValue placeholder="Chọn" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Chưa chọn</SelectItem>
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
                <Label>Múi giờ</Label>
                <Input value={form.timezone} onChange={(e) => setField('timezone', e.target.value)} />
              </div>
              <div>
                <Label>Mã giới thiệu (referral code)</Label>
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
              <div>
                <Label>Thành phố</Label>
                <Select value={form.city} onValueChange={(v) => setField('city', v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn thành phố" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Chưa chọn</SelectItem>
                    {VIETNAM_CITIES.map(c => (
                      <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Khu vực hoạt động</Label>
                <Input value={form.placeOfOperation} onChange={(e) => setField('placeOfOperation', e.target.value)} />
              </div>

              <div>
                <Label>Telegram</Label>
                <Input value={form.telegram} onChange={(e) => setField('telegram', e.target.value)} placeholder="@username hoặc link" />
              </div>

              <div>
                <Label>Instagram</Label>
                <Input value={form.instagram} onChange={(e) => setField('instagram', e.target.value)} placeholder="username hoặc link" />
              </div>

              <div>
                <Label>Facebook</Label>
                <Input value={form.facebook} onChange={(e) => setField('facebook', e.target.value)} placeholder="profile hoặc link" />
              </div>

              <div className="sm:col-span-2">
                <Label>Bio</Label>
                <Textarea value={form.bio} onChange={(e) => setField('bio', e.target.value)} rows={4} />
              </div>

              <div>
                <Label>Tags (phân tách bằng dấu phẩy)</Label>
                <Input value={Array.isArray(form.tags) ? form.tags.join(', ') : form.tags} onChange={(e) => setField('tags', e.target.value)} />
              </div>

              <div>
                <Label>Ngôn ngữ</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {LANGUAGE_OPTIONS.map(opt => (
                    <label key={opt.value} className="flex items-center gap-2 text-sm border rounded px-2 py-1">
                      <input type="checkbox" checked={Array.isArray(form.languages) && form.languages.includes(opt.value)} onChange={() => toggleArrayField('languages', opt.value)} />
                      <span>{opt.label}</span>
                    </label>
                  ))}
                </div>
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
                <Label>Loại thân hình</Label>
                <Select value={form.bodyType} onValueChange={(v) => setField('bodyType', v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn" />
                  </SelectTrigger>
                  <SelectContent>
                    {BODY_TYPES.map(b => (
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
                <Label>Màu tóc</Label>
                <Input value={form.hairColor} onChange={(e) => setField('hairColor', e.target.value)} />
              </div>

              <div>
                <Label>Dịch vụ</Label>
                <Textarea value={form.service} onChange={(e) => setField('service', e.target.value)} />
              </div>

              <div>
                <Label>Đặc điểm nhận dạng</Label>
                <Input value={form.signature} onChange={(e) => setField('signature', e.target.value)} />
              </div>

              <div>
                <Label>Giờ công / hourly rate</Label>
                <Input type="number" value={form.hourlyRate} onChange={(e) => setField('hourlyRate', e.target.value)} />
              </div>

              <div>
                <Label>Thời lượng đặt tối thiểu (phút)</Label>
                <Input type="number" value={form.minBookingDuration} onChange={(e) => setField('minBookingDuration', e.target.value)} />
              </div>

              <div>
                <Label>Số booking cùng lúc tối đa</Label>
                <Input type="number" value={form.maxConcurrentBookings} onChange={(e) => setField('maxConcurrentBookings', e.target.value)} />
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
                <Label>Ảnh avatar</Label>
                <ImageUploader maxFiles={1} compact onUploadComplete={(results) => {
                  const url = results?.[0]?.secure_url
                  if (url) setField('avatar', url)
                }} hideResults />
                {form.avatar && <div className="mt-2"><img src={form.avatar} className="w-20 h-20 rounded-full object-cover" alt="Avatar" /></div>}
              </div>

              <div className="sm:col-span-2">
                <Label>Ảnh Bio (nhiều ảnh)</Label>
                <ImageUploader maxFiles={10} compact onUploadComplete={(results) => {
                  const urls = results.map((r:any) => r.secure_url).filter(Boolean)
                  setField('bioUrls', [...form.bioUrls, ...urls])
                }} hideResults />
                {Array.isArray(form.bioUrls) && form.bioUrls.length > 0 && (
                  <div className="mt-2 grid grid-cols-5 sm:grid-cols-8 gap-2">
                    {form.bioUrls.map((url: string, idx: number) => (
                      <div key={idx} className="relative">
                        <img src={url} className="w-16 h-16 object-cover rounded" alt={`bio-${idx}`} />
                        <button 
                          onClick={() => setField('bioUrls', form.bioUrls.filter((_: any, i: number) => i !== idx))}
                          className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-4 h-4 text-xs flex items-center justify-center"
                        >×</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                <input id="isVerified-edit" type="checkbox" checked={form.isVerified} onChange={(e) => setField('isVerified', e.target.checked)} />
                <Label htmlFor="isVerified-edit">Đã xác thực</Label>
              </div>
              <div className="flex items-center gap-2">
                <input id="isTatto-edit" type="checkbox" checked={form.isTatto} onChange={(e) => setField('isTatto', e.target.checked)} />
                <Label htmlFor="isTatto-edit">Có xăm</Label>
              </div>
              <div className="flex items-center gap-2">
                <input id="cosmeticSurgery-edit" type="checkbox" checked={form.cosmeticSurgery} onChange={(e) => setField('cosmeticSurgery', e.target.checked)} />
                <Label htmlFor="cosmeticSurgery-edit">Phẫu thuật thẩm mỹ</Label>
              </div>
              <div className="sm:col-span-2">
                <Label>Lịch khả dụng (JSON)</Label>
                <Textarea 
                  value={typeof form.availabilitySchedule === 'string' ? form.availabilitySchedule : JSON.stringify(form.availabilitySchedule || {}, null, 2)} 
                  onChange={(e) => setField('availabilitySchedule', e.target.value)} 
                  rows={6}
                />
              </div>
            </div>
          </div>

          <div className="flex-shrink-0 bg-card/90 backdrop-blur border-t px-4 py-3 sm:px-6">
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditOpen(false)}>Hủy</Button>
              <Button onClick={onEditSubmit} disabled={submitting}>{submitting ? 'Đang lưu...' : 'Lưu thay đổi'}</Button>
            </div>
          </div>
        </div>
      </DialogContent>
      </Dialog>

    </div>
  )
}
