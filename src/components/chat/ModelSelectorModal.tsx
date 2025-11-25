import { useEffect, useState, useRef } from 'react';
import { XMarkIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import type { Provider } from '../../types';
import { useSettingsStore } from '../../stores/settingsStore';

interface Model {
  id: string;
  name: string;
  description?: string;
  context_length?: number;
  pricing?: {
    prompt?: string;
    completion?: string;
  };
}

interface ModelSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  provider: Provider;
  selectedModel: string;
  onModelSelect: (modelId: string) => void;
}

export default function ModelSelectorModal({
  isOpen,
  onClose,
  provider,
  selectedModel,
  onModelSelect,
}: ModelSelectorModalProps) {
  const [models, setModels] = useState<Model[]>([]);
  const [filteredModels, setFilteredModels] = useState<Model[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const { getAPIKey, helperModel } = useSettingsStore();
  const [helperModelError, setHelperModelError] = useState<string | null>(null);

  // Fetch models when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchModels();
      setSearchQuery('');
      // Focus search input when modal opens
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, provider]);

  // Fuzzy search filter
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredModels(models);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = models.filter(model => {
      const searchText = `${model.name} ${model.id} ${model.description || ''}`.toLowerCase();
      
      // Simple fuzzy matching: check if all characters appear in order
      let searchIndex = 0;
      for (let i = 0; i < searchText.length && searchIndex < query.length; i++) {
        if (searchText[i] === query[searchIndex]) {
          searchIndex++;
        }
      }
      
      return searchIndex === query.length;
    });

    setFilteredModels(filtered);
  }, [searchQuery, models]);

  const fetchModels = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const apiKey = getAPIKey(provider);
      if (!apiKey) {
        throw new Error(`No API key configured for ${provider}`);
      }

      let fetchedModels: Model[] = [];

      switch (provider) {
        case 'openrouter':
          fetchedModels = await fetchOpenRouterModels(apiKey);
          break;
        case 'replicate':
          fetchedModels = await fetchReplicateModels(apiKey);
          break;
        case 'fal':
          fetchedModels = await fetchFalModels(apiKey);
          break;
      }

      setModels(fetchedModels);
      setFilteredModels(fetchedModels);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch models';
      setError(errorMessage);
      console.error('Error fetching models:', err);
      
      // Fallback to default models
      setModels(getDefaultModels(provider));
      setFilteredModels(getDefaultModels(provider));
    } finally {
      setIsLoading(false);
    }
  };

  const fetchOpenRouterModels = async (apiKey: string): Promise<Model[]> => {
    setHelperModelError(null);
    const response = await fetch('https://openrouter.ai/api/v1/models', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    });

    if (!response.ok) {
      throw new Error(`OpenRouter API error: ${response.statusText}`);
    }

    const data = await response.json() as { data: Array<{
      id: string;
      name?: string;
      description?: string;
      context_length?: number;
      pricing?: { prompt?: string; completion?: string };
    }>};
    
    const models = data.data.map((model) => ({
      id: model.id,
      name: model.name || model.id,
      description: model.description,
      context_length: model.context_length,
      pricing: model.pricing,
    }));

    // Prioritize helper model
    const helperIndex = models.findIndex(m => m.id === helperModel);
    if (helperIndex !== -1) {
      const [helper] = models.splice(helperIndex, 1);
      models.unshift(helper);
    } else {
      try {
        // Try to fetch helper model info specifically if not in list
        // Note: OpenRouter doesn't have a specific single-model endpoint documented that is standard,
        // but we can try to add it if we know it exists or just show error.
        // For now, we'll show the error as requested.
        setHelperModelError(`Helper model '${helperModel}' not found in available models.`);
      } catch (e) {
        console.error('Failed to process helper model:', e);
      }
    }

    return models;
  };

  const fetchReplicateModels = async (_apiKey: string): Promise<Model[]> => {
    // Using static model list due to CORS restrictions on browser-side API calls
    return getDefaultModels('replicate');
  };

  const fetchFalModels = async (apiKey: string): Promise<Model[]> => {
    const pinnedModels: Model[] = [
      { id: 'fal-ai/minimax-music/v1.5', name: 'Minimax Music 1.5', description: 'Generate music with Minimax 1.5' },
      { id: 'fal-ai/minimax-music/v2', name: 'Minimax Music 2.0', description: 'Generate music with Minimax 2.0' },
      { id: 'fal-ai/flux/dev', name: 'Flux Dev', description: 'Generate images with Flux Dev' },
    ];

    try {
      const response = await fetch('https://api.fal.ai/v1/models', {
        method: 'GET',
        headers: {
          Authorization: `Key ${apiKey}`,
        },
      });

      if (!response.ok) {
        throw new Error(`FAL API error: ${response.statusText}`);
      }

      const data = await response.json();
      const modelsList = data.models || [];
      
      // Transform FAL API response to our Model interface
      const fetchedModels = modelsList.map((model: any) => ({
        id: model.endpoint_id,
        name: model.metadata?.display_name || model.endpoint_id,
        description: model.metadata?.description,
        // FAL doesn't provide context_length in the API response
      }));

      // Filter out pinned models from fetched models to avoid duplicates
      const otherModels = fetchedModels.filter((m: Model) => !pinnedModels.some(pm => pm.id === m.id));

      return [...pinnedModels, ...otherModels];
    } catch (err) {
      console.error('Failed to fetch FAL models, using defaults:', err);
      return getDefaultModels('fal');
    }
  };

  const getDefaultModels = (provider: Provider): Model[] => {
    const defaults = {
      openrouter: [
        { id: 'x-ai/grok-3-mini', name: 'Grok 3 Mini', description: 'Grok 3 Mini model' },
        { id: 'openai/gpt-4-turbo', name: 'GPT-4 Turbo', description: 'Most capable GPT-4 model' },
        { id: 'openai/gpt-4', name: 'GPT-4', description: 'High intelligence model' },
        { id: 'openai/gpt-3.5-turbo', name: 'GPT-3.5 Turbo', description: 'Fast and efficient' },
        { id: 'anthropic/claude-3-opus', name: 'Claude 3 Opus', description: 'Most capable Claude model' },
        { id: 'anthropic/claude-3-sonnet', name: 'Claude 3 Sonnet', description: 'Balanced performance' },
        { id: 'anthropic/claude-3-haiku', name: 'Claude 3 Haiku', description: 'Fastest Claude model' },
        { id: 'meta-llama/llama-3-70b-instruct', name: 'Llama 3 70B', description: 'Large open model' },
        { id: 'meta-llama/llama-3-8b-instruct', name: 'Llama 3 8B', description: 'Small efficient model' },
        { id: 'google/gemini-pro', name: 'Gemini Pro', description: 'Google\'s multimodal model' },
        { id: 'mistralai/mixtral-8x7b-instruct', name: 'Mixtral 8x7B', description: 'Mixture of experts' },
      ],
      replicate: [
        { id: 'meta/meta-llama-3-70b-instruct', name: 'Llama 3 70B Instruct', description: 'Large instruction-tuned model' },
        { id: 'meta/meta-llama-3-8b-instruct', name: 'Llama 3 8B Instruct', description: 'Efficient instruction model' },
        { id: 'mistralai/mixtral-8x7b-instruct-v0.1', name: 'Mixtral 8x7B Instruct', description: 'Mixture of experts' },
        { id: 'mistralai/mistral-7b-instruct-v0.2', name: 'Mistral 7B Instruct', description: 'Efficient 7B model' },
      ],
      fal: [
        { id: 'fal-ai/minimax-music/v1.5', name: 'Minimax Music 1.5', description: 'Generate music with Minimax 1.5' },
        { id: 'fal-ai/minimax-music/v2', name: 'Minimax Music 2.0', description: 'Generate music with Minimax 2.0' },
        { id: 'fal-ai/flux/dev', name: 'Flux Dev', description: 'Generate images with Flux Dev' },
        { id: 'fal-ai/fast-llm', name: 'Fast LLM', description: 'Quick inference model' },
        { id: 'fal-ai/llama-3-70b', name: 'Llama 3 70B', description: 'Large language model' },
        { id: 'fal-ai/llama-3-8b', name: 'Llama 3 8B', description: 'Efficient language model' },
      ],
    };

    return defaults[provider];
  };

  const handleSelectModel = (modelId: string) => {
    onModelSelect(modelId);
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent, modelId: string) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleSelectModel(modelId);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full h-full sm:h-auto sm:max-h-[90vh] sm:max-w-2xl sm:rounded-xl bg-white dark:bg-gray-900 shadow-xl flex flex-col animate-slide-up sm:animate-none">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
              Select Model
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              {provider === 'openrouter' ? 'OpenRouter' : provider === 'replicate' ? 'Replicate' : 'Fal.ai'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            aria-label="Close modal"
          >
            <XMarkIcon className="w-6 h-6 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Search */}
        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search models..."
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Models List */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          ) : error ? (
            <div className="px-4 py-8 text-center">
              <p className="text-red-600 dark:text-red-400 mb-2">Failed to fetch models</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Showing default models instead
              </p>
            </div>
          ) : filteredModels.length === 0 ? (
            <div className="px-4 py-12 text-center">
              <p className="text-gray-500 dark:text-gray-400">No models found</p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                Try a different search term
              </p>
            </div>
          ) : (
            <div className="py-2">
              {helperModelError && (
                <div className="px-4 py-2 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200 text-sm border-b border-yellow-100 dark:border-yellow-800 mb-2">
                  Warning: {helperModelError}
                </div>
              )}
              {filteredModels.map((model) => {
                const isSelected = model.id === selectedModel;
                
                return (
                  <button
                    key={model.id}
                    onClick={() => handleSelectModel(model.id)}
                    onKeyDown={(e) => handleKeyDown(e, model.id)}
                    className={`
                      w-full px-4 py-3 text-left transition-colors
                      hover:bg-gray-50 dark:hover:bg-gray-800
                      focus:outline-none focus:bg-gray-50 dark:focus:bg-gray-800
                      ${isSelected ? 'bg-indigo-50 dark:bg-indigo-900/20' : ''}
                    `}
                    style={{ minHeight: '2.75rem' }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className={`
                            font-medium truncate
                            ${isSelected 
                              ? 'text-indigo-600 dark:text-indigo-400' 
                              : 'text-gray-900 dark:text-gray-100'
                            }
                          `}>
                            {model.name}
                          </p>
                          {isSelected && (
                            <span className="flex-shrink-0 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300">
                              Selected
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">
                          {model.id}
                        </p>
                        {model.description && (
                          <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 line-clamp-2">
                            {model.description}
                          </p>
                        )}
                        {model.context_length && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            Context: {model.context_length.toLocaleString()} tokens
                          </p>
                        )}
                      </div>
                      {isSelected && (
                        <div className="flex-shrink-0 text-indigo-600 dark:text-indigo-400">
                          <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex-shrink-0">
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
            {filteredModels.length} model{filteredModels.length !== 1 ? 's' : ''} available
          </p>
        </div>
      </div>
    </div>
  );
}
