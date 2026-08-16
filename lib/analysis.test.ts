import { describe, it, expect } from "vitest";
import { analyse, teachingFocus, median, stdDev } from "./analysis";
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
