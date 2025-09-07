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

  // Edit modal state
  const [selectedCreatorId, setSelectedCreatorId] = useState<number | null>(null)
  const [editOpen, setEditOpen] = useState(false)

  const fetchCreatorAndOpen = async (id: number) => {
    try {
      setLoadingCreators(true)
      const res: any = await creatorAPI.getCreatorById(id)
      const data = res?.data || res
      // map backend fields into form
      setForm((prev: any) => ({
        ...prev,
        ...data,
        firstName: data.user?.firstName || prev.firstName,
        lastName: data.user?.lastName || prev.lastName,
        email: data.user?.email || prev.email,
        phoneNumber: data.user?.phoneNumber || prev.phoneNumber,
        avatar: data.user?.avatar || data.avatar || prev.avatar,
        city: data.user?.city || data.city || prev.city,
        tags: data.tags || prev.tags,
        specialties: data.specialties || prev.specialties,
        bioUrls: data.bioUrls || prev.bioUrls,
        bookingPrice: data.bookingPrice ?? prev.bookingPrice,
        subscriptionPrice: data.subscriptionPrice ?? prev.subscriptionPrice,
        isVerified: Boolean(data.isVerified ?? prev.isVerified),
      }))
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
      // Normalize city: 'all' means not selected
      if (payload.city === 'all') delete payload.city

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
      if (payload.city === 'all') delete payload.city
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
              <table className="min-w-full bg-white">
                <thead>
                  <tr className="text-left bg-gray-50">
                    <th className="px-4 py-2">Avatar</th>
                    <th className="px-4 py-2">Name / Username</th>
                    <th className="px-4 py-2">City</th>
                    <th className="px-4 py-2">Specialties</th>
                    <th className="px-4 py-2">Booking Price</th>
                    <th className="px-4 py-2">Followers</th>
                    <th className="px-4 py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {creators.map((c: any) => (
                    <tr key={c.id} className="border-t hover:bg-gray-50">
                      <td className="px-4 py-3 align-top">
                        <img src={c.avatar || c.user?.avatar} alt={c.stageName || c.user?.username || c.username} className="w-10 h-10 rounded-full object-cover" />
                      </td>
                      <td className="px-4 py-3 align-top">
                        <div className="font-semibold">{c.stageName || `${c.firstName || ''} ${c.lastName || ''}`.trim() || c.user?.username || c.username}</div>
                        <div className="text-xs text-gray-500">@{c.user?.username || c.username}</div>
                      </td>
                      <td className="px-4 py-3 align-top">{c.user?.city || c.city || '-'}</td>
                      <td className="px-4 py-3 align-top">{Array.isArray(c.specialties) ? c.specialties.join(', ') : c.specialties || '-'}</td>
                      <td className="px-4 py-3 align-top">{c.bookingPrice ?? '-'}</td>
                      <td className="px-4 py-3 align-top">{c.followersCount ?? '-'}</td>
                      <td className="px-4 py-3 align-top">
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => fetchCreatorAndOpen(Number(c.id))}>Chi tiết</Button>
                          <Button variant="outline" size="sm" onClick={() => fetchCreatorAndOpen(Number(c.id))}>Sửa</Button>
                        </div>
                      </td>
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
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>Thêm Creator</Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl w-[95vw] p-0">
            <DialogHeader>
              <DialogTitle>Thêm Creator mới</DialogTitle>
            </DialogHeader>

            <div className="p-4 sm:p-6 max-h-[70vh] overflow-y-auto">
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
                  <Input value={form.email} onChange={(e) => setField('email', e.target.value)} />
                </div>
                <div>
                  <Label>Số điện thoại</Label>
                  <Input value={form.phoneNumber} onChange={(e) => setField('phoneNumber', e.target.value)} />
                </div>
                <div>
                  <Label>Nghệ danh</Label>
                  <Input value={form.stageName} onChange={(e) => setField('stageName', e.target.value)} />
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
                <div className="sm:col-span-2">
                  <Label>Bio</Label>
                  <Textarea value={form.bio} onChange={(e) => setField('bio', e.target.value)} />
                </div>
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
                </div>
                <div className="flex items-center gap-2">
                  <input id="isVerified" type="checkbox" checked={form.isVerified} onChange={(e) => setField('isVerified', e.target.checked)} />
                  <Label htmlFor="isVerified">Đã xác thực</Label>
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 bg-background/80 backdrop-blur/10 py-3 px-4 sm:px-6 border-t">
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setOpen(false)}>Hủy</Button>
                <Button onClick={async () => { await onSubmit(); setOpen(false) }} disabled={submitting}>{submitting ? 'Đang tạo...' : 'Tạo'}</Button>
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
          <DialogHeader>
            <DialogTitle>Chi tiết Creator</DialogTitle>
          </DialogHeader>

          <div className="p-4 sm:p-6 max-h-[70vh] overflow-y-auto">
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
                <Input value={form.email} onChange={(e) => setField('email', e.target.value)} />
              </div>
              <div>
                <Label>Số điện thoại</Label>
                <Input value={form.phoneNumber} onChange={(e) => setField('phoneNumber', e.target.value)} />
              </div>
              <div>
                <Label>Nghệ danh</Label>
                <Input value={form.stageName} onChange={(e) => setField('stageName', e.target.value)} />
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
              <div className="sm:col-span-2">
                <Label>Bio</Label>
                <Textarea value={form.bio} onChange={(e) => setField('bio', e.target.value)} />
              </div>
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
              </div>
              <div className="flex items-center gap-2">
                <input id="isVerified" type="checkbox" checked={form.isVerified} onChange={(e) => setField('isVerified', e.target.checked)} />
                <Label htmlFor="isVerified">Đã xác thực</Label>
              </div>
            </div>
          </div>

          <div className="sticky bottom-0 bg-background/80 backdrop-blur/10 py-3 px-4 sm:px-6 border-t">
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditOpen(false)}>Hủy</Button>
              <Button onClick={onEditSubmit} disabled={submitting}>{submitting ? 'Đang lưu...' : 'Lưu'}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  )
}
