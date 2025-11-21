import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Cog6ToothIcon } from '@heroicons/react/24/outline';
import { useChatStore } from '../../stores/chatStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { getAIClient } from '../../lib/api';
import { getLastProvider, getLastModel, saveLastProvider, saveLastModel } from '../../lib/storage/localStorage';
import type { Provider, ChatMessage } from '../../types';
import ProviderSelector from './ProviderSelector';
import ModelSelector from './ModelSelector';
import UserMessage from './UserMessage';
import AIMessage from './AIMessage';
import ChatInput from './ChatInput';
import { OPENROUTER_MODELS, REPLICATE_MODELS, FAL_MODELS } from '../../lib/api';

export default function ChatScreen() {
  const { 
    currentSession, 
    isLoading, 
    error,
    initSession,
    addUserMessage,
    addAIResponse,
    setCurrentResponseIndex,
    setLoading,
    setError,
    clearError,
  } = useChatStore();

  const { apiConfigs, loadAPIConfigs, isProviderConfigured } = useSettingsStore();

  const [selectedProvider, setSelectedProvider] = useState<Provider>('openrouter');
  const [selectedModel, setSelectedModel] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load API configs and initialize session on mount
  useEffect(() => {
    loadAPIConfigs();
    
    // Load last used provider and model
    const lastProvider = getLastProvider() as Provider;
    const lastModel = getLastModel();
    
    if (lastProvider && isProviderConfigured(lastProvider)) {
      setSelectedProvider(lastProvider);
    } else {
      // Find first configured provider
      const firstConfigured = apiConfigs.find(c => c.isConfigured);
      if (firstConfigured) {
        setSelectedProvider(firstConfigured.provider as Provider);
      }
    }
    
    if (lastModel) {
      setSelectedModel(lastModel);
    }
  }, []);

  // Initialize session when provider or model changes
  useEffect(() => {
    if (selectedProvider && selectedModel) {
      initSession(selectedProvider, selectedModel);
      saveLastProvider(selectedProvider);
      saveLastModel(selectedModel);
    }
  }, [selectedProvider, selectedModel]);

  // Set default model when provider changes
  useEffect(() => {
    if (selectedProvider) {
      const models = selectedProvider === 'openrouter' 
        ? OPENROUTER_MODELS 
        : selectedProvider === 'replicate'
        ? REPLICATE_MODELS
        : FAL_MODELS;
      
      if (models.length > 0 && !selectedModel) {
        setSelectedModel(models[0].id);
      }
    }
  }, [selectedProvider]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentSession?.messages]);

  const handleSendMessage = async (content: string) => {
    if (!currentSession || !selectedModel) return;

    clearError();
    const userMessage = addUserMessage(content);
    setLoading(true);

    try {
      const aiClient = getAIClient();
      const response = await aiClient.sendMessage({
        provider: selectedProvider,
        model: selectedModel,
        userMessage: content,
      });

      // Update generation number based on existing responses
      const existingResponses = userMessage.responses?.length || 0;
      response.generationNumber = existingResponses + 1;

      addAIResponse(userMessage.id, response);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleRerunMessage = async (message: ChatMessage) => {
    if (!currentSession || !selectedModel) return;

    clearError();
    setLoading(true);

    try {
      const aiClient = getAIClient();
      const response = await aiClient.sendMessage({
        provider: selectedProvider,
        model: selectedModel,
        userMessage: message.content,
      });

      // Update generation number
      const existingResponses = message.responses?.length || 0;
      response.generationNumber = existingResponses + 1;

      addAIResponse(message.id, response);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyMessage = (content: string) => {
    navigator.clipboard.writeText(content);
    // TODO: Show toast notification
  };

  const handleNavigateResponse = (messageId: string, direction: 'prev' | 'next') => {
    const message = currentSession?.messages.find(m => m.id === messageId);
    if (!message) return;

    const currentIndex = message.currentResponseIndex ?? 0;
    const newIndex = direction === 'prev' ? currentIndex - 1 : currentIndex + 1;
    setCurrentResponseIndex(messageId, newIndex);
  };

  // Get provider configuration status
  const providerStatus: Record<Provider, boolean> = {
    openrouter: isProviderConfigured('openrouter'),
    replicate: isProviderConfigured('replicate'),
    fal: isProviderConfigured('fal'),
  };

  const hasAnyProvider = Object.values(providerStatus).some(status => status);

  // Show welcome screen if no providers configured
  if (!hasAnyProvider) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex flex-col">
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Chat</h1>
            <Link
              to="/settings"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-sm font-medium transition-colors"
            >
              Settings
            </Link>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center p-8">
          <div className="max-w-md text-center space-y-4">
            <div className="text-6xl mb-4">🤖</div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Welcome to RunBack AI</h2>
            <p className="text-gray-600 dark:text-gray-400">
              A privacy-first, mobile-optimized LLM Swiss Army Knife
            </p>
            <div className="pt-4">
              <Link
                to="/settings"
                className="inline-block px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors"
              >
                Configure API Keys
              </Link>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-500 pt-4">
              Phase 2: Chat Core - Provider Integration ✨
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 flex flex-col">
      {/* Header with provider and model selection */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-4">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Chat</h1>
          <Link
            to="/settings"
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            title="Settings"
          >
            <Cog6ToothIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </Link>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <ProviderSelector
            selectedProvider={selectedProvider}
            onProviderChange={setSelectedProvider}
            providerStatus={providerStatus}
          />
          <ModelSelector
            provider={selectedProvider}
            selectedModel={selectedModel}
            onModelChange={setSelectedModel}
          />
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
        {currentSession?.messages.map((message) => {
          if (message.role === 'user') {
            return (
              <UserMessage
                key={message.id}
                message={message}
                onRerun={() => handleRerunMessage(message)}
                onCopy={() => handleCopyMessage(message.content)}
              />
            );
          } else {
            return (
              <AIMessage
                key={message.id}
                message={message}
                onRegenerate={() => {
                  // Find the user message that this response belongs to
                  const userMessage = currentSession.messages
                    .slice()
                    .reverse()
                    .find(m => m.role === 'user' && m.responses?.some(r => r.id === message.id));
                  if (userMessage) {
                    handleRerunMessage(userMessage);
                  }
                }}
                onCopy={() => {
                  const response = message.responses?.[message.currentResponseIndex ?? 0];
                  if (response) {
                    handleCopyMessage(response.content);
                  }
                }}
                onNavigateResponse={(direction) => handleNavigateResponse(message.id, direction)}
              />
            );
          }
        })}

        {/* Loading indicator */}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 dark:bg-gray-800 rounded-lg px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-4 py-3">
            <p className="text-red-800 dark:text-red-300 text-sm">{error}</p>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <ChatInput
        onSend={handleSendMessage}
        disabled={isLoading || !selectedModel}
        placeholder={selectedModel ? 'Type your message...' : 'Select a model to start chatting'}
      />
    </div>
  );
}
