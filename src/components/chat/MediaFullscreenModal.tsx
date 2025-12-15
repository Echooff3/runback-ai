import { useEffect } from 'react';
import { XMarkIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';

interface MediaFullscreenModalProps {
  isOpen: boolean;
  onClose: () => void;
  mediaUrl: string;
  mediaType: 'image' | 'video';
  onDownload?: () => void;
}

export default function MediaFullscreenModal({
  isOpen,
  onClose,
  mediaUrl,
  mediaType,
  onDownload
}: MediaFullscreenModalProps) {
  useEffect(() => {
    if (isOpen) {
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    // Cleanup on unmount
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center"
      onClick={onClose}
    >
      {/* Modal content */}
      <div 
        className="relative max-w-[95vw] max-h-[95vh] flex items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 bg-gray-800/80 hover:bg-gray-700/80 rounded-full transition-colors"
          title="Close (Esc)"
        >
          <XMarkIcon className="w-6 h-6 text-white" />
        </button>

        {/* Download button */}
        {onDownload && (
          <button
            onClick={onDownload}
            className="absolute top-4 right-16 z-10 p-2 bg-gray-800/80 hover:bg-gray-700/80 rounded-full transition-colors"
            title="Download"
          >
            <ArrowDownTrayIcon className="w-6 h-6 text-white" />
          </button>
        )}

        {/* Media content */}
        {mediaType === 'image' ? (
          <img
            src={mediaUrl}
            alt="Fullscreen view"
            className="max-w-full max-h-[95vh] object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <video
            src={mediaUrl}
            controls
            autoPlay
            className="max-w-full max-h-[95vh] object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          >
            Your browser does not support the video tag.
          </video>
        )}
      </div>
    </div>
  );
}
