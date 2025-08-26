'use client'

import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
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
import {
  Search,
  Bell,
  LogIn,
  UserPlus,
  User,
  Settings,
  LogOut,
  Zap,
  DollarSign,
  Heart,
  MessageCircle,
  Shield
} from 'lucide-react'

export default function Header() {
  const { user, isAuthenticated, isGuest, logout } = useAuth()

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-2">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-r from-pink-600 to-purple-600 flex items-center justify-center">
            <Heart className="h-5 w-5 text-white" />
          </div>
          <span className="font-bold text-xl bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
            VelvetSocial
          </span>
          <Badge className="text-xs bg-red-100 text-red-700 ml-2">18+</Badge>
        </Link>

        {/* Search */}
        <div className="flex-1 max-w-md mx-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <input
              type="text"
              placeholder="Tìm kiếm bài viết, người dùng, nội dung..."
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
            />
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex items-center space-x-4">
          {isAuthenticated ? (
            <>
              {/* Quick Actions */}
              <Link href="/streams">
                <Button variant="ghost" size="sm">
                  <Zap className="h-4 w-4 mr-2" />
                  Live Streams
                </Button>
              </Link>

              {user?.role === 'creator' && (
                <Link href="/stream">
                  <Button variant="ghost" size="sm" className="text-red-600">
                    <Zap className="h-4 w-4 mr-2" />
                    Go Live
                  </Button>
                </Link>
              )}

              <Link href="/create-post">
                <Button variant="ghost" size="sm" className="text-pink-600">
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Tạo bài viết
                </Button>
              </Link>
              
              {/* Notifications */}
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs">
                  3
                </Badge>
              </Button>

              {/* User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={user?.avatar} alt={user?.username} />
                      <AvatarFallback className="bg-gradient-to-r from-purple-600 to-blue-600 text-white">
                        {user?.username?.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-64" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user?.username}</p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user?.email}
                      </p>
                      <div className="flex items-center space-x-2 mt-2">
                        <Badge variant="secondary" className="text-xs">
                          <DollarSign className="h-3 w-3 mr-1" />
                          $0
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          <Heart className="h-3 w-3 mr-1 text-red-500" />
                          0
                        </Badge>
                      </div>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="cursor-pointer">
                      <User className="mr-2 h-4 w-4" />
                      <span>Hồ sơ</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/wallet" className="cursor-pointer">
                      <DollarSign className="mr-2 h-4 w-4" />
                      <span>Ví của tôi</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/streams" className="cursor-pointer">
                      <Zap className="mr-2 h-4 w-4" />
                      <span>Live Streams</span>
                    </Link>
                  </DropdownMenuItem>
                  {user?.role === 'creator' ? (
                    <DropdownMenuItem asChild>
                      <Link href="/stream" className="cursor-pointer">
                        <Zap className="mr-2 h-4 w-4 text-red-500" />
                        <span>Stream Dashboard</span>
                      </Link>
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem asChild>
                      <Link href="/become-creator" className="cursor-pointer">
                        <UserPlus className="mr-2 h-4 w-4 text-purple-500" />
                        <span>Become Creator</span>
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem asChild>
                    <Link href="/messages" className="cursor-pointer">
                      <MessageCircle className="mr-2 h-4 w-4" />
                      <span>Tin nhắn</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout} className="cursor-pointer text-red-600">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Đăng xuất</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              {isGuest && (
                <div className="hidden sm:flex items-center space-x-2 text-sm text-muted-foreground">
                  <span>Đang xem dưới dạng khách</span>
                </div>
              )}
              <Link href="/login">
                <Button variant="ghost" size="sm">
                  <LogIn className="w-4 h-4 mr-2" />
                  Đăng nhập
                </Button>
              </Link>
              <Link href="/register">
                <Button size="sm" className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
                  <UserPlus className="w-4 h-4 mr-2" />
                  Đăng ký
                </Button>
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  )
}
