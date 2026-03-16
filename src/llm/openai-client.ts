// ============================================================
// WritingCoach — OpenAI-Compatible Client (On-Prem / Airgap)
// Works with any OpenAI-compatible endpoint:
//   - vLLM, LocalAI, LM Studio, Azure OpenAI, GPT4All server
// Env vars:
//   OPENAI_BASE_URL  — e.g. http://my-server:8000/v1
//   OPENAI_API_KEY   — token (use any string if not required)
//   OPENAI_MODEL     — model name as served by the endpoint
// ============================================================

import { LLMClient } from './base';

interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface OpenAIResponse {
  choices: Array<{
    message: OpenAIMessage;
    finish_reason: string;
  }>;
}

export class OpenAICompatibleClient extends LLMClient {
  private baseUrl: string;
  private apiKey: string;
  private model: string;

  constructor(
    baseUrl = process.env.OPENAI_BASE_URL ?? 'http://localhost:8000/v1',
    apiKey = process.env.OPENAI_API_KEY ?? 'no-key',
    model = process.env.OPENAI_MODEL ?? 'gpt-3.5-turbo',
  ) {
    super();
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.apiKey = apiKey;
    this.model = model;
  }

  async chat(systemPrompt: string, userMessage: string): Promise<string> {
    const url = `${this.baseUrl}/chat/completions`;

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
      throw new Error(`OpenAI-compatible request failed (${response.status}): ${err}`);
    }

    const data = (await response.json()) as OpenAIResponse;
    return data.choices[0].message.content;
  }
}
