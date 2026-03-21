import { RecipeInfo } from '../api';

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
        {recipes.length === 0 && (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--paper-500)', fontSize: '.95rem' }}>
            טוען סוגי מסמכים...
          </div>
        )}
        {recipes.map((r, i) => (
          <button
            key={r.id}
            className="doctype-card"
            onClick={() => onSelect(r.id)}
          >
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
