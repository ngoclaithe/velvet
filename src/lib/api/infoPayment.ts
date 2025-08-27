import { api } from './core'

export interface InfoPayment {
  id: number
  bankNumber: string
  accountName: string
  bankName: string
  email?: string
  phone?: string
  metadata: Record<string, any> | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateInfoPaymentData {
  bankNumber: string
  accountName: string
  bankName: string
  email?: string
  phone?: string
  metadata?: Record<string, any> | null
  isActive?: boolean
}

export interface UpdateInfoPaymentData {
  bankNumber?: string
  accountName?: string
  bankName?: string
  email?: string
  phone?: string
  metadata?: Record<string, any> | null
  isActive?: boolean
}

export interface InfoPaymentListResponse {
  success: true
  data: InfoPayment[]
  pagination: {
    total: number
    page: number
    totalPages: number
  }
}

export interface InfoPaymentResponse {
  success: true
  data: InfoPayment
}

export interface InfoPaymentPublicResponse {
  success: true
  data: InfoPayment[]
}

export interface DeleteInfoPaymentResponse {
  success: true
  message: string
}

export const infoPaymentApi = {
  getInfoPayments: (params?: Record<string, string>) =>
    api.get<InfoPayment[]>('/info-payments', params),

  getPublicInfoPayments: () =>
    api.get<InfoPayment[]>('/info-payments/public'),

  createInfoPayment: (data: CreateInfoPaymentData) =>
    api.post<InfoPayment>('/info-payments', data),

  getInfoPayment: (id: string | number) =>
    api.get<InfoPayment>(`/info-payments/${id}`),

  updateInfoPayment: (id: string | number, data: UpdateInfoPaymentData) =>
    api.put<InfoPayment>(`/info-payments/${id}`, data),

  deleteInfoPayment: (id: string | number) =>
    api.delete<{ message: string }>(`/info-payments/${id}`),
}

export const infoPaymentUtils = {
  isActive: (infoPayment: InfoPayment): boolean => infoPayment.isActive,

  formatForDisplay: (infoPayment: InfoPayment): string => {
    return `${infoPayment.bankName} - ${infoPayment.accountName} (${infoPayment.bankNumber})`
  },

  getContactInfo: (infoPayment: InfoPayment): { email?: string; phone?: string } => {
    return {
      email: infoPayment.email,
      phone: infoPayment.phone,
    }
  },

  hasMetadata: (infoPayment: InfoPayment): boolean => {
    return infoPayment.metadata !== null && infoPayment.metadata !== undefined
  },

  parseMetadata: (infoPayment: InfoPayment): Record<string, any> | null => {
    try {
      if (infoPayment.metadata === null || infoPayment.metadata === undefined) {
        return null
      }
      if (typeof infoPayment.metadata === 'string') {
        return JSON.parse(infoPayment.metadata)
      }
      return infoPayment.metadata
    } catch {
      return null
    }
  },
}
