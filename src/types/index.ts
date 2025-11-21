// Core types for the application

export type Theme = 'light' | 'dark' | 'system';

export type Provider = 'openrouter' | 'replicate' | 'fal';

export interface APIConfig {
  provider: Provider;
  apiKey: string;
  endpoint?: string;
  isConfigured: boolean;
  lastTested?: string;
  testStatus?: 'success' | 'error';
}

export interface AppSettings {
  theme: Theme;
  apiConfigs: APIConfig[];
  version: string;
}

export interface SystemPrompt {
  id: string;
  name: string;
  content: string;
  description?: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
  usageCount: number;
  isDefault: boolean;
}

export interface SlashPrompt {
  id: string;
  command: string;
  description: string;
  template: string;
  variables: {
    name: string;
    description: string;
    defaultValue?: string;
  }[];
  createdAt: string;
  updatedAt: string;
  usageCount: number;
  isDefault: boolean;
}

export type QueueStatus = 'pending' | 'queued' | 'in_progress' | 'completed' | 'failed';

export interface MediaAsset {
  type: 'image' | 'video' | 'audio';
  url: string;
  contentType?: string;
  filename?: string;
}

export interface AIResponse {
  id: string;
  content: string;
  provider: Provider;
  model?: string;
  timestamp: string;
  generationNumber: number;
  status?: QueueStatus;
  requestId?: string;
  logs?: string[];
  mediaAssets?: MediaAsset[];
  metadata?: {
    tokenCount?: number;
    responseTime?: number;
    cost?: number;
  };
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  responses?: AIResponse[];
  currentResponseIndex?: number;
  provider?: Provider;
  model?: string;
  metadata?: {
    tokenCount?: number;
    responseTime?: number;
    cost?: number;
  };
}

export interface ModelParameters {
  [key: string]: any;
}

export interface ChatSession {
  id: string;
  title?: string;
  messages: ChatMessage[];
  systemPromptId?: string;
  provider: Provider;
  model?: string;
  modelParameters?: ModelParameters;
  createdAt: string;
  updatedAt: string;
  isStarred: boolean;
  isClosed: boolean;
}
