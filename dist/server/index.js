"use strict";
// ============================================================
// Server — Express Entry Point
// Serves the API and, in production, the React build.
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv = __importStar(require("dotenv"));
dotenv.config();
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const path_1 = __importDefault(require("path"));
const coach_1 = __importDefault(require("./routes/coach"));
const admin_1 = __importDefault(require("./routes/admin"));
const settings_store_1 = require("../src/engine/settings-store");
const app = (0, express_1.default)();
const PORT = parseInt(process.env.PORT ?? '3000', 10);
const IS_PROD = process.env.NODE_ENV === 'production';
// ALLOWED_ORIGINS: comma-separated list to restrict API access (optional).
// When empty, all origins are allowed (required for same-origin Railway deploys,
// since browsers send Origin even for same-origin module-script and fetch requests).
const allowedOrigins = (process.env.ALLOWED_ORIGINS ?? '')
    .split(',').map(o => o.trim()).filter(Boolean);
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        // Allow requests with no origin (e.g. mobile apps, curl, server-to-server)
        if (!origin)
            return callback(null, true);
        // If no allowlist configured → open to all origins (includes same-origin Railway)
        if (allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
            return callback(null, true);
        }
        callback(new Error(`CORS: origin '${origin}' not allowed`));
    },
}));
app.use(express_1.default.json({ limit: '1mb' }));
// Extend socket timeout — reads from settings dynamically
app.use((_req, res, next) => {
    const { llm_timeout_seconds } = settings_store_1.settingsStore.get();
    res.socket?.setTimeout(llm_timeout_seconds * 1000 + 30000);
    next();
});
// Rate limiter — reads limits from settings on every request
const rateLimitStore = new Map();
app.use('/api', (req, res, next) => {
    const { rate_limit_enabled, rate_limit_max, rate_limit_window_minutes } = settings_store_1.settingsStore.get();
    if (!rate_limit_enabled)
        return next();
    const ip = req.ip ?? 'unknown';
    const now = Date.now();
    const windowMs = rate_limit_window_minutes * 60 * 1000;
    const entry = rateLimitStore.get(ip);
    if (!entry || now > entry.resetAt) {
        rateLimitStore.set(ip, { count: 1, resetAt: now + windowMs });
        return next();
    }
    entry.count++;
    if (entry.count > rate_limit_max) {
        res.status(429).json({ error: 'יותר מדי בקשות — נסה שוב בעוד מספר דקות' });
        return;
    }
    next();
});
// Health check (used by Railway)
app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
});
// API
app.use('/api', coach_1.default);
app.use('/api/admin', admin_1.default);
// Serve React client in production
if (IS_PROD) {
    const staticDir = path_1.default.join(__dirname, '../../client/dist');
    app.use(express_1.default.static(staticDir));
    // Express 5 removed '*' wildcard — use app.use as catch-all for React SPA
    app.use((_req, res) => {
        res.sendFile(path_1.default.join(staticDir, 'index.html'));
    });
}
const server = app.listen(PORT, '0.0.0.0', () => {
    const provider = process.env.LLM_PROVIDER ?? 'anthropic';
    console.log(`✍️  WritingCoach server on http://localhost:${PORT}`);
    console.log(`   LLM provider: ${provider}`);
    if (!IS_PROD) {
        console.log(`   API only (run 'npm run client:dev' for the frontend)`);
    }
});
server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.error(`❌ Port ${PORT} already in use — kill the previous process and retry.`);
        process.exit(1);
    }
    throw err;
});
//# sourceMappingURL=index.js.map