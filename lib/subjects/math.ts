import type { SubjectPack } from "../types";

/**
 * 数学. Two things are unique here: formulas must be typeset (LaTeX) rather than
 * screenshotted, and numeric answers can be recomputed and checked — the strongest
 * hallucination guard in the product. See lib/numeric-check.ts.
 */
export const math: SubjectPack = {
  key: "math",
  nameZh: "数学",
  questionTypes: ["choice", "fill", "calculation", "short"],
  subjectiveMarksPerQuestion: 2.5,
  needsLatex: true,
  supportsNumericCheck: true,
  neverAutoGrade: false,
  defaultTaxonomy: [
    { id: "ma-fenshu",   nameZh: "分数四则运算" },
    { id: "ma-bili",     nameZh: "比与比例" },
    { id: "ma-yuan",     nameZh: "圆的周长与面积" },
    { id: "ma-baifen",   nameZh: "百分数应用" },
    { id: "ma-fangwei",  nameZh: "位置与方向" },
    { id: "ma-jiejue",   nameZh: "解决问题·综合", subjective: true },
  ],
};
