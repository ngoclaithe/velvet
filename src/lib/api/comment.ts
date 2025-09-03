import { api } from './core'
import type { CreateCommentData, PostComment } from '@/types/posts'

export const commentApi = {
  // Post-level comments
  getPostComments: (postId: string, params?: Record<string, string>) =>
    api.get<PostComment[]>(`/posts/${postId}/comments`, params),

  createComment: (postId: string, data: CreateCommentData) =>
    api.post<PostComment>(`/posts/${postId}/comments`, data),

  // Single comment by id
  getCommentById: (commentId: string) =>
    api.get<PostComment>(`/comments/${commentId}`),

  updateComment: (commentId: string, data: { content: string }) =>
    api.put<PostComment>(`/comments/${commentId}`, data),

  deleteComment: (commentId: string) =>
    api.delete<{}>(`/comments/${commentId}`),

  // Replies
  getRepliesForComment: (commentId: string, params?: Record<string, string>) =>
    api.get<PostComment[]>(`/comments/${commentId}/replies`, params),

  createReply: (commentId: string, data: { content: string }) =>
    api.post<PostComment>(`/comments/${commentId}/replies`, data),
}
