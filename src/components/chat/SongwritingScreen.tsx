import { useState, useEffect, useRef } from 'react';
import { useChatStore } from '../../stores/chatStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { AiPolisherTasks } from '../../lib/aiPolisher';
import { SparklesIcon, MusicalNoteIcon } from '@heroicons/react/24/outline';
import ModelSelector from './ModelSelector';

export default function SongwritingScreen() {
  const { currentSession, updateSessionParameters, updateSessionSettings } = useChatStore();
  const { getAPIKey, helperModel } = useSettingsStore();
  
  const [lyrics, setLyrics] = useState('');
  const [style, setStyle] = useState('');
  const [mood, setMood] = useState('');
  const [suggestions, setSuggestions] = useState<string>('');
  const [isPolishingStyle, setIsPolishingStyle] = useState(false);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const lyricsTextareaRef = useRef<HTMLTextAreaElement>(null);

  // Initialize from session parameters
  useEffect(() => {
    if (currentSession?.modelParameters) {
      setLyrics(currentSession.modelParameters.lyrics || '');
      setStyle(currentSession.modelParameters.style || '');
      setMood(currentSession.modelParameters.mood || '');
    }
  }, [currentSession?.id]);

  // Save to session parameters (debounced)
  useEffect(() => {
    if (!currentSession) return;

    const timeoutId = setTimeout(() => {
      updateSessionParameters(currentSession.id, {
        lyrics,
        style,
        mood
      });
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [lyrics, style, mood, currentSession?.id]);

  const handlePolishStyle = async () => {
    const apiKey = getAPIKey('openrouter');
    if (!apiKey || !style.trim()) return;

    setIsPolishingStyle(true);
    try {
      const polished = await AiPolisherTasks.polishSongwritingStyle(
        style, 
        apiKey, 
        currentSession?.model || helperModel
      );
      setStyle(polished);
    } catch (error) {
      console.error('Failed to polish style:', error);
    } finally {
      setIsPolishingStyle(false);
    }
  };

  const handleSuggest = async () => {
    const apiKey = getAPIKey('openrouter');
    if (!apiKey) return;

    setIsSuggesting(true);
    try {
      let textToProcess = lyrics;
      
      // Check for selection
      if (lyricsTextareaRef.current) {
        const { selectionStart, selectionEnd, value } = lyricsTextareaRef.current;
        if (selectionStart !== selectionEnd) {
          textToProcess = value.substring(selectionStart, selectionEnd);
        }
      }

      const suggestion = await AiPolisherTasks.songwritingIntellisense(
        textToProcess,
        style,
        mood,
        apiKey,
        currentSession?.model || helperModel
      );
      setSuggestions(suggestion);
    } catch (error) {
      console.error('Failed to get suggestions:', error);
    } finally {
      setIsSuggesting(false);
    }
  };

  const handleModelChange = (model: string) => {
    if (currentSession) {
      updateSessionSettings(currentSession.id, 'openrouter', model);
    }
  };

  if (!currentSession) return null;

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900 p-4 gap-4 overflow-y-auto">
      {/* Header with Model Selector */}
      <div className="flex justify-between items-center bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <MusicalNoteIcon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          Songwriting Assistant
        </h2>
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Model:</span>
          <ModelSelector
            provider="openrouter"
            selectedModel={currentSession.model || helperModel}
            onModelChange={handleModelChange}
          />
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        {/* Style Input */}
        <div className="flex-1 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center mb-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Musical Style</label>
            <button
              onClick={handlePolishStyle}
              disabled={isPolishingStyle || !style.trim()}
              className="text-xs flex items-center gap-1 text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 disabled:opacity-50"
            >
              <SparklesIcon className="w-3 h-3" />
              {isPolishingStyle ? 'Polishing...' : 'Polish'}
            </button>
          </div>
          <textarea
            value={style}
            onChange={(e) => setStyle(e.target.value)}
            placeholder="Describe the genre, instruments, tempo..."
            className="w-full h-24 p-2 text-sm rounded-md border border-gray-300 dark:border-gray-600 bg-transparent dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
          />
        </div>

        {/* Mood Input */}
        <div className="flex-1 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Mood & Atmosphere</label>
          <textarea
            value={mood}
            onChange={(e) => setMood(e.target.value)}
            placeholder="Emotional tone, setting, feelings..."
            className="w-full h-24 p-2 text-sm rounded-md border border-gray-300 dark:border-gray-600 bg-transparent dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
          />
        </div>
      </div>

      {/* Lyrics Editor */}
      <div className="flex-1 flex flex-col bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 min-h-[400px]">
        <div className="flex justify-between items-center mb-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
            <MusicalNoteIcon className="w-4 h-4" />
            Lyrics Editor
          </label>
          <button
            onClick={handleSuggest}
            disabled={isSuggesting}
            className="px-3 py-1 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
          >
            <SparklesIcon className="w-4 h-4" />
            {isSuggesting ? 'Thinking...' : 'Suggest Ideas'}
          </button>
        </div>
        
        <div className="flex-1 flex flex-col md:flex-row gap-4">
          <textarea
            ref={lyricsTextareaRef}
            value={lyrics}
            onChange={(e) => setLyrics(e.target.value)}
            placeholder="Start writing your lyrics here..."
            className="flex-1 min-h-[300px] p-4 text-base leading-relaxed rounded-md border border-gray-300 dark:border-gray-600 bg-transparent dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none font-mono"
          />
          
          {/* Suggestions Panel */}
          {suggestions && (
            <div className="w-full md:w-1/3 max-h-[300px] md:max-h-none bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-md border border-indigo-100 dark:border-indigo-800 overflow-y-auto">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-xs font-bold text-indigo-800 dark:text-indigo-200 uppercase tracking-wide">Suggestions</h3>
                <button 
                  onClick={() => setSuggestions('')}
                  className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400"
                >
                  Clear
                </button>
              </div>
              <div className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                {suggestions}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
