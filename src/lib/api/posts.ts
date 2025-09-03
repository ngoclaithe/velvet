import { api } from './core'

// Individual API functions for easier usage
export async function GetFeed(params?: { page?: number; limit?: number }) {
  const queryParams = params ? {
    page: params.page?.toString() || '1',
    limit: params.limit?.toString() || '10'
  } : undefined
  return api.get('/posts/feed/followed', queryParams)
}

export async function GetAllPosts(params?: { page?: number; limit?: number }) {
  const queryParams = params ? {
    page: params.page?.toString() || '1',
    limit: params.limit?.toString() || '10'
  } : undefined
  return api.get('/posts', queryParams)
}

export const postsApi = {
  getFeed: (params?: Record<string, string>) =>
    api.get('/posts/feed/followed', params),

  getAllPosts: (params?: Record<string, string>) =>
    api.get('/posts', params),

  getUserPosts: (userId: string, params?: Record<string, string>) =>
    api.get(`/posts/user/${userId}`, params),

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
