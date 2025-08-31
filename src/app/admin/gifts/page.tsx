"use client"

import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { giftApi, type CreateGiftData, type UpdateGiftData } from '@/lib/api/gift'
import { Icons } from '@/components/common/Icons'
import { toast } from 'react-hot-toast'

interface GiftItem {
  id: string | number
  name: string
  description?: string
  imageUrl?: string
  animationUrl?: string
  price: number
  category?: string
  rarity?: 'common' | 'rare' | 'epic' | 'legendary'
  isActive?: boolean
}

export default function AdminGiftsPage() {
  const [gifts, setGifts] = useState<GiftItem[]>([])
  const [loading, setLoading] = useState(false)
  const [openCreate, setOpenCreate] = useState(false)
  const [editingGift, setEditingGift] = useState<GiftItem | null>(null)

  const [form, setForm] = useState<CreateGiftData>({
    name: '',
    description: '',
    imageUrl: '',
    animationUrl: '',
    price: 0,
    category: '',
    rarity: 'common',
  })

  const [editForm, setEditForm] = useState<UpdateGiftData>({})

  const loadGifts = async () => {
    setLoading(true)
    try {
      const resp: any = await giftApi.getAllGifts()
      console.log("Giá trị resp là:", resp)
      if (resp?.success && Array.isArray(resp.data)) {
        setGifts(resp.data)
      } else {
        setGifts([])
      }
    } catch (e) {
      toast.error('Tải danh sách gifts thất bại')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadGifts()
  }, [])

  const handleCreate = async () => {
    if (!form.name || form.price <= 0) {
      toast.error('Tên và giá phải hợp lệ')
      return
    }
    try {
      const resp: any = await giftApi.createGift(form)
      if (resp?.success) {
        toast.success('Tạo gift thành công')
        setOpenCreate(false)
        setForm({ name: '', description: '', imageUrl: '', animationUrl: '', price: 0, category: '', rarity: 'common' })
        loadGifts()
      } else {
        toast.error(resp?.error || 'Không thể tạo gift')
      }
    } catch (e) {
      toast.error('Không thể tạo gift')
    }
  }

  const startEdit = (gift: GiftItem) => {
    setEditingGift(gift)
    setEditForm({
      name: gift.name,
      description: gift.description,
      imageUrl: gift.imageUrl,
      animationUrl: gift.animationUrl,
      price: gift.price,
      category: gift.category,
      rarity: gift.rarity,
      isActive: gift.isActive,
    })
  }

  const handleUpdate = async () => {
    if (!editingGift) return
    try {
      const resp: any = await giftApi.updateGift(editingGift.id, editForm)
      if (resp?.success) {
        toast.success('Cập nhật gift thành công')
        setEditingGift(null)
        loadGifts()
      } else {
        toast.error(resp?.error || 'Không thể cập nhật gift')
      }
    } catch (e) {
      toast.error('Không thể cập nhật gift')
    }
  }

  const handleDelete = async (id: string | number) => {
    if (!confirm('Xóa gift này?')) return
    try {
      const resp: any = await giftApi.deleteGift(id)
      if (resp?.success) {
        toast.success('Đã xóa')
        loadGifts()
      } else {
        toast.error(resp?.error || 'Không thể xóa')
      }
    } catch (e) {
      toast.error('Không thể xóa')
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Quản lý Gifts</h1>
        <Dialog open={openCreate} onOpenChange={setOpenCreate}>
          <DialogTrigger asChild>
            <Button onClick={() => setOpenCreate(true)}>Tạo gift</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Tạo gift mới</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <Input placeholder="Tên" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
              <Input placeholder="Mô tả" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
              <Input placeholder="Ảnh (imageUrl)" value={form.imageUrl} onChange={e => setForm({ ...form, imageUrl: e.target.value })} />
              <Input placeholder="Animation URL" value={form.animationUrl} onChange={e => setForm({ ...form, animationUrl: e.target.value })} />
              <Input placeholder="Giá" type="number" value={form.price} onChange={e => setForm({ ...form, price: Number(e.target.value) })} />
              <Input placeholder="Danh mục" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} />
              <div className="flex items-center space-x-2">
                <label className="text-sm">Độ hiếm</label>
                <select className="bg-gray-100 rounded px-2 py-1" value={form.rarity} onChange={e => setForm({ ...form, rarity: e.target.value as any })}>
                  <option value="common">Common</option>
                  <option value="rare">Rare</option>
                  <option value="epic">Epic</option>
                  <option value="legendary">Legendary</option>
                </select>
              </div>
              <div className="pt-2">
                <Button onClick={handleCreate}>Tạo</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Danh sách Gifts</CardTitle>
          {loading && (
            <div className="flex items-center text-sm text-gray-500">
              <Icons.spinner className="h-4 w-4 animate-spin mr-2" /> Đang tải
            </div>
          )}
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {gifts.map((g) => (
              <div key={String(g.id)} className="p-4 rounded-lg border bg-white">
                <div className="flex items-start justify-between">
                  <div className="text-black font-medium">{g.name}</div>
                  <Badge variant={g.isActive ? 'default' : 'secondary'}>{g.isActive ? 'Active' : 'Inactive'}</Badge>
                </div>
                {g.imageUrl && (
                  <div className="mt-2 flex items-center justify-center">
                    {g.imageUrl.startsWith('http') ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={g.imageUrl} alt={g.name} className="w-full h-28 object-contain rounded" />
                    ) : (
                      <span className="text-5xl">{g.imageUrl}</span>
                    )}
                  </div>
                )}
                <div className="text-sm text-gray-600 mt-2">Giá: {g.price}</div>
                {g.category && <div className="text-xs text-gray-500">Danh mục: {g.category}</div>}
                {g.rarity && <div className="text-xs text-gray-500">Độ hiếm: {g.rarity}</div>}
                {g.description && <div className="text-xs text-gray-500 mt-1">{g.description}</div>}
                <div className="mt-3 flex items-center space-x-2">
                  <Button size="sm" variant="outline" onClick={() => startEdit(g)}>Sửa</Button>
                  <Button size="sm" variant="destructive" onClick={() => handleDelete(g.id)}>Xóa</Button>
                </div>
              </div>
            ))}
          </div>

          {gifts.length === 0 && !loading && (
            <div className="text-sm text-gray-500">Chưa có gift nào</div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!editingGift} onOpenChange={(o) => !o && setEditingGift(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Chỉnh sửa gift</DialogTitle>
          </DialogHeader>
          {editingGift && (
            <div className="space-y-3">
              <Input placeholder="Tên" value={editForm.name || ''} onChange={e => setEditForm({ ...editForm, name: e.target.value })} />
              <Input placeholder="Mô tả" value={editForm.description || ''} onChange={e => setEditForm({ ...editForm, description: e.target.value })} />
              <Input placeholder="Ảnh (imageUrl)" value={editForm.imageUrl || ''} onChange={e => setEditForm({ ...editForm, imageUrl: e.target.value })} />
              <Input placeholder="Animation URL" value={editForm.animationUrl || ''} onChange={e => setEditForm({ ...editForm, animationUrl: e.target.value })} />
              <Input placeholder="Giá" type="number" value={editForm.price ?? 0} onChange={e => setEditForm({ ...editForm, price: Number(e.target.value) })} />
              <Input placeholder="Danh mục" value={editForm.category || ''} onChange={e => setEditForm({ ...editForm, category: e.target.value })} />
              <div className="flex items-center space-x-2">
                <label className="text-sm">Độ hiếm</label>
                <select className="bg-gray-100 rounded px-2 py-1" value={editForm.rarity || 'common'} onChange={e => setEditForm({ ...editForm, rarity: e.target.value as any })}>
                  <option value="common">Common</option>
                  <option value="rare">Rare</option>
                  <option value="epic">Epic</option>
                  <option value="legendary">Legendary</option>
                </select>
              </div>
              <div className="flex items-center space-x-2">
                <label className="text-sm">Trạng thái</label>
                <select className="bg-gray-100 rounded px-2 py-1" value={String(editForm.isActive ?? true)} onChange={e => setEditForm({ ...editForm, isActive: e.target.value === 'true' })}>
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
              </div>
              <div className="pt-2">
                <Button onClick={handleUpdate}>Lưu</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
