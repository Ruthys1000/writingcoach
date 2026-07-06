"use strict";
// ============================================================
// Server — Admin API Routes
// CRUD endpoints for managing writing recipes.
// ============================================================
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const coach_1 = require("./coach");
const system_prompt_store_1 = require("../../src/engine/system-prompt-store");
const llm_config_store_1 = require("../llm-config-store");
const settings_store_1 = require("../../src/engine/settings-store");
const router = (0, express_1.Router)();
// ---- GET /api/admin/recipes ---- list all (full data)
router.get('/recipes', (_req, res) => {
    try {
        const loader = (0, coach_1.getCoach)().getRecipeLoader();
        const list = loader.listAvailable();
        const full = list.map((r) => loader.load(r.id));
        res.json(full);
    }
    catch (err) {
        res.status(500).json({ error: String(err) });
    }
});
// ---- GET /api/admin/recipes/:id ---- single recipe
router.get('/recipes/:id', (req, res) => {
    try {
        const recipe = (0, coach_1.getCoach)().getRecipeLoader().load(req.params['id']);
        res.json(recipe);
    }
    catch (err) {
        res.status(404).json({ error: String(err) });
    }
});
// ---- POST /api/admin/recipes ---- create new recipe
router.post('/recipes', (req, res) => {
    const recipe = req.body;
    if (!recipe?.id || !recipe.name || !Array.isArray(recipe.criteria)) {
        res.status(400).json({ error: 'id, name, and criteria are required' });
        return;
    }
    // Reject if recipe id already exists
    try {
        (0, coach_1.getCoach)().getRecipeLoader().load(recipe.id);
        res.status(409).json({ error: `מתכון עם המזהה "${recipe.id}" כבר קיים` });
        return;
    }
    catch {
        // Expected: recipe not found, we can create it
    }
    try {
        (0, coach_1.getCoach)().getRecipeLoader().save(recipe);
        res.status(201).json(recipe);
    }
    catch (err) {
        res.status(400).json({ error: String(err) });
    }
});
// ---- PUT /api/admin/recipes/:id ---- update existing recipe
router.put('/recipes/:id', (req, res) => {
    const id = req.params['id'];
    const recipe = req.body;
    if (!recipe?.id || !recipe.name || !Array.isArray(recipe.criteria)) {
        res.status(400).json({ error: 'id, name, and criteria are required' });
        return;
    }
    if (recipe.id !== id) {
        res.status(400).json({ error: 'Recipe id in body must match URL parameter' });
        return;
    }
    try {
        (0, coach_1.getCoach)().getRecipeLoader().save(recipe);
        res.json(recipe);
    }
    catch (err) {
        res.status(400).json({ error: String(err) });
    }
});
// ---- DELETE /api/admin/recipes/:id ---- delete recipe
router.delete('/recipes/:id', (req, res) => {
    try {
        (0, coach_1.getCoach)().getRecipeLoader().delete(req.params['id']);
        res.json({ ok: true });
    }
    catch (err) {
        res.status(500).json({ error: String(err) });
    }
});
// ---- GET /api/admin/system-prompts ---- get all system prompts
router.get('/system-prompts', (_req, res) => {
    try {
        res.json(system_prompt_store_1.systemPromptStore.getAll());
    }
    catch (err) {
        res.status(500).json({ error: String(err) });
    }
});
// ---- PUT /api/admin/system-prompts ---- update system prompts
router.put('/system-prompts', (req, res) => {
    const { diagnostic, learning, assessment } = req.body;
    if (!diagnostic && !learning && !assessment) {
        res.status(400).json({ error: 'At least one prompt field is required' });
        return;
    }
    try {
        system_prompt_store_1.systemPromptStore.setAll({ diagnostic, learning, assessment });
        res.json(system_prompt_store_1.systemPromptStore.getAll());
    }
    catch (err) {
        res.status(500).json({ error: String(err) });
    }
});
// ---- GET /api/admin/llm-config ---- get current LLM config (keys masked)
router.get('/llm-config', (_req, res) => {
    try {
        res.json(llm_config_store_1.llmConfigStore.getMasked());
    }
    catch (err) {
        res.status(500).json({ error: String(err) });
    }
});
// ---- PUT /api/admin/llm-config ---- update LLM config and reload coach
router.put('/llm-config', (req, res) => {
    const update = req.body;
    if (!update.provider) {
        res.status(400).json({ error: 'provider is required' });
        return;
    }
    try {
        llm_config_store_1.llmConfigStore.set(update);
        (0, coach_1.reloadCoach)();
        res.json(llm_config_store_1.llmConfigStore.getMasked());
    }
    catch (err) {
        res.status(500).json({ error: String(err) });
    }
});
// ---- GET /api/admin/settings ---- get system settings
router.get('/settings', (_req, res) => {
    try {
        res.json(settings_store_1.settingsStore.get());
    }
    catch (err) {
        res.status(500).json({ error: String(err) });
    }
});
// ---- PUT /api/admin/settings ---- update system settings
router.put('/settings', (req, res) => {
    try {
        const updated = settings_store_1.settingsStore.update(req.body);
        res.json(updated);
    }
    catch (err) {
        res.status(500).json({ error: String(err) });
    }
});
exports.default = router;
//# sourceMappingURL=admin.js.map