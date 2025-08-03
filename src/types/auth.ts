export interface User {
  id: string
  username: string
  email: string
  avatar?: string
  firstName?: string
  lastName?: string
  bio?: string
  isVerified: boolean
  isOnline: boolean
  role: UserRole
  createdAt: Date
  updatedAt: Date
}

export type UserRole = 'guest' | 'user' | 'creator' | 'moderator' | 'admin'

export interface AuthSession {
  user: User
  accessToken: string
  refreshToken: string
  expiresAt: Date
}

export interface LoginCredentials {
  email: string
  password: string
  rememberMe?: boolean
}

export interface RegisterData {
  username: string
  email: string
  password: string
  confirmPassword: string
  firstName?: string
  lastName?: string
  agreeToTerms: boolean
}

export interface ForgotPasswordData {
  email: string
}

export interface ResetPasswordData {
  token: string
  password: string
  confirmPassword: string
}

export interface ChangePasswordData {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

export interface KYCData {
  fullName: string
  dateOfBirth: Date
  address: {
    street: string
    city: string
    state: string
    zipCode: string
    country: string
  }
  idDocument: {
    type: 'passport' | 'drivers_license' | 'national_id'
    number: string
    expiryDate: Date
    frontImage: File
    backImage?: File
  }
  phoneNumber: string
  occupation?: string
}

export interface AuthStore {
  user: User | null
  session: AuthSession | null
  isLoading: boolean
  error: string | null
  login: (credentials: LoginCredentials) => Promise<void>
  register: (data: RegisterData) => Promise<void>
  logout: () => void
  refreshToken: () => Promise<void>
  updateProfile: (data: Partial<User>) => Promise<void>
  submitKYC: (data: KYCData) => Promise<void>
  forgotPassword: (data: ForgotPasswordData) => Promise<void>
  resetPassword: (data: ResetPasswordData) => Promise<void>
  changePassword: (data: ChangePasswordData) => Promise<void>
}
