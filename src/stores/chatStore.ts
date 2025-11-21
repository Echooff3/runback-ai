import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { ChatMessage, ChatSession, AIResponse, Provider } from '../types';
import { 
  saveSession as saveSessionToDB, 
  loadOpenSessions,
  loadAllSessions as loadAllSessionsFromDB,
  deleteSession as deleteSessionFromDB,
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
  createNewSession: (provider: Provider, model?: string, systemPromptId?: string) => Promise<void>;
  switchSession: (sessionId: string) => void;
  closeSessionTab: (sessionId: string) => Promise<void>;
  reopenSession: (sessionId: string) => Promise<void>;
  deleteSession: (sessionId: string) => Promise<{ success: boolean; error?: string }>;
  toggleStarSession: (sessionId: string) => Promise<void>;
  updateSessionTitle: (sessionId: string, title: string) => Promise<void>;
  updateSessionSettings: (sessionId: string, provider: Provider, model: string) => Promise<void>;
  
  // Message actions
  addUserMessage: (content: string) => ChatMessage;
  addAIResponse: (userMessageId: string, response: AIResponse) => void;
  updateAIResponseStatus: (userMessageId: string, responseId: string, updates: Partial<AIResponse>) => void;
  setCurrentResponseIndex: (messageId: string, index: number) => void;
  
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
      const sessions = await loadOpenSessions();
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
  
  createNewSession: async (provider: Provider, model?: string, systemPromptId?: string) => {
    const newSession = createSession(provider, model, systemPromptId);
    await saveSessionToDB(newSession);
    
    const state = get();
    set({ 
      sessions: [newSession, ...state.sessions],
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
  
  addUserMessage: (content: string) => {
    const state = get();
    if (!state.currentSession) {
      throw new Error('No active session');
    }
    
    const message: ChatMessage = {
      id: uuidv4(),
      role: 'user',
      content,
      timestamp: new Date().toISOString(),
      responses: [],
      currentResponseIndex: 0,
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
}));
