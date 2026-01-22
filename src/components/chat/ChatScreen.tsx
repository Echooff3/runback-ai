import { useEffect, useState, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Cog6ToothIcon, BookmarkIcon } from '@heroicons/react/24/outline';
import { v4 as uuidv4 } from 'uuid';
import { useChatStore } from '../../stores/chatStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { getAIClient, estimateTokenCount } from '../../lib/api';
import { getLastProvider, getModelParameters, saveLastProvider, saveLastModel } from '../../lib/storage/localStorage';
import { FalClient } from '../../lib/api/fal';
import { TopicClassifier } from '../../lib/topicClassifier';
import type { Provider, ChatMessage, ModelParameters, AIResponse, ChatSession, SessionCheckpoint, Attachment } from '../../types';
import SessionTabs from './SessionTabs';
import ProviderSelector from './ProviderSelector';
import ModelSelector from './ModelSelector';
import UserMessage from './UserMessage';
import AIMessage from './AIMessage';
import EnhancedChatInput from './EnhancedChatInput';
import MusicGenerationInput from './MusicGenerationInput';
import FluxGenerationInput from './FluxGenerationInput';
import Flux2GenerationInput from './Flux2GenerationInput';
import SongwritingScreen from './SongwritingScreen';
import VideoGenerationScreen from './VideoGenerationScreen';
import LoadingIndicator from './LoadingIndicator';
import TopicChangeDivider from './TopicChangeDivider';
import { OPENROUTER_MODELS, REPLICATE_MODELS, FAL_MODELS } from '../../lib/api';

const CheckpointDivider = ({ checkpoint }: { checkpoint: SessionCheckpoint }) => (
  <div className="w-full my-6 flex items-center justify-center">
    <div className="bg-indigo-50 dark:bg-indigo-900/20 text-indigo-800 dark:text-indigo-200 px-6 py-2 rounded-full text-sm font-medium flex items-center gap-2 shadow-sm border border-indigo-100 dark:border-indigo-800">
      <BookmarkIcon className="w-4 h-4" />
      <span>Checkpoint Created • {new Date(checkpoint.timestamp).toLocaleTimeString()}</span>
    </div>
  </div>
);

export default function ChatScreen() {
  const { 
    currentSession, 
    isLoading, 
    error,
    loadSessions,
    updateSessionSettings,
    createCheckpoint,
    addUserMessage,
    addAIResponse,
    updateAIResponseStatus,
    updateAIResponseNote,
    setCurrentResponseIndex,
    toggleMessageCollapse,
    removeMessage,
    startPolling,
    stopPolling,
    stopAllPolling,
    setLoading,
    setError,
    clearError,
  } = useChatStore();

  const { apiConfigs, loadAPIConfigs, isProviderConfigured, helperModel } = useSettingsStore();

  const [selectedProvider, setSelectedProvider] = useState<Provider>('openrouter');
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [modelParameters, setModelParameters] = useState<ModelParameters>({});
  const [musicDraft, setMusicDraft] = useState<{ style: string; lyrics: string } | null>(null);
  const [fluxDraft, setFluxDraft] = useState<string>('');
  const [flux2Draft, setFlux2Draft] = useState<string>('');
  const [modelContextLength, setModelContextLength] = useState<number>(0);
  const [loadingStatus, setLoadingStatus] = useState<'connecting' | 'waiting' | 'streaming'>('connecting');
  const [loadingStartTime, setLoadingStartTime] = useState<number | null>(null);
  const [pendingMessageId, setPendingMessageId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const visibilityMapRef = useRef<Map<string, boolean>>(new Map());
  const isRestoringFromSessionRef = useRef(false);
  const lastSessionIdRef = useRef<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Debug logging for parameter changes
  useEffect(() => {
    console.log('[ChatScreen] modelParameters updated:', JSON.stringify(modelParameters, null, 2));
  }, [modelParameters]);

  // Handler for when parameters are updated from the modal
  const handleParametersChange = (parameters: ModelParameters) => {
    console.log('[ChatScreen] handleParametersChange called with:', JSON.stringify(parameters, null, 2));
    setModelParameters(parameters);
  };

  // Fetch model context length
  useEffect(() => {
    const fetchModelInfo = async () => {
      if (selectedProvider === 'openrouter') {
        const aiClient = getAIClient();
        const models = await aiClient.getOpenRouterModels();
        const modelInfo = models.find(m => m.id === selectedModel);
        if (modelInfo) {
          setModelContextLength(modelInfo.context_length);
          console.log(`[ChatScreen] Model ${selectedModel} context length: ${modelInfo.context_length}`);
        }
      } else {
        // For other providers, we might not have this info dynamically yet
        setModelContextLength(0);
      }
    };
    
    if (selectedModel) {
      fetchModelInfo();
    }
  }, [selectedModel, selectedProvider]);
  
  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      stopAllPolling();
    };
  }, [stopAllPolling]);

  // Load API configs and sessions on mount
  useEffect(() => {
    loadAPIConfigs();
    
    // Default to OpenRouter with helper model from settings
    setSelectedProvider('openrouter');
    setSelectedModel(helperModel);
    
    // Load last used provider and model (optional override)
    const lastProvider = getLastProvider() as Provider;
    // const lastModel = getLastModel(); // Commented out to enforce helperModel as default for new chats
    
    if (lastProvider && isProviderConfigured(lastProvider)) {
      setSelectedProvider(lastProvider);
    }
    
    /* if (lastModel) {
      setSelectedModel(lastModel);
    } */

    // Load existing sessions
    loadSessions();
  }, []);

  // Restore session's provider and model when currentSession changes (tab switch)
  useEffect(() => {
    if (currentSession && currentSession.id !== lastSessionIdRef.current) {
      // Mark that we're restoring from a session switch
      isRestoringFromSessionRef.current = true;
      lastSessionIdRef.current = currentSession.id;
      
      // Update UI to match the session's settings
      if (currentSession.provider) {
        setSelectedProvider(currentSession.provider);
      }
      if (currentSession.model) {
        setSelectedModel(currentSession.model);
      }
      
      // Reset the flag after state updates have propagated
      setTimeout(() => {
        isRestoringFromSessionRef.current = false;
      }, 0);
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
      
      // Check if current model is valid for this provider
      const isModelValid = models.some(m => m.id === selectedModel);
      
      if (!isModelValid && models.length > 0) {
        setSelectedModel(models[0].id);
      }
    }
  }, [selectedProvider]);

  // Save provider/model changes to local storage (but not during restoration)
  useEffect(() => {
    if (selectedProvider && !isRestoringFromSessionRef.current) {
      saveLastProvider(selectedProvider);
    }
  }, [selectedProvider]);

  useEffect(() => {
    if (selectedModel && !isRestoringFromSessionRef.current) {
      saveLastModel(selectedModel);
    }
  }, [selectedModel]);

  // Load saved parameters when model or provider changes
  useEffect(() => {
    if (selectedModel && selectedProvider) {
      const savedParams = getModelParameters(selectedModel, selectedProvider);
      if (savedParams) {
        console.log('[ChatScreen] Loading saved parameters for', selectedModel, ':', JSON.stringify(savedParams, null, 2));
        setModelParameters(savedParams);
      } else {
        console.log('[ChatScreen] No saved parameters found for', selectedModel);
        setModelParameters({});
      }
    }
  }, [selectedModel, selectedProvider]);

  // Save provider/model changes to the current session
  useEffect(() => {
    // Skip if we're restoring from a session switch to avoid circular updates
    if (isRestoringFromSessionRef.current) {
      return;
    }
    
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

  const getConversationContext = (session: ChatSession, targetMessageId?: string) => {
    if (!session.checkpoints || session.checkpoints.length === 0) {
      // No checkpoints, return full history (or up to target)
      if (!targetMessageId) {
        return session.messages.map(msg => ({
          role: msg.role === 'user' ? 'user' as const : 'assistant' as const,
          content: msg.role === 'user' ? msg.content : (msg.responses?.[msg.currentResponseIndex || 0]?.content || '')
        }));
      } else {
        const targetIndex = session.messages.findIndex(m => m.id === targetMessageId);
        if (targetIndex === -1) return [];
        return session.messages.slice(0, targetIndex).map(msg => ({
          role: msg.role === 'user' ? 'user' as const : 'assistant' as const,
          content: msg.role === 'user' ? msg.content : (msg.responses?.[msg.currentResponseIndex || 0]?.content || '')
        }));
      }
    }

    // Find the relevant checkpoint
    let checkpoint: SessionCheckpoint | undefined;
    let startIndex = 0;

    if (targetMessageId) {
      // Find the latest checkpoint that happened BEFORE the target message
      const targetIndex = session.messages.findIndex(m => m.id === targetMessageId);
      if (targetIndex === -1) return []; // Should not happen

      // Iterate backwards from checkpoints to find one that is before target
      // We need to know the index of the checkpoint's lastMessageId
      for (let i = session.checkpoints.length - 1; i >= 0; i--) {
        const cp = session.checkpoints[i];
        const cpIndex = session.messages.findIndex(m => m.id === cp.lastMessageId);
        
        if (cpIndex !== -1 && cpIndex < targetIndex) {
          checkpoint = cp;
          startIndex = cpIndex + 1;
          break;
        }
      }
    } else {
      // Use the latest checkpoint
      checkpoint = session.checkpoints[session.checkpoints.length - 1];
      // Guard against undefined checkpoint (TypeScript safety)
      let cpIndex = -1;
      if (checkpoint) {
        cpIndex = session.messages.findIndex(m => m.id === checkpoint!.lastMessageId);
      }
      if (cpIndex !== -1) {
        startIndex = cpIndex + 1;
      } else {
        // Checkpoint message not found (maybe deleted?), fallback to full history
        checkpoint = undefined;
      }
    }

    const contextMessages: { role: 'user' | 'assistant' | 'system'; content: string }[] = [];

    if (checkpoint) {
      contextMessages.push({
        role: 'system',
        content: `[Previous Conversation Summary]: ${checkpoint.summary}`
      });
    }

    // Add messages since checkpoint
    const messagesToAdd = targetMessageId 
      ? session.messages.slice(startIndex, session.messages.findIndex(m => m.id === targetMessageId))
      : session.messages.slice(startIndex);

    messagesToAdd.forEach(msg => {
      contextMessages.push({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.role === 'user' ? msg.content : (msg.responses?.[msg.currentResponseIndex || 0]?.content || '')
      });
    });

    return contextMessages;
  };

  // Cancel handler for loading requests
  const handleCancelRequest = useCallback(() => {
    // Abort any in-flight requests
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    // Remove the pending message from chat history since response was incomplete
    if (pendingMessageId) {
      removeMessage(pendingMessageId);
      setPendingMessageId(null);
    }

    // Reset loading state
    setLoading(false);
    setLoadingStatus('connecting');
    setLoadingStartTime(null);
    clearError();
  }, [pendingMessageId, removeMessage, setLoading, clearError]);

  const handleSendMessage = async (content: string, systemPromptContent?: string, attachments?: Attachment[]) => {
    if (!currentSession || !selectedModel) return;

    // Handle manual checkpoint command
    if (content.trim().toLowerCase() === '/checkpoint') {
      if (selectedProvider === 'openrouter') {
        try {
          setLoading(true);
          await createCheckpoint('manual');
        } catch (err) {
          console.error('Failed to create checkpoint:', err);
          setError('Failed to create checkpoint');
        } finally {
          setLoading(false);
        }
        return;
      } else {
        setError('Checkpoints are currently only supported for OpenRouter');
        return;
      }
    }

    clearError();

    // Topic change detection (only for OpenRouter and regular chat sessions)
    let topicChanged = false;
    let topicChangeReasoning: string | undefined;
    let shouldCheckpointFromTopicChange = false;

    if (selectedProvider === 'openrouter' && currentSession.type === 'chat' && currentSession.messages.length > 0) {
      const { getAPIKey } = useSettingsStore.getState();
      const apiKey = getAPIKey('openrouter');
      
      if (apiKey) {
        try {
          console.log('[ChatScreen] Running topic change detection...');
          const classificationResult = await TopicClassifier.classifyTopicChange(
            content,
            currentSession.messages,
            apiKey
          );
          
          topicChanged = classificationResult.topic_changed;
          topicChangeReasoning = classificationResult.reasoning;
          
          console.log('[ChatScreen] Topic change detection result:', classificationResult);
          
          // If topic changed, create a checkpoint before adding the new message
          if (topicChanged) {
            console.log('[ChatScreen] Topic change detected, creating checkpoint...');
            shouldCheckpointFromTopicChange = true;
            await createCheckpoint('topic_change');
          }
        } catch (err) {
          console.error('[ChatScreen] Topic detection failed:', err);
          // Continue without topic detection on error
        }
      }
    }

    // Check token usage for auto-checkpoint (OpenRouter only for now)
    // Note: Skip token-limit checkpoint if we just created a topic-change checkpoint
    // to avoid double-checkpointing. Topic changes take precedence.
    if (selectedProvider === 'openrouter' && modelContextLength > 0 && !shouldCheckpointFromTopicChange) {
      // Calculate current context tokens
      const contextMessages = getConversationContext(currentSession);
      const contextText = contextMessages.map(m => m.content).join(' ');
      const currentTokens = estimateTokenCount(contextText + content + (systemPromptContent || ''));
      
      if (currentTokens > modelContextLength * 0.6) {
        console.log(`[ChatScreen] Token count ${currentTokens} exceeds 60% of ${modelContextLength}. Creating checkpoint...`);
        await createCheckpoint('token_limit');
      }
    }

    const userMessage = addUserMessage(content, attachments, topicChanged, topicChangeReasoning);
    
    // Set up loading state with tracking
    setPendingMessageId(userMessage.id);
    setLoadingStartTime(Date.now());
    setLoadingStatus('connecting');
    setLoading(true);
    
    // Track cancellation state for this request
    // Note: The API client doesn't support abort signals yet, so cancellation
    // is handled at the UI level by removing the pending message from history
    abortControllerRef.current = new AbortController();

    try {
      // Use queue API for FAL, regular API for others
      if (selectedProvider === 'fal') {
        setLoadingStatus('waiting');
        await handleFalQueueSubmission(userMessage, content);
      } else {
        const aiClient = getAIClient();
        
        // For OpenRouter, use full context with checkpoints
        let conversationHistory: { role: 'user' | 'assistant' | 'system'; content: string }[] | undefined;
        if (selectedProvider === 'openrouter') {
          // Get the latest session state which includes the new message and potentially the new checkpoint
          const latestSession = useChatStore.getState().currentSession;
          if (latestSession) {
            // Pass userMessage.id to exclude the current message from history (it's added separately in sendMessage)
            conversationHistory = getConversationContext(latestSession, userMessage.id);
          }
        }

        // Update status to waiting before API call
        setLoadingStatus('waiting');

        const response = await aiClient.sendMessage({
          provider: selectedProvider,
          model: selectedModel,
          userMessage: content,
          systemPrompt: systemPromptContent,
          conversationHistory,
          attachments,
        });

        // Check if request was cancelled while waiting for response
        if (abortControllerRef.current?.signal.aborted) {
          return;
        }

        // Update status to streaming when we get data
        setLoadingStatus('streaming');

        // Update generation number based on existing responses
        const existingResponses = userMessage.responses?.length || 0;
        response.generationNumber = existingResponses + 1;

        addAIResponse(userMessage.id, response);
      }
    } catch (err) {
      // Check if request was cancelled - don't show error in that case
      if (abortControllerRef.current?.signal.aborted) {
        return;
      }
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
    } finally {
      setLoading(false);
      setPendingMessageId(null);
      setLoadingStartTime(null);
      setLoadingStatus('connecting');
      abortControllerRef.current = null;
    }
  };

  const handleFalQueueSubmission = async (userMessage: ChatMessage, content: string) => {
    const falConfig = apiConfigs.find(c => c.provider === 'fal');
    if (!falConfig?.apiKey) {
      throw new Error('FAL API key not configured');
    }

    const falClient = new FalClient(falConfig.apiKey);
    const startTime = Date.now();

    console.log('[ChatScreen] Submitting to FAL with modelParameters:', JSON.stringify(modelParameters, null, 2));

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
        
        // For OpenRouter, use full context with checkpoints up to this message
        let conversationHistory: { role: 'user' | 'assistant' | 'system'; content: string }[] | undefined;
        if (selectedProvider === 'openrouter') {
          conversationHistory = getConversationContext(currentSession, message.id);
        }

        const response = await aiClient.sendMessage({
          provider: selectedProvider,
          model: selectedModel,
          userMessage: message.content,
          conversationHistory,
          attachments: message.attachments,
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

  const handleEditMessage = (message: ChatMessage) => {
    try {
      const parsed = JSON.parse(message.content);
      if (parsed.prompt && parsed.lyrics_prompt) {
        // Force a new object reference even if values are same to trigger useEffect
        // But since we clear on send, just setting it is fine.
        // To be safe against repeated clicks, we can use a timestamp or just rely on the fact that
        // the input clears itself.
        setMusicDraft({
          style: parsed.prompt,
          lyrics: parsed.lyrics_prompt
        });
      } else if (parsed.prompt && selectedModel === 'fal-ai/flux/dev') {
        setFluxDraft(parsed.prompt);
      } else if (parsed.prompt && selectedModel === 'fal-ai/flux-2') {
        setFlux2Draft(parsed.prompt);
      }
    } catch (e) {
      console.error('Failed to parse message for editing:', e);
      // Fallback for plain text messages if any
      if (selectedModel === 'fal-ai/flux/dev') {
        setFluxDraft(message.content);
      } else if (selectedModel === 'fal-ai/flux-2') {
        setFlux2Draft(message.content);
      }
    }
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

  if (currentSession?.type === 'songwriting') {
    return (
      <div className="h-screen overflow-hidden bg-white dark:bg-gray-900 flex flex-col">
        <SessionTabs 
          defaultProvider="openrouter"
          defaultModel={helperModel}
        />
        <div className="flex-1 overflow-hidden">
          <SongwritingScreen />
        </div>
      </div>
    );
  }

  if (currentSession?.type === 'video-generation') {
    return (
      <div className="h-screen overflow-hidden bg-white dark:bg-gray-900 flex flex-col">
        <SessionTabs 
          defaultProvider="fal"
          defaultModel="fal-ai/minimax/hailuo-02/pro/text-to-video"
        />
        <div className="flex-1 overflow-hidden">
          <VideoGenerationScreen />
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen overflow-hidden bg-white dark:bg-gray-900 flex flex-col">
      {/* Session tabs */}
      <SessionTabs 
        defaultProvider="openrouter"
        defaultModel={helperModel}
      />

      {/* Header with provider and model selection */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-4">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Chat</h1>
          <div className="flex items-center gap-2">
            {selectedProvider === 'openrouter' && currentSession && currentSession.messages.length > 0 && (
              <button
                onClick={() => createCheckpoint('manual')}
                disabled={isLoading}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-gray-600 dark:text-gray-400"
                title="Create Checkpoint (Summarize History)"
              >
                <BookmarkIcon className="w-5 h-5" />
              </button>
            )}
            <Link
              to="/settings"
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              title="Settings"
            >
              <Cog6ToothIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </Link>
          </div>
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
              onParametersChange={handleParametersChange}
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
            const checkpoint = currentSession.checkpoints?.find(cp => cp.lastMessageId === message.id);

            return (
              <div key={message.id}>
                {/* Show topic change divider if this message represents a topic change */}
                {message.topicChanged && (
                  <TopicChangeDivider
                    timestamp={message.timestamp}
                    reasoning={message.topicChangeReasoning}
                    checkpointCreated={true}
                  />
                )}
                <UserMessage
                  message={message}
                  onRerun={() => handleRerunMessage(message)}
                  onCopy={() => handleCopyMessage(message.content)}
                  onToggleCollapse={() => toggleMessageCollapse(message.id)}
                />
                {hasResponses && currentResponse && (
                  <AIMessage
                    message={message}
                    onRegenerate={() => handleRerunMessage(message)}
                    onCopy={() => handleCopyMessage(getCurrentResponseContent(message))}
                    onNavigateResponse={(direction) => handleNavigateResponse(message.id, direction)}
                    onVisibilityChange={(isVisible) => handleVisibilityChange(currentResponse.id, isVisible)}
                    onEdit={
                      (selectedModel === 'fal-ai/minimax-music/v1.5' || selectedModel === 'fal-ai/minimax-music/v2' || selectedModel === 'fal-ai/flux/dev' || selectedModel === 'fal-ai/flux-2') 
                        ? () => handleEditMessage(message) 
                        : undefined
                    }
                    onUpdateNote={(note) => updateAIResponseNote(message.id, currentResponse.id, note)}
                    onToggleCollapse={() => updateAIResponseStatus(message.id, currentResponse.id, { isCollapsed: !currentResponse.isCollapsed })}
                  />
                )}
                {checkpoint && <CheckpointDivider checkpoint={checkpoint} />}
              </div>
            );
          }
          return null;
        })}

        {/* Loading indicator */}
        {isLoading && (
          <LoadingIndicator
            status={loadingStatus}
            onCancel={handleCancelRequest}
            startTime={loadingStartTime ?? undefined}
          />
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
      {selectedProvider === 'fal' && (selectedModel === 'fal-ai/minimax-music/v1.5' || selectedModel === 'fal-ai/minimax-music/v2') ? (
        <MusicGenerationInput
          onSend={handleSendMessage}
          disabled={isLoading}
          initialStyle={musicDraft?.style}
          initialLyrics={musicDraft?.lyrics}
          selectedModel={selectedModel}
        />
      ) : selectedProvider === 'fal' && selectedModel === 'fal-ai/flux-2' ? (
        <Flux2GenerationInput
          onSend={handleSendMessage}
          disabled={isLoading}
          initialPrompt={flux2Draft}
        />
      ) : selectedProvider === 'fal' && selectedModel === 'fal-ai/flux/dev' ? (
        <FluxGenerationInput
          onSend={handleSendMessage}
          disabled={isLoading}
          initialPrompt={fluxDraft}
        />
      ) : (
        <EnhancedChatInput
          onSend={handleSendMessage}
          disabled={isLoading || !selectedModel}
          placeholder={selectedModel ? 'Type your message or / for commands...' : 'Select a model to start chatting'}
          selectedProvider={selectedProvider}
        />
      )}
    </div>
  );
}
