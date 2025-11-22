import { useState, useRef, useEffect, type KeyboardEvent } from 'react';
import { PaperAirplaneIcon, DocumentTextIcon, XMarkIcon } from '@heroicons/react/24/solid';
import { Link } from 'react-router-dom';
import { getSystemPrompts, getSlashPrompts, saveSystemPrompt, saveSlashPrompt, getActivePromptId, setActivePromptId } from '../../lib/storage/localStorage';
import type { SystemPrompt, SlashPrompt } from '../../types';

interface EnhancedChatInputProps {
  onSend: (message: string, systemPromptContent?: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export default function EnhancedChatInput({ 
  onSend, 
  disabled = false,
  placeholder = 'Type your message or / for commands...'
}: EnhancedChatInputProps) {
  const [message, setMessage] = useState('');
  const [activeSystemPrompt, setActiveSystemPrompt] = useState<SystemPrompt | null>(null);
  const [showSystemPromptSelector, setShowSystemPromptSelector] = useState(false);
  const [showSlashSuggestions, setShowSlashSuggestions] = useState(false);
  const [slashSuggestions, setSlashSuggestions] = useState<SlashPrompt[]>([]);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Load active system prompt on mount
  useEffect(() => {
    const activeId = getActivePromptId();
    if (activeId) {
      const prompts = getSystemPrompts();
      const prompt = prompts.find(p => p.id === activeId);
      if (prompt) {
        setActiveSystemPrompt(prompt);
      }
    }
  }, []);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 144)}px`;
    }
  }, [message]);

  // Check for slash command trigger
  useEffect(() => {
    const lastWord = message.split(/\s/).pop() || '';
    if (lastWord.startsWith('/') && lastWord.length > 0) {
      const slashPrompts = getSlashPrompts();
      const filtered = slashPrompts.filter(p => 
        p.command.toLowerCase().startsWith(lastWord.toLowerCase())
      );
      if (filtered.length > 0) {
        setSlashSuggestions(filtered);
        setShowSlashSuggestions(true);
        setSelectedSuggestionIndex(0);
      } else {
        setShowSlashSuggestions(false);
      }
    } else {
      setShowSlashSuggestions(false);
    }
  }, [message]);

  const handleSend = () => {
    const trimmedMessage = message.trim();
    if (trimmedMessage && !disabled) {
      onSend(trimmedMessage, activeSystemPrompt?.content);
      setMessage('');
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Handle slash suggestion navigation
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

    // Regular enter to send
    if (e.key === 'Enter' && !e.shiftKey && !showSlashSuggestions) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSlashPromptSelect = (slashPrompt: SlashPrompt) => {
    // Update usage count
    saveSlashPrompt({
      ...slashPrompt,
      usageCount: slashPrompt.usageCount + 1,
    });

    // Replace the /command with the template
    const words = message.split(/\s/);
    words.pop(); // Remove the /command
    
    // If template has variables, show a simple inline prompt for now
    let finalTemplate = slashPrompt.template;
    
    if (slashPrompt.variables.length > 0) {
      // Simple variable replacement with prompts
      for (const variable of slashPrompt.variables) {
        const value = prompt(`Enter value for ${variable.name}:`, variable.defaultValue || '');
        if (value !== null) {
          finalTemplate = finalTemplate.replace(new RegExp(`\\{${variable.name}\\}`, 'g'), value);
        }
      }
    }

    const newMessage = words.length > 0 ? words.join(' ') + ' ' + finalTemplate : finalTemplate;
    setMessage(newMessage);
    setShowSlashSuggestions(false);
    
    // Focus back on textarea
    setTimeout(() => textareaRef.current?.focus(), 0);
  };

  const handleSystemPromptSelect = (prompt: SystemPrompt | null) => {
    setActiveSystemPrompt(prompt);
    setActivePromptId(prompt?.id || null);
    if (prompt) {
      saveSystemPrompt({
        ...prompt,
        usageCount: prompt.usageCount + 1,
      });
    }
    setShowSystemPromptSelector(false);
  };

  return (
    <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-4">
      {/* System Prompt Badge */}
      {activeSystemPrompt && (
        <div className="mb-3 flex items-center gap-2 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg px-3 py-2">
          <DocumentTextIcon className="w-4 h-4 text-indigo-600 dark:text-indigo-400 flex-shrink-0" />
          <span className="text-sm text-indigo-900 dark:text-indigo-100 flex-1 truncate">
            {activeSystemPrompt.name}
          </span>
          <button
            onClick={() => handleSystemPromptSelect(null)}
            className="p-1 hover:bg-indigo-100 dark:hover:bg-indigo-800 rounded transition-colors"
            title="Remove system prompt"
          >
            <XMarkIcon className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          </button>
        </div>
      )}

      {/* Slash Suggestions Dropdown */}
      {showSlashSuggestions && slashSuggestions.length > 0 && (
        <div className="mb-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg overflow-hidden max-h-64 overflow-y-auto">
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

      {/* Input Area */}
      <div className="flex gap-2">
        {/* System Prompt Button */}
        <button
          onClick={() => setShowSystemPromptSelector(!showSystemPromptSelector)}
          disabled={disabled}
          className={`p-3 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center ${
            activeSystemPrompt
              ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
              : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300'
          }`}
          title="System Prompt"
        >
          <DocumentTextIcon className="w-5 h-5" />
        </button>

        {/* Message Input */}
        <textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          rows={1}
          className="flex-1 resize-none bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ minHeight: '48px', maxHeight: '144px' }}
        />

        {/* Send Button */}
        <button
          onClick={handleSend}
          disabled={disabled || !message.trim()}
          className="px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          title="Send message (Enter)"
        >
          <PaperAirplaneIcon className="w-5 h-5" />
        </button>
      </div>

      {/* System Prompt Selector Modal */}
      {showSystemPromptSelector && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={() => setShowSystemPromptSelector(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md max-h-[70vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">Select System Prompt</h3>
              <Link
                to="/system-prompts"
                className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                Manage
              </Link>
            </div>
            <div className="flex-1 overflow-y-auto">
              <button
                onClick={() => handleSystemPromptSelect(null)}
                className="w-full text-left px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors border-b border-gray-200 dark:border-gray-700"
              >
                <p className="font-medium text-gray-900 dark:text-gray-100">None</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">No system prompt</p>
              </button>
              {getSystemPrompts().map((prompt) => (
                <button
                  key={prompt.id}
                  onClick={() => handleSystemPromptSelect(prompt)}
                  className={`w-full text-left px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors border-b border-gray-200 dark:border-gray-700 ${
                    activeSystemPrompt?.id === prompt.id ? 'bg-indigo-50 dark:bg-indigo-900/20' : ''
                  }`}
                >
                  <p className="font-medium text-gray-900 dark:text-gray-100">{prompt.name}</p>
                  {prompt.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">{prompt.description}</p>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
        Press Enter to send, Shift+Enter for new line. Type / for commands.
      </p>
    </div>
  );
}
