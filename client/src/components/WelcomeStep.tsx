interface Props {
  onStart: () => void;
  onAdminOpen: () => void;
  siteTitle: string;
  siteTagline: string;
  footerColor?: string;
  footerText?: string;
  logoDataUrl?: string;
}

export function WelcomeStep({ onStart, onAdminOpen, siteTitle, siteTagline, footerColor, footerText, logoDataUrl }: Props) {
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

      {/* How it works — timeline */}
      <section className="welcome-how-section">
        <div className="welcome-how-inner">
          <div className="welcome-section-label"><span>3 שלבים פשוטים</span></div>
          <h2 className="welcome-how-heading">כיצד זה עובד?</h2>
          <p className="welcome-how-subtitle">
            מעתיקים מסמך, מקבלים פידבק מפורט ולומדים לשפר את הכתיבה
          </p>

          {/* Timeline */}
          <div className="wh-timeline">

            {/* ═══ STEP 1: אבחון ═══ */}
            <div className="wh-step">
              <div className="wh-step-track">
                <div className="wh-step-number">1</div>
                <div className="wh-step-line"></div>
              </div>
              <div className="wh-step-content">
                <div className="wh-step-text">
                  <h3>אבחון</h3>
                  <p>המאמן בוחן את המסמך שלך מול מחוון כשירות ייעודי ומציג ציון כולל עם פירוט לפי רובד</p>
                </div>
                <div className="wh-product-card">
                  {/* Score header */}
                  <div className="wh-score-header">
                    <div className="wh-score-header-right">
                      <div className="wh-score-ring">
                        <svg width="56" height="56" viewBox="0 0 56 56">
                          <circle cx="28" cy="28" r="24" fill="none" stroke="#e2e8f0" strokeWidth="4.5"/>
                          <circle cx="28" cy="28" r="24" fill="none" stroke="#22c55e" strokeWidth="4.5"
                            strokeDasharray="151" strokeDashoffset="33" strokeLinecap="round"/>
                        </svg>
                        <div className="wh-score-value">78</div>
                      </div>
                      <div className="wh-score-meta">
                        <div className="wh-score-label">ציון כולל</div>
                        <div className="wh-score-title">מסמך טוב — 2 פערים</div>
                      </div>
                    </div>
                    <div className="wh-insight-chip">
                      <div className="wh-insight-label">תובנה</div>
                      <div className="wh-insight-value">78/100</div>
                    </div>
                  </div>
                  {/* Progress bars */}
                  <div>
                    <div className="wh-progress-row">
                      <span className="wh-progress-label">שפה וסגנון</span>
                      <div className="wh-progress-track"><div className="wh-progress-fill green" style={{width: '85%'}}></div></div>
                      <span className="wh-progress-pct green">85%</span>
                    </div>
                    <div className="wh-progress-row">
                      <span className="wh-progress-label">מבנה המסמך</span>
                      <div className="wh-progress-track"><div className="wh-progress-fill amber" style={{width: '70%'}}></div></div>
                      <span className="wh-progress-pct amber">70%</span>
                    </div>
                    <div className="wh-progress-row">
                      <span className="wh-progress-label">תוכן ומהות</span>
                      <div className="wh-progress-track"><div className="wh-progress-fill amber" style={{width: '60%'}}></div></div>
                      <span className="wh-progress-pct amber">60%</span>
                    </div>
                  </div>
                  {/* Criteria pills */}
                  <div className="wh-criteria-pills">
                    <span className="wh-pill pass">✓ תקציר מנהלים</span>
                    <span className="wh-pill pass">✓ טון מקצועי</span>
                    <span className="wh-pill fail">✗ ניתוח חלופות</span>
                    <span className="wh-pill fail">✗ שורה תחתונה</span>
                  </div>
                </div>
              </div>
            </div>

            {/* ═══ STEP 2: למידה ═══ */}
            <div className="wh-step">
              <div className="wh-step-track">
                <div className="wh-step-number">2</div>
                <div className="wh-step-line"></div>
              </div>
              <div className="wh-step-content">
                <div className="wh-step-text">
                  <h3>למידה</h3>
                  <p>שיעורים מותאמים אישית עם דוגמאות לפני/אחרי — ישירות מהטקסט שלך</p>
                </div>
                <div className="wh-product-card">
                  {/* Lesson header */}
                  <div className="wh-lesson-header">
                    <span className="wh-lesson-badge">שיעור 1 מתוך 3</span>
                    <span className="wh-lesson-title">טון סמכותי ומקצועי</span>
                  </div>
                  {/* Explanation */}
                  <div className="wh-lesson-explanation">
                    הטון צריך לשדר ביטחון וסמכות — בלי בקשות סליחה, בלי ״ברצוני״ ובלי פתיחות אישיות כמו ״שלום דני״. מסמך מנהלי פותח ישר בעניין.
                  </div>
                  {/* Before / After */}
                  <div className="wh-comparison">
                    <div className="wh-comparison-card before">
                      <div className="wh-comparison-label">
                        <div className="wh-comparison-icon bad">✗</div>
                        <span>מהמסמך שלך</span>
                      </div>
                      <div className="wh-comparison-text">
                        ״שלום דני, ברצוני לעדכן אותך ששמך הועלה לוועדת פרס עובד השנה, בברכה דני״
                      </div>
                    </div>
                    <div className="wh-comparison-card after">
                      <div className="wh-comparison-label">
                        <div className="wh-comparison-icon good">✓</div>
                        <span>ניסוח משופר</span>
                      </div>
                      <div className="wh-comparison-text">
                        ״מצ״ב עדכון: שמך הועלה לוועדת פרס עובד השנה. נא לאשר קבלה.״
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ═══ STEP 3: תרגול ═══ */}
            <div className="wh-step">
              <div className="wh-step-track">
                <div className="wh-step-number">3</div>
              </div>
              <div className="wh-step-content">
                <div className="wh-step-text">
                  <h3>תרגול</h3>
                  <p>שכתוב קטעים מהמסמך שלך וקבלת משוב מיידי מה-AI — עד שזה מושלם</p>
                </div>
                <div className="wh-product-card">
                  {/* Practice header */}
                  <div className="wh-practice-header">
                    <div className="wh-practice-header-right">
                      <span className="wh-practice-badge">תרגיל 1</span>
                      <span className="wh-practice-title">שכתוב פתיחת המסמך</span>
                    </div>
                    <span className="wh-practice-counter">ניסיון 2/5</span>
                  </div>
                  {/* Original text */}
                  <div className="wh-original-text">
                    <div className="wh-ot-label">הטקסט המקורי:</div>
                    <div className="wh-ot-body">״שלום דני, ברצוני לעדכן אותך ששמך הועלה לוועדת פרס עובד השנה״</div>
                  </div>
                  {/* User input */}
                  <div className="wh-text-input">
                    <p>מצ״ב הודעה בנושא ועדת פרס עובד השנה: שמך הועלה כמועמד. נא לאשר קבלה עד ה-15 לחודש.<span className="wh-cursor"></span></p>
                  </div>
                  {/* Actions */}
                  <div className="wh-practice-actions">
                    <button className="wh-btn-primary">שלח לבדיקה ←</button>
                    <button className="wh-btn-secondary">💡 רמז</button>
                  </div>
                </div>
              </div>
            </div>

          </div>{/* /wh-timeline */}

          {/* Bottom CTA */}
          <div className="wh-bottom-cta">
            <button className="welcome-cta" onClick={onStart}>התחל אימון ←</button>
          </div>

        </div>
      </section>

      {/* Footer */}
      <footer className="welcome-footer">
        <div className="welcome-footer-inner">
          <div className="welcome-footer-content">
            {logoDataUrl && (
              <img src={logoDataUrl} alt="לוגו" className="welcome-footer-logo" />
            )}
            <div className="welcome-footer-brand">
              <span className="welcome-footer-name">{siteTitle}</span>
              <span className="welcome-footer-tagline">{siteTagline}</span>
            </div>
            <button className="welcome-footer-admin" onClick={onAdminOpen}>
              ניהול מערכת
            </button>
          </div>
          {footerText && (
            <div className="welcome-footer-bottom">
              <span>{footerText}</span>
            </div>
          )}
        </div>
      </footer>

    </div>
  );
}
