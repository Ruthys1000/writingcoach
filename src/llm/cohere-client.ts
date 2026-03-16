// ============================================================
// WritingCoach — Cohere Client (On-Prem / Cloud)
// Uses Cohere Chat API v2.
// Env vars:
//   COHERE_API_KEY   — your Cohere API key
//   COHERE_BASE_URL  — override for on-prem deployments
//   COHERE_MODEL     — e.g. command-r, command-r-plus
// ============================================================

import { LLMClient } from './base';

interface CohereResponse {
  message: {
    content: Array<{ type: string; text: string }>;
  };
}

export class CohereClient extends LLMClient {
  private baseUrl: string;
  private apiKey: string;
  private model: string;

  constructor(
    apiKey = process.env.COHERE_API_KEY ?? '',
    baseUrl = process.env.COHERE_BASE_URL ?? 'https://api.cohere.com/v2',
    model = process.env.COHERE_MODEL ?? 'command-r',
  ) {
    super();
    if (!apiKey) throw new Error('COHERE_API_KEY is required');
    this.apiKey = apiKey;
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.model = model;
  }

  async chat(systemPrompt: string, userMessage: string): Promise<string> {
    const url = `${this.baseUrl}/chat`;

    const body = JSON.stringify({
      model: this.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
      temperature: 0.2,
      max_tokens: 4096,
    });

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body,
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Cohere request failed (${response.status}): ${err}`);
    }

    const data = (await response.json()) as CohereResponse;
    const textBlock = data.message.content.find((b) => b.type === 'text');
    if (!textBlock) throw new Error('Cohere returned no text content');
    return textBlock.text;
  }
}
