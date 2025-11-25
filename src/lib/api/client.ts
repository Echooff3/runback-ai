import { v4 as uuidv4 } from 'uuid';
import { OpenRouterClient, type OpenRouterMessage } from './openrouter';
import { ReplicateClient } from './replicate';
import { FalClient } from './fal';
import type { Provider, AIResponse, Attachment } from '../../types';
import { getAPIConfig } from '../storage/localStorage';

export interface SendMessageOptions {
  provider: Provider;
  model: string;
  userMessage: string;
  systemPrompt?: string;
  conversationHistory?: { role: 'user' | 'assistant' | 'system'; content: string }[];
  additionalParameters?: Record<string, any>;
  attachments?: Attachment[];
}

export class AIClient {
  private openRouterClient: OpenRouterClient | null = null;
  private replicateClient: ReplicateClient | null = null;
  private falClient: FalClient | null = null;

  constructor() {
    this.initializeClients();
  }

  private initializeClients() {
    const openrouterConfig = getAPIConfig('openrouter');
    if (openrouterConfig?.apiKey) {
      this.openRouterClient = new OpenRouterClient(
        openrouterConfig.apiKey,
        openrouterConfig.endpoint
      );
    }

    const replicateConfig = getAPIConfig('replicate');
    if (replicateConfig?.apiKey) {
      this.replicateClient = new ReplicateClient(replicateConfig.apiKey);
    }

    const falConfig = getAPIConfig('fal');
    if (falConfig?.apiKey) {
      this.falClient = new FalClient(falConfig.apiKey);
    }
  }

  async sendMessage(options: SendMessageOptions): Promise<AIResponse> {
    const { provider, model, userMessage, systemPrompt, conversationHistory, additionalParameters, attachments } = options;

    let result: { content: string; tokenCount?: number; responseTime: number };

    switch (provider) {
      case 'openrouter':
        if (!this.openRouterClient) {
          throw new Error('OpenRouter is not configured');
        }
        result = await this.sendOpenRouterMessage(
          model,
          userMessage,
          systemPrompt,
          conversationHistory,
          attachments
        );
        break;

      case 'replicate':
        if (!this.replicateClient) {
          throw new Error('Replicate is not configured');
        }
        result = await this.sendReplicateMessage(model, userMessage, systemPrompt);
        break;

      case 'fal':
        if (!this.falClient) {
          throw new Error('Fal.ai is not configured');
        }
        result = await this.sendFalMessage(model, userMessage, systemPrompt, additionalParameters);
        break;

      default:
        throw new Error(`Unknown provider: ${provider}`);
    }

    const response: AIResponse = {
      id: uuidv4(),
      content: result.content,
      provider,
      model,
      timestamp: new Date().toISOString(),
      generationNumber: 1, // Will be updated by the caller if it's a re-run
      metadata: {
        tokenCount: result.tokenCount,
        responseTime: result.responseTime,
      },
    };

    return response;
  }

  private async sendOpenRouterMessage(
    model: string,
    userMessage: string,
    systemPrompt?: string,
    conversationHistory?: { role: 'user' | 'assistant' | 'system'; content: string }[],
    attachments?: Attachment[]
  ): Promise<{ content: string; tokenCount?: number; responseTime: number }> {
    if (!this.openRouterClient) {
      throw new Error('OpenRouter client not initialized');
    }

    const messages: OpenRouterMessage[] = [];

    // Add system prompt if provided
    if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt });
    }

    // Add conversation history if provided
    if (conversationHistory && conversationHistory.length > 0) {
      // We need to map conversation history to OpenRouterMessage format
      // Assuming conversationHistory content is string for now, as we don't store attachments in history yet
      // If we did, we'd need to handle that here too.
      messages.push(...conversationHistory.map(msg => ({
        role: msg.role,
        content: msg.content
      })));
    }

    // Add current user message
    if (attachments && attachments.length > 0) {
      const content: any[] = [
        { type: 'text', text: userMessage }
      ];
      
      attachments.forEach(att => {
        if (att.type === 'image') {
          content.push({
            type: 'image_url',
            image_url: {
              url: att.content
            }
          });
        }
      });
      
      messages.push({ role: 'user', content });
    } else {
      messages.push({ role: 'user', content: userMessage });
    }

    return await this.openRouterClient.sendMessage(model, messages);
  }

  private async sendReplicateMessage(
    model: string,
    userMessage: string,
    systemPrompt?: string
  ): Promise<{ content: string; responseTime: number }> {
    if (!this.replicateClient) {
      throw new Error('Replicate client not initialized');
    }

    return await this.replicateClient.sendMessage(model, userMessage, systemPrompt);
  }

  private async sendFalMessage(
    model: string,
    userMessage: string,
    systemPrompt?: string,
    additionalParameters?: Record<string, any>
  ): Promise<{ content: string; responseTime: number }> {
    if (!this.falClient) {
      throw new Error('Fal client not initialized');
    }

    return await this.falClient.sendMessage(model, userMessage, systemPrompt, additionalParameters);
  }

  // Reinitialize clients when API keys change
  refreshClients() {
    this.initializeClients();
  }

  async getOpenRouterModels(): Promise<{ id: string; context_length: number }[]> {
    if (!this.openRouterClient) {
      // Try to initialize if not already done (e.g. if key was just added)
      const openrouterConfig = getAPIConfig('openrouter');
      if (openrouterConfig?.apiKey) {
        this.openRouterClient = new OpenRouterClient(
          openrouterConfig.apiKey,
          openrouterConfig.endpoint
        );
      }
    }
    
    if (this.openRouterClient) {
      return await this.openRouterClient.getModels();
    }
    return [];
  }
}

// Singleton instance
let aiClientInstance: AIClient | null = null;

export function getAIClient(): AIClient {
  if (!aiClientInstance) {
    aiClientInstance = new AIClient();
  }
  return aiClientInstance;
}

export function resetAIClient(): void {
  aiClientInstance = null;
}
