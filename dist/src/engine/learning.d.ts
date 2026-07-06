import type { LLMClient } from '../llm/base';
import type { Recipe, DiagnosticReport, LearningUnit } from '../types';
export declare class LearningEngine {
    private llm;
    constructor(llm: LLMClient);
    /**
     * Generate micro-learning units for the top N gaps from the diagnostic.
     * Uses the recipe's static micro_lesson as the basis, then
     * personalizes it with the user's actual text.
     */
    generateLessons(documentText: string, report: DiagnosticReport, recipe: Recipe, maxLessons?: number): Promise<LearningUnit[]>;
    private generateSingleLesson;
}
//# sourceMappingURL=learning.d.ts.map