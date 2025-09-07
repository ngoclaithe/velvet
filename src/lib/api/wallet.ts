import type { WalletApiResponse } from '@/types/api'
import type { Transaction } from '@/types/payments'
import { api } from './core'

export const walletAPI = {
  // GET /wallet - Lấy thông tin wallet của user hiện tại
  getWallet: () => api.get<WalletApiResponse>('/wallet'),

  // GET /wallet/history - Lấy lịch sử giao dịch wallet
  getWalletHistory: (params?: Record<string, string>) =>
    api.get<Transaction[]>('/wallet/history', params),

  // GET /wallet/transactions - Lấy danh sách giao dịch wallet (alias for getWalletHistory)
  getTransactions: (params?: Record<string, string>) =>
    api.get<{ success: boolean; data: Transaction[] }>('/wallet/transactions', params),

  // POST /wallet/withdraw - Yêu cầu rút tiền từ wallet
  withdraw: (data: any) => api.post('/wallet/withdraw', data),

  // POST /wallet/deposit - Nạp tiền vào wallet (deprecated - use requestDeposit instead)
  deposit: (data: any) => api.post('/wallet/deposit', data),
}
