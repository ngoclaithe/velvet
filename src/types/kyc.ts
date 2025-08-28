// KYC Types matching backend validation requirements

export type DocumentType = 'passport' | 'id_card' | 'driving_license';

export type KycStatus = 'draft' | 'submitted' | 'under_review' | 'approved' | 'rejected';

export type VerificationLevel = 'basic' | 'intermediate' | 'advanced';

export interface KycPersonalInfo {
  fullName: string;
  dateOfBirth: string; // ISO8601 format (YYYY-MM-DD)
  nationality?: string;
  address?: string;
}

export interface KycDocumentUrls {
  documentFrontUrl: string; // Required - Cloudinary URL
  documentBackUrl?: string; // Optional for passport, required for id_card and driving_license
  selfieUrl: string; // Required - Cloudinary URL
}

export interface KycSubmissionData extends KycPersonalInfo, KycDocumentUrls {
  documentType: DocumentType;
  documentNumber: string; // 3-50 characters, alphanumeric + hyphens + spaces
}

export interface KycUpdateData extends Partial<KycPersonalInfo>, Partial<KycDocumentUrls> {
  documentType?: DocumentType;
  documentNumber?: string;
}

export interface KycDocumentUpdateData {
  documentType: 'front' | 'back' | 'selfie';
  documentUrl: string; // Cloudinary URL
}

export interface KycPersonalInfoUpdateData extends Partial<KycPersonalInfo> {}

export interface KycDocument {
  id: string;
  type: string;
  fileName: string;
  fileUrl: string;
  status: 'pending' | 'approved' | 'rejected';
  uploadedAt: Date;
  reviewedAt?: Date;
  rejectionReason?: string;
}

export interface KycSubmission {
  id: string;
  userId: string;
  status: KycStatus;
  documents: KycDocument[];
  personalInfo: KycPersonalInfo;
  documentUrls?: KycDocumentUrls;
  documentType?: DocumentType;
  documentNumber?: string;
  submittedAt?: Date;
  reviewedAt?: Date;
  rejectionReason?: string;
  verificationLevel: VerificationLevel;
}

// API Response types
export interface KycStatusResponse {
  status: KycStatus;
  verificationLevel?: VerificationLevel;
  submissionId?: string;
}

export interface KycReviewData {
  status: 'approved' | 'rejected';
  rejectionReason?: string; // Required when status is 'rejected'
  reviewNotes?: string;
}

// Validation helpers
export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  passport: 'Hộ chiếu',
  id_card: 'CCCD/CMND', 
  driving_license: 'Bằng lái xe'
};

export const VERIFICATION_LEVEL_DESCRIPTIONS: Record<VerificationLevel, string> = {
  basic: 'Xác thực cơ bản - Cho phép giao dịch tối đa 1,000,000 VND/tháng',
  intermediate: 'Xác thực trung cấp - Cho phép giao dịch tối đa 10,000,000 VND/tháng', 
  advanced: 'Xác thực nâng cao - Không giới hạn giao dịch'
};

export const KYC_STATUS_DESCRIPTIONS: Record<KycStatus, string> = {
  draft: 'Đang soạn thảo',
  submitted: 'Đã gửi',
  under_review: 'Đang xem xét', 
  approved: 'Đã phê duyệt',
  rejected: 'Bị từ chối'
};

// Required documents by document type
export const REQUIRED_DOCUMENTS: Record<DocumentType, string[]> = {
  passport: ['documentFrontUrl', 'selfieUrl'],
  id_card: ['documentFrontUrl', 'documentBackUrl', 'selfieUrl'],
  driving_license: ['documentFrontUrl', 'documentBackUrl', 'selfieUrl']
};

// Validation functions
export const isValidCloudinaryUrl = (url: string): boolean => {
  const cloudinaryPattern = /^https:\/\/res\.cloudinary\.com\/[^\/]+\/(image|video|raw|auto)\/upload\//;
  return cloudinaryPattern.test(url);
};

export const isValidDocumentNumber = (documentNumber: string): boolean => {
  return /^[A-Za-z0-9\-\s]{3,50}$/.test(documentNumber);
};

export const isValidFullName = (fullName: string): boolean => {
  return /^[a-zA-ZÀ-ỹ\s\-'\.]{2,100}$/.test(fullName);
};

export const isValidNationality = (nationality: string): boolean => {
  return /^[a-zA-ZÀ-ỹ\s]{2,50}$/.test(nationality);
};

export const isValidDateOfBirth = (dateOfBirth: string): boolean => {
  try {
    const birthDate = new Date(dateOfBirth);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    let adjustedAge = age;
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      adjustedAge--;
    }
    
    return adjustedAge >= 18 && adjustedAge <= 120;
  } catch {
    return false;
  }
};

export const validateKycSubmission = (data: Partial<KycSubmissionData>): string[] => {
  const errors: string[] = [];
  
  if (!data.documentType) {
    errors.push('Document type is required');
  }
  
  if (!data.documentNumber || !isValidDocumentNumber(data.documentNumber)) {
    errors.push('Document number must be between 3 and 50 characters and contain only letters, numbers, hyphens, and spaces');
  }
  
  if (!data.fullName || !isValidFullName(data.fullName)) {
    errors.push('Full name must be between 2 and 100 characters and contain only letters, spaces, hyphens, apostrophes, and dots');
  }
  
  if (!data.dateOfBirth || !isValidDateOfBirth(data.dateOfBirth)) {
    errors.push('Date of birth must be valid and you must be at least 18 years old');
  }
  
  if (data.nationality && !isValidNationality(data.nationality)) {
    errors.push('Nationality must be between 2 and 50 characters and contain only letters and spaces');
  }
  
  if (data.address && data.address.length > 500) {
    errors.push('Address cannot exceed 500 characters');
  }
  
  if (!data.documentFrontUrl || !isValidCloudinaryUrl(data.documentFrontUrl)) {
    errors.push('Document front image URL is required and must be a valid Cloudinary URL');
  }
  
  if (!data.selfieUrl || !isValidCloudinaryUrl(data.selfieUrl)) {
    errors.push('Selfie image URL is required and must be a valid Cloudinary URL');
  }
  
  // Check document type specific requirements
  if (data.documentType && REQUIRED_DOCUMENTS[data.documentType]) {
    const requiredDocs = REQUIRED_DOCUMENTS[data.documentType];
    for (const field of requiredDocs) {
      if (field === 'documentBackUrl' && (!data.documentBackUrl || !isValidCloudinaryUrl(data.documentBackUrl))) {
        errors.push(`Document back image is required for ${data.documentType}`);
      }
    }
  }
  
  return errors;
};
