'use client';

import React, { useState, useRef } from 'react';
import { useCloudinaryUpload } from '@/hooks/useCloudinaryUpload';
import type { UploadOptions, CloudinaryUploadResponse } from '@/types/cloudinary';

interface ImageUploaderProps {
  onUploadComplete?: (results: CloudinaryUploadResponse[]) => void;
  onUploadStart?: () => void;
  onUploadProgress?: (progress: Record<number, number>) => void;
  onUploadError?: (error: string) => void;
  maxFiles?: number;
  uploadOptions?: UploadOptions;
  compact?: boolean; // For embedded usage like in create-post
  hideResults?: boolean; // Hide upload results display
  className?: string;
  acceptedTypes?: string;
  disabled?: boolean;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({
  onUploadComplete,
  onUploadStart,
  onUploadProgress,
  onUploadError,
  maxFiles = 5,
  uploadOptions,
  compact = false,
  hideResults = false,
  className = '',
  acceptedTypes = 'image/jpeg,image/png,image/webp,image/gif',
  disabled = false
}) => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const {
    uploadMultiple,
    uploading,
    progress,
    error,
    clearError,
    results,
    clearResults
  } = useCloudinaryUpload();

  // Call parent callbacks
  React.useEffect(() => {
    if (onUploadProgress && Object.keys(progress).length > 0) {
      onUploadProgress(progress);
    }
  }, [progress, onUploadProgress]);

  React.useEffect(() => {
    if (onUploadError && error) {
      onUploadError(error);
    }
  }, [error, onUploadError]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || disabled) return;

    const fileArray = Array.from(files).slice(0, maxFiles);
    setSelectedFiles(fileArray);
    clearError();
    clearResults();

    // Create preview URLs
    const previews = fileArray.map(file => URL.createObjectURL(file));
    setPreviewUrls(prev => {
      // Clean up previous URLs
      prev.forEach(url => URL.revokeObjectURL(url));
      return previews;
    });
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0 || disabled) return;

    try {
      if (onUploadStart) {
        onUploadStart();
      }

      const uploadResults = await uploadMultiple(selectedFiles, uploadOptions);

      if (onUploadComplete) {
        onUploadComplete(uploadResults);
      }

      // Clean up
      setSelectedFiles([]);
      previewUrls.forEach(url => URL.revokeObjectURL(url));
      setPreviewUrls([]);
      
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

    } catch (error) {
      console.error('Upload failed:', error);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setPreviewUrls(prev => {
      const newPreviews = prev.filter((_, i) => i !== index);
      // Clean up removed URL
      URL.revokeObjectURL(prev[index]);
      return newPreviews;
    });
  };

  if (compact) {
    return (
      <div className={`w-full ${className}`}>
        {/* Compact File Input */}
        <div className="space-y-4">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            multiple
            accept={acceptedTypes}
            className="hidden"
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading || disabled}
            className="w-full border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-gray-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="flex flex-col items-center space-y-2">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <span className="text-sm text-gray-600">
                {uploading ? 'Đang tải lên...' : `Chọn file (tối đa ${maxFiles})`}
              </span>
            </div>
          </button>

          {/* Selected Files Preview */}
          {selectedFiles.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {selectedFiles.map((file, index) => (
                <div key={index} className="relative group">
                  <img
                    src={previewUrls[index]}
                    alt={`Preview ${index + 1}`}
                    className="w-full h-20 object-cover rounded border"
                  />
                  <button
                    type="button"
                    onClick={() => removeFile(index)}
                    className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          {selectedFiles.length > 0 && (
            <button
              type="button"
              onClick={handleUpload}
              disabled={uploading || selectedFiles.length === 0}
              className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white py-2 px-4 rounded transition-colors"
            >
              {uploading ? 'Đang tải lên...' : `Tải lên ${selectedFiles.length} file`}
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`w-full max-w-4xl mx-auto p-6 ${className}`}>
      <h2 className="text-2xl font-bold mb-6">Image Uploader</h2>
      
      {/* File Input */}
      <div className="mb-6">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          multiple
          accept={acceptedTypes}
          className="hidden"
        />
        
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading || disabled}
          className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
        >
          {uploading ? 'Đang tải lên...' : `Chọn ảnh (tối đa ${maxFiles})`}
        </button>
      </div>

      {/* Selected Files Preview */}
      {selectedFiles.length > 0 && (
        <div className="mb-6">
          <h3 className="font-semibold mb-3">Selected Files ({selectedFiles.length}):</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-4">
            {selectedFiles.map((file, index) => (
              <div key={index} className="relative group">
                <img
                  src={previewUrls[index]}
                  alt={`Preview ${index + 1}`}
                  className="w-full h-32 object-cover rounded-lg border-2 border-gray-200"
                />
                <button
                  onClick={() => removeFile(index)}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600"
                >
                  ×
                </button>
                <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-1 rounded-b-lg truncate">
                  {file.name}
                </div>
              </div>
            ))}
          </div>
          
          <button
            onClick={handleUpload}
            disabled={uploading || selectedFiles.length === 0 || disabled}
            className="bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
          >
            {uploading ? 'Đang tải lên...' : `Tải lên ${selectedFiles.length} ảnh`}
          </button>
        </div>
      )}

      {/* Upload Progress */}
      {Object.keys(progress).length > 0 && (
        <div className="mb-6">
          <h3 className="font-semibold mb-3">Upload Progress:</h3>
          {Object.entries(progress).map(([fileIndex, fileProgress]) => (
            <div key={fileIndex} className="mb-3">
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-medium">
                  {selectedFiles[parseInt(fileIndex)]?.name || `File ${parseInt(fileIndex) + 1}`}
                </span>
                <span className="text-sm text-gray-600">{fileProgress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${fileProgress}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          <div className="flex justify-between items-center">
            <span>{error}</span>
            <button
              onClick={clearError}
              className="text-red-500 hover:text-red-700 font-bold"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Upload Results */}
      {!hideResults && results.length > 0 && (
        <div>
          <h3 className="font-semibold mb-3">Uploaded Images ({results.length}):</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {results.map((result, index) => (
              <div key={result.public_id} className="border rounded-lg overflow-hidden bg-white shadow-sm">
                <img
                  src={result.secure_url}
                  alt={`Uploaded ${index + 1}`}
                  className="w-full h-48 object-cover"
                />
                <div className="p-4">
                  <p className="text-sm font-medium truncate mb-2">
                    {result.original_filename}
                  </p>
                  <div className="text-xs text-gray-500 space-y-1">
                    <p>Size: {Math.round(result.bytes / 1024)} KB</p>
                    <p>Dimensions: {result.width} × {result.height}</p>
                    <p>Format: {result.format.toUpperCase()}</p>
                  </div>
                  <div className="mt-2 space-y-1">
                    <a 
                      href={result.secure_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline text-xs block"
                    >
                      View Original
                    </a>
                    <button
                      onClick={() => navigator.clipboard.writeText(result.secure_url)}
                      className="text-green-600 hover:underline text-xs"
                    >
                      Copy URL
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageUploader;
