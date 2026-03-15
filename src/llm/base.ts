// ============================================================
// WritingCoach — Abstract LLM Client
// ============================================================

/**
 * Abstract base for all LLM providers.
 * Swap between Anthropic (cloud/dev) and Ollama (local/airgap)
 * by implementing this interface.
 */
export abstract class LLMClient {
  /**
   * Send a single-turn chat request and return the text response.
   * @param systemPrompt - System/instruction context
   * @param userMessage  - The user's message
   */
  abstract chat(systemPrompt: string, userMessage: string): Promise<string>;

  /**
   * Parse a JSON response from the LLM, with a retry on malformed output.
   */
  async chatJSON<T>(systemPrompt: string, userMessage: string): Promise<T> {
    const response = await this.chat(systemPrompt, userMessage);
    return this.parseJSON<T>(response);
  }

  protected parseJSON<T>(text: string): T {
    // Strip markdown code fences if present
    const cleaned = text
      .replace(/^```(?:json)?\s*/im, '')
      .replace(/\s*```\s*$/im, '')
      .trim();

    try {
      return JSON.parse(cleaned) as T;
    } catch {
      // Try to extract JSON object/array from the response
      const match = cleaned.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
      if (match) {
        return JSON.parse(match[1]) as T;
      }
      throw new Error(`LLM returned non-JSON response:\n${text.slice(0, 300)}`);
    }
  }
}
