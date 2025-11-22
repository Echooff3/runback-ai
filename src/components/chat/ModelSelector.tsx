import { useState } from 'react';
import { ChevronDownIcon, AdjustmentsHorizontalIcon } from '@heroicons/react/24/outline';
import type { Provider, ModelParameters } from '../../types';
import ModelSelectorModal from './ModelSelectorModal';
import ModelParametersModal from './ModelParametersModal';

interface ModelSelectorProps {
  provider: Provider;
  selectedModel: string;
  onModelChange: (model: string) => void;
  onParametersChange?: (parameters: ModelParameters) => void;
  showParametersButton?: boolean;
  falApiKey?: string;
  openrouterApiKey?: string;
  currentParameters?: ModelParameters;
}

export default function ModelSelector({ 
  provider, 
  selectedModel, 
  onModelChange,
  onParametersChange,
  showParametersButton = false,
  falApiKey = '',
  openrouterApiKey = '',
  currentParameters,
}: ModelSelectorProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isParametersModalOpen, setIsParametersModalOpen] = useState(false);

  // Get provider color
  const getProviderColor = () => {
    switch (provider) {
      case 'openrouter':
        return {
          bg: 'bg-blue-600',
          hover: 'hover:bg-blue-700',
          active: 'active:bg-blue-800',
          ring: 'focus:ring-blue-500'
        };
      case 'replicate':
        return {
          bg: 'bg-purple-600',
          hover: 'hover:bg-purple-700',
          active: 'active:bg-purple-800',
          ring: 'focus:ring-purple-500'
        };
      case 'fal':
        return {
          bg: 'bg-green-600',
          hover: 'hover:bg-green-700',
          active: 'active:bg-green-800',
          ring: 'focus:ring-green-500'
        };
      default:
        return {
          bg: 'bg-indigo-600',
          hover: 'hover:bg-indigo-700',
          active: 'active:bg-indigo-800',
          ring: 'focus:ring-indigo-500'
        };
    }
  };

  const colors = getProviderColor();

  // Get display name for selected model
  const getModelDisplayName = () => {
    if (!selectedModel) return 'Select model';
    
    // Extract model name from ID (e.g., "openai/gpt-4" -> "gpt-4")
    const parts = selectedModel.split('/');
    const modelName = parts[parts.length - 1];
    
    // Remove version/hash suffix if present (e.g., "model:abc123" -> "model")
    const cleanName = modelName.split(':')[0];
    
    // Format common model names
    const formatted = cleanName
      .replace(/gpt-(\d+)/i, 'GPT-$1')
      .replace(/claude-(\d+)/i, 'Claude $1')
      .replace(/llama-(\d+)/i, 'Llama $1')
      .replace(/mixtral/i, 'Mixtral')
      .replace(/mistral/i, 'Mistral')
      .replace(/gemini/i, 'Gemini');
    
    return formatted;
  };

  const handleParametersChange = (parameters: ModelParameters) => {
    console.log('[ModelSelector] handleParametersChange called with:', parameters);
    if (onParametersChange) {
      onParametersChange(parameters);
      console.log('[ModelSelector] Passed parameters to parent');
    }
  };

  return (
    <>
      <div className="inline-flex items-center gap-2">
        <button
          onClick={() => setIsModalOpen(true)}
          className={`inline-flex items-center gap-2 ${colors.bg} ${colors.hover} ${colors.active} text-white px-4 py-2 rounded-lg text-sm font-medium shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${colors.ring} dark:focus:ring-offset-gray-900`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
          </svg>
          <span className="truncate max-w-[150px] sm:max-w-[200px]">
            {getModelDisplayName()}
          </span>
          <ChevronDownIcon className="w-4 h-4 flex-shrink-0" />
        </button>

        {showParametersButton && selectedModel && (
          <button
            onClick={() => setIsParametersModalOpen(true)}
            className="p-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors"
            title="Configure model parameters"
          >
            <AdjustmentsHorizontalIcon className="w-5 h-5" />
          </button>
        )}
      </div>

      <ModelSelectorModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        provider={provider}
        selectedModel={selectedModel}
        onModelSelect={onModelChange}
      />

      {showParametersButton && selectedModel && (
        <ModelParametersModal
          isOpen={isParametersModalOpen}
          onClose={() => setIsParametersModalOpen(false)}
          modelId={selectedModel}
          provider={provider}
          falApiKey={falApiKey}
          openrouterApiKey={openrouterApiKey}
          onParametersChange={handleParametersChange}
          initialParameters={currentParameters}
        />
      )}
    </>
  );
}
