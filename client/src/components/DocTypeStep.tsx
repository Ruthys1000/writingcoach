import { RecipeInfo } from '../api';

const ICONS: Record<string, string> = {
  'meeting-summary': '📋',
  'staff-work': '📊',
  'formal-letter': '📨',
};

const ACCENTS: Record<string, string> = {
  'meeting-summary': '#2563eb',
  'staff-work': '#7c3aed',
  'formal-letter': '#059669',
};

const ACCENT_LIGHTS: Record<string, string> = {
  'meeting-summary': '#eff6ff',
  'staff-work': '#f5f3ff',
  'formal-letter': '#ecfdf5',
};

interface Props {
  recipes: RecipeInfo[];
  onSelect: (id: string) => void;
}

export function DocTypeStep({ recipes, onSelect }: Props) {
  return (
    <div className="doctype-page">
      <div className="doctype-header">
        <h2 className="doctype-title">בחר סוג מסמך לאימון</h2>
        <p className="doctype-subtitle">
          המאמן יבחן את המסמך שלך מול מחוון הכשירות המתאים ויציע שיעורים מותאמים אישית
        </p>
      </div>

      <div className="doctype-grid">
        {recipes.map((r) => {
          const accent = ACCENTS[r.id] ?? '#2563eb';
          const accentLight = ACCENT_LIGHTS[r.id] ?? '#eff6ff';
          return (
            <button
              key={r.id}
              className="doctype-card"
              onClick={() => onSelect(r.id)}
              style={{
                '--card-accent': accent,
                '--card-accent-light': accentLight,
              } as React.CSSProperties}
            >
              <div className="doctype-card-icon-wrap">
                <span className="doctype-card-icon">{ICONS[r.id] ?? '📄'}</span>
              </div>
              <div className="doctype-card-body">
                <h3 className="doctype-card-name">{r.name}</h3>
                <p className="doctype-card-desc">{r.description}</p>
              </div>
              <div className="doctype-card-footer">
                <span className="doctype-card-cta">בחר ←</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
