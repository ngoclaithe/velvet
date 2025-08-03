export interface Wallet {
  id: string
  userId: string
  balance: number
  currency: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface Transaction {
  id: string
  walletId: string
  type: TransactionType
  amount: number
  currency: string
  status: TransactionStatus
  description: string
  reference?: string
  metadata?: Record<string, any>
  createdAt: Date
  processedAt?: Date
}

export type TransactionType = 'deposit' | 'withdrawal' | 'tip' | 'gift' | 'subscription' | 'private_show' | 'commission' | 'refund'
export type TransactionStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'

export interface PaymentMethod {
  id: string
  userId: string
  type: PaymentMethodType
  provider: string
  last4?: string
  expiryMonth?: number
  expiryYear?: number
  brand?: string
  isDefault: boolean
  isActive: boolean
  createdAt: Date
}

export type PaymentMethodType = 'credit_card' | 'debit_card' | 'paypal' | 'bank_transfer' | 'crypto'

export interface DepositRequest {
  amount: number
  paymentMethodId: string
  currency: string
}

export interface WithdrawalRequest {
  amount: number
  paymentMethodId: string
  currency: string
  reason?: string
}

export interface Subscription {
  id: string
  subscriberId: string
  creatorId: string
  plan: SubscriptionPlan
  status: SubscriptionStatus
  currentPeriodStart: Date
  currentPeriodEnd: Date
  cancelAtPeriodEnd: boolean
  createdAt: Date
  updatedAt: Date
}

export interface SubscriptionPlan {
  id: string
  creatorId: string
  name: string
  description?: string
  price: number
  currency: string
  interval: 'monthly' | 'yearly'
  benefits: string[]
  isActive: boolean
  createdAt: Date
}

export type SubscriptionStatus = 'active' | 'past_due' | 'cancelled' | 'incomplete' | 'trialing'

export interface Invoice {
  id: string
  subscriptionId: string
  amount: number
  currency: string
  status: InvoiceStatus
  dueDate: Date
  paidAt?: Date
  createdAt: Date
}

export type InvoiceStatus = 'draft' | 'open' | 'paid' | 'void' | 'uncollectible'

export interface Payout {
  id: string
  creatorId: string
  amount: number
  currency: string
  status: PayoutStatus
  method: PayoutMethod
  reference?: string
  scheduledFor: Date
  processedAt?: Date
  createdAt: Date
}

export type PayoutStatus = 'pending' | 'processing' | 'paid' | 'failed' | 'cancelled'

export interface PayoutMethod {
  type: 'bank_transfer' | 'paypal' | 'crypto'
  details: Record<string, any>
}

export interface Revenue {
  period: string
  totalEarnings: number
  tips: number
  gifts: number
  subscriptions: number
  privateShows: number
  commissionRate: number
  netEarnings: number
}

export interface PaymentStore {
  wallet: Wallet | null
  transactions: Transaction[]
  paymentMethods: PaymentMethod[]
  subscriptions: Subscription[]
  revenue: Revenue[]
  isLoading: boolean
  error: string | null

  // Actions
  loadWallet: () => Promise<void>
  deposit: (data: DepositRequest) => Promise<Transaction>
  withdraw: (data: WithdrawalRequest) => Promise<Transaction>
  addPaymentMethod: (data: AddPaymentMethodData) => Promise<PaymentMethod>
  removePaymentMethod: (id: string) => Promise<void>
  setDefaultPaymentMethod: (id: string) => Promise<void>
  subscribe: (creatorId: string, planId: string) => Promise<Subscription>
  unsubscribe: (subscriptionId: string) => Promise<void>
  sendTip: (data: SendTipData) => Promise<Transaction>
  sendGift: (data: SendGiftData) => Promise<Transaction>
  getRevenue: (period: string) => Promise<Revenue[]>
  requestPayout: (amount: number, method: PayoutMethod) => Promise<Payout>
  getTransactionHistory: (filters?: TransactionFilters) => Promise<Transaction[]>
}

export interface AddPaymentMethodData {
  type: PaymentMethodType
  provider: string
  token: string
  isDefault?: boolean
}

export interface TransactionFilters {
  type?: TransactionType
  status?: TransactionStatus
  dateFrom?: Date
  dateTo?: Date
  limit?: number
  offset?: number
}

export interface WebhookEvent {
  id: string
  type: string
  data: Record<string, any>
  timestamp: Date
  signature: string
}

export interface StripeConfig {
  publicKey: string
  webhookSecret: string
  currency: string
  commissionRate: number
}

export interface PayPalConfig {
  clientId: string
  clientSecret: string
  mode: 'sandbox' | 'live'
}

export interface CryptoConfig {
  networks: string[]
  confirmationsRequired: number
  supportedCurrencies: string[]
}
