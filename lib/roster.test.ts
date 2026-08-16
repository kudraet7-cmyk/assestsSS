import { describe, it, expect } from "vitest";
import { parseRoster } from "./roster";

describe("parseRoster", () => {
  it("accepts every separator a teacher might actually type", () => {
    const { students, issues } = parseRoster(
      ["王小明: 3,7,12", "李思思：2、3、15", "张伟 3 7 9", "陈静,4,11"].join("\n"),
    );
    expect(issues.filter((i) => i.level === "error")).toHaveLength(0);
    expect(students.map((s) => s.name)).toEqual(["王小明", "李思思", "张伟", "陈静"]);
    expect(students[0].wrongQuestions).toEqual([3, 7, 12]);
    expect(students[1].wrongQuestions).toEqual([2, 3, 15]);
    expect(students[2].wrongQuestions).toEqual([3, 7, 9]);
    expect(students[3].wrongQuestions).toEqual([4, 11]);
  });

  it("treats 无 / 满分 / - as zero wrong", () => {
    const { students } = parseRoster("刘洋: 无\n周明: 满分\n吴磊: -");
    expect(students.every((s) => s.wrongQuestions.length === 0)).toBe(true);
    expect(students).toHaveLength(3);
  });

  it("expands ranges and says so", () => {
    const { students } = parseRoster("孙悦: 3-5,12");
    expect(students[0].wrongQuestions).toEqual([3, 4, 5, 12]);
    expect(students[0].notes.join()).toContain("展开");
  });

  it("captures the chosen option without losing the number", () => {
    const { students } = parseRoster("浦绎心: 30B,62C,15");
    expect(students[0].wrongQuestions).toEqual([15, 30, 62]);
    expect(students[0].chosenOptions).toEqual({ 30: "B", 62: "C" });
  });

  it("flags out-of-range numbers and drops them", () => {
    const { students, issues } = parseRoster("孙悦: 30,71", { maxQuestion: 70 });
    expect(students[0].wrongQuestions).toEqual([30]);
    expect(issues.some((i) => i.level === "error" && i.message.includes("71"))).toBe(true);
  });

  it("warns on duplicate names but keeps both rows", () => {
    const { students, issues } = parseRoster("王小明: 3\n王小明: 7");
    expect(students).toHaveLength(2);
    expect(issues.some((i) => i.level === "warning" && i.message.includes("重复"))).toBe(true);
  });

  it("merges duplicate question numbers within a row", () => {
    const { students, issues } = parseRoster("王小明: 3,3,7");
    expect(students[0].wrongQuestions).toEqual([3, 7]);
    expect(issues.some((i) => i.message.includes("重复"))).toBe(true);
  });

  it("reads an optional subjective deduction", () => {
    const { students } = parseRoster("浦绎心: 30B,62C | 主观 13.5");
    expect(students[0].subjectiveDeduction).toBe(13.5);
    expect(students[0].wrongQuestions).toEqual([30, 62]);
  });

  it("never throws on junk, and reports it instead", () => {
    const { students, issues } = parseRoster("王小明: 3,abc,7\n\n   \n: 5");
    expect(students[0].wrongQuestions).toEqual([3, 7]);
    expect(issues.some((i) => i.message.includes("abc"))).toBe(true);
    expect(issues.some((i) => i.message.includes("没有姓名"))).toBe(true);
  });

  it("rejects a reversed range rather than looping forever", () => {
    const { students, issues } = parseRoster("王小明: 9-3");
    expect(students[0].wrongQuestions).toEqual([]);
    expect(issues.some((i) => i.level === "error")).toBe(true);
  });
});

describe("optional trailing segments", () => {
  it("reads a score", () => {
    const { students } = parseRoster("浦绎心: 30,62 | 分 84.5");
    expect(students[0].score).toBe(84.5);
  });

  it("reads subjective loss and score together, in either order", () => {
    const a = parseRoster("甲: 3 | 主观 13.5 | 分 84.5").students[0];
    const b = parseRoster("乙: 3 | 分 84.5 | 主观 13.5").students[0];
    expect([a.score, a.subjectiveDeduction]).toEqual([84.5, 13.5]);
    expect([b.score, b.subjectiveDeduction]).toEqual([84.5, 13.5]);
  });

  it("warns about an unrecognised segment without losing the row", () => {
    const { students, issues } = parseRoster("丙: 3 | 天气不错");
    expect(students[0].wrongQuestions).toEqual([3]);
    expect(issues.some((i) => i.level === "warning")).toBe(true);
  });
});
