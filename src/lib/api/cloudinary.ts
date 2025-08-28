import { api } from './core'
import type { 
  CloudinarySignatureResponse, 
  CloudinaryUploadResponse, 
  OptimizedImageResponse, 
  UploadOptions 
} from '@/types/cloudinary'

export const cloudinaryApi = {
  // Lấy signature từ backend
  getSignature: (options?: UploadOptions) =>
    api.post<CloudinarySignatureResponse>('/cloudinary/signature', options || {}),

  // Get optimized URLs từ backend  
  getOptimizedUrls: (publicId: string) =>
    api.post<OptimizedImageResponse>('/cloudinary/optimize-urls', { public_id: publicId }),

  // Upload file trực tiếp lên Cloudinary (sử dụng signature)
  uploadFile: async (
    file: File, 
    options?: UploadOptions,
    onProgress?: (progress: number) => void
  ): Promise<CloudinaryUploadResponse> => {
    // Validate file
    validateFile(file)

    // Lấy signature từ backend
    console.log('🔍 Requesting signature with options:', options)
    const signatureResponse = await cloudinaryApi.getSignature(options)
    console.log('📥 Full signature response:', signatureResponse)
    console.log('📥 Response success:', signatureResponse.success)
    console.log('📥 Response data:', signatureResponse.data)

    if (!signatureResponse.success || !signatureResponse.data) {
      console.error('❌ Signature response failed:', {
        success: signatureResponse.success,
        data: signatureResponse.data,
        error: signatureResponse.error || 'No error field'
      })
      throw new Error('Failed to get upload signature')
    }

    const signatureData = signatureResponse.data
    
    // ✅ Tạo FormData CHỈ với những params được ký
    const formData = new FormData()
    
    // File (bắt buộc)
    formData.append('file', file)
    
    // Signature và credentials (bắt buộc)
    formData.append('signature', signatureData.signature)
    formData.append('api_key', signatureData.api_key)
    
    // ✅ CHỈ append những params ĐÃ ĐƯỢC KÝ trong signature
    const signedParams = [
      'timestamp',
      'upload_preset', 
      'folder',
      'tags',
      'transformation'
    ]
    
    signedParams.forEach(param => {
      if (signatureData[param as keyof typeof signatureData] !== undefined && 
          signatureData[param as keyof typeof signatureData] !== null) {
        const value = signatureData[param as keyof typeof signatureData]
        formData.append(param, value.toString())
      }
    })

    // ❌ KHÔNG GỬI các params không được ký để tránh signature mismatch
    // Cloudinary sẽ tự động xử lý use_filename, unique_filename, overwrite
    console.log('🚫 Skipping optional params to avoid signature mismatch')
    console.log('ℹ️  Cloudinary will use default values for: use_filename, unique_filename, overwrite')

    // ✅ Debug FormData params (compatible with older TS targets)
    const formDataKeys: string[] = []
    formData.forEach((value, key) => {
      formDataKeys.push(key)
    })
    console.log('✅ FormData params:', formDataKeys)
    console.log('🔧 File type:', file.type, 'Size:', file.size)

    // Determine resource type
    const resourceType = getResourceType(file, options?.resource_type)
    
    // Upload URL
    const uploadUrl = `https://api.cloudinary.com/v1_1/${signatureData.cloud_name}/${resourceType}/upload`

    console.log('📤 Uploading to Cloudinary:', {
      url: uploadUrl,
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      resourceType: resourceType
    })

    // Perform upload with progress tracking
    return performUpload(uploadUrl, formData, onProgress)
  },

  // Upload multiple files
  uploadMultipleFiles: async (
    files: File[], 
    options?: UploadOptions,
    onProgress?: (fileIndex: number, progress: number) => void
  ): Promise<CloudinaryUploadResponse[]> => {
    const results: CloudinaryUploadResponse[] = []
    
    // Upload tuần tự để tránh overwhelm
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      try {
        const result = await cloudinaryApi.uploadFile(file, options, (progress) => {
          if (onProgress) {
            onProgress(i, progress)
          }
        })
        results.push(result)
      } catch (error) {
        console.error(`Failed to upload file ${i}:`, error)
        throw new Error(`Failed to upload ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }
    
    return results
  }
}

// Helper functions
function validateFile(file: File): void {
  const maxSize = 100 * 1024 * 1024 // 100MB for videos, smaller for images
  const imageTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  const videoTypes = ['video/mp4', 'video/avi', 'video/mov', 'video/wmv', 'video/webm']
  const audioTypes = ['audio/mp3', 'audio/wav', 'audio/aac', 'audio/ogg']
  const allowedTypes = [...imageTypes, ...videoTypes, ...audioTypes]

  // Different size limits for different types
  let sizeLimit = maxSize
  if (imageTypes.includes(file.type)) {
    sizeLimit = 10 * 1024 * 1024 // 10MB for images
  } else if (audioTypes.includes(file.type)) {
    sizeLimit = 20 * 1024 * 1024 // 20MB for audio
  }

  if (file.size > sizeLimit) {
    throw new Error(`File quá lớn. Kích thước tối đa là ${sizeLimit / 1024 / 1024}MB`)
  }

  if (!allowedTypes.includes(file.type)) {
    throw new Error('Định dạng file không được hỗ trợ. Chỉ hỗ trợ ảnh (JPEG, PNG, WebP, GIF), video (MP4, AVI, MOV, WMV, WebM) và âm thanh (MP3, WAV, AAC, OGG).')
  }
}

function getResourceType(file: File, override?: string): string {
  if (override) return override
  
  if (file.type.startsWith('image/')) return 'image'
  if (file.type.startsWith('video/')) return 'video'
  if (file.type.startsWith('audio/')) return 'video' 
  
  return 'auto'
}

function performUpload(
  url: string, 
  formData: FormData, 
  onProgress?: (progress: number) => void
): Promise<CloudinaryUploadResponse> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    
    // Progress tracking
    if (onProgress) {
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const percentComplete = Math.round((e.loaded / e.total) * 100)
          onProgress(percentComplete)
        }
      })
    }

    xhr.addEventListener('load', () => {
      try {
        const response = JSON.parse(xhr.responseText)

        if (xhr.status === 200) {
          console.log('✅ Upload successful:', {
            public_id: response.public_id,
            secure_url: response.secure_url,
            format: response.format,
            bytes: response.bytes
          })
          resolve(response)
        } else {
          const errorMessage = response?.error?.message || `Upload failed with status ${xhr.status}`

          // Dịch một số lỗi thường gặp sang tiếng Việt
          let vietnameseError = errorMessage
          if (/Invalid signature/i.test(errorMessage)) {
            vietnameseError = 'Chữ ký upload không hợp lệ. Kiểm tra lại cách ký từ backend.'
          } else if (/Invalid upload preset/i.test(errorMessage)) {
            vietnameseError = 'Upload preset không hợp lệ hoặc chưa bật chế độ signed/unsigned.'
          } else if (/Missing required parameter/i.test(errorMessage)) {
            vietnameseError = `Thiếu tham số bắt buộc từ FE: ${errorMessage}`
          } else if (/File size too large/i.test(errorMessage)) {
            vietnameseError = 'File quá lớn. Vui lòng chọn file nhỏ hơn.'
          } else if (/Invalid file type/i.test(errorMessage)) {
            vietnameseError = 'Định dạng file không được hỗ trợ.'
          } else if (/Upload preset must be whitelisted/i.test(errorMessage)) {
            vietnameseError = 'Upload preset chưa được whitelist trong Cloudinary settings.'
          } else if (/Timestamp is too old/i.test(errorMessage)) {
            vietnameseError = 'Chữ ký đã quá cũ. Vui lòng thử lại.'
          }

          console.error('❌ Upload error detail:', {
            status: xhr.status,
            rawResponse: xhr.responseText,
            parsedResponse: response,
            vietnameseError
          })

          reject(new Error(vietnameseError))
        }
      } catch (err) {
        console.error('❌ Parse error:', {
          status: xhr.status,
          rawResponse: xhr.responseText,
          parseError: err
        })
        reject(new Error(`Không đọc được phản hồi từ Cloudinary (status ${xhr.status})`))
      }
    })

    xhr.addEventListener('error', (e) => {
      console.error('❌ Network error:', e)
      reject(new Error('Network error during upload'))
    })

    xhr.addEventListener('timeout', () => {
      console.error('❌ Upload timeout after 60 seconds')
      reject(new Error('Upload timeout'))
    })

    // Set timeout to 60 seconds
    xhr.timeout = 60000
    
    // Debug: log all form data before sending (compatible with older TS)
    console.log('📤 FormData contents:')
    formData.forEach((value, key) => {
      if (key === 'file') {
        console.log(`  ${key}:`, `[File: ${(value as File).name}]`)
      } else {
        console.log(`  ${key}:`, value)
      }
    })
    
    xhr.open('POST', url)
    xhr.send(formData)
  })
}