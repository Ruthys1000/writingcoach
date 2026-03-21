// ============================================================
// Server — Express Entry Point
// Serves the API and, in production, the React build.
// ============================================================

import * as dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import path from 'path';
import coachRoutes from './routes/coach';
import adminRoutes from './routes/admin';
import { settingsStore } from '../src/engine/settings-store';

const app = express();
const PORT = parseInt(process.env.PORT ?? '3000', 10);
const IS_PROD = process.env.NODE_ENV === 'production';

// ALLOWED_ORIGINS: comma-separated list to restrict API access (optional).
// When empty, all origins are allowed (required for same-origin Railway deploys,
// since browsers send Origin even for same-origin module-script and fetch requests).
const allowedOrigins = (process.env.ALLOWED_ORIGINS ?? '')
  .split(',').map(o => o.trim()).filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g. mobile apps, curl, server-to-server)
    if (!origin) return callback(null, true);
    // If no allowlist configured → open to all origins (includes same-origin Railway)
    if (allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    callback(new Error(`CORS: origin '${origin}' not allowed`));
  },
}));
app.use(express.json({ limit: '1mb' }));

// Extend socket timeout — reads from settings dynamically
app.use((_req, res, next) => {
  const { llm_timeout_seconds } = settingsStore.get();
  res.socket?.setTimeout(llm_timeout_seconds * 1000 + 30_000);
  next();
});

// Rate limiter — reads limits from settings on every request
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

app.use('/api', (req, res, next) => {
  const { rate_limit_enabled, rate_limit_max, rate_limit_window_minutes } = settingsStore.get();
  if (!rate_limit_enabled) return next();

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
app.use('/api', coachRoutes);
app.use('/api/admin', adminRoutes);

// Serve React client in production
if (IS_PROD) {
  const staticDir = path.join(__dirname, '../../client/dist');
  app.use(express.static(staticDir));
  // Express 5 removed '*' wildcard — use app.use as catch-all for React SPA
  app.use((_req, res) => {
    res.sendFile(path.join(staticDir, 'index.html'));
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

server.on('error', (err: NodeJS.ErrnoException) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} already in use — kill the previous process and retry.`);
    process.exit(1);
  }
  throw err;
});
