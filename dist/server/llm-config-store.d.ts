export type LLMProvider = 'anthropic' | 'openai' | 'ollama' | 'cohere';
export interface LLMConfig {
    provider: LLMProvider;
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
export declare const llmConfigStore: {
    get(): LLMConfig;
    /** Returns config with API keys masked — safe to send to frontend */
    getMasked(): LLMConfig;
    /** Save new config. Masked key values are ignored (existing key preserved). */
    set(update: Partial<LLMConfig>): LLMConfig;
};
//# sourceMappingURL=llm-config-store.d.ts.map