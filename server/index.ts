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

const app = express();
const PORT = parseInt(process.env.PORT ?? '3000', 10);
const IS_PROD = process.env.NODE_ENV === 'production';

const allowedOrigins = IS_PROD
  ? (process.env.ALLOWED_ORIGINS ?? '').split(',').map(o => o.trim()).filter(Boolean)
  : ['http://localhost:3000', 'http://localhost:5173'];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g. mobile apps, curl, server-to-server)
    if (!origin) return callback(null, true);
    if (!IS_PROD || allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error(`CORS: origin '${origin}' not allowed`));
  },
}));
app.use(express.json({ limit: '1mb' }));

// Extend socket timeout for long LLM calls (2 min)
app.use((_req, res, next) => {
  res.socket?.setTimeout(150_000);
  next();
});

// Simple in-memory rate limiter: max 60 API requests per IP per 15 minutes
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_MAX = 60;
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;

app.use('/api', (req, res, next) => {
  const ip = req.ip ?? 'unknown';
  const now = Date.now();
  const entry = rateLimitStore.get(ip);

  if (!entry || now > entry.resetAt) {
    rateLimitStore.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return next();
  }

  entry.count++;
  if (entry.count > RATE_LIMIT_MAX) {
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

app.listen(PORT, '0.0.0.0', () => {
  const provider = process.env.LLM_PROVIDER ?? 'anthropic';
  console.log(`✍️  WritingCoach server on http://localhost:${PORT}`);
  console.log(`   LLM provider: ${provider}`);
  if (!IS_PROD) {
    console.log(`   API only (run 'npm run client:dev' for the frontend)`);
  }
});
