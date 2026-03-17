// ============================================================
// WritingCoach — Step 2: Micro-Learning Engine
// For each identified gap, generates a personalized micro-lesson
// using the user's own document text as before/after material.
// ============================================================

import type { LLMClient } from '../llm/base';
import type {
  Recipe,
  DiagnosticReport,
  CriterionEvaluation,
  LearningUnit,
  RubricCriterion,
} from '../types';

const SYSTEM_PROMPT = `אתה מאמן כתיבה מנהלית מומחה.
תפקידך להסביר פערים בכתיבה ולהראות "לפני ואחרי" על בסיס הטקסט של הכותב עצמו.
השב ב-JSON תקני בלבד, לפי הסכמה שתינתן.`;

interface RawLearningResponse {
  gap_summary: string;
  why_it_matters: string;
  practical_tool: string;
  before_from_doc: string;
  after_from_doc: string;
}

export class LearningEngine {
  constructor(private llm: LLMClient) {}

  /**
   * Generate micro-learning units for the top N gaps from the diagnostic.
   * Uses the recipe's static micro_lesson as the basis, then
   * personalizes it with the user's actual text.
   */
  async generateLessons(
    documentText: string,
    report: DiagnosticReport,
    recipe: Recipe,
    maxLessons = 3,
  ): Promise<LearningUnit[]> {
    const topGaps = report.gaps.slice(0, maxLessons);
    const lessons: LearningUnit[] = [];

    for (const gap of topGaps) {
      const criterion = recipe.criteria.find((c) => c.id === gap.criterion_id);
      if (!criterion) continue;

      const lesson = await this.generateSingleLesson(
        documentText,
        gap,
        criterion,
      );
      lessons.push(lesson);
    }

    return lessons;
  }

  private async generateSingleLesson(
    documentText: string,
    gap: CriterionEvaluation,
    criterion: RubricCriterion,
  ): Promise<LearningUnit> {
    const { micro_lesson: ml } = criterion;

    const userMessage = `הכותב הגיש את המסמך הבא וזוהה פער בקריטריון: "${criterion.question}"

הסבר מהמעריך: ${gap.explanation}
${gap.excerpt ? `ציטוט מהמסמך: "${gap.excerpt}"` : ''}

רקע לשיעור:
- מדוע חשוב: ${ml.why}
- הכלי: ${ml.tool}
${ml.formula ? `- נוסחה: ${ml.formula}` : ''}

חלק מהמסמך המקורי:
---
${documentText.slice(0, 3000)}
---

צור שיעור מיקרו-למידה מותאם אישית. השב ב-JSON לפי הסכמה:
{
  "gap_summary": "תיאור הפער בשפה פשוטה ומעודדת (1-2 משפטים)",
  "why_it_matters": "מדוע כישור זה חשוב לקריירה ולארגון (2-3 משפטים)",
  "practical_tool": "הכלי הפרקטי לשיפור (2-3 משפטים, כולל שלבים)",
  "before_from_doc": "ציטוט מדויק מהמסמך המקורי שממחיש את הפגם (אם לא קיים — כתוב דוגמה מאוירת)",
  "after_from_doc": "שכתוב משופר של אותו הקטע תוך יישום הכלי"
}`;

    try {
      const raw = await this.llm.chatJSON<RawLearningResponse>(
        SYSTEM_PROMPT,
        userMessage,
      );

      return {
        criterion_id: criterion.id,
        criterion_question: criterion.question,
        gap_summary: raw.gap_summary,
        why_it_matters: raw.why_it_matters,
        practical_tool: raw.practical_tool,
        formula: ml.formula,
        before_from_doc: raw.before_from_doc,
        after_from_doc: raw.after_from_doc,
      };
    } catch (error) {
      // Fallback to recipe's static examples if LLM fails
      console.warn(
        `[LearningEngine] LLM failed for criterion "${criterion.id}", using static fallback.`,
        error,
      );
      return {
        criterion_id: criterion.id,
        criterion_question: criterion.question,
        gap_summary: gap.explanation,
        why_it_matters: ml.why,
        practical_tool: ml.tool,
        formula: ml.formula,
        before_from_doc: ml.before_example,
        after_from_doc: ml.after_example,
      };
    }
  }
}
