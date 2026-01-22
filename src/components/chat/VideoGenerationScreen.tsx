import { useState, useEffect } from 'react';
import { useChatStore } from '../../stores/chatStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { AiPolisherTasks } from '../../lib/aiPolisher';
import { SparklesIcon, VideoCameraIcon } from '@heroicons/react/24/outline';
import ModelSelector from './ModelSelector';

type VideoMode = 'text-to-video' | 'image-to-video';

export default function VideoGenerationScreen() {
  const { currentSession, updateSessionParameters, updateSessionSettings } = useChatStore();
  const { getAPIKey, helperModel } = useSettingsStore();
  
  const [mode, setMode] = useState<VideoMode>('text-to-video');
  const [prompt, setPrompt] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [duration, setDuration] = useState<'6' | '10'>('6');
  const [promptOptimizer, setPromptOptimizer] = useState(true);
  const [isPolishing, setIsPolishing] = useState(false);

  // Initialize from session parameters
  useEffect(() => {
    if (currentSession?.modelParameters) {
      setMode(currentSession.modelParameters.videoMode || 'text-to-video');
      setPrompt(currentSession.modelParameters.prompt || '');
      setImageUrl(currentSession.modelParameters.imageUrl || '');
      setDuration(currentSession.modelParameters.duration || '6');
      setPromptOptimizer(currentSession.modelParameters.promptOptimizer ?? true);
    }
  }, [currentSession?.id]);

  // Save to session parameters (debounced)
  useEffect(() => {
    if (!currentSession) return;

    const timeoutId = setTimeout(() => {
      updateSessionParameters(currentSession.id, {
        videoMode: mode,
        prompt,
        imageUrl,
        duration,
        promptOptimizer
      });
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [mode, prompt, imageUrl, duration, promptOptimizer, currentSession?.id]);

  const handlePolishPrompt = async () => {
    const apiKey = getAPIKey('openrouter');
    if (!apiKey || !prompt.trim()) return;

    setIsPolishing(true);
    try {
      const polished = await AiPolisherTasks.polishVideoPrompt(
        prompt, 
        apiKey, 
        currentSession?.model || helperModel
      );
      setPrompt(polished);
    } catch (error) {
      console.error('Failed to polish video prompt:', error);
    } finally {
      setIsPolishing(false);
    }
  };

  const handleModelChange = (model: string) => {
    if (currentSession) {
      // Update to fal provider and the selected model
      updateSessionSettings(currentSession.id, 'fal', model);
    }
  };

  if (!currentSession) return null;

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900 p-4 gap-4 overflow-y-auto">
      {/* Header with Model Selector */}
      <div className="flex justify-between items-center bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <VideoCameraIcon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          Video Generation
        </h2>
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Model:</span>
          <ModelSelector
            provider="fal"
            selectedModel={currentSession.model || 'fal-ai/minimax/hailuo-02/pro/text-to-video'}
            onModelChange={handleModelChange}
          />
        </div>
      </div>

      {/* Mode Selector */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Generation Mode</label>
        <div className="flex gap-2">
          <button
            onClick={() => setMode('text-to-video')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              mode === 'text-to-video'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            Text to Video
          </button>
          <button
            onClick={() => setMode('image-to-video')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              mode === 'image-to-video'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            Image to Video
          </button>
        </div>
      </div>

      {/* Prompt Input */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex justify-between items-center mb-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Video Description Prompt
          </label>
          <button
            onClick={handlePolishPrompt}
            disabled={isPolishing || !prompt.trim()}
            className="text-xs flex items-center gap-1 text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 disabled:opacity-50"
          >
            <SparklesIcon className="w-3 h-3" />
            {isPolishing ? 'Polishing...' : 'Polish with AI'}
          </button>
        </div>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe the video you want to generate... Be detailed about camera movements, actions, lighting, and visual style."
          className="w-full h-32 p-3 text-sm rounded-md border border-gray-300 dark:border-gray-600 bg-transparent dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
          maxLength={2000}
        />
        <div className="flex justify-between items-center mt-1">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {prompt.length} / 2000 characters
          </p>
        </div>
      </div>

      {/* Image to Video Specific Fields */}
      {mode === 'image-to-video' && (
        <>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Image URL
            </label>
            <input
              type="text"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://example.com/image.jpg"
              className="w-full p-2 text-sm rounded-md border border-gray-300 dark:border-gray-600 bg-transparent dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Enter the URL of the image you want to animate
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Duration
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => setDuration('6')}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  duration === '6'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                6 seconds
              </button>
              <button
                onClick={() => setDuration('10')}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  duration === '10'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                10 seconds
              </button>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              Note: 10 seconds videos are not supported for 1080p resolution
            </p>
          </div>
        </>
      )}

      {/* Prompt Optimizer Toggle */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <label className="flex items-center justify-between cursor-pointer">
          <div>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Use Model's Prompt Optimizer
            </span>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Let the model automatically enhance your prompt for better results
            </p>
          </div>
          <div className="relative">
            <input
              type="checkbox"
              checked={promptOptimizer}
              onChange={(e) => setPromptOptimizer(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
          </div>
        </label>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-100 dark:border-blue-800">
        <h3 className="text-sm font-semibold text-blue-800 dark:text-blue-200 mb-2">
          Tips for Best Results:
        </h3>
        <ul className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
          <li>• Be specific about camera movements (pan, zoom, tracking shot)</li>
          <li>• Describe the lighting and atmosphere in detail</li>
          <li>• Mention the visual style (cinematic, documentary, artistic)</li>
          <li>• Include details about the setting and environment</li>
          <li>• Describe actions and movements clearly</li>
        </ul>
      </div>
    </div>
  );
}
