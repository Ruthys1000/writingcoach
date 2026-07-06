import { LLMClient } from './base';
export declare class OpenAICompatibleClient extends LLMClient {
    private baseUrl;
    private apiKey;
    private model;
    constructor(baseUrl?: string, apiKey?: string, model?: string);
    chat(systemPrompt: string, userMessage: string): Promise<string>;
}
//# sourceMappingURL=openai-client.d.ts.map