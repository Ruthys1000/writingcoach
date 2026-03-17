interface Props {
  onStart: () => void;
  onAdminOpen: () => void;
}

export function WelcomeStep({ onStart, onAdminOpen }: Props) {
  return (
    <div className="welcome-page">
      {/* Hero */}
      <div className="welcome-hero">
        <div className="welcome-hero-badge">AI לכתיבה מנהלית</div>
        <h1 className="welcome-title">מאמן הכתיבה המנהלית</h1>
        <p className="welcome-subtitle">
          העלה מסמך, קבל אבחון מדויק, ולמד לשפר את כתיבתך עם דוגמאות מהטקסט שלך עצמו
        </p>
        <button className="welcome-cta" onClick={onStart}>
          התחל אימון ←
        </button>
      </div>

      {/* How it works — clearly informational, NOT clickable */}
      <div className="welcome-how-section">
        <div className="welcome-how-heading">כיצד זה עובד?</div>
        <div className="welcome-how-flow">
          <div className="welcome-flow-step">
            <div className="welcome-flow-icon-wrap">
              <span className="welcome-flow-icon">🔍</span>
              <span className="welcome-flow-num">1</span>
            </div>
            <div className="welcome-flow-body">
              <div className="welcome-flow-label">אבחון</div>
              <p className="welcome-flow-text">
                המאמן בוחן את המסמך מול מחוון כשירות ייעודי ומזהה את נקודות השיפור
              </p>
            </div>
          </div>

          <div className="welcome-flow-arrow" aria-hidden="true">←</div>

          <div className="welcome-flow-step">
            <div className="welcome-flow-icon-wrap">
              <span className="welcome-flow-icon">📖</span>
              <span className="welcome-flow-num">2</span>
            </div>
            <div className="welcome-flow-body">
              <div className="welcome-flow-label">למידה</div>
              <p className="welcome-flow-text">
                שיעורים מותאמים אישית עם דוגמאות לפני/אחרי מתוך הטקסט שלך
              </p>
            </div>
          </div>

          <div className="welcome-flow-arrow" aria-hidden="true">←</div>

          <div className="welcome-flow-step">
            <div className="welcome-flow-icon-wrap">
              <span className="welcome-flow-icon">✍️</span>
              <span className="welcome-flow-num">3</span>
            </div>
            <div className="welcome-flow-body">
              <div className="welcome-flow-label">תרגול</div>
              <p className="welcome-flow-text">
                שכתוב קטעים מהמסמך שלך וקבלת משוב מיידי מה-AI
              </p>
            </div>
          </div>
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

      {/* Subtle admin link */}
      <div className="welcome-admin-area">
        <button className="welcome-admin-link" onClick={onAdminOpen}>
          ⚙️ ניהול מערכת
        </button>
      </div>
    </div>
  );
}
