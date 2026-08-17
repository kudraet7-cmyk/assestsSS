import { describe, it, expect } from "vitest";
import { PLANS, checkLimits, canExport, watermarked, yearlyDiscount, formatLimit } from "./plans";

const usage = (o: Partial<{ studentCount: number; examsThisMonth: number; classCount: number }> = {}) =>
  ({ studentCount: 1, examsThisMonth: 1, classCount: 1, ...o });

describe("checkLimits", () => {
  it("lets an ordinary individual-plan exam through", () => {
    expect(checkLimits("individual", usage({ studentCount: 30, classCount: 3 }))).toEqual([]);
  });

  it("blocks a class one student over the individual cap", () => {
    const [breach] = checkLimits("individual", usage({ studentCount: 31 }));
    expect(breach.code).toBe("students");
    expect(breach.upgradeTo).toBe("enterprise");
    expect(breach.message).toContain("31");
    expect(breach.message).toContain("30");
  });

  it("names the cheapest plan that clears the breach, not always the top one", () => {
    const [breach] = checkLimits("trial", usage({ studentCount: 22 }));
    expect(breach.upgradeTo).toBe("individual");
  });

  it("reports every breach at once so the user sees the whole gap", () => {
    const breaches = checkLimits("trial", usage({ studentCount: 40, examsThisMonth: 5, classCount: 4 }));
    expect(breaches.map((b) => b.code).sort()).toEqual(["classes", "exams", "students"]);
  });

  it("never blocks the enterprise plan on volume", () => {
    expect(checkLimits("enterprise", usage({ studentCount: 5000, examsThisMonth: 400, classCount: 90 }))).toEqual([]);
  });

  it("treats the caps as inclusive", () => {
    expect(checkLimits("trial", usage({ studentCount: 15 }))).toEqual([]);
    expect(checkLimits("trial", usage({ studentCount: 16 }))).toHaveLength(1);
  });
});

describe("export gating", () => {
  it("allows export only when nothing is breached", () => {
    expect(canExport("individual", usage({ studentCount: 30 }))).toBe(true);
    expect(canExport("individual", usage({ studentCount: 31 }))).toBe(false);
  });

  it("watermarks the trial and nothing else", () => {
    expect(watermarked("trial")).toBe(true);
    expect(watermarked("individual")).toBe(false);
    expect(watermarked("enterprise")).toBe(false);
  });
});

describe("pricing helpers", () => {
  it("renders an unlimited cap as 不限 rather than Infinity", () => {
    expect(formatLimit(PLANS.enterprise.maxStudents)).toBe("不限");
    expect(formatLimit(30)).toBe("30");
  });

  it("computes the annual discount", () => {
    expect(yearlyDiscount(PLANS.individual)).toBe(17); // 790 vs 948
    expect(yearlyDiscount(PLANS.trial)).toBeNull();
  });
});
