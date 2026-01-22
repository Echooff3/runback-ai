import { useState, useEffect, type KeyboardEvent } from 'react';
import { SparklesIcon } from '@heroicons/react/24/solid';
import { VideoCameraIcon } from '@heroicons/react/24/outline';
import { useSettingsStore } from '../../stores/settingsStore';
import { AiPolisherTasks } from '../../lib/aiPolisher';

interface VideoGenerationInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  initialPrompt?: string;
  initialImageUrl?: string;
  initialDuration?: '6' | '10';
  initialPromptOptimizer?: boolean;
  initialMode?: 'text-to-video' | 'image-to-video';
}

export default function VideoGenerationInput({ 
  onSend, 
  disabled = false,
  initialPrompt = '',
  initialImageUrl = '',
  initialDuration = '6',
  initialPromptOptimizer = true,
  initialMode = 'text-to-video'
}: VideoGenerationInputProps) {
  const [mode, setMode] = useState<'text-to-video' | 'image-to-video'>(initialMode);
  const [prompt, setPrompt] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [duration, setDuration] = useState<'6' | '10'>(initialDuration);
  const [promptOptimizer, setPromptOptimizer] = useState(initialPromptOptimizer);
  const [isPolishing, setIsPolishing] = useState(false);
  
  const { getAPIKey, helperModel } = useSettingsStore();
  const openRouterKey = getAPIKey('openrouter');

  // Load initial values when they change
  useEffect(() => {
    if (initialPrompt) setPrompt(initialPrompt);
    if (initialImageUrl) setImageUrl(initialImageUrl);
    setDuration(initialDuration);
    setPromptOptimizer(initialPromptOptimizer);
    setMode(initialMode);
  }, [initialPrompt, initialImageUrl, initialDuration, initialPromptOptimizer, initialMode]);

  const handleSend = () => {
    if (!prompt.trim() || disabled) return;
    
    // For image-to-video, we need an image URL
    if (mode === 'image-to-video' && !imageUrl.trim()) return;

    let payload: any = {
      prompt: prompt.trim(),
      prompt_optimizer: promptOptimizer
    };

    if (mode === 'image-to-video') {
      payload.image_url = imageUrl.trim();
      payload.duration = duration;
    }
    
    onSend(JSON.stringify(payload));
    setPrompt('');
    setImageUrl('');
  };

  const handlePolishPrompt = async () => {
    if (!openRouterKey || !prompt.trim() || isPolishing) return;

    setIsPolishing(true);
    try {
      const polished = await AiPolisherTasks.polishVideoPrompt(
        prompt,
        openRouterKey,
        helperModel
      );
      setPrompt(polished);
    } catch (error) {
      console.error('Failed to polish video prompt:', error);
    } finally {
      setIsPolishing(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
      <div className="max-w-4xl mx-auto space-y-3">
        {/* Mode Selector */}
        <div className="flex gap-2">
          <button
            onClick={() => setMode('text-to-video')}
            disabled={disabled}
            className={`flex-1 py-2 px-3 rounded-md text-xs font-medium transition-colors ${
              mode === 'text-to-video'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            } disabled:opacity-50`}
          >
            Text to Video
          </button>
          <button
            onClick={() => setMode('image-to-video')}
            disabled={disabled}
            className={`flex-1 py-2 px-3 rounded-md text-xs font-medium transition-colors ${
              mode === 'image-to-video'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            } disabled:opacity-50`}
          >
            Image to Video
          </button>
        </div>

        {/* Image URL for Image-to-Video */}
        {mode === 'image-to-video' && (
          <div className="flex gap-2">
            <input
              type="text"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="Enter image URL..."
              disabled={disabled}
              className="flex-1 px-3 py-2 text-sm rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:opacity-50"
            />
            <select
              value={duration}
              onChange={(e) => setDuration(e.target.value as '6' | '10')}
              disabled={disabled}
              className="px-3 py-2 text-sm rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:opacity-50"
            >
              <option value="6">6s</option>
              <option value="10">10s</option>
            </select>
          </div>
        )}

        {/* Prompt Input */}
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Describe your video... (e.g., 'A cinematic shot of waves crashing on a beach at sunset')"
              disabled={disabled}
              className="w-full px-3 py-2 pr-10 text-sm rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none disabled:opacity-50"
              rows={2}
              maxLength={2000}
            />
            {openRouterKey && (
              <button
                onClick={handlePolishPrompt}
                disabled={disabled || isPolishing || !prompt.trim()}
                className="absolute right-2 top-2 p-1.5 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                title="Polish with AI"
              >
                <SparklesIcon className={`w-4 h-4 ${isPolishing ? 'animate-pulse' : ''}`} />
              </button>
            )}
          </div>
          
          <button
            onClick={handleSend}
            disabled={disabled || !prompt.trim() || (mode === 'image-to-video' && !imageUrl.trim())}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <VideoCameraIcon className="w-5 h-5" />
            Generate
          </button>
        </div>

        {/* Options */}
        <div className="flex items-center gap-4 text-xs text-gray-600 dark:text-gray-400">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={promptOptimizer}
              onChange={(e) => setPromptOptimizer(e.target.checked)}
              disabled={disabled}
              className="rounded border-gray-300 dark:border-gray-600 text-indigo-600 focus:ring-indigo-500 disabled:opacity-50"
            />
            <span>Use model's prompt optimizer</span>
          </label>
          <span className="text-gray-400 dark:text-gray-600">•</span>
          <span>{prompt.length}/2000 chars</span>
        </div>
      </div>
    </div>
  );
}
