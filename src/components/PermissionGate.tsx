'use client'

import { ReactNode } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/useAuth'
import { MessageCircle, Edit3, Lock, LogIn } from 'lucide-react'
import Link from 'next/link'

interface PermissionGateProps {
  children: ReactNode
  action: 'post' | 'comment' | 'view'
  fallback?: ReactNode
  showLoginPrompt?: boolean
}

export default function PermissionGate({ 
  children, 
  action, 
  fallback,
  showLoginPrompt = true 
}: PermissionGateProps) {
  const { canPost, canComment, canViewContent, isGuest } = useAuth()

  const hasPermission = () => {
    switch (action) {
      case 'post':
        return canPost()
      case 'comment':
        return canComment()
      case 'view':
        return canViewContent()
      default:
        return false
    }
  }

  const getActionText = () => {
    switch (action) {
      case 'post':
        return 'đăng bài'
      case 'comment':
        return 'bình luận'
      case 'view':
        return 'xem nội dung'
      default:
        return 'thực hiện hành động này'
    }
  }

  const getIcon = () => {
    switch (action) {
      case 'post':
        return Edit3
      case 'comment':
        return MessageCircle
      default:
        return Lock
    }
  }

  if (hasPermission()) {
    return <>{children}</>
  }

  if (fallback) {
    return <>{fallback}</>
  }

  if (!showLoginPrompt) {
    return null
  }

  const Icon = getIcon()

  return (
    <Card className="border-yellow-200 bg-yellow-50">
      <CardContent className="p-4 text-center">
        <Icon className="w-8 h-8 text-yellow-600 mx-auto mb-3" />
        <h3 className="font-semibold text-yellow-800 mb-2">
          Cần đăng nhập để {getActionText()}
        </h3>
        <p className="text-sm text-yellow-700 mb-4">
          {isGuest 
            ? `Bạn đang duyệt với tư cách khách. Đăng nhập hoặc tạo tài khoản để ${getActionText()}.`
            : `Bạn cần có tài khoản để ${getActionText()}.`
          }
        </p>
        <div className="flex gap-2 justify-center">
          <Link href="/login">
            <Button size="sm" className="bg-yellow-600 hover:bg-yellow-700">
              <LogIn className="w-4 h-4 mr-2" />
              Đăng nhập
            </Button>
          </Link>
          <Link href="/register">
            <Button size="sm" variant="outline" className="border-yellow-300 text-yellow-700 hover:bg-yellow-100">
              Đăng ký
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
