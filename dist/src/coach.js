"use strict";
// ============================================================
// WritingCoach — Main Orchestrator
// Coordinates the 3-step learning loop:
// Diagnostic → Micro-Learning → Assessment
// ============================================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.WritingCoach = void 0;
const recipe_loader_1 = require("./engine/recipe-loader");
const diagnostic_1 = require("./engine/diagnostic");
const learning_1 = require("./engine/learning");
const assessment_1 = require("./engine/assessment");
class WritingCoach {
    constructor(llm, recipesDir) {
        this.recipeLoader = new recipe_loader_1.RecipeLoader(recipesDir);
        this.diagnostic = new diagnostic_1.DiagnosticEngine(llm);
        this.learning = new learning_1.LearningEngine(llm);
        this.assessment = new assessment_1.AssessmentEngine(llm);
    }
    getRecipeLoader() {
        return this.recipeLoader;
    }
    listDocumentTypes() {
        return this.recipeLoader.listAvailable();
    }
    /** Step 1: Run diagnostic on a submitted document. */
    async runDiagnostic(documentTypeId, documentText) {
        const recipe = this.recipeLoader.load(documentTypeId);
        const diagnosticReport = await this.diagnostic.evaluate(documentText, recipe);
        return {
            recipe,
            documentText,
            diagnosticReport,
            learningUnits: [],
            exercises: {},
        };
    }
    /** Step 2: Generate micro-learning units for the session's gaps. */
    async generateLearning(session, maxLessons = 3) {
        const learningUnits = await this.learning.generateLessons(session.documentText, session.diagnosticReport, session.recipe, maxLessons);
        return { ...session, learningUnits };
    }
    /** Step 3: Generate a practice exercise for a specific learning unit. */
    async generateExercise(session, unitIndex) {
        const unit = session.learningUnits[unitIndex];
        if (!unit) {
            throw new Error(`Learning unit index ${unitIndex} not found`);
        }
        return this.assessment.generateExercise(session.documentText, unit);
    }
    /** Step 3b: Evaluate a user's rewrite. */
    async evaluateRewrite(exercise, userRewrite, session, unitIndex) {
        const unit = session.learningUnits[unitIndex];
        if (!unit) {
            throw new Error(`Learning unit index ${unitIndex} not found`);
        }
        return this.assessment.evaluate(exercise, userRewrite, unit);
    }
}
exports.WritingCoach = WritingCoach;
//# sourceMappingURL=coach.js.map