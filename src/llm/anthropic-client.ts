// ============================================================
// WritingCoach — Anthropic Claude Client
// For development and cloud-based usage.
// ============================================================

import Anthropic from '@anthropic-ai/sdk';
import { LLMClient } from './base';

export class AnthropicClient extends LLMClient {
  private client: Anthropic;
  private model: string;

  constructor(apiKey?: string, model = 'claude-opus-4-6') {
    super();
    this.client = new Anthropic({ apiKey: apiKey ?? process.env.ANTHROPIC_API_KEY });
    this.model = model;
  }

  async chat(systemPrompt: string, userMessage: string): Promise<string> {
    // Use streaming with get_final_message to avoid timeouts on large inputs
    const stream = this.client.messages.stream({
      model: this.model,
      max_tokens: 4096,
      thinking: { type: 'adaptive' },
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
    });

    const message = await stream.finalMessage();

    const textBlock = message.content.find((b) => b.type === 'text');
    if (!textBlock || textBlock.type !== 'text') {
      throw new Error('No text block in LLM response');
    }
    return textBlock.text;
  }
}
