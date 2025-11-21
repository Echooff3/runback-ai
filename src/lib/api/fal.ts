import * as fal from '@fal-ai/serverless-client';

// Test model for connection validation
const TEST_MODEL = 'fal-ai/fast-llm';

export class FalClient {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    fal.config({
      credentials: apiKey,
    });
  }

  async fetchAvailableModels(): Promise<any[]> {
    try {
      const response = await fetch('https://api.fal.ai/v1/models', {
        method: 'GET',
        headers: {
          Authorization: `Key ${this.apiKey}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch models: ${response.statusText}`);
      }

      const data = await response.json();
      return data.models || data || [];
    } catch (error) {
      console.error('Failed to fetch FAL models:', error);
      throw error;
    }
  }

  async sendMessage(
    model: string,
    prompt: string,
    systemPrompt?: string
  ): Promise<{ content: string; responseTime: number }> {
    const startTime = Date.now();

    try {
      const result = await fal.subscribe(model, {
        input: {
          prompt,
          system_prompt: systemPrompt,
        },
        logs: false,
      });

      const responseTime = Date.now() - startTime;
      
      // Handle different output formats
      let content = '';
      if (result && typeof result === 'object') {
        // Try common output field names
        const data = result as any;
        content = data.output || data.text || data.content || JSON.stringify(result);
      } else if (typeof result === 'string') {
        content = result;
      }

      return { content, responseTime };
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Fal.ai API error: ${error.message}`);
      }
      throw error;
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.sendMessage(TEST_MODEL, 'Hello');
      return true;
    } catch (error) {
      console.error('Fal.ai connection test failed:', error);
      return false;
    }
  }
}

// Available models for Fal.ai
export const FAL_MODELS = [
  { id: 'fal-ai/fast-llm', name: 'Fast LLM' },
  { id: 'fal-ai/llama-3-70b', name: 'Llama 3 70B' },
  { id: 'fal-ai/llama-3-8b', name: 'Llama 3 8B' },
];
