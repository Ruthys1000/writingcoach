// ============================================================
// LLM Config Store
// Persists LLM provider settings to config/llm-config.json.
// Falls back to environment variables when no file exists.
// ============================================================

import * as fs from 'fs';
import * as path from 'path';

export type LLMProvider = 'anthropic' | 'openai' | 'ollama' | 'cohere';

export interface LLMConfig {
  provider: LLMProvider;
  // Anthropic
  anthropic_api_key?: string;
  // OpenAI-compatible
  openai_api_key?: string;
  openai_base_url?: string;
  openai_model?: string;
  // Cohere
  cohere_api_key?: string;
  cohere_base_url?: string;
  cohere_model?: string;
  // Ollama
  ollama_base_url?: string;
  ollama_model?: string;
}

const CONFIG_PATH = path.join(
  process.env.CONFIG_DIR ?? (process.env.DATA_DIR ?? process.cwd()),
  'config',
  'llm-config.json',
);

function load(): LLMConfig {
  try {
    const raw = fs.readFileSync(CONFIG_PATH, 'utf-8');
    return JSON.parse(raw) as LLMConfig;
  } catch {
    // Fall back to environment variables
    return {
      provider: (process.env.LLM_PROVIDER as LLMProvider) ?? 'anthropic',
      anthropic_api_key: process.env.ANTHROPIC_API_KEY,
      openai_api_key: process.env.OPENAI_API_KEY,
      openai_base_url: process.env.OPENAI_BASE_URL,
      openai_model: process.env.OPENAI_MODEL,
      cohere_api_key: process.env.COHERE_API_KEY,
      cohere_base_url: process.env.COHERE_BASE_URL,
      cohere_model: process.env.COHERE_MODEL,
      ollama_base_url: process.env.OLLAMA_BASE_URL,
      ollama_model: process.env.OLLAMA_MODEL,
    };
  }
}

function maskKey(key?: string): string {
  if (!key) return '';
  if (key.length <= 8) return '••••';
  return '••••' + key.slice(-4);
}

function ismasked(value?: string): boolean {
  return !!value && value.startsWith('••••');
}

export const llmConfigStore = {
  get(): LLMConfig {
    return load();
  },

  /** Returns config with API keys masked — safe to send to frontend */
  getMasked(): LLMConfig {
    const config = load();
    return {
      ...config,
      anthropic_api_key: maskKey(config.anthropic_api_key),
      openai_api_key: maskKey(config.openai_api_key),
      cohere_api_key: maskKey(config.cohere_api_key),
    };
  },

  /** Save new config. Masked key values are ignored (existing key preserved). */
  set(update: Partial<LLMConfig>): LLMConfig {
    const current = load();
    const merged: LLMConfig = { ...current, ...update };

    // If user submitted a masked placeholder, keep the real existing key
    if (ismasked(update.anthropic_api_key)) merged.anthropic_api_key = current.anthropic_api_key;
    if (ismasked(update.openai_api_key)) merged.openai_api_key = current.openai_api_key;
    if (ismasked(update.cohere_api_key)) merged.cohere_api_key = current.cohere_api_key;

    fs.mkdirSync(path.dirname(CONFIG_PATH), { recursive: true });
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(merged, null, 2), 'utf-8');
    return merged;
  },
};
