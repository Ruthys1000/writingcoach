// ============================================================
// Server — Admin API Routes
// CRUD endpoints for managing writing recipes.
// ============================================================

import { Router, Request, Response } from 'express';
import { getCoach, reloadCoach } from './coach';
import type { Recipe } from '../../src/types';
import { systemPromptStore } from '../../src/engine/system-prompt-store';
import { llmConfigStore, LLMConfig } from '../llm-config-store';
import { settingsStore } from '../../src/engine/settings-store';

const router = Router();

// ---- GET /api/admin/recipes ---- list all (full data)
router.get('/recipes', (_req: Request, res: Response) => {
  try {
    const loader = getCoach().getRecipeLoader();
    const list = loader.listAvailable();
    const full = list.map((r) => loader.load(r.id));
    res.json(full);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// ---- GET /api/admin/recipes/:id ---- single recipe
router.get('/recipes/:id', (req: Request, res: Response) => {
  try {
    const recipe = getCoach().getRecipeLoader().load(req.params['id'] as string);
    res.json(recipe);
  } catch (err) {
    res.status(404).json({ error: String(err) });
  }
});

// ---- POST /api/admin/recipes ---- create new recipe
router.post('/recipes', (req: Request, res: Response) => {
  const recipe = req.body as Recipe;
  if (!recipe?.id || !recipe.name || !Array.isArray(recipe.criteria)) {
    res.status(400).json({ error: 'id, name, and criteria are required' });
    return;
  }

  // Reject if recipe id already exists
  try {
    getCoach().getRecipeLoader().load(recipe.id);
    res.status(409).json({ error: `מתכון עם המזהה "${recipe.id}" כבר קיים` });
    return;
  } catch {
    // Expected: recipe not found, we can create it
  }

  try {
    getCoach().getRecipeLoader().save(recipe);
    res.status(201).json(recipe);
  } catch (err) {
    res.status(400).json({ error: String(err) });
  }
});

// ---- PUT /api/admin/recipes/:id ---- update existing recipe
router.put('/recipes/:id', (req: Request, res: Response) => {
  const id = req.params['id'] as string;
  const recipe = req.body as Recipe;

  if (!recipe?.id || !recipe.name || !Array.isArray(recipe.criteria)) {
    res.status(400).json({ error: 'id, name, and criteria are required' });
    return;
  }

  if (recipe.id !== id) {
    res.status(400).json({ error: 'Recipe id in body must match URL parameter' });
    return;
  }

  try {
    getCoach().getRecipeLoader().save(recipe);
    res.json(recipe);
  } catch (err) {
    res.status(400).json({ error: String(err) });
  }
});

// ---- DELETE /api/admin/recipes/:id ---- delete recipe
router.delete('/recipes/:id', (req: Request, res: Response) => {
  try {
    getCoach().getRecipeLoader().delete(req.params['id'] as string);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// ---- GET /api/admin/system-prompts ---- get all system prompts
router.get('/system-prompts', (_req: Request, res: Response) => {
  try {
    res.json(systemPromptStore.getAll());
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// ---- PUT /api/admin/system-prompts ---- update system prompts
router.put('/system-prompts', (req: Request, res: Response) => {
  const { diagnostic, learning, assessment } = req.body as Record<string, string>;
  if (!diagnostic && !learning && !assessment) {
    res.status(400).json({ error: 'At least one prompt field is required' });
    return;
  }
  try {
    systemPromptStore.setAll({ diagnostic, learning, assessment });
    res.json(systemPromptStore.getAll());
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// ---- GET /api/admin/llm-config ---- get current LLM config (keys masked)
router.get('/llm-config', (_req: Request, res: Response) => {
  try {
    res.json(llmConfigStore.getMasked());
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// ---- PUT /api/admin/llm-config ---- update LLM config and reload coach
router.put('/llm-config', (req: Request, res: Response) => {
  const update = req.body as Partial<LLMConfig>;
  if (!update.provider) {
    res.status(400).json({ error: 'provider is required' });
    return;
  }
  try {
    llmConfigStore.set(update);
    reloadCoach();
    res.json(llmConfigStore.getMasked());
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// ---- GET /api/admin/settings ---- get system settings
router.get('/settings', (_req: Request, res: Response) => {
  try {
    res.json(settingsStore.get());
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// ---- PUT /api/admin/settings ---- update system settings
router.put('/settings', (req: Request, res: Response) => {
  try {
    const updated = settingsStore.update(req.body);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

export default router;
