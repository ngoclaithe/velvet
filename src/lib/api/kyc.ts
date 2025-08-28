import { api } from './core'
import type {
  KycSubmission,
  KycSubmissionData,
  KycUpdateData,
  KycDocumentUpdateData,
  KycPersonalInfoUpdateData,
  KycStatusResponse,
  KycReviewData,
  DocumentType,
  VerificationLevel,
  KycStatus
} from '@/types/kyc'

// Re-export types for backward compatibility
export type {
  KycSubmission,
  KycSubmissionData,
  KycUpdateData,
  KycDocumentUpdateData,
  KycPersonalInfoUpdateData,
  DocumentType,
  VerificationLevel,
  KycStatus
}

export const kycApi = {
  // Get KYC status and information
  getKycStatus: () =>
    api.get<KycStatusResponse>('/kyc/status'),

  // Get current KYC submission
  getCurrentSubmission: () =>
    api.get<KycSubmission>('/kyc/submission'),

  // Create KYC submission with validation
  createSubmission: (data: KycSubmissionData) =>
    api.post<{ id: string }>('/kyc/submission', data),

  // Update KYC submission
  updateSubmission: (data: KycUpdateData) =>
    api.patch<KycSubmission>('/kyc/submission', data),

  // Submit KYC for review
  submitForReview: () =>
    api.post<{ message: string }>('/kyc/submit'),

  // Document URL management (for Cloudinary URLs)
  updateDocumentUrl: (documentType: 'front' | 'back' | 'selfie', documentUrl: string) =>
    api.patch(`/kyc/documents/${documentType}`, {
      documentType,
      documentUrl
    } as KycDocumentUpdateData),

  // Legacy document upload (for file upload)
  uploadDocument: (documentType: string, file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('documentType', documentType)

    return api.upload('/kyc/documents', formData)
  },

  deleteDocument: (documentId: string) =>
    api.delete(`/kyc/documents/${documentId}`),

  // Personal information update with validation
  updatePersonalInfo: (personalInfo: KycPersonalInfoUpdateData) =>
    api.patch<KycSubmission>('/kyc/personal-info', personalInfo),

  // Get KYC requirements based on verification level
  getRequirements: (level: VerificationLevel) =>
    api.get(`/kyc/requirements/${level}`),

  // Admin endpoints
  admin: {
    // Get pending KYC submissions
    getPendingSubmissions: (params?: Record<string, string>) =>
      api.get<KycSubmission[]>('/admin/kyc/pending', params),

    // Review KYC submission
    reviewSubmission: (submissionId: string, data: KycReviewData) =>
      api.patch(`/admin/kyc/submissions/${submissionId}/review`, data),

    // Get KYC statistics
    getKycStats: () =>
      api.get('/admin/kyc/stats'),

    // Get user KYC details
    getUserKyc: (userId: string) =>
      api.get<KycSubmission>(`/admin/kyc/users/${userId}`)
  }
}

// Import helper functions and constants from types
import {
  VERIFICATION_LEVEL_DESCRIPTIONS,
  KYC_STATUS_DESCRIPTIONS,
  DOCUMENT_TYPE_LABELS,
  isValidCloudinaryUrl,
  validateKycSubmission
} from '@/types/kyc'

// Helper functions - re-export from types for backward compatibility
export const getVerificationLevelDescription = (level: string) => {
  return VERIFICATION_LEVEL_DESCRIPTIONS[level as VerificationLevel] || 'Chưa xác thực'
}

export const getKycStatusDescription = (status: string) => {
  return KYC_STATUS_DESCRIPTIONS[status as KycStatus] || 'Không xác định'
}

export const getDocumentTypeDescription = (type: string) => {
  switch (type) {
    case 'documentFrontUrl':
    case 'front':
      return 'Mặt trước giấy tờ'
    case 'documentBackUrl':
    case 'back':
      return 'Mặt sau giấy tờ'
    case 'selfieUrl':
    case 'selfie':
      return 'Ảnh selfie'
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

// Export validation functions
export { isValidCloudinaryUrl, validateKycSubmission }
