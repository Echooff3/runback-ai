import { PlusIcon } from '@heroicons/react/24/outline';
import { useChatStore } from '../../stores/chatStore';
import { saveLastProvider, saveLastModel } from '../../lib/storage/localStorage';
import SessionTab from './SessionTab';
import type { Provider } from '../../types';

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

  const handleNewSession = async () => {
    await createNewSession(defaultProvider, defaultModel);
    // Save the current provider/model as the last used
    saveLastProvider(defaultProvider);
    if (defaultModel) {
      saveLastModel(defaultModel);
    }
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
    <div className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
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
      <button
        onClick={handleNewSession}
        className="p-2 shrink-0 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
        title="New chat"
      >
        <PlusIcon className="w-5 h-5" />
      </button>
    </div>
  );
}
