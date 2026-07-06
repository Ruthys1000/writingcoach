"use strict";
// ============================================================
// Settings Store
// Reads and writes system settings from config/settings.json.
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
exports.settingsStore = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const CONFIG_PATH = path.join(process.env.CONFIG_DIR ?? (process.env.DATA_DIR ?? process.cwd()), 'config', 'settings.json');
const DEFAULTS = {
    max_lessons: 3,
    llm_timeout_seconds: 120,
    rate_limit_enabled: true,
    rate_limit_max: 60,
    rate_limit_window_minutes: 15,
    site_title: 'מאמן כתיבה מנהלית',
    site_tagline: 'AI לשיפור כתיבה מנהלית מקצועית',
    footer_color: '#0f172a',
    footer_text: '',
    logo_data_url: '',
    hero_badge: 'AI לכתיבה מנהלית',
    hero_subtitle: 'העלה מסמך, קבל אבחון מדויק, ולמד לשפר את כתיבתך עם דוגמאות מהטקסט שלך עצמו',
    cta_button_text: 'התחל אימון ←',
};
function load() {
    try {
        const raw = fs.readFileSync(CONFIG_PATH, 'utf-8');
        const parsed = JSON.parse(raw);
        return { ...DEFAULTS, ...parsed };
    }
    catch {
        return { ...DEFAULTS };
    }
}
function save(settings) {
    fs.mkdirSync(path.dirname(CONFIG_PATH), { recursive: true });
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(settings, null, 2), 'utf-8');
}
exports.settingsStore = {
    get() {
        return load();
    },
    update(patch) {
        const current = load();
        const updated = { ...current, ...patch };
        save(updated);
        return updated;
    },
};
//# sourceMappingURL=settings-store.js.map