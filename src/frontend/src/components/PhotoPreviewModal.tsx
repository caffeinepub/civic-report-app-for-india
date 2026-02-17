import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { useFileUrl } from '../blob-storage/FileStorage';

interface PhotoPreviewModalProps {
  photoPath: string | null;
  onClose: () => void;
}

export function PhotoPreviewModal({ photoPath, onClose }: PhotoPreviewModalProps) {
  const { data: imageUrl, isLoading } = useFileUrl(photoPath || '');

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (photoPath) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [photoPath, onClose]);

  if (!photoPath) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
      onClick={onClose}
    >
      <div
        className="relative max-h-[90vh] max-w-[90vw] bg-white rounded-lg shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-2 right-2 z-10 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-4">
          {isLoading ? (
            <div className="flex items-center justify-center min-h-[300px] min-w-[300px]">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : imageUrl ? (
            <img
              src={imageUrl}
              alt="Representative photo"
              className="max-h-[80vh] max-w-full object-contain"
            />
          ) : (
            <div className="flex items-center justify-center min-h-[300px] min-w-[300px] text-muted-foreground">
              Failed to load image
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
