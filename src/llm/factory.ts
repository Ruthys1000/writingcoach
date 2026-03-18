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

export interface LLMCreateConfig {
  provider?: LLMProvider;
  anthropic_api_key?: string;
  openai_api_key?: string;
  openai_base_url?: string;
  openai_model?: string;
  cohere_api_key?: string;
  cohere_base_url?: string;
  cohere_model?: string;
  ollama_base_url?: string;
  ollama_model?: string;
}

export function createLLMClient(config?: LLMCreateConfig): LLMClient {
  const resolvedProvider =
    config?.provider ?? (process.env.LLM_PROVIDER as LLMProvider) ?? 'anthropic';

  switch (resolvedProvider) {
    case 'anthropic':
      return new AnthropicClient(config?.anthropic_api_key);
    case 'ollama':
      return new OllamaClient(config?.ollama_base_url, config?.ollama_model);
    case 'openai':
      return new OpenAICompatibleClient(
        config?.openai_base_url,
        config?.openai_api_key,
        config?.openai_model,
      );
    case 'cohere':
      return new CohereClient(
        config?.cohere_api_key,
        config?.cohere_base_url,
        config?.cohere_model,
      );
    default:
      throw new Error(
        `Unknown LLM_PROVIDER="${resolvedProvider}". ` +
          `Valid options: anthropic, ollama, openai, cohere`,
      );
  }
}
