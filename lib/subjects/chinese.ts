import type { SubjectPack } from "../types";

/**
 * 语文. The defining constraint: most marks are subjective (赏析, 概括, 习作).
 * The app never grades those — it files the deductions the teacher recorded by
 * knowledge point. Only 默写 and 字词 carry per-question error rates.
 */
export const chinese: SubjectPack = {
  key: "chinese",
  nameZh: "语文",
  questionTypes: ["choice", "fill", "dictation", "short", "essay"],
  subjectiveMarksPerQuestion: 2.0,
  needsLatex: false,
  supportsNumericCheck: false,
  neverAutoGrade: true,
  defaultTaxonomy: [
    { id: "zh-zici",    nameZh: "字词与拼音" },
    { id: "zh-bingju",  nameZh: "病句与标点" },
    { id: "zh-mosie",   nameZh: "古诗文默写" },
    { id: "zh-wenyan",  nameZh: "文言文阅读" },
    { id: "zh-xiandai", nameZh: "现代文·信息提取" },
    { id: "zh-shangxi", nameZh: "现代文·赏析", subjective: true },
    { id: "zh-xizuo",   nameZh: "习作", subjective: true },
  ],
};
