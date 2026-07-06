"use strict";
// ============================================================
// WritingCoach — LLM Client Factory
// Reads LLM_PROVIDER from the environment and returns the
// appropriate client.  Add new providers here as needed.
// ============================================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.createLLMClient = createLLMClient;
const anthropic_client_1 = require("./anthropic-client");
const ollama_client_1 = require("./ollama-client");
const openai_client_1 = require("./openai-client");
const cohere_client_1 = require("./cohere-client");
function createLLMClient(config) {
    const resolvedProvider = config?.provider ?? process.env.LLM_PROVIDER ?? 'anthropic';
    switch (resolvedProvider) {
        case 'anthropic':
            return new anthropic_client_1.AnthropicClient(config?.anthropic_api_key);
        case 'ollama':
            return new ollama_client_1.OllamaClient(config?.ollama_base_url, config?.ollama_model);
        case 'openai':
            return new openai_client_1.OpenAICompatibleClient(config?.openai_base_url, config?.openai_api_key, config?.openai_model);
        case 'cohere':
            return new cohere_client_1.CohereClient(config?.cohere_api_key, config?.cohere_base_url, config?.cohere_model);
        default:
            throw new Error(`Unknown LLM_PROVIDER="${resolvedProvider}". ` +
                `Valid options: anthropic, ollama, openai, cohere`);
    }
}
//# sourceMappingURL=factory.js.map