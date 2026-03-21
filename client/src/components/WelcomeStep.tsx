interface Props {
  onStart: () => void;
  onAdminOpen: () => void;
  siteTitle: string;
  siteTagline: string;
}

export function WelcomeStep({ onStart, onAdminOpen, siteTitle, siteTagline }: Props) {
  return (
    <div className="welcome-page">

      {/* Hero — full-width dark banner */}
      <div className="welcome-hero">
        <div className="welcome-hero-inner">
          <div className="welcome-hero-badge">AI לכתיבה מנהלית</div>
          <h1 className="welcome-title">
            {siteTitle}
          </h1>
          <p className="welcome-subtitle">
            העלה מסמך, קבל אבחון מדויק, ולמד לשפר את כתיבתך עם דוגמאות מהטקסט שלך עצמו
          </p>
          <button className="welcome-cta" onClick={onStart}>
            התחל אימון ←
          </button>
        </div>
      </div>

      {/* How it works */}
      <section className="welcome-how-section">
        <div className="welcome-how-inner">
          <div className="welcome-section-label"><span>3 שלבים פשוטים</span></div>
          <h2 className="welcome-how-heading">כיצד זה עובד?</h2>
          <p className="welcome-how-subtitle">
            מעתיקים מסמך, מקבלים פידבק ולומדים לשפר את הכתיבה
          </p>

          <div className="welcome-steps-container">
            {/* Absolute arrows */}
            <div className="welcome-step-arrow welcome-step-arrow-1" aria-hidden="true">←</div>
            <div className="welcome-step-arrow welcome-step-arrow-2" aria-hidden="true">←</div>

            <div className="welcome-step-card">
              <div className="welcome-step-icon-wrap">
                <span className="welcome-step-num">1</span>
              </div>
              <h3 className="welcome-step-title">אבחון</h3>
              <p className="welcome-step-desc">המאמן בוחן את המסמך שלך מול מחוון כשירות ייעודי ומזהה את נקודות השיפור</p>
            </div>

            <div className="welcome-step-card">
              <div className="welcome-step-icon-wrap">
                <span className="welcome-step-num">2</span>
              </div>
              <h3 className="welcome-step-title">למידה</h3>
              <p className="welcome-step-desc">ניסוחים מותאמים אישית עם דוגמה לפני/אחרי מתוך הטקסט</p>
            </div>

            <div className="welcome-step-card">
              <div className="welcome-step-icon-wrap">
                <span className="welcome-step-num">3</span>
              </div>
              <h3 className="welcome-step-title">תרגול</h3>
              <p className="welcome-step-desc">שכתוב קטעים מהמסמך שלך וקבלת משוב מיידי מה-AI</p>
            </div>
          </div>

          {/* Document types */}
          <div className="welcome-doctypes">
            <div className="welcome-doctypes-label">סוגי מסמכים נתמכים:</div>
            <div className="welcome-doctypes-grid">
              <div className="welcome-doc-chip">סיכום דיון</div>
              <div className="welcome-doc-chip">עבודת מטה / נייר עמדה</div>
              <div className="welcome-doc-chip">מכתב רשמי</div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="welcome-footer">
        <div className="welcome-footer-inner">
          <div className="welcome-footer-content">
            <div className="welcome-footer-brand">
              <span className="welcome-footer-name">{siteTitle}</span>
              <span className="welcome-footer-tagline">{siteTagline}</span>
            </div>
            <button className="welcome-footer-admin" onClick={onAdminOpen}>
              ניהול מערכת
            </button>
          </div>
          <div className="welcome-footer-bottom">
            <span>© 2025 כל הזכויות שמורות</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
