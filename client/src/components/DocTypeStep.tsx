import { RecipeInfo } from '../api';

const ICONS: Record<string, string> = {
  'meeting-summary': '📋',
  'staff-work': '📊',
  'formal-letter': '📨',
};

interface Props {
  recipes: RecipeInfo[];
  onSelect: (id: string) => void;
}

export function DocTypeStep({ recipes, onSelect }: Props) {
  return (
    <div className="card">
      <div className="card-title">📁 בחר סוג מסמך לאימון</div>
      <p style={{ color: 'var(--gray-600)', marginBottom: 20, fontSize: '.92rem' }}>
        המאמן יבחן את המסמך שלך מול מחוון הכשירות המתאים ויציע שיעורים מותאמים אישית.
      </p>
      <div className="doc-type-grid">
        {recipes.map((r) => (
          <button
            key={r.id}
            className="doc-type-card"
            onClick={() => onSelect(r.id)}
          >
            <h3>{ICONS[r.id] ?? '📄'} {r.name}</h3>
            <p>{r.description}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
