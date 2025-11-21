import Replicate from 'replicate';

export class ReplicateClient {
  private client: Replicate;

  constructor(apiKey: string) {
    this.client = new Replicate({ auth: apiKey });
  }

  async sendMessage(
    model: string,
    prompt: string,
    systemPrompt?: string
  ): Promise<{ content: string; responseTime: number }> {
    const startTime = Date.now();

    try {
      // Combine system prompt with user prompt if provided
      const fullPrompt = systemPrompt 
        ? `${systemPrompt}\n\nUser: ${prompt}` 
        : prompt;

      const output = await this.client.run(
        model as `${string}/${string}:${string}`,
        {
          input: {
            prompt: fullPrompt,
          },
        }
      );

      const responseTime = Date.now() - startTime;
      
      // Handle different output formats
      let content = '';
      if (Array.isArray(output)) {
        content = output.join('');
      } else if (typeof output === 'string') {
        content = output;
      } else if (output && typeof output === 'object') {
        content = JSON.stringify(output);
      }

      return { content, responseTime };
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Replicate API error: ${error.message}`);
      }
      throw error;
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.sendMessage(
        'meta/meta-llama-3-8b-instruct',
        'Hello'
      );
      return true;
    } catch (error) {
      console.error('Replicate connection test failed:', error);
      return false;
    }
  }
}

// Available models for Replicate
export const REPLICATE_MODELS = [
  { id: 'meta/meta-llama-3-70b-instruct', name: 'Llama 3 70B Instruct' },
  { id: 'meta/meta-llama-3-8b-instruct', name: 'Llama 3 8B Instruct' },
  { id: 'mistralai/mixtral-8x7b-instruct-v0.1', name: 'Mixtral 8x7B Instruct' },
  { id: 'mistralai/mistral-7b-instruct-v0.2', name: 'Mistral 7B Instruct' },
];
