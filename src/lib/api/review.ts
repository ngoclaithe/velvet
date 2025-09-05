import { api } from './core'
import type { ApiResponse } from '@/types/api'

export interface Review {
  id: number
  creatorId: number
  userId: number
  bookingId?: number | null
  rating: number
  comment?: string | null
  images?: string[]
  isAnonymous?: boolean
  isPublic?: boolean
  adminResponse?: string | null
  trustLevel?: string
  createdAt: string
  updatedAt: string
  user?: {
    id: number
    username?: string
    firstName?: string
    lastName?: string
    avatar?: string | null
  }
  creator?: {
    id: number
    stageName?: string
  }
}

export interface CreateReviewPayload {
  creatorId: number
  rating: number
  comment?: string
  images?: string[]
  isAnonymous?: boolean
  isPublic?: boolean
  bookingId?: number
}

export interface UpdateReviewPayload {
  rating?: number
  comment?: string
  images?: string[]
  isAnonymous?: boolean
  isPublic?: boolean
}

export interface ReviewResponsePayload { adminResponse: string }

export interface GetReviewsQuery {
  page?: number
  limit?: number
  rating?: number
  sortBy?: 'createdAt' | 'rating' | 'updatedAt'
  order?: 'asc' | 'desc'
}

function assertCreatePayloadValid(p: CreateReviewPayload) {
  if (!Number.isInteger(p.creatorId) || p.creatorId < 1) {
    throw new Error('Creator ID không hợp lệ')
  }
  if (!Number.isInteger(p.rating) || p.rating < 1 || p.rating > 5) {
    throw new Error('Điểm đánh giá phải từ 1-5')
  }
  if (p.comment !== undefined && (typeof p.comment !== 'string' || p.comment.length > 1000)) {
    throw new Error('Bình luận tối đa 1000 ký tự')
  }
  if (p.images !== undefined) {
    if (!Array.isArray(p.images) || p.images.length > 5) throw new Error('Tối đa 5 ảnh')
    for (const url of p.images) {
      try { new URL(url) } catch { throw new Error('Ảnh phải là URL hợp lệ') }
    }
  }
  if (p.bookingId !== undefined && (!Number.isInteger(p.bookingId) || p.bookingId < 1)) {
    throw new Error('Booking ID không hợp lệ')
  }
}

function assertUpdatePayloadValid(p: UpdateReviewPayload) {
  if (p.rating !== undefined && (!Number.isInteger(p.rating) || p.rating < 1 || p.rating > 5)) {
    throw new Error('Điểm đánh giá phải từ 1-5')
  }
  if (p.comment !== undefined && (typeof p.comment !== 'string' || p.comment.length > 1000)) {
    throw new Error('Bình luận tối đa 1000 ký tự')
  }
  if (p.images !== undefined) {
    if (!Array.isArray(p.images) || p.images.length > 5) throw new Error('Tối đa 5 ảnh')
    for (const url of p.images) {
      try { new URL(url) } catch { throw new Error('Ảnh phải là URL hợp lệ') }
    }
  }
}

export const reviewApi = {
  // Public routes
  getReviews: (
    creatorId: number,
    query?: GetReviewsQuery
  ): Promise<ApiResponse<{ reviews: Review[]; total?: number; page?: number; totalPages?: number }>> => {
    const params: Record<string, string> = {}
    if (query?.page) params.page = String(query.page)
    if (query?.limit) params.limit = String(query.limit)
    if (query?.rating) params.rating = String(query.rating)
    if (query?.sortBy) params.sortBy = query.sortBy
    if (query?.order) params.order = query.order
    return api.get(`/reviews/creator/${creatorId}`, Object.keys(params).length ? params : undefined)
  },

  // New: get all public reviews with pagination
  getAllReviews: (
    page?: number,
    limit?: number
  ): Promise<ApiResponse<{ reviews: Review[]; pagination?: { currentPage?: number; totalPages?: number; totalItems?: number; limit?: number } }>> => {
    const params: Record<string, string> = {}
    if (page != null) params.page = String(page)
    if (limit != null) params.limit = String(limit)
    return api.get('/reviews/all', Object.keys(params).length ? params : undefined)
  },

  getReviewById: (id: number): Promise<ApiResponse<Review>> =>
    api.get(`/reviews/${id}`),

  // Protected routes (require auth)
  postReview: (payload: CreateReviewPayload): Promise<ApiResponse<Review>> => {
    assertCreatePayloadValid(payload)
    return api.post('/reviews', payload)
  },

    // Sửa lại hàm getUserPublicReviews trong reviewApi
    getUserPublicReviews: (userId: number): Promise<ApiResponse<{ reviews: Review[] }>> =>
        api.get(`/reviews/user-public/${userId}`),

  getUserReviews: (
    userId: string,
    query?: GetReviewsQuery
  ): Promise<ApiResponse<{ reviews: Review[]; total?: number; page?: number; totalPages?: number }>> => {
    const params: Record<string, string> = {}
    if (query?.page) params.page = String(query.page)
    if (query?.limit) params.limit = String(query.limit)
    if (query?.rating) params.rating = String(query.rating)
    if (query?.sortBy) params.sortBy = query.sortBy
    if (query?.order) params.order = query.order
    return api.get(`/reviews/user/${userId}`, Object.keys(params).length ? params : undefined)
  },

  updateReview: (id: number, payload: UpdateReviewPayload): Promise<ApiResponse<Review>> => {
    assertUpdatePayloadValid(payload)
    return api.put(`/reviews/${id}`, payload)
  },

  deleteReview: (id: number): Promise<ApiResponse<{ id: number }>> =>
    api.delete(`/reviews/${id}`),

  respondToReview: (id: number, data: ReviewResponsePayload): Promise<ApiResponse<Review>> => {
    if (!data?.adminResponse || data.adminResponse.length < 1 || data.adminResponse.length > 500) {
      throw new Error('Phản hồi phải từ 1-500 ký tự')
    }
    return api.put(`/reviews/${id}/respond`, data)
  },
}
