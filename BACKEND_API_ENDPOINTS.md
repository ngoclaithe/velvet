# Backend API Endpoints Documentation

This document outlines the required backend API endpoints for the new features implemented in the frontend.

## Table of Contents
- [KYC (Know Your Customer) Endpoints](#kyc-know-your-customer-endpoints)
- [Wallet & Payment Endpoints](#wallet--payment-endpoints)
- [Posts API Updates](#posts-api-updates)

---

## KYC (Know Your Customer) Endpoints

### 1. Get KYC Status
**GET** `/api/kyc/status`

Get the current KYC verification status for the authenticated user.

**Response:**
```json
{
  "success": true,
  "data": {
    "status": "draft|submitted|under_review|approved|rejected",
    "verificationLevel": "basic|intermediate|advanced",
    "submittedAt": "2024-01-01T00:00:00Z",
    "reviewedAt": "2024-01-01T00:00:00Z"
  }
}
```

### 2. Get Current KYC Submission
**GET** `/api/kyc/submission`

Get the current KYC submission details for the authenticated user.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "kyc_123",
    "userId": "user_123",
    "status": "draft",
    "verificationLevel": "basic",
    "personalInfo": {
      "fullName": "Nguyễn Văn A",
      "dateOfBirth": "1990-01-01",
      "nationality": "Vietnam",
      "address": "123 Main St, Ho Chi Minh City",
      "phoneNumber": "+84123456789",
      "idNumber": "123456789012",
      "idType": "citizen_id"
    },
    "documents": [
      {
        "id": "doc_123",
        "type": "citizen_id_front",
        "fileName": "front_id.jpg",
        "fileUrl": "https://storage.example.com/docs/front_id.jpg",
        "status": "pending",
        "uploadedAt": "2024-01-01T00:00:00Z"
      }
    ],
    "submittedAt": null,
    "reviewedAt": null,
    "rejectionReason": null
  }
}
```

### 3. Create/Update KYC Submission
**POST** `/api/kyc/submission`
**PATCH** `/api/kyc/submission`

Create or update KYC submission.

**Request Body:**
```json
{
  "personalInfo": {
    "fullName": "Nguyễn Văn A",
    "dateOfBirth": "1990-01-01",
    "nationality": "Vietnam",
    "address": "123 Main St, Ho Chi Minh City",
    "phoneNumber": "+84123456789",
    "idNumber": "123456789012",
    "idType": "citizen_id"
  },
  "verificationLevel": "basic"
}
```

### 4. Submit KYC for Review
**POST** `/api/kyc/submit`

Submit the KYC submission for review.

**Response:**
```json
{
  "success": true,
  "data": {
    "submissionId": "kyc_123",
    "status": "submitted",
    "message": "KYC submission has been sent for review"
  }
}
```

### 5. Upload KYC Document
**POST** `/api/kyc/documents`

Upload a KYC verification document.

**Request:** Multipart form data
- `file`: Document file (image or PDF)
- `documentType`: Type of document (citizen_id_front, citizen_id_back, passport, selfie_with_id, etc.)

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "doc_123",
    "type": "citizen_id_front",
    "fileName": "front_id.jpg",
    "fileUrl": "https://storage.example.com/docs/front_id.jpg",
    "status": "pending",
    "uploadedAt": "2024-01-01T00:00:00Z"
  }
}
```

### 6. Delete KYC Document
**DELETE** `/api/kyc/documents/{documentId}`

Delete a KYC document.

### 7. Update Personal Information
**PATCH** `/api/kyc/personal-info`

Update personal information for KYC.

**Request Body:**
```json
{
  "fullName": "Nguyễn Văn A",
  "dateOfBirth": "1990-01-01",
  "nationality": "Vietnam",
  "address": "123 Main St, Ho Chi Minh City",
  "phoneNumber": "+84123456789",
  "idNumber": "123456789012",
  "idType": "citizen_id"
}
```

### 8. Get Document Types
**GET** `/api/kyc/document-types`

Get available document types for KYC verification.

### 9. Get Requirements by Level
**GET** `/api/kyc/requirements/{level}`

Get KYC requirements for a specific verification level.

---

## Wallet & Payment Endpoints

### 1. Updated Withdrawal Endpoint
**POST** `/api/wallet/withdraw`

Create a withdrawal request with simplified bank details.

**Request Body:**
```json
{
  "amount": 100000,
  "bankName": "Vietcombank",
  "accountNumber": "1234567890",
  "accountHolderName": "NGUYEN VAN A"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "withdrawalId": "wd_123",
    "amount": 100000,
    "bankName": "Vietcombank",
    "accountNumber": "1234567890",
    "accountHolderName": "NGUYEN VAN A",
    "status": "pending",
    "createdAt": "2024-01-01T00:00:00Z",
    "estimatedProcessingTime": "1-3 business days"
  }
}
```

### 2. QR Code Generation Support
The frontend now uses `generateSepayQRUrl` function to generate QR codes. Backend should ensure that:
- InfoPayment API returns proper bank details
- Generated codePay is unique and trackable
- QR code payments can be processed correctly

---

## Posts API Updates

### 1. Enhanced Create Post Endpoint
**POST** `/api/posts`

The create post endpoint should handle the enhanced post creation with media uploads.

**Request Body:**
```json
{
  "title": "Post Title",
  "content": "Post content...",
  "category": "Giải trí",
  "tags": ["tag1", "tag2"],
  "visibility": "public|private|followers",
  "allowComments": true,
  "allowLikes": true,
  "allowSharing": true,
  "isPremium": false,
  "price": 0,
  "scheduledAt": "2024-01-01T00:00:00Z",
  "status": "published|draft",
  "type": "text|image|video|audio",
  "mediaUrls": ["https://storage.example.com/media/file1.jpg"]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "post_123",
    "title": "Post Title",
    "content": "Post content...",
    "category": "Giải trí",
    "tags": ["tag1", "tag2"],
    "visibility": "public",
    "status": "published",
    "createdAt": "2024-01-01T00:00:00Z",
    "author": {
      "id": "user_123",
      "username": "username",
      "avatar": "https://example.com/avatar.jpg"
    }
  }
}
```

### 2. Media Upload Endpoint
**POST** `/api/media/upload`

Upload media files for posts.

**Request:** Multipart form data
- `file`: Media file

**Response:**
```json
{
  "success": true,
  "data": {
    "url": "https://storage.example.com/media/file.jpg",
    "fileName": "file.jpg",
    "fileSize": 1024576,
    "mimeType": "image/jpeg"
  }
}
```

---

## Admin Endpoints (Optional for Future)

### KYC Admin Endpoints

1. **GET** `/api/admin/kyc/pending` - Get pending KYC submissions
2. **PATCH** `/api/admin/kyc/submissions/{id}/review` - Review KYC submission
3. **GET** `/api/admin/kyc/stats` - Get KYC statistics
4. **GET** `/api/admin/kyc/users/{userId}` - Get user KYC details

---

## Security & Validation Notes

### Authentication
- All endpoints require valid JWT authentication
- User permissions should be checked for admin endpoints

### Validation
- File uploads should be validated for type, size, and content
- Personal information should be validated against Vietnamese ID formats
- Bank account information should be validated for format

### Data Protection
- KYC documents should be stored securely with encryption
- Personal information should comply with Vietnamese data protection laws
- File access should be restricted to authorized users only

### Rate Limiting
- Document upload endpoints should be rate limited
- KYC submission should be limited to prevent spam

---

## Database Schema Suggestions

### KYC Tables

```sql
-- KYC submissions table
CREATE TABLE kyc_submissions (
  id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  status ENUM('draft', 'submitted', 'under_review', 'approved', 'rejected') DEFAULT 'draft',
  verification_level ENUM('basic', 'intermediate', 'advanced') DEFAULT 'basic',
  personal_info JSON,
  submitted_at TIMESTAMP NULL,
  reviewed_at TIMESTAMP NULL,
  rejection_reason TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- KYC documents table
CREATE TABLE kyc_documents (
  id VARCHAR(255) PRIMARY KEY,
  kyc_submission_id VARCHAR(255) NOT NULL,
  type VARCHAR(100) NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_url VARCHAR(500) NOT NULL,
  file_size INT,
  mime_type VARCHAR(100),
  status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  reviewed_at TIMESTAMP NULL,
  rejection_reason TEXT NULL,
  FOREIGN KEY (kyc_submission_id) REFERENCES kyc_submissions(id)
);
```

### Updated Withdrawal Requests

```sql
-- Update withdrawal_requests table
ALTER TABLE withdrawal_requests ADD COLUMN bank_name VARCHAR(255);
ALTER TABLE withdrawal_requests ADD COLUMN account_number VARCHAR(100);
ALTER TABLE withdrawal_requests ADD COLUMN account_holder_name VARCHAR(255);
-- Remove payment_method_id if exists
-- ALTER TABLE withdrawal_requests DROP COLUMN payment_method_id;
```

---

## Implementation Priority

1. **High Priority**
   - KYC submission and document upload endpoints
   - Updated withdrawal endpoint with bank details
   - Enhanced posts creation with media upload

2. **Medium Priority**  
   - KYC status and review workflows
   - Admin KYC management endpoints

3. **Low Priority**
   - Advanced KYC analytics and reporting
   - Automated document verification (OCR/AI)

---

## Testing Recommendations

1. **Unit Tests**
   - Validate all input data formats
   - Test file upload security
   - Test KYC workflow state transitions

2. **Integration Tests**
   - Test complete KYC submission flow
   - Test post creation with media uploads
   - Test withdrawal request processing

3. **Security Tests**
   - Test file upload vulnerabilities
   - Test authentication and authorization
   - Test data privacy compliance

---

*This documentation should be updated as the backend implementation progresses and new requirements are identified.*
