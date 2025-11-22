import { useState, useEffect } from 'react';
import { PaperAirplaneIcon } from '@heroicons/react/24/solid';
import { MusicalNoteIcon } from '@heroicons/react/24/outline';

interface MusicGenerationInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  initialStyle?: string;
  initialLyrics?: string;
}

export default function MusicGenerationInput({ 
  onSend, 
  disabled = false,
  initialStyle = '',
  initialLyrics = ''
}: MusicGenerationInputProps) {
  const [style, setStyle] = useState('');
  const [lyrics, setLyrics] = useState('');

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

  return (
    <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-4">
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 mb-1">
          <MusicalNoteIcon className="w-5 h-5" />
          <span className="text-sm font-medium">Music Generation</span>
        </div>
        
        <input
          type="text"
          value={style}
          onChange={(e) => setStyle(e.target.value)}
          placeholder="Music Style (e.g., 'evil disco', 'upbeat pop')"
          disabled={disabled}
          className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
        />
        
        <div className="flex gap-2">
          <textarea
            value={lyrics}
            onChange={(e) => setLyrics(e.target.value)}
            placeholder="Lyrics (supports [verse], [chorus], etc.)"
            disabled={disabled}
            rows={4}
            className="flex-1 resize-none bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
          />
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
