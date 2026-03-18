// ============================================================
// Admin Page — Manage Writing Recipes
// ============================================================

import { useState, useEffect, useRef } from 'react';
import { adminApi, Recipe } from '../api';

// ---- CSV helpers ----

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

// Full RFC-4180 CSV parser (handles quoted fields with embedded newlines/commas)
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
  // Strip BOM if present
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
  const bom = '\uFEFF'; // UTF-8 BOM — Excel opens Hebrew correctly
  const csv = recipeToCSV(recipe);
  const blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${recipe.id || 'recipe'}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

type View = 'list' | 'edit';

// Importance levels map to numeric weights
const IMPORTANCE_MAP: Record<string, number> = {
  high: 0.8,
  medium: 0.5,
  low: 0.2,
};
function weightToImportance(w: number): string {
  if (w >= 0.7) return 'high';
  if (w >= 0.4) return 'medium';
  return 'low';
}

const IMPORTANCE_LABELS: Record<string, string> = {
  high: 'גבוהה',
  medium: 'בינונית',
  low: 'נמוכה',
};

// Auto-generate a unique recipe id using crypto.randomUUID()
function generateRecipeId(): string {
  return `recipe-${crypto.randomUUID()}`;
}

// Auto-generate a criterion id from its index
function criterionId(idx: number): string {
  return `c${idx + 1}`;
}

const EMPTY_RECIPE: Recipe = {
  id: '',
  name: '',
  description: '',
  criteria: [],
};

const EMPTY_CRITERION = () => ({
  id: '',
  question: '',
  weight: 0.5,
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
  // Track which criterion cards are expanded
  const [expandedCriteria, setExpandedCriteria] = useState<Record<number, boolean>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    const newRecipe = JSON.parse(JSON.stringify(EMPTY_RECIPE));
    newRecipe.id = generateRecipeId();
    setEditing(newRecipe);
    setIsNew(true);
    setSaved(false);
    setError(null);
    setExpandedCriteria({});
    setView('edit');
  }

  function openEdit(recipe: Recipe) {
    setEditing(JSON.parse(JSON.stringify(recipe)));
    setIsNew(false);
    setSaved(false);
    setError(null);
    setExpandedCriteria({});
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

    // Client-side validation
    if (!editing.name.trim()) {
      setError('יש למלא שם לסוג המסמך');
      return;
    }
    for (let i = 0; i < editing.criteria.length; i++) {
      if (!editing.criteria[i].question.trim()) {
        setError(`קריטריון #${i + 1} חסר שאלת אבחון`);
        setExpandedCriteria((prev) => ({ ...prev, [i]: true }));
        return;
      }
    }

    // Sync criterion ids before saving
    const withIds: Recipe = {
      ...editing,
      criteria: editing.criteria.map((c, idx) => ({
        ...c,
        id: c.id || criterionId(idx),
      })),
    };

    setLoading(true);
    setError(null);
    try {
      if (isNew) {
        await adminApi.createRecipe(withIds);
      } else {
        await adminApi.updateRecipe(withIds.id, withIds);
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
    const newIdx = editing.criteria.length;
    setEditing({ ...editing, criteria: [...editing.criteria, EMPTY_CRITERION()] });
    // Auto-expand the new criterion
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
        if (!parsed.name || !Array.isArray(parsed.criteria)) {
          throw new Error('הקובץ אינו מתכון תקני');
        }
        parsed.id = generateRecipeId();
        setEditing(parsed);
        setIsNew(true);
        setSaved(false);
        setError(null);
        setExpandedCriteria({});
        setView('edit');
      } catch (err) {
        setError(`שגיאה בקריאת הקובץ: ${String(err)}`);
      }
    };
    reader.readAsText(file, 'utf-8');
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

        {/* ---- LIST VIEW ---- */}
        {view === 'list' && (
          <div className="admin-body">
            <div className="admin-list-toolbar">
              <button className="btn-primary" onClick={openNew}>➕ מתכון חדש</button>
              <button className="btn-secondary" onClick={() => fileInputRef.current?.click()}>
                📂 ייבוא מ-CSV
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,text/csv"
                style={{ display: 'none' }}
                onChange={handleImportFile}
              />
            </div>
            {loading && <div className="admin-loading">טוען...</div>}
            <div className="admin-recipe-list">
              {recipes.map((r) => (
                <div key={r.id} className="admin-recipe-card">
                  <div className="admin-recipe-info">
                    <div className="admin-recipe-name">{r.name}</div>
                    <div className="admin-recipe-desc">{r.description}</div>
                    <div className="admin-recipe-meta">{r.criteria.length} קריטריונים להערכה</div>
                  </div>
                  <div className="admin-recipe-actions">
                    <button className="btn-secondary" onClick={() => openEdit(r)}>✏️ עריכה</button>
                    <button className="btn-secondary" title="הורד כקובץ CSV לעריכה ב-Excel" onClick={() => downloadRecipeCSV(r)}>⬇️ הורד CSV</button>
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

        {/* ---- EDIT VIEW ---- */}
        {view === 'edit' && editing && (
          <div className="admin-body">

            {/* Preview card — how it appears to users */}
            <div className="admin-preview-card">
              <div className="admin-preview-label">תצוגה מקדימה — כך ייראה בדף הבחירה של המשתמש:</div>
              <div className="admin-preview-doctype">
                <div className="admin-preview-doctype-name">{editing.name || 'שם סוג המסמך'}</div>
                <div className="admin-preview-doctype-desc">{editing.description || 'תיאור המסמך ייופיע כאן'}</div>
                <div className="admin-preview-doctype-count">
                  {editing.criteria.length > 0
                    ? `${editing.criteria.length} קריטריונים להערכה`
                    : 'טרם הוגדרו קריטריונים'}
                </div>
              </div>
            </div>

            {/* Recipe meta */}
            <div className="admin-section">
              <h3 className="admin-section-title">פרטי המסמך</h3>

              <label className="admin-label">
                שם סוג המסמך
                <input
                  className="admin-input"
                  value={editing.name}
                  placeholder="לדוגמה: סיכום ישיבה, דוח שבועי, הצעת מחיר"
                  onChange={(e) => updateField('name', e.target.value)}
                  autoFocus
                />
                <span className="admin-hint">השם שיופיע למשתמש בדף הבחירה</span>
              </label>

              <label className="admin-label" style={{ marginTop: '0.75rem' }}>
                תיאור קצר
                <textarea
                  className="admin-textarea"
                  rows={2}
                  value={editing.description}
                  placeholder="לדוגמה: מסמך שמסכם דיון — כולל החלטות, משימות ואחראים"
                  onChange={(e) => updateField('description', e.target.value)}
                />
                <span className="admin-hint">משפט או שניים על מטרת המסמך ומה הוא אמור לכלול</span>
              </label>
            </div>

            {/* Criteria */}
            <div className="admin-section">
              <div className="admin-section-header">
                <div>
                  <h3 className="admin-section-title">קריטריונים להערכה ({editing.criteria.length})</h3>
                  <p className="admin-section-subtitle">
                    כל קריטריון הוא שאלה כן/לא שה-AI ישאל על המסמך. לכל קריטריון מצורף מיקרו-שיעור שיוצג למשתמש אם הוא נכשל.
                  </p>
                </div>
                <button className="btn-secondary" onClick={addCriterion}>➕ הוסף קריטריון</button>
              </div>

              {editing.criteria.map((c, idx) => {
                const isExpanded = !!expandedCriteria[idx];
                const previewTitle = c.question || `קריטריון #${idx + 1}`;
                return (
                  <div key={idx} className="admin-criterion-card">
                    {/* Criterion header — always visible */}
                    <div
                      className="admin-criterion-header admin-criterion-header-clickable"
                      onClick={() => toggleCriterion(idx)}
                    >
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

                    {/* Criterion body — collapsible */}
                    {isExpanded && (
                      <div className="admin-criterion-body">
                        {/* Question */}
                        <label className="admin-label">
                          שאלת האבחון
                          <textarea
                            className="admin-textarea"
                            rows={2}
                            value={c.question}
                            placeholder="לדוגמה: האם המסמך פותח בשורת תקציר שמסכמת את הנקודה העיקרית?"
                            onChange={(e) => updateCriterion(idx, 'question', e.target.value)}
                          />
                          <span className="admin-hint">שאלת כן/לא שה-AI יבדוק על המסמך. כתוב "האם..." בצורה ברורה וחד-משמעית.</span>
                        </label>

                        {/* Importance + Layer side by side */}
                        <div className="admin-form-grid" style={{ marginTop: '0.75rem' }}>
                          <label className="admin-label">
                            חשיבות הקריטריון
                            <div className="admin-radio-group">
                              {(['low', 'medium', 'high'] as const).map((level) => (
                                <label key={level} className="admin-radio-option">
                                  <input
                                    type="radio"
                                    name={`importance-${idx}`}
                                    checked={weightToImportance(c.weight) === level}
                                    onChange={() => updateCriterion(idx, 'weight', IMPORTANCE_MAP[level])}
                                  />
                                  {IMPORTANCE_LABELS[level]}
                                </label>
                              ))}
                            </div>
                            <span className="admin-hint">כמה משקל לתת לקריטריון זה בציון הכולל</span>
                          </label>

                          <label className="admin-label">
                            סוג הקריטריון
                            <div className="admin-radio-group admin-radio-group-column">
                              <label className="admin-radio-option">
                                <input
                                  type="radio"
                                  name={`layer-${idx}`}
                                  checked={c.layer === 'foundational'}
                                  onChange={() => updateCriterion(idx, 'layer', 'foundational')}
                                />
                                <div>
                                  <strong>תשתיתי</strong>
                                  <div className="admin-radio-desc">רלוונטי לכל סוגי המסמכים (כתיבה ברורה, שפה פורמלית וכד')</div>
                                </div>
                              </label>
                              <label className="admin-radio-option">
                                <input
                                  type="radio"
                                  name={`layer-${idx}`}
                                  checked={c.layer === 'document_specific'}
                                  onChange={() => updateCriterion(idx, 'layer', 'document_specific')}
                                />
                                <div>
                                  <strong>ייחודי למסמך</strong>
                                  <div className="admin-radio-desc">ספציפי לסוג מסמך זה בלבד (מבנה, רכיבים נדרשים וכד')</div>
                                </div>
                              </label>
                            </div>
                          </label>
                        </div>

                        {/* Micro-lesson */}
                        <div className="admin-micro-lesson">
                          <div className="admin-micro-title">
                            מיקרו-שיעור
                            <span className="admin-micro-subtitle"> — יוצג למשתמש כשהוא נכשל בקריטריון זה</span>
                          </div>

                          <label className="admin-label">
                            למה זה חשוב?
                            <textarea
                              className="admin-textarea"
                              rows={2}
                              value={c.micro_lesson.why}
                              placeholder="לדוגמה: קוראים בכירים מחפשים מיד את הנקודה העיקרית. פתיחה ממוקדת חוסכת זמן ומגבירה את הסיכוי שהמסר יקרא."
                              onChange={(e) => updateCriterion(idx, 'micro_lesson.why', e.target.value)}
                            />
                            <span className="admin-hint">הסבר קצר שיניע את המשתמש להבין מדוע הנושא משנה</span>
                          </label>

                          <label className="admin-label">
                            הכלי / הטכניקה
                            <textarea
                              className="admin-textarea"
                              rows={2}
                              value={c.micro_lesson.tool}
                              placeholder="לדוגמה: כתוב תחילה משפט אחד שמסכם את המסקנה הראשית, ורק אחריו פרט."
                              onChange={(e) => updateCriterion(idx, 'micro_lesson.tool', e.target.value)}
                            />
                            <span className="admin-hint">הנחיה מעשית קצרה שהמשתמש יכול ליישם מיד</span>
                          </label>

                          <label className="admin-label">
                            נוסחה או תבנית (אופציונלי)
                            <textarea
                              className="admin-textarea"
                              rows={1}
                              value={c.micro_lesson.formula ?? ''}
                              placeholder='לדוגמה: "[נושא] + [מסקנה] + [פעולה נדרשת]"'
                              onChange={(e) => updateCriterion(idx, 'micro_lesson.formula', e.target.value)}
                            />
                            <span className="admin-hint">אם יש תבנית ספציפית שכדאי לעקוב אחריה</span>
                          </label>

                          <div className="admin-form-grid">
                            <label className="admin-label">
                              דוגמת "לפני" — כתיבה בעייתית
                              <textarea
                                className="admin-textarea"
                                rows={3}
                                value={c.micro_lesson.before_example}
                                placeholder="קטע לדוגמה שמדגים את הבעיה"
                                onChange={(e) => updateCriterion(idx, 'micro_lesson.before_example', e.target.value)}
                              />
                            </label>
                            <label className="admin-label">
                              דוגמת "אחרי" — כתיבה משופרת
                              <textarea
                                className="admin-textarea"
                                rows={3}
                                value={c.micro_lesson.after_example}
                                placeholder="אותו קטע לאחר תיקון"
                                onChange={(e) => updateCriterion(idx, 'micro_lesson.after_example', e.target.value)}
                              />
                            </label>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {editing.criteria.length === 0 && (
                <div className="admin-empty">
                  לחץ על "הוסף קריטריון" כדי להגדיר את הדברים שה-AI יבדוק במסמך
                </div>
              )}
            </div>

            <div className="admin-save-bar">
              <button className="btn-secondary" onClick={() => setView('list')}>ביטול</button>
              <button
                className="btn-secondary"
                title="הורד את המתכון הנוכחי כקובץ CSV לעריכה ב-Excel"
                onClick={() => downloadRecipeCSV(editing)}
              >
                ⬇️ הורד CSV
              </button>
              {error && <span className="admin-save-error">❌ {error}</span>}
              {saved && <span className="admin-save-success">✅ נשמר בהצלחה!</span>}
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
