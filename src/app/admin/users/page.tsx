"use client"

import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Icons } from '@/components/common/Icons'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { adminAPI } from '@/lib/api/admin'
import { toast } from 'react-hot-toast'
import { UserCheck, Clock, CheckCircle, Ban, Search } from 'lucide-react'

interface UserItem {
  id: string
  username: string
  email: string
  role: 'user' | 'creator' | 'admin'
  status?: 'active' | 'suspended' | 'banned'
  createdAt?: string
  lastLogin?: string
  isVerified?: boolean
}

export default function UsersPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [users, setUsers] = useState<UserItem[]>([])
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(20)
  const [total, setTotal] = useState(0)
  const [role, setRole] = useState<string>('')
  const [search, setSearch] = useState('')

  const totalPages = useMemo(() => (limit > 0 ? Math.max(1, Math.ceil(total / limit)) : 1), [total, limit])

  const fetchUsers = async () => {
    setIsLoading(true)
    try {
      const res: any = await adminAPI.getAllUser({ page, limit, role: role || undefined, search: search || undefined })
      if (res?.success === false) throw new Error(res?.error || res?.message || 'Load users failed')

      const data = res?.data ?? res
      const list: any[] = Array.isArray(data) ? data : (data?.users || data?.items || data?.results || [])
      const meta = Array.isArray(data)
        ? { total: res?.total || list.length, page: page, limit: limit, totalPages: res?.totalPages || undefined }
        : {
            total: data?.total ?? data?.count ?? data?.pagination?.total ?? list.length,
            page: data?.page ?? data?.pagination?.page ?? page,
            limit: data?.limit ?? data?.pagination?.limit ?? limit,
            totalPages: data?.totalPages ?? data?.pagination?.totalPages,
          }

      setUsers(
        list.map((u: any) => ({
          id: String(u.id ?? u._id ?? u.userId ?? ''),
          username: String(u.username ?? u.name ?? u.email?.split('@')?.[0] ?? 'unknown'),
          email: String(u.email ?? ''),
          role: (u.role ?? 'user') as any,
          status: (u.status ?? 'active') as any,
          createdAt: u.createdAt ?? u.created_at,
          lastLogin: u.lastLogin ?? u.last_login,
          isVerified: Boolean(u.isVerified ?? u.verified ?? false),
        }))
      )
      setTotal(Number(meta.total || 0))
      setPage(Number(meta.page || 1))
      setLimit(Number(meta.limit || limit))
    } catch (e: any) {
      console.error(e)
      toast.error('Không thể tải dữ liệu users')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit, role])

  const handleSearch = () => {
    setPage(1)
    fetchUsers()
  }

  const handleUserAction = async (userId: string, action: 'suspend' | 'ban' | 'verify' | 'activate') => {
    try {
      await new Promise((r) => setTimeout(r, 300))
      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId
            ? {
                ...u,
                status:
                  action === 'suspend' ? 'suspended' : action === 'ban' ? 'banned' : action === 'activate' ? 'active' : u.status,
                isVerified: action === 'verify' ? true : u.isVerified,
              }
            : u
        )
      )
      toast.success('Thao tác thành công')
    } catch {
      toast.error('Có lỗi xảy ra')
    }
  }

  const getUserStatusBadge = (status?: UserItem['status']) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500">Hoạt động</Badge>
      case 'suspended':
        return <Badge className="bg-yellow-500">Tạm khóa</Badge>
      case 'banned':
        return <Badge className="bg-red-500">Cấm</Badge>
      default:
        return <Badge variant="secondary">Không xác định</Badge>
    }
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý Users</h1>
          <p className="text-gray-600">Quản lý tài khoản người dùng và creator</p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="w-full sm:w-64 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm kiếm users..."
              className="pl-10"
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>
          <Select value={role} onValueChange={(v) => setRole(v === 'all' ? '' : v)}>
            <SelectTrigger className="w-[140px]"><SelectValue placeholder="Tất cả" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả</SelectItem>
              <SelectItem value="user">User</SelectItem>
              <SelectItem value="creator">Creator</SelectItem>
            </SelectContent>
          </Select>
          <Select value={String(limit)} onValueChange={(v) => setLimit(Number(v))}>
            <SelectTrigger className="w-[110px]"><SelectValue placeholder="20 / trang" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10 / trang</SelectItem>
              <SelectItem value="20">20 / trang</SelectItem>
              <SelectItem value="50">50 / trang</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleSearch}>Tìm</Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Icons.spinner className="h-8 w-8 animate-spin" />
          <span className="ml-2">Đang tải dữ liệu users...</span>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Tổng Users</p>
                    <p className="text-2xl font-bold">{total}</p>
                  </div>
                  <Badge className="bg-blue-100 text-blue-700">Active</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Creators</p>
                    <p className="text-2xl font-bold">{users.filter((u) => u.role === 'creator').length}</p>
                  </div>
                  <Badge className="bg-purple-100 text-purple-700">Creator</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Chờ xác thực</p>
                    <p className="text-2xl font-bold">{users.filter((u) => !u.isVerified && u.role === 'creator').length}</p>
                  </div>
                  <Badge className="bg-orange-100 text-orange-700">Pending</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Bị khóa/cấm</p>
                    <p className="text-2xl font-bold">{users.filter((u) => u.status !== 'active').length}</p>
                  </div>
                  <Badge className="bg-red-100 text-red-700">Restricted</Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Danh sách Users</CardTitle>
              <CardDescription>Quản lý tài khoản người dùng và creator trong hệ thống</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {users.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white font-medium">
                        {user.username?.charAt(0)?.toUpperCase?.()}
                      </div>
                      <div>
                        <p className="font-medium">{user.username}</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge variant="outline">{user.role}</Badge>
                          {getUserStatusBadge(user.status)}
                          {user.isVerified && <Badge className="bg-blue-500">Xác thực</Badge>}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {user.createdAt && `Tham gia: ${new Date(user.createdAt).toLocaleDateString('vi-VN')}`}
                          {user.lastLogin && ` • Lần cuối: ${new Date(user.lastLogin).toLocaleDateString('vi-VN')}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {!user.isVerified && user.role === 'creator' && (
                        <Button size="sm" onClick={() => handleUserAction(user.id, 'verify')} className="bg-blue-600 hover:bg-blue-700">
                          <UserCheck className="w-4 h-4 mr-1" />Xác thực
                        </Button>
                      )}
                      {user.status === 'active' && (
                        <Button size="sm" variant="outline" onClick={() => handleUserAction(user.id, 'suspend')}>
                          <Clock className="w-4 h-4 mr-1" />Tạm khóa
                        </Button>
                      )}
                      {user.status === 'suspended' && (
                        <Button size="sm" onClick={() => handleUserAction(user.id, 'activate')} className="bg-green-600 hover:bg-green-700">
                          <CheckCircle className="w-4 h-4 mr-1" />Kích hoạt
                        </Button>
                      )}
                      {user.status !== 'banned' && (
                        <Button size="sm" variant="destructive" onClick={() => handleUserAction(user.id, 'ban')}>
                          <Ban className="w-4 h-4 mr-1" />Cấm
                        </Button>
                      )}
                    </div>
                  </div>
                ))}

                <div className="flex items-center justify-between pt-4">
                  <div className="text-sm text-gray-600">Trang {page} / {totalPages}</div>
                  <div className="flex gap-2">
                    <Button variant="outline" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                      Trước
                    </Button>
                    <Button variant="outline" disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>
                      Sau
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
