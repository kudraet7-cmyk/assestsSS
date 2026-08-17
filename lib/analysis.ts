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

/* ══════════════════════════════════════════════════════════════
   Classical item analysis — 难度系数 and 区分度.

   These are the two numbers Chinese teachers already use when they
   write a 试卷分析, and both are pure arithmetic. No model involved,
   no API key, no cost.
   ══════════════════════════════════════════════════════════════ */

export interface ItemStat {
  number: number;
  categoryId: string;
  /** 难度系数 P — proportion answering correctly. Higher means easier. */
  difficulty: number;
  /** 区分度 D — upper-27% correct rate minus lower-27%, by total score. */
  discrimination: number;
  /** Verdict on D, using the conventional bands. */
  quality: "excellent" | "good" | "marginal" | "poor";
  /** The wrong option the most students picked, when options were recorded. */
  topDistractor?: { option: string; count: number };
}

const DISCRIMINATION_BANDS: [number, ItemStat["quality"]][] = [
  [0.4, "excellent"],
  [0.3, "good"],
  [0.2, "marginal"],
  [-Infinity, "poor"],
];

/**
 * Ranks students by total score (falling back to fewest wrong when scores are
 * absent), then compares the top and bottom 27% — the conventional split, which
 * maximises the reliability of D for a normally distributed group.
 */
export function itemAnalysis(questions: Question[], students: Student[]): ItemStat[] {
  const present = students.filter((s) => !s.absent);
  const n = present.length;
  if (n === 0) return [];

  const ranked = [...present].sort((a, b) => {
    if (a.score !== undefined && b.score !== undefined) return b.score - a.score;
    return a.wrongQuestions.length - b.wrongQuestions.length;
  });

  // With a small class the 27% groups would be a single student each, which makes
  // D pure noise. Below 10 students we compare halves instead and say so via the
  // wider band thresholds already in use.
  const groupSize = n < 10 ? Math.floor(n / 2) : Math.max(1, Math.round(n * 0.27));
  const upper = ranked.slice(0, groupSize);
  const lower = ranked.slice(-groupSize);

  const wrongSet = (s: Student) => new Set(s.wrongQuestions);
  const upperSets = upper.map(wrongSet);
  const lowerSets = lower.map(wrongSet);
  const allSets = present.map(wrongSet);

  const correctRate = (sets: Set<number>[], q: number) =>
    sets.length ? sets.filter((set) => !set.has(q)).length / sets.length : 0;

  return questions.map((q) => {
    const difficulty = correctRate(allSets, q.number);
    const discrimination = correctRate(upperSets, q.number) - correctRate(lowerSets, q.number);
    const quality = DISCRIMINATION_BANDS.find(([min]) => discrimination >= min)![1];

    // Which distractor pulled the most students — only meaningful when the
    // teacher recorded the option each student actually chose.
    const picks = new Map<string, number>();
    for (const s of present) {
      const opt = s.chosenOptions?.[q.number];
      if (opt) picks.set(opt, (picks.get(opt) ?? 0) + 1);
    }
    let topDistractor: ItemStat["topDistractor"];
    for (const [option, count] of picks) {
      if (!topDistractor || count > topDistractor.count) topDistractor = { option, count };
    }

    return { number: q.number, categoryId: q.categoryId, difficulty, discrimination, quality, topDistractor };
  });
}

/**
 * Questions worth rewriting: everyone got them right or wrong (no information),
 * or strong students did worse than weak ones (negative discrimination, which
 * usually means an ambiguous stem or a wrong key).
 */
export function flaggedItems(items: ItemStat[]): ItemStat[] {
  return items.filter(
    (i) => i.discrimination < 0.2 || i.difficulty >= 0.98 || i.difficulty <= 0.05,
  );
}

/**
 * Derives each student's score from question points when the roster didn't carry
 * one, so 班级分析 works without asking the teacher to type scores twice.
 * Returns the students unchanged if the paper has no per-question points.
 */
export function deriveScores(
  questions: Question[],
  students: Student[],
  totalMarks: number,
): Student[] {
  const pointsFor = new Map(questions.map((q) => [q.number, q.points ?? 0]));
  const hasPoints = questions.some((q) => (q.points ?? 0) > 0);
  if (!hasPoints) return students;

  return students.map((s) => {
    if (s.score !== undefined) return s;
    const lost = s.wrongQuestions.reduce((a, q) => a + (pointsFor.get(q) ?? 0), 0);
    const score = Math.max(0, totalMarks - lost - (s.subjectiveDeduction ?? 0));
    return { ...s, score: Math.round(score * 10) / 10 };
  });
}
