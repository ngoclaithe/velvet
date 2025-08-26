'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Icons } from '@/components/common/Icons'
import {
  UserCheck,
  Clock,
  CheckCircle,
  Ban,
  Search,
  Filter
} from 'lucide-react'
import { toast } from 'react-hot-toast'

interface User {
  id: string
  username: string
  email: string
  role: 'user' | 'creator' | 'admin'
  status: 'active' | 'suspended' | 'banned'
  createdAt: string
  lastLogin?: string
  isVerified: boolean
}

export default function UsersPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [users, setUsers] = useState<User[]>([])

  // Load users data
  useEffect(() => {
    const loadUsersData = async () => {
      setIsLoading(true)
      try {
        // Mock API call
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        setUsers([
          {
            id: '1',
            username: 'user123',
            email: 'user@example.com',
            role: 'user',
            status: 'active',
            createdAt: '2024-01-15',
            lastLogin: '2024-01-20',
            isVerified: true
          },
          {
            id: '2',
            username: 'creator456',
            email: 'creator@example.com',
            role: 'creator',
            status: 'active',
            createdAt: '2024-01-10',
            lastLogin: '2024-01-19',
            isVerified: false
          },
          {
            id: '3',
            username: 'streamer789',
            email: 'streamer@example.com',
            role: 'creator',
            status: 'suspended',
            createdAt: '2024-01-08',
            lastLogin: '2024-01-18',
            isVerified: true
          },
          {
            id: '4',
            username: 'violator999',
            email: 'bad@example.com',
            role: 'user',
            status: 'banned',
            createdAt: '2024-01-05',
            lastLogin: '2024-01-15',
            isVerified: false
          }
        ])
      } catch (error) {
        console.error('Failed to load users data:', error)
        toast.error('Không thể tải dữ liệu users')
      } finally {
        setIsLoading(false)
      }
    }

    loadUsersData()
  }, [])

  const handleUserAction = async (userId: string, action: 'suspend' | 'ban' | 'verify' | 'activate') => {
    try {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 500))
      
      setUsers(prev => prev.map(u => {
        if (u.id === userId) {
          switch (action) {
            case 'suspend':
              return { ...u, status: 'suspended' }
            case 'ban':
              return { ...u, status: 'banned' }
            case 'verify':
              return { ...u, isVerified: true }
            case 'activate':
              return { ...u, status: 'active' }
            default:
              return u
          }
        }
        return u
      }))

      toast.success(`Đã ${action} user thành công`)
    } catch (error) {
      toast.error('Có lỗi xảy ra')
    }
  }

  const getUserStatusBadge = (status: User['status']) => {
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

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <Icons.spinner className="h-8 w-8 animate-spin" />
          <span className="ml-2">Đang tải dữ liệu users...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý Users</h1>
          <p className="text-gray-600">Quản lý tài khoản người dùng và creator</p>
        </div>
        
        <div className="flex items-center space-x-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Tìm kiếm users..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <Button variant="outline">
            <Filter className="w-4 h-4 mr-2" />
            Lọc
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Tổng Users</p>
                <p className="text-2xl font-bold">{users.length}</p>
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
                <p className="text-2xl font-bold">{users.filter(u => u.role === 'creator').length}</p>
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
                <p className="text-2xl font-bold">{users.filter(u => !u.isVerified && u.role === 'creator').length}</p>
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
                <p className="text-2xl font-bold">{users.filter(u => u.status !== 'active').length}</p>
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
                    {user.username.charAt(0).toUpperCase()}
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
                      Tham gia: {new Date(user.createdAt).toLocaleDateString('vi-VN')}
                      {user.lastLogin && ` • Lần cuối: ${new Date(user.lastLogin).toLocaleDateString('vi-VN')}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {!user.isVerified && user.role === 'creator' && (
                    <Button
                      size="sm"
                      onClick={() => handleUserAction(user.id, 'verify')}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <UserCheck className="w-4 h-4 mr-1" />
                      Xác thực
                    </Button>
                  )}
                  {user.status === 'active' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleUserAction(user.id, 'suspend')}
                    >
                      <Clock className="w-4 h-4 mr-1" />
                      Tạm khóa
                    </Button>
                  )}
                  {user.status === 'suspended' && (
                    <Button
                      size="sm"
                      onClick={() => handleUserAction(user.id, 'activate')}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Kích hoạt
                    </Button>
                  )}
                  {user.status !== 'banned' && (
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleUserAction(user.id, 'ban')}
                    >
                      <Ban className="w-4 h-4 mr-1" />
                      Cấm
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
