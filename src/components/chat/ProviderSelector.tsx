import type { Provider } from '../../types';

interface ProviderSelectorProps {
  selectedProvider: Provider;
  onProviderChange: (provider: Provider) => void;
  providerStatus: Record<Provider, boolean>;
}

export default function ProviderSelector({ 
  selectedProvider, 
  onProviderChange,
  providerStatus 
}: ProviderSelectorProps) {
  const providers: { id: Provider; name: string; color: 'blue' | 'purple' | 'green' }[] = [
    { id: 'openrouter', name: 'OpenRouter', color: 'blue' },
    // { id: 'replicate', name: 'Replicate', color: 'purple' },
    { id: 'fal', name: 'Fal.ai', color: 'green' },
  ];

  return (
    <div className="flex gap-2">
      {providers.map((provider) => {
        const isSelected = selectedProvider === provider.id;
        const isConfigured = providerStatus[provider.id];
        
        const baseClasses = 'px-4 py-2 rounded-lg text-sm font-medium transition-colors';
        const colorClasses: Record<'blue' | 'purple' | 'green', string> = {
          blue: isSelected 
            ? 'bg-blue-600 text-white' 
            : 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/30',
          purple: isSelected 
            ? 'bg-purple-600 text-white' 
            : 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/30',
          green: isSelected 
            ? 'bg-green-600 text-white' 
            : 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 hover:bg-green-100 dark:hover:bg-green-900/30',
        };
        
        return (
          <button
            key={provider.id}
            onClick={() => onProviderChange(provider.id)}
            disabled={!isConfigured}
            className={`${baseClasses} ${colorClasses[provider.color]} ${
              !isConfigured ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            title={isConfigured ? provider.name : `${provider.name} not configured`}
          >
            {provider.name}
            {!isConfigured && ' 🔒'}
          </button>
        );
      })}
    </div>
  );
}
