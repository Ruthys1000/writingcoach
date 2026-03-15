// ============================================================
// WritingCoach — Step 1: Diagnostic Engine
// Evaluates a document against a recipe's rubric using the LLM.
// Returns a scored report with identified gaps.
// ============================================================

import type { LLMClient } from '../llm/base';
import type {
  Recipe,
  DiagnosticReport,
  CriterionEvaluation,
  LayerScore,
  RawDiagnosticResponse,
  RawEvaluation,
} from '../types';

const SYSTEM_PROMPT = `אתה מעריך מומחה של כתיבה מנהלית בעברית.
תפקידך לנתח מסמכים ארגוניים ולהעריך אותם מול מחוון כשירות.

כללי הערכה:
- השב אך ורק ב-JSON תקני לפי הסכמה שתינתן.
- לכל קריטריון השב: עבר/לא עבר, רמת ביטחון (0-1), והסבר קצר בעברית.
- ההסבר: עד 2 משפטים. אם הקריטריון עבר — ציין מה עשוי היטב. אם נכשל — ציין את הפגם הספציפי.
- אם ניתן, ציין ציטוט קצר מהמסמך (excerpt) הממחיש את הממצא.
- הגדר: passed=true רק אם הקריטריון מתקיים בצורה ברורה.`;

export class DiagnosticEngine {
  constructor(private llm: LLMClient) {}

  async evaluate(documentText: string, recipe: Recipe): Promise<DiagnosticReport> {
    const criteriaList = recipe.criteria
      .map((c, i) => `${i + 1}. [id: ${c.id}] ${c.question}`)
      .join('\n');

    const userMessage = `המסמך לניתוח:
---
${documentText.slice(0, 6000)}
---

הערך את המסמך מול הקריטריונים הבאים והשב ב-JSON בדיוק לפי הסכמה:

{
  "evaluations": [
    {
      "id": "criterion_id",
      "passed": true,
      "confidence": 0.9,
      "explanation": "הסבר קצר בעברית",
      "excerpt": "ציטוט קצר מהמסמך (אופציונלי)"
    }
  ]
}

קריטריונים:
${criteriaList}

חשוב: החזר את כל ${recipe.criteria.length} הקריטריונים ב-evaluations, לפי הסדר. ה-id חייב להתאים לרשימה למעלה.`;

    const raw = await this.llm.chatJSON<RawDiagnosticResponse>(
      SYSTEM_PROMPT,
      userMessage,
    );

    return this.buildReport(documentText, recipe, raw.evaluations);
  }

  private buildReport(
    documentText: string,
    recipe: Recipe,
    rawEvals: RawEvaluation[],
  ): DiagnosticReport {
    // Map raw evaluations by id for quick lookup
    const evalMap = new Map<string, RawEvaluation>();
    for (const e of rawEvals) {
      evalMap.set(e.id, e);
    }

    const evaluations: CriterionEvaluation[] = recipe.criteria.map((c) => {
      const raw = evalMap.get(c.id);
      return {
        criterion_id: c.id,
        passed: raw?.passed ?? false,
        confidence: raw?.confidence ?? 0.5,
        explanation: raw?.explanation ?? 'לא הוערך',
        excerpt: raw?.excerpt,
      };
    });

    const foundationalCriteria = recipe.criteria.filter(
      (c) => c.layer === 'foundational',
    );
    const specificCriteria = recipe.criteria.filter(
      (c) => c.layer === 'document_specific',
    );

    const foundationalScore = this.calcLayerScore(
      foundationalCriteria.map((c) => ({
        weight: c.weight,
        eval: evaluations.find((e) => e.criterion_id === c.id)!,
      })),
    );

    const specificScore = this.calcLayerScore(
      specificCriteria.map((c) => ({
        weight: c.weight,
        eval: evaluations.find((e) => e.criterion_id === c.id)!,
      })),
    );

    // Weighted overall: foundational layer 40%, specific 60%
    const foundationalTotal = foundationalCriteria.reduce(
      (sum, c) => sum + c.weight,
      0,
    );
    const specificTotal = specificCriteria.reduce((sum, c) => sum + c.weight, 0);

    let overallScore = 0;
    if (foundationalTotal > 0) {
      overallScore +=
        (foundationalScore.score / 100) * foundationalTotal * (1 / (foundationalTotal + specificTotal)) * 100;
    }
    if (specificTotal > 0) {
      overallScore +=
        (specificScore.score / 100) * specificTotal * (1 / (foundationalTotal + specificTotal)) * 100;
    }

    const gaps = evaluations.filter((e) => !e.passed);

    return {
      recipe_id: recipe.id,
      recipe_name: recipe.name,
      evaluations,
      scores: {
        foundational: foundationalScore,
        document_specific: specificScore,
        overall: Math.round(overallScore),
      },
      gaps,
      document_preview: documentText.slice(0, 500),
    };
  }

  private calcLayerScore(
    items: Array<{ weight: number; eval: CriterionEvaluation }>,
  ): LayerScore {
    if (items.length === 0) return { score: 0, passed_count: 0, total_count: 0 };

    const totalWeight = items.reduce((sum, i) => sum + i.weight, 0);
    const passedWeight = items
      .filter((i) => i.eval.passed)
      .reduce((sum, i) => sum + i.weight, 0);

    return {
      score: totalWeight > 0 ? Math.round((passedWeight / totalWeight) * 100) : 0,
      passed_count: items.filter((i) => i.eval.passed).length,
      total_count: items.length,
    };
  }
}
