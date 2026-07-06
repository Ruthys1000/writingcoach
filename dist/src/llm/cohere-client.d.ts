import { LLMClient } from './base';
export declare class CohereClient extends LLMClient {
    private baseUrl;
    private apiKey;
    private model;
    constructor(apiKey?: string, baseUrl?: string, model?: string);
    chat(systemPrompt: string, userMessage: string): Promise<string>;
}
//# sourceMappingURL=cohere-client.d.ts.map