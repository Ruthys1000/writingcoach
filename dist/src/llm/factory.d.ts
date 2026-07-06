import { LLMClient } from './base';
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
export declare function createLLMClient(config?: LLMCreateConfig): LLMClient;
//# sourceMappingURL=factory.d.ts.map