/**
 * Sample papers so every screen has something real to render before the Gemini
 * pipeline lands. Replaced by parsed output once a paper is uploaded.
 */
import type { Category, Question, Student, SubjectKey } from "./types";
import { SUBJECTS } from "./subjects";

const NAMES = ["陈嘉禾","李思远","浦绎心","张一鸣","王梓涵","刘可欣","孙悦","周子谦",
               "吴雨桐","郑亦然","何晨曦","徐乐言","马知微","高逸尘","林书白","黄允",
               "朱明轩","唐清和","冯望舒","蒋南初","韩星野","沈知许"];

/** Questions per category, and the class error rate we want each to land near. */
const SHAPE: Record<SubjectKey, { counts: number[]; rates: number[]; scores: number[]; title: string; grade: string }> = {
  chinese: {
    counts: [10, 6, 8, 9, 12, 8, 5],
    rates:  [.18, .31, .22, .44, .19, .47, .50],
    scores: [94,90,86,85,83,82,80,79,78,77,76,75,74,72,71,69,67,65,62,58,55,51],
    title: "六年级上 第一单元 阶段测试", grade: "六年级上",
  },
  math: {
    counts: [12, 8, 9, 10, 6, 9],
    rates:  [.24, .33, .38, .41, .17, .52],
    scores: [98,95,91,88,86,84,82,80,79,77,76,74,72,70,68,65,62,59,55,50,46,42],
    title: "六年级上 期中测试", grade: "六年级上",
  },
  english: {
    counts: [6, 4, 13, 20, 6, 12, 9],
    rates:  [.41, .36, .22, .14, .41, .18, .52],
    scores: [92,88,84.5,83,81,80,79,78,77,76,76,75,74,73,71,70,68,66,63,59,56,52],
    title: "预初卓越英语 · Starter & U1 阶段测试", grade: "六年级上（预初）",
  },
};

export interface DemoExam {
  meta: { title: string; grade: string; totalMarks: number };
  taxonomy: Category[];
  questions: Question[];
  students: Student[];
}

export function buildDemoExam(subject: SubjectKey): DemoExam {
  const pack = SUBJECTS[subject];
  const shape = SHAPE[subject];

  const taxonomy: Category[] = pack.defaultTaxonomy.map((c, i) => ({
    ...c, questionCount: shape.counts[i],
  }));

  const questions: Question[] = [];
  let n = 1;
  taxonomy.forEach((c) => {
    for (let k = 0; k < c.questionCount; k++) {
      questions.push({
        number: n,
        text: `${c.nameZh} 第 ${k + 1} 题`,
        type: c.subjective ? "short" : "choice",
        categoryId: c.id,
        confidence: 0.92 + ((n * 7) % 8) / 100,
        verified: n % 23 !== 0,   // a few rows left unverified, as in real use
      });
      n++;
    }
  });

  // Deterministic: same class every reload.
  let seed = 20260815;
  const rnd = () => (seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296;

  const lo = Math.min(...shape.scores), hi = Math.max(...shape.scores);
  const raw = shape.scores.map((s) => 2.2 - 2.0 * ((s - lo) / (hi - lo)));
  const avg = raw.reduce((a, b) => a + b, 0) / raw.length;
  const mult = raw.map((m) => m / avg);

  const students: Student[] = NAMES.map((name, i) => {
    const wrong: number[] = [];
    let q = 1;
    taxonomy.forEach((c, ci) => {
      const exact = Math.min(1, shape.rates[ci] * mult[i]) * c.questionCount;
      let take = Math.min(c.questionCount, Math.floor(exact) + (rnd() < exact % 1 ? 1 : 0));
      for (let k = 0; k < c.questionCount && take > 0; k++, take--) wrong.push(q + k);
      q += c.questionCount;
    });
    return { id: `s${i + 1}`, name, wrongQuestions: wrong, score: shape.scores[i] };
  });

  return {
    meta: { title: shape.title, grade: shape.grade, totalMarks: 100 },
    taxonomy, questions, students,
  };
}
