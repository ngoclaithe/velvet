import { api } from './core'

// Define reaction types
export type ReactionType = 'like' | 'love' | 'haha' | 'wow' | 'sad' | 'angry'

// Define request interfaces
export interface ToggleReactionRequest {
  postId?: string
  commentId?: string
  reactionType: ReactionType
}

export interface ToggleReactionPostRequest {
  postId: string
  reactionType: ReactionType
}

export interface ToggleReactionCommentRequest {
  commentId: string
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
    reactApi.toggleReaction({ postId: data.postId, reactionType: data.reactionType }),

  // Helper cho Comment
  toggleReactionComment: (data: ToggleReactionCommentRequest) =>
    reactApi.toggleReaction({ commentId: data.commentId, reactionType: data.reactionType }),
}
