import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { ChatMessage, ChatSession, AIResponse, Provider, SessionCheckpoint, Attachment, SessionType, ModelParameters } from '../types';
import { AiPolisherTasks } from '../lib/aiPolisher';
import { useSettingsStore } from './settingsStore';
import { 
  saveSession as saveSessionToDB, 
  loadOpenSessions,
  loadAllSessions as loadAllSessionsFromDB,
  deleteSession as deleteSessionFromDB,
  deleteAllNonStarred as deleteAllNonStarredFromDB,
  toggleStarSession as toggleStarInDB,
  updateSessionTitle as updateTitleInDB,
  closeSession as closeSessionInDB,
  reopenSession as reopenSessionInDB,
  createNewSession as createSession,
  generateSessionTitle,
} from '../lib/storage/sessionStorage';

interface ChatState {
  sessions: ChatSession[];
  activeSessionId: string | null;
  currentSession: ChatSession | null;
  isLoading: boolean;
  error: string | null;
  pollingIntervals: Map<string, ReturnType<typeof setInterval>>;
  
  // Session management
  loadSessions: () => Promise<void>;
  loadAllSessions: () => Promise<void>;
  createNewSession: (provider: Provider, model?: string, systemPromptId?: string, type?: SessionType) => Promise<void>;
  switchSession: (sessionId: string) => void;
  closeSessionTab: (sessionId: string) => Promise<void>;
  reopenSession: (sessionId: string) => Promise<void>;
  deleteSession: (sessionId: string) => Promise<{ success: boolean; error?: string }>;
  deleteAllNonStarred: () => Promise<{ success: boolean; deletedCount: number; error?: string }>;
  toggleStarSession: (sessionId: string) => Promise<void>;
  updateSessionTitle: (sessionId: string, title: string) => Promise<void>;
  updateSessionSettings: (sessionId: string, provider: Provider, model: string) => Promise<void>;
  updateSessionParameters: (sessionId: string, parameters: ModelParameters) => Promise<void>;
  createCheckpoint: (reason?: 'manual' | 'token_limit' | 'topic_change') => Promise<void>;
  
  // Message actions
  addUserMessage: (content: string, attachments?: Attachment[], topicChanged?: boolean, topicChangeReasoning?: string) => ChatMessage;
  addAIResponse: (userMessageId: string, response: AIResponse) => void;
  updateAIResponseStatus: (userMessageId: string, responseId: string, updates: Partial<AIResponse>) => void;
  updateAIResponseNote: (userMessageId: string, responseId: string, note: string) => void;
  setCurrentResponseIndex: (messageId: string, index: number) => void;
  toggleMessageCollapse: (messageId: string) => void;
  removeMessage: (messageId: string) => void;
  
  // Polling management
  startPolling: (responseId: string, interval: ReturnType<typeof setInterval>) => void;
  stopPolling: (responseId: string) => void;
  stopAllPolling: () => void;
  
  // UI state
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  
  // Internal
  saveCurrentSession: () => Promise<void>;
}

export const useChatStore = create<ChatState>((set, get) => ({
  sessions: [],
  activeSessionId: null,
  currentSession: null,
  isLoading: false,
  error: null,
  pollingIntervals: new Map(),
  
  loadSessions: async () => {
    try {
      let sessions = await loadOpenSessions();
      
      // Enforce max 5 open sessions
      if (sessions.length > 5) {
        const sessionsToClose = sessions.slice(5);
        sessions = sessions.slice(0, 5);
        
        // Close excess sessions in background
        Promise.all(sessionsToClose.map(s => closeSessionInDB(s.id))).catch(console.error);
      }

      set({ sessions });
      
      // If no active session, set first one as active
      const state = get();
      if (!state.activeSessionId && sessions.length > 0) {
        set({ 
          activeSessionId: sessions[0].id,
          currentSession: sessions[0]
        });
      }
    } catch (error) {
      console.error('Failed to load sessions:', error);
      set({ error: 'Failed to load chat sessions' });
    }
  },

  loadAllSessions: async () => {
    try {
      const sessions = await loadAllSessionsFromDB();
      set({ sessions });
    } catch (error) {
      console.error('Failed to load all sessions:', error);
      set({ error: 'Failed to load chat sessions' });
    }
  },
  
  createNewSession: async (provider: Provider, model?: string, systemPromptId?: string, type: SessionType = 'chat') => {
    const state = get();
    let currentSessions = state.sessions;

    // Enforce max 5 open sessions (keep 4 to add 1)
    if (currentSessions.length >= 5) {
      const sessionsToClose = currentSessions.slice(4);
      currentSessions = currentSessions.slice(0, 4);
      
      // Close excess sessions in background
      Promise.all(sessionsToClose.map(s => closeSessionInDB(s.id))).catch(console.error);
      
      // Update state to avoid flicker/race conditions if we used state.sessions directly later
      set({ sessions: currentSessions });
    }

    const newSession = createSession(provider, model, systemPromptId, type);
    await saveSessionToDB(newSession);
    
    set({ 
      sessions: [newSession, ...currentSessions],
      activeSessionId: newSession.id,
      currentSession: newSession,
      error: null
    });
  },

  switchSession: (sessionId: string) => {
    const state = get();
    const session = state.sessions.find(s => s.id === sessionId);
    
    if (session) {
      set({ 
        activeSessionId: sessionId,
        currentSession: session
      });
    }
  },

  closeSessionTab: async (sessionId: string) => {
    const state = get();
    const session = state.sessions.find(s => s.id === sessionId);
    
    if (!session) return;

    // Mark as closed in DB
    await closeSessionInDB(sessionId);
    
    // Remove from sessions list
    const updatedSessions = state.sessions.filter(s => s.id !== sessionId);
    
    // If closing active session, switch to another
    let newActiveId = state.activeSessionId;
    let newCurrentSession = state.currentSession;
    
    if (state.activeSessionId === sessionId) {
      if (updatedSessions.length > 0) {
        newActiveId = updatedSessions[0].id;
        newCurrentSession = updatedSessions[0];
      } else {
        newActiveId = null;
        newCurrentSession = null;
      }
    }
    
    set({ 
      sessions: updatedSessions,
      activeSessionId: newActiveId,
      currentSession: newCurrentSession
    });
  },

  reopenSession: async (sessionId: string) => {
    await reopenSessionInDB(sessionId);
    await get().loadSessions();
  },

  deleteSession: async (sessionId: string) => {
    const result = await deleteSessionFromDB(sessionId);
    
    if (result.success) {
      const state = get();
      const updatedSessions = state.sessions.filter(s => s.id !== sessionId);
      
      // If deleting active session, switch to another
      let newActiveId = state.activeSessionId;
      let newCurrentSession = state.currentSession;
      
      if (state.activeSessionId === sessionId) {
        if (updatedSessions.length > 0) {
          newActiveId = updatedSessions[0].id;
          newCurrentSession = updatedSessions[0];
        } else {
          newActiveId = null;
          newCurrentSession = null;
        }
      }
      
      set({ 
        sessions: updatedSessions,
        activeSessionId: newActiveId,
        currentSession: newCurrentSession
      });
    }
    
    return result;
  },

  deleteAllNonStarred: async () => {
    const result = await deleteAllNonStarredFromDB();
    
    if (result.success) {
      const state = get();
      // Keep only starred sessions
      const updatedSessions = state.sessions.filter(s => s.isStarred);
      
      // If active session was deleted, switch to first remaining or null
      let newActiveId = state.activeSessionId;
      let newCurrentSession = state.currentSession;
      
      const activeSessionStillExists = updatedSessions.some(s => s.id === state.activeSessionId);
      if (!activeSessionStillExists) {
        if (updatedSessions.length > 0) {
          newActiveId = updatedSessions[0].id;
          newCurrentSession = updatedSessions[0];
        } else {
          newActiveId = null;
          newCurrentSession = null;
        }
      }
      
      set({ 
        sessions: updatedSessions,
        activeSessionId: newActiveId,
        currentSession: newCurrentSession
      });
    }
    
    return result;
  },

  toggleStarSession: async (sessionId: string) => {
    const newStarredStatus = await toggleStarInDB(sessionId);
    
    const state = get();
    const updatedSessions = state.sessions.map(s => 
      s.id === sessionId ? { ...s, isStarred: newStarredStatus } : s
    );
    
    set({ 
      sessions: updatedSessions,
      currentSession: state.activeSessionId === sessionId 
        ? { ...state.currentSession!, isStarred: newStarredStatus }
        : state.currentSession
    });
  },

  updateSessionTitle: async (sessionId: string, title: string) => {
    await updateTitleInDB(sessionId, title);
    
    const state = get();
    const updatedSessions = state.sessions.map(s => 
      s.id === sessionId ? { ...s, title } : s
    );
    
    set({ 
      sessions: updatedSessions,
      currentSession: state.activeSessionId === sessionId 
        ? { ...state.currentSession!, title }
        : state.currentSession
    });
  },

  updateSessionSettings: async (sessionId: string, provider: Provider, model: string) => {
    const state = get();
    const session = state.sessions.find(s => s.id === sessionId);
    
    if (!session) return;

    const updatedSession = {
      ...session,
      provider,
      model,
      updatedAt: new Date().toISOString(),
    };

    // Save to DB
    await saveSessionToDB(updatedSession);

    // Update in memory
    const updatedSessions = state.sessions.map(s => 
      s.id === sessionId ? updatedSession : s
    );
    
    set({ 
      sessions: updatedSessions,
      currentSession: state.activeSessionId === sessionId 
        ? updatedSession
        : state.currentSession
    });
  },

  updateSessionParameters: async (sessionId: string, parameters: ModelParameters) => {
    const state = get();
    const session = state.sessions.find(s => s.id === sessionId);
    
    if (!session) return;

    const updatedSession = {
      ...session,
      modelParameters: { ...session.modelParameters, ...parameters },
      updatedAt: new Date().toISOString(),
    };

    // Save to DB
    await saveSessionToDB(updatedSession);

    // Update in memory
    const updatedSessions = state.sessions.map(s => 
      s.id === sessionId ? updatedSession : s
    );
    
    set({ 
      sessions: updatedSessions,
      currentSession: state.activeSessionId === sessionId 
        ? updatedSession
        : state.currentSession
    });
  },

  createCheckpoint: async (reason: 'manual' | 'token_limit' | 'topic_change' = 'manual') => {
    const state = get();
    if (!state.currentSession) return;

    const { getAPIKey, helperModel } = useSettingsStore.getState();
    const apiKey = getAPIKey('openrouter');

    if (!apiKey) {
      set({ error: 'OpenRouter API key required for checkpoints' });
      return;
    }

    set({ isLoading: true });

    try {
      const summary = await AiPolisherTasks.summarizeConversation(
        state.currentSession.messages,
        apiKey,
        helperModel
      );

      const lastMessage = state.currentSession.messages[state.currentSession.messages.length - 1];
      
      const checkpoint: SessionCheckpoint = {
        id: uuidv4(),
        summary,
        lastMessageId: lastMessage?.id || '',
        timestamp: new Date().toISOString(),
        reason,
      };

      const updatedSession = {
        ...state.currentSession,
        checkpoints: [...(state.currentSession.checkpoints || []), checkpoint],
        updatedAt: new Date().toISOString(),
      };

      set({ currentSession: updatedSession });
      
      // Update sessions array
      const updatedSessions = state.sessions.map(s => 
        s.id === updatedSession.id ? updatedSession : s
      );
      set({ sessions: updatedSessions });
      
      // Save to DB
      await saveSessionToDB(updatedSession);
      
    } catch (error) {
      console.error('Failed to create checkpoint:', error);
      set({ error: 'Failed to create checkpoint' });
    } finally {
      set({ isLoading: false });
    }
  },
  
  addUserMessage: (content: string, attachments?: Attachment[], topicChanged?: boolean, topicChangeReasoning?: string) => {
    const state = get();
    if (!state.currentSession) {
      throw new Error('No active session');
    }
    
    const message: ChatMessage = {
      id: uuidv4(),
      role: 'user',
      content,
      attachments,
      timestamp: new Date().toISOString(),
      responses: [],
      currentResponseIndex: 0,
      topicChanged,
      topicChangeReasoning,
    };
    
    const updatedSession = {
      ...state.currentSession,
      messages: [...state.currentSession.messages, message],
      updatedAt: new Date().toISOString(),
      // Auto-generate title from first message if not set
      title: state.currentSession.title || generateSessionTitle(content),
    };
    
    // Update in memory
    set({ currentSession: updatedSession });
    
    // Update sessions array
    const updatedSessions = state.sessions.map(s => 
      s.id === updatedSession.id ? updatedSession : s
    );
    set({ sessions: updatedSessions });
    
    // Save to DB (async, don't wait)
    saveSessionToDB(updatedSession).catch(err => 
      console.error('Failed to save session:', err)
    );
    
    return message;
  },
  
  addAIResponse: (userMessageId: string, response: AIResponse) => {
    const state = get();
    if (!state.currentSession) {
      throw new Error('No active session');
    }
    
    const messages = state.currentSession.messages.map(msg => {
      if (msg.id === userMessageId && msg.role === 'user') {
        const responses = msg.responses || [];
        const newResponses = [...responses, response];
        return {
          ...msg,
          responses: newResponses,
          currentResponseIndex: newResponses.length - 1,
        };
      }
      return msg;
    });
    
    const updatedSession = {
      ...state.currentSession,
      messages,
      updatedAt: new Date().toISOString(),
    };
    
    // Update in memory
    set({ currentSession: updatedSession });
    
    // Update sessions array
    const updatedSessions = state.sessions.map(s => 
      s.id === updatedSession.id ? updatedSession : s
    );
    set({ sessions: updatedSessions });
    
    // Save to DB (async, don't wait)
    saveSessionToDB(updatedSession).catch(err => 
      console.error('Failed to save session:', err)
    );
  },

  updateAIResponseStatus: (userMessageId: string, responseId: string, updates: Partial<AIResponse>) => {
    const state = get();
    if (!state.currentSession) {
      throw new Error('No active session');
    }
    
    const messages = state.currentSession.messages.map(msg => {
      if (msg.id === userMessageId && msg.role === 'user') {
        const responses = (msg.responses || []).map(resp => {
          if (resp.id === responseId) {
            return { ...resp, ...updates };
          }
          return resp;
        });
        return { ...msg, responses };
      }
      return msg;
    });
    
    const updatedSession = {
      ...state.currentSession,
      messages,
      updatedAt: new Date().toISOString(),
    };
    
    // Update in memory
    set({ currentSession: updatedSession });
    
    // Update sessions array
    const updatedSessions = state.sessions.map(s => 
      s.id === updatedSession.id ? updatedSession : s
    );
    set({ sessions: updatedSessions });
    
    // Save to DB (async, don't wait)
    saveSessionToDB(updatedSession).catch(err => 
      console.error('Failed to save session:', err)
    );
  },

  updateAIResponseNote: (userMessageId: string, responseId: string, note: string) => {
    const state = get();
    if (!state.currentSession) {
      throw new Error('No active session');
    }
    
    const messages = state.currentSession.messages.map(msg => {
      if (msg.id === userMessageId && msg.role === 'user') {
        const responses = (msg.responses || []).map(resp => {
          if (resp.id === responseId) {
            return { ...resp, notes: note };
          }
          return resp;
        });
        return { ...msg, responses };
      }
      return msg;
    });
    
    const updatedSession = {
      ...state.currentSession,
      messages,
      updatedAt: new Date().toISOString(),
    };
    
    // Update in memory
    set({ currentSession: updatedSession });
    
    // Update sessions array
    const updatedSessions = state.sessions.map(s => 
      s.id === updatedSession.id ? updatedSession : s
    );
    set({ sessions: updatedSessions });
    
    // Save to DB (async, don't wait)
    saveSessionToDB(updatedSession).catch(err => 
      console.error('Failed to save session:', err)
    );
  },
  
  setCurrentResponseIndex: (messageId: string, index: number) => {
    const state = get();
    if (!state.currentSession) return;
    
    const messages = state.currentSession.messages.map(msg => {
      if (msg.id === messageId && msg.role === 'user') {
        const responseCount = msg.responses?.length || 0;
        if (index >= 0 && index < responseCount) {
          return { ...msg, currentResponseIndex: index };
        }
      }
      return msg;
    });
    
    const updatedSession = {
      ...state.currentSession,
      messages,
      updatedAt: new Date().toISOString(),
    };
    
    set({ currentSession: updatedSession });
    
    // Update sessions array
    const updatedSessions = state.sessions.map(s => 
      s.id === updatedSession.id ? updatedSession : s
    );
    set({ sessions: updatedSessions });
  },

  removeMessage: (messageId: string) => {
    const state = get();
    if (!state.currentSession) return;

    const messages = state.currentSession.messages.filter(msg => msg.id !== messageId);

    const updatedSession = {
      ...state.currentSession,
      messages,
      updatedAt: new Date().toISOString(),
    };

    // Update in memory
    set({ currentSession: updatedSession });

    // Update sessions array
    const updatedSessions = state.sessions.map(s =>
      s.id === updatedSession.id ? updatedSession : s
    );
    set({ sessions: updatedSessions });

    // Save to DB (async, don't wait)
    saveSessionToDB(updatedSession).catch(err =>
      console.error('Failed to save session:', err)
    );
  },

  startPolling: (responseId: string, interval: ReturnType<typeof setInterval>) => {
    const state = get();
    state.pollingIntervals.set(responseId, interval);
  },

  stopPolling: (responseId: string) => {
    const state = get();
    const interval = state.pollingIntervals.get(responseId);
    if (interval) {
      clearInterval(interval);
      state.pollingIntervals.delete(responseId);
    }
  },

  stopAllPolling: () => {
    const state = get();
    state.pollingIntervals.forEach(interval => clearInterval(interval));
    state.pollingIntervals.clear();
  },
  
  setLoading: (loading: boolean) => {
    set({ isLoading: loading });
  },
  
  setError: (error: string | null) => {
    set({ error });
  },
  
  clearError: () => {
    set({ error: null });
  },

  saveCurrentSession: async () => {
    const state = get();
    if (state.currentSession) {
      await saveSessionToDB(state.currentSession);
    }
  },
  
  toggleMessageCollapse: (messageId: string) => {
    const state = get();
    if (!state.currentSession) return;

    const messages = state.currentSession.messages.map(msg => {
      if (msg.id === messageId) {
        return { ...msg, isCollapsed: !msg.isCollapsed };
      }
      return msg;
    });

    const updatedSession = {
      ...state.currentSession,
      messages,
      updatedAt: new Date().toISOString(),
    };

    set({ currentSession: updatedSession });

    // Update sessions array
    const updatedSessions = state.sessions.map(s => 
      s.id === updatedSession.id ? updatedSession : s
    );
    set({ sessions: updatedSessions });

    // Save to DB
    saveSessionToDB(updatedSession).catch(err => 
      console.error('Failed to save session:', err)
    );
  },
}));
