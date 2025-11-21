import { ChevronDownIcon } from '@heroicons/react/24/outline';
import type { Provider } from '../../types';
import { OPENROUTER_MODELS, REPLICATE_MODELS, FAL_MODELS } from '../../lib/api';

interface ModelSelectorProps {
  provider: Provider;
  selectedModel: string;
  onModelChange: (model: string) => void;
}

export default function ModelSelector({ 
  provider, 
  selectedModel, 
  onModelChange 
}: ModelSelectorProps) {
  const getModelsForProvider = () => {
    switch (provider) {
      case 'openrouter':
        return OPENROUTER_MODELS;
      case 'replicate':
        return REPLICATE_MODELS;
      case 'fal':
        return FAL_MODELS;
      default:
        return [];
    }
  };

  const models = getModelsForProvider();

  return (
    <div className="relative inline-block">
      <select
        value={selectedModel}
        onChange={(e) => onModelChange(e.target.value)}
        className="appearance-none bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 pr-10 text-sm font-medium text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors cursor-pointer"
      >
        <option value="" disabled>Select model</option>
        {models.map((model) => (
          <option key={model.id} value={model.id}>
            {model.name}
          </option>
        ))}
      </select>
      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
        <ChevronDownIcon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
      </div>
    </div>
  );
}
