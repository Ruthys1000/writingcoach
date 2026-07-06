/**
 * Abstract base for all LLM providers.
 * Swap between Anthropic (cloud/dev) and Ollama (local/airgap)
 * by implementing this interface.
 */
export declare abstract class LLMClient {
    /**
     * Send a single-turn chat request and return the text response.
     * @param systemPrompt - System/instruction context
     * @param userMessage  - The user's message
     */
    abstract chat(systemPrompt: string, userMessage: string): Promise<string>;
    /**
     * Parse a JSON response from the LLM, with a retry on malformed output.
     */
    chatJSON<T>(systemPrompt: string, userMessage: string): Promise<T>;
    protected parseJSON<T>(text: string): T;
}
//# sourceMappingURL=base.d.ts.map