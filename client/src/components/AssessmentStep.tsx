import { useState } from 'react';
import { api, LearningUnit, PracticeExercise, AssessmentResult } from '../api';

function scoreClass(s: number) { return s >= 75 ? 'high' : s >= 50 ? 'mid' : 'low'; }

interface Props {
  sessionId: string;
  unitIndex: number;
  unit: LearningUnit;
  onDone: (unitIndex: number) => void;
  onSkip: (unitIndex: number) => void;
}

export function AssessmentStep({ sessionId, unitIndex, unit, onDone, onSkip }: Props) {
  const [exercise, setExercise] = useState<PracticeExercise | null>(null);
  const [rewrite, setRewrite] = useState('');
  const [result, setResult]   = useState<AssessmentResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [error, setError]     = useState<string | null>(null);

  const loadExercise = async () => {
    setLoading(true);
    try {
      const { exercise: ex } = await api.getExercise(sessionId, unitIndex);
      setExercise(ex);
    } catch (e) { setError(String(e)); }
    finally { setLoading(false); }
  };

  const submit = async () => {
    if (!rewrite.trim() || !exercise) return;
    setLoading(true);
    setError(null);
    try {
      const { result: r } = await api.assess(sessionId, unitIndex, rewrite);
      setResult(r);
      setAttempts((a) => a + 1);
    } catch (e) { setError(String(e)); }
    finally { setLoading(false); }
  };

  const retry = () => { setResult(null); setRewrite(''); };

  /* ---- No exercise yet ---- */
  if (!exercise) {
    return (
      <div className="card">
        <div className="card-title">✍️ תרגיל שכתוב</div>
        <p style={{ color: 'var(--paper-500)', marginBottom: 20, fontSize: '.95rem', lineHeight: 1.7 }}>
          <strong style={{ color: 'var(--ink-900)' }}>{unit.criterion_question}</strong>
          <br />
          המאמן יכין תרגיל מותאם על בסיס המסמך שלך. תרגל את הכישור שלמדת.
        </p>
        {error && <div className="alert alert-error">{error}</div>}
        <div className="btn-row">
          <button className="btn btn-primary" onClick={loadExercise} disabled={loading}>
            {loading ? 'מכין תרגיל...' : 'הכן לי תרגיל'}
          </button>
          <button className="btn btn-secondary" onClick={() => onSkip(unitIndex)}>דלג</button>
        </div>
      </div>
    );
  }

  /* ---- Exercise loaded ---- */
  return (
    <div className="card">
      <div className="card-title">✍️ {unit.criterion_question}</div>

      {/* Instructions */}
      <div className="lesson-block-why" style={{ marginBottom: 'var(--sp-md)' }}>
        <div className="lesson-block-label" style={{ color: 'var(--amber-500)' }}>📋 הוראות</div>
        <div className="lesson-text">{exercise.instruction}</div>
      </div>

      {/* Original excerpt */}
      <div style={{ marginBottom: 'var(--sp-md)' }}>
        <div className="lesson-block-label">📝 קטע לשכתוב</div>
        <div className="exercise-original">{exercise.weak_excerpt}</div>
      </div>

      {/* Writing area or result */}
      {!result ? (
        <>
          <div className="lesson-block-label">
            ✍️ הגרסה שלך{attempts > 0 ? ` (ניסיון ${attempts + 1})` : ''}
          </div>
          <div>
            <div className="studio-header">✍️ סטודיו כתיבה</div>
            <textarea
              className="studio-textarea"
              value={rewrite}
              onChange={(e) => setRewrite(e.target.value)}
              rows={6}
              placeholder="כתוב כאן את השכתוב המשופר..."
            />
          </div>
          {error && <div className="alert alert-error">{error}</div>}
          <div className="btn-row">
            <button
              className="btn btn-primary"
              onClick={submit}
              disabled={loading || rewrite.trim().length < 10}
            >
              {loading ? 'מעריך...' : 'שלח לבדיקה'}
            </button>
            <button className="btn btn-secondary" onClick={() => onSkip(unitIndex)}>דלג</button>
          </div>
        </>
      ) : (
        <>
          <div className={`assessment-feedback ${result.passed ? 'pass' : 'fail'}`}>
            <div className="feedback-score-wrap">
              <div className={`feedback-score-num ${scoreClass(result.score)}`}>
                {result.score}
              </div>
              <div className="feedback-score-sub">/ 100</div>
              <div className="feedback-badge">
                {result.passed
                  ? <span className="chip chip-success">עבר ✓</span>
                  : <span className="chip chip-amber">ממשיכים</span>}
              </div>
            </div>
            <div className="feedback-body">
              <div className="feedback-status">
                {result.passed ? '🎉 כישור אושר!' : '🔄 ממשיכים לתרגל'}
              </div>
              <div className="feedback-text">{result.feedback}</div>
              {result.improvement_tip && (
                <div className="feedback-tip">💡 {result.improvement_tip}</div>
              )}
            </div>
          </div>

          <div className="btn-row">
            {result.passed ? (
              <button className="btn btn-success" onClick={() => onDone(unitIndex)}>
                המשך לשיעור הבא →
              </button>
            ) : attempts < 3 ? (
              <>
                <button className="btn btn-primary" onClick={retry}>נסה שוב</button>
                <button className="btn btn-secondary" onClick={() => onDone(unitIndex)}>
                  המשך בכל זאת →
                </button>
              </>
            ) : (
              <button className="btn btn-secondary" onClick={() => onDone(unitIndex)}>
                המשך לשיעור הבא →
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
