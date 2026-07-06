import { LLMClient } from './base';
export declare class AnthropicClient extends LLMClient {
    private client;
    private model;
    constructor(apiKey?: string, model?: string);
    chat(systemPrompt: string, userMessage: string): Promise<string>;
}
//# sourceMappingURL=anthropic-client.d.ts.map