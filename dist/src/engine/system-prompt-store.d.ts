export type SystemPromptKey = 'diagnostic' | 'learning' | 'assessment';
export declare const systemPromptStore: {
    getAll(): Record<SystemPromptKey, string>;
    get(key: SystemPromptKey): string;
    set(key: SystemPromptKey, value: string): void;
    setAll(prompts: Partial<Record<SystemPromptKey, string>>): void;
};
//# sourceMappingURL=system-prompt-store.d.ts.map