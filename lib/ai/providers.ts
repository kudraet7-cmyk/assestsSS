/**
 * Provider-agnostic LLM layer.
 *
 * The important fact: DeepSeek, Qwen (DashScope), Moonshot, Zhipu GLM and
 * MiniMax all expose an **OpenAI-compatible** /chat/completions endpoint. So one
 * adapter covers all of them — a provider is just a base URL, a model name and a
 * key. Gemini needs its own adapter because its wire format differs.
 *
 * Nothing here is imported by client code; callers go through server routes.
 */

export type ProviderId =
  | "deepseek" | "qwen" | "moonshot" | "zhipu" | "openai-compatible" | "gemini";

export interface ProviderSpec {
  id: ProviderId;
  name: string;
  /** OpenAI-compatible base URL, or "" for providers with a bespoke wire format. */
  baseUrl: string;
  /** Cheap, high-volume work: categorising, practice, parent messages. */
  textModel: string;
  /** Reading a photographed paper. Empty when the provider has no vision model. */
  visionModel: string;
  /** Price per 1M tokens in CNY. Operator-supplied — vendors change these often. */
  price: { inputPerM: number; outputPerM: number };
  wire: "openai" | "gemini";
  note: string;
}

/**
 * Seed values. Treat `price` as a starting estimate to be checked against the
 * vendor's own page — the UI labels it as such rather than presenting it as fact.
 */
export const PROVIDERS: Record<ProviderId, ProviderSpec> = {
  deepseek: {
    id: "deepseek", name: "DeepSeek 深度求索",
    baseUrl: "https://api.deepseek.com/v1",
    textModel: "deepseek-chat", visionModel: "",
    price: { inputPerM: 2, outputPerM: 8 },
    wire: "openai",
    note: "最便宜的一档，中文强。没有视觉模型，需要搭配一个能读图的服务解析试卷照片。",
  },
  qwen: {
    id: "qwen", name: "通义千问 Qwen（阿里云百炼）",
    baseUrl: "https://dashscope.aliyuncs.com/compatible-mode/v1",
    textModel: "qwen-plus", visionModel: "qwen-vl-plus",
    price: { inputPerM: 4, outputPerM: 12 },
    wire: "openai",
    note: "文本与视觉齐全，国内访问稳定，适合做全流程主力。",
  },
  moonshot: {
    id: "moonshot", name: "Kimi 月之暗面",
    baseUrl: "https://api.moonshot.cn/v1",
    textModel: "moonshot-v1-8k", visionModel: "moonshot-v1-8k-vision-preview",
    price: { inputPerM: 12, outputPerM: 12 },
    wire: "openai",
    note: "长上下文友好，整卷一次塞进去不易截断。",
  },
  zhipu: {
    id: "zhipu", name: "智谱 GLM",
    baseUrl: "https://open.bigmodel.cn/api/paas/v4",
    textModel: "glm-4-flash", visionModel: "glm-4v-flash",
    price: { inputPerM: 1, outputPerM: 1 },
    wire: "openai",
    note: "flash 系列价格极低，适合先跑通流程再换更强的模型。",
  },
  "openai-compatible": {
    id: "openai-compatible", name: "自定义（OpenAI 兼容）",
    baseUrl: "", textModel: "", visionModel: "",
    price: { inputPerM: 0, outputPerM: 0 },
    wire: "openai",
    note: "填入任意兼容 /chat/completions 的服务，包括自建或私有部署。",
  },
  gemini: {
    id: "gemini", name: "Google Gemini",
    baseUrl: "https://generativelanguage.googleapis.com/v1beta",
    textModel: "gemini-flash-latest", visionModel: "gemini-flash-latest",
    price: { inputPerM: 2.2, outputPerM: 8.8 },
    wire: "gemini",
    note: "视觉与结构化输出都强；国内访问通常需要代理。",
  },
};

export const PROVIDER_ORDER: ProviderId[] = [
  "zhipu", "deepseek", "qwen", "moonshot", "gemini", "openai-compatible",
];

/* ── token budget ─────────────────────────────────────────────
   Measured against the shape of the pipeline rather than guessed:
   one vision pass over the paper, one categorisation pass, one
   practice-bank pass, and one batched parent-message pass. */

export interface Workload {
  questionCount: number;
  studentCount: number;
  /** Pages of the paper to read with a vision model. */
  pageCount: number;
  /** Weak categories across the class — drives the practice bank. */
  weakCategories: number;
}

export interface CostEstimate {
  inputTokens: number;
  outputTokens: number;
  cny: number;
  perStudent: number;
  breakdown: { step: string; input: number; output: number }[];
}

const IMAGE_TOKENS = 1600;      // one scanned A4 page through a vision model
const TOKENS_PER_QUESTION = 70; // stem + options + answer, extracted
const TOKENS_PER_EXERCISE = 90;
const EXERCISES_PER_CATEGORY = 6;
const TOKENS_PER_MESSAGE = 380;

export function estimateWorkload(w: Workload): { input: number; output: number; breakdown: CostEstimate["breakdown"] } {
  const paperTokens = w.questionCount * TOKENS_PER_QUESTION;

  const breakdown = [
    { step: "解析原卷（视觉）", input: w.pageCount * IMAGE_TOKENS + 400, output: paperTokens },
    { step: "答案配对与知识点归类", input: paperTokens + 600, output: Math.round(paperTokens * 0.5) },
    // Generated once per category and reused across the class — see PLAN.md §3.2.
    { step: "练习题库（按知识点，非按学生）", input: 1200, output: w.weakCategories * EXERCISES_PER_CATEGORY * TOKENS_PER_EXERCISE },
    { step: "家长话术（批量）", input: w.studentCount * 90, output: w.studentCount * TOKENS_PER_MESSAGE },
  ];

  return {
    input: breakdown.reduce((a, b) => a + b.input, 0),
    output: breakdown.reduce((a, b) => a + b.output, 0),
    breakdown,
  };
}

export function estimateCost(p: ProviderSpec, w: Workload): CostEstimate {
  const { input, output, breakdown } = estimateWorkload(w);
  const cny = (input / 1e6) * p.price.inputPerM + (output / 1e6) * p.price.outputPerM;
  return {
    inputTokens: input,
    outputTokens: output,
    cny,
    perStudent: w.studentCount ? cny / w.studentCount : 0,
    breakdown,
  };
}

/** Reads the configured provider from the environment. Server-side only. */
export function activeProvider(): { spec: ProviderSpec; apiKey: string | null } {
  const id = (process.env.LLM_PROVIDER as ProviderId) || "gemini";
  const spec = PROVIDERS[id] ?? PROVIDERS.gemini;
  return {
    spec: {
      ...spec,
      baseUrl: process.env.LLM_BASE_URL || spec.baseUrl,
      textModel: process.env.LLM_TEXT_MODEL || spec.textModel,
      visionModel: process.env.LLM_VISION_MODEL || spec.visionModel,
    },
    apiKey: process.env.LLM_API_KEY || process.env.GEMINI_API_KEY || null,
  };
}
