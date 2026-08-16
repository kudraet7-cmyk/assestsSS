import type { SubjectKey, SubjectPack } from "../types";
import { chinese } from "./chinese";
import { math } from "./math";
import { english } from "./english";

export const SUBJECTS: Record<SubjectKey, SubjectPack> = { chinese, math, english };
export const SUBJECT_ORDER: SubjectKey[] = ["chinese", "math", "english"];

export function getSubject(key: SubjectKey): SubjectPack {
  return SUBJECTS[key];
}
