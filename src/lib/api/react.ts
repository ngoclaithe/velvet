import { api } from './core'

// Define reaction types
export type ReactionType = 'like' | 'love' | 'haha' | 'wow' | 'sad' | 'angry'

// Define request interface
interface ToggleReactionRequest {
  reactionType: ReactionType
}

// Define response data type
interface ReactionData {
  id: number
  userId: number
  reactableId: number
  reactableType: 'Post' | 'Comment'
  reactionType: ReactionType
  createdAt: string
  updatedAt: string
}

export const reactApi = {
  // Toggle reaction - URL path giữ nguyên như bạn đã có
  toggleReaction: (data: ToggleReactionRequest) => 
    api.post<ReactionData | null>(`/reactions`, data),
}

// Export types for use in components
export type { ReactionData, ToggleReactionRequest }