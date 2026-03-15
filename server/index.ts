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

const app = express();
const PORT = parseInt(process.env.PORT ?? '3000', 10);
const IS_PROD = process.env.NODE_ENV === 'production';

app.use(cors());
app.use(express.json({ limit: '1mb' }));

// Extend socket timeout for long LLM calls (2 min)
app.use((_req, res, next) => {
  res.socket?.setTimeout(150_000);
  next();
});

// Health check (used by Railway)
app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// API
app.use('/api', coachRoutes);

// Serve React client in production
if (IS_PROD) {
  const staticDir = path.join(__dirname, '../../client/dist');
  app.use(express.static(staticDir));
  app.get('*', (_req, res) => {
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
