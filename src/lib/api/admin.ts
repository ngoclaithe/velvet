import { api } from './core'

export const adminAPI = {
  getAllUser: (params?: { page?: number | string; limit?: number | string; role?: string; search?: string }) =>
    api.get(`/auth/users`, params ? {
      page: String(params.page ?? ''),
      limit: String(params.limit ?? ''),
      role: params.role ?? '',
      search: params.search ?? ''
    } : undefined),
  createCreator: (data: any) => api.post(`/auth/admin_creator`, data),

}
