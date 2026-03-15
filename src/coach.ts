// ============================================================
// WritingCoach — Main Orchestrator
// Coordinates the 3-step learning loop:
// Diagnostic → Micro-Learning → Assessment
// ============================================================

import type { LLMClient } from './llm/base';
import { RecipeLoader } from './engine/recipe-loader';
import { DiagnosticEngine } from './engine/diagnostic';
import { LearningEngine } from './engine/learning';
import { AssessmentEngine } from './engine/assessment';
import type {
  Recipe,
  DiagnosticReport,
  LearningUnit,
  PracticeExercise,
  AssessmentResult,
} from './types';

export interface CoachSession {
  recipe: Recipe;
  documentText: string;
  diagnosticReport: DiagnosticReport;
  learningUnits: LearningUnit[];
}

export class WritingCoach {
  private recipeLoader: RecipeLoader;
  private diagnostic: DiagnosticEngine;
  private learning: LearningEngine;
  private assessment: AssessmentEngine;

  constructor(llm: LLMClient, recipesDir?: string) {
    this.recipeLoader = new RecipeLoader(recipesDir);
    this.diagnostic = new DiagnosticEngine(llm);
    this.learning = new LearningEngine(llm);
    this.assessment = new AssessmentEngine(llm);
  }

  listDocumentTypes(): Array<{ id: string; name: string; description: string }> {
    return this.recipeLoader.listAvailable();
  }

  /** Step 1: Run diagnostic on a submitted document. */
  async runDiagnostic(
    documentTypeId: string,
    documentText: string,
  ): Promise<CoachSession> {
    const recipe = this.recipeLoader.load(documentTypeId);
    const diagnosticReport = await this.diagnostic.evaluate(
      documentText,
      recipe,
    );

    return {
      recipe,
      documentText,
      diagnosticReport,
      learningUnits: [],
    };
  }

  /** Step 2: Generate micro-learning units for the session's gaps. */
  async generateLearning(
    session: CoachSession,
    maxLessons = 3,
  ): Promise<CoachSession> {
    const learningUnits = await this.learning.generateLessons(
      session.documentText,
      session.diagnosticReport,
      session.recipe,
      maxLessons,
    );

    return { ...session, learningUnits };
  }

  /** Step 3: Generate a practice exercise for a specific learning unit. */
  async generateExercise(
    session: CoachSession,
    unitIndex: number,
  ): Promise<PracticeExercise> {
    const unit = session.learningUnits[unitIndex];
    if (!unit) {
      throw new Error(`Learning unit index ${unitIndex} not found`);
    }
    return this.assessment.generateExercise(session.documentText, unit);
  }

  /** Step 3b: Evaluate a user's rewrite. */
  async evaluateRewrite(
    exercise: PracticeExercise,
    userRewrite: string,
    session: CoachSession,
    unitIndex: number,
  ): Promise<AssessmentResult> {
    const unit = session.learningUnits[unitIndex];
    if (!unit) {
      throw new Error(`Learning unit index ${unitIndex} not found`);
    }
    return this.assessment.evaluate(exercise, userRewrite, unit);
  }
}
