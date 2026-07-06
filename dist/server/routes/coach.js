"use strict";
// ============================================================
// Server — Coach API Routes
// REST endpoints wrapping the WritingCoach 3-step loop.
// ============================================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCoach = getCoach;
exports.reloadCoach = reloadCoach;
const express_1 = require("express");
const uuid_1 = require("uuid");
const factory_1 = require("../../src/llm/factory");
const coach_1 = require("../../src/coach");
const session_store_1 = require("../session-store");
const llm_config_store_1 = require("../llm-config-store");
const settings_store_1 = require("../../src/engine/settings-store");
const router = (0, express_1.Router)();
// Mutable coach instance — null until first use or after config save
let _coach = null;
try {
    _coach = new coach_1.WritingCoach((0, factory_1.createLLMClient)(llm_config_store_1.llmConfigStore.get()));
}
catch {
    // No valid API key yet — server still starts, admin panel is accessible
}
function getCoach() {
    if (!_coach) {
        throw new Error('ספק ה-AI לא מוגדר — עבור לדשבורד הניהול ← ספק AI והכנס את מפתח ה-API');
    }
    return _coach;
}
function reloadCoach() {
    _coach = new coach_1.WritingCoach((0, factory_1.createLLMClient)(llm_config_store_1.llmConfigStore.get()));
}
// ---- GET /api/recipes ----
router.get('/recipes', (_req, res) => {
    try {
        res.json(getCoach().listDocumentTypes());
    }
    catch (err) {
        res.status(500).json({ error: String(err) });
    }
});
// ---- POST /api/diagnose ----
// Body: { documentTypeId, documentText }
// Returns: { sessionId, report }
router.post('/diagnose', async (req, res) => {
    const { documentTypeId, documentText } = req.body;
    if (!documentTypeId || !documentText?.trim()) {
        res.status(400).json({ error: 'documentTypeId and documentText are required' });
        return;
    }
    if (documentText.length < 50) {
        res.status(400).json({ error: 'הטקסט קצר מדי — נסה עם מסמך מלא (50+ תווים)' });
        return;
    }
    const MAX_DOCUMENT_LENGTH = 50000;
    if (documentText.length > MAX_DOCUMENT_LENGTH) {
        res.status(400).json({ error: `המסמך ארוך מדי — מקסימום ${MAX_DOCUMENT_LENGTH} תווים` });
        return;
    }
    try {
        const session = await getCoach().runDiagnostic(documentTypeId, documentText);
        const sessionId = (0, uuid_1.v4)();
        (0, session_store_1.setSession)(sessionId, session);
        res.json({ sessionId, report: session.diagnosticReport, recipe: session.recipe });
    }
    catch (err) {
        res.status(500).json({ error: String(err) });
    }
});
// ---- POST /api/session/:id/learn ----
// Returns: { learningUnits }
router.post('/session/:id/learn', async (req, res) => {
    const session = (0, session_store_1.getSession)(req.params['id']);
    if (!session) {
        res.status(404).json({ error: 'Session not found' });
        return;
    }
    try {
        const updated = await getCoach().generateLearning(session, settings_store_1.settingsStore.get().max_lessons);
        (0, session_store_1.setSession)(req.params['id'], updated);
        res.json({ learningUnits: updated.learningUnits });
    }
    catch (err) {
        res.status(500).json({ error: String(err) });
    }
});
// ---- GET /api/session/:id/exercise/:unitIndex ----
router.get('/session/:id/exercise/:unitIndex', async (req, res) => {
    const session = (0, session_store_1.getSession)(req.params['id']);
    if (!session) {
        res.status(404).json({ error: 'Session not found' });
        return;
    }
    const unitIndex = parseInt(req.params['unitIndex'], 10);
    try {
        const exercise = await getCoach().generateExercise(session, unitIndex);
        (0, session_store_1.setSession)(req.params['id'], { ...session, exercises: { ...session.exercises, [unitIndex]: exercise } });
        res.json({ exercise });
    }
    catch (err) {
        res.status(500).json({ error: String(err) });
    }
});
// ---- POST /api/session/:id/assess/:unitIndex ----
// Body: { userRewrite }
router.post('/session/:id/assess/:unitIndex', async (req, res) => {
    const session = (0, session_store_1.getSession)(req.params['id']);
    if (!session) {
        res.status(404).json({ error: 'Session not found' });
        return;
    }
    const { userRewrite } = req.body;
    if (!userRewrite?.trim()) {
        res.status(400).json({ error: 'userRewrite is required' });
        return;
    }
    const unitIndex = parseInt(req.params['unitIndex'], 10);
    try {
        const exercise = session.exercises[unitIndex] ??
            await getCoach().generateExercise(session, unitIndex);
        const result = await getCoach().evaluateRewrite(exercise, userRewrite, session, unitIndex);
        res.json({ result, exercise });
    }
    catch (err) {
        res.status(500).json({ error: String(err) });
    }
});
exports.default = router;
//# sourceMappingURL=coach.js.map