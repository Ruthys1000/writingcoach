"use strict";
// ============================================================
// WritingCoach — Abstract LLM Client
// ============================================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.LLMClient = void 0;
/**
 * Abstract base for all LLM providers.
 * Swap between Anthropic (cloud/dev) and Ollama (local/airgap)
 * by implementing this interface.
 */
class LLMClient {
    /**
     * Parse a JSON response from the LLM, with a retry on malformed output.
     */
    async chatJSON(systemPrompt, userMessage) {
        const response = await this.chat(systemPrompt, userMessage);
        return this.parseJSON(response);
    }
    parseJSON(text) {
        // Strip markdown code fences if present
        const cleaned = text
            .replace(/^```(?:json)?\s*/im, '')
            .replace(/\s*```\s*$/im, '')
            .trim();
        try {
            return JSON.parse(cleaned);
        }
        catch {
            // Try to extract JSON by finding the outermost balanced braces/brackets
            const objStart = cleaned.indexOf('{');
            const objEnd = cleaned.lastIndexOf('}');
            const arrStart = cleaned.indexOf('[');
            const arrEnd = cleaned.lastIndexOf(']');
            const match = objStart !== -1 && objEnd > objStart
                ? cleaned.slice(objStart, objEnd + 1)
                : arrStart !== -1 && arrEnd > arrStart
                    ? cleaned.slice(arrStart, arrEnd + 1)
                    : null;
            if (match) {
                return JSON.parse(match);
            }
            throw new Error(`LLM returned non-JSON response:\n${text.slice(0, 300)}`);
        }
    }
}
exports.LLMClient = LLMClient;
//# sourceMappingURL=base.js.map