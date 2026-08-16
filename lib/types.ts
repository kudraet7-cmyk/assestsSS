/** Shared domain types for 砺知. */

export type SubjectKey = "chinese" | "math" | "english";

export type QuestionType =
  | "choice" | "fill" | "short" | "essay" | "calculation" | "dictation";

/** A knowledge point. Taxonomies are stored per subject and reused across exams. */
export interface Category {
  id: string;
  nameZh: string;
  /** Number of questions on this paper carrying this category. */
  questionCount: number;
  /** True for categories scored by marks lost rather than per-question right/wrong. */
  subjective?: boolean;
}

export interface Question {
  number: number;
  text: string;
  type: QuestionType;
  options?: string[];
  /** Absent when the paper arrived without a key and nothing has been confirmed yet. */
  correctAnswer?: string;
  explanation?: string;
  categoryId: string;
  points?: number;
  /** 0–1. Rows below REVIEW_THRESHOLD are surfaced for confirmation. */
  confidence: number;
  /** Set once a human has confirmed the answer. Gates the answer-key export. */
  verified?: boolean;
  /** LaTeX source when the question carries a formula (maths). */
  latex?: string;
}

export interface Student {
  id: string;
  name: string;
  /** Objective questions answered incorrectly. */
  wrongQuestions: number[];
  /** Optional: which distractor they picked, e.g. { 30: "B" }. Powers error-cause analysis. */
  chosenOptions?: Record<number, string>;
  /** Marks lost on subjective questions. */
  subjectiveDeduction?: number;
  score?: number;
  absent?: boolean;
}

export interface SubjectPack {
  key: SubjectKey;
  nameZh: string;
  /** Default taxonomy proposed for a new exam; the teacher edits it. */
  defaultTaxonomy: Omit<Category, "questionCount">[];
  questionTypes: QuestionType[];
  /** Marks per subjective question, used to convert deductions to a comparable scale. */
  subjectiveMarksPerQuestion: number;
  /** Formulas need LaTeX round-tripping (maths only). */
  needsLatex: boolean;
  /** Numeric answers can be recomputed and checked (maths only). */
  supportsNumericCheck: boolean;
  /** Subjective work is never graded by the model — see PLAN.md §6.5. */
  neverAutoGrade: boolean;
}

export const REVIEW_THRESHOLD = 0.8;
