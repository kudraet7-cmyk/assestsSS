/**
 * Forgiving parser for the 录入错题号 step.
 *
 * One line per student. Everything about the format is tolerant, because the
 * teacher is typing this off a marked stack of papers at 10pm:
 *
 *   王小明: 3,7,12,15
 *   李思思：2、3、15
 *   张伟 3 7 9 21
 *   浦绎心: 30B,62C            ← optional: the option they actually chose
 *   刘洋: 无                   ← 无 / 满分 / - / — all mean zero wrong
 *   孙悦: 3-5,12               ← ranges expand
 *   陈静: 4,11 | 主观 13.5      ← optional subjective marks lost
 *   周明: 4,11 | 分 84.5        ← optional total score; both segments may appear
 *
 * The parser never throws. Problems come back as structured issues so the UI can
 * show them inline against the offending row.
 */

export type IssueLevel = "error" | "warning";

export interface RosterIssue {
  line: number;
  level: IssueLevel;
  message: string;
}

export interface ParsedStudent {
  id: string;
  name: string;
  wrongQuestions: number[];
  chosenOptions?: Record<number, string>;
  subjectiveDeduction?: number;
  score?: number;
  line: number;
  /** Set when a shorthand was expanded, so the UI can say what it did. */
  notes: string[];
}

export interface RosterParseResult {
  students: ParsedStudent[];
  issues: RosterIssue[];
}

/** Separators between the name and the numbers, and between the numbers. */
const NAME_SPLIT = /[:：]/;
const NUM_SPLIT = /[,，、;；\s]+/;
const ZERO_WRONG = ["无", "满分", "全对", "none", "-", "—", "0"];

const RANGE = /^(\d+)\s*[-–—~]\s*(\d+)$/;
const NUM_WITH_OPTION = /^(\d+)\s*([A-Za-z])?$/;
const SUBJECTIVE = /主观\s*[-–—]?\s*([\d.]+)/;
const SCORE = /(?:分数?|得分)\s*[:：]?\s*([\d.]+)/;

export interface RosterParseOptions {
  /** Highest valid question number on this paper. Omit to skip range checking. */
  maxQuestion?: number;
}

export function parseRoster(
  input: string,
  opts: RosterParseOptions = {},
): RosterParseResult {
  const { maxQuestion } = opts;
  const students: ParsedStudent[] = [];
  const issues: RosterIssue[] = [];
  const seen = new Map<string, number>();

  const lines = input.split(/\r?\n/);

  lines.forEach((rawLine, i) => {
    const lineNo = i + 1;
    const line = rawLine.trim();
    if (!line) return;

    const notes: string[] = [];

    // Optional trailing "| 主观 13.5 | 分 84.5" segments, in any order.
    const [head, ...tailParts] = line.split("|");
    let body = head.trim();
    let subjectiveDeduction: number | undefined;
    let score: number | undefined;

    for (const raw of tailParts) {
      const seg = raw.trim();
      if (!seg) continue;
      const subj = seg.match(SUBJECTIVE);
      if (subj) {
        subjectiveDeduction = Number(subj[1]);
        notes.push(`主观失分 ${subjectiveDeduction} 分`);
        continue;
      }
      const sc = seg.match(SCORE);
      if (sc) {
        score = Number(sc[1]);
        notes.push(`得分 ${score}`);
        continue;
      }
      issues.push({ line: lineNo, level: "warning", message: `无法识别的附加信息：「${seg}」` });
    }

    // Split name from numbers. A colon wins. Failing that, the numbers start at
    // the first digit — which also handles "陈静,4,11" and "张伟 3 7 9" without
    // needing the teacher to be consistent about separators.
    let name: string;
    let rest: string;
    const colon = body.split(NAME_SPLIT);
    if (colon.length > 1) {
      name = colon[0].trim();
      rest = colon.slice(1).join(" ").trim();
    } else {
      const firstDigit = body.search(/\d/);
      if (firstDigit > 0) {
        name = body.slice(0, firstDigit).replace(/[\s,，、;；]+$/, "").trim();
        rest = body.slice(firstDigit).trim();
      } else {
        const sp = body.match(/^(\S+?)\s+(.*)$/);
        if (sp) {
          name = sp[1].trim();
          rest = sp[2].trim();
        } else {
          name = body;
          rest = "";
        }
      }
    }

    if (!name) {
      issues.push({ line: lineNo, level: "error", message: "这一行没有姓名" });
      return;
    }

    if (seen.has(name)) {
      issues.push({
        line: lineNo,
        level: "warning",
        message: `姓名「${name}」与第 ${seen.get(name)} 行重复`,
      });
    } else {
      seen.set(name, lineNo);
    }

    const wrongQuestions: number[] = [];
    const chosenOptions: Record<number, string> = {};

    if (rest && !ZERO_WRONG.includes(rest.toLowerCase())) {
      for (const tokenRaw of rest.split(NUM_SPLIT)) {
        const token = tokenRaw.trim().replace(/[。.,，、;；]+$/, "");
        if (!token) continue;
        if (ZERO_WRONG.includes(token.toLowerCase())) continue;

        const range = token.match(RANGE);
        if (range) {
          const from = Number(range[1]);
          const to = Number(range[2]);
          if (from > to) {
            issues.push({ line: lineNo, level: "error", message: `区间「${token}」的起止顺序反了` });
            continue;
          }
          if (to - from > 200) {
            issues.push({ line: lineNo, level: "error", message: `区间「${token}」过大` });
            continue;
          }
          for (let q = from; q <= to; q++) wrongQuestions.push(q);
          notes.push(`${token} 已展开为 ${from}–${to}`);
          continue;
        }

        const withOpt = token.match(NUM_WITH_OPTION);
        if (!withOpt) {
          issues.push({ line: lineNo, level: "error", message: `无法识别「${token}」` });
          continue;
        }
        const q = Number(withOpt[1]);
        wrongQuestions.push(q);
        if (withOpt[2]) chosenOptions[q] = withOpt[2].toUpperCase();
      }
    }

    // Range check + de-duplicate, preserving first-seen order.
    const unique: number[] = [];
    const dupes: number[] = [];
    for (const q of wrongQuestions) {
      if (unique.includes(q)) { dupes.push(q); continue; }
      if (maxQuestion !== undefined && (q < 1 || q > maxQuestion)) {
        issues.push({
          line: lineNo,
          level: "error",
          message: `第 ${q} 题超出题号范围（本卷 1–${maxQuestion}）`,
        });
        continue;
      }
      unique.push(q);
    }
    if (dupes.length) {
      issues.push({
        line: lineNo,
        level: "warning",
        message: `第 ${[...new Set(dupes)].join("、")} 题重复，已合并`,
      });
    }

    unique.sort((a, b) => a - b);

    students.push({
      id: `s${lineNo}`,
      name,
      wrongQuestions: unique,
      chosenOptions: Object.keys(chosenOptions).length ? chosenOptions : undefined,
      subjectiveDeduction,
      score,
      line: lineNo,
      notes,
    });
  });

  return { students, issues };
}
