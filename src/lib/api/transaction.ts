import { api } from './core'
import type { ApiResponse } from '@/types/api'

export const transactionAPI = {
  // Create a deposit request
  createDeposit: (data: any) => api.post('/transactions/deposit', data),

  // Create a withdrawal request
  createWithdraw: (data: any) => api.post('/transactions/withdraw', data),

  // Get transactions with optional filters (page, limit, status, type, userId, startDate, endDate)
  getTransactions: (params?: Record<string, string>) => api.get('/transactions', params),

  // Get transaction summary
  getSummary: () => api.get('/transactions/summary'),

  // Get transaction by id
  getTransactionById: (id: string) => api.get(`/transactions/${id}`),

  // Update transaction status (admin)
  updateTransactionStatus: (id: string, data: any) => api.patch(`/transactions/${id}/status`, data),

  // Delete transaction (admin)
  deleteTransaction: (id: string) => api.delete(`/transactions/${id}`),

  // Convenience helpers for specific types
  getDeposits: (params?: Record<string, string>) => {
    const p = { ...(params || {}), type: 'deposit' }
    return api.get('/transactions', p)
  },
  getWithdrawals: (params?: Record<string, string>) => {
    const p = { ...(params || {}), type: 'withdraw' }
    return api.get('/transactions', p)
  },
  getBookings: (params?: Record<string, string>) => {
    const p = { ...(params || {}), type: 'booking' }
    return api.get('/transactions', p)
  }
}

export type TransactionApiResponse = ApiResponse<any>
