import type {
  CloudinarySignatureResponse,
  CloudinaryUploadResponse,
  OptimizedImageResponse,
  UploadOptions
} from '@/types/cloudinary';

class CloudinaryService {
  private backendUrl: string;

  constructor() {
    this.backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
  }

  // Lấy signature từ backend
  async getSignature(options?: UploadOptions): Promise<CloudinarySignatureResponse> {
    try {
      const response = await fetch(`${this.backendUrl}/api/cloudinary/signature`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(options || {})
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting signature:', error);
      throw new Error('Failed to get upload signature');
    }
  }

  // Upload single file lên Cloudinary
  async uploadImage(
    file: File, 
    options?: UploadOptions,
    onProgress?: (progress: number) => void
  ): Promise<CloudinaryUploadResponse> {
    try {
      // Validate file
      this.validateFile(file);

      // Lấy signature từ backend
      const signatureData = await this.getSignature(options);
      
      // Tạo FormData với tất cả parameters cần thiết
      const formData = new FormData();
      formData.append('file', file);
      formData.append('signature', signatureData.signature);
      formData.append('timestamp', signatureData.timestamp.toString());
      formData.append('api_key', signatureData.api_key);
      formData.append('upload_preset', signatureData.upload_preset);
      formData.append('folder', signatureData.folder);
      formData.append('tags', signatureData.tags);
      formData.append('quality', signatureData.quality);
      formData.append('fetch_format', signatureData.fetch_format);
      formData.append('dpr', signatureData.dpr);
      formData.append('flags', signatureData.flags);
      formData.append('transformation', signatureData.transformation);

      // Upload URL
      const uploadUrl = `https://api.cloudinary.com/v1_1/${signatureData.cloud_name}/image/upload`;
      
      // Perform upload with progress tracking
      return this.performUpload(uploadUrl, formData, onProgress);

    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    }
  }

  // Upload multiple files
  async uploadMultipleImages(
    files: File[], 
    options?: UploadOptions,
    onProgress?: (fileIndex: number, progress: number) => void
  ): Promise<CloudinaryUploadResponse[]> {
    const results: CloudinaryUploadResponse[] = [];
    
    // Upload tuần tự để tránh overwhelm
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const result = await this.uploadImage(file, options, (progress) => {
          if (onProgress) {
            onProgress(i, progress);
          }
        });
        results.push(result);
      } catch (error) {
        console.error(`Failed to upload file ${i}:`, error);
        throw new Error(`Failed to upload ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
    
    return results;
  }

  // Get optimized URLs từ backend
  async getOptimizedUrls(publicId: string): Promise<OptimizedImageResponse> {
    try {
      const response = await fetch(`${this.backendUrl}/api/cloudinary/optimize-urls`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ public_id: publicId })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting optimized URLs:', error);
      throw new Error('Failed to get optimized URLs');
    }
  }

  // Validate file trước khi upload
  private validateFile(file: File): void {
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

    if (file.size > maxSize) {
      throw new Error(`File too large. Maximum size is ${maxSize / 1024 / 1024}MB`);
    }

    if (!allowedTypes.includes(file.type)) {
      throw new Error('Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed.');
    }
  }

  // Perform actual upload với XMLHttpRequest để track progress
  private performUpload(
    url: string, 
    formData: FormData, 
    onProgress?: (progress: number) => void
  ): Promise<CloudinaryUploadResponse> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      
      // Progress tracking
      if (onProgress) {
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            const percentComplete = Math.round((e.loaded / e.total) * 100);
            onProgress(percentComplete);
          }
        });
      }

      // Success handler
      xhr.addEventListener('load', () => {
        if (xhr.status === 200) {
          try {
            const response = JSON.parse(xhr.responseText);
            resolve(response);
          } catch (error) {
            reject(new Error('Failed to parse response'));
          }
        } else {
          try {
            const errorResponse = JSON.parse(xhr.responseText);
            reject(new Error(errorResponse.error?.message || `Upload failed with status: ${xhr.status}`));
          } catch {
            reject(new Error(`Upload failed with status: ${xhr.status}`));
          }
        }
      });

      // Error handler
      xhr.addEventListener('error', () => {
        reject(new Error('Network error during upload'));
      });

      // Timeout handler
      xhr.addEventListener('timeout', () => {
        reject(new Error('Upload timeout'));
      });

      xhr.timeout = 60000; // 60 seconds timeout
      xhr.open('POST', url);
      xhr.send(formData);
    });
  }
}

export default CloudinaryService;
