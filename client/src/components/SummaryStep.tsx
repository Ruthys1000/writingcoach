import { DiagnosticReport } from '../api';

function scoreClass(s: number) { return s >= 80 ? 'high' : s >= 60 ? 'mid' : 'low'; }

interface Props {
  report: DiagnosticReport;
  totalUnits: number;
  completedUnits: number;
  onRestart: () => void;
}

export function SummaryStep({ report, totalUnits, completedUnits, onRestart }: Props) {
  return (
    <div className="card">
      <div className="card-title">🎓 סיכום אימון</div>

      <div className="summary-grid" style={{ marginBottom: 24 }}>
        <div className="summary-stat">
          <div className={`summary-stat-value ${scoreClass(report.scores.overall)}`}>
            {report.scores.overall}
          </div>
          <div className="summary-stat-label">ציון אבחון</div>
        </div>
        <div className="summary-stat">
          <div className="summary-stat-value">{completedUnits}</div>
          <div className="summary-stat-label">שיעורים שהושלמו</div>
        </div>
        <div className="summary-stat">
          <div className="summary-stat-value">{totalUnits - completedUnits}</div>
          <div className="summary-stat-label">שיעורים שדולגו</div>
        </div>
      </div>

      <div style={{
        background: 'var(--blue-lt)',
        padding: '16px 20px',
        borderRadius: 10,
        fontSize: '.92rem',
        lineHeight: 1.7,
        marginBottom: 20,
        color: 'var(--gray-800)',
      }}>
        <strong>הצעד הבא:</strong> חזור למסמך שלך ויישם את הכלים שלמדת.
        לאחר מכן — הגש את המסמך המשוכתב לאבחון חדש ובדוק כמה הציון עלה.
        <br />
        <span style={{ fontSize: '.85rem', color: 'var(--gray-600)' }}>
          שיפור מתמשך מגיע מחזרה — גם 2-3 ניסיונות יראו שינוי משמעותי בכישורי הכתיבה.
        </span>
      </div>

      <div className="btn-row">
        <button className="btn btn-primary" onClick={onRestart}>
          ← נתח מסמך חדש
        </button>
      </div>
    </div>
  );
}
