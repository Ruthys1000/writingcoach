import type { LLMClient } from '../llm/base';
import type { Recipe, DiagnosticReport } from '../types';
export declare class DiagnosticEngine {
    private llm;
    constructor(llm: LLMClient);
    evaluate(documentText: string, recipe: Recipe): Promise<DiagnosticReport>;
    private buildReport;
    private calcLayerScore;
}
//# sourceMappingURL=diagnostic.d.ts.map