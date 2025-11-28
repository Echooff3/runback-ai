import { format } from 'date-fns';
import { useEffect, useRef, useState, useMemo } from 'react';
import { 
  ArrowPathIcon, 
  ClipboardIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ArrowDownTrayIcon,
  PencilSquareIcon,
  DocumentTextIcon,
  ChevronUpIcon,
  ChevronDownIcon
} from '@heroicons/react/24/outline';
import type { ChatMessage, MediaAsset } from '../../types';
import { renderMarkdown } from '../../lib/markdown';
import { triggerHapticFeedback } from '../../lib/haptics';

interface AIMessageProps {
  message: ChatMessage;
  onRegenerate: () => void;
  onCopy: () => void;
  onNavigateResponse: (direction: 'prev' | 'next') => void;
  onVisibilityChange?: (isVisible: boolean) => void;
  onEdit?: () => void;
  onUpdateNote?: (note: string) => void;
  onToggleCollapse: () => void;
}

export default function AIMessage({ 
  message, 
  onRegenerate, 
  onCopy,
  onNavigateResponse,
  onVisibilityChange,
  onEdit,
  onUpdateNote,
  onToggleCollapse
}: AIMessageProps) {
  const messageRef = useRef<HTMLDivElement>(null);
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [noteContent, setNoteContent] = useState('');

  const responses = message.responses || [];
  const currentIndex = message.currentResponseIndex ?? 0;
  const currentResponse = responses[currentIndex];
  const isCollapsed = currentResponse?.isCollapsed || false;
  
  // Initialize note content from response
  useEffect(() => {
    if (currentResponse) {
      setNoteContent(currentResponse.notes || '');
    }
  }, [currentResponse?.id, currentResponse?.notes]);

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

  // Memoize the rendered markdown to avoid re-rendering on every render
  const renderedContent = useMemo(() => {
    if (!currentResponse?.content) return '';
    return renderMarkdown(currentResponse.content);
  }, [currentResponse?.content]);

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

  const handleSaveNote = () => {
    if (onUpdateNote) {
      onUpdateNote(noteContent);
    }
    setIsEditingNote(false);
  };
  
  return (
    <div ref={messageRef} className="flex justify-start mb-4">
      <div className="max-w-[80%] w-full">
        <div className={`rounded-lg px-4 py-3 border ${providerColor} relative`}>
          <button 
            onClick={() => { triggerHapticFeedback(); onToggleCollapse(); }}
            className="absolute top-2 right-2 p-1 hover:bg-gray-200 dark:hover:bg-gray-700 active:bg-gray-300 dark:active:bg-gray-600 active:scale-95 rounded opacity-50 hover:opacity-100 transition-all duration-100 z-10"
            title={isCollapsed ? "Expand response" : "Collapse response"}
          >
            {isCollapsed ? <ChevronDownIcon className="w-4 h-4" /> : <ChevronUpIcon className="w-4 h-4" />}
          </button>

          {isCollapsed ? (
            <div className="text-sm text-gray-500 italic pr-6">
              {currentResponse.provider} response collapsed
            </div>
          ) : (
            <>
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
                        style={{ maxWidth: 'min(250px, 25vw)' }}
                        loading="lazy"
                      />
                      <button
                        onClick={() => { triggerHapticFeedback(); handleDownload(asset); }}
                        className="absolute top-2 right-2 p-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg opacity-0 group-hover:opacity-100 active:bg-gray-100 dark:active:bg-gray-700 active:scale-95 transition-all duration-100"
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
                        onClick={() => { triggerHapticFeedback(); handleDownload(asset); }}
                        className="absolute top-2 right-2 p-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg opacity-0 group-hover:opacity-100 active:bg-gray-100 dark:active:bg-gray-700 active:scale-95 transition-all duration-100"
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
                        onClick={() => { triggerHapticFeedback(); handleDownload(asset); }}
                        className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 active:bg-gray-300 dark:active:bg-gray-600 active:scale-95 rounded transition-all duration-100"
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
          <div 
            className="markdown-content markdown-content-ai text-gray-900 dark:text-gray-100"
            dangerouslySetInnerHTML={{ __html: renderedContent }}
          />

          {/* Notes Section */}
          {(isEditingNote || currentResponse.notes) && (
            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2 mb-2 text-xs font-medium text-gray-500 dark:text-gray-400">
                <DocumentTextIcon className="w-4 h-4" />
                <span>Notes</span>
              </div>
              {isEditingNote ? (
                <div className="space-y-2">
                  <textarea
                    value={noteContent}
                    onChange={(e) => setNoteContent(e.target.value)}
                    className="w-full p-2 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    rows={3}
                    placeholder="Add a note..."
                    autoFocus
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setIsEditingNote(false)}
                      className="px-2 py-1 text-xs text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveNote}
                      className="px-2 py-1 text-xs text-white bg-indigo-600 hover:bg-indigo-700 rounded"
                    >
                      Save
                    </button>
                  </div>
                </div>
              ) : (
                <div 
                  className="text-sm text-gray-700 dark:text-gray-300 bg-yellow-50 dark:bg-yellow-900/10 p-2 rounded border border-yellow-100 dark:border-yellow-900/30 cursor-pointer hover:bg-yellow-100 dark:hover:bg-yellow-900/20 transition-colors"
                  onClick={() => setIsEditingNote(true)}
                  title="Click to edit note"
                >
                  {currentResponse.notes}
                </div>
              )}
            </div>
          )}
          
          {/* Response navigation */}
          {hasMultipleResponses && (
            <div className="flex items-center justify-center gap-2 mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => { if (canGoBack) { triggerHapticFeedback(); onNavigateResponse('prev'); } }}
                disabled={!canGoBack}
                className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 active:bg-gray-300 dark:active:bg-gray-600 active:scale-95 rounded transition-all duration-100 disabled:opacity-30 disabled:cursor-not-allowed disabled:active:scale-100"
                title="Previous response"
              >
                <ChevronLeftIcon className="w-5 h-5" />
              </button>
              <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">
                Response {currentIndex + 1} of {responses.length}
              </span>
              <button
                onClick={() => { if (canGoForward) { triggerHapticFeedback(); onNavigateResponse('next'); } }}
                disabled={!canGoForward}
                className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 active:bg-gray-300 dark:active:bg-gray-600 active:scale-95 rounded transition-all duration-100 disabled:opacity-30 disabled:cursor-not-allowed disabled:active:scale-100"
                title="Next response"
              >
                <ChevronRightIcon className="w-5 h-5" />
              </button>
            </div>
          )}
          </>
          )}
        </div>
        
        {/* Metadata */}
        {!isCollapsed && (
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
            {onUpdateNote && !isEditingNote && !currentResponse.notes && (
              <button
                onClick={() => { triggerHapticFeedback(); setIsEditingNote(true); }}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 active:bg-gray-200 dark:active:bg-gray-600 active:scale-95 rounded transition-all duration-100"
                title="Add note"
              >
                <DocumentTextIcon className="w-5 h-5" />
              </button>
            )}
            {onEdit && (
              <button
                onClick={() => { triggerHapticFeedback(); onEdit(); }}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 active:bg-gray-200 dark:active:bg-gray-600 active:scale-95 rounded transition-all duration-100"
                title="Edit prompt"
              >
                <PencilSquareIcon className="w-5 h-5" />
              </button>
            )}
            <button
              onClick={() => { triggerHapticFeedback(); onRegenerate(); }}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 active:bg-gray-200 dark:active:bg-gray-600 active:scale-95 rounded transition-all duration-100"
              title="Regenerate response"
            >
              <ArrowPathIcon className="w-5 h-5" />
            </button>
            <button
              onClick={() => { triggerHapticFeedback(); onCopy(); }}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 active:bg-gray-200 dark:active:bg-gray-600 active:scale-95 rounded transition-all duration-100"
              title="Copy response"
            >
              <ClipboardIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
        )}
      </div>
    </div>
  );
}
