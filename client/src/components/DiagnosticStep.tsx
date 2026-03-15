import { DiagnosticReport, Recipe } from '../api';

function scoreClass(score: number) {
  return score >= 80 ? 'high' : score >= 60 ? 'mid' : 'low';
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
    <>
      <div className="card">
        <div className="card-title">📊 תוצאות אבחון — {report.recipe_name}</div>

        {/* Score overview */}
        <div className="score-overview">
          <div className={`score-circle ${scoreClass(scores.overall)}`}>
            {scores.overall}
          </div>
          <div className="score-bars">
            {[
              { label: 'רובד תשתיתי (שפה)', s: scores.foundational },
              { label: 'רובד ספציפי (מסמך)', s: scores.document_specific },
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
        </div>

        {/* Detail */}
        <ul className="criterion-list">
          {evaluations.map((e) => (
            <li key={e.criterion_id} className={`criterion-item ${e.passed ? 'pass' : 'fail'}`}>
              <span className="criterion-icon">{e.passed ? '✅' : '❌'}</span>
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
              <p style={{ color: 'var(--green)', fontWeight: 600 }}>
                🎉 מצוין! המסמך עומד בכל הקריטריונים.
              </p>
              <button className="btn btn-secondary" onClick={onRestart}>
                ← ניתוח מסמך חדש
              </button>
            </>
          ) : (
            <>
              <button className="btn btn-primary" onClick={onStartLearning}>
                📚 התחל למידה ותרגול ({Math.min(gaps.length, 3)} שיעורים)
              </button>
              <button className="btn btn-secondary" onClick={onRestart}>
                ← ניתוח מסמך חדש
              </button>
            </>
          )}
        </div>
      </div>
    </>
  );
}
