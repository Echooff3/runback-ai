import { useState, useRef, useEffect } from 'react';
import { PlusIcon, MusicalNoteIcon, ChatBubbleLeftRightIcon, VideoCameraIcon } from '@heroicons/react/24/outline';
import { useChatStore } from '../../stores/chatStore';
import { saveLastProvider, saveLastModel } from '../../lib/storage/localStorage';
import SessionTab from './SessionTab';
import type { Provider, SessionType } from '../../types';

interface SessionTabsProps {
  defaultProvider: Provider;
  defaultModel?: string;
}

export default function SessionTabs({ defaultProvider, defaultModel }: SessionTabsProps) {
  const {
    sessions,
    activeSessionId,
    switchSession,
    createNewSession,
    closeSessionTab,
    toggleStarSession,
    updateSessionTitle,
  } = useChatStore();

  const [showNewSessionMenu, setShowNewSessionMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowNewSessionMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleNewSession = async (type: SessionType = 'chat') => {
    await createNewSession(defaultProvider, defaultModel, undefined, type);
    // Save the current provider/model as the last used
    saveLastProvider(defaultProvider);
    if (defaultModel) {
      saveLastModel(defaultModel);
    }
    setShowNewSessionMenu(false);
  };

  const handleCloseSession = async (sessionId: string) => {
    await closeSessionTab(sessionId);
  };

  const handleToggleStar = async (sessionId: string) => {
    await toggleStarSession(sessionId);
  };

  const handleRenameSession = async (sessionId: string, newTitle: string) => {
    await updateSessionTitle(sessionId, newTitle);
  };

  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      {/* Scrollable tabs container */}
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-thin flex-1">
        {sessions.map((session) => (
          <SessionTab
            key={session.id}
            session={session}
            isActive={session.id === activeSessionId}
            onClick={() => switchSession(session.id)}
            onClose={() => handleCloseSession(session.id)}
            onToggleStar={() => handleToggleStar(session.id)}
            onRename={(newTitle) => handleRenameSession(session.id, newTitle)}
          />
        ))}
      </div>

      {/* New session button */}
      <div className="relative shrink-0" ref={menuRef}>
        <button
          onClick={() => setShowNewSessionMenu(!showNewSessionMenu)}
          className="p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
          title="New chat"
        >
          <PlusIcon className="w-5 h-5" />
        </button>

        {showNewSessionMenu && (
          <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-50 border border-gray-200 dark:border-gray-700">
            <div className="py-1">
              <button
                onClick={() => handleNewSession('chat')}
                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <ChatBubbleLeftRightIcon className="w-4 h-4 mr-2" />
                New Chat
              </button>
              <button
                onClick={() => handleNewSession('songwriting')}
                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <MusicalNoteIcon className="w-4 h-4 mr-2" />
                Songwriting
              </button>
              <button
                onClick={() => handleNewSession('video-generation')}
                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <VideoCameraIcon className="w-4 h-4 mr-2" />
                Video Generation
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
