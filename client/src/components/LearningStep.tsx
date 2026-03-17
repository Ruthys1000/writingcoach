import { LearningUnit } from '../api';

interface Props {
  units: LearningUnit[];
  currentIndex: number;
  completedUnits: Set<number>;
  onStartAssessment: (index: number) => void;
  onSkip: (index: number) => void;
}

export function LearningStep({
  units,
  currentIndex,
  completedUnits,
  onStartAssessment,
  onSkip,
}: Props) {
  const unit = units[currentIndex];
  if (!unit) return null;

  const isLast = currentIndex + 1 >= units.length;

  return (
    <div className="card">
      {/* Progress dots */}
      <div className="lesson-header">
        <div className="lesson-progress-row">
          <span className="lesson-progress-label">
            שיעור {currentIndex + 1} מתוך {units.length}
          </span>
          <div className="lesson-dots">
            {units.map((_, i) => (
              <div
                key={i}
                className={`lesson-dot${
                  i === currentIndex ? ' active' : ''
                }${completedUnits.has(i) ? ' done' : ''}`}
              />
            ))}
          </div>
        </div>
        <h2 className="lesson-title">{unit.criterion_question}</h2>
      </div>

      {/* Block 1: Gap summary + Why */}
      <div className="lesson-block-why">
        <div className="lesson-block-label">🔍 הפער שזוהה ולמה זה חשוב</div>
        <div className="lesson-text" style={{ marginBottom: '10px' }}>
          {unit.gap_summary}
        </div>
        <div className="lesson-text" style={{ color: 'var(--ink-700)', fontStyle: 'italic' }}>
          {unit.why_it_matters}
        </div>
      </div>

      {/* Block 2: Formula / Practical tool — dark */}
      <div className="lesson-block-formula">
        <div className="lesson-block-formula-label">🛠️ הכלי הפרקטי</div>
        <div className="lesson-block-formula-text">{unit.practical_tool}</div>
        {unit.formula && (
          <div className="lesson-formula-box">{unit.formula}</div>
        )}
      </div>

      {/* Block 3: Before / After — the heart */}
      <div className="before-after-section">
        <div className="before-after-title">📌 לפני ואחרי — מתוך המסמך שלך</div>
        <div className="before-after-grid">
          <div className="ba-box before">
            <div className="ba-label">✕ לפני</div>
            <div>{unit.before_from_doc}</div>
          </div>
          <div className="ba-arrow">↓</div>
          <div className="ba-box after">
            <div className="ba-label">✓ אחרי</div>
            <div>{unit.after_from_doc}</div>
          </div>
        </div>
      </div>

      <div className="btn-row">
        <button
          className="btn btn-primary"
          onClick={() => onStartAssessment(currentIndex)}
        >
          ✍️ תרגל כישור זה
        </button>
        <button
          className="btn btn-secondary"
          onClick={() => onSkip(currentIndex)}
        >
          {isLast ? 'סיים אימון' : 'דלג לשיעור הבא →'}
        </button>
      </div>
    </div>
  );
}
