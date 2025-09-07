import { z } from 'zod'

// Auth validation schemas
export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  rememberMe: z.boolean().optional(),
})

export const registerSchema = z.object({
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(20, 'Username must be at most 20 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  email: z.string().email('Please enter a valid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/(?=.*[a-z])/, 'Password must contain at least one lowercase letter')
    .regex(/(?=.*[A-Z])/, 'Password must contain at least one uppercase letter')
    .regex(/(?=.*\d)/, 'Password must contain at least one number'),
  confirmPassword: z.string(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  agreeToTerms: z.boolean().refine(val => val === true, {
    message: 'You must agree to the terms and conditions',
  }),
}).refine(data => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})

export const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
})

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/(?=.*[a-z])/, 'Password must contain at least one lowercase letter')
    .regex(/(?=.*[A-Z])/, 'Password must contain at least one uppercase letter')
    .regex(/(?=.*\d)/, 'Password must contain at least one number'),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/(?=.*[a-z])/, 'Password must contain at least one lowercase letter')
    .regex(/(?=.*[A-Z])/, 'Password must contain at least one uppercase letter')
    .regex(/(?=.*\d)/, 'Password must contain at least one number'),
  confirmPassword: z.string(),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})

// Profile validation schemas
export const profileUpdateSchema = z.object({
  displayName: z.string().max(50, 'Display name must be at most 50 characters').optional(),
  bio: z.string().max(500, 'Bio must be at most 500 characters').optional(),
  location: z.string().max(100, 'Location must be at most 100 characters').optional(),
  socialLinks: z.object({
    twitter: z.string().max(50).optional(),
    instagram: z.string().max(50).optional(),
    youtube: z.string().max(50).optional(),
    tiktok: z.string().max(50).optional(),
  }).optional(),
})

// Stream validation schemas
export const createStreamSchema = z.object({
  title: z
    .string()
    .min(1, 'Stream title is required')
    .max(100, 'Title must be at most 100 characters'),
  description: z.string().max(1000, 'Description must be at most 1000 characters').optional(),
  category: z.string().min(1, 'Category is required'),
  tags: z.array(z.string()).max(10, 'Maximum 10 tags allowed'),
  isPrivate: z.boolean(),
  privateShowRate: z.number().min(0).optional(),
  settings: z.object({
    quality: z.object({
      resolution: z.enum(['720p', '1080p', '4K']),
      bitrate: z.number().min(1000).max(50000),
      fps: z.number().refine(val => val === 30 || val === 60, {
        message: 'FPS must be either 30 or 60',
      }),
    }),
    audio: z.object({
      enabled: z.boolean(),
      bitrate: z.number().min(64).max(320),
      sampleRate: z.number(),
    }),
    chat: z.object({
      enabled: z.boolean(),
      subscribersOnly: z.boolean(),
      slowMode: z.number().min(0).max(300),
      moderationEnabled: z.boolean(),
    }),
    recording: z.object({
      enabled: z.boolean(),
      autoSave: z.boolean(),
      quality: z.string(),
    }),
  }),
})

export const updateStreamSchema = createStreamSchema.partial()

// Chat validation schemas
export const sendMessageSchema = z.object({
  content: z
    .string()
    .min(1, 'Message cannot be empty')
    .max(500, 'Message must be at most 500 characters'),
  type: z.enum(['text', 'emoji', 'image', 'video', 'audio']).default('text'),
  replyTo: z.string().optional(),
})

export const sendTipSchema = z.object({
  receiverId: z.string().min(1, 'Receiver ID is required'),
  amount: z.number().min(1, 'Tip amount must be at least $1').max(10000, 'Maximum tip is $10,000'),
  message: z.string().max(200, 'Tip message must be at most 200 characters').optional(),
  isAnonymous: z.boolean().default(false),
  streamId: z.string().optional(),
})

export const sendGiftSchema = z.object({
  giftId: z.string().min(1, 'Gift ID is required'),
  receiverId: z.string().min(1, 'Receiver ID is required'),
  quantity: z.number().min(1, 'Quantity must be at least 1').max(100, 'Maximum 100 gifts at once'),
  message: z.string().max(200, 'Gift message must be at most 200 characters').optional(),
  streamId: z.string().optional(),
})

// Payment validation schemas
export const depositSchema = z.object({
  amount: z.number().min(5, 'Minimum deposit is $5').max(10000, 'Maximum deposit is $10,000'),
  paymentMethodId: z.string().min(1, 'Payment method is required'),
  currency: z.string().default('USD'),
})

export const withdrawalSchema = z.object({
  amount: z.number().min(10, 'Minimum withdrawal is $10').max(50000, 'Maximum withdrawal is $50,000'),
  paymentMethodId: z.string().min(1, 'Payment method is required'),
  currency: z.string().default('USD'),
  reason: z.string().max(200, 'Reason must be at most 200 characters').optional(),
})

export const addPaymentMethodSchema = z.object({
  type: z.enum(['credit_card', 'debit_card', 'paypal', 'bank_transfer', 'crypto']),
  provider: z.string().min(1, 'Provider is required'),
  token: z.string().min(1, 'Payment token is required'),
  isDefault: z.boolean().default(false),
})

// KYC validation schemas
export const kycSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  dateOfBirth: z.date().refine(date => {
    const age = new Date().getFullYear() - date.getFullYear()
    return age >= 18
  }, 'You must be at least 18 years old'),
  address: z.object({
    street: z.string().min(5, 'Street address is required'),
    city: z.string().min(2, 'City is required'),
    state: z.string().min(2, 'State is required'),
    zipCode: z.string().min(5, 'ZIP code is required'),
    country: z.string().min(2, 'Country is required'),
  }),
  idDocument: z.object({
    type: z.enum(['passport', 'drivers_license', 'national_id']),
    number: z.string().min(5, 'Document number is required'),
    expiryDate: z.date().refine(date => date > new Date(), 'Document must not be expired'),
    frontImage: z.instanceof(File, { message: 'Front image is required' }),
    backImage: z.instanceof(File).optional(),
  }),
  phoneNumber: z.string().regex(/^\+?[\d\s\-\(\)]+$/, 'Please enter a valid phone number'),
  occupation: z.string().max(100, 'Occupation must be at most 100 characters').optional(),
})

// Private show validation schemas
export const bookPrivateShowSchema = z.object({
  streamId: z.string().min(1, 'Stream ID is required'),
  creatorId: z.string().min(1, 'Creator ID is required'),
  duration: z.number().min(5, 'Minimum duration is 5 minutes').max(180, 'Maximum duration is 3 hours'),
  scheduledFor: z.date().optional(),
  message: z.string().max(200, 'Message must be at most 200 characters').optional(),
})

// Settings validation schemas
export const settingsSchema = z.object({
  privacy: z.object({
    showOnlineStatus: z.boolean(),
    showLastSeen: z.boolean(),
    allowDirectMessages: z.boolean(),
    allowFollows: z.boolean(),
    showInSearch: z.boolean(),
  }).optional(),
  notifications: z.object({
    email: z.boolean(),
    push: z.boolean(),
    newFollowers: z.boolean(),
    tips: z.boolean(),
    gifts: z.boolean(),
    streamStart: z.boolean(),
    messages: z.boolean(),
  }).optional(),
  streaming: z.object({
    defaultQuality: z.string(),
    autoStart: z.boolean(),
    chatModeration: z.boolean(),
    allowGifts: z.boolean(),
    allowTips: z.boolean(),
    privateShows: z.boolean(),
  }).optional(),
  appearance: z.object({
    theme: z.enum(['light', 'dark', 'system']),
    language: z.string(),
    timezone: z.string(),
  }).optional(),
})

// File upload validation schemas
export const imageUploadSchema = z.object({
  file: z.instanceof(File)
    .refine(file => file.size <= 10 * 1024 * 1024, 'Image must be less than 10MB')
    .refine(
      file => ['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type),
      'Only JPEG, PNG, WebP, and GIF images are allowed'
    ),
})

export const videoUploadSchema = z.object({
  file: z.instanceof(File)
    .refine(file => file.size <= 500 * 1024 * 1024, 'Video must be less than 500MB')
    .refine(
      file => ['video/mp4', 'video/webm', 'video/mov'].includes(file.type),
      'Only MP4, WebM, and MOV videos are allowed'
    ),
})

// Search validation schemas
export const searchSchema = z.object({
  query: z.string().min(1, 'Search query is required').max(100, 'Query must be at most 100 characters'),
  filters: z.record(z.string(), z.any()).optional(),
  sort: z.string().optional(),
  order: z.enum(['asc', 'desc']).default('desc'),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
})

// Request Deposit validation schemas
export const createRequestDepositSchema = z.object({
  amount: z
    .number()
    .positive('Amount must be a positive number.')
    .min(0.01, 'Amount is required.'),
  infoPaymentId: z
    .number()
    .positive('infoPaymentId must be a positive integer.')
    .int('infoPaymentId must be a positive integer.'),
  transactionCode: z
    .string()
    .trim()
    .optional(),
  note: z
    .string()
    .trim()
    .optional(),
})

export const updateRequestDepositSchema = z.object({
  status: z
    .enum(['approved', 'rejected'], {
      errorMap: () => ({ message: 'Status must be either "approved" or "rejected".' })
    })
})

// Type inference helpers
export type LoginInput = z.infer<typeof loginSchema>
export type RegisterInput = z.infer<typeof registerSchema>
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>
export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>
export type CreateStreamInput = z.infer<typeof createStreamSchema>
export type UpdateStreamInput = z.infer<typeof updateStreamSchema>
export type SendMessageInput = z.infer<typeof sendMessageSchema>
export type SendTipInput = z.infer<typeof sendTipSchema>
export type SendGiftInput = z.infer<typeof sendGiftSchema>
export type DepositInput = z.infer<typeof depositSchema>
export type WithdrawalInput = z.infer<typeof withdrawalSchema>
export type AddPaymentMethodInput = z.infer<typeof addPaymentMethodSchema>
export type KYCInput = z.infer<typeof kycSchema>
export type BookPrivateShowInput = z.infer<typeof bookPrivateShowSchema>
export type SettingsInput = z.infer<typeof settingsSchema>
export type ImageUploadInput = z.infer<typeof imageUploadSchema>
export type VideoUploadInput = z.infer<typeof videoUploadSchema>
export type SearchInput = z.infer<typeof searchSchema>
export type CreateRequestDepositInput = z.infer<typeof createRequestDepositSchema>
export type UpdateRequestDepositInput = z.infer<typeof updateRequestDepositSchema>
