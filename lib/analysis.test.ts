import { describe, it, expect } from "vitest";
import { analyse, teachingFocus, median, stdDev, itemAnalysis, flaggedItems, deriveScores } from "./analysis";
import type { Category, Question, Student } from "./types";

const taxonomy: Category[] = [
  { id: "a", nameZh: "甲", questionCount: 2 },
  { id: "b", nameZh: "乙", questionCount: 4 },
  { id: "c", nameZh: "丙", questionCount: 2, subjective: true },
];

const questions: Question[] = [
  { number: 1, text: "", type: "choice", categoryId: "a", confidence: 1 },
  { number: 2, text: "", type: "choice", categoryId: "a", confidence: 1 },
  { number: 3, text: "", type: "choice", categoryId: "b", confidence: 1 },
  { number: 4, text: "", type: "choice", categoryId: "b", confidence: 1 },
  { number: 5, text: "", type: "choice", categoryId: "b", confidence: 1 },
  { number: 6, text: "", type: "choice", categoryId: "b", confidence: 1 },
  { number: 7, text: "", type: "essay",  categoryId: "c", confidence: 1 },
  { number: 8, text: "", type: "essay",  categoryId: "c", confidence: 1 },
];

const students: Student[] = [
  { id: "s1", name: "甲同学", wrongQuestions: [1, 2], score: 80 },       // all of 甲
  { id: "s2", name: "乙同学", wrongQuestions: [3, 4, 5, 6], score: 60 }, // all of 乙
  { id: "s3", name: "丙同学", wrongQuestions: [], score: 100 },
  { id: "s4", name: "缺考",   wrongQuestions: [1], score: 0, absent: true },
];

describe("analyse", () => {
  const a = analyse(questions, students, taxonomy, { totalMarks: 100 });

  it("excludes absent students from every denominator", () => {
    expect(a.classStats.studentCount).toBe(3);
    // Q1 was missed by s1 and by the absent s4 — only s1 counts.
    expect(a.byQuestion.find((q) => q.number === 1)!.wrongCount).toBe(1);
    expect(a.byQuestion.find((q) => q.number === 1)!.errorRate).toBeCloseTo(1 / 3);
  });

  it("normalises category error rate by question count, not raw wrong count", () => {
    const 甲 = a.byCategory.find((c) => c.categoryId === "a")!;
    const 乙 = a.byCategory.find((c) => c.categoryId === "b")!;
    // 甲: 2 wrong of 2×3 attempts. 乙: 4 wrong of 4×3. Same rate despite double the count.
    expect(甲.wrongCount).toBe(2);
    expect(乙.wrongCount).toBe(4);
    expect(甲.errorRate).toBeCloseTo(乙.errorRate);
    expect(甲.errorRate).toBeCloseTo(1 / 3);
  });

  it("ranks a student's weak categories by share missed, not raw count", () => {
    const s1 = a.byStudent.find((s) => s.studentId === "s1")!;
    expect(s1.weakCategories[0].categoryId).toBe("a");
    expect(s1.weakCategories[0].rate).toBe(1);
    expect(s1.weakCategories).toHaveLength(1);
  });

  it("gives every student a full cell row so the heatmap is rectangular", () => {
    for (const s of a.byStudent) expect(s.cells).toHaveLength(taxonomy.length);
    const s3 = a.byStudent.find((s) => s.studentId === "s3")!;
    expect(s3.cells.every((c) => c.wrong === 0)).toBe(true);
  });

  it("marks subjective categories so callers never claim a per-question rate", () => {
    expect(a.byCategory.find((c) => c.categoryId === "c")!.subjective).toBe(true);
    expect(a.byCategory.find((c) => c.categoryId === "a")!.subjective).toBe(false);
  });

  it("computes class statistics from present students only", () => {
    expect(a.classStats.meanWrong).toBeCloseTo(2);
    expect(a.classStats.maxScore).toBe(100);
    expect(a.classStats.minScore).toBe(60);
    expect(a.classStats.passCount).toBe(3);
  });

  it("lists only questions more than half the class missed as hardest", () => {
    expect(a.classStats.hardestQuestions).toEqual([]);
    const harsh = analyse(
      questions,
      [
        { id: "x", name: "a", wrongQuestions: [1] },
        { id: "y", name: "b", wrongQuestions: [1] },
        { id: "z", name: "c", wrongQuestions: [] },
      ],
      taxonomy,
    );
    expect(harsh.classStats.hardestQuestions).toEqual([1]);
  });

  it("survives an empty class without dividing by zero", () => {
    const empty = analyse(questions, [], taxonomy);
    expect(empty.classStats.meanWrong).toBe(0);
    expect(empty.byCategory.every((c) => c.errorRate === 0)).toBe(true);
    expect(Number.isNaN(empty.classStats.sdWrong)).toBe(false);
  });
});

describe("teachingFocus", () => {
  it("returns the highest error rates first", () => {
    const a = analyse(questions, students, taxonomy);
    const top = teachingFocus(a, 2);
    expect(top).toHaveLength(2);
    expect(top[0].errorRate).toBeGreaterThanOrEqual(top[1].errorRate);
  });
});

describe("summary helpers", () => {
  it("takes the midpoint of an even-length set", () => {
    expect(median([1, 2, 3, 4])).toBe(2.5);
    expect(median([3, 1, 2])).toBe(2);
    expect(median([])).toBe(0);
  });
  it("computes a population standard deviation", () => {
    expect(stdDev([2, 2, 2])).toBe(0);
    expect(stdDev([1, 3])).toBe(1);
  });
});

describe("itemAnalysis", () => {
  // 6 students, ranked by score. Q1 separates strong from weak perfectly;
  // Q2 is missed by everyone; Q3 is missed only by the strongest.
  const qs: Question[] = [1, 2, 3].map((n) => ({
    number: n, text: "", type: "choice", categoryId: "a", confidence: 1,
  }));
  const ss: Student[] = [
    { id: "1", name: "a", score: 100, wrongQuestions: [2, 3] },
    { id: "2", name: "b", score: 90,  wrongQuestions: [2] },
    { id: "3", name: "c", score: 80,  wrongQuestions: [2] },
    { id: "4", name: "d", score: 40,  wrongQuestions: [1, 2] },
    { id: "5", name: "e", score: 30,  wrongQuestions: [1, 2] },
    { id: "6", name: "f", score: 20,  wrongQuestions: [1, 2] },
  ];
  const items = itemAnalysis(qs, ss);
  const byN = (n: number) => items.find((i) => i.number === n)!;

  it("computes 难度 as the proportion correct, so higher means easier", () => {
    expect(byN(1).difficulty).toBeCloseTo(0.5);  // 3 of 6 correct
    expect(byN(2).difficulty).toBe(0);           // nobody correct
  });

  it("gives a perfectly separating question maximum discrimination", () => {
    expect(byN(1).discrimination).toBe(1);
    expect(byN(1).quality).toBe("excellent");
  });

  it("gives a question everyone missed zero discrimination", () => {
    expect(byN(2).discrimination).toBe(0);
    expect(byN(2).quality).toBe("poor");
  });

  it("reports negative discrimination when strong students do worse", () => {
    expect(byN(3).discrimination).toBeLessThan(0);
    expect(byN(3).quality).toBe("poor");
  });

  it("flags items that carry no information or invert", () => {
    const flagged = flaggedItems(items).map((i) => i.number).sort();
    expect(flagged).toEqual([2, 3]);
    expect(flagged).not.toContain(1);
  });

  it("names the distractor that pulled the most students", () => {
    const withPicks: Student[] = [
      { id: "1", name: "a", score: 90, wrongQuestions: [1], chosenOptions: { 1: "B" } },
      { id: "2", name: "b", score: 80, wrongQuestions: [1], chosenOptions: { 1: "B" } },
      { id: "3", name: "c", score: 70, wrongQuestions: [1], chosenOptions: { 1: "C" } },
      { id: "4", name: "d", score: 60, wrongQuestions: [] },
    ];
    const top = itemAnalysis(qs, withPicks).find((i) => i.number === 1)!.topDistractor;
    expect(top).toEqual({ option: "B", count: 2 });
  });

  it("returns nothing rather than dividing by zero on an empty class", () => {
    expect(itemAnalysis(qs, [])).toEqual([]);
  });

  it("falls back to wrong-count ranking when no scores were entered", () => {
    const noScores = ss.map(({ score, ...rest }) => rest);
    expect(itemAnalysis(qs, noScores).find((i) => i.number === 1)!.discrimination).toBe(1);
  });
});

describe("deriveScores", () => {
  const qs: Question[] = [
    { number: 1, text: "", type: "choice", categoryId: "a", confidence: 1, points: 5 },
    { number: 2, text: "", type: "choice", categoryId: "a", confidence: 1, points: 5 },
  ];

  it("subtracts the points of missed questions and any subjective loss", () => {
    const out = deriveScores(qs, [{ id: "1", name: "a", wrongQuestions: [1], subjectiveDeduction: 3 }], 100);
    expect(out[0].score).toBe(92);
  });

  it("never overwrites a score the teacher already gave", () => {
    const out = deriveScores(qs, [{ id: "1", name: "a", wrongQuestions: [1, 2], score: 61 }], 100);
    expect(out[0].score).toBe(61);
  });

  it("leaves students untouched when the paper carries no points", () => {
    const noPoints = qs.map(({ points, ...rest }) => rest);
    const out = deriveScores(noPoints, [{ id: "1", name: "a", wrongQuestions: [1] }], 100);
    expect(out[0].score).toBeUndefined();
  });

  it("floors at zero rather than going negative", () => {
    const out = deriveScores(qs, [{ id: "1", name: "a", wrongQuestions: [1, 2], subjectiveDeduction: 200 }], 100);
    expect(out[0].score).toBe(0);
  });
});
