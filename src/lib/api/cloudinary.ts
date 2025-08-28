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
    
    // Tạo FormData với t��t cả parameters cần thiết
    const formData = new FormData()
    formData.append('file', file)
    formData.append('signature', signatureData.signature)
    formData.append('timestamp', signatureData.timestamp.toString())
    formData.append('api_key', signatureData.api_key)
    formData.append('upload_preset', signatureData.upload_preset)
    formData.append('folder', signatureData.folder)
    formData.append('tags', signatureData.tags)
    formData.append('quality', signatureData.quality)
    formData.append('fetch_format', signatureData.fetch_format)
    formData.append('dpr', signatureData.dpr)
    formData.append('flags', signatureData.flags)

    // Thêm các parameter tối ưu khác thay vì transformation
    if (file.type.startsWith('image/')) {
      // Chỉ áp dụng cho hình ảnh
      formData.append('format', 'auto')  // Tự động chọn format tốt nhất
      formData.append('crop', 'limit')   // Không crop, chỉ giới hạn kích thước
      formData.append('width', '1200')   // Giới hạn width tối đa
      formData.append('height', '1200')  // Giới hạn height tối đa
    }

    console.log('🔧 Skipping complex transformation parameter to avoid errors')
    console.log('🔧 Using individual optimization parameters instead')
    console.log('🔧 File type:', file.type, 'Size:', file.size)

    // Determine resource type
    const resourceType = getResourceType(file, options?.resource_type)
    
    // Upload URL
    const uploadUrl = `https://api.cloudinary.com/v1_1/${signatureData.cloud_name}/${resourceType}/upload`
    
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
  if (file.type.startsWith('audio/')) return 'video' // Audio uploads use video endpoint
  
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

    // Success handler
    xhr.addEventListener('load', () => {
      if (xhr.status === 200) {
        try {
          const response = JSON.parse(xhr.responseText)
          resolve(response)
        } catch (error) {
          reject(new Error('Failed to parse response'))
        }
      } else {
        try {
          const errorResponse = JSON.parse(xhr.responseText)
          const errorMessage = errorResponse.error?.message || `Upload failed with status: ${xhr.status}`

          // Chuyển đổi một số lỗi thường gặp sang tiếng Việt
          let vietnameseError = errorMessage
          if (errorMessage.includes('Invalid transformation')) {
            vietnameseError = 'Lỗi xử lý hình ảnh. Vui lòng thử lại với file khác.'
          } else if (errorMessage.includes('File size too large')) {
            vietnameseError = 'File quá lớn. Vui lòng chọn file nhỏ hơn.'
          } else if (errorMessage.includes('Invalid file type')) {
            vietnameseError = 'Định dạng file không được hỗ trợ.'
          } else if (errorMessage.includes('Upload failed')) {
            vietnameseError = 'Tải file thất bại. Vui lòng thử lại.'
          }

          reject(new Error(vietnameseError))
        } catch {
          reject(new Error('Tải file thất bại. Vui lòng thử lại.'))
        }
      }
    })

    // Error handler
    xhr.addEventListener('error', () => {
      reject(new Error('Network error during upload'))
    })

    // Timeout handler
    xhr.addEventListener('timeout', () => {
      reject(new Error('Upload timeout'))
    })

    xhr.timeout = 60000 // 60 seconds timeout
    xhr.open('POST', url)
    xhr.send(formData)
  })
}
