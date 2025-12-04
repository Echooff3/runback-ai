import { useState, useEffect, useCallback } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

export type LoadingStatus = 'connecting' | 'waiting' | 'streaming';

interface LoadingIndicatorProps {
  status?: LoadingStatus;
  onCancel?: () => void;
  startTime?: number;
}

const STATUS_MESSAGES: Record<LoadingStatus, string> = {
  connecting: 'Establishing connection...',
  waiting: 'Waiting for response...',
  streaming: 'Receiving data...',
};

export default function LoadingIndicator({
  status = 'connecting',
  onCancel,
  startTime,
}: LoadingIndicatorProps) {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [showCancel, setShowCancel] = useState(false);

  // Update elapsed time every second
  useEffect(() => {
    const effectiveStartTime = startTime ?? Date.now();
    
    const updateElapsed = () => {
      const elapsed = Math.floor((Date.now() - effectiveStartTime) / 1000);
      setElapsedSeconds(elapsed);
      
      // Show cancel button after 5 seconds
      if (elapsed >= 5) {
        setShowCancel(true);
      }
    };

    // Initial update
    updateElapsed();

    const interval = setInterval(updateElapsed, 1000);
    return () => clearInterval(interval);
  }, [startTime]);

  const formatTime = useCallback((seconds: number): string => {
    if (seconds < 60) {
      return `${seconds}s`;
    }
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  }, []);

  const handleCancel = useCallback(() => {
    if (onCancel) {
      onCancel();
    }
  }, [onCancel]);

  return (
    <div className="flex justify-start mb-4">
      <div className="bg-gray-100 dark:bg-gray-800 rounded-lg px-4 py-3 max-w-[80%]">
        <div className="flex items-center gap-3">
          {/* Animated dots */}
          <div className="flex items-center gap-1">
            <div
              className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce"
              style={{ animationDelay: '0ms' }}
            />
            <div
              className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce"
              style={{ animationDelay: '150ms' }}
            />
            <div
              className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce"
              style={{ animationDelay: '300ms' }}
            />
          </div>

          {/* Status message */}
          <div className="flex flex-col">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {STATUS_MESSAGES[status]}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400 font-mono">
              Elapsed: {formatTime(elapsedSeconds)}
            </span>
          </div>

          {/* Cancel button - show after 5 seconds */}
          {showCancel && onCancel && (
            <button
              onClick={handleCancel}
              className="ml-2 p-1.5 text-gray-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors"
              title="Cancel request"
              aria-label="Cancel request"
            >
              <XMarkIcon className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Connection status indicator */}
        <div className="mt-2 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
          <span
            className={`w-2 h-2 rounded-full ${
              status === 'streaming'
                ? 'bg-green-500 animate-pulse'
                : status === 'waiting'
                ? 'bg-yellow-500 animate-pulse'
                : 'bg-blue-500 animate-pulse'
            }`}
          />
          <span>
            {status === 'streaming'
              ? 'Connection active'
              : status === 'waiting'
              ? 'Connection established'
              : 'Connecting to API'}
          </span>
        </div>
      </div>
    </div>
  );
}
