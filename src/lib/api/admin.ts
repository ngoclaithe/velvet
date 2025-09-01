import { api } from './core'

export const adminAPI = {
  getAllUser: () => api.get(`/auth/users`),
  createCreator: (data: any) => api.post(`/admin_creators`, data),

}