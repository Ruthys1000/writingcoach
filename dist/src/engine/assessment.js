"use strict";
// ============================================================
// WritingCoach — Step 3: Assessment Engine
// Generates a practice exercise from the user's document,
// then evaluates the user's rewrite.
// ============================================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.AssessmentEngine = void 0;
const system_prompt_store_1 = require("./system-prompt-store");
class AssessmentEngine {
    constructor(llm) {
        this.llm = llm;
    }
    /**
     * Generate a practice exercise based on a learning unit.
     * The exercise picks a weak excerpt and asks the user to rewrite it.
     */
    async generateExercise(documentText, lesson) {
        const userMessage = `הכותב לומד את הכישור: "${lesson.criterion_question}"

הכלי שלמד: ${lesson.practical_tool}
${lesson.formula ? `הנוסחה: ${lesson.formula}` : ''}

המסמך המקורי:
---
${documentText.slice(0, 3000)}
---

צור תרגיל שכתוב. השב ב-JSON:
{
  "instruction": "הוראות לתרגיל בשפה ידידותית ומעודדת (2-3 משפטים). כלול תזכורת לכלי/נוסחה שנלמד.",
  "weak_excerpt": "ציטוט מהמסמך המקורי לשכתוב (2-5 משפטים, בחר את החלק הפגוע ביותר בהתייחס לקריטריון)"
}`;
        try {
            const raw = await this.llm.chatJSON(system_prompt_store_1.systemPromptStore.get('assessment'), userMessage);
            return {
                criterion_id: lesson.criterion_id,
                criterion_question: lesson.criterion_question,
                instruction: raw.instruction,
                weak_excerpt: raw.weak_excerpt,
            };
        }
        catch {
            // Fallback: use the "before" example from the lesson
            return {
                criterion_id: lesson.criterion_id,
                criterion_question: lesson.criterion_question,
                instruction: `שכתב את הקטע הבא תוך יישום הכלי שלמדת: ${lesson.practical_tool}`,
                weak_excerpt: lesson.before_from_doc,
            };
        }
    }
    /**
     * Evaluate the user's rewrite against the criterion.
     */
    async evaluate(exercise, userRewrite, lesson) {
        const userMessage = `הקריטריון שנבחן: "${exercise.criterion_question}"

הכלי שנלמד: ${lesson.practical_tool}
${lesson.formula ? `הנוסחה: ${lesson.formula}` : ''}

הקטע המקורי (לפני):
"${exercise.weak_excerpt}"

שכתוב הכותב (אחרי):
"${userRewrite}"

הערך את השכתוב. השב ב-JSON:
{
  "passed": true/false,
  "score": 0-100,
  "feedback": "פידבק בעברית: ציין מה עשה טוב, מה השתפר, ומה עוד ניתן לשפר. טון מעודד ובונה (3-5 משפטים)",
  "improvement_tip": "טיפ אחד קצר ומיידי לשיפור נוסף (אופציונלי, רק אם score < 80)"
}

קריטריון הצלחה: passed=true אם השכתוב מיישם את הכלי שנלמד בצורה ניכרת (score >= 70).`;
        const raw = await this.llm.chatJSON(system_prompt_store_1.systemPromptStore.get('assessment'), userMessage);
        return {
            criterion_id: exercise.criterion_id,
            passed: raw.passed,
            score: Math.min(100, Math.max(0, raw.score)),
            feedback: raw.feedback,
            improvement_tip: raw.improvement_tip,
        };
    }
}
exports.AssessmentEngine = AssessmentEngine;
//# sourceMappingURL=assessment.js.map