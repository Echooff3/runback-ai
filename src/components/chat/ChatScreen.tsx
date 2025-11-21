import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Cog6ToothIcon } from '@heroicons/react/24/outline';
import { v4 as uuidv4 } from 'uuid';
import { useChatStore } from '../../stores/chatStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { getAIClient } from '../../lib/api';
import { getLastProvider, getLastModel } from '../../lib/storage/localStorage';
import { FalClient } from '../../lib/api/fal';
import type { Provider, ChatMessage, ModelParameters, AIResponse } from '../../types';
import SessionTabs from './SessionTabs';
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
    loadSessions,
    updateSessionSettings,
    addUserMessage,
    addAIResponse,
    updateAIResponseStatus,
    setCurrentResponseIndex,
    startPolling,
    stopPolling,
    stopAllPolling,
    setLoading,
    setError,
    clearError,
  } = useChatStore();

  const { apiConfigs, loadAPIConfigs, isProviderConfigured } = useSettingsStore();

  const [selectedProvider, setSelectedProvider] = useState<Provider>('openrouter');
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [modelParameters, setModelParameters] = useState<ModelParameters>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const visibilityMapRef = useRef<Map<string, boolean>>(new Map());
  
  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      stopAllPolling();
    };
  }, [stopAllPolling]);

  // Load API configs and sessions on mount
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

    // Load existing sessions
    loadSessions();
  }, []);

  // Restore session's provider and model when currentSession changes (tab switch)
  useEffect(() => {
    if (currentSession) {
      // Update UI to match the session's settings
      if (currentSession.provider) {
        setSelectedProvider(currentSession.provider);
      }
      if (currentSession.model) {
        setSelectedModel(currentSession.model);
      }
    }
  }, [currentSession?.id]); // Only trigger when session ID changes (tab switch)

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

  // Save provider/model changes to the current session
  useEffect(() => {
    if (currentSession && selectedProvider && selectedModel) {
      // Only update if they're different from the session's current settings
      if (currentSession.provider !== selectedProvider || currentSession.model !== selectedModel) {
        updateSessionSettings(currentSession.id, selectedProvider, selectedModel);
      }
    }
  }, [selectedProvider, selectedModel, currentSession?.id]);

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
      // Use queue API for FAL, regular API for others
      if (selectedProvider === 'fal') {
        await handleFalQueueSubmission(userMessage, content);
      } else {
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
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleFalQueueSubmission = async (userMessage: ChatMessage, content: string) => {
    const falConfig = apiConfigs.find(c => c.provider === 'fal');
    if (!falConfig?.apiKey) {
      throw new Error('FAL API key not configured');
    }

    const falClient = new FalClient(falConfig.apiKey);
    const startTime = Date.now();

    // Submit to queue
    const { requestId } = await falClient.submitToQueue(
      selectedModel,
      content,
      undefined,
      modelParameters
    );

    // Create initial pending response
    const existingResponses = userMessage.responses?.length || 0;
    const responseId = uuidv4();
    const pendingResponse: AIResponse = {
      id: responseId,
      content: 'Request submitted to queue...',
      provider: 'fal',
      model: selectedModel,
      timestamp: new Date().toISOString(),
      generationNumber: existingResponses + 1,
      status: 'pending',
      requestId,
      logs: [],
    };

    addAIResponse(userMessage.id, pendingResponse);
    setLoading(false);

    // Start polling with viewport awareness
    startFalPolling(userMessage.id, responseId, requestId, selectedModel, falClient, startTime);
  };

  const startFalPolling = (
    userMessageId: string,
    responseId: string,
    requestId: string,
    model: string,
    falClient: FalClient,
    startTime: number
  ) => {
    const pollInterval = setInterval(async () => {
      // Check if response is visible
      const isVisible = visibilityMapRef.current.get(responseId) ?? true;

      // Skip polling if not visible (but keep interval running)
      if (!isVisible) {
        return;
      }

      try {
        const statusResult = await falClient.checkQueueStatus(model, requestId);

        // Update status and logs
        updateAIResponseStatus(userMessageId, responseId, {
          status: statusResult.status,
          logs: statusResult.logs,
        });

        // If completed, get result and stop polling
        if (statusResult.status === 'completed') {
          const result = await falClient.getQueueResult(model, requestId);
          const responseTime = Date.now() - startTime;

          updateAIResponseStatus(userMessageId, responseId, {
            content: result.content,
            status: 'completed',
            mediaAssets: result.mediaAssets,
            metadata: {
              responseTime,
            },
          });

          clearInterval(pollInterval);
          stopPolling(responseId);
        }
      } catch (err) {
        console.error('Polling error:', err);
        updateAIResponseStatus(userMessageId, responseId, {
          status: 'failed',
          content: err instanceof Error ? err.message : 'Failed to fetch result',
        });
        clearInterval(pollInterval);
        stopPolling(responseId);
      }
    }, 10000); // Poll every 10 seconds

    startPolling(responseId, pollInterval);
  };

  const handleVisibilityChange = (responseId: string, isVisible: boolean) => {
    visibilityMapRef.current.set(responseId, isVisible);
  };

  const handleRerunMessage = async (message: ChatMessage) => {
    if (!currentSession || !selectedModel) return;

    clearError();
    setLoading(true);

    try {
      // Use queue API for FAL, regular API for others
      if (selectedProvider === 'fal') {
        await handleFalQueueSubmission(message, message.content);
      } else {
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
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyMessage = (content: string) => {
    navigator.clipboard.writeText(content);
    // Note: Toast notification to be implemented in Phase 4 (Polish & Optimization)
  };

  const handleNavigateResponse = (messageId: string, direction: 'prev' | 'next') => {
    const message = currentSession?.messages.find(m => m.id === messageId);
    if (!message) return;

    const currentIndex = message.currentResponseIndex ?? 0;
    const newIndex = direction === 'prev' ? currentIndex - 1 : currentIndex + 1;
    setCurrentResponseIndex(messageId, newIndex);
  };

  // Helper to get current AI response content
  const getCurrentResponseContent = (message: ChatMessage): string => {
    const response = message.responses?.[message.currentResponseIndex ?? 0];
    return response?.content || '';
  };

  // Get provider configuration status
  const providerStatus: Record<Provider, boolean> = {
    openrouter: isProviderConfigured('openrouter'),
    replicate: isProviderConfigured('replicate'),
    fal: isProviderConfigured('fal'),
  };

  const hasAnyProvider = Object.values(providerStatus).some(status => status);
  
  // Show parameters button only if both FAL and OpenRouter are configured
  const showParametersButton = selectedProvider === 'fal' && providerStatus.fal && providerStatus.openrouter;
  
  // Get API keys for parameters feature
  const falApiKey = apiConfigs.find(c => c.provider === 'fal')?.apiKey || '';
  const openrouterApiKey = apiConfigs.find(c => c.provider === 'openrouter')?.apiKey || '';

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
      {/* Session tabs */}
      <SessionTabs 
        defaultProvider={selectedProvider}
        defaultModel={selectedModel}
      />

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
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Provider:</span>
            <ProviderSelector
              selectedProvider={selectedProvider}
              onProviderChange={setSelectedProvider}
              providerStatus={providerStatus}
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Model:</span>
            <ModelSelector
              provider={selectedProvider}
              selectedModel={selectedModel}
              onModelChange={setSelectedModel}
              onParametersChange={setModelParameters}
              showParametersButton={showParametersButton}
              falApiKey={falApiKey}
              openrouterApiKey={openrouterApiKey}
              currentParameters={modelParameters}
            />
          </div>
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
        {/* Empty state when no session exists */}
        {!currentSession && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center space-y-4 max-w-md">
              <div className="text-6xl mb-4">💬</div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Start a New Chat</h2>
              <p className="text-gray-600 dark:text-gray-400">
                Click the <span className="text-indigo-600 dark:text-indigo-400 font-medium">+ button</span> above to create a new chat session.
              </p>
            </div>
          </div>
        )}

        {currentSession?.messages.map((message) => {
          if (message.role === 'user') {
            const hasResponses = message.responses && message.responses.length > 0;
            const currentResponse = message.responses?.[message.currentResponseIndex ?? 0];
            return (
              <div key={message.id}>
                <UserMessage
                  message={message}
                  onRerun={() => handleRerunMessage(message)}
                  onCopy={() => handleCopyMessage(message.content)}
                />
                {hasResponses && currentResponse && (
                  <AIMessage
                    message={message}
                    onRegenerate={() => handleRerunMessage(message)}
                    onCopy={() => handleCopyMessage(getCurrentResponseContent(message))}
                    onNavigateResponse={(direction) => handleNavigateResponse(message.id, direction)}
                    onVisibilityChange={(isVisible) => handleVisibilityChange(currentResponse.id, isVisible)}
                  />
                )}
              </div>
            );
          }
          return null;
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
