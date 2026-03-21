// ============================================================
// Client — API Layer
// Typed wrappers around the WritingCoach REST API.
// ============================================================

export interface RecipeInfo {
  id: string;
  name: string;
  description: string;
}

export interface DiagnosticReport {
  recipe_id: string;
  recipe_name: string;
  scores: {
    foundational: { score: number; passed_count: number; total_count: number };
    document_specific: { score: number; passed_count: number; total_count: number };
    overall: number;
  };
  evaluations: Array<{
    criterion_id: string;
    passed: boolean;
    confidence: number;
    explanation: string;
    excerpt?: string;
  }>;
  gaps: Array<{
    criterion_id: string;
    passed: boolean;
    confidence: number;
    explanation: string;
    excerpt?: string;
  }>;
}

export interface Recipe {
  id: string;
  name: string;
  description: string;
  criteria: Array<{
    id: string;
    question: string;
    weight: number;
    layer: 'foundational' | 'document_specific';
    micro_lesson: {
      why: string;
      tool: string;
      formula?: string;
      before_example: string;
      after_example: string;
    };
  }>;
}

export interface LearningUnit {
  criterion_id: string;
  criterion_question: string;
  gap_summary: string;
  why_it_matters: string;
  practical_tool: string;
  formula?: string;
  before_from_doc: string;
  after_from_doc: string;
}

export interface PracticeExercise {
  criterion_id: string;
  criterion_question: string;
  instruction: string;
  weak_excerpt: string;
}

export interface AssessmentResult {
  criterion_id: string;
  passed: boolean;
  score: number;
  feedback: string;
  improvement_tip?: string;
}

const BASE = '/api';

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
  return data as T;
}

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
  return data as T;
}

export const api = {
  getRecipes: (): Promise<RecipeInfo[]> => get('/recipes'),

  diagnose: (documentTypeId: string, documentText: string) =>
    post<{ sessionId: string; report: DiagnosticReport; recipe: Recipe }>(
      '/diagnose',
      { documentTypeId, documentText },
    ),

  generateLearning: (sessionId: string) =>
    post<{ learningUnits: LearningUnit[] }>(
      `/session/${sessionId}/learn`,
      {},
    ),

  getExercise: (sessionId: string, unitIndex: number) =>
    get<{ exercise: PracticeExercise }>(
      `/session/${sessionId}/exercise/${unitIndex}`,
    ),

  assess: (sessionId: string, unitIndex: number, userRewrite: string) =>
    post<{ result: AssessmentResult; exercise: PracticeExercise }>(
      `/session/${sessionId}/assess/${unitIndex}`,
      { userRewrite },
    ),
};

async function del<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { method: 'DELETE' });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
  return data as T;
}

async function put<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
  return data as T;
}

export const adminApi = {
  listRecipes: (): Promise<Recipe[]> => get('/admin/recipes'),
  getRecipe: (id: string): Promise<Recipe> => get(`/admin/recipes/${id}`),
  createRecipe: (recipe: Recipe): Promise<Recipe> => post('/admin/recipes', recipe),
  updateRecipe: (id: string, recipe: Recipe): Promise<Recipe> => put(`/admin/recipes/${id}`, recipe),
  deleteRecipe: (id: string): Promise<{ ok: boolean }> => del(`/admin/recipes/${id}`),
};

export interface SystemPrompts {
  diagnostic: string;
  learning: string;
  assessment: string;
}

export const systemPromptApi = {
  getAll: (): Promise<SystemPrompts> => get('/admin/system-prompts'),
  updateAll: (prompts: Partial<SystemPrompts>): Promise<SystemPrompts> =>
    put('/admin/system-prompts', prompts),
};

export type LLMProvider = 'anthropic' | 'openai' | 'ollama' | 'cohere';

export interface LLMConfig {
  provider: LLMProvider;
  anthropic_api_key?: string;
  openai_api_key?: string;
  openai_base_url?: string;
  openai_model?: string;
  cohere_api_key?: string;
  cohere_base_url?: string;
  cohere_model?: string;
  ollama_base_url?: string;
  ollama_model?: string;
}

export const llmConfigApi = {
  get: (): Promise<LLMConfig> => get('/admin/llm-config'),
  update: (config: Partial<LLMConfig>): Promise<LLMConfig> => put('/admin/llm-config', config),
};

export interface SystemSettings {
  max_lessons: number;
  llm_timeout_seconds: number;
  rate_limit_enabled: boolean;
  rate_limit_max: number;
  rate_limit_window_minutes: number;
  site_title: string;
  site_tagline: string;
}

export const settingsApi = {
  get: (): Promise<SystemSettings> => get('/admin/settings'),
  update: (patch: Partial<SystemSettings>): Promise<SystemSettings> => put('/admin/settings', patch),
};
