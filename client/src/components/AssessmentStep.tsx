import { useState } from 'react';
import { api, LearningUnit, PracticeExercise, AssessmentResult } from '../api';

function scoreClass(s: number) { return s >= 80 ? 'high' : s >= 60 ? 'mid' : 'low'; }

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
  const [result, setResult] = useState<AssessmentResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [error, setError] = useState<string | null>(null);

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

  if (!exercise) {
    return (
      <div className="card">
        <div className="card-title">✍️ תרגיל שכתוב — {unit.criterion_question}</div>
        <p style={{ color: 'var(--gray-600)', marginBottom: 20, fontSize: '.92rem' }}>
          המאמן יכין תרגיל מותאם על בסיס המסמך שלך. תרגל את הכישור שלמדת.
        </p>
        {error && <div className="alert alert-error">{error}</div>}
        <div className="btn-row">
          <button className="btn btn-primary" onClick={loadExercise} disabled={loading}>
            {loading ? '⏳ מכין תרגיל...' : '🎯 הכן לי תרגיל'}
          </button>
          <button className="btn btn-secondary" onClick={() => onSkip(unitIndex)}>
            דלג
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-title">✍️ תרגיל שכתוב — {unit.criterion_question}</div>

      <div className="lesson-section">
        <div className="lesson-section-title">📋 הוראות</div>
        <div className="lesson-text">{exercise.instruction}</div>
      </div>

      <div className="lesson-section">
        <div className="lesson-section-title">📝 קטע לשכתוב</div>
        <div className="exercise-excerpt">{exercise.weak_excerpt}</div>
      </div>

      {!result ? (
        <>
          <div className="lesson-section">
            <div className="lesson-section-title">✍️ השכתוב שלך {attempts > 0 ? `(ניסיון ${attempts + 1})` : ''}</div>
            <textarea
              value={rewrite}
              onChange={(e) => setRewrite(e.target.value)}
              rows={6}
              placeholder="כתוב כאן את השכתוב המשופר..."
            />
          </div>
          {error && <div className="alert alert-error">{error}</div>}
          <div className="btn-row">
            <button className="btn btn-primary" onClick={submit} disabled={loading || rewrite.trim().length < 10}>
              {loading ? '⏳ מעריך...' : '📤 שלח לבדיקה'}
            </button>
            <button className="btn btn-secondary" onClick={() => onSkip(unitIndex)}>דלג</button>
          </div>
        </>
      ) : (
        <>
          <div className={`assessment-result ${result.passed ? 'pass' : 'fail'}`}>
            <div className="result-header">
              <span style={{ fontSize: '1.5rem' }}>{result.passed ? '✅' : '🔄'}</span>
              <div>
                <div style={{ fontWeight: 700 }}>
                  {result.passed ? 'כישור אושר!' : 'ממשיכים לתרגל'}
                </div>
                <div className={`result-score ${scoreClass(result.score)}`}>
                  {result.score}/100
                </div>
              </div>
            </div>
            <div className="result-feedback">{result.feedback}</div>
            {result.improvement_tip && (
              <div className="result-tip">💡 {result.improvement_tip}</div>
            )}
          </div>

          <div className="btn-row">
            {result.passed ? (
              <button className="btn btn-success" onClick={() => onDone(unitIndex)}>
                המשך לשיעור הבא →
              </button>
            ) : attempts < 3 ? (
              <>
                <button className="btn btn-primary" onClick={retry}>
                  🔄 נסה שוב
                </button>
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
