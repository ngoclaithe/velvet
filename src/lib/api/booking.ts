import { api } from './core'
import type { ApiResponse } from '@/types/api'

export type BookingType = 'private_show' | 'private_chat' | 'cam2cam' | 'byshot' | 'byhour'
export type BookingStatus = 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show'

export interface CreateBookingPayload {
  creatorId: number
  type: BookingType
  duration: number // minutes
  scheduledTime?: string // ISO8601
  notes?: string
}

export interface Booking {
  id: number
  creatorId: number
  userId: number
  type: BookingType
  duration: number // minutes
  scheduledTime: string | null
  startTime?: string | null
  endTime?: string | null
  notes: string | null
  status: BookingStatus
  paymentStatus?: 'paid' | 'unpaid' | 'refunded' | string
  pricePerMinute?: string
  totalPrice?: string
  tokenAmount?: number | null
  streamUrl?: string | null
  chatRoomId?: string | number | null
  cancellationReason?: string | null
  cancelledBy?: string | number | null
  isRated?: boolean
  createdAt: string
  updatedAt: string
  creator?: {
    id: number
    stageName?: string
    rating?: string
    avatar?: string | null
  }
  client?: {
    id: number
    username?: string
    firstName?: string
    lastName?: string
    avatar?: string | null
  }
}

export interface GetBookingsOptions {
  status?: BookingStatus
  page?: number
  limit?: number
}

function isISO8601(value: string): boolean {
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return false
  if (!value.includes('T')) return false
  // Accept forms like YYYY-MM-DDTHH:mm or with seconds/timezone
  const isoLike = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?(?:Z|[+\-]\d{2}:\d{2})?$/
  return isoLike.test(value)
}

function assertCreatePayloadValid(payload: CreateBookingPayload): void {
  const { creatorId, type, duration, scheduledTime, notes } = payload

  if (!Number.isInteger(creatorId) || creatorId < 1) {
    throw new Error('Creator ID phải là số nguyên dương')
  }

  const allowedTypes: BookingType[] = ['private_show', 'private_chat', 'cam2cam', 'byshot', 'byhour']
  if (!allowedTypes.includes(type)) {
    throw new Error('Loại booking không hợp lệ')
  }

  if (!Number.isInteger(duration) || duration < 1) {
    throw new Error('Thời gian phải là số nguyên dương (phút)')
  }

  if (scheduledTime !== undefined) {
    if (!isISO8601(scheduledTime)) {
      throw new Error('Thời gian đặt lịch phải có định dạng ISO8601')
    }
    const scheduledDate = new Date(scheduledTime)
    const now = new Date()
    if (scheduledDate <= now) {
      throw new Error('Thời gian đặt lịch phải sau thời điểm hiện tại')
    }
  }

  if (notes !== undefined) {
    if (typeof notes !== 'string' || notes.length > 500) {
      throw new Error('Ghi chú không được vượt quá 500 ký tự')
    }
  }

  // Per-type rules
  if (type === 'byhour' && duration < 60) {
    throw new Error('Booking theo giờ phải có thời gian tối thiểu 60 phút')
  }
  if (['private_show', 'private_chat', 'cam2cam'].includes(type) && duration < 5) {
    throw new Error('Booking dạng này phải có thời gian tối thiểu 5 phút')
  }
  if (type === 'byshot' && duration > 60) {
    throw new Error('Booking byshot không được vượt quá 60 phút')
  }
}

export const createBooking = async (
  payload: CreateBookingPayload
): Promise<ApiResponse<Booking>> => {
  assertCreatePayloadValid(payload)
  return api.post<Booking>('/bookings', payload)
}

export const getUserBookings = async (
  options?: GetBookingsOptions
): Promise<ApiResponse<{ bookings: Booking[]; total?: number; page?: number; totalPages?: number }>> => {
  const params: Record<string, string> = {}
  if (options?.status) params.status = options.status
  if (options?.page) params.page = String(options.page)
  if (options?.limit) params.limit = String(options.limit)
  return api.get<{ bookings: Booking[]; total?: number; page?: number; totalPages?: number }>(
    '/bookings/user',
    Object.keys(params).length ? params : undefined
  )
}

export const getCreatorBookings = async (
  options?: GetBookingsOptions
): Promise<ApiResponse<{ bookings: Booking[]; total?: number; page?: number; totalPages?: number }>> => {
  const params: Record<string, string> = {}
  if (options?.status) params.status = options.status
  if (options?.page) params.page = String(options.page)
  if (options?.limit) params.limit = String(options.limit)
  return api.get<{ bookings: Booking[]; total?: number; page?: number; totalPages?: number }>(
    '/bookings/creator',
    Object.keys(params).length ? params : undefined
  )
}

export const cancelBooking = async (
  bookingId: number,
  cancellationReason?: string
): Promise<ApiResponse<Booking>> => {
  if (cancellationReason !== undefined && cancellationReason.length > 500) {
    throw new Error('Lý do hủy không được vượt quá 500 ký tự')
  }
  return api.put<Booking>(`/bookings/${bookingId}/cancel`, { cancellationReason })
}

export const acceptBooking = async (
  bookingId: number
): Promise<ApiResponse<Booking>> => {
  return api.put<Booking>(`/bookings/${bookingId}/accept`)
}

export const rejectBooking = async (
  bookingId: number,
  cancellationReason: string
): Promise<ApiResponse<Booking>> => {
  if (!cancellationReason || cancellationReason.length < 10 || cancellationReason.length > 500) {
    throw new Error('Lý do từ chối phải từ 10-500 ký tự')
  }
  return api.put<Booking>(`/bookings/${bookingId}/reject`, { cancellationReason })
}

export const completeBooking = async (
  bookingId: number
): Promise<ApiResponse<Booking>> => {
  return api.put<Booking>(`/bookings/${bookingId}/complete`)
}

export const bookingApi = {
  createBooking,
  getUserBookings,
  getCreatorBookings,
  cancelBooking,
  acceptBooking,
  rejectBooking,
  completeBooking,
}
