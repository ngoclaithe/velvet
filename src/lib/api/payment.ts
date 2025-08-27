import type { WalletApiResponse } from '@/types/api'
import type { Transaction } from '@/types/payments'
import { api } from './core'

export const paymentApi = {
  getWallet: () => api.get<WalletApiResponse>('/wallet'),

  deposit: (data: any) => api.post('/wallet/deposit', data),

  withdraw: (data: any) => api.post('/wallet/withdraw', data),

  getTransactions: (params?: Record<string, string>) =>
    api.get<Transaction[]>('/wallet/transactions', params),

  sendTip: (data: any) => api.post('/payments/tip', data),

  sendGift: (data: any) => api.post('/payments/gift', data),

  subscribe: (creatorId: string, planId: string) =>
    api.post('/subscriptions', { creatorId, planId }),

  unsubscribe: (subscriptionId: string) =>
    api.delete(`/subscriptions/${subscriptionId}`),
}