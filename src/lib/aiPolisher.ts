import { OpenRouterClient } from './api/openrouter';
import type { ChatMessage } from '../types';

export class AiPolisherTasks {
  static async summarizeConversation(
    messages: ChatMessage[],
    apiKey: string,
    model: string
  ): Promise<string> {
    if (messages.length === 0) return '';

    const client = new OpenRouterClient(apiKey);
    
    const systemPrompt = "Summarize the following conversation history into a concise context paragraph. This summary will be used to provide context for an LLM in future turns. Capture key decisions, user preferences, and the current state of the discussion. Be concise. Only return the summary.";

    // Convert ChatMessage[] to a string format for the summarizer
    const conversationText = messages.map(msg => {
      const role = msg.role.toUpperCase();
      let content = msg.content;
      
      // If it's a user message with responses, we might want to include the selected response
      if (msg.role === 'user' && msg.responses && msg.responses.length > 0) {
        const response = msg.responses[msg.currentResponseIndex || 0];
        return `${role}: ${content}\nASSISTANT: ${response.content}`;
      }
      
      return `${role}: ${content}`;
    }).join('\n\n');

    try {
      const response = await client.sendMessage(model, [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: conversationText }
      ]);

      return response.content.trim();
    } catch (error) {
      console.error('Failed to summarize conversation:', error);
      throw error;
    }
  }

  static async polishMusicStyle(
    originalStyle: string,
    apiKey: string,
    model: string
  ): Promise<string> {
    if (!originalStyle.trim()) return '';

    const client = new OpenRouterClient(apiKey);
    
    const systemPrompt = "give me a description of this band or mood or genre in musical terms for a music generator prompt. Keep it under 300 characters. do not include any punctuation. do not menition anyting in the original prompt that was provided. be concise and only return the description";

    try {
      const response = await client.sendMessage(model, [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: originalStyle }
      ]);

      return response.content.trim();
    } catch (error) {
      console.error('Failed to polish music style:', error);
      throw error;
    }
  }

  static async polishLyrics(
    originalLyrics: string,
    apiKey: string,
    model: string,
    targetModelId: string = 'fal-ai/minimax-music/v1.5'
  ): Promise<string> {
    if (!originalLyrics.trim()) return '';

    const client = new OpenRouterClient(apiKey);
    
    let systemPrompt = "";

    if (targetModelId.includes('v2')) {
      // Minimax 2.0 constraints
      systemPrompt = "Format the following lyrics for a music generator. Use \\n to separate lines. You may add structure tags like [Intro], [Verse], [Chorus], [Bridge], [Outro] to enhance the arrangement. Keep the total length between 10 and 3000 characters. Return only the formatted lyrics no additional information. be concise.";
    } else {
      // Minimax 1.5 constraints (default)
      systemPrompt = "Format the following lyrics for a music generator. Ensure they have a proper structure using [intro], [verse], [chorus], [bridge], [outro] tags. Keep the total length between 10 and 600 characters. If a chorus is repeated, use the [chorus] tag without repeating the text. Do not change the meaning or content significantly, just structure it. Return only the formatted lyrics no additional information. be concise.";
    }

    try {
      const response = await client.sendMessage(model, [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: originalLyrics }
      ]);

      return response.content.trim();
    } catch (error) {
      console.error('Failed to polish lyrics:', error);
      throw error;
    }
  }
}
