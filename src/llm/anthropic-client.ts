// ============================================================
// WritingCoach — Anthropic Claude Client
// For development and cloud-based usage.
// ============================================================

import Anthropic from '@anthropic-ai/sdk';
import { LLMClient } from './base';

export class AnthropicClient extends LLMClient {
  private client: Anthropic;
  private model: string;

  constructor(apiKey?: string, model = 'claude-haiku-4-5') {
    super();

    // In sandboxed/container environments Node.js native fetch doesn't
    // honour https_proxy. Use node-fetch v2 + https-proxy-agent so the
    // Anthropic SDK reaches the API through the same proxy that curl uses.
    const proxyUrl =
      process.env.https_proxy ??
      process.env.HTTPS_PROXY ??
      process.env.http_proxy ??
      process.env.HTTP_PROXY;

    let customFetch: typeof fetch | undefined;
    if (proxyUrl) {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const nodeFetch = require('node-fetch') as (
        url: string,
        opts?: object,
      ) => Promise<unknown>;
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { HttpsProxyAgent } = require('https-proxy-agent') as {
        HttpsProxyAgent: new (url: string) => object;
      };
      const agent = new HttpsProxyAgent(proxyUrl);
      customFetch = (input: string | URL | Request, init?: RequestInit) => {
        const url =
          input instanceof Request
            ? input.url
            : typeof input === 'string'
              ? input
              : input.toString();
        return nodeFetch(url, { ...(init as object), agent }) as Promise<Response>;
      };
    }

    this.client = new Anthropic({
      apiKey: apiKey ?? process.env.ANTHROPIC_API_KEY,
      timeout: 120_000,
      ...(customFetch ? { fetch: customFetch } : {}),
    });
    this.model = model;
  }

  async chat(systemPrompt: string, userMessage: string): Promise<string> {
    const message = await this.client.messages.create({
      model: this.model,
      max_tokens: 4096,
      system: [{ type: 'text', text: systemPrompt, cache_control: { type: 'ephemeral' } }],
      messages: [{ role: 'user', content: userMessage }],
    });

    const textBlock = message.content.find((b) => b.type === 'text');
    if (!textBlock || textBlock.type !== 'text') {
      throw new Error('No text block in LLM response');
    }
    return textBlock.text;
  }
}
