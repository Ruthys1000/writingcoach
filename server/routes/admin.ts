// ============================================================
// Server — Admin API Routes
// CRUD endpoints for managing writing recipes.
// ============================================================

import { Router, Request, Response } from 'express';
import { coach } from './coach';
import type { Recipe } from '../../src/types';

const router = Router();

// ---- GET /api/admin/recipes ---- list all (full data)
router.get('/recipes', (_req: Request, res: Response) => {
  try {
    const loader = coach.getRecipeLoader();
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
    const recipe = coach.getRecipeLoader().load(req.params['id'] as string);
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
    coach.getRecipeLoader().load(recipe.id);
    res.status(409).json({ error: `מתכון עם המזהה "${recipe.id}" כבר קיים` });
    return;
  } catch {
    // Expected: recipe not found, we can create it
  }

  try {
    coach.getRecipeLoader().save(recipe);
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
    coach.getRecipeLoader().save(recipe);
    res.json(recipe);
  } catch (err) {
    res.status(400).json({ error: String(err) });
  }
});

// ---- DELETE /api/admin/recipes/:id ---- delete recipe
router.delete('/recipes/:id', (req: Request, res: Response) => {
  try {
    coach.getRecipeLoader().delete(req.params['id'] as string);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

export default router;
