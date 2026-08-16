/**
 * The analysis engine.
 *
 * Deliberately pure and AI-free: the numbers that end up on a document a parent
 * reads have to be reproducible and explainable, not the output of a language
 * model. Everything here is a function of (questions, students, taxonomy).
 */

import type { Category, Question, Student } from "./types";

export interface QuestionStat {
  number: number;
  wrongCount: number;
  errorRate: number;
  categoryId: string;
}

export interface CategoryStat {
  categoryId: string;
  nameZh: string;
  questionCount: number;
  /** Total wrong answers across the class in this category. */
  wrongCount: number;
  /** Denominator: students × questionCount. Normalising is what makes a
   *  2-question category comparable with a 9-question one. */
  attemptCount: number;
  errorRate: number;
  subjective: boolean;
}

export interface WeakCategory {
  categoryId: string;
  nameZh: string;
  wrong: number;
  total: number;
  /** Share of this category's questions the student missed. */
  rate: number;
}

export interface StudentStat {
  studentId: string;
  name: string;
  wrongCount: number;
  score?: number;
  weakCategories: WeakCategory[];
  /** Per-category cells, in taxonomy order — the heatmap row. */
  cells: WeakCategory[];
}

export interface ClassStats {
  studentCount: number;
  questionCount: number;
  meanWrong: number;
  medianWrong: number;
  sdWrong: number;
  meanScore?: number;
  medianScore?: number;
  sdScore?: number;
  maxScore?: number;
  minScore?: number;
  passCount?: number;
  /** Students whose wrong count exceeds mean + 1σ. */
  atRiskCount: number;
  /** Question numbers more than half the class missed, hardest first. */
  hardestQuestions: number[];
}

export interface Analysis {
  byQuestion: QuestionStat[];
  byCategory: CategoryStat[];
  byStudent: StudentStat[];
  classStats: ClassStats;
}

export function mean(xs: number[]): number {
  return xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0;
}

export function median(xs: number[]): number {
  if (!xs.length) return 0;
  const s = [...xs].sort((a, b) => a - b);
  const mid = s.length >> 1;
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

export function stdDev(xs: number[]): number {
  if (!xs.length) return 0;
  const m = mean(xs);
  return Math.sqrt(mean(xs.map((v) => (v - m) ** 2)));
}

/** Pass mark as a fraction of total marks. */
const PASS_FRACTION = 0.6;

export function analyse(
  questions: Question[],
  students: Student[],
  taxonomy: Category[],
  opts: { totalMarks?: number } = {},
): Analysis {
  const present = students.filter((s) => !s.absent);
  const n = present.length;

  const catById = new Map(taxonomy.map((c) => [c.id, c]));
  const qByNumber = new Map(questions.map((q) => [q.number, q]));

  // ── per question ──────────────────────────────────────────
  const wrongPerQuestion = new Map<number, number>();
  for (const s of present) {
    for (const q of s.wrongQuestions) {
      wrongPerQuestion.set(q, (wrongPerQuestion.get(q) ?? 0) + 1);
    }
  }
  const byQuestion: QuestionStat[] = questions.map((q) => {
    const wrongCount = wrongPerQuestion.get(q.number) ?? 0;
    return {
      number: q.number,
      wrongCount,
      errorRate: n ? wrongCount / n : 0,
      categoryId: q.categoryId,
    };
  });

  // ── per student, per category ─────────────────────────────
  const questionsInCategory = new Map<string, number>();
  for (const c of taxonomy) questionsInCategory.set(c.id, 0);
  for (const q of questions) {
    questionsInCategory.set(q.categoryId, (questionsInCategory.get(q.categoryId) ?? 0) + 1);
  }

  const byStudent: StudentStat[] = present.map((s) => {
    const wrongByCat = new Map<string, number>();
    for (const qn of s.wrongQuestions) {
      const q = qByNumber.get(qn);
      if (!q) continue; // out-of-range numbers are rejected at parse time
      wrongByCat.set(q.categoryId, (wrongByCat.get(q.categoryId) ?? 0) + 1);
    }

    const cells: WeakCategory[] = taxonomy.map((c) => {
      const total = questionsInCategory.get(c.id) ?? 0;
      const wrong = wrongByCat.get(c.id) ?? 0;
      return { categoryId: c.id, nameZh: c.nameZh, wrong, total, rate: total ? wrong / total : 0 };
    });

    return {
      studentId: s.id,
      name: s.name,
      score: s.score,
      wrongCount: s.wrongQuestions.length,
      // Ranked by *share* of the category missed, not raw count — raw counts
      // unfairly punish well-represented topics.
      weakCategories: cells
        .filter((c) => c.wrong > 0)
        .sort((a, b) => b.rate - a.rate || b.wrong - a.wrong),
      cells,
    };
  });

  // ── per category ──────────────────────────────────────────
  const byCategory: CategoryStat[] = taxonomy.map((c) => {
    const questionCount = questionsInCategory.get(c.id) ?? 0;
    const wrongCount = byStudent.reduce(
      (a, st) => a + (st.cells.find((x) => x.categoryId === c.id)?.wrong ?? 0),
      0,
    );
    const attemptCount = questionCount * n;
    return {
      categoryId: c.id,
      nameZh: c.nameZh,
      questionCount,
      wrongCount,
      attemptCount,
      errorRate: attemptCount ? wrongCount / attemptCount : 0,
      subjective: Boolean(catById.get(c.id)?.subjective),
    };
  });

  // ── class ─────────────────────────────────────────────────
  const wrongCounts = byStudent.map((s) => s.wrongCount);
  const scores = present.map((s) => s.score).filter((v): v is number => typeof v === "number");
  const mw = mean(wrongCounts);
  const sw = stdDev(wrongCounts);

  const classStats: ClassStats = {
    studentCount: n,
    questionCount: questions.length,
    meanWrong: mw,
    medianWrong: median(wrongCounts),
    sdWrong: sw,
    atRiskCount: wrongCounts.filter((v) => v > mw + sw).length,
    hardestQuestions: byQuestion
      .filter((q) => q.errorRate > 0.5)
      .sort((a, b) => b.errorRate - a.errorRate)
      .map((q) => q.number),
  };

  if (scores.length) {
    classStats.meanScore = mean(scores);
    classStats.medianScore = median(scores);
    classStats.sdScore = stdDev(scores);
    classStats.maxScore = Math.max(...scores);
    classStats.minScore = Math.min(...scores);
    if (opts.totalMarks) {
      classStats.passCount = scores.filter((v) => v >= opts.totalMarks! * PASS_FRACTION).length;
    }
  }

  return { byQuestion, byCategory, byStudent, classStats };
}

/**
 * The three categories most worth re-teaching. Subjective categories are included
 * — they are usually where the marks actually go — but the caller is told which
 * are subjective so it never claims a per-question error rate for a 习作.
 */
export function teachingFocus(analysis: Analysis, count = 3): CategoryStat[] {
  return [...analysis.byCategory]
    .filter((c) => c.questionCount > 0)
    .sort((a, b) => b.errorRate - a.errorRate)
    .slice(0, count);
}
