import type { WalletApiResponse } from '@/types/api'
import type { Transaction } from '@/types/payments'
import { api } from './core'

export const walletAPI = {
  // GET /wallet - Lấy thông tin wallet của user hiện tại
  getWallet: () => api.get<WalletApiResponse>('/wallet'),

  // GET /wallet/history - Lấy lịch sử giao dịch wallet
  getWalletHistory: (params?: Record<string, string>) => 
    api.get<Transaction[]>('/wallet/history', params),

  // POST /wallet/transfer - Chuyển tiền cho user khác
  transferFunds: (data: any) => api.post('/wallet/transfer', data),

  // POST /wallet/withdraw - Yêu cầu rút tiền từ wallet
  withdraw: (data: any) => api.post('/wallet/withdraw', data),

  // deposit: (data: any) => api.post('/wallet/deposit', data),
}