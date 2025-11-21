import Replicate from 'replicate';

// Test model for connection validation
const TEST_MODEL = 'meta/meta-llama-3-8b-instruct';

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
      await this.sendMessage(TEST_MODEL, 'Hello');
      return true;
    } catch (error) {
      console.error('Replicate connection test failed:', error);
      return false;
    }
  }
}

// Popular Replicate models (static list due to CORS restrictions on browser-side API calls)
export const REPLICATE_MODELS = [
  { id: 'meta/meta-llama-3-70b-instruct', name: 'Llama 3 70B Instruct', description: 'Meta\'s large instruction-tuned model' },
  { id: 'meta/meta-llama-3-8b-instruct', name: 'Llama 3 8B Instruct', description: 'Efficient instruction-tuned model' },
  { id: 'meta/llama-2-70b-chat', name: 'Llama 2 70B Chat', description: 'Large chat model' },
  { id: 'meta/llama-2-13b-chat', name: 'Llama 2 13B Chat', description: 'Medium chat model' },
  { id: 'meta/llama-2-7b-chat', name: 'Llama 2 7B Chat', description: 'Small efficient chat model' },
  { id: 'mistralai/mixtral-8x7b-instruct-v0.1', name: 'Mixtral 8x7B Instruct', description: 'Mixture of experts model' },
  { id: 'mistralai/mistral-7b-instruct-v0.2', name: 'Mistral 7B Instruct v0.2', description: 'Efficient 7B instruction model' },
  { id: 'mistralai/mistral-7b-v0.1', name: 'Mistral 7B v0.1', description: 'Base 7B model' },
  { id: 'stability-ai/sdxl', name: 'Stable Diffusion XL', description: 'Text-to-image generation' },
  { id: 'stability-ai/stable-diffusion', name: 'Stable Diffusion', description: 'Image generation model' },
];
