import { Link } from 'react-router-dom';

export default function ChatScreen() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 flex flex-col">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Chat</h1>
          <Link
            to="/settings"
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-sm font-medium transition-colors"
          >
            Settings
          </Link>
        </div>
      </div>

      {/* Welcome Message */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="max-w-md text-center space-y-4">
          <div className="text-6xl mb-4">🤖</div>
          <h2 className="text-3xl font-bold">Welcome to RunBack AI</h2>
          <p className="text-gray-600 dark:text-gray-400">
            A privacy-first, mobile-optimized LLM Swiss Army Knife
          </p>
          <div className="pt-4">
            <Link
              to="/settings"
              className="inline-block px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors"
            >
              Configure API Keys
            </Link>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-500 pt-4">
            Phase 1: Foundation - Settings & Theme Support ✨
          </p>
        </div>
      </div>
    </div>
  );
}
