"use strict";
// ============================================================
// WritingCoach — Anthropic Claude Client
// For development and cloud-based usage.
// ============================================================
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnthropicClient = void 0;
const sdk_1 = __importDefault(require("@anthropic-ai/sdk"));
const base_1 = require("./base");
class AnthropicClient extends base_1.LLMClient {
    constructor(apiKey, model = 'claude-haiku-4-5') {
        super();
        // In sandboxed/container environments Node.js native fetch doesn't
        // honour https_proxy. Use node-fetch v2 + https-proxy-agent so the
        // Anthropic SDK reaches the API through the same proxy that curl uses.
        const proxyUrl = process.env.https_proxy ??
            process.env.HTTPS_PROXY ??
            process.env.http_proxy ??
            process.env.HTTP_PROXY;
        let customFetch;
        if (proxyUrl) {
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            const nodeFetch = require('node-fetch');
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            const { HttpsProxyAgent } = require('https-proxy-agent');
            const agent = new HttpsProxyAgent(proxyUrl);
            customFetch = (input, init) => {
                const url = input instanceof Request
                    ? input.url
                    : typeof input === 'string'
                        ? input
                        : input.toString();
                return nodeFetch(url, { ...init, agent });
            };
        }
        this.client = new sdk_1.default({
            apiKey: apiKey ?? process.env.ANTHROPIC_API_KEY,
            timeout: 120000,
            ...(customFetch ? { fetch: customFetch } : {}),
        });
        this.model = model;
    }
    async chat(systemPrompt, userMessage) {
        const message = await this.client.messages.create({
            model: this.model,
            max_tokens: 4096,
            system: [{ type: 'text', text: systemPrompt, cache_control: { type: 'ephemeral' } }],
            messages: [{ role: 'user', content: userMessage }],
        });
        const textBlock = message.content.find((b) => b.type === 'text');
        if (!textBlock || textBlock.type !== 'text') {
            throw new Error('No text block in LLM response');
        }
        return textBlock.text;
    }
}
exports.AnthropicClient = AnthropicClient;
//# sourceMappingURL=anthropic-client.js.map