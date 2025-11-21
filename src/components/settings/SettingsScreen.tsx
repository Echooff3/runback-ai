import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSettingsStore } from '../../stores/settingsStore';
import ThemeToggle from './ThemeToggle';
import APIKeyCard from './APIKeyCard';
import SessionHistory from './SessionHistory';
import type { Provider } from '../../types';

export default function SettingsScreen() {
  const navigate = useNavigate();
  const { loadAPIConfigs, updateAPIConfig, getProviderConfig, htmlGenerationModel, setHtmlGenerationModel } = useSettingsStore();

  useEffect(() => {
    loadAPIConfigs();
  }, [loadAPIConfigs]);

  const providers: Provider[] = ['openrouter', 'replicate', 'fal'];

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/')}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            aria-label="Back to chat"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          <h1 className="text-2xl font-bold">Settings</h1>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-6 space-y-8 max-w-2xl mx-auto">
        {/* Theme Section */}
        <section>
          <ThemeToggle />
        </section>

        {/* Divider */}
        <div className="border-t border-gray-200 dark:border-gray-700"></div>

        {/* API Keys Section */}
        <section>
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-2">API Keys</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Configure your API keys for AI providers. Keys are stored locally in your browser.
            </p>
          </div>

          <div className="space-y-4">
            {providers.map((provider) => (
              <APIKeyCard
                key={provider}
                provider={provider}
                config={getProviderConfig(provider)}
                onUpdate={updateAPIConfig}
              />
            ))}
          </div>
        </section>

        {/* Divider */}
        <div className="border-t border-gray-200 dark:border-gray-700"></div>

        {/* HTML Generation Model Section */}
        <section>
          <div className="mb-4">
            <h3 className="text-lg font-semibold mb-2">HTML Generation Model</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Specify the OpenRouter model ID used to generate parameter forms.
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                value={htmlGenerationModel}
                onChange={(e) => setHtmlGenerationModel(e.target.value)}
                placeholder="e.g. x-ai/grok-3"
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              />
              <button
                onClick={() => setHtmlGenerationModel('x-ai/grok-3')}
                className="px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors text-sm font-medium"
              >
                Reset to Default
              </button>
            </div>
          </div>
        </section>

        {/* Divider */}
        <div className="border-t border-gray-200 dark:border-gray-700"></div>

        {/* Session History Section */}
        <section>
          <SessionHistory />
        </section>

        {/* Privacy Notice */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <p className="text-sm text-blue-900 dark:text-blue-200">
            🔒 <strong>Privacy Notice:</strong> All your data is stored locally in your browser. 
            Your API keys never leave your device except when making direct API calls to the 
            providers you've configured.
          </p>
        </div>
      </div>
    </div>
  );
}
