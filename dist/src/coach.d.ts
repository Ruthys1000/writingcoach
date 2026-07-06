import type { LLMClient } from './llm/base';
import { RecipeLoader } from './engine/recipe-loader';
import type { Recipe, DiagnosticReport, LearningUnit, PracticeExercise, AssessmentResult } from './types';
export interface CoachSession {
    recipe: Recipe;
    documentText: string;
    diagnosticReport: DiagnosticReport;
    learningUnits: LearningUnit[];
    exercises: Record<number, PracticeExercise>;
}
export declare class WritingCoach {
    private recipeLoader;
    private diagnostic;
    private learning;
    private assessment;
    constructor(llm: LLMClient, recipesDir?: string);
    getRecipeLoader(): RecipeLoader;
    listDocumentTypes(): Array<{
        id: string;
        name: string;
        description: string;
        criteria_count: number;
    }>;
    /** Step 1: Run diagnostic on a submitted document. */
    runDiagnostic(documentTypeId: string, documentText: string): Promise<CoachSession>;
    /** Step 2: Generate micro-learning units for the session's gaps. */
    generateLearning(session: CoachSession, maxLessons?: number): Promise<CoachSession>;
    /** Step 3: Generate a practice exercise for a specific learning unit. */
    generateExercise(session: CoachSession, unitIndex: number): Promise<PracticeExercise>;
    /** Step 3b: Evaluate a user's rewrite. */
    evaluateRewrite(exercise: PracticeExercise, userRewrite: string, session: CoachSession, unitIndex: number): Promise<AssessmentResult>;
}
//# sourceMappingURL=coach.d.ts.map