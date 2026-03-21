import { useState, useEffect } from 'react';
import { api, RecipeInfo, DiagnosticReport, Recipe, LearningUnit } from './api';
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

export default function App() {
  const [step, setStep] = useState<AppStep>('welcome');
  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('');
  const [error, setError] = useState<string | null>(null);
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

  // Admin page gets its own full-page layout (no top-bar, no main-content wrapper)
  if (step === 'admin') {
    return <AdminDashboard onBack={() => setStep('welcome')} />;
  }

  return (
    <div className="app-shell">
      <div className="top-bar">
        <span className="top-bar-icon">✍️</span>
        <h1>מאמן הכתיבה המנהלית</h1>
        <span className="top-bar-sub">Writing Coach</span>
        <span className="top-bar-spacer" />
        {step !== 'welcome' && (
          <button
            className="top-bar-home-btn"
            onClick={() => {
              if (window.confirm('לחזור לדף הבית? ההתקדמות בשיעור הנוכחי תאבד.')) {
                handleRestart();
              }
            }}
            title="חזרה לדף הבית"
          >
            דף הבית
          </button>
        )}
      </div>

      <div className={`main-content${step === 'welcome' ? ' main-content-welcome' : ''}`}>
        {step !== 'welcome' && <StepIndicator current={stepNumber[step]} />}

        {error && (
          <div className="alert alert-error">❌ {error}</div>
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
            onAdminOpen={() => setStep('admin')}
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
