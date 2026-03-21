// ============================================================
// Admin Dashboard — Full-page admin panel (Recipes + System Prompts)
// ============================================================

import { useState, useEffect, useRef } from 'react';
import { adminApi, systemPromptApi, llmConfigApi, Recipe, SystemPrompts, LLMConfig, LLMProvider } from '../api';

// ================================================================
// CSV helpers (for recipes)
// ================================================================

const CSV_HEADERS = [
  'recipe_id', 'recipe_name', 'recipe_description',
  'criterion_id', 'question', 'importance', 'layer',
  'why', 'tool', 'formula', 'before_example', 'after_example',
];

function csvField(s: string | undefined | null): string {
  const str = (s ?? '').toString();
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function recipeToCSV(recipe: Recipe): string {
  const rows = recipe.criteria.map((c) =>
    [
      recipe.id, recipe.name, recipe.description,
      c.id, c.question, weightToImportance(c.weight), c.layer,
      c.micro_lesson.why, c.micro_lesson.tool, c.micro_lesson.formula ?? '',
      c.micro_lesson.before_example, c.micro_lesson.after_example,
    ].map(csvField).join(',')
  );
  return [CSV_HEADERS.join(','), ...rows].join('\r\n');
}

function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;
  let i = 0;
  while (i < text.length) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"' && text[i + 1] === '"') { field += '"'; i += 2; }
      else if (ch === '"') { inQuotes = false; i++; }
      else { field += ch; i++; }
    } else {
      if (ch === '"') { inQuotes = true; i++; }
      else if (ch === ',') { row.push(field); field = ''; i++; }
      else if (ch === '\r' && text[i + 1] === '\n') { row.push(field); field = ''; rows.push(row); row = []; i += 2; }
      else if (ch === '\n') { row.push(field); field = ''; rows.push(row); row = []; i++; }
      else { field += ch; i++; }
    }
  }
  if (field !== '' || row.length > 0) { row.push(field); rows.push(row); }
  return rows;
}

function csvToRecipe(csvText: string): Recipe {
  const text = csvText.startsWith('\uFEFF') ? csvText.slice(1) : csvText;
  const rows = parseCSV(text).filter((r) => r.some((f) => f.trim() !== ''));
  if (rows.length < 2) throw new Error('הקובץ ריק או חסר שורות נתונים');
  const headers = rows[0].map((h) => h.trim());
  const col = (name: string) => headers.indexOf(name);
  for (const req of ['recipe_name', 'criterion_id', 'question', 'importance', 'layer', 'why', 'tool']) {
    if (col(req) === -1) throw new Error(`עמודה חסרה בקובץ CSV: "${req}"`);
  }
  const criteria = rows.slice(1).map((cols, i) => {
    const importance = cols[col('importance')]?.trim() || 'medium';
    return {
      id: cols[col('criterion_id')]?.trim() || `c${i + 1}`,
      question: cols[col('question')]?.trim() || '',
      weight: IMPORTANCE_MAP[importance] ?? 0.5,
      layer: (cols[col('layer')]?.trim() || 'foundational') as 'foundational' | 'document_specific',
      micro_lesson: {
        why: cols[col('why')]?.trim() || '',
        tool: cols[col('tool')]?.trim() || '',
        formula: cols[col('formula')]?.trim() || undefined,
        before_example: cols[col('before_example')]?.trim() || '',
        after_example: cols[col('after_example')]?.trim() || '',
      },
    };
  });
  const first = rows[1];
  return {
    id: first[col('recipe_id')]?.trim() || generateRecipeId(),
    name: first[col('recipe_name')]?.trim() || '',
    description: first[col('recipe_description')]?.trim() || '',
    criteria,
  };
}

function downloadRecipeCSV(recipe: Recipe) {
  const bom = '\uFEFF';
  const csv = recipeToCSV(recipe);
  const blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${recipe.id || 'recipe'}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

const IMPORTANCE_MAP: Record<string, number> = { high: 0.8, medium: 0.5, low: 0.2 };
function weightToImportance(w: number): string {
  if (w >= 0.7) return 'high';
  if (w >= 0.4) return 'medium';
  return 'low';
}
const IMPORTANCE_LABELS: Record<string, string> = { high: 'גבוהה', medium: 'בינונית', low: 'נמוכה' };

function generateRecipeId(): string {
  return `recipe-${crypto.randomUUID()}`;
}

function criterionId(idx: number): string {
  return `c${idx + 1}`;
}

const EMPTY_RECIPE: Recipe = { id: '', name: '', description: '', criteria: [] };
const EMPTY_CRITERION = () => ({
  id: '',
  question: '',
  weight: 0.5,
  layer: 'foundational' as const,
  micro_lesson: { why: '', tool: '', formula: '', before_example: '', after_example: '' },
});

// ================================================================
// Recipe Manager Panel
// ================================================================

type RecipeView = 'list' | 'edit';

function RecipeManager() {
  const [view, setView] = useState<RecipeView>('list');
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [editing, setEditing] = useState<Recipe | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [expandedCriteria, setExpandedCriteria] = useState<Record<number, boolean>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { loadRecipes(); }, []);

  async function loadRecipes() {
    setLoading(true); setError(null);
    try { setRecipes(await adminApi.listRecipes()); }
    catch (e) { setError(String(e)); }
    finally { setLoading(false); }
  }

  function openNew() {
    const r = JSON.parse(JSON.stringify(EMPTY_RECIPE));
    r.id = generateRecipeId();
    setEditing(r); setIsNew(true); setSaved(false); setError(null);
    setExpandedCriteria({}); setView('edit');
  }

  function openEdit(recipe: Recipe) {
    setEditing(JSON.parse(JSON.stringify(recipe)));
    setIsNew(false); setSaved(false); setError(null);
    setExpandedCriteria({}); setView('edit');
  }

  async function handleDelete(id: string) {
    if (!confirm(`למחוק את המתכון "${id}"?`)) return;
    setLoading(true);
    try { await adminApi.deleteRecipe(id); await loadRecipes(); }
    catch (e) { setError(String(e)); setLoading(false); }
  }

  async function handleSave() {
    if (!editing) return;
    const withIds: Recipe = {
      ...editing,
      criteria: editing.criteria.map((c, idx) => ({ ...c, id: c.id || criterionId(idx) })),
    };
    setLoading(true); setError(null);
    try {
      if (isNew) await adminApi.createRecipe(withIds);
      else await adminApi.updateRecipe(withIds.id, withIds);
      await loadRecipes(); setSaved(true); setTimeout(() => setSaved(false), 3000);
    } catch (e) { setError(String(e)); }
    finally { setLoading(false); }
  }

  function updateField(field: keyof Recipe, value: unknown) {
    setEditing((prev) => prev ? { ...prev, [field]: value } : null);
  }

  function updateCriterion(idx: number, path: string, value: unknown) {
    if (!editing) return;
    const criteria = JSON.parse(JSON.stringify(editing.criteria));
    const keys = path.split('.');
    let obj: Record<string, unknown> = criteria[idx] as Record<string, unknown>;
    for (let i = 0; i < keys.length - 1; i++) obj = obj[keys[i]] as Record<string, unknown>;
    obj[keys[keys.length - 1]] = value;
    setEditing({ ...editing, criteria });
  }

  function addCriterion() {
    if (!editing) return;
    const newIdx = editing.criteria.length;
    setEditing({ ...editing, criteria: [...editing.criteria, EMPTY_CRITERION()] });
    setExpandedCriteria((prev) => ({ ...prev, [newIdx]: true }));
  }

  function removeCriterion(idx: number) {
    if (!editing) return;
    const criteria = editing.criteria.filter((_, i) => i !== idx);
    setEditing({ ...editing, criteria });
    setExpandedCriteria((prev) => {
      const next: Record<number, boolean> = {};
      Object.entries(prev).forEach(([k, v]) => {
        const ki = parseInt(k);
        if (ki < idx) next[ki] = v;
        else if (ki > idx) next[ki - 1] = v;
      });
      return next;
    });
  }

  function moveCriterion(idx: number, dir: -1 | 1) {
    if (!editing) return;
    const criteria = [...editing.criteria];
    const target = idx + dir;
    if (target < 0 || target >= criteria.length) return;
    [criteria[idx], criteria[target]] = [criteria[target], criteria[idx]];
    setEditing({ ...editing, criteria });
  }

  function toggleCriterion(idx: number) {
    setExpandedCriteria((prev) => ({ ...prev, [idx]: !prev[idx] }));
  }

  function handleImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = csvToRecipe(ev.target?.result as string);
        if (!parsed.name || !Array.isArray(parsed.criteria)) throw new Error('הקובץ אינו מתכון תקני');
        parsed.id = generateRecipeId();
        setEditing(parsed); setIsNew(true); setSaved(false); setError(null);
        setExpandedCriteria({}); setView('edit');
      } catch (err) { setError(`שגיאה בקריאת הקובץ: ${String(err)}`); }
    };
    reader.readAsText(file, 'utf-8');
  }

  if (view === 'list') return (
    <div>
      {error && <div className="alert alert-error" style={{ marginBottom: 16 }}>{error}</div>}
      <div className="adm-toolbar">
        <button className="btn-primary" onClick={openNew}>+ מתכון חדש</button>
        <button className="btn-secondary" onClick={() => fileInputRef.current?.click()}>
          ⤓ ייבוא CSV
        </button>
        <input ref={fileInputRef} type="file" accept=".csv,text/csv" style={{ display: 'none' }} onChange={handleImportFile} />
        {!loading && <span className="adm-recipe-count">{recipes.length} מתכונים</span>}
      </div>
      {loading && <div className="admin-loading">טוען...</div>}
      <div className="admin-recipe-list">
        {recipes.map((r) => (
          <div key={r.id} className="admin-recipe-card">
            <div className="admin-recipe-info">
              <div className="admin-recipe-name">{r.name}</div>
              <div className="admin-recipe-desc">{r.description}</div>
              <div className="admin-recipe-meta">
                <span className="admin-recipe-criteria-badge">✓ {r.criteria.length} קריטריונים</span>
              </div>
            </div>
            <div className="admin-recipe-actions">
              <button className="adm-recipe-btn adm-recipe-btn-edit" onClick={() => openEdit(r)}>✎ עריכה</button>
              <button className="adm-recipe-btn adm-recipe-btn-csv" title="הורד CSV" onClick={() => downloadRecipeCSV(r)}>⤓ CSV</button>
              <button className="adm-recipe-btn adm-recipe-btn-delete" onClick={() => handleDelete(r.id)}>מחיקה</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  if (view === 'edit' && editing) return (
    <div>
      {error && <div className="alert alert-error" style={{ marginBottom: 16 }}>{error}</div>}

      <div className="adm-edit-nav">
        <button className="adm-back-btn" onClick={() => setView('list')}>← רשימת מתכונים</button>
        <span className="adm-edit-title">{isNew ? 'מתכון חדש' : `עריכת: ${editing.name}`}</span>
      </div>

      {/* Preview */}
      <div className="admin-preview-card">
        <div className="admin-preview-label">תצוגה מקדימה — כך ייראה בדף הבחירה של המשתמש:</div>
        <div className="admin-preview-doctype">
          <div className="admin-preview-doctype-name">{editing.name || 'שם סוג המסמך'}</div>
          <div className="admin-preview-doctype-desc">{editing.description || 'תיאור המסמך ייופיע כאן'}</div>
          <div className="admin-preview-doctype-count">
            {editing.criteria.length > 0 ? `${editing.criteria.length} קריטריונים להערכה` : 'טרם הוגדרו קריטריונים'}
          </div>
        </div>
      </div>

      {/* Recipe meta */}
      <div className="admin-section">
        <h3 className="admin-section-title">פרטי המסמך</h3>
        <label className="admin-label">
          שם סוג המסמך
          <input className="admin-input" value={editing.name}
            placeholder="לדוגמה: סיכום ישיבה, דוח שבועי"
            onChange={(e) => updateField('name', e.target.value)} autoFocus />
          <span className="admin-hint">השם שיופיע למשתמש בדף הבחירה</span>
        </label>
        <label className="admin-label" style={{ marginTop: '0.75rem' }}>
          תיאור קצר
          <textarea className="admin-textarea" rows={2} value={editing.description}
            placeholder="לדוגמה: מסמך שמסכם דיון — כולל החלטות, משימות ואחראים"
            onChange={(e) => updateField('description', e.target.value)} />
          <span className="admin-hint">משפט או שניים על מטרת המסמך</span>
        </label>
      </div>

      {/* Criteria */}
      <div className="admin-section">
        <div className="admin-section-header">
          <div>
            <h3 className="admin-section-title">קריטריונים להערכה ({editing.criteria.length})</h3>
            <p className="admin-section-subtitle">
              כל קריטריון הוא שאלה כן/לא שה-AI ישאל על המסמך. לכל קריטריון מצורף מיקרו-שיעור.
            </p>
          </div>
          <button className="btn-secondary btn-sm" onClick={addCriterion}>+ הוסף קריטריון</button>
        </div>

        {editing.criteria.map((c, idx) => {
          const isExpanded = !!expandedCriteria[idx];
          const previewTitle = c.question || `קריטריון #${idx + 1}`;
          return (
            <div key={idx} className="admin-criterion-card">
              <div className="admin-criterion-header admin-criterion-header-clickable" onClick={() => toggleCriterion(idx)}>
                <div className="admin-criterion-header-left">
                  <span className="admin-criterion-num">#{idx + 1}</span>
                  <span className="admin-criterion-preview-title">{previewTitle}</span>
                  {c.layer && (
                    <span className={`admin-criterion-badge ${c.layer === 'foundational' ? 'badge-foundational' : 'badge-specific'}`}>
                      {c.layer === 'foundational' ? 'תשתיתי' : 'ייחודי למסמך'}
                    </span>
                  )}
                  {c.weight > 0 && (
                    <span className="admin-criterion-badge badge-importance">
                      חשיבות {IMPORTANCE_LABELS[weightToImportance(c.weight)]}
                    </span>
                  )}
                </div>
                <div className="admin-criterion-controls" onClick={(e) => e.stopPropagation()}>
                  <button className="btn-icon" title="העלה" onClick={() => moveCriterion(idx, -1)} disabled={idx === 0}>↑</button>
                  <button className="btn-icon" title="הורד" onClick={() => moveCriterion(idx, 1)} disabled={idx === editing.criteria.length - 1}>↓</button>
                  <button className="btn-icon btn-icon-danger" title="מחק" onClick={() => removeCriterion(idx)}>✕</button>
                  <span className="admin-criterion-toggle">{isExpanded ? '▲' : '▼'}</span>
                </div>
              </div>

              {isExpanded && (
                <div className="admin-criterion-body">
                  <label className="admin-label">
                    שאלת האבחון
                    <textarea className="admin-textarea" rows={2} value={c.question}
                      placeholder="לדוגמה: האם המסמך פותח בשורת תקציר שמסכמת את הנקודה העיקרית?"
                      onChange={(e) => updateCriterion(idx, 'question', e.target.value)} />
                    <span className="admin-hint">שאלת כן/לא שה-AI יבדוק. כתוב "האם..." בצורה ברורה.</span>
                  </label>

                  <div className="admin-form-grid" style={{ marginTop: '0.75rem' }}>
                    <label className="admin-label">
                      חשיבות הקריטריון
                      <div className="admin-radio-group">
                        {(['low', 'medium', 'high'] as const).map((level) => (
                          <label key={level} className="admin-radio-option">
                            <input type="radio" name={`importance-${idx}`}
                              checked={weightToImportance(c.weight) === level}
                              onChange={() => updateCriterion(idx, 'weight', IMPORTANCE_MAP[level])} />
                            {IMPORTANCE_LABELS[level]}
                          </label>
                        ))}
                      </div>
                    </label>

                    <label className="admin-label">
                      סוג הקריטריון
                      <div className="admin-radio-group admin-radio-group-column">
                        <label className="admin-radio-option">
                          <input type="radio" name={`layer-${idx}`} checked={c.layer === 'foundational'}
                            onChange={() => updateCriterion(idx, 'layer', 'foundational')} />
                          <div><strong>תשתיתי</strong>
                            <div className="admin-radio-desc">רלוונטי לכל סוגי המסמכים</div>
                          </div>
                        </label>
                        <label className="admin-radio-option">
                          <input type="radio" name={`layer-${idx}`} checked={c.layer === 'document_specific'}
                            onChange={() => updateCriterion(idx, 'layer', 'document_specific')} />
                          <div><strong>ייחודי למסמך</strong>
                            <div className="admin-radio-desc">ספציפי לסוג מסמך זה בלבד</div>
                          </div>
                        </label>
                      </div>
                    </label>
                  </div>

                  <div className="admin-micro-lesson">
                    <div className="admin-micro-title">
                      מיקרו-שיעור
                      <span className="admin-micro-subtitle"> — יוצג למשתמש כשהוא נכשל בקריטריון זה</span>
                    </div>
                    <label className="admin-label">
                      למה זה חשוב?
                      <textarea className="admin-textarea" rows={2} value={c.micro_lesson.why}
                        placeholder="הסבר קצר שיניע את המשתמש להבין מדוע הנושא משנה"
                        onChange={(e) => updateCriterion(idx, 'micro_lesson.why', e.target.value)} />
                    </label>
                    <label className="admin-label">
                      הכלי / הטכניקה
                      <textarea className="admin-textarea" rows={2} value={c.micro_lesson.tool}
                        placeholder="הנחיה מעשית קצרה שהמשתמש יכול ליישם מיד"
                        onChange={(e) => updateCriterion(idx, 'micro_lesson.tool', e.target.value)} />
                    </label>
                    <label className="admin-label">
                      נוסחה או תבנית (אופציונלי)
                      <textarea className="admin-textarea" rows={1} value={c.micro_lesson.formula ?? ''}
                        placeholder='לדוגמה: "[נושא] + [מסקנה] + [פעולה נדרשת]"'
                        onChange={(e) => updateCriterion(idx, 'micro_lesson.formula', e.target.value)} />
                    </label>
                    <div className="admin-form-grid">
                      <label className="admin-label">
                        דוגמת "לפני" — כתיבה בעייתית
                        <textarea className="admin-textarea" rows={3} value={c.micro_lesson.before_example}
                          placeholder="קטע לדוגמה שמדגים את הבעיה"
                          onChange={(e) => updateCriterion(idx, 'micro_lesson.before_example', e.target.value)} />
                      </label>
                      <label className="admin-label">
                        דוגמת "אחרי" — כתיבה משופרת
                        <textarea className="admin-textarea" rows={3} value={c.micro_lesson.after_example}
                          placeholder="אותו קטע לאחר תיקון"
                          onChange={(e) => updateCriterion(idx, 'micro_lesson.after_example', e.target.value)} />
                      </label>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {editing.criteria.length === 0 && (
          <div className="admin-empty">לחץ על "הוסף קריטריון" כדי להגדיר את הדברים שה-AI יבדוק</div>
        )}
      </div>

      <div className="admin-save-bar">
        <button className="btn-secondary" onClick={() => setView('list')}>ביטול</button>
        <button className="btn-secondary" title="הורד כ-CSV" onClick={() => downloadRecipeCSV(editing)}>הורד CSV</button>
        {saved && <span className="admin-save-success">✅ נשמר בהצלחה!</span>}
        <button className="btn-primary" onClick={handleSave} disabled={loading}>
          {loading ? 'שומר...' : 'שמור מתכון'}
        </button>
      </div>
    </div>
  );

  return null;
}

// ================================================================
// Prompt Manager Panel
// ================================================================

const PROMPT_LABELS: Record<keyof SystemPrompts, string> = {
  diagnostic: 'אבחון (Diagnostic) — הערכת המסמך',
  learning: 'למידה (Learning) — יצירת שיעורים',
  assessment: 'הערכה (Assessment) — תרגילי שכתוב',
};

const PROMPT_DESCRIPTIONS: Record<keyof SystemPrompts, string> = {
  diagnostic: 'מופעל בשלב ניתוח המסמך מול מחוון הקריטריונים',
  learning: 'מופעל בשלב יצירת שיעורי המיקרו-למידה המותאמים אישית',
  assessment: 'מופעל בשלב יצירת תרגיל השכתוב והערכתו',
};

function PromptManager() {
  const [prompts, setPrompts] = useState<SystemPrompts>({ diagnostic: '', learning: '', assessment: '' });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => { loadPrompts(); }, []);

  async function loadPrompts() {
    setLoading(true); setError(null);
    try { setPrompts(await systemPromptApi.getAll()); }
    catch (e) { setError(String(e)); }
    finally { setLoading(false); }
  }

  async function handleSave() {
    setSaving(true); setError(null); setSaved(false);
    try {
      const updated = await systemPromptApi.updateAll(prompts);
      setPrompts(updated); setSaved(true); setTimeout(() => setSaved(false), 2500);
    } catch (e) { setError(String(e)); }
    finally { setSaving(false); }
  }

  function handleChange(key: keyof SystemPrompts, value: string) {
    setPrompts((p) => ({ ...p, [key]: value }));
    setSaved(false);
  }

  if (loading) return (
    <div style={{ textAlign: 'center', padding: '3rem' }}>
      <div className="spinner" style={{ margin: '0 auto' }} />
      <p style={{ color: 'var(--paper-500)', marginTop: 16 }}>טוען פרומפטים...</p>
    </div>
  );

  return (
    <div>
      {error && <div className="alert alert-error" style={{ marginBottom: 16 }}>{error}</div>}

      <div className="adm-prompts-info">
        <p>הסיסטם פרומפטים קובעים כיצד ה-AI מתנהג בכל שלב. שינוי ללא זהירות עלול לפגוע בתפקוד המערכת.</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {(Object.keys(PROMPT_LABELS) as (keyof SystemPrompts)[]).map((key) => (
          <div key={key} className="admin-section" style={{ marginBottom: 0 }}>
            <div style={{ marginBottom: 12 }}>
              <strong style={{ fontSize: '1rem', color: 'var(--ink-900)' }}>{PROMPT_LABELS[key]}</strong>
              <div style={{ fontSize: '0.88rem', color: 'var(--paper-500)', marginTop: 4 }}>
                {PROMPT_DESCRIPTIONS[key]}
              </div>
            </div>
            <textarea
              className="admin-textarea"
              value={prompts[key]}
              onChange={(e) => handleChange(key, e.target.value)}
              rows={7}
              style={{ fontFamily: 'monospace', fontSize: '0.88rem' }}
            />
          </div>
        ))}
      </div>

      <div className="admin-save-bar" style={{ marginTop: 24 }}>
        {saved && <span className="admin-save-success">✅ נשמר בהצלחה!</span>}
        <button className="btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? 'שומר...' : 'שמור פרומפטים'}
        </button>
      </div>
    </div>
  );
}

// ================================================================
// Admin Dashboard — Main export
// ================================================================

// ================================================================
// LLM Config Manager
// ================================================================

const PROVIDER_LABELS: Record<LLMProvider, string> = {
  anthropic: 'Anthropic Claude',
  openai:    'OpenAI / תואם-OpenAI',
  cohere:    'Cohere',
  ollama:    'Ollama (מקומי)',
};

const PROVIDER_COLORS: Record<LLMProvider, string> = {
  anthropic: '#8b5cf6',
  openai:    '#22c55e',
  cohere:    '#3b82f6',
  ollama:    '#eab308',
};

const PROVIDER_DESCS: Record<LLMProvider, string> = {
  anthropic: 'Claude Haiku — מהיר וחסכוני לשימוש ביומיום',
  openai:    'GPT או כל שרת תואם-OpenAI (vLLM, LM Studio, Azure)',
  cohere:    'Command R — אפשרות ענן חלופית',
  ollama:    'מודל מקומי בלי שליחת מידע לענן',
};

function LLMManager() {
  const [config, setConfig] = useState<LLMConfig>({ provider: 'anthropic' });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setLoading(true);
    llmConfigApi.get()
      .then(setConfig)
      .catch((e) => setError(String(e)))
      .finally(() => setLoading(false));
  }, []);

  function update(patch: Partial<LLMConfig>) {
    setConfig((c) => ({ ...c, ...patch }));
    setSaved(false);
  }

  async function handleSave() {
    setSaving(true); setError(null); setSaved(false);
    try {
      const updated = await llmConfigApi.update(config);
      setConfig(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) { setError(String(e)); }
    finally { setSaving(false); }
  }

  if (loading) return (
    <div style={{ textAlign: 'center', padding: '3rem' }}>
      <div className="spinner" style={{ margin: '0 auto' }} />
      <p style={{ color: 'var(--paper-500)', marginTop: 16 }}>טוען הגדרות...</p>
    </div>
  );

  return (
    <div>
      {error && <div className="alert alert-error" style={{ marginBottom: 16 }}>{error}</div>}

      {/* Provider selector */}
      <div className="admin-section">
        <h3 className="admin-section-title">ספק AI</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {(Object.keys(PROVIDER_LABELS) as LLMProvider[]).map((p) => (
            <button
              key={p}
              onClick={() => update({ provider: p })}
              style={{
                padding: '12px 16px',
                borderRadius: 'var(--radius-md)',
                border: config.provider === p
                  ? '2px solid var(--ink-700)'
                  : '1px solid var(--paper-300)',
                background: config.provider === p ? 'var(--ink-900)' : 'var(--paper-50)',
                color: config.provider === p ? 'white' : 'var(--ink-700)',
                cursor: 'pointer',
                textAlign: 'right',
                fontFamily: 'Heebo, Arial, sans-serif',
                transition: 'all .18s',
              }}
            >
              <div style={{ fontWeight: 700, fontSize: '.95rem', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8 }}>
                {PROVIDER_LABELS[p]}
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: PROVIDER_COLORS[p], flexShrink: 0, display: 'inline-block' }} />
              </div>
              <div style={{ fontSize: '.78rem', opacity: .75, marginTop: 3 }}>{PROVIDER_DESCS[p]}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Fields per provider */}
      <div className="admin-section">
        <h3 className="admin-section-title">פרטי חיבור — {PROVIDER_LABELS[config.provider]}</h3>

        {config.provider === 'anthropic' && (
          <label className="admin-label">
            מפתח API
            <input
              className="admin-input"
              type="password"
              value={config.anthropic_api_key ?? ''}
              placeholder="sk-ant-api03-..."
              onChange={(e) => update({ anthropic_api_key: e.target.value })}
            />
            <span className="admin-hint">
              מפתח ה-API זמין תחת <em>API Keys</em> ב-<a href="https://console.anthropic.com" target="_blank" rel="noreferrer" style={{ color: 'var(--ink-500)' }}>console.anthropic.com</a>
            </span>
          </label>
        )}

        {config.provider === 'openai' && (
          <>
            <label className="admin-label">
              כתובת שרת (Base URL)
              <input className="admin-input" value={config.openai_base_url ?? ''}
                placeholder="https://api.openai.com/v1"
                onChange={(e) => update({ openai_base_url: e.target.value })} />
              <span className="admin-hint">לשרת OpenAI הרגיל השאר כברירת מחדל. לשרת פנימי — הכנס כתובת מלאה.</span>
            </label>
            <label className="admin-label" style={{ marginTop: '0.75rem' }}>
              מפתח API
              <input className="admin-input" type="password" value={config.openai_api_key ?? ''}
                placeholder="sk-..."
                onChange={(e) => update({ openai_api_key: e.target.value })} />
            </label>
            <label className="admin-label" style={{ marginTop: '0.75rem' }}>
              שם מודל
              <input className="admin-input" value={config.openai_model ?? ''}
                placeholder="gpt-4o-mini"
                onChange={(e) => update({ openai_model: e.target.value })} />
            </label>
          </>
        )}

        {config.provider === 'cohere' && (
          <>
            <label className="admin-label">
              מפתח API
              <input className="admin-input" type="password" value={config.cohere_api_key ?? ''}
                placeholder="..."
                onChange={(e) => update({ cohere_api_key: e.target.value })} />
              <span className="admin-hint">
                מצא ב־<a href="https://dashboard.cohere.com" target="_blank" rel="noreferrer" style={{ color: 'var(--ink-500)' }}>dashboard.cohere.com</a>
              </span>
            </label>
            <label className="admin-label" style={{ marginTop: '0.75rem' }}>
              כתובת שרת (Base URL)
              <input className="admin-input" value={config.cohere_base_url ?? ''}
                placeholder="https://api.cohere.com/v2"
                onChange={(e) => update({ cohere_base_url: e.target.value })} />
              <span className="admin-hint">לשרת on-prem הכנס כתובת פנימית, אחרת השאר ריק.</span>
            </label>
            <label className="admin-label" style={{ marginTop: '0.75rem' }}>
              שם מודל
              <input className="admin-input" value={config.cohere_model ?? ''}
                placeholder="command-r-plus"
                onChange={(e) => update({ cohere_model: e.target.value })} />
            </label>
          </>
        )}

        {config.provider === 'ollama' && (
          <>
            <label className="admin-label">
              כתובת שרת Ollama
              <input className="admin-input" value={config.ollama_base_url ?? ''}
                placeholder="http://localhost:11434"
                onChange={(e) => update({ ollama_base_url: e.target.value })} />
              <span className="admin-hint">הרץ Ollama מקומית ותן כאן את הכתובת. ללא שליחת נתונים לענן.</span>
            </label>
            <label className="admin-label" style={{ marginTop: '0.75rem' }}>
              שם מודל
              <input className="admin-input" value={config.ollama_model ?? ''}
                placeholder="llama3"
                onChange={(e) => update({ ollama_model: e.target.value })} />
            </label>
          </>
        )}
      </div>

      <div className="admin-save-bar">
        {saved && <span className="admin-save-success">✅ נשמר — הספק הוחלף מיידית</span>}
        <button className="btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? 'שומר...' : 'שמור הגדרות'}
        </button>
      </div>
    </div>
  );
}

type AdminTab = 'recipes' | 'prompts' | 'llm';

interface Props {
  onBack: () => void;
}

export function AdminDashboard({ onBack }: Props) {
  const [activeTab, setActiveTab] = useState<AdminTab>('recipes');

  return (
    <div className="adm-shell">
      {/* Top bar */}
      <div className="top-bar">
        <button className="adm-back-top" onClick={onBack}>
          ← חזרה
        </button>
        <h1>ניהול מערכת</h1>
        <span className="top-bar-spacer" />
      </div>

      {/* Centered tab navigation */}
      <div className="adm-tabs-bar">
        <div className="adm-tabs-inner">
          <button
            className={`adm-tab ${activeTab === 'recipes' ? 'active' : ''}`}
            onClick={() => setActiveTab('recipes')}
          >
            מתכוני כתיבה
          </button>
          <button
            className={`adm-tab ${activeTab === 'prompts' ? 'active' : ''}`}
            onClick={() => setActiveTab('prompts')}
          >
            סיסטם פרומפט
          </button>
          <button
            className={`adm-tab ${activeTab === 'llm' ? 'active' : ''}`}
            onClick={() => setActiveTab('llm')}
          >
            ספק AI
          </button>
        </div>
      </div>

      {/* Main content — centered */}
      <main className="adm-content">
        <div className="adm-content-header">
          <h2 className="adm-content-title">
            {activeTab === 'recipes' ? 'מתכוני כתיבה'
              : activeTab === 'prompts' ? 'סיסטם פרומפט'
              : 'ספק AI'}
          </h2>
          <p className="adm-content-subtitle">
            {activeTab === 'recipes'
              ? 'הגדר את סוגי המסמכים, הקריטריונים והשיעורים שיוצגו למשתמשים'
              : activeTab === 'prompts'
              ? 'ערוך את ההנחיות שמנחות את ה-AI בכל שלב של הדרכה'
              : 'בחר את מנוע ה-AI וספק את פרטי הגישה — השינוי נכנס לתוקף מיידית'}
          </p>
        </div>

        {activeTab === 'recipes' && <RecipeManager />}
        {activeTab === 'prompts' && <PromptManager />}
        {activeTab === 'llm' && <LLMManager />}
      </main>
    </div>
  );
}
