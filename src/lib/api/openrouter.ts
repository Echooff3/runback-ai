import axios from 'axios';

export interface OpenRouterMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface OpenRouterRequest {
  model: string;
  messages: OpenRouterMessage[];
}

export interface OpenRouterResponse {
  id: string;
  choices: {
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }[];
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
}

// Test model for connection validation
const TEST_MODEL = 'openai/gpt-3.5-turbo';

export class OpenRouterClient {
  private apiKey: string;
  private endpoint: string;

  constructor(apiKey: string, endpoint?: string) {
    this.apiKey = apiKey;
    this.endpoint = endpoint || 'https://openrouter.ai/api/v1/chat/completions';
  }

  async sendMessage(
    model: string,
    messages: OpenRouterMessage[]
  ): Promise<{ content: string; tokenCount?: number; responseTime: number }> {
    const startTime = Date.now();

    try {
      const response = await axios.post<OpenRouterResponse>(
        this.endpoint,
        {
          model,
          messages,
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': typeof window !== 'undefined' ? window.location.origin : 'https://runback.ai',
            'X-Title': 'RunBack AI',
          },
        }
      );

      const responseTime = Date.now() - startTime;
      const content = response.data.choices[0]?.message?.content || '';
      const tokenCount = response.data.usage?.total_tokens;

      return { content, tokenCount, responseTime };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const message = error.response?.data?.error?.message || error.message;
        // Add context about the model being used if it's a 404
        if (error.response?.status === 404) {
          throw new Error(`OpenRouter API error (404): Model '${model}' not found or endpoint invalid. ${message}`);
        }
        throw new Error(`OpenRouter API error: ${message}`);
      }
      throw error;
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.sendMessage(TEST_MODEL, [
        { role: 'user', content: 'Hello' }
      ]);
      return true;
    } catch (error) {
      console.error('OpenRouter connection test failed:', error);
      return false;
    }
  }

  async getModels(): Promise<{ id: string; context_length: number }[]> {
    try {
      const response = await axios.get('https://openrouter.ai/api/v1/models');
      return response.data.data;
    } catch (error) {
      console.error('Failed to fetch OpenRouter models:', error);
      return [];
    }
  }
}

// Helper to estimate token count (rough approximation: 4 chars per token)
export const estimateTokenCount = (text: string): number => {
  return Math.ceil(text.length / 4);
};

// Available models for OpenRouter
export const OPENROUTER_MODELS = [
  { id: 'openai/gpt-4-turbo', name: 'GPT-4 Turbo' },
  { id: 'openai/gpt-4', name: 'GPT-4' },
  { id: 'openai/gpt-3.5-turbo', name: 'GPT-3.5 Turbo' },
  { id: 'anthropic/claude-3-opus', name: 'Claude 3 Opus' },
  { id: 'anthropic/claude-3-sonnet', name: 'Claude 3 Sonnet' },
  { id: 'anthropic/claude-3-haiku', name: 'Claude 3 Haiku' },
  { id: 'meta-llama/llama-3-70b-instruct', name: 'Llama 3 70B' },
  { id: 'meta-llama/llama-3-8b-instruct', name: 'Llama 3 8B' },
  { id: 'google/gemini-pro', name: 'Gemini Pro' },
  { id: 'mistralai/mixtral-8x7b-instruct', name: 'Mixtral 8x7B' },
];
