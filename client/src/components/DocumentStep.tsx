import { useState } from 'react';

const MIN_CHARS = 50;
const MAX_CHARS = 50_000;
const TARGET_CHARS = 300;

interface Props {
  recipeName: string;
  onSubmit: (text: string) => void;
  onBack: () => void;
}

export function DocumentStep({ recipeName, onSubmit, onBack }: Props) {
  const [text, setText] = useState('');

  const len      = text.length;
  const tooLong  = len > MAX_CHARS;
  const filled   = Math.min(len / TARGET_CHARS, 1);
  const ready    = text.trim().length >= MIN_CHARS && !tooLong;

  return (
    <div className="card">
      {/* Chip showing selected type */}
      <div className="doc-input-chip">
        <span className="chip chip-dark">📄 {recipeName}</span>
      </div>

      <div className="card-title">הדבק את המסמך שלך</div>

      {/* Dark hint box */}
      <div className="doc-hint-box">
        <strong>מה להדביק:</strong> הטקסט המלא של ה{recipeName} — כולל כותרת, גוף המסמך וסיכום.
        <br />
        הטקסט נשמר <strong>רק</strong> בזיכרון הזמני של השרת ואינו מועבר לשום גוף חיצוני.
      </div>

      <div className="doc-textarea-wrap">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={14}
          placeholder={`הדבק כאן את ${recipeName}...`}
        />
      </div>

      {/* Progress bar */}
      <div className="doc-progress-bar">
        <div
          className={`doc-progress-fill${ready ? ' complete' : ''}`}
          style={{ width: `${filled * 100}%` }}
        />
      </div>
      <div className="doc-status-bar">
        <span className={`doc-status-msg${ready ? ' ready' : ''}${tooLong ? ' error' : ''}`}>
          {len === 0
            ? 'הדבק טקסט להתחלה'
            : tooLong
            ? `המסמך ארוך מדי — מקסימום ${MAX_CHARS.toLocaleString()} תווים`
            : !ready
            ? `עוד ${MIN_CHARS - text.trim().length} תווים נדרשים`
            : '✓ המסמך מוכן לניתוח'}
        </span>
        <span className="char-count">{len} תווים</span>
      </div>

      <div className="btn-row">
        <button
          className="btn btn-primary"
          disabled={!ready}
          onClick={() => onSubmit(text.trim())}
        >
          🔍 נתח את המסמך
        </button>
        <button className="btn btn-secondary" onClick={onBack}>
          ← חזור
        </button>
      </div>
    </div>
  );
}
