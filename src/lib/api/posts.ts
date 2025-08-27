import { api } from './core'

export const postsApi = {
  getFeed: (params?: Record<string, string>) =>
    api.get('/posts/feed', params),

  getUserPosts: (userId: string, params?: Record<string, string>) =>
    api.get(`/users/${userId}/posts`, params),

  getTrendingPosts: (params?: Record<string, string>) =>
    api.get('/posts/trending', params),

  getPostsByTag: (tag: string, params?: Record<string, string>) =>
    api.get(`/posts/tags/${encodeURIComponent(tag)}`, params),

  getPost: (postId: string) =>
    api.get(`/posts/${postId}`),

  createPost: (data: any) =>
    api.post('/posts', data),

  updatePost: (postId: string, data: any) =>
    api.patch(`/posts/${postId}`, data),

  deletePost: (postId: string) =>
    api.delete(`/posts/${postId}`),

  likePost: (postId: string) =>
    api.post(`/posts/${postId}/like`),

  unlikePost: (postId: string) =>
    api.delete(`/posts/${postId}/like`),

  sharePost: (postId: string, data?: any) =>
    api.post(`/posts/${postId}/share`, data),

  bookmarkPost: (postId: string) =>
    api.post(`/posts/${postId}/bookmark`),

  unbookmarkPost: (postId: string) =>
    api.delete(`/posts/${postId}/bookmark`),

  getBookmarkedPosts: (params?: Record<string, string>) =>
    api.get('/posts/bookmarks', params),

  reportPost: (postId: string, data: any) =>
    api.post(`/posts/${postId}/report`, data),

  getComments: (postId: string, params?: Record<string, string>) =>
    api.get(`/posts/${postId}/comments`, params),

  createComment: (postId: string, data: any) =>
    api.post(`/posts/${postId}/comments`, data),

  updateComment: (commentId: string, data: any) =>
    api.patch(`/comments/${commentId}`, data),

  deleteComment: (commentId: string) =>
    api.delete(`/comments/${commentId}`),

  likeComment: (commentId: string) =>
    api.post(`/comments/${commentId}/like`),

  unlikeComment: (commentId: string) =>
    api.delete(`/comments/${commentId}/like`),

  uploadMedia: (file: File) =>
    api.upload('/media/upload', file),

  votePoll: (postId: string, data: { optionIds: string[] }) =>
    api.post(`/posts/${postId}/poll/vote`, data),

  getPostAnalytics: (postId: string) =>
    api.get(`/posts/${postId}/analytics`),

  getPostStats: (userId?: string) =>
    api.get('/posts/stats', userId ? { userId } : undefined),

  searchPosts: (params: Record<string, string>) =>
    api.get('/posts/search', params),
}