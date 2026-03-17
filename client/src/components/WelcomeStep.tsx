interface Props {
  onStart: () => void;
  onAdminOpen: () => void;
}

export function WelcomeStep({ onStart, onAdminOpen }: Props) {
  return (
    <div className="welcome-page">
      {/* Hero — dark Ink with Amber accent */}
      <div className="welcome-hero">
        <div className="welcome-hero-badge">AI לכתיבה מנהלית</div>
        <h1 className="welcome-title">
          מאמן הכתיבה <span className="accent">המנהלית</span>
        </h1>
        <p className="welcome-subtitle">
          העלה מסמך, קבל אבחון מדויק, ולמד לשפר את כתיבתך עם דוגמאות מהטקסט שלך עצמו
        </p>
        <button className="welcome-cta" onClick={onStart}>
          התחל אימון ←
        </button>
      </div>

      {/* How it works */}
      <div className="welcome-how-section">
        <div className="welcome-how-heading">כיצד זה עובד?</div>
        <p className="welcome-how-subtitle">
          תהליך מובנה שמאבחן את הכתיבה שלך, מלמד אותך לשפר, ונותן לך לתרגל
          – הכל על בסיס הטקסט שלך
        </p>
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

        <div className="welcome-how-divider" />
        <div className="welcome-how-doctypes">
          <span className="welcome-how-doctypes-label">סוגי מסמכים נתמכים:</span>
          <div className="welcome-doc-type-list">
            <span>📋 סיכום דיון</span>
            <span>📊 עבודת מטה / נייר עמדה</span>
            <span>📨 מכתב רשמי</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="welcome-footer">
        <div className="welcome-footer-content">
          <div className="welcome-footer-brand">
            <span className="welcome-footer-name">מאמן הכתיבה המנהלית</span>
            <span className="welcome-footer-tagline">AI לשיפור כתיבה מנהלית מקצועית</span>
          </div>
          <button className="welcome-footer-admin" onClick={onAdminOpen}>
            ⚙️ ניהול מערכת
          </button>
        </div>
        <div className="welcome-footer-bottom">
          <span>© 2025 כל הזכויות שמורות</span>
        </div>
      </footer>
    </div>
  );
}
