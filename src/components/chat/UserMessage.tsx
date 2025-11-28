import { format } from 'date-fns';
import { useMemo } from 'react';
import { ArrowPathIcon, ClipboardIcon, ChevronUpIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import type { ChatMessage } from '../../types';
import { renderMarkdown } from '../../lib/markdown';
import { triggerHapticFeedback } from '../../lib/haptics';

interface UserMessageProps {
  message: ChatMessage;
  onRerun: () => void;
  onCopy: () => void;
  onToggleCollapse: () => void;
}

export default function UserMessage({ message, onRerun, onCopy, onToggleCollapse }: UserMessageProps) {
  const responseCount = message.responses?.length || 0;
  const isCollapsed = message.isCollapsed || false;
  
  // Memoize the rendered markdown content
  const renderedContent = useMemo(() => {
    const content = message.content;
    try {
      // Check if it looks like our music generation JSON
      if (content.trim().startsWith('{') && content.includes('"lyrics_prompt"')) {
        const parsed = JSON.parse(content);
        if (parsed.prompt && parsed.lyrics_prompt) {
          // Return a special marker for JSON content
          return { type: 'music' as const, data: parsed };
        }
      }
    } catch {
      // Ignore parsing errors
    }
    // Return markdown rendered HTML
    return { type: 'markdown' as const, html: renderMarkdown(content) };
  }, [message.content]);

  const formatContent = () => {
    if (renderedContent.type === 'music') {
      return (
        <div className="flex flex-col gap-2">
          <div>
            <span className="font-bold opacity-80 text-xs uppercase tracking-wider block mb-1">Style</span>
            <span>{renderedContent.data.prompt}</span>
          </div>
          <div className="border-t border-white/20 pt-2 mt-1">
            <span className="font-bold opacity-80 text-xs uppercase tracking-wider block mb-1">Lyrics</span>
            <span className="whitespace-pre-wrap font-mono text-sm">{renderedContent.data.lyrics_prompt}</span>
          </div>
        </div>
      );
    }
    return (
      <div className="flex flex-col gap-2">
        {message.attachments?.map((att, i) => (
          att.type === 'image' && (
            <img 
              key={i} 
              src={att.content} 
              alt={att.name || 'Attached image'} 
              className="max-w-full rounded-lg mb-2 border border-white/20" 
              style={{ maxHeight: '300px' }}
            />
          )
        ))}
        <div 
          className="markdown-content markdown-content-user"
          dangerouslySetInnerHTML={{ __html: renderedContent.html }}
        />
      </div>
    );
  };

  return (
    <div className="flex justify-end mb-4">
      <div className="max-w-[80%] flex flex-col items-end">
        <div 
          className={`bg-indigo-600 text-white rounded-lg px-4 py-3 relative ${isCollapsed ? 'cursor-pointer' : ''}`}
          onClick={isCollapsed ? () => { triggerHapticFeedback(); onToggleCollapse(); } : undefined}
        >
          {!isCollapsed && (
            <button 
              onClick={(e) => { e.stopPropagation(); triggerHapticFeedback(); onToggleCollapse(); }}
              className="absolute top-2 right-2 p-1 hover:bg-indigo-500 active:bg-indigo-400 active:scale-95 rounded opacity-50 hover:opacity-100 transition-all duration-100"
              title="Collapse message"
            >
              <ChevronUpIcon className="w-4 h-4" />
            </button>
          )}

          {isCollapsed ? (
            <div className="flex items-center gap-2">
              <span className="text-sm italic opacity-80 truncate max-w-[200px]">
                {message.content.replace(/\n/g, ' ')}
              </span>
              <ChevronDownIcon className="w-4 h-4 opacity-70" />
            </div>
          ) : (
            <div className="pr-6">
              {formatContent()}
            </div>
          )}
        </div>
        {!isCollapsed && (
          <div className="flex items-center justify-end gap-2 mt-1 text-xs text-gray-500 dark:text-gray-400">
            <span>{format(new Date(message.timestamp), 'h:mm a')}</span>
            {responseCount > 0 && (
              <span className="bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded">
                {responseCount} {responseCount === 1 ? 'response' : 'responses'}
              </span>
            )}
            <button
              onClick={() => { triggerHapticFeedback(); onRerun(); }}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 active:bg-gray-200 dark:active:bg-gray-600 active:scale-95 rounded transition-all duration-100"
              title="Re-run prompt"
            >
              <ArrowPathIcon className="w-5 h-5" />
            </button>
            <button
              onClick={() => { triggerHapticFeedback(); onCopy(); }}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 active:bg-gray-200 dark:active:bg-gray-600 active:scale-95 rounded transition-all duration-100"
              title="Copy message"
            >
              <ClipboardIcon className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
