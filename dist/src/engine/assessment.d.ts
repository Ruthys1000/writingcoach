import type { LLMClient } from '../llm/base';
import type { LearningUnit, PracticeExercise, AssessmentResult } from '../types';
export declare class AssessmentEngine {
    private llm;
    constructor(llm: LLMClient);
    /**
     * Generate a practice exercise based on a learning unit.
     * The exercise picks a weak excerpt and asks the user to rewrite it.
     */
    generateExercise(documentText: string, lesson: LearningUnit): Promise<PracticeExercise>;
    /**
     * Evaluate the user's rewrite against the criterion.
     */
    evaluate(exercise: PracticeExercise, userRewrite: string, lesson: LearningUnit): Promise<AssessmentResult>;
}
//# sourceMappingURL=assessment.d.ts.map