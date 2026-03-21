import { useState, useEffect } from 'react';
import { api, settingsApi, RecipeInfo, DiagnosticReport, Recipe, LearningUnit } from './api';
import { StepIndicator } from './components/StepIndicator';
import { DocTypeStep } from './components/DocTypeStep';
import { DocumentStep } from './components/DocumentStep';
import { DiagnosticStep } from './components/DiagnosticStep';
import { LearningStep } from './components/LearningStep';
import { AssessmentStep } from './components/AssessmentStep';
import { SummaryStep } from './components/SummaryStep';
import { WelcomeStep } from './components/WelcomeStep';
import { AdminDashboard } from './components/AdminDashboard';

export type AppStep =
  | 'welcome'
  | 'select-type'
  | 'input-doc'
  | 'diagnostic'
  | 'learning'
  | 'assessment'
  | 'summary'
  | 'admin';

export interface AppState {
  recipes: RecipeInfo[];
  selectedRecipeId: string | null;
  documentText: string;
  sessionId: string | null;
  report: DiagnosticReport | null;
  recipe: Recipe | null;
  learningUnits: LearningUnit[];
  currentUnitIndex: number;
  completedUnits: Set<number>;
}

const ADMIN_PASSWORD = '1234';
const ADMIN_SESSION_KEY = 'adminUnlocked';

export default function App() {
  const [step, setStep] = useState<AppStep>('welcome');
  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [siteTitle, setSiteTitle] = useState('מאמן כתיבה מנהלית');
  const [siteTagline, setSiteTagline] = useState('AI לשיפור כתיבה מנהלית מקצועית');
  const [footerColor, setFooterColor] = useState('#0f172a');
  const [footerText, setFooterText] = useState('');
  const [logoDataUrl, setLogoDataUrl] = useState('');
  const [heroBadge, setHeroBadge] = useState('AI לכתיבה מנהלית');
  const [heroSubtitle, setHeroSubtitle] = useState('העלה מסמך, קבל אבחון מדויק, ולמד לשפר את כתיבתך עם דוגמאות מהטקסט שלך עצמו');
  const [ctaButtonText, setCtaButtonText] = useState('התחל אימון ←');
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [adminPasswordInput, setAdminPasswordInput] = useState('');
  const [adminPasswordError, setAdminPasswordError] = useState(false);

  const [state, setState] = useState<AppState>({
    recipes: [],
    selectedRecipeId: null,
    documentText: '',
    sessionId: null,
    report: null,
    recipe: null,
    learningUnits: [],
    currentUnitIndex: 0,
    completedUnits: new Set(),
  });

  useEffect(() => {
    api.getRecipes()
      .then((recipes) => setState((s) => ({ ...s, recipes })))
      .catch(() => setError('לא ניתן לטעון את רשימת סוגי המסמכים — בדוק שהשרת פועל'));
    settingsApi.get()
      .then((s) => {
        setSiteTitle(s.site_title);
        setSiteTagline(s.site_tagline);
        if (s.footer_color) setFooterColor(s.footer_color);
        if (s.footer_text !== undefined) setFooterText(s.footer_text);
        if (s.logo_data_url !== undefined) setLogoDataUrl(s.logo_data_url);
        if (s.hero_badge) setHeroBadge(s.hero_badge);
        if (s.hero_subtitle) setHeroSubtitle(s.hero_subtitle);
        if (s.cta_button_text) setCtaButtonText(s.cta_button_text);
      })
      .catch(() => {/* use defaults */});
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [step]);

  const withLoading = async (text: string, fn: () => Promise<void>) => {
    setLoadingText(text);
    setLoading(true);
    setError(null);
    try {
      await fn();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  const handleDocTypeSelect = (id: string) => {
    setState((s) => ({ ...s, selectedRecipeId: id }));
    setStep('input-doc');
  };

  const handleDocSubmit = (text: string) => {
    setState((s) => ({ ...s, documentText: text }));
    withLoading('מנתח את המסמך שלך...', async () => {
      const { sessionId, report, recipe } = await api.diagnose(
        state.selectedRecipeId!,
        text,
      );
      setState((s) => ({ ...s, sessionId, report, recipe }));
      setStep('diagnostic');
    });
  };

  const handleStartLearning = () => {
    withLoading('מכין שיעורים מותאמים אישית...', async () => {
      const { learningUnits } = await api.generateLearning(state.sessionId!);
      setState((s) => ({ ...s, learningUnits, currentUnitIndex: 0 }));
      setStep('learning');
    });
  };

  const handleStartAssessment = (unitIndex: number) => {
    setState((s) => ({ ...s, currentUnitIndex: unitIndex }));
    setStep('assessment');
  };

  const handleAssessmentDone = (unitIndex: number) => {
    setState((s) => ({
      ...s,
      completedUnits: new Set([...s.completedUnits, unitIndex]),
    }));
    if (unitIndex + 1 < state.learningUnits.length) {
      setState((s) => ({ ...s, currentUnitIndex: unitIndex + 1 }));
      setStep('learning');
    } else {
      setStep('summary');
    }
  };

  const handleSkipUnit = (unitIndex: number) => {
    if (unitIndex + 1 < state.learningUnits.length) {
      setState((s) => ({ ...s, currentUnitIndex: unitIndex + 1 }));
    } else {
      setStep('summary');
    }
  };

  const handleRestart = () => {
    setState({
      recipes: state.recipes,
      selectedRecipeId: null,
      documentText: '',
      sessionId: null,
      report: null,
      recipe: null,
      learningUnits: [],
      currentUnitIndex: 0,
      completedUnits: new Set(),
    });
    setError(null);
    setStep('welcome');
  };

  const stepNumber: Record<AppStep, number> = {
    'welcome': 0,
    'admin': 0,
    'select-type': 1,
    'input-doc': 1,
    'diagnostic': 2,
    'learning': 3,
    'assessment': 3,
    'summary': 3,
  };

  const openAdmin = () => {
    if (sessionStorage.getItem(ADMIN_SESSION_KEY)) {
      setStep('admin');
    } else {
      setAdminPasswordInput('');
      setAdminPasswordError(false);
      setShowAdminModal(true);
    }
  };

  const submitAdminPassword = () => {
    if (adminPasswordInput === ADMIN_PASSWORD) {
      sessionStorage.setItem(ADMIN_SESSION_KEY, '1');
      setShowAdminModal(false);
      setStep('admin');
    } else {
      setAdminPasswordError(true);
    }
  };

  // Admin page gets its own full-page layout (no top-bar, no main-content wrapper)
  if (step === 'admin') {
    return <AdminDashboard onBack={() => setStep('welcome')} />;
  }

  const hasActiveSession = ['diagnostic', 'learning', 'assessment'].includes(step);

  return (
    <div className="app-shell">
      {showAdminModal && (
        <div className="admin-password-overlay" onClick={() => setShowAdminModal(false)}>
          <div className="admin-password-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="admin-password-title">כניסה לניהול מערכת</h3>
            <p className="admin-password-subtitle">הזן סיסמה כדי להמשיך</p>
            <input
              className={`admin-password-input${adminPasswordError ? ' admin-password-input--error' : ''}`}
              type="password"
              placeholder="סיסמה"
              value={adminPasswordInput}
              autoFocus
              onChange={(e) => { setAdminPasswordInput(e.target.value); setAdminPasswordError(false); }}
              onKeyDown={(e) => { if (e.key === 'Enter') submitAdminPassword(); if (e.key === 'Escape') setShowAdminModal(false); }}
            />
            {adminPasswordError && <p className="admin-password-error">סיסמה שגויה</p>}
            <div className="admin-password-actions">
              <button className="admin-password-cancel" onClick={() => setShowAdminModal(false)}>ביטול</button>
              <button className="admin-password-submit" onClick={submitAdminPassword}>כניסה</button>
            </div>
          </div>
        </div>
      )}

      <div className="top-bar">
        {logoDataUrl && (
          <img src={logoDataUrl} alt="לוגו" className="top-bar-logo" />
        )}
        <h1>{siteTitle}</h1>
        <span className="top-bar-spacer" />
        <nav className="top-bar-nav">
          {step !== 'welcome' && (
            <button
              className="top-bar-nav-btn"
              onClick={() => {
                if (hasActiveSession && !window.confirm('לחזור לדף הבית? ההתקדמות בשיעור הנוכחי תאבד.')) return;
                handleRestart();
              }}
            >
              דף הבית
            </button>
          )}
        </nav>
      </div>

      <div className={`main-content${step === 'welcome' ? ' main-content-welcome' : ''}`}>
        {step !== 'welcome' && <StepIndicator current={stepNumber[step]} />}

        {error && (
          <div className="alert alert-error">{error}</div>
        )}

        {loading && (
          <div className="loader-overlay">
            <div className="spinner" />
            <div className="loader-text">{loadingText}</div>
          </div>
        )}

        {step === 'welcome' && (
          <WelcomeStep
            onStart={() => setStep('select-type')}
            onAdminOpen={openAdmin}
            siteTitle={siteTitle}
            siteTagline={siteTagline}
            footerColor={footerColor}
            footerText={footerText}
            logoDataUrl={logoDataUrl}
            heroBadge={heroBadge}
            heroSubtitle={heroSubtitle}
            ctaButtonText={ctaButtonText}
          />
        )}

        {step === 'select-type' && (
          <DocTypeStep recipes={state.recipes} onSelect={handleDocTypeSelect} />
        )}

        {step === 'input-doc' && (
          <DocumentStep
            recipeName={
              state.recipes.find((r) => r.id === state.selectedRecipeId)?.name ??
              'מסמך'
            }
            onSubmit={handleDocSubmit}
            onBack={() => setStep('select-type')}
          />
        )}

        {step === 'diagnostic' && state.report && state.recipe && (
          <DiagnosticStep
            report={state.report}
            recipe={state.recipe}
            onStartLearning={handleStartLearning}
            onRestart={handleRestart}
          />
        )}

        {(step === 'learning' || step === 'assessment') &&
          state.learningUnits.length > 0 && (
            <>
              {step === 'learning' && (
                <LearningStep
                  units={state.learningUnits}
                  currentIndex={state.currentUnitIndex}
                  completedUnits={state.completedUnits}
                  onStartAssessment={handleStartAssessment}
                  onSkip={handleSkipUnit}
                />
              )}
              {step === 'assessment' && (
                <AssessmentStep
                  sessionId={state.sessionId!}
                  unitIndex={state.currentUnitIndex}
                  unit={state.learningUnits[state.currentUnitIndex]}
                  onDone={handleAssessmentDone}
                  onSkip={handleSkipUnit}
                />
              )}
            </>
          )}

        {step === 'summary' && state.report && (
          <SummaryStep
            report={state.report}
            totalUnits={state.learningUnits.length}
            completedUnits={state.completedUnits.size}
            onRestart={handleRestart}
          />
        )}
      </div>
    </div>
  );
}
