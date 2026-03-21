import { DiagnosticReport, Recipe } from '../api';

function scoreClass(score: number) {
  return score >= 75 ? 'high' : score >= 50 ? 'mid' : 'low';
}

function scoreColor(score: number) {
  return score >= 75 ? '#22955A' : score >= 50 ? '#C4841D' : '#D42B31';
}

function insightText(score: number, gaps: { criterion_id: string }[]): string {
  if (score >= 80) return 'המסמך ברמה גבוהה — שיפורים נקודתיים בלבד';
  if (score >= 60) return `זוהו ${gaps.length} תחומים לשיפור — מחכה לך שיעור ממוקד`;
  return `יש עבודה — ${gaps.length} פערים משמעותיים מחכים לשיפור`;
}

/** SVG Score Ring */
function ScoreRing({ score }: { score: number }) {
  const R = 44;
  const C = 2 * Math.PI * R;
  const dash = (score / 100) * C;
  const color = scoreColor(score);

  return (
    <div className="score-ring-wrap">
      <svg
        className="score-ring-svg"
        width="110"
        height="110"
        viewBox="0 0 110 110"
      >
        {/* Track */}
        <circle
          cx="55" cy="55" r={R}
          fill="none"
          stroke="#E8E3D6"
          strokeWidth="10"
        />
        {/* Fill */}
        <circle
          cx="55" cy="55" r={R}
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeDasharray={`${dash} ${C}`}
          strokeDashoffset={C * 0.25}
          strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 1s ease' }}
        />
        {/* Number */}
        <text
          className="score-ring-num"
          x="55" y="52"
          style={{ fontFamily: 'Heebo, Arial, sans-serif', fontSize: '1.85rem', fontWeight: 900, fill: '#0B1D33' }}
        >
          {score}
        </text>
        <text
          className="score-ring-label-text"
          x="55" y="72"
          style={{ fontFamily: 'Heebo, Arial, sans-serif', fontSize: '0.65rem', fill: '#B0A890' }}
        >
          ציון
        </text>
      </svg>
    </div>
  );
}

interface Props {
  report: DiagnosticReport;
  recipe: Recipe;
  onStartLearning: () => void;
  onRestart: () => void;
}

export function DiagnosticStep({ report, recipe, onStartLearning, onRestart }: Props) {
  const { scores, evaluations, gaps } = report;

  const criterionQuestion = (id: string) =>
    recipe.criteria.find((c) => c.id === id)?.question ?? id;

  return (
    <div className="card">
      <div className="card-title">📊 תוצאות אבחון — {report.recipe_name}</div>

      {/* Top: Score Ring + Insight block */}
      <div className="diagnostic-top">
        <ScoreRing score={scores.overall} />

        <div className="diagnostic-insight">
          <div className="diagnostic-insight-label">תובנה</div>
          <div className="diagnostic-insight-text">
            <span className="hl">{scores.overall}/100</span> —{' '}
            {insightText(scores.overall, gaps)}
          </div>
        </div>
      </div>

      {/* Score bars */}
      <div className="score-bars-section">
        <div className="score-bars-title">פירוט לפי רובד</div>
        {[
          { label: 'רובד תשתיתי — שפה וסגנון', s: scores.foundational },
          { label: 'רובד ספציפי — מבנה המסמך',  s: scores.document_specific },
        ].map(({ label, s }) => (
          <div className="score-bar-row" key={label}>
            <div className="score-bar-label">{label}</div>
            <div className="score-bar-track">
              <div
                className={`score-bar-fill ${scoreClass(s.score)}`}
                style={{ width: `${s.score}%` }}
              />
            </div>
            <div className={`score-bar-pct ${scoreClass(s.score)}`}>
              {s.score}%
            </div>
          </div>
        ))}
      </div>

      {/* Criterion checklist */}
      <ul className="criterion-list">
        {evaluations.map((e) => (
          <li key={e.criterion_id} className={`criterion-item ${e.passed ? 'pass' : 'fail'}`}>
            <span className="criterion-icon">{e.passed ? '✓' : '✕'}</span>
            <div className="criterion-body">
              <div className="criterion-question">
                {criterionQuestion(e.criterion_id)}
              </div>
              {!e.passed && (
                <div className="criterion-explanation">{e.explanation}</div>
              )}
              {!e.passed && e.excerpt && (
                <div className="criterion-excerpt">"{e.excerpt}"</div>
              )}
            </div>
          </li>
        ))}
      </ul>

      <div className="btn-row">
        {gaps.length === 0 ? (
          <>
            <p style={{ color: 'var(--success)', fontWeight: 700 }}>
              🎉 מצוין! המסמך עומד בכל הקריטריונים.
            </p>
            <button className="btn btn-secondary" onClick={onRestart}>
              ← ניתוח מסמך חדש
            </button>
          </>
        ) : (
          <>
            <button className="btn btn-primary" onClick={onStartLearning}>
              התחל למידה ותרגול ({Math.min(gaps.length, 3)} שיעורים)
            </button>
            <button className="btn btn-secondary" onClick={onRestart}>
              ← ניתוח מסמך חדש
            </button>
          </>
        )}
      </div>
    </div>
  );
}
