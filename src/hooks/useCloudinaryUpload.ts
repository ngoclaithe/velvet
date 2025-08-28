import { useState, useCallback } from 'react';
import CloudinaryService from '@/lib/api/cloudinary';
import type { CloudinaryUploadResponse, UploadOptions } from '@/types/cloudinary';

interface UseCloudinaryUploadReturn {
  uploadSingle: (file: File, options?: UploadOptions) => Promise<CloudinaryUploadResponse>;
  uploadMultiple: (files: File[], options?: UploadOptions) => Promise<CloudinaryUploadResponse[]>;
  uploading: boolean;
  progress: Record<number, number>;
  error: string | null;
  clearError: () => void;
  results: CloudinaryUploadResponse[];
  clearResults: () => void;
}

export const useCloudinaryUpload = (): UseCloudinaryUploadReturn => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<Record<number, number>>({});
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<CloudinaryUploadResponse[]>([]);
  
  const service = new CloudinaryService();

  const uploadSingle = useCallback(async (
    file: File, 
    options?: UploadOptions
  ): Promise<CloudinaryUploadResponse> => {
    setUploading(true);
    setError(null);
    setProgress({ 0: 0 });

    try {
      const result = await service.uploadFile(file, options, (progress) => {
        setProgress({ 0: progress });
      });
      
      setResults(prev => [...prev, result]);
      setProgress({});
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Upload failed';
      setError(errorMessage);
      throw err;
    } finally {
      setUploading(false);
    }
  }, []);

  const uploadMultiple = useCallback(async (
    files: File[], 
    options?: UploadOptions
  ): Promise<CloudinaryUploadResponse[]> => {
    setUploading(true);
    setError(null);
    setProgress({});

    try {
      const results = await service.uploadMultipleFiles(files, options, (fileIndex, fileProgress) => {
        setProgress(prev => ({
          ...prev,
          [fileIndex]: fileProgress
        }));
      });
      
      setResults(prev => [...prev, ...results]);
      setProgress({});
      return results;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Upload failed';
      setError(errorMessage);
      throw err;
    } finally {
      setUploading(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const clearResults = useCallback(() => {
    setResults([]);
  }, []);

  return {
    uploadSingle,
    uploadMultiple,
    uploading,
    progress,
    error,
    clearError,
    results,
    clearResults
  };
};
