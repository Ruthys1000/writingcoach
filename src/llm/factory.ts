// ============================================================
// WritingCoach — LLM Client Factory
// Reads LLM_PROVIDER from the environment and returns the
// appropriate client.  Add new providers here as needed.
// ============================================================

import { LLMClient } from './base';
import { AnthropicClient } from './anthropic-client';
import { OllamaClient } from './ollama-client';
import { OpenAICompatibleClient } from './openai-client';
import { CohereClient } from './cohere-client';

export type LLMProvider = 'anthropic' | 'ollama' | 'openai' | 'cohere';

export function createLLMClient(provider?: LLMProvider): LLMClient {
  const resolvedProvider =
    provider ?? (process.env.LLM_PROVIDER as LLMProvider) ?? 'anthropic';

  switch (resolvedProvider) {
    case 'anthropic':
      return new AnthropicClient();
    case 'ollama':
      return new OllamaClient();
    case 'openai':
      return new OpenAICompatibleClient();
    case 'cohere':
      return new CohereClient();
    default:
      throw new Error(
        `Unknown LLM_PROVIDER="${resolvedProvider}". ` +
          `Valid options: anthropic, ollama, openai, cohere`,
      );
  }
}
