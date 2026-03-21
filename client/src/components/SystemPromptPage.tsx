// ============================================================
// System Prompt Page — Edit LLM system prompts
// ============================================================

import { useState, useEffect } from 'react';
import { systemPromptApi, SystemPrompts } from '../api';

interface Props {
  onClose: () => void;
}

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

export function SystemPromptPage({ onClose }: Props) {
  const [prompts, setPrompts] = useState<SystemPrompts>({
    diagnostic: '',
    learning: '',
    assessment: '',
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    loadPrompts();
  }, []);

  async function loadPrompts() {
    setLoading(true);
    setError(null);
    try {
      const data = await systemPromptApi.getAll();
      setPrompts(data);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const updated = await systemPromptApi.updateAll(prompts);
      setPrompts(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e) {
      setError(String(e));
    } finally {
      setSaving(false);
    }
  }

  function handleChange(key: keyof SystemPrompts, value: string) {
    setPrompts((p) => ({ ...p, [key]: value }));
    setSaved(false);
  }

  return (
    <div className="admin-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="admin-panel" style={{ maxWidth: 800 }}>
        {/* Header */}
        <div className="admin-header">
          <h2 className="admin-title">✏️ עריכת סיסטם פרומפט</h2>
          <button className="btn-ghost" onClick={onClose}>סגור</button>
        </div>

        {error && <div className="alert alert-error">❌ {error}</div>}

        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <div className="spinner" style={{ margin: '0 auto' }} />
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {(Object.keys(PROMPT_LABELS) as (keyof SystemPrompts)[]).map((key) => (
              <div key={key} className="card" style={{ padding: '1.25rem' }}>
                <div style={{ marginBottom: '0.5rem' }}>
                  <strong>{PROMPT_LABELS[key]}</strong>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                    {PROMPT_DESCRIPTIONS[key]}
                  </div>
                </div>
                <textarea
                  value={prompts[key]}
                  onChange={(e) => handleChange(key, e.target.value)}
                  rows={6}
                  style={{
                    width: '100%',
                    fontFamily: 'monospace',
                    fontSize: '0.85rem',
                    resize: 'vertical',
                    padding: '0.6rem',
                    border: '1px solid var(--border)',
                    borderRadius: '6px',
                    background: 'var(--surface)',
                    color: 'var(--text)',
                    direction: 'rtl',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            ))}

            {/* Actions */}
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', alignItems: 'center' }}>
              {saved && <span style={{ color: 'var(--success)', fontSize: '0.9rem' }}>✓ נשמר בהצלחה</span>}
              <button className="btn-secondary" onClick={onClose}>ביטול</button>
              <button className="btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? '...' : '💾 שמור'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
