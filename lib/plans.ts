/**
 * Plans and limits.
 *
 * Every number a customer feels lives in this one file, so changing the pricing
 * or the caps is a config edit, not a refactor. Gating is enforced through
 * `checkLimits`, which returns structured reasons the UI renders inline — a
 * paywall that says *why* converts; one that just greys a button does not.
 */

export type PlanId = "trial" | "individual" | "enterprise";

export interface Plan {
  id: PlanId;
  nameZh: string;
  /** Monthly price in CNY. 0 for the trial. */
  priceMonthly: number;
  /** Yearly price in CNY, when paid annually. */
  priceYearly?: number;
  /** Max students per exam. Infinity for unlimited. */
  maxStudents: number;
  /** Exams that may be analysed per calendar month. */
  maxExamsPerMonth: number;
  /** Saved classes. */
  maxClasses: number;
  team: boolean;
  features: string[];
  limitations: string[];
}

export const PLANS: Record<PlanId, Plan> = {
  trial: {
    id: "trial",
    nameZh: "体验",
    priceMonthly: 0,
    maxStudents: 15,
    maxExamsPerMonth: 1,
    maxClasses: 1,
    team: false,
    features: [
      "完整走通五步流程",
      "班级分析与难度／区分度",
      "个人诊断报告 1 份预览",
    ],
    limitations: [
      "每月 1 场考试",
      "最多 15 名学生",
      "导出的 PDF 带水印",
    ],
  },
  individual: {
    id: "individual",
    nameZh: "个人版",
    priceMonthly: 79,
    priceYearly: 790,
    maxStudents: 30,
    maxExamsPerMonth: Infinity,
    maxClasses: 3,
    team: false,
    features: [
      "不限考试场次",
      "四类文档全部导出，无水印",
      "语文 / 数学 / 英语 全科",
      "难度系数、区分度、干扰项分析",
      "知识点体系跨考试复用",
      "最多 3 个班级",
    ],
    limitations: [
      "每场考试最多 30 名学生",
      "无团队协作与权限管理",
      "无跨班级 / 年级汇总",
    ],
  },
  enterprise: {
    id: "enterprise",
    nameZh: "企业版",
    priceMonthly: 4999,
    priceYearly: 49990,
    maxStudents: Infinity,
    maxExamsPerMonth: Infinity,
    maxClasses: Infinity,
    team: true,
    features: [
      "学生人数不限",
      "班级、年级、学科不限",
      "教研组协作与权限管理",
      "跨班级 / 跨考试 横向对比",
      "年级与学科汇总报表",
      "统一账号与操作日志",
      "专属客服与培训",
      "支持对公转账与开票",
    ],
    limitations: [],
  },
};

export const PLAN_ORDER: PlanId[] = ["trial", "individual", "enterprise"];

export interface Usage {
  studentCount: number;
  examsThisMonth: number;
  classCount: number;
}

export type LimitCode = "students" | "exams" | "classes" | "team";

export interface LimitBreach {
  code: LimitCode;
  /** Shown directly to the user — say the number, name the plan that lifts it. */
  message: string;
  limit: number;
  actual: number;
  /** Cheapest plan that would clear this breach, if any. */
  upgradeTo?: PlanId;
}

/** The cheapest plan (in listed order) whose limit clears `actual`. */
function cheapestPlanFor(code: LimitCode, actual: number): PlanId | undefined {
  return PLAN_ORDER.find((id) => {
    const p = PLANS[id];
    if (code === "students") return actual <= p.maxStudents;
    if (code === "exams") return actual <= p.maxExamsPerMonth;
    if (code === "classes") return actual <= p.maxClasses;
    return p.team;
  });
}

export function checkLimits(planId: PlanId, usage: Usage): LimitBreach[] {
  const plan = PLANS[planId];
  const out: LimitBreach[] = [];

  if (usage.studentCount > plan.maxStudents) {
    out.push({
      code: "students",
      limit: plan.maxStudents,
      actual: usage.studentCount,
      upgradeTo: cheapestPlanFor("students", usage.studentCount),
      message: `本次录入 ${usage.studentCount} 名学生，${plan.nameZh}每场考试上限 ${plan.maxStudents} 名。`,
    });
  }

  if (usage.examsThisMonth > plan.maxExamsPerMonth) {
    out.push({
      code: "exams",
      limit: plan.maxExamsPerMonth,
      actual: usage.examsThisMonth,
      upgradeTo: cheapestPlanFor("exams", usage.examsThisMonth),
      message: `本月已分析 ${usage.examsThisMonth} 场考试，${plan.nameZh}每月上限 ${plan.maxExamsPerMonth} 场。`,
    });
  }

  if (usage.classCount > plan.maxClasses) {
    out.push({
      code: "classes",
      limit: plan.maxClasses,
      actual: usage.classCount,
      upgradeTo: cheapestPlanFor("classes", usage.classCount),
      message: `已保存 ${usage.classCount} 个班级，${plan.nameZh}上限 ${plan.maxClasses} 个。`,
    });
  }

  return out;
}

export function canExport(planId: PlanId, usage: Usage): boolean {
  return checkLimits(planId, usage).length === 0;
}

/** The trial watermarks its PDFs; paid plans do not. */
export function watermarked(planId: PlanId): boolean {
  return planId === "trial";
}

export function formatLimit(n: number): string {
  return n === Infinity ? "不限" : String(n);
}

/** Monthly-equivalent price when paying annually, for the "省两个月" line. */
export function yearlyDiscount(plan: Plan): number | null {
  if (!plan.priceYearly || !plan.priceMonthly) return null;
  const full = plan.priceMonthly * 12;
  return Math.round((1 - plan.priceYearly / full) * 100);
}
