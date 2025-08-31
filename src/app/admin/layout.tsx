'use client'

import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { Icons } from '@/components/common/Icons'
import {
  Shield,
  BarChart3,
  Users,
  Video,
  AlertTriangle,
  CreditCard,
  Settings,
  LogOut,
  Heart,
  DollarSign,
  Menu,
  X,
  Gift
} from 'lucide-react'
import { toast } from 'react-hot-toast'

const sidebarItems = [
  {
    title: 'Tổng quan',
    href: '/admin',
    icon: BarChart3,
    description: 'Dashboard tổng quan'
  },
  {
    title: 'Quản lý Users',
    href: '/admin/users',
    icon: Users,
    description: 'Quản lý người dùng'
  },
  {
    title: 'Quản lý Streams',
    href: '/admin/streams',
    icon: Video,
    description: 'Quản lý stream'
  },
  {
    title: 'Báo cáo',
    href: '/admin/reports',
    icon: AlertTriangle,
    description: 'Xử lý báo cáo'
  },
  {
    title: 'Thanh toán',
    href: '/admin/payments',
    icon: CreditCard,
    description: 'Quản lý thanh toán'
  },
  {
    title: 'Quản lý Gifts',
    href: '/admin/gifts',
    icon: Gift,
    description: 'Quản lý quà tặng'
  },
  {
    title: 'Cài đặt',
    href: '/admin/settings',
    icon: Settings,
    description: 'Cài đặt hệ thống'
  }
]

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, isLoading: authLoading, isAuthenticated, logout } = useAuth()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Check admin access
  useEffect(() => {
    if (!authLoading && (!isAuthenticated || user?.role !== 'admin')) {
      toast.error('Bạn không có quyền truy cập trang này')
      router.push('/')
    }
  }, [user, authLoading, isAuthenticated, router])

  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Icons.spinner className="h-8 w-8 animate-spin" />
        <span className="ml-2">Đang tải...</span>
      </div>
    )
  }

  if (!isAuthenticated || user?.role !== 'admin') {
    return null
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:inset-0`}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between h-16 px-6 border-b bg-gradient-to-r from-blue-600 to-purple-600">
            <Link href="/admin" className="flex items-center space-x-2">
              <Shield className="h-8 w-8 text-white" />
              <div className="text-white">
                <div className="font-bold text-lg">Admin Panel</div>
                <div className="text-xs opacity-80">VelvetSocial</div>
              </div>
            </Link>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden text-white hover:bg-white/20"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {sidebarItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors group"
                onClick={() => setSidebarOpen(false)}
              >
                <item.icon className="h-5 w-5" />
                <div className="flex-1">
                  <div className="font-medium text-sm">{item.title}</div>
                  <div className="text-xs text-gray-500 group-hover:text-blue-500">{item.description}</div>
                </div>
              </Link>
            ))}
          </nav>

          {/* User Info */}
          <div className="border-t p-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="w-full justify-start px-3">
                  <Avatar className="h-8 w-8 mr-3">
                    <AvatarImage src={user?.avatar} alt={user?.username} />
                    <AvatarFallback className="bg-gradient-to-r from-purple-600 to-blue-600 text-white text-sm">
                      {user?.username?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 text-left">
                    <div className="font-medium text-sm">{user?.username}</div>
                    <div className="text-xs text-gray-500">Administrator</div>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user?.username}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user?.email}
                    </p>
                    <div className="flex items-center space-x-2 mt-2">
                      <Badge variant="secondary" className="text-xs">
                        <DollarSign className="h-3 w-3 mr-1" />
                        Admin
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        <Shield className="h-3 w-3 mr-1 text-blue-500" />
                        Full Access
                      </Badge>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/" className="cursor-pointer">
                    <Heart className="mr-2 h-4 w-4" />
                    <span>Về trang chính</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/admin/settings" className="cursor-pointer">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Cài đặt Admin</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout} className="cursor-pointer text-red-600">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Đăng xuất</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden lg:ml-0">
        {/* Mobile menu button - only visible on mobile when sidebar is closed */}
        <div className="lg:hidden bg-white border-b p-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>

        {/* Page Content */}
        <main className="flex-1 overflow-auto bg-gray-50">
          {children}
        </main>
      </div>
    </div>
  )
}
