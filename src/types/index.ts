// ============================================================
// WritingCoach — Core TypeScript Types
// ============================================================

/** Max characters of a document sent to the LLM for analysis. */
export const MAX_DOCUMENT_PREVIEW = 6000;

/** A single micro-lesson tied to a rubric criterion. */
export interface MicroLesson {
  /** Why this skill matters (in Hebrew) */
  why: string;
  /** The practical tool or technique (in Hebrew) */
  tool: string;
  /** Optional formula or template (in Hebrew) */
  formula?: string;
  /** "Before" example showing the gap */
  before_example: string;
  /** "After" example showing the corrected version */
  after_example: string;
}

/** Which evaluative layer a criterion belongs to. */
export type CriterionLayer = 'foundational' | 'document_specific';

/** A single rubric criterion with its associated micro-lesson. */
export interface RubricCriterion {
  id: string;
  /** The yes/no diagnostic question (in Hebrew) */
  question: string;
  /** 0–1 weighting within the layer */
  weight: number;
  layer: CriterionLayer;
  micro_lesson: MicroLesson;
}

/** A loaded recipe (document type definition). */
export interface Recipe {
  id: string;
  name: string;
  description: string;
  criteria: RubricCriterion[];
}

// ---- Diagnostic ----

/** Per-criterion evaluation result from the LLM. */
export interface CriterionEvaluation {
  criterion_id: string;
  passed: boolean;
  confidence: number;
  /** Short explanation in Hebrew */
  explanation: string;
  /** Relevant excerpt from the submitted document, if applicable */
  excerpt?: string;
}

/** Layer-level score (0–100). */
export interface LayerScore {
  score: number;
  passed_count: number;
  total_count: number;
}

/** Full diagnostic report for a submitted document. */
export interface DiagnosticReport {
  recipe_id: string;
  recipe_name: string;
  evaluations: CriterionEvaluation[];
  scores: {
    foundational: LayerScore;
    document_specific: LayerScore;
    overall: number;
  };
  /** Criteria that failed (the gaps) */
  gaps: CriterionEvaluation[];
  /** First ~500 chars of original document (for reference in later steps) */
  document_preview: string;
}

// ---- Micro-Learning ----

/** A generated micro-learning unit for a specific gap. */
export interface LearningUnit {
  criterion_id: string;
  criterion_question: string;
  gap_summary: string;
  why_it_matters: string;
  practical_tool: string;
  formula?: string;
  /** Excerpt from the user's document showing the gap */
  before_from_doc: string;
  /** LLM-generated rewrite of that excerpt */
  after_from_doc: string;
}

// ---- Assessment ----

/** The practice exercise presented to the user. */
export interface PracticeExercise {
  criterion_id: string;
  criterion_question: string;
  instruction: string;
  weak_excerpt: string;
}

/** Result after the user submits their rewrite. */
export interface AssessmentResult {
  criterion_id: string;
  passed: boolean;
  score: number;
  feedback: string;
  improvement_tip?: string;
}

// ---- LLM ----

export interface LLMMessage {
  role: 'user' | 'assistant';
  content: string;
}

// ---- Raw LLM diagnostic response (internal) ----

export interface RawEvaluation {
  id: string;
  passed: boolean;
  confidence: number;
  explanation: string;
  excerpt?: string;
}

export interface RawDiagnosticResponse {
  evaluations: RawEvaluation[];
}
