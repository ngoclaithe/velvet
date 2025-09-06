"use client"

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { searchAPI } from '@/lib/api/search'

interface SearchResultItemBase {
  id: number
  type: 'user' | 'creator' | 'post'
  displayName?: string
  relevanceScore?: number
}

interface UserItem extends SearchResultItemBase {
  type: 'user'
  username?: string
  firstName?: string
  lastName?: string
}

interface CreatorItem extends SearchResultItemBase {
  type: 'creator'
  stageName?: string
  user?: { id: number; username?: string; avatar?: string | null }
}

interface PostItem extends SearchResultItemBase {
  type: 'post'
  title?: string
}

interface SearchResponseData {
  query: string
  totalResults: number
  results: {
    users: UserItem[]
    creators: CreatorItem[]
    posts: PostItem[]
  }
  topResults?: SearchResultItemBase[]
}

export default function SearchPage() {
  const router = useRouter()
  const params = useSearchParams()
  const q = params.get('query') || ''
  const limit = useMemo(() => {
    const l = parseInt(params.get('limit') || '10', 10)
    return Number.isFinite(l) && l > 0 ? l : 10
  }, [params])

  const [query, setQuery] = useState(q)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<SearchResponseData | null>(null)

  useEffect(() => {
    setQuery(q)
  }, [q])

  useEffect(() => {
    let cancelled = false
    async function run() {
      if (!q.trim()) {
        setData(null)
        return
      }
      setLoading(true)
      setError(null)
      const res: any = await searchAPI.search(q.trim(), limit)
      if (cancelled) return
      if (!res?.success) {
        setError(res?.error || res?.message || 'Tìm kiếm thất bại')
        setLoading(false)
        return
      }
      setData(res.data as SearchResponseData)
      setLoading(false)
    }
    run()
    return () => {
      cancelled = true
    }
  }, [q, limit])

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const s = query.trim()
    if (!s) return
    const sp = new URLSearchParams()
    sp.set('query', s)
    sp.set('limit', String(limit))
    router.push(`/search?${sp.toString()}`)
  }

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="space-y-2">
      <h2 className="text-lg font-semibold">{title}</h2>
      <div className="space-y-2">{children}</div>
    </div>
  )

  const itemLink = (item: SearchResultItemBase) => {
    switch (item.type) {
      case 'creator':
        return `/creator/${item.id}`
      case 'user':
        return `/user/${item.id}`
      case 'post':
        return `/post/${item.id}`
      default:
        return '#'
    }
  }

  return (
    <div className="container py-6 space-y-6">
      <form onSubmit={onSubmit} className="max-w-2xl">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm kiếm bài viết, người dùng, nội dung..."
            className="pl-10"
          />
        </div>
      </form>

      {!q && <div className="text-sm text-muted-foreground">Nhập từ khóa và nhấn Enter để tìm kiếm</div>}
      {loading && <div className="text-sm text-muted-foreground">Đang tìm kiếm...</div>}
      {error && <div className="text-sm text-red-600">{error}</div>}

      {data && (
        <div className="space-y-6">
          {data.topResults && data.topResults.length > 0 && (
            <Section title="Kết quả hàng đầu">
              {data.topResults.map((t) => (
                <Link key={`top-${t.type}-${t.id}`} href={itemLink(t)} className="block">
                  <Card className="p-4 flex items-center justify-between">
                    <div className="font-medium">{t.displayName || `#${t.id}`}</div>
                    {typeof t.relevanceScore === 'number' && (
                      <Badge variant="secondary">{t.relevanceScore}</Badge>
                    )}
                  </Card>
                </Link>
              ))}
            </Section>
          )}

          <Section title="Creators">
            {data.results.creators.length === 0 ? (
              <div className="text-sm text-muted-foreground">Không có kết quả</div>
            ) : (
              data.results.creators.map((c) => (
                <Link key={`creator-${c.id}`} href={`/creator/${c.id}`} className="block">
                  <Card className="p-4">
                    <div className="font-medium">{c.stageName || c.displayName || `Creator #${c.id}`}</div>
                    <div className="text-sm text-muted-foreground">
                      @{c.user?.username || c.displayName}
                    </div>
                  </Card>
                </Link>
              ))
            )}
          </Section>

          <Section title="Người dùng">
            {data.results.users.length === 0 ? (
              <div className="text-sm text-muted-foreground">Không có kết quả</div>
            ) : (
              data.results.users.map((u) => (
                <Link key={`user-${u.id}`} href={`/user/${u.id}`} className="block">
                  <Card className="p-4">
                    <div className="font-medium">{u.displayName || `${u.firstName || ''} ${u.lastName || ''}`.trim() || `User #${u.id}`}</div>
                    <div className="text-sm text-muted-foreground">@{(u as any).username}</div>
                  </Card>
                </Link>
              ))
            )}
          </Section>

          <Section title="Bài viết">
            {data.results.posts.length === 0 ? (
              <div className="text-sm text-muted-foreground">Không có kết quả</div>
            ) : (
              data.results.posts.map((p) => (
                <Link key={`post-${p.id}`} href={`/post/${p.id}`} className="block">
                  <Card className="p-4">
                    <div className="font-medium">{p.displayName || (p as any).title || `Post #${p.id}`}</div>
                  </Card>
                </Link>
              ))
            )}
          </Section>
        </div>
      )}
    </div>
  )
}
