import { format } from 'date-fns';
import { useEffect, useRef } from 'react';
import { 
  ArrowPathIcon, 
  ClipboardIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline';
import type { ChatMessage, MediaAsset } from '../../types';

interface AIMessageProps {
  message: ChatMessage;
  onRegenerate: () => void;
  onCopy: () => void;
  onNavigateResponse: (direction: 'prev' | 'next') => void;
  onVisibilityChange?: (isVisible: boolean) => void;
}

export default function AIMessage({ 
  message, 
  onRegenerate, 
  onCopy,
  onNavigateResponse,
  onVisibilityChange
}: AIMessageProps) {
  const messageRef = useRef<HTMLDivElement>(null);

  const responses = message.responses || [];
  const currentIndex = message.currentResponseIndex ?? 0;
  const currentResponse = responses[currentIndex];
  
  // IntersectionObserver for viewport visibility
  useEffect(() => {
    if (!messageRef.current || !onVisibilityChange) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const visible = entry.isIntersecting;
          onVisibilityChange(visible);
        });
      },
      {
        threshold: 0.1, // Trigger when at least 10% visible
      }
    );

    observer.observe(messageRef.current);

    return () => {
      observer.disconnect();
    };
  }, [onVisibilityChange]);

  if (!currentResponse) {
    return null;
  }
  
  const hasMultipleResponses = responses.length > 1;
  const canGoBack = currentIndex > 0;
  const canGoForward = currentIndex < responses.length - 1;
  
  // Get provider color
  const providerColors = {
    openrouter: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
    replicate: 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800',
    fal: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
  };
  
  const providerColor = providerColors[currentResponse.provider] || 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700';

  // Status badge colors
  const statusColors = {
    pending: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300',
    queued: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300',
    in_progress: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-300',
    completed: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300',
    failed: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300',
  };

  const handleDownload = async (asset: MediaAsset) => {
    try {
      const response = await fetch(asset.url);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = asset.filename || `${asset.type}_${Date.now()}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download asset:', error);
    }
  };
  
  return (
    <div ref={messageRef} className="flex justify-start mb-4">
      <div className="max-w-[80%]">
        <div className={`rounded-lg px-4 py-3 border ${providerColor}`}>
          {/* Status Badge */}
          {currentResponse.status && currentResponse.status !== 'completed' && (
            <div className="mb-3">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[currentResponse.status]}`}>
                {currentResponse.status === 'in_progress' && (
                  <svg className="animate-spin -ml-0.5 mr-1.5 h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                )}
                {currentResponse.status.replace('_', ' ')}
              </span>
            </div>
          )}

          {/* Logs Display */}
          {currentResponse.logs && currentResponse.logs.length > 0 && (
            <div className="mb-3 text-xs text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 rounded p-2 max-h-32 overflow-y-auto">
              {currentResponse.logs.map((log, idx) => (
                <div key={idx} className="font-mono">
                  {log}
                </div>
              ))}
            </div>
          )}

          {/* Media Assets Display */}
          {currentResponse.mediaAssets && currentResponse.mediaAssets.length > 0 && (
            <div className="mb-3 space-y-3">
              {currentResponse.mediaAssets.map((asset, idx) => (
                <div key={idx} className="relative group">
                  {asset.type === 'image' && (
                    <div className="relative">
                      <img
                        src={asset.url}
                        alt={`Generated image ${idx + 1}`}
                        className="rounded-lg max-w-full h-auto"
                        loading="lazy"
                      />
                      <button
                        onClick={() => handleDownload(asset)}
                        className="absolute top-2 right-2 p-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Download image"
                      >
                        <ArrowDownTrayIcon className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                      </button>
                    </div>
                  )}
                  {asset.type === 'video' && (
                    <div className="relative">
                      <video
                        src={asset.url}
                        controls
                        className="rounded-lg max-w-full h-auto"
                      >
                        Your browser does not support the video tag.
                      </video>
                      <button
                        onClick={() => handleDownload(asset)}
                        className="absolute top-2 right-2 p-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Download video"
                      >
                        <ArrowDownTrayIcon className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                      </button>
                    </div>
                  )}
                  {asset.type === 'audio' && (
                    <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 rounded-lg p-3">
                      <audio
                        src={asset.url}
                        controls
                        className="flex-1"
                      >
                        Your browser does not support the audio tag.
                      </audio>
                      <button
                        onClick={() => handleDownload(asset)}
                        className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                        title="Download audio"
                      >
                        <ArrowDownTrayIcon className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Text Content */}
          <p className="whitespace-pre-wrap break-words text-gray-900 dark:text-gray-100">
            {currentResponse.content}
          </p>
          
          {/* Response navigation */}
          {hasMultipleResponses && (
            <div className="flex items-center justify-center gap-2 mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => onNavigateResponse('prev')}
                disabled={!canGoBack}
                className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                title="Previous response"
              >
                <ChevronLeftIcon className="w-5 h-5" />
              </button>
              <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">
                Response {currentIndex + 1} of {responses.length}
              </span>
              <button
                onClick={() => onNavigateResponse('next')}
                disabled={!canGoForward}
                className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                title="Next response"
              >
                <ChevronRightIcon className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
        
        {/* Metadata */}
        <div className="flex items-center justify-between gap-2 mt-1 text-xs text-gray-500 dark:text-gray-400">
          <div className="flex items-center gap-2">
            <span className="capitalize">{currentResponse.provider}</span>
            {currentResponse.model && (
              <>
                <span>•</span>
                <span>{currentResponse.model}</span>
              </>
            )}
            <span>•</span>
            <span>{format(new Date(currentResponse.timestamp), 'h:mm a')}</span>
            {currentResponse.metadata?.tokenCount && (
              <>
                <span>•</span>
                <span>{currentResponse.metadata.tokenCount} tokens</span>
              </>
            )}
            {currentResponse.metadata?.responseTime && (
              <>
                <span>•</span>
                <span>{(currentResponse.metadata.responseTime / 1000).toFixed(1)}s</span>
              </>
            )}
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={onRegenerate}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
              title="Regenerate response"
            >
              <ArrowPathIcon className="w-5 h-5" />
            </button>
            <button
              onClick={onCopy}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
              title="Copy response"
            >
              <ClipboardIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
