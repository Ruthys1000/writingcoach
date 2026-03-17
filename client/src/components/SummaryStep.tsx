import { DiagnosticReport } from '../api';

function scoreClass(s: number) { return s >= 75 ? 'high' : s >= 50 ? 'mid' : 'low'; }

// Simple confetti pieces (pure CSS animation)
const CONFETTI_COLORS = [
  '#C4841D', '#E4B04A', '#22955A', '#2D5DA3', '#D42B31', '#FAE8B8',
];
const confettiPieces = Array.from({ length: 18 }, (_, i) => ({
  id: i,
  color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
  left: `${5 + (i * 5.5) % 90}%`,
  delay: `${(i * 0.08).toFixed(2)}s`,
  duration: `${1.2 + (i % 4) * 0.2}s`,
  rotate: `${(i * 37) % 360}deg`,
}));

interface Props {
  report: DiagnosticReport;
  totalUnits: number;
  completedUnits: number;
  onRestart: () => void;
}

export function SummaryStep({ report, totalUnits, completedUnits, onRestart }: Props) {
  const skipped = totalUnits - completedUnits;

  return (
    <div className="card">
      {/* Celebration header */}
      <div className="summary-celebration">
        {/* Confetti */}
        <div className="confetti-wrap" aria-hidden="true">
          {confettiPieces.map((p) => (
            <div
              key={p.id}
              className="confetti-piece"
              style={{
                left: p.left,
                top: '10%',
                background: p.color,
                animationDelay: p.delay,
                animationDuration: p.duration,
                transform: `rotate(${p.rotate})`,
              }}
            />
          ))}
        </div>

        <span className="summary-trophy">🏆</span>
        <h2 className="summary-title">סיימת את האימון!</h2>
        <p className="summary-subtitle">
          עשית צעד משמעותי לשיפור כישורי הכתיבה המנהלית שלך
        </p>
      </div>

      {/* Stats */}
      <div className="summary-stats">
        <div className="summary-stat">
          <div className={`summary-stat-value ${scoreClass(report.scores.overall)}`}>
            {report.scores.overall}
          </div>
          <div className="summary-stat-label">ציון אבחון</div>
        </div>
        <div className="summary-stat">
          <div className="summary-stat-value" style={{ color: 'var(--success)' }}>
            {completedUnits}
          </div>
          <div className="summary-stat-label">שיעורים שהושלמו</div>
        </div>
        <div className="summary-stat">
          <div className="summary-stat-value" style={{ color: skipped > 0 ? 'var(--paper-500)' : 'var(--success)' }}>
            {skipped}
          </div>
          <div className="summary-stat-label">שיעורים שדולגו</div>
        </div>
      </div>

      {/* Next step */}
      <div className="summary-next">
        <strong>הצעד הבא:</strong> חזור למסמך שלך ויישם את הכלים שלמדת.
        לאחר מכן — הגש את המסמך המשוכתב לאבחון חדש ובדוק כמה הציון עלה.
        <br />
        <span style={{ fontSize: '.88rem', color: 'var(--ink-700)', display: 'block', marginTop: 8 }}>
          שיפור מתמשך מגיע מחזרה — גם 2–3 ניסיונות יראו שינוי משמעותי בכישורי הכתיבה.
        </span>
      </div>

      <div className="btn-row">
        <button className="btn btn-amber" onClick={onRestart}>
          ← אימון נוסף
        </button>
      </div>
    </div>
  );
}
