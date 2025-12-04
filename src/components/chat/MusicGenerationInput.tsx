import { useState, useEffect, useRef, type KeyboardEvent } from 'react';
import { PaperAirplaneIcon, StarIcon } from '@heroicons/react/24/solid';
import { MusicalNoteIcon } from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';
import { useSettingsStore } from '../../stores/settingsStore';
import { AiPolisherTasks } from '../../lib/aiPolisher';
import { getSlashPrompts, saveSlashPrompt } from '../../lib/storage/localStorage';
import type { SlashPrompt } from '../../types';

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
  const [showSlashSuggestions, setShowSlashSuggestions] = useState(false);
  const [slashSuggestions, setSlashSuggestions] = useState<SlashPrompt[]>([]);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(0);
  const [activeField, setActiveField] = useState<'style' | 'lyrics'>('style');
  const styleInputRef = useRef<HTMLInputElement>(null);
  const lyricsTextareaRef = useRef<HTMLTextAreaElement>(null);
  
  const { getAPIKey, helperModel } = useSettingsStore();
  const openRouterKey = getAPIKey('openrouter');

  // Load initial values when they change
  useEffect(() => {
    if (initialStyle) setStyle(initialStyle);
    if (initialLyrics) setLyrics(initialLyrics);
  }, [initialStyle, initialLyrics]);

  // Check for slash command trigger in style field
  useEffect(() => {
    const lastWord = style.split(/\s/).pop() || '';
    if (lastWord.startsWith('/') && lastWord.length > 0) {
      const slashPrompts = getSlashPrompts();
      const filtered = slashPrompts.filter(p => 
        p.command.toLowerCase().startsWith(lastWord.toLowerCase())
      );
      if (filtered.length > 0) {
        setSlashSuggestions(filtered);
        setShowSlashSuggestions(true);
        setSelectedSuggestionIndex(0);
        setActiveField('style');
      } else {
        setShowSlashSuggestions(false);
      }
    } else {
      setShowSlashSuggestions(false);
    }
  }, [style]);

  // Check for slash command trigger in lyrics field
  useEffect(() => {
    const lastWord = lyrics.split(/\s/).pop() || '';
    if (lastWord.startsWith('/') && lastWord.length > 0) {
      const slashPrompts = getSlashPrompts();
      const filtered = slashPrompts.filter(p => 
        p.command.toLowerCase().startsWith(lastWord.toLowerCase())
      );
      if (filtered.length > 0) {
        setSlashSuggestions(filtered);
        setShowSlashSuggestions(true);
        setSelectedSuggestionIndex(0);
        setActiveField('lyrics');
      } else {
        setShowSlashSuggestions(false);
      }
    } else if (activeField === 'lyrics') {
      setShowSlashSuggestions(false);
    }
  }, [lyrics, activeField]);

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

  const handleSlashPromptSelect = (slashPrompt: SlashPrompt) => {
    // Update usage count
    saveSlashPrompt({
      ...slashPrompt,
      usageCount: slashPrompt.usageCount + 1,
    });

    const currentText = activeField === 'style' ? style : lyrics;
    const textParts = currentText.trim().split(/\s+/);
    const commandIndex = textParts.findIndex(part => part.toLowerCase() === slashPrompt.command.toLowerCase());
    
    const userInput = commandIndex >= 0 && textParts.length > commandIndex + 1
      ? textParts.slice(commandIndex + 1).join(' ')
      : '';
    
    let finalTemplate = slashPrompt.template;
    
    if (finalTemplate.includes('<input>')) {
      finalTemplate = finalTemplate.replace(/<input>/g, userInput);
    } else if (slashPrompt.variables.length > 0) {
      for (const variable of slashPrompt.variables) {
        const value = window.prompt(`Enter value for ${variable.name}:`, variable.defaultValue || '');
        if (value !== null) {
          finalTemplate = finalTemplate.replace(new RegExp(`\\{${variable.name}\\}`, 'g'), value);
        }
      }
    }

    if (activeField === 'style') {
      setStyle(finalTemplate);
      setTimeout(() => styleInputRef.current?.focus(), 0);
    } else {
      setLyrics(finalTemplate);
      setTimeout(() => lyricsTextareaRef.current?.focus(), 0);
    }
    setShowSlashSuggestions(false);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (showSlashSuggestions) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedSuggestionIndex(prev => 
          prev < slashSuggestions.length - 1 ? prev + 1 : prev
        );
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedSuggestionIndex(prev => prev > 0 ? prev - 1 : prev);
        return;
      }
      if (e.key === 'Tab' || e.key === 'Enter') {
        if (!e.shiftKey && slashSuggestions[selectedSuggestionIndex]) {
          e.preventDefault();
          handleSlashPromptSelect(slashSuggestions[selectedSuggestionIndex]);
          return;
        }
      }
      if (e.key === 'Escape') {
        setShowSlashSuggestions(false);
        return;
      }
    }
  };

  return (
    <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-4">
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 mb-1">
          <MusicalNoteIcon className="w-5 h-5" />
          <span className="text-sm font-medium">Music Generation</span>
        </div>

        {/* Slash Suggestions Dropdown */}
        {showSlashSuggestions && slashSuggestions.length > 0 && (
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg overflow-hidden max-h-64 overflow-y-auto mb-3">
            <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
              <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Slash Commands</span>
              <Link
                to="/slash-prompts"
                className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                Manage
              </Link>
            </div>
            {slashSuggestions.map((suggestion, index) => (
              <button
                key={suggestion.id}
                onClick={() => handleSlashPromptSelect(suggestion)}
                className={`w-full text-left px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                  index === selectedSuggestionIndex ? 'bg-gray-100 dark:bg-gray-700' : ''
                }`}
              >
                <div className="flex items-center gap-2">
                  <code className="font-mono font-semibold text-indigo-600 dark:text-indigo-400">
                    {suggestion.command}
                  </code>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {suggestion.description}
                </p>
              </button>
            ))}
          </div>
        )}
        
        <div className="relative">
          <input
            ref={styleInputRef}
            type="text"
            value={style}
            onChange={(e) => setStyle(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Music Style (e.g., 'evil disco', 'upbeat pop') - Type / for commands"
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
              ref={lyricsTextareaRef}
              value={lyrics}
              onChange={(e) => setLyrics(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Lyrics (supports [verse], [chorus], etc.) - Type / for commands"
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
