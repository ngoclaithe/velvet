"use client"

import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { ImageGallery } from '@/components/ui/image-gallery'
import { postsApi } from '@/lib/api/posts'
import { reviewApi, type Review } from '@/lib/api/review'
import { userApi } from '@/lib/api/user'
import { Heart, MessageCircle, Share2, Eye, ArrowLeft, ArrowRight } from 'lucide-react'

interface PublicUser {
  id: number
  username: string
  firstName?: string
  lastName?: string
  avatar?: string | null
  isVerified?: boolean
}

interface PostItem {
  id: string
  content: string
  createdAt: Date
  isAdult: boolean
  isPremium: boolean
  media?: { id: string; type: 'image' | 'video'; url: string; thumbnail?: string }[]
}

export default function PublicUserPage() {
  const params = useParams()
  const userId = params.userId as string

  const [user, setUser] = useState<PublicUser | null>(null)
  const [loadingUser, setLoadingUser] = useState(true)

  const [posts, setPosts] = useState<PostItem[]>([])
  const [loadingPosts, setLoadingPosts] = useState(true)

  const [reviews, setReviews] = useState<Review[]>([])
  const [loadingReviews, setLoadingReviews] = useState(true)

  const [lightbox, setLightbox] = useState<{ images: string[]; index: number } | null>(null)

  useEffect(() => {
    let mounted = true
    const loadUser = async () => {
      try {
        setLoadingUser(true)
        const res = await userApi.getProfile(userId)
        if (mounted && res?.success && res?.data) {
          const payload: any = res.data
          const u = payload.user || payload
          setUser({
            id: Number(u.id || userId),
            username: u.username || 'user',
            firstName: u.firstName,
            lastName: u.lastName,
            avatar: u.avatar ?? null,
            isVerified: Boolean(u.isVerified),
          })
        }
      } finally {
        setLoadingUser(false)
      }
    }
    const loadPosts = async () => {
      try {
        setLoadingPosts(true)
        const res = await postsApi.getUserPosts(userId, { page: '1', limit: '20' })
        const data: any = res?.success ? res.data : null
        const raw = Array.isArray(data) ? data : (data?.posts || [])
        const mapped: PostItem[] = raw
          .filter((p: any) => p?.isPublic !== false)
          .map((p: any) => ({
            id: String(p.id),
            content: p.content || '',
            createdAt: new Date(p.createdAt),
            isAdult: !p.isPublic || false,
            isPremium: Boolean(p.isPremium),
            media: Array.isArray(p.mediaUrls)
              ? p.mediaUrls.map((url: string, i: number) => ({ id: `${p.id}-m-${i}`, type: p.mediaType === 'video' ? 'video' : 'image', url, thumbnail: p.thumbnailUrl || undefined }))
              : undefined,
          }))
        setPosts(mapped)
      } finally {
        setLoadingPosts(false)
      }
    }
    const loadReviews = async () => {
      try {
        setLoadingReviews(true)
        const res = await reviewApi.getUserReviews(userId, { page: 1, limit: 10, sortBy: 'createdAt', order: 'desc' })
        const data: any = res?.success ? res.data : null
        const list: Review[] = Array.isArray(data?.reviews) ? data.reviews : (Array.isArray(data) ? data as any : [])
        setReviews(list)
      } catch {
        setReviews([])
      } finally {
        setLoadingReviews(false)
      }
    }

    if (userId) {
      loadUser()
      loadPosts()
      loadReviews()
    }
    return () => { mounted = false }
  }, [userId])

  const displayName = useMemo(() => {
    if (!user) return ''
    const name = `${user.firstName || ''} ${user.lastName || ''}`.trim()
    return name || user.username
  }, [user])

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto p-4">
        <div className="mb-4">
          {loadingUser ? (
            <div className="flex items-center gap-3">
              <Skeleton className="w-16 h-16 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-4 w-24" />
              </div>
            </div>
          ) : user ? (
            <div className="flex items-center gap-3">
              <Avatar className="w-16 h-16">
                <AvatarImage src={user.avatar || undefined} alt={displayName} />
                <AvatarFallback>{displayName.slice(0,1).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-xl font-semibold">{displayName}</h1>
                <p className="text-sm text-muted-foreground">@{user.username}</p>
              </div>
            </div>
          ) : (
            <div className="text-muted-foreground">Không tìm thấy người dùng</div>
          )}
        </div>

        <Tabs defaultValue="posts" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="posts">Bài viết công khai</TabsTrigger>
            <TabsTrigger value="reviews">Đánh giá đã đăng</TabsTrigger>
          </TabsList>

          <TabsContent value="posts" className="space-y-4 mt-4">
            {loadingPosts ? (
              <>
                {Array.from({ length: 3 }).map((_, i) => (
                  <Card key={i}>
                    <CardHeader><Skeleton className="h-4 w-1/2" /></CardHeader>
                    <CardContent>
                      <Skeleton className="h-4 w-full mb-2" />
                      <Skeleton className="h-48 w-full" />
                    </CardContent>
                  </Card>
                ))}
              </>
            ) : posts.length === 0 ? (
              <Card><CardContent className="py-8 text-center text-muted-foreground">Chưa có bài viết công khai</CardContent></Card>
            ) : (
              posts.map(p => (
                <Card key={p.id}>
                  <CardHeader>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>@{user?.username}</span>
                      <span>•</span>
                      <span>{p.createdAt.toLocaleString('vi-VN')}</span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {p.content && <p className="mb-3 whitespace-pre-line">{p.content}</p>}
                    {p.media && p.media.length > 0 && (
                      <div className="relative">
                        <ImageGallery media={p.media.map(m => ({ id: m.id, type: m.type, url: m.url, thumbnail: m.thumbnail }))} />
                        {p.isAdult && (
                          <div className="absolute inset-0 bg-black/40 rounded-lg"></div>
                        )}
                      </div>
                    )}
                    <div className="flex items-center justify-between mt-3 pt-3 border-t">
                      <div className="flex items-center gap-5 text-muted-foreground">
                        <button className="inline-flex items-center text-sm" disabled><Heart className="w-4 h-4 mr-1" />0</button>
                        <button className="inline-flex items-center text-sm" disabled><MessageCircle className="w-4 h-4 mr-1" />0</button>
                        <button className="inline-flex items-center text-sm" disabled><Share2 className="w-4 h-4 mr-1" />Chia sẻ</button>
                      </div>
                      {p.isPremium && <Badge className="text-xs bg-yellow-100 text-yellow-700">Premium</Badge>}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="reviews" className="space-y-4 mt-4">
            {loadingReviews ? (
              <Card><CardContent className="py-8 text-center text-muted-foreground">Đang tải đánh giá...</CardContent></Card>
            ) : reviews.length === 0 ? (
              <Card><CardContent className="py-8 text-center text-muted-foreground">Chưa có đánh giá</CardContent></Card>
            ) : (
              reviews.map(r => (
                <Card key={r.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={r.user?.avatar || undefined} alt={r.user?.username || 'User'} />
                        <AvatarFallback>{(r.user?.username || 'U').slice(0,2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>@{r.user?.username || 'user'}</span>
                          <span>•</span>
                          <span>{new Date(r.createdAt).toLocaleString('vi-VN')}</span>
                        </div>
                        {r.comment && <div className="mt-1 text-sm whitespace-pre-line">{r.comment}</div>}
                        {Array.isArray(r.images) && r.images.length > 0 && (
                          <div className="mt-2 grid grid-cols-3 sm:grid-cols-5 gap-2">
                            {r.images.map((u, idx) => (
                              <button key={`${r.id}-${idx}`} type="button" onClick={() => setLightbox({ images: r.images || [], index: idx })} className="block focus:outline-none">
                                <img src={u} alt={`rv-${idx}`} className="w-full h-16 sm:h-20 object-cover rounded" />
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Simple lightbox overlay using portal-less approach */}
      {lightbox && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center">
          <button className="absolute top-4 right-4 text-white" onClick={() => setLightbox(null)} aria-label="Đóng">
            ✕
          </button>
          <button
            type="button"
            className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white rounded-full p-2"
            onClick={() =>
              setLightbox((prev) =>
                prev ? { images: prev.images, index: (prev.index - 1 + prev.images.length) % prev.images.length } : prev
              )
            }
            aria-label="Ảnh trước"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <img src={lightbox?.images[lightbox?.index ?? 0]} alt="review" className="max-h-[85vh] w-auto object-contain" />
          <button
            type="button"
            className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white rounded-full p-2"
            onClick={() =>
              setLightbox((prev) =>
                prev ? { images: prev.images, index: (prev.index + 1) % prev.images.length } : prev
              )
            }
            aria-label="Ảnh sau"
          >
            <ArrowRight className="w-6 h-6" />
          </button>
        </div>
      )}
    </div>
  )
}
