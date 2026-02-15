import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { useFileUrl } from '../blob-storage/FileStorage';

interface RepresentativePhotoModalProps {
  photoPath: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export function RepresentativePhotoModal({ photoPath, isOpen, onClose }: RepresentativePhotoModalProps) {
  const { data: photoUrl } = useFileUrl(photoPath && isOpen ? photoPath : '');

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen || !photoPath) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
      onClick={onClose}
    >
      <div
        className="relative max-w-4xl max-h-[90vh] bg-background rounded-lg shadow-xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-2 right-2 z-10 p-2 bg-background/90 hover:bg-background rounded-full transition-colors"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-4">
          {photoUrl ? (
            <img
              src={photoUrl}
              alt="Representative"
              className="max-w-full max-h-[80vh] object-contain mx-auto"
            />
          ) : (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          )}
        </div>

        <div className="px-4 pb-4 text-sm text-muted-foreground text-center">
          <code className="bg-muted px-2 py-1 rounded">{photoPath}</code>
        </div>
      </div>
    </div>
  );
}
