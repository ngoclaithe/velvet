export interface CloudinarySignatureResponse {
  signature: string;
  timestamp: number;
  api_key: string;
  cloud_name: string;
  upload_preset: string;
  folder: string;
  tags: string;
  quality: string;
  fetch_format: string;
  dpr: string;
  flags: string;
  transformation: string;
}

export interface CloudinaryUploadResponse {
  public_id: string;
  version: number;
  signature: string;
  width: number;
  height: number;
  format: string;
  resource_type: string;
  created_at: string;
  tags: string[];
  bytes: number;
  type: string;
  etag: string;
  placeholder: boolean;
  url: string;
  secure_url: string;
  access_mode: string;
  original_filename: string;
}

export interface OptimizedImageUrls {
  original: string;
  optimized: string;
  thumbnail: string;
  placeholder: string;
  responsive: {
    mobile: string;
    tablet: string;
    desktop: string;
    retina: string;
  };
}

export interface OptimizedImageResponse {
  public_id: string;
  urls: OptimizedImageUrls;
  srcset: string;
}

export interface UploadOptions {
  folder?: string;
  tags?: string;
  transformation?: string;
}