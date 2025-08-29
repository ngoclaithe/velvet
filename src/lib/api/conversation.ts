import { api } from './core'
import type { ApiResponse } from '@/types/api'

export interface Conversation {
  id: string
  participants: string[]
  type: 'private' | 'group'
  lastMessage?: {
    id: string
    content: string
    senderId: string
    timestamp: Date
    type: 'text' | 'image' | 'file'
  }
  createdAt: Date
  updatedAt: Date
  isBlocked: boolean
  isMuted: boolean
  blockedBy?: string
  mutedUntil?: Date
}

export interface CreateConversationRequest {
  receiverId: number 
  initialMessage?: string
}

export interface GetConversationsParams {
  page?: string
  limit?: string
  search?: string
  [key: string]: string | undefined 
}

export interface BlockConversationRequest {
  isBlocked: boolean 
}

export interface MuteConversationRequest {
  isMuted: boolean
}

/**
 * Lấy danh sách conversations
 * GET /api/conversations
 */
export const getConversations = async (
  params?: GetConversationsParams
): Promise<ApiResponse<{ conversations: Conversation[]; total: number; page: number; totalPages: number }>> => {
  return api.get<{ conversations: Conversation[]; total: number; page: number; totalPages: number }>(
    '/conversations',
    params as Record<string, string> | undefined
  )
}

/**
 * Tạo conversation mới
 * POST /api/conversations
 */
export const createConversation = async (
  data: CreateConversationRequest
): Promise<ApiResponse<Conversation>> => {
  return api.post<Conversation>('/conversations', data)
}

/**
 * Lấy chi tiết conversation theo ID
 * GET /api/conversations/:id
 */
export const getConversationById = async (
  id: string
): Promise<ApiResponse<Conversation>> => {
  return api.get<Conversation>(`/conversations/${id}`)
}

/**
 * Block/unblock conversation
 * PUT /api/conversations/:id/block
 */
export const blockConversation = async (
  id: string,
  data: BlockConversationRequest
): Promise<ApiResponse<{ success: boolean; message: string }>> => {
  return api.put<{ success: boolean; message: string }>(
    `/conversations/${id}/block`,
    data
  )
}

/**
 * Mute/unmute conversation
 * PUT /api/conversations/:id/mute
 */
export const muteConversation = async (
  id: string,
  data: MuteConversationRequest
): Promise<ApiResponse<{ success: boolean; message: string }>> => {
  return api.put<{ success: boolean; message: string }>(
    `/conversations/${id}/mute`,
    data
  )
}

/**
 * Xóa conversation
 * DELETE /api/conversations/:id
 */
export const deleteConversation = async (
  id: string
): Promise<ApiResponse<{ success: boolean; message: string }>> => {
  return api.delete<{ success: boolean; message: string }>(`/conversations/${id}`)
}

// Helper functions để sử dụng dễ dàng hơn

/**
 * Block một conversation
 */
export const blockConversationHelper = (id: string) => {
  return blockConversation(id, { isBlocked: true })
}

/**
 * Unblock một conversation
 */
export const unblockConversationHelper = (id: string) => {
  return blockConversation(id, { isBlocked: false })
}

/**
 * Mute một conversation
 */
export const muteConversationHelper = (id: string) => {
  return muteConversation(id, { isMuted: true })
}

/**
 * Unmute một conversation
 */
export const unmuteConversationHelper = (id: string) => {
  return muteConversation(id, { isMuted: false })
}