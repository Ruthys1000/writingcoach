// ============================================================
// System Prompt Store
// Reads and writes system prompts from config/system-prompts.json.
// Falls back to hardcoded defaults if the file doesn't exist.
// ============================================================

import * as fs from 'fs';
import * as path from 'path';

export type SystemPromptKey = 'diagnostic' | 'learning' | 'assessment';

const CONFIG_PATH = path.join(
  process.env.CONFIG_DIR ?? (process.env.DATA_DIR ?? process.cwd()),
  'config',
  'system-prompts.json',
);

const DEFAULTS: Record<SystemPromptKey, string> = {
  diagnostic: `אתה מעריך מומחה של כתיבה מנהלית בעברית.
תפקידך לנתח מסמכים ארגוניים ולהעריך אותם מול מחוון כשירות.

כללי הערכה:
- השב אך ורק ב-JSON תקני לפי הסכמה שתינתן.
- לכל קריטריון השב: עבר/לא עבר, רמת ביטחון (0-1), והסבר קצר בעברית.
- ההסבר: עד 2 משפטים. אם הקריטריון עבר — ציין מה עשוי היטב. אם נכשל — ציין את הפגם הספציפי.
- אם ניתן, ציין ציטוט קצר מהמסמך (excerpt) הממחיש את הממצא.
- הגדר: passed=true רק אם הקריטריון מתקיים בצורה ברורה.`,

  learning: `אתה מאמן כתיבה מנהלית מומחה.
תפקידך להסביר פערים בכתיבה ולהראות "לפני ואחרי" על בסיס הטקסט של הכותב עצמו.
השב ב-JSON תקני בלבד, לפי הסכמה שתינתן.`,

  assessment: `אתה מאמן כתיבה מנהלית מומחה.
תפקידך ליצור תרגילי שכתוב ולהעריך אותם בצורה מעודדת ובונה.
השב ב-JSON תקני בלבד.`,
};

function load(): Record<SystemPromptKey, string> {
  try {
    const raw = fs.readFileSync(CONFIG_PATH, 'utf-8');
    const parsed = JSON.parse(raw);
    return {
      diagnostic: parsed.diagnostic ?? DEFAULTS.diagnostic,
      learning: parsed.learning ?? DEFAULTS.learning,
      assessment: parsed.assessment ?? DEFAULTS.assessment,
    };
  } catch {
    return { ...DEFAULTS };
  }
}

function save(prompts: Record<SystemPromptKey, string>): void {
  fs.mkdirSync(path.dirname(CONFIG_PATH), { recursive: true });
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(prompts, null, 2), 'utf-8');
}

export const systemPromptStore = {
  getAll(): Record<SystemPromptKey, string> {
    return load();
  },

  get(key: SystemPromptKey): string {
    return load()[key];
  },

  set(key: SystemPromptKey, value: string): void {
    const current = load();
    current[key] = value;
    save(current);
  },

  setAll(prompts: Partial<Record<SystemPromptKey, string>>): void {
    const current = load();
    for (const [k, v] of Object.entries(prompts)) {
      if (v !== undefined) current[k as SystemPromptKey] = v;
    }
    save(current);
  },
};
