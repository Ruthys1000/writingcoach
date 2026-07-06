import { LLMClient } from './base';
export declare class OllamaClient extends LLMClient {
    private baseUrl;
    private model;
    constructor(baseUrl?: string, model?: string);
    chat(systemPrompt: string, userMessage: string): Promise<string>;
}
//# sourceMappingURL=ollama-client.d.ts.map