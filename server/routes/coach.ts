// ============================================================
// Server — Coach API Routes
// REST endpoints wrapping the WritingCoach 3-step loop.
// ============================================================

import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { createLLMClient } from '../../src/llm/factory';
import { WritingCoach } from '../../src/coach';
import { setSession, getSession } from '../session-store';
import { llmConfigStore } from '../llm-config-store';
import { settingsStore } from '../../src/engine/settings-store';

const router = Router();

// Mutable coach instance — null until first use or after config save
let _coach: WritingCoach | null = null;

try {
  _coach = new WritingCoach(createLLMClient(llmConfigStore.get()));
} catch {
  // No valid API key yet — server still starts, admin panel is accessible
}

export function getCoach(): WritingCoach {
  if (!_coach) {
    throw new Error('ספק ה-AI לא מוגדר — עבור לדשבורד הניהול ← ספק AI והכנס את מפתח ה-API');
  }
  return _coach;
}

export function reloadCoach(): void {
  _coach = new WritingCoach(createLLMClient(llmConfigStore.get()));
}

// ---- GET /api/recipes ----
router.get('/recipes', (_req: Request, res: Response) => {
  try {
    res.json(getCoach().listDocumentTypes());
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// ---- POST /api/diagnose ----
// Body: { documentTypeId, documentText }
// Returns: { sessionId, report }
router.post('/diagnose', async (req: Request, res: Response) => {
  const { documentTypeId, documentText } = req.body as {
    documentTypeId?: string;
    documentText?: string;
  };

  if (!documentTypeId || !documentText?.trim()) {
    res.status(400).json({ error: 'documentTypeId and documentText are required' });
    return;
  }

  if (documentText.length < 50) {
    res.status(400).json({ error: 'הטקסט קצר מדי — נסה עם מסמך מלא (50+ תווים)' });
    return;
  }

  const MAX_DOCUMENT_LENGTH = 50_000;
  if (documentText.length > MAX_DOCUMENT_LENGTH) {
    res.status(400).json({ error: `המסמך ארוך מדי — מקסימום ${MAX_DOCUMENT_LENGTH} תווים` });
    return;
  }

  try {
    const session = await getCoach().runDiagnostic(documentTypeId, documentText);
    const sessionId = uuidv4();
    setSession(sessionId, session);
    res.json({ sessionId, report: session.diagnosticReport, recipe: session.recipe });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// ---- POST /api/session/:id/learn ----
// Returns: { learningUnits }
router.post('/session/:id/learn', async (req: Request, res: Response) => {
  const session = getSession(req.params['id'] as string);
  if (!session) {
    res.status(404).json({ error: 'Session not found' });
    return;
  }

  try {
    const updated = await getCoach().generateLearning(session, settingsStore.get().max_lessons);
    setSession(req.params['id'] as string, updated);
    res.json({ learningUnits: updated.learningUnits });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// ---- GET /api/session/:id/exercise/:unitIndex ----
router.get('/session/:id/exercise/:unitIndex', async (req: Request, res: Response) => {
  const session = getSession(req.params['id'] as string);
  if (!session) {
    res.status(404).json({ error: 'Session not found' });
    return;
  }

  const unitIndex = parseInt(req.params['unitIndex'] as string, 10);
  try {
    const exercise = await getCoach().generateExercise(session, unitIndex);
    setSession(req.params['id'] as string, { ...session, exercises: { ...session.exercises, [unitIndex]: exercise } });
    res.json({ exercise });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// ---- POST /api/session/:id/assess/:unitIndex ----
// Body: { userRewrite }
router.post('/session/:id/assess/:unitIndex', async (req: Request, res: Response) => {
  const session = getSession(req.params['id'] as string);
  if (!session) {
    res.status(404).json({ error: 'Session not found' });
    return;
  }

  const { userRewrite } = req.body as { userRewrite?: string };
  if (!userRewrite?.trim()) {
    res.status(400).json({ error: 'userRewrite is required' });
    return;
  }

  const unitIndex = parseInt(req.params['unitIndex'] as string, 10);
  try {
    const exercise =
      session.exercises[unitIndex] ??
      await getCoach().generateExercise(session, unitIndex);
    const result = await getCoach().evaluateRewrite(exercise, userRewrite, session, unitIndex);
    res.json({ result, exercise });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

export default router;
