// ============================================================
// WritingCoach — Ollama Client (Local / Airgap)
// Connects to a locally-running Ollama instance.
// Zero data leaves the network — fully airgap-compliant.
// ============================================================

import { LLMClient } from './base';

interface OllamaResponse {
  model: string;
  created_at: string;
  message: { role: string; content: string };
  done: boolean;
}

export class OllamaClient extends LLMClient {
  private baseUrl: string;
  private model: string;

  constructor(
    baseUrl = process.env.OLLAMA_BASE_URL ?? 'http://localhost:11434',
    model = process.env.OLLAMA_MODEL ?? 'llama3',
  ) {
    super();
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.model = model;
  }

  async chat(systemPrompt: string, userMessage: string): Promise<string> {
    const url = `${this.baseUrl}/api/chat`;

    const body = JSON.stringify({
      model: this.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
      stream: false,
      options: {
        temperature: 0.2,
        num_predict: 4096,
      },
    });

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Ollama request failed (${response.status}): ${err}`);
    }

    const data = (await response.json()) as OllamaResponse;
    return data.message.content;
  }
}
