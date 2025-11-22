import { fal } from '@fal-ai/client';
import type { MediaAsset, QueueStatus } from '../../types';

// Test model for connection validation
const TEST_MODEL = 'fal-ai/fast-llm';

export interface QueueSubmitResult {
  requestId: string;
}

export interface QueueStatusResult {
  status: QueueStatus;
  logs?: string[];
}

export interface QueueResultData {
  content: string;
  responseTime: number;
  mediaAssets?: MediaAsset[];
}

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

  /**
   * Submit a request to the FAL queue
   */
  async submitToQueue(
    model: string,
    prompt: string,
    systemPrompt?: string,
    additionalParameters?: Record<string, any>
  ): Promise<QueueSubmitResult> {
    try {
      console.log('[FAL] submitToQueue called with:', {
        model,
        prompt,
        systemPrompt,
        additionalParameters
      });

      // Build input object with base parameters
      const input: Record<string, any> = {};

      // Handle prompt combination intelligently
      let finalPrompt = prompt;
      
      if (additionalParameters?.prompt) {
        const paramPrompt = additionalParameters.prompt;
        
        // Check if parameter prompt looks like a template with placeholder
        if (paramPrompt.includes('{input}') || paramPrompt.includes('{{input}}')) {
          finalPrompt = paramPrompt
            .replace(/\{input\}/g, prompt)
            .replace(/\{\{input\}\}/g, prompt);
        } else if (paramPrompt.includes('{user}') || paramPrompt.includes('{{user}}')) {
          finalPrompt = paramPrompt
            .replace(/\{user\}/g, prompt)
            .replace(/\{\{user\}\}/g, prompt);
        } else {
          finalPrompt = `${paramPrompt}\n\n${prompt}`;
        }
        
        const { prompt: _, ...restParams } = additionalParameters;
        input.prompt = finalPrompt;
        Object.assign(input, restParams);
      } else {
        input.prompt = prompt;
        
        if (additionalParameters) {
          Object.assign(input, additionalParameters);
        }
      }

      // Add system prompt if provided
      if (systemPrompt) {
        input.system_prompt = systemPrompt;
      }

      console.log('[FAL] Final input object being sent:', input);

      const { request_id } = await fal.queue.submit(model, {
        input,
      });

      return { requestId: request_id };
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Fal.ai queue submit error: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Check the status of a queued request
   */
  async checkQueueStatus(
    model: string,
    requestId: string
  ): Promise<QueueStatusResult> {
    try {
      const status = await fal.queue.status(model, {
        requestId,
        logs: true,
      });

      // Map FAL status to our QueueStatus type
      let queueStatus: QueueStatus = 'queued';
      
      if (status.status === 'IN_QUEUE') {
        queueStatus = 'queued';
      } else if (status.status === 'IN_PROGRESS') {
        queueStatus = 'in_progress';
      } else if (status.status === 'COMPLETED') {
        queueStatus = 'completed';
      }

      // Extract logs if available
      const logs: string[] = [];
      if ((status as any).logs && Array.isArray((status as any).logs)) {
        (status as any).logs.forEach((log: any) => {
          if (log.message) {
            logs.push(log.message);
          }
        });
      }

      return {
        status: queueStatus,
        logs: logs.length > 0 ? logs : undefined,
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Fal.ai queue status error: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Get the result of a completed queue request
   */
  async getQueueResult(
    model: string,
    requestId: string
  ): Promise<QueueResultData> {
    try {
      const result = await fal.queue.result(model, {
        requestId,
      });

      // Parse media assets from result
      const mediaAssets: MediaAsset[] = [];
      const data = result.data as any;

      // Check for images (common in image generation models)
      if (data.images && Array.isArray(data.images)) {
        data.images.forEach((img: any) => {
          const url = typeof img === 'string' ? img : img.url;
          if (url) {
            mediaAssets.push({
              type: 'image',
              url,
              contentType: img.content_type || 'image/png',
            });
          }
        });
      }

      // Check for single image
      if (data.image && typeof data.image === 'string') {
        mediaAssets.push({
          type: 'image',
          url: data.image,
          contentType: 'image/png',
        });
      }

      // Check for video
      if (data.video) {
        const videoUrl = typeof data.video === 'string' ? data.video : data.video.url;
        if (videoUrl) {
          mediaAssets.push({
            type: 'video',
            url: videoUrl,
            contentType: data.video.content_type || 'video/mp4',
          });
        }
      }

      // Check for audio
      if (data.audio) {
        const audioUrl = typeof data.audio === 'string' ? data.audio : data.audio.url;
        if (audioUrl) {
          mediaAssets.push({
            type: 'audio',
            url: audioUrl,
            contentType: data.audio.content_type || 'audio/mpeg',
          });
        }
      }

      // Extract text content
      let content = '';
      if (data.output || data.text || data.content) {
        content = data.output || data.text || data.content;
      } else if (mediaAssets.length > 0) {
        // If we have media but no text, create a description
        content = `Generated ${mediaAssets.length} ${mediaAssets[0].type}${mediaAssets.length > 1 ? 's' : ''}`;
      } else {
        content = JSON.stringify(result.data);
      }

      return {
        content,
        responseTime: 0, // Will be calculated by caller
        mediaAssets: mediaAssets.length > 0 ? mediaAssets : undefined,
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Fal.ai queue result error: ${error.message}`);
      }
      throw error;
    }
  }

  async sendMessage(
    model: string,
    prompt: string,
    systemPrompt?: string,
    additionalParameters?: Record<string, any>
  ): Promise<{ content: string; responseTime: number }> {
    const startTime = Date.now();

    try {
      console.log('[FAL] sendMessage called with:', {
        model,
        prompt,
        systemPrompt,
        additionalParameters
      });

      // Build input object with base parameters
      const input: Record<string, any> = {};

      // Handle prompt combination intelligently
      let finalPrompt = prompt;
      
      if (additionalParameters?.prompt) {
        const paramPrompt = additionalParameters.prompt;
        
        // Check if parameter prompt looks like a template with placeholder
        if (paramPrompt.includes('{input}') || paramPrompt.includes('{{input}}')) {
          // Replace placeholder with actual user input
          finalPrompt = paramPrompt
            .replace(/\{input\}/g, prompt)
            .replace(/\{\{input\}\}/g, prompt);
        } else if (paramPrompt.includes('{user}') || paramPrompt.includes('{{user}}')) {
          finalPrompt = paramPrompt
            .replace(/\{user\}/g, prompt)
            .replace(/\{\{user\}\}/g, prompt);
        } else {
          // No placeholder, append user input to parameter prompt
          finalPrompt = `${paramPrompt}\n\n${prompt}`;
        }
        
        // Remove prompt from additionalParameters to avoid duplication
        const { prompt: _, ...restParams } = additionalParameters;
        input.prompt = finalPrompt;
        Object.assign(input, restParams);
      } else {
        // No parameter prompt, use chat input directly
        input.prompt = prompt;
        
        // Merge other additional parameters
        if (additionalParameters) {
          Object.assign(input, additionalParameters);
        }
      }

      // Add system prompt if provided
      if (systemPrompt) {
        input.system_prompt = systemPrompt;
      }

      console.log('[FAL] Final input object being sent:', input);

      const result = await fal.subscribe(model, {
        input,
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
