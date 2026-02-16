import React from 'react';
import { X } from 'lucide-react';
import { useFileUrl } from '../blob-storage/FileStorage';

interface PhotoPreviewModalProps {
  photoPath: string | null;
  onClose: () => void;
}

export function PhotoPreviewModal({ photoPath, onClose }: PhotoPreviewModalProps) {
  const { data: imageUrl, isLoading } = useFileUrl(photoPath || '');

  if (!photoPath) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative max-w-4xl max-h-[90vh] bg-white dark:bg-gray-800 rounded-lg shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>
        
        <div className="p-4">
          {isLoading ? (
            <div className="flex items-center justify-center w-full h-96">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : imageUrl ? (
            <img
              src={imageUrl}
              alt="Leader photo"
              className="max-w-full max-h-[80vh] object-contain mx-auto"
            />
          ) : (
            <div className="flex items-center justify-center w-full h-96 text-gray-500">
              Failed to load image
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
