import type { SubjectPack } from "../types";

/**
 * 英语. Errors cluster in *groups* of collocations — prepositions, phrasal verbs,
 * connectives. One question in isolation shows nothing; the class-wide distribution
 * makes the pattern obvious, which is why same-family collocations share a category.
 */
export const english: SubjectPack = {
  key: "english",
  nameZh: "英语",
  questionTypes: ["choice", "fill", "short", "essay"],
  subjectiveMarksPerQuestion: 1.5,
  needsLatex: false,
  supportsNumericCheck: false,
  neverAutoGrade: false,
  defaultTaxonomy: [
    { id: "en-dapei",   nameZh: "固定搭配与连词" },
    { id: "en-duanyu",  nameZh: "短语辨析" },
    { id: "en-shitai",  nameZh: "时态与语态" },
    { id: "en-xijie",   nameZh: "阅读·细节定位" },
    { id: "en-zhuzhi",  nameZh: "阅读·主旨大意" },
    { id: "en-zonghe",  nameZh: "词汇与语法综合" },
    { id: "en-xiezuo",  nameZh: "书面表达", subjective: true },
  ],
};
