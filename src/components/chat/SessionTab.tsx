import { useState, useRef, useEffect } from 'react';
import { XMarkIcon, StarIcon as StarOutlineIcon } from '@heroicons/react/24/outline';
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid';
import type { ChatSession } from '../../types';

interface SessionTabProps {
  session: ChatSession;
  isActive: boolean;
  onClick: () => void;
  onClose: () => void;
  onToggleStar: () => void;
  onRename: (newTitle: string) => void;
}

export default function SessionTab({ 
  session, 
  isActive, 
  onClick, 
  onClose,
  onToggleStar,
  onRename
}: SessionTabProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(session.title || '');
  const inputRef = useRef<HTMLInputElement>(null);

  const displayTitle = session.title || 'New Chat';
  const truncatedTitle = displayTitle.length > 20 
    ? `${displayTitle.slice(0, 20)}...` 
    : displayTitle;

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClose();
  };

  const handleToggleStar = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleStar();
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditTitle(session.title || '');
    setIsEditing(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setEditTitle(session.title || '');
    }
  };

  const handleSave = () => {
    if (editTitle.trim() && editTitle !== session.title) {
      onRename(editTitle.trim());
    }
    setIsEditing(false);
  };

  return (
    <div
      onClick={onClick}
      className={`
        flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer
        transition-colors shrink-0 min-w-[120px] max-w-[200px]
        ${isActive 
          ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-900 dark:text-indigo-100' 
          : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
        }
      `}
      title={displayTitle}
    >
      {/* Star button */}
      <button
        onClick={handleToggleStar}
        className="p-0.5 hover:bg-gray-300 dark:hover:bg-gray-600 rounded transition-colors"
        title={session.isStarred ? 'Unstar session' : 'Star session'}
      >
        {session.isStarred ? (
          <StarSolidIcon className="w-4 h-4 text-yellow-500" />
        ) : (
          <StarOutlineIcon className="w-4 h-4 text-gray-400 dark:text-gray-500" />
        )}
      </button>

      {/* Title */}
      {isEditing ? (
        <input
          ref={inputRef}
          type="text"
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleSave}
          onClick={(e) => e.stopPropagation()}
          className="flex-1 min-w-0 bg-white dark:bg-gray-700 border border-indigo-300 dark:border-indigo-600 rounded px-1 py-0.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
      ) : (
        <span 
          className="flex-1 text-sm font-medium truncate"
          onDoubleClick={handleDoubleClick}
          title="Double click to rename"
        >
          {truncatedTitle}
        </span>
      )}

      {/* Close button (disabled if starred) */}
      <button
        onClick={handleClose}
        disabled={session.isStarred}
        className={`
          p-0.5 rounded transition-colors
          ${session.isStarred
            ? 'opacity-30 cursor-not-allowed'
            : 'hover:bg-gray-300 dark:hover:bg-gray-600'
          }
        `}
        title={session.isStarred ? 'Unstar to close' : 'Close tab'}
      >
        <XMarkIcon className="w-4 h-4" />
      </button>
    </div>
  );
}
