import React, { useState, useRef } from 'react';
import CloudinaryService from '../services/cloudinary';

interface UploadProgress {
  fileIndex: number;
  progress: number;
  fileName: string;
}

const ImageUploader: React.FC = () => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([]);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cloudinaryService = new CloudinaryService();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      handleUpload(Array.from(files));
    }
  };

  const handleUpload = async (files: File[]) => {
    setUploading(true);
    setError(null);
    setUploadProgress([]);
    
    // Initialize progress tracking
    const initialProgress = files.map((file, index) => ({
      fileIndex: index,
      progress: 0,
      fileName: file.name
    }));
    setUploadProgress(initialProgress);

    try {
      const results = await cloudinaryService.uploadMultipleImages(
        files,
        (fileIndex, progress) => {
          setUploadProgress(prev => 
            prev.map(item => 
              item.fileIndex === fileIndex 
                ? { ...item, progress }
                : item
            )
          );
        }
      );

      // Lấy URLs của các ảnh đã upload
      const imageUrls = results.map(result => result.secure_url);
      setUploadedImages(prev => [...prev, ...imageUrls]);
      
      console.log('Upload completed:', results);
      
    } catch (error) {
      console.error('Upload failed:', error);
      setError(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setUploading(false);
      setUploadProgress([]);
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Image Uploader</h2>
      
      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        multiple
        accept="image/*"
        style={{ display: 'none' }}
      />
      
      {/* Upload button */}
      <button
        onClick={triggerFileSelect}
        disabled={uploading}
        className="bg-blue-500 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold py-2 px-4 rounded mb-4"
      >
        {uploading ? 'Uploading...' : 'Select Images'}
      </button>

      {/* Progress display */}
      {uploadProgress.length > 0 && (
        <div className="mb-4">
          <h3 className="font-semibold mb-2">Upload Progress:</h3>
          {uploadProgress.map((item) => (
            <div key={item.fileIndex} className="mb-2">
              <div className="flex justify-between text-sm mb-1">
                <span>{item.fileName}</span>
                <span>{item.progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${item.progress}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error display */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Uploaded images display */}
      {uploadedImages.length > 0 && (
        <div>
          <h3 className="font-semibold mb-2">Uploaded Images:</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {uploadedImages.map((url, index) => (
              <div key={index} className="border rounded-lg overflow-hidden">
                <img
                  src={url}
                  alt={`Uploaded ${index + 1}`}
                  className="w-full h-32 object-cover"
                />
                <div className="p-2 text-xs">
                  <a 
                    href={url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline truncate block"
                  >
                    View full size
                  </a>
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