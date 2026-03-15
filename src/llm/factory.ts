// ============================================================
// WritingCoach — LLM Client Factory
// Reads LLM_PROVIDER from the environment and returns the
// appropriate client.  Add new providers here as needed.
// ============================================================

import { LLMClient } from './base';
import { AnthropicClient } from './anthropic-client';
import { OllamaClient } from './ollama-client';

export type LLMProvider = 'anthropic' | 'ollama';

export function createLLMClient(provider?: LLMProvider): LLMClient {
  const resolvedProvider =
    provider ?? (process.env.LLM_PROVIDER as LLMProvider) ?? 'anthropic';

  switch (resolvedProvider) {
    case 'anthropic':
      return new AnthropicClient();
    case 'ollama':
      return new OllamaClient();
    default:
      throw new Error(
        `Unknown LLM_PROVIDER="${resolvedProvider}". ` +
          `Valid options: anthropic, ollama`,
      );
  }
}
