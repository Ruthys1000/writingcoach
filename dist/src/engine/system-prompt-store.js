"use strict";
// ============================================================
// System Prompt Store
// Reads and writes system prompts from config/system-prompts.json.
// Falls back to hardcoded defaults if the file doesn't exist.
// ============================================================
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.systemPromptStore = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const CONFIG_PATH = path.join(process.env.CONFIG_DIR ?? (process.env.DATA_DIR ?? process.cwd()), 'config', 'system-prompts.json');
const DEFAULTS = {
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
function load() {
    try {
        const raw = fs.readFileSync(CONFIG_PATH, 'utf-8');
        const parsed = JSON.parse(raw);
        return {
            diagnostic: parsed.diagnostic ?? DEFAULTS.diagnostic,
            learning: parsed.learning ?? DEFAULTS.learning,
            assessment: parsed.assessment ?? DEFAULTS.assessment,
        };
    }
    catch {
        return { ...DEFAULTS };
    }
}
function save(prompts) {
    fs.mkdirSync(path.dirname(CONFIG_PATH), { recursive: true });
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(prompts, null, 2), 'utf-8');
}
exports.systemPromptStore = {
    getAll() {
        return load();
    },
    get(key) {
        return load()[key];
    },
    set(key, value) {
        const current = load();
        current[key] = value;
        save(current);
    },
    setAll(prompts) {
        const current = load();
        for (const [k, v] of Object.entries(prompts)) {
            if (v !== undefined)
                current[k] = v;
        }
        save(current);
    },
};
//# sourceMappingURL=system-prompt-store.js.map