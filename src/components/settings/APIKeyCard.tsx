import { useState } from 'react';
import type { APIConfig, Provider } from '../../types';

interface APIKeyCardProps {
  provider: Provider;
  config?: APIConfig;
  onUpdate: (config: APIConfig) => void;
}

const providerInfo: Record<Provider, { name: string; color: string; icon: string }> = {
  openrouter: { name: 'OpenRouter', color: 'text-blue-500', icon: '🔵' },
  replicate: { name: 'Replicate', color: 'text-violet-500', icon: '🟣' },
  fal: { name: 'Fal.ai', color: 'text-emerald-500', icon: '🟢' },
};

export default function APIKeyCard({ provider, config, onUpdate }: APIKeyCardProps) {
  const [apiKey, setApiKey] = useState(config?.apiKey || '');
  const [showKey, setShowKey] = useState(false);
  const [testing, setTesting] = useState(false);

  const info = providerInfo[provider];

  const handleSave = () => {
    const newConfig: APIConfig = {
      provider,
      apiKey: apiKey.trim(),
      isConfigured: apiKey.trim().length > 0,
      lastTested: undefined,
      testStatus: undefined,
    };
    onUpdate(newConfig);
  };

  const handleTestConnection = async () => {
    setTesting(true);
    // TODO: Implement actual API testing
    setTimeout(() => {
      const newConfig: APIConfig = {
        ...config!,
        provider,
        apiKey,
        isConfigured: true,
        lastTested: new Date().toISOString(),
        testStatus: 'success',
      };
      onUpdate(newConfig);
      setTesting(false);
    }, 1500);
  };

  return (
    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-4 border border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="text-2xl">{info.icon}</span>
          <h4 className={`font-semibold ${info.color}`}>{info.name}</h4>
        </div>
        {config?.testStatus === 'success' && (
          <span className="text-green-500 text-xl">✅</span>
        )}
        {config?.testStatus === 'error' && (
          <span className="text-red-500 text-xl">❌</span>
        )}
        {!config?.testStatus && config?.isConfigured && (
          <span className="text-gray-400 text-xl">⚪</span>
        )}
      </div>

      {/* API Key Input */}
      <div>
        <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-200">
          API Key
        </label>
        <div className="flex space-x-2">
          <input
            type={showKey ? 'text' : 'password'}
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            onBlur={handleSave}
            placeholder="Enter your API key"
            className="flex-1 px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            onClick={() => setShowKey(!showKey)}
            className="px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-sm hover:bg-gray-50 dark:hover:bg-gray-600"
          >
            {showKey ? '👁️' : '👁️‍🗨️'}
          </button>
        </div>
      </div>

      {/* Test Connection Button */}
      {apiKey.trim() && (
        <button
          onClick={handleTestConnection}
          disabled={testing}
          className="w-full px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white rounded-md text-sm font-medium transition-colors"
        >
          {testing ? 'Testing...' : 'Test Connection'}
        </button>
      )}
    </div>
  );
}
