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

  return (
    <div className="card">
      {/* Lesson nav dots */}
      <div className="lesson-nav">
        <span style={{ fontSize: '.85rem', color: 'var(--gray-400)' }}>
          שיעור {currentIndex + 1} מתוך {units.length}
        </span>
        <div style={{ display: 'flex', gap: 8 }}>
          {units.map((_, i) => (
            <div
              key={i}
              className={`lesson-nav-dot ${i === currentIndex ? 'active' : ''}`}
              style={completedUnits.has(i) ? { background: 'var(--green)' } : {}}
            />
          ))}
        </div>
      </div>

      <div className="card-title">📚 {unit.criterion_question}</div>

      <div className="lesson-section">
        <div className="lesson-section-title">🔍 הפער שזוהה</div>
        <div className="lesson-text">{unit.gap_summary}</div>
      </div>

      <div className="lesson-section">
        <div className="lesson-section-title">💡 למה זה חשוב?</div>
        <div className="lesson-text">{unit.why_it_matters}</div>
      </div>

      <div className="lesson-section">
        <div className="lesson-section-title">🛠️ הכלי הפרקטי</div>
        <div className="lesson-text">{unit.practical_tool}</div>
        {unit.formula && (
          <div className="formula-box">{unit.formula}</div>
        )}
      </div>

      <div className="before-after">
        <div className="ba-box before">
          <div className="ba-label">✗ לפני</div>
          <div>{unit.before_from_doc}</div>
        </div>
        <div className="ba-box after">
          <div className="ba-label">✓ אחרי</div>
          <div>{unit.after_from_doc}</div>
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
          {currentIndex + 1 < units.length ? 'דלג לשיעור הבא →' : 'סיים אימון'}
        </button>
      </div>
    </div>
  );
}
