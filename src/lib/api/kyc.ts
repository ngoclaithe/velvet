import { api } from './core'

export interface KycDocumentType {
  id: string
  name: string
  description: string
  required: boolean
}

export interface KycDocument {
  id: string
  type: string
  fileName: string
  fileUrl: string
  status: 'pending' | 'approved' | 'rejected'
  uploadedAt: Date
  reviewedAt?: Date
  rejectionReason?: string
}

export interface KycSubmission {
  id: string
  userId: string
  status: 'draft' | 'submitted' | 'under_review' | 'approved' | 'rejected'
  documents: KycDocument[]
  personalInfo: {
    fullName: string
    dateOfBirth: string
    nationality: string
    address: string
    phoneNumber: string
    idNumber: string
    idType: 'citizen_id' | 'passport' | 'driver_license'
  }
  submittedAt?: Date
  reviewedAt?: Date
  rejectionReason?: string
  verificationLevel: 'basic' | 'intermediate' | 'advanced'
}

export const kycApi = {
  // Get KYC status and information
  getKycStatus: () =>
    api.get('/kyc/status'),

  // Get current KYC submission
  getCurrentSubmission: () =>
    api.get('/kyc/submission'),

  // Create or update KYC submission
  createSubmission: (data: Partial<KycSubmission>) =>
    api.post('/kyc/submission', data),

  updateSubmission: (data: Partial<KycSubmission>) =>
    api.patch('/kyc/submission', data),

  // Submit KYC for review
  submitForReview: () =>
    api.post('/kyc/submit'),

  // Document management
  uploadDocument: (documentType: string, file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('documentType', documentType)
    
    return api.upload('/kyc/documents', formData)
  },

  deleteDocument: (documentId: string) =>
    api.delete(`/kyc/documents/${documentId}`),

  // Get available document types
  getDocumentTypes: () =>
    api.get('/kyc/document-types'),

  // Personal information update
  updatePersonalInfo: (personalInfo: any) =>
    api.patch('/kyc/personal-info', personalInfo),

  // Get KYC requirements based on verification level
  getRequirements: (level: 'basic' | 'intermediate' | 'advanced') =>
    api.get(`/kyc/requirements/${level}`),

  // Admin endpoints (for future use)
  admin: {
    // Get pending KYC submissions
    getPendingSubmissions: (params?: Record<string, string>) =>
      api.get('/admin/kyc/pending', params),

    // Review KYC submission
    reviewSubmission: (submissionId: string, data: { 
      status: 'approved' | 'rejected'
      rejectionReason?: string 
    }) =>
      api.patch(`/admin/kyc/submissions/${submissionId}/review`, data),

    // Get KYC statistics
    getKycStats: () =>
      api.get('/admin/kyc/stats'),

    // Get user KYC details
    getUserKyc: (userId: string) =>
      api.get(`/admin/kyc/users/${userId}`)
  }
}

// Helper function to get verification level description
export const getVerificationLevelDescription = (level: string) => {
  switch (level) {
    case 'basic':
      return 'Xác thực cơ bản - Cho phép giao dịch tối đa 1,000,000 VND/tháng'
    case 'intermediate':
      return 'Xác thực trung gấp - Cho phép giao dịch tối đa 10,000,000 VND/tháng'
    case 'advanced':
      return 'Xác thực nâng cao - Không giới hạn giao dịch'
    default:
      return 'Chưa xác thực'
  }
}

// Helper function to get status description
export const getKycStatusDescription = (status: string) => {
  switch (status) {
    case 'draft':
      return 'Đang soạn thảo'
    case 'submitted':
      return 'Đã gửi'
    case 'under_review':
      return 'Đang xem xét'
    case 'approved':
      return 'Đã phê duyệt'
    case 'rejected':
      return 'Bị từ chối'
    default:
      return 'Không xác đ��nh'
  }
}

// Helper function to get document type description
export const getDocumentTypeDescription = (type: string) => {
  switch (type) {
    case 'citizen_id_front':
      return 'Mặt trước CCCD/CMND'
    case 'citizen_id_back':
      return 'Mặt sau CCCD/CMND'
    case 'passport':
      return 'Hộ chiếu'
    case 'driver_license':
      return 'Bằng lái xe'
    case 'selfie_with_id':
      return 'Ảnh selfie cùng giấy tờ'
    case 'proof_of_address':
      return 'Giấy tờ chứng minh địa chỉ'
    case 'bank_statement':
      return 'Sao kê ngân hàng'
    default:
      return type
  }
}
