import type { RequestDepositApiResponse } from '@/types/api'
import type { Transaction } from '@/types/payments'
import { api } from './core'

export const requestDeposit = {
  // GET /request-deposits - Lấy danh sách requests
  getRequestDeposit: () => api.get<RequestDepositApiResponse>('/request-deposits'),

  // POST /request-deposits - Tạo request mới
  createRequestDeposit: (data: any) => api.post('/request-deposits', data),

  // GET /request-deposits/:id - Lấy request theo ID
  getRequestDepositById: (id: string) => api.get(`/request-deposits/${id}`),

  // PUT /request-deposits/:id - Cập nhật status request (admin only)
  updateRequestStatus: (id: string, data: any) => api.put(`/request-deposits/${id}`, data),

  // DELETE /request-deposits/:id - Xóa request (admin only)
  deleteRequest: (id: string) => api.delete(`/request-deposits/${id}`),

}
