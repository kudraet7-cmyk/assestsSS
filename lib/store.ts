"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { get as idbGet, set as idbSet, del as idbDel } from "idb-keyval";
import type { Category, Question, Student, SubjectKey } from "./types";
import { SUBJECTS } from "./subjects";

export interface ExamMeta {
  title: string;
  grade: string;
  examDate: string;
  teacher: string;
  totalMarks: number;
}

interface SessionState {
  subject: SubjectKey;
  meta: ExamMeta;
  questions: Question[];
  students: Student[];
  taxonomy: Category[];
  rosterText: string;

  setSubject: (s: SubjectKey) => void;
  setMeta: (m: Partial<ExamMeta>) => void;
  setQuestions: (q: Question[]) => void;
  setStudents: (s: Student[]) => void;
  setTaxonomy: (t: Category[]) => void;
  setRosterText: (t: string) => void;
  verifyQuestion: (number: number) => void;
  reset: () => void;
}

function taxonomyFor(key: SubjectKey): Category[] {
  return SUBJECTS[key].defaultTaxonomy.map((c) => ({ ...c, questionCount: 0 }));
}

const emptyMeta: ExamMeta = {
  title: "", grade: "", examDate: new Date().toISOString().slice(0, 10),
  teacher: "", totalMarks: 100,
};

/** IndexedDB rather than localStorage: papers and question text outgrow the 5MB quota. */
const idbStorage = createJSONStorage(() => ({
  getItem: async (name: string) => (await idbGet(name)) ?? null,
  setItem: async (name: string, value: string) => { await idbSet(name, value); },
  removeItem: async (name: string) => { await idbDel(name); },
}));

export const useSession = create<SessionState>()(
  persist(
    (set) => ({
      subject: "english",
      meta: emptyMeta,
      questions: [],
      students: [],
      taxonomy: taxonomyFor("english"),
      rosterText: "",

      setSubject: (subject) => set({ subject, taxonomy: taxonomyFor(subject) }),
      setMeta: (m) => set((s) => ({ meta: { ...s.meta, ...m } })),
      setQuestions: (questions) => set({ questions }),
      setStudents: (students) => set({ students }),
      setTaxonomy: (taxonomy) => set({ taxonomy }),
      setRosterText: (rosterText) => set({ rosterText }),
      verifyQuestion: (number) =>
        set((s) => ({
          questions: s.questions.map((q) => (q.number === number ? { ...q, verified: true } : q)),
        })),
      reset: () =>
        set({ meta: emptyMeta, questions: [], students: [], rosterText: "",
              taxonomy: taxonomyFor("english"), subject: "english" }),
    }),
    { name: "lizhi-session", storage: idbStorage, version: 1 },
  ),
);
