"use strict";
// ============================================================
// WritingCoach — Cohere Client (On-Prem / Cloud)
// Uses Cohere Chat API v2.
// Env vars:
//   COHERE_API_KEY   — your Cohere API key
//   COHERE_BASE_URL  — override for on-prem deployments
//   COHERE_MODEL     — e.g. command-r, command-r-plus
// ============================================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.CohereClient = void 0;
const base_1 = require("./base");
class CohereClient extends base_1.LLMClient {
    constructor(apiKey = process.env.COHERE_API_KEY ?? '', baseUrl = process.env.COHERE_BASE_URL ?? 'https://api.cohere.com/v2', model = process.env.COHERE_MODEL ?? 'command-r') {
        super();
        this.apiKey = apiKey;
        this.baseUrl = baseUrl.replace(/\/$/, '');
        this.model = model;
    }
    async chat(systemPrompt, userMessage) {
        if (!this.apiKey)
            throw new Error('COHERE_API_KEY is required');
        const url = `${this.baseUrl}/chat`;
        const body = JSON.stringify({
            model: this.model,
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userMessage },
            ],
            temperature: 0.2,
            max_tokens: 4096,
        });
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${this.apiKey}`,
            },
            body,
        });
        if (!response.ok) {
            const err = await response.text();
            throw new Error(`Cohere request failed (${response.status}): ${err}`);
        }
        const data = (await response.json());
        const textBlock = data.message.content.find((b) => b.type === 'text');
        if (!textBlock)
            throw new Error('Cohere returned no text content');
        return textBlock.text;
    }
}
exports.CohereClient = CohereClient;
//# sourceMappingURL=cohere-client.js.map