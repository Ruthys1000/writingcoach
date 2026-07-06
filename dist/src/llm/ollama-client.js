"use strict";
// ============================================================
// WritingCoach — Ollama Client (Local / Airgap)
// Connects to a locally-running Ollama instance.
// Zero data leaves the network — fully airgap-compliant.
// ============================================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.OllamaClient = void 0;
const base_1 = require("./base");
class OllamaClient extends base_1.LLMClient {
    constructor(baseUrl = process.env.OLLAMA_BASE_URL ?? 'http://localhost:11434', model = process.env.OLLAMA_MODEL ?? 'llama3') {
        super();
        this.baseUrl = baseUrl.replace(/\/$/, '');
        this.model = model;
    }
    async chat(systemPrompt, userMessage) {
        const url = `${this.baseUrl}/api/chat`;
        const body = JSON.stringify({
            model: this.model,
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userMessage },
            ],
            stream: false,
            options: {
                temperature: 0.2,
                num_predict: 4096,
            },
        });
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body,
        });
        if (!response.ok) {
            const err = await response.text();
            throw new Error(`Ollama request failed (${response.status}): ${err}`);
        }
        const data = (await response.json());
        return data.message.content;
    }
}
exports.OllamaClient = OllamaClient;
//# sourceMappingURL=ollama-client.js.map