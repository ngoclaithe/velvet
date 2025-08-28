class CloudinaryService {
  private backendUrl: string;

  constructor(backendUrl: string = 'http://localhost:3001') {
    this.backendUrl = backendUrl;
  }

  // Lấy chữ ký từ backend
  async getSignature(): Promise<CloudinarySignature> {
    try {
      const response = await fetch(`${this.backendUrl}/api/cloudinary/signature`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error getting signature:', error);
      throw new Error('Failed to get upload signature');
    }
  }

  // Upload file lên Cloudinary
  async uploadImage(file: File, onProgress?: (progress: number) => void): Promise<CloudinaryUploadResponse> {
    try {
      // Lấy signature từ backend
      const signatureData = await this.getSignature();
      
      // Tạo FormData
      const formData = new FormData();
      formData.append('file', file);
      formData.append('signature', signatureData.signature);
      formData.append('timestamp', signatureData.timestamp.toString());
      formData.append('api_key', signatureData.api_key);
      formData.append('upload_preset', signatureData.upload_preset);

      // Upload lên Cloudinary
      const uploadUrl = `https://api.cloudinary.com/v1_1/${signatureData.cloud_name}/image/upload`;
      
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        
        // Theo dõi progress
        if (onProgress) {
          xhr.upload.addEventListener('progress', (e) => {
            if (e.lengthComputable) {
              const percentComplete = (e.loaded / e.total) * 100;
              onProgress(Math.round(percentComplete));
            }
          });
        }

        xhr.addEventListener('load', () => {
          if (xhr.status === 200) {
            try {
              const response = JSON.parse(xhr.responseText);
              resolve(response);
            } catch (error) {
              reject(new Error('Failed to parse response'));
            }
          } else {
            reject(new Error(`Upload failed with status: ${xhr.status}`));
          }
        });

        xhr.addEventListener('error', () => {
          reject(new Error('Upload failed'));
        });

        xhr.open('POST', uploadUrl);
        xhr.send(formData);
      });

    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    }
  }

  // Upload multiple files
  async uploadMultipleImages(
    files: File[], 
    onProgress?: (fileIndex: number, progress: number) => void
  ): Promise<CloudinaryUploadResponse[]> {
    const results: CloudinaryUploadResponse[] = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const result = await this.uploadImage(file, (progress) => {
        if (onProgress) {
          onProgress(i, progress);
        }
      });
      results.push(result);
    }
    
    return results;
  }
}

export default CloudinaryService;