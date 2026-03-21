import { RecipeInfo } from '../api';

interface Props {
  recipes: RecipeInfo[];
  onSelect: (id: string) => void;
}

export function DocTypeStep({ recipes, onSelect }: Props) {
  return (
    <div className="doctype-page">
      <div className="doctype-header">
        <h2 className="doctype-title">על איזה מסמך נתאמן היום?</h2>
        <p className="doctype-subtitle">בחר סוג — המאמן יתאים את האבחון והשיעורים לפי הכללים של אותו מסמך</p>
      </div>

      {recipes.length === 0 && (
        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--paper-500)', fontSize: '.95rem' }}>
          טוען סוגי מסמכים...
        </div>
      )}

      <div className="doctype-list">
        {recipes.map((r) => (
          <div key={r.id} className="doctype-card">
            <div className="doctype-card-main">
              <h3 className="doctype-card-name">{r.name}</h3>
              <p className="doctype-card-desc">{r.description}</p>
              <div className="doctype-card-footer">
                <span className="doctype-card-badge">✓ {r.criteria_count} קריטריונים</span>
              </div>
            </div>
            <div className="doctype-card-actions">
              <button className="doctype-select-btn" onClick={() => onSelect(r.id)}>
                בחר ←
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
