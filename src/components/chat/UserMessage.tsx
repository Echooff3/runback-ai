import { format } from 'date-fns';
import { ArrowPathIcon, ClipboardIcon } from '@heroicons/react/24/outline';
import type { ChatMessage } from '../../types';

interface UserMessageProps {
  message: ChatMessage;
  onRerun: () => void;
  onCopy: () => void;
}

export default function UserMessage({ message, onRerun, onCopy }: UserMessageProps) {
  const responseCount = message.responses?.length || 0;
  
  return (
    <div className="flex justify-end mb-4">
      <div className="max-w-[80%]">
        <div className="bg-indigo-600 text-white rounded-lg px-4 py-3">
          <p className="whitespace-pre-wrap break-words">{message.content}</p>
        </div>
        <div className="flex items-center justify-end gap-2 mt-1 text-xs text-gray-500 dark:text-gray-400">
          <span>{format(new Date(message.timestamp), 'h:mm a')}</span>
          {responseCount > 0 && (
            <span className="bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded">
              {responseCount} {responseCount === 1 ? 'response' : 'responses'}
            </span>
          )}
          <button
            onClick={onRerun}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
            title="Re-run prompt"
          >
            <ArrowPathIcon className="w-4 h-4" />
          </button>
          <button
            onClick={onCopy}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
            title="Copy message"
          >
            <ClipboardIcon className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
