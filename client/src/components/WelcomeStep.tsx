interface Props {
  onStart: () => void;
}

export function WelcomeStep({ onStart }: Props) {
  return (
    <div className="welcome-page">
      {/* Hero */}
      <div className="welcome-hero">
        <h1 className="welcome-title">מאמן הכתיבה המנהלית</h1>
        <p className="welcome-subtitle">
          כלי AI שמשפר את כתיבתך הארגונית — מותאם אישית לפי המסמך שלך
        </p>
        <button className="welcome-cta" onClick={onStart}>
          התחל אימון ←
        </button>
      </div>

      {/* How it works – clean horizontal flow, no card boxes */}
      <div className="welcome-how">
        <div className="welcome-how-step">
          <div className="welcome-how-badge">1</div>
          <div className="welcome-how-label">אבחון</div>
          <p className="welcome-how-text">המאמן בוחן את המסמך שלך מול מחוון כשירות ומזהה נקודות לשיפור</p>
        </div>
        <div className="welcome-how-sep" aria-hidden="true" />
        <div className="welcome-how-step">
          <div className="welcome-how-badge">2</div>
          <div className="welcome-how-label">למידה</div>
          <p className="welcome-how-text">שיעורים מותאמים אישית עם דוגמאות לפני/אחרי מתוך הטקסט שלך</p>
        </div>
        <div className="welcome-how-sep" aria-hidden="true" />
        <div className="welcome-how-step">
          <div className="welcome-how-badge">3</div>
          <div className="welcome-how-label">תרגול</div>
          <p className="welcome-how-text">תכתוב מחדש קטעים מהמסמך שלך ותקבל משוב מיידי מה-AI</p>
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
