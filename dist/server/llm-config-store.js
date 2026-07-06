"use strict";
// ============================================================
// LLM Config Store
// Persists LLM provider settings to config/llm-config.json.
// Falls back to environment variables when no file exists.
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
exports.llmConfigStore = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const CONFIG_PATH = path.join(process.env.CONFIG_DIR ?? (process.env.DATA_DIR ?? process.cwd()), 'config', 'llm-config.json');
function load() {
    try {
        const raw = fs.readFileSync(CONFIG_PATH, 'utf-8');
        return JSON.parse(raw);
    }
    catch {
        // Fall back to environment variables
        return {
            provider: process.env.LLM_PROVIDER ?? 'anthropic',
            anthropic_api_key: process.env.ANTHROPIC_API_KEY,
            openai_api_key: process.env.OPENAI_API_KEY,
            openai_base_url: process.env.OPENAI_BASE_URL,
            openai_model: process.env.OPENAI_MODEL,
            cohere_api_key: process.env.COHERE_API_KEY,
            cohere_base_url: process.env.COHERE_BASE_URL,
            cohere_model: process.env.COHERE_MODEL,
            ollama_base_url: process.env.OLLAMA_BASE_URL,
            ollama_model: process.env.OLLAMA_MODEL,
        };
    }
}
function maskKey(key) {
    if (!key)
        return '';
    if (key.length <= 8)
        return '••••';
    return '••••' + key.slice(-4);
}
function ismasked(value) {
    return !!value && value.startsWith('••••');
}
exports.llmConfigStore = {
    get() {
        return load();
    },
    /** Returns config with API keys masked — safe to send to frontend */
    getMasked() {
        const config = load();
        return {
            ...config,
            anthropic_api_key: maskKey(config.anthropic_api_key),
            openai_api_key: maskKey(config.openai_api_key),
            cohere_api_key: maskKey(config.cohere_api_key),
        };
    },
    /** Save new config. Masked key values are ignored (existing key preserved). */
    set(update) {
        const current = load();
        const merged = { ...current, ...update };
        // If user submitted a masked placeholder, keep the real existing key
        if (ismasked(update.anthropic_api_key))
            merged.anthropic_api_key = current.anthropic_api_key;
        if (ismasked(update.openai_api_key))
            merged.openai_api_key = current.openai_api_key;
        if (ismasked(update.cohere_api_key))
            merged.cohere_api_key = current.cohere_api_key;
        fs.mkdirSync(path.dirname(CONFIG_PATH), { recursive: true });
        fs.writeFileSync(CONFIG_PATH, JSON.stringify(merged, null, 2), 'utf-8');
        return merged;
    },
};
//# sourceMappingURL=llm-config-store.js.map