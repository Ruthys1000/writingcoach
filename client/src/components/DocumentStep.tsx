import { useState } from 'react';

interface Props {
  recipeName: string;
  onSubmit: (text: string) => void;
  onBack: () => void;
}

export function DocumentStep({ recipeName, onSubmit, onBack }: Props) {
  const [text, setText] = useState('');

  return (
    <div className="card">
      <div className="card-title">📄 הדבק את ה{recipeName} שלך</div>
      <p style={{ color: 'var(--gray-600)', marginBottom: 16, fontSize: '.92rem' }}>
        הדבק את הטקסט המלא של המסמך. המאמן יבחן אותו ויזהה את נקודות השיפור.
        <br />
        <strong>שים לב:</strong> הטקסט נשמר רק בזיכרון הזמני של השרת ואינו מועבר לשום גוף חיצוני.
      </p>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={14}
        placeholder={`הדבק כאן את ${recipeName}...`}
      />
      <div className="char-count">{text.length} תווים</div>
      <div className="btn-row">
        <button
          className="btn btn-primary"
          disabled={text.trim().length < 50}
          onClick={() => onSubmit(text.trim())}
        >
          🔍 נתח את המסמך
        </button>
        <button className="btn btn-secondary" onClick={onBack}>
          ← חזור
        </button>
      </div>
      {text.length > 0 && text.trim().length < 50 && (
        <p style={{ marginTop: 10, fontSize: '.82rem', color: 'var(--red)' }}>
          הטקסט קצר מדי. נדרשים לפחות 50 תווים.
        </p>
      )}
    </div>
  );
}
