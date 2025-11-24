import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { 
  TrashIcon, 
  MagnifyingGlassIcon,
  StarIcon as StarOutlineIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid';
import { useChatStore } from '../../stores/chatStore';
import type { ChatSession } from '../../types';

export default function SessionHistory() {
  const { 
    sessions,
    loadAllSessions, 
    deleteSession,
    deleteAllNonStarred,
    toggleStarSession,
    reopenSession,
  } = useChatStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterStarred, setFilterStarred] = useState(false);
  const [filterClosed, setFilterClosed] = useState<'all' | 'open' | 'closed'>('all');

  useEffect(() => {
    loadAllSessions();
  }, [loadAllSessions]);

  const handleDelete = async (sessionId: string, sessionTitle?: string) => {
    const confirmed = window.confirm(
      `Are you sure you want to permanently delete "${sessionTitle || 'this session'}"? This action cannot be undone.`
    );
    
    if (confirmed) {
      const result = await deleteSession(sessionId);
      if (!result.success) {
        alert(result.error || 'Failed to delete session');
      } else {
        // Reload all sessions to update the list
        await loadAllSessions();
      }
    }
  };

  const handleToggleStar = async (sessionId: string) => {
    await toggleStarSession(sessionId);
    await loadAllSessions();
  };

  const handleReopen = async (sessionId: string) => {
    await reopenSession(sessionId);
  };

  const handleDeleteAll = async () => {
    const nonStarredCount = sessions.filter(s => !s.isStarred).length;
    
    if (nonStarredCount === 0) {
      alert('No non-starred conversations to delete.');
      return;
    }
    
    const confirmed = window.confirm(
      `Are you sure you want to permanently delete all ${nonStarredCount} non-starred conversation${nonStarredCount !== 1 ? 's' : ''}? \n\nStarred conversations will be kept. This action cannot be undone.`
    );
    
    if (confirmed) {
      const result = await deleteAllNonStarred();
      if (!result.success) {
        alert(result.error || 'Failed to delete conversations');
      } else {
        // Reload all sessions to update the list
        await loadAllSessions();
        alert(`Successfully deleted ${result.deletedCount} conversation${result.deletedCount !== 1 ? 's' : ''}.`);
      }
    }
  };

  // Filter and search sessions
  const filteredSessions = sessions.filter(session => {
    // Search filter
    const matchesSearch = !searchQuery || 
      (session.title?.toLowerCase().includes(searchQuery.toLowerCase())) ||
      session.provider.toLowerCase().includes(searchQuery.toLowerCase()) ||
      session.model?.toLowerCase().includes(searchQuery.toLowerCase());

    // Starred filter
    const matchesStarred = !filterStarred || session.isStarred;

    // Closed filter
    const matchesClosed = 
      filterClosed === 'all' ||
      (filterClosed === 'open' && !session.isClosed) ||
      (filterClosed === 'closed' && session.isClosed);

    return matchesSearch && matchesStarred && matchesClosed;
  });

  const getMessageCount = (session: ChatSession) => {
    return session.messages.length;
  };

  const getProviderColor = (provider: string) => {
    const colors = {
      openrouter: 'text-blue-600 dark:text-blue-400',
      replicate: 'text-purple-600 dark:text-purple-400',
      fal: 'text-green-600 dark:text-green-400',
    };
    return colors[provider as keyof typeof colors] || 'text-gray-600 dark:text-gray-400';
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Chat History</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={handleDeleteAll}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 border border-red-300 dark:border-red-700 rounded-lg transition-colors"
            title="Delete all non-starred conversations"
          >
            <ExclamationTriangleIcon className="w-4 h-4" />
            <span>Delete All</span>
          </button>
          <button
            onClick={() => loadAllSessions()}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            title="Refresh"
          >
            <ArrowPathIcon className="w-5 h-5" />
          </button>
        </div>
      </div>

      <p className="text-sm text-gray-600 dark:text-gray-400">
        View and manage all your chat sessions. Starred sessions cannot be deleted.
      </p>

      {/* Search and filters */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search sessions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent"
          />
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setFilterStarred(!filterStarred)}
            className={`px-4 py-2 rounded-lg border transition-colors ${
              filterStarred
                ? 'bg-yellow-100 dark:bg-yellow-900/30 border-yellow-300 dark:border-yellow-700 text-yellow-900 dark:text-yellow-100'
                : 'border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
            title="Show starred only"
          >
            <StarSolidIcon className="w-5 h-5" />
          </button>

          <select
            value={filterClosed}
            onChange={(e) => setFilterClosed(e.target.value as 'all' | 'open' | 'closed')}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <option value="all">All Sessions</option>
            <option value="open">Open Only</option>
            <option value="closed">Closed Only</option>
          </select>
        </div>
      </div>

      {/* Session count */}
      <p className="text-sm text-gray-500 dark:text-gray-400">
        {filteredSessions.length} {filteredSessions.length === 1 ? 'session' : 'sessions'}
        {filterStarred && ' (starred)'}
      </p>

      {/* Sessions list */}
      <div className="space-y-2">
        {filteredSessions.length === 0 ? (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <p>No sessions found</p>
          </div>
        ) : (
          filteredSessions.map((session) => (
            <div
              key={session.id}
              className={`
                p-4 rounded-lg border transition-colors
                ${session.isClosed
                  ? 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700'
                  : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-700'
                }
              `}
            >
              <div className="flex items-start justify-between gap-4">
                {/* Session info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <button
                      onClick={() => handleToggleStar(session.id)}
                      className="shrink-0"
                      title={session.isStarred ? 'Unstar' : 'Star'}
                    >
                      {session.isStarred ? (
                        <StarSolidIcon className="w-5 h-5 text-yellow-500" />
                      ) : (
                        <StarOutlineIcon className="w-5 h-5 text-gray-400 dark:text-gray-500 hover:text-yellow-500" />
                      )}
                    </button>

                    <h4 className="font-medium text-gray-900 dark:text-gray-100 truncate">
                      {session.title || 'Untitled Chat'}
                    </h4>

                    {session.isClosed && (
                      <span className="px-2 py-0.5 text-xs bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded">
                        Closed
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <span className={`font-medium capitalize ${getProviderColor(session.provider)}`}>
                      {session.provider}
                    </span>
                    {session.model && (
                      <>
                        <span>•</span>
                        <span className="truncate">{session.model}</span>
                      </>
                    )}
                    <span>•</span>
                    <span>{getMessageCount(session)} messages</span>
                    <span>•</span>
                    <span>{format(new Date(session.updatedAt), 'MMM d, yyyy h:mm a')}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  {session.isClosed && (
                    <button
                      onClick={() => handleReopen(session.id)}
                      className="p-2 hover:bg-green-100 dark:hover:bg-green-900/30 text-green-600 dark:text-green-400 rounded-lg transition-colors"
                      title="Reopen session"
                    >
                      <ArrowPathIcon className="w-5 h-5" />
                    </button>
                  )}

                  <button
                    onClick={() => handleDelete(session.id, session.title)}
                    disabled={session.isStarred}
                    className={`
                      p-2 rounded-lg transition-colors
                      ${session.isStarred
                        ? 'opacity-30 cursor-not-allowed text-gray-400'
                        : 'hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400'
                      }
                    `}
                    title={session.isStarred ? 'Unstar to delete' : 'Delete session permanently'}
                  >
                    <TrashIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
