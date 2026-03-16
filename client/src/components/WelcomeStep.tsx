interface Props {
  onStart: () => void;
}

export function WelcomeStep({ onStart }: Props) {
  return (
    <div className="welcome-page">
      {/* Hero */}
      <div className="welcome-hero">
        <div className="welcome-logo">✍️</div>
        <h1 className="welcome-title">מאמן הכתיבה המנהלית</h1>
        <p className="welcome-subtitle">
          כלי AI שמשפר את כתיבתך הארגונית — מותאם אישית לפי המסמך שלך
        </p>
        <button className="welcome-cta" onClick={onStart}>
          התחל אימון ←
        </button>
      </div>

      {/* 3-step explainer */}
      <div className="welcome-steps">
        <div className="welcome-step-card">
          <div className="welcome-step-icon-wrap">🔍</div>
          <div className="welcome-step-num">שלב 1</div>
          <h3>אבחון</h3>
          <p>המאמן בוחן את המסמך שלך מול מחוון כשירות ומזהה נקודות לשיפור</p>
        </div>
        <div className="welcome-step-card">
          <div className="welcome-step-icon-wrap">📚</div>
          <div className="welcome-step-num">שלב 2</div>
          <h3>למידה</h3>
          <p>שיעורים מותאמים אישית עם דוגמאות לפני/אחרי מתוך הטקסט שלך</p>
        </div>
        <div className="welcome-step-card">
          <div className="welcome-step-icon-wrap">✅</div>
          <div className="welcome-step-num">שלב 3</div>
          <h3>תרגול</h3>
          <p>תכתוב מחדש קטעים מהמסמך שלך ותקבל משוב מיידי מה-AI</p>
        </div>
      </div>

      {/* Supported doc types */}
      <div className="welcome-doc-types">
        <div className="welcome-doc-types-title">סוגי מסמכים נתמכים</div>
        <div className="welcome-doc-type-list">
          <span>📋 סיכום דיון</span>
          <span>📊 עבודת מטה / נייר עמדה</span>
          <span>📨 מכתב רשמי</span>
        </div>
      </div>
    </div>
  );
}
