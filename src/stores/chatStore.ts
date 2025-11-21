import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { ChatMessage, ChatSession, AIResponse, Provider } from '../types';

interface ChatState {
  currentSession: ChatSession | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  initSession: (provider: Provider, model?: string, systemPromptId?: string) => void;
  addUserMessage: (content: string) => ChatMessage;
  addAIResponse: (userMessageId: string, response: AIResponse) => void;
  setCurrentResponseIndex: (messageId: string, index: number) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  clearSession: () => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  currentSession: null,
  isLoading: false,
  error: null,
  
  initSession: (provider: Provider, model?: string, systemPromptId?: string) => {
    const session: ChatSession = {
      id: uuidv4(),
      messages: [],
      systemPromptId,
      provider,
      model,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    set({ currentSession: session, error: null });
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
    };
    
    set({ currentSession: updatedSession });
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
          currentResponseIndex: newResponses.length - 1, // Show the latest response
        };
      }
      return msg;
    });
    
    const updatedSession = {
      ...state.currentSession,
      messages,
      updatedAt: new Date().toISOString(),
    };
    
    set({ currentSession: updatedSession });
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
  
  clearSession: () => {
    set({ currentSession: null, error: null, isLoading: false });
  },
}));
