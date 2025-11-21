import { format } from 'date-fns';
import { 
  ArrowPathIcon, 
  ClipboardIcon,
  ChevronLeftIcon,
  ChevronRightIcon 
} from '@heroicons/react/24/outline';
import type { ChatMessage } from '../../types';

interface AIMessageProps {
  message: ChatMessage;
  onRegenerate: () => void;
  onCopy: () => void;
  onNavigateResponse: (direction: 'prev' | 'next') => void;
}

export default function AIMessage({ 
  message, 
  onRegenerate, 
  onCopy,
  onNavigateResponse 
}: AIMessageProps) {
  const responses = message.responses || [];
  const currentIndex = message.currentResponseIndex ?? 0;
  const currentResponse = responses[currentIndex];
  
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
  
  return (
    <div className="flex justify-start mb-4">
      <div className="max-w-[80%]">
        <div className={`rounded-lg px-4 py-3 border ${providerColor}`}>
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
                <ChevronLeftIcon className="w-4 h-4" />
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
                <ChevronRightIcon className="w-4 h-4" />
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
              <ArrowPathIcon className="w-4 h-4" />
            </button>
            <button
              onClick={onCopy}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
              title="Copy response"
            >
              <ClipboardIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
