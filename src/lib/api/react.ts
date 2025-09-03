import { api } from './core'

// Define reaction types
export type ReactionType = 'like' | 'love' | 'haha' | 'wow' | 'sad' | 'angry'

// Define request interfaces
export interface ToggleReactionRequest {
  targetType: 'post' | 'comment'
  targetId: string
  reactionType: ReactionType
}

export interface ToggleReactionPostRequest {
  targetId: string
  reactionType: ReactionType
}

export interface ToggleReactionCommentRequest {
  targetId: string
  reactionType: ReactionType
}

// Define response data type
export interface ReactionData {
  id: number
  userId: number
  reactableId: number
  reactableType: 'Post' | 'Comment'
  reactionType: ReactionType
  createdAt: string
  updatedAt: string
}

export const reactApi = {
  // Toggle reaction - giữ nguyên endpoint như hiện có
  toggleReaction: (data: ToggleReactionRequest) => api.post<ReactionData | null>(`/reactions`, data),

  // Helper cho Post
  toggleReactionPost: (data: ToggleReactionPostRequest) =>
    reactApi.toggleReaction({ targetType: 'post', targetId: data.targetId, reactionType: data.reactionType }),

  // Helper cho Comment
  toggleReactionComment: (data: ToggleReactionCommentRequest) =>
    reactApi.toggleReaction({ targetType: 'comment', targetId: data.targetId, reactionType: data.reactionType }),
}
