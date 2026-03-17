import { RecipeInfo } from '../api';

// Default icon for unknown recipe IDs
const ICONS: Record<string, string> = {
  'meeting-summary': '📋',
  'staff-work':      '📊',
  'formal-letter':   '📨',
};

// Fallback icons for future recipes (cycling)
const FALLBACK_ICONS = ['📄', '📝', '🗂️', '📃', '📑', '🖊️'];

function getIcon(id: string, index: number): string {
  return ICONS[id] ?? FALLBACK_ICONS[index % FALLBACK_ICONS.length];
}

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

      <div className="doctype-list">
        {recipes.map((r, i) => (
          <button
            key={r.id}
            className="doctype-card"
            onClick={() => onSelect(r.id)}
          >
            <div className="doctype-card-icon-wrap">
              <span>{getIcon(r.id, i)}</span>
            </div>
            <div className="doctype-card-body">
              <h3 className="doctype-card-name">{r.name}</h3>
              <p className="doctype-card-desc">{r.description}</p>
            </div>
            <span className="doctype-card-arrow">←</span>
          </button>
        ))}
      </div>
    </div>
  );
}
