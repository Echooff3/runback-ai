import { OpenRouterClient } from './api/openrouter';
import type { ChatMessage } from '../types';

export interface TopicClassificationResult {
  topic_changed: boolean;
  confidence?: number;
  reasoning?: string;
}

export class TopicClassifier {
  private static readonly CLASSIFIER_MODEL = 'microsoft/phi-3-mini-128k-instruct';
  
  /**
   * Determines if the new user input represents a topic change from the previous conversation.
   * Returns a classification result indicating if the topic has changed.
   */
  static async classifyTopicChange(
    newInput: string,
    previousMessages: ChatMessage[],
    apiKey: string
  ): Promise<TopicClassificationResult> {
    // If no previous messages, it's not a topic change (it's the first message)
    if (previousMessages.length === 0) {
      return { topic_changed: false };
    }

    const client = new OpenRouterClient(apiKey);
    
    const systemPrompt = `You are a classifier. Your task is to determine if the new user input continues the previous topic or represents a topic change.

Instructions:
- Analyze the conversation history and the new input.
- If the new input is a continuation (e.g., "tell me more", "what about X aspect", follow-up questions), set topic_changed to false.
- If the new input is a clear topic change (e.g., "actually, let's talk about X instead", "switching topics", new unrelated question), set topic_changed to true.
- Output ONLY valid JSON in this exact format: { "topic_changed": true } or { "topic_changed": false }
- Do not include any other text, explanations, or formatting.`;

    // Get last 3-5 messages for context (to keep it efficient)
    const recentMessages = previousMessages.slice(-5);
    
    // Build conversation context
    const conversationContext = recentMessages.map(msg => {
      const role = msg.role.toUpperCase();
      if (msg.role === 'user') {
        return `${role}: ${msg.content}`;
      } else {
        // For assistant messages, use the current response
        const response = msg.responses?.[msg.currentResponseIndex || 0];
        return response ? `ASSISTANT: ${response.content}` : '';
      }
    }).filter(Boolean).join('\n');

    const userPrompt = `Previous conversation:
${conversationContext}

New input: ${newInput}`;

    try {
      const response = await client.sendMessage(
        this.CLASSIFIER_MODEL,
        [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        false // Disable web search for classification
      );

      // Parse the JSON response
      const content = response.content.trim();
      
      // Try to extract JSON from the response
      let jsonMatch = content.match(/\{[^}]*"topic_changed"\s*:\s*(true|false)[^}]*\}/);
      if (!jsonMatch) {
        // Fallback: check if response contains true/false
        const lowerContent = content.toLowerCase();
        if (lowerContent.includes('"topic_changed": true') || lowerContent.includes("'topic_changed': true")) {
          return { topic_changed: true };
        } else if (lowerContent.includes('"topic_changed": false') || lowerContent.includes("'topic_changed': false")) {
          return { topic_changed: false };
        }
        
        // If we can't parse it, assume no topic change to be safe
        console.warn('[TopicClassifier] Could not parse classifier response:', content);
        return { topic_changed: false };
      }

      const result = JSON.parse(jsonMatch[0]) as TopicClassificationResult;
      return result;
    } catch (error) {
      console.error('[TopicClassifier] Classification failed:', error);
      // On error, assume no topic change to avoid unwanted checkpoints
      return { topic_changed: false };
    }
  }
}
