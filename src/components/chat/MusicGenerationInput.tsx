import { useState, useEffect } from 'react';
import { PaperAirplaneIcon, StarIcon } from '@heroicons/react/24/solid';
import { MusicalNoteIcon } from '@heroicons/react/24/outline';
import { useSettingsStore } from '../../stores/settingsStore';
import { AiPolisherTasks } from '../../lib/aiPolisher';

interface MusicGenerationInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  initialStyle?: string;
  initialLyrics?: string;
  selectedModel?: string;
}

export default function MusicGenerationInput({ 
  onSend, 
  disabled = false,
  initialStyle = '',
  initialLyrics = '',
  selectedModel = 'fal-ai/minimax-music/v1.5'
}: MusicGenerationInputProps) {
  const [style, setStyle] = useState('');
  const [lyrics, setLyrics] = useState('');
  const [isPolishingStyle, setIsPolishingStyle] = useState(false);
  const [isPolishingLyrics, setIsPolishingLyrics] = useState(false);
  
  const { getAPIKey, helperModel } = useSettingsStore();
  const openRouterKey = getAPIKey('openrouter');

  // Load initial values when they change
  useEffect(() => {
    if (initialStyle) setStyle(initialStyle);
    if (initialLyrics) setLyrics(initialLyrics);
  }, [initialStyle, initialLyrics]);

  const handleSend = () => {
    if (!style.trim() || !lyrics.trim() || disabled) return;

    const payload = JSON.stringify({
      prompt: style.trim(),
      lyrics_prompt: lyrics.trim()
    });
    
    onSend(payload);
    setStyle('');
    setLyrics('');
  };

  const handlePolishStyle = async () => {
    if (!style.trim() || !openRouterKey || !helperModel || isPolishingStyle) return;

    setIsPolishingStyle(true);
    try {
      const polishedStyle = await AiPolisherTasks.polishMusicStyle(
        style,
        openRouterKey,
        helperModel
      );
      if (polishedStyle) {
        setStyle(polishedStyle);
      }
    } catch (error) {
      console.error('Failed to polish style:', error);
    } finally {
      setIsPolishingStyle(false);
    }
  };

  const handlePolishLyrics = async () => {
    if (!lyrics.trim() || !openRouterKey || !helperModel || isPolishingLyrics) return;

    setIsPolishingLyrics(true);
    try {
      const polishedLyrics = await AiPolisherTasks.polishLyrics(
        lyrics,
        openRouterKey,
        helperModel,
        selectedModel
      );
      if (polishedLyrics) {
        setLyrics(polishedLyrics);
      }
    } catch (error) {
      console.error('Failed to polish lyrics:', error);
    } finally {
      setIsPolishingLyrics(false);
    }
  };

  return (
    <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-4">
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 mb-1">
          <MusicalNoteIcon className="w-5 h-5" />
          <span className="text-sm font-medium">Music Generation</span>
        </div>
        
        <div className="relative">
          <input
            type="text"
            value={style}
            onChange={(e) => setStyle(e.target.value)}
            placeholder="Music Style (e.g., 'evil disco', 'upbeat pop')"
            disabled={disabled || isPolishingStyle}
            className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 pr-10 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
          />
          {openRouterKey && (
            <button
              onClick={handlePolishStyle}
              disabled={disabled || isPolishingStyle || !style.trim()}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-yellow-500 hover:text-yellow-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              title="Polish Style with AI"
            >
              {isPolishingStyle ? (
                <div className="w-5 h-5 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin" />
              ) : (
                <StarIcon className="w-5 h-5" />
              )}
            </button>
          )}
        </div>
        
        <div className="flex gap-2">
          <div className="relative flex-1">
            <textarea
              value={lyrics}
              onChange={(e) => setLyrics(e.target.value)}
              placeholder="Lyrics (supports [verse], [chorus], etc.)"
              disabled={disabled || isPolishingLyrics}
              rows={4}
              className="w-full resize-none bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 pr-10 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
            />
            {openRouterKey && (
              <button
                onClick={handlePolishLyrics}
                disabled={disabled || isPolishingLyrics || !lyrics.trim()}
                className="absolute right-2 top-3 p-1 text-yellow-500 hover:text-yellow-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                title="Polish Lyrics with AI"
              >
                {isPolishingLyrics ? (
                  <div className="w-5 h-5 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <StarIcon className="w-5 h-5" />
                )}
              </button>
            )}
          </div>
          <button
            onClick={handleSend}
            disabled={disabled || !style.trim() || !lyrics.trim()}
            className="px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center self-end"
            title="Generate Music"
          >
            <PaperAirplaneIcon className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
