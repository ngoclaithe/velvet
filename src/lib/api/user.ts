import { api } from './core'

export const userApi = {
  getProfile: (userId: string) => api.get(`/users/${userId}`),
  
  updateProfile: (data: any) => api.patch('/users/me', data),
  
  uploadAvatar: (file: File) => api.upload('/users/me/avatar', file),
  
  follow: (userId: string) => api.post(`/users/${userId}/follow`),
  
  unfollow: (userId: string) => api.delete(`/users/${userId}/follow`),
  
  getFollowers: (userId: string) => api.get(`/users/${userId}/followers`),
  
  getFollowing: (userId: string) => api.get(`/users/${userId}/following`),
}