import { api } from './core'

export const userApi = {
  getProfile: (userId: string) => api.get(`/user-follows/${userId}/public-info`),
  
  updateProfile: (data: any) => api.patch('/users/me', data),
  
  uploadAvatar: (file: File) => api.upload('/users/me/avatar', file),
  
  followCreator: (userId: string) => api.post(`/user-follows/`, { creatorId: userId }),
  
  unfollowCreator: (userId: string) => api.delete(`/user-follows/${userId}`),
  
  // getFollowers: (userId: string) => api.get(`/users/${userId}/followers`),
  
  getFollowing: (userId: string) => api.get(`/user-follows/${userId}/following`),
}