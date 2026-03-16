// ============================================================
// Admin Page — Manage Writing Recipes
// ============================================================

import { useState, useEffect } from 'react';
import { adminApi, Recipe } from '../api';

type View = 'list' | 'edit';

const EMPTY_RECIPE: Recipe = {
  id: '',
  name: '',
  description: '',
  criteria: [],
};

const EMPTY_CRITERION = () => ({
  id: '',
  question: '',
  weight: 0.1,
  layer: 'foundational' as const,
  micro_lesson: {
    why: '',
    tool: '',
    formula: '',
    before_example: '',
    after_example: '',
  },
});

interface Props {
  onClose: () => void;
}

export function AdminPage({ onClose }: Props) {
  const [view, setView] = useState<View>('list');
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [editing, setEditing] = useState<Recipe | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    loadRecipes();
  }, []);

  async function loadRecipes() {
    setLoading(true);
    setError(null);
    try {
      const data = await adminApi.listRecipes();
      setRecipes(data);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }

  function openNew() {
    setEditing(JSON.parse(JSON.stringify(EMPTY_RECIPE)));
    setIsNew(true);
    setSaved(false);
    setError(null);
    setView('edit');
  }

  function openEdit(recipe: Recipe) {
    setEditing(JSON.parse(JSON.stringify(recipe)));
    setIsNew(false);
    setSaved(false);
    setError(null);
    setView('edit');
  }

  async function handleDelete(id: string) {
    if (!confirm(`למחוק את המתכון "${id}"?`)) return;
    setLoading(true);
    try {
      await adminApi.deleteRecipe(id);
      await loadRecipes();
    } catch (e) {
      setError(String(e));
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!editing) return;
    setLoading(true);
    setError(null);
    try {
      if (isNew) {
        await adminApi.createRecipe(editing);
      } else {
        await adminApi.updateRecipe(editing.id, editing);
      }
      await loadRecipes();
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }

  function updateField(field: keyof Recipe, value: unknown) {
    setEditing((prev) => prev ? { ...prev, [field]: value } : null);
  }

  function updateCriterion(idx: number, path: string, value: unknown) {
    if (!editing) return;
    const criteria = JSON.parse(JSON.stringify(editing.criteria));
    const keys = path.split('.');
    let obj: Record<string, unknown> = criteria[idx] as Record<string, unknown>;
    for (let i = 0; i < keys.length - 1; i++) {
      obj = obj[keys[i]] as Record<string, unknown>;
    }
    obj[keys[keys.length - 1]] = value;
    setEditing({ ...editing, criteria });
  }

  function addCriterion() {
    if (!editing) return;
    setEditing({ ...editing, criteria: [...editing.criteria, EMPTY_CRITERION()] });
  }

  function removeCriterion(idx: number) {
    if (!editing) return;
    const criteria = editing.criteria.filter((_, i) => i !== idx);
    setEditing({ ...editing, criteria });
  }

  function moveCriterion(idx: number, dir: -1 | 1) {
    if (!editing) return;
    const criteria = [...editing.criteria];
    const target = idx + dir;
    if (target < 0 || target >= criteria.length) return;
    [criteria[idx], criteria[target]] = [criteria[target], criteria[idx]];
    setEditing({ ...editing, criteria });
  }

  // ---- Render ----

  return (
    <div className="admin-overlay">
      <div className="admin-panel">
        <div className="admin-header">
          <div className="admin-header-right">
            {view === 'edit' && (
              <button className="btn-ghost admin-back" onClick={() => setView('list')}>
                ← חזרה לרשימה
              </button>
            )}
            <h2 className="admin-title">
              {view === 'list' ? '⚙️ ניהול מתכוני כתיבה' : isNew ? '➕ מתכון חדש' : `✏️ עריכת: ${editing?.name}`}
            </h2>
          </div>
          <button className="btn-ghost admin-close" onClick={onClose}>✕ סגור</button>
        </div>

        {error && <div className="alert alert-error admin-alert">❌ {error}</div>}
        {saved && <div className="alert alert-success admin-alert">✅ נשמר בהצלחה!</div>}

        {view === 'list' && (
          <div className="admin-body">
            <div className="admin-list-toolbar">
              <button className="btn-primary" onClick={openNew}>➕ מתכון חדש</button>
            </div>
            {loading && <div className="admin-loading">טוען...</div>}
            <div className="admin-recipe-list">
              {recipes.map((r) => (
                <div key={r.id} className="admin-recipe-card">
                  <div className="admin-recipe-info">
                    <div className="admin-recipe-name">{r.name}</div>
                    <div className="admin-recipe-id">id: {r.id}</div>
                    <div className="admin-recipe-desc">{r.description}</div>
                    <div className="admin-recipe-meta">{r.criteria.length} קריטריונים</div>
                  </div>
                  <div className="admin-recipe-actions">
                    <button className="btn-secondary" onClick={() => openEdit(r)}>✏️ עריכה</button>
                    <button className="btn-danger" onClick={() => handleDelete(r.id)}>🗑️ מחיקה</button>
                  </div>
                </div>
              ))}
              {!loading && recipes.length === 0 && (
                <div className="admin-empty">אין מתכונים. לחצי על "מתכון חדש" להתחיל.</div>
              )}
            </div>
          </div>
        )}

        {view === 'edit' && editing && (
          <div className="admin-body">
            {/* Recipe meta */}
            <div className="admin-section">
              <h3 className="admin-section-title">פרטי המתכון</h3>
              <div className="admin-form-grid">
                <label className="admin-label">
                  מזהה (id)
                  <input
                    className="admin-input"
                    value={editing.id}
                    disabled={!isNew}
                    placeholder="meeting-summary"
                    onChange={(e) => updateField('id', e.target.value)}
                  />
                  {isNew && <span className="admin-hint">אותיות לועזיות וקו מחבר בלבד, ללא רווחים</span>}
                </label>
                <label className="admin-label">
                  שם המסמך
                  <input
                    className="admin-input"
                    value={editing.name}
                    placeholder="סיכום דיון"
                    onChange={(e) => updateField('name', e.target.value)}
                  />
                </label>
              </div>
              <label className="admin-label">
                תיאור
                <textarea
                  className="admin-textarea"
                  rows={2}
                  value={editing.description}
                  placeholder="תיאור קצר של סוג המסמך ומטרתו"
                  onChange={(e) => updateField('description', e.target.value)}
                />
              </label>
            </div>

            {/* Criteria */}
            <div className="admin-section">
              <div className="admin-section-header">
                <h3 className="admin-section-title">קריטריונים ({editing.criteria.length})</h3>
                <button className="btn-secondary" onClick={addCriterion}>➕ הוסף קריטריון</button>
              </div>

              {editing.criteria.map((c, idx) => (
                <div key={idx} className="admin-criterion-card">
                  <div className="admin-criterion-header">
                    <span className="admin-criterion-num">#{idx + 1}</span>
                    <div className="admin-criterion-controls">
                      <button className="btn-icon" title="העלה" onClick={() => moveCriterion(idx, -1)} disabled={idx === 0}>↑</button>
                      <button className="btn-icon" title="הורד" onClick={() => moveCriterion(idx, 1)} disabled={idx === editing.criteria.length - 1}>↓</button>
                      <button className="btn-icon btn-icon-danger" title="מחק" onClick={() => removeCriterion(idx)}>✕</button>
                    </div>
                  </div>

                  <div className="admin-form-grid">
                    <label className="admin-label">
                      מזהה קריטריון
                      <input
                        className="admin-input"
                        value={c.id}
                        placeholder="bottom_line_first"
                        onChange={(e) => updateCriterion(idx, 'id', e.target.value)}
                      />
                    </label>
                    <label className="admin-label">
                      משקל (0–1)
                      <input
                        className="admin-input"
                        type="number"
                        min={0}
                        max={1}
                        step={0.01}
                        value={c.weight}
                        onChange={(e) => updateCriterion(idx, 'weight', parseFloat(e.target.value))}
                      />
                    </label>
                    <label className="admin-label">
                      שכבה
                      <select
                        className="admin-select"
                        value={c.layer}
                        onChange={(e) => updateCriterion(idx, 'layer', e.target.value)}
                      >
                        <option value="foundational">foundational — תשתיתי</option>
                        <option value="document_specific">document_specific — ייחודי למסמך</option>
                      </select>
                    </label>
                  </div>

                  <label className="admin-label">
                    שאלת האבחון
                    <textarea
                      className="admin-textarea"
                      rows={2}
                      value={c.question}
                      placeholder="האם המסמך כולל..."
                      onChange={(e) => updateCriterion(idx, 'question', e.target.value)}
                    />
                  </label>

                  <div className="admin-micro-lesson">
                    <div className="admin-micro-title">מיקרו-שיעור</div>
                    <label className="admin-label">
                      למה זה חשוב
                      <textarea className="admin-textarea" rows={2} value={c.micro_lesson.why}
                        onChange={(e) => updateCriterion(idx, 'micro_lesson.why', e.target.value)} />
                    </label>
                    <label className="admin-label">
                      הכלי / הטכניקה
                      <textarea className="admin-textarea" rows={2} value={c.micro_lesson.tool}
                        onChange={(e) => updateCriterion(idx, 'micro_lesson.tool', e.target.value)} />
                    </label>
                    <label className="admin-label">
                      נוסחה (אופציונלי)
                      <textarea className="admin-textarea" rows={1} value={c.micro_lesson.formula ?? ''}
                        onChange={(e) => updateCriterion(idx, 'micro_lesson.formula', e.target.value)} />
                    </label>
                    <div className="admin-form-grid">
                      <label className="admin-label">
                        דוגמת "לפני"
                        <textarea className="admin-textarea" rows={3} value={c.micro_lesson.before_example}
                          onChange={(e) => updateCriterion(idx, 'micro_lesson.before_example', e.target.value)} />
                      </label>
                      <label className="admin-label">
                        דוגמת "אחרי"
                        <textarea className="admin-textarea" rows={3} value={c.micro_lesson.after_example}
                          onChange={(e) => updateCriterion(idx, 'micro_lesson.after_example', e.target.value)} />
                      </label>
                    </div>
                  </div>
                </div>
              ))}

              {editing.criteria.length === 0 && (
                <div className="admin-empty">לחצי על "הוסף קריטריון" כדי להתחיל</div>
              )}
            </div>

            <div className="admin-save-bar">
              <button className="btn-secondary" onClick={() => setView('list')}>ביטול</button>
              <button className="btn-primary" onClick={handleSave} disabled={loading}>
                {loading ? 'שומר...' : '💾 שמור מתכון'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
