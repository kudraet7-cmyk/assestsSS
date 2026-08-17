"use client";

import Link from "next/link";
import { useState } from "react";
import { PROVIDERS, PROVIDER_ORDER, estimateCost, type Workload } from "@/lib/ai/providers";

export default function ProvidersPage() {
  const [w, setW] = useState<Workload>({
    questionCount: 70, studentCount: 40, pageCount: 2, weakCategories: 6,
  });

  const rows = PROVIDER_ORDER
    .filter((id) => id !== "openai-compatible")
    .map((id) => ({ spec: PROVIDERS[id], cost: estimateCost(PROVIDERS[id], w) }))
    .sort((a, b) => a.cost.cny - b.cost.cny);

  const cheapest = rows[0];
  const field = (k: keyof Workload, label: string, max: number) => (
    <label key={k} className="block">
      <span className="font-mono text-[9.5px] uppercase tracking-[0.12em] text-[var(--tx-3)]">{label}</span>
      <input type="number" min={1} max={max} value={w[k]}
        onChange={(e) => setW({ ...w, [k]: Math.max(1, Math.min(max, Number(e.target.value) || 1)) })}
        className="mt-1 w-full rounded-lg border border-[var(--line)] bg-[var(--panel-2)] px-3 py-2 font-mono text-[14px] tabular-nums text-[var(--tx)] outline-none focus:border-[color-mix(in_srgb,var(--cyan)_55%,transparent)]" />
    </label>
  );

  return (
    <div className="relative mx-auto max-w-5xl px-5 py-14">
      <Link href="/paper" className="mb-6 inline-block font-mono text-[11px] uppercase tracking-[0.16em] text-[var(--tx-3)] no-underline hover:text-[var(--tx-2)]">
        ← 返回砺知
      </Link>
      <h1 className="m-0 text-[30px] font-semibold tracking-[-0.02em]">选择模型服务商</h1>
      <p className="mt-3 max-w-[62ch] text-[14.5px] leading-relaxed text-[var(--tx-2)]">
        砺知不绑定任何一家。DeepSeek、通义千问、Kimi、智谱都提供
        <b className="text-[var(--tx)]"> OpenAI 兼容接口</b>，所以换服务商只是改三个环境变量，
        不用改代码。下面按你的班级规模估算一次完整分析的成本。
      </p>

      <div className="mt-8 grid gap-3 sm:grid-cols-4">
        {field("questionCount", "题量", 300)}
        {field("studentCount", "学生数", 500)}
        {field("pageCount", "试卷页数", 20)}
        {field("weakCategories", "薄弱知识点", 30)}
      </div>

      <div className="mt-8 overflow-x-auto rounded-xl border border-[var(--line)]">
        <table className="w-full text-[13px]">
          <thead>
            <tr>
              {["服务商", "文本模型", "视觉", "每场考试", "每名学生", ""].map((h) => (
                <th key={h} className="whitespace-nowrap border-b border-[var(--line)] bg-[var(--panel)] px-4 py-2.5 text-left font-mono text-[9.5px] font-semibold uppercase tracking-[0.13em] text-[var(--tx-3)]">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(({ spec, cost }) => (
              <tr key={spec.id} className={spec.id === cheapest.spec.id ? "bg-[color-mix(in_srgb,var(--ok)_7%,transparent)]" : ""}>
                <td className="border-b border-[var(--line)] px-4 py-3">
                  <div className="font-medium text-[var(--tx)]">{spec.name}</div>
                  <div className="mt-0.5 max-w-[34ch] text-[11.5px] leading-relaxed text-[var(--tx-3)]">{spec.note}</div>
                </td>
                <td className="border-b border-[var(--line)] px-4 py-3 font-mono text-[11.5px] text-[var(--tx-2)]">{spec.textModel}</td>
                <td className="border-b border-[var(--line)] px-4 py-3 text-[12px] text-[var(--tx-2)]">
                  {spec.visionModel ? "✓" : <span className="text-[var(--warn)]">需另配</span>}
                </td>
                <td className="border-b border-[var(--line)] px-4 py-3 font-mono tabular-nums text-[var(--tx)]">¥{cost.cny.toFixed(2)}</td>
                <td className="border-b border-[var(--line)] px-4 py-3 font-mono tabular-nums text-[var(--tx-2)]">¥{cost.perStudent.toFixed(3)}</td>
                <td className="border-b border-[var(--line)] px-4 py-3">
                  {spec.id === cheapest.spec.id && (
                    <span className="whitespace-nowrap rounded-full border border-[color-mix(in_srgb,var(--ok)_40%,transparent)] px-2.5 py-0.5 text-[11px] text-[var(--ok)]">最低</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 grid gap-3.5 md:grid-cols-2">
        <div className="rounded-xl border border-[var(--line)] bg-[var(--panel)] p-5">
          <h2 className="m-0 mb-2.5 text-[14px] font-semibold">一次分析的 token 去向</h2>
          <table className="w-full text-[12.5px]">
            <tbody>
              {cheapest.cost.breakdown.map((b) => (
                <tr key={b.step} className="border-b border-[var(--line)] last:border-0">
                  <td className="py-2 text-[var(--tx-2)]">{b.step}</td>
                  <td className="py-2 text-right font-mono tabular-nums text-[var(--tx-3)]">
                    入 {(b.input / 1000).toFixed(1)}k · 出 {(b.output / 1000).toFixed(1)}k
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mb-0 mt-3 text-[11.5px] leading-relaxed text-[var(--tx-3)]">
            练习题库按<b className="text-[var(--tx-2)]">知识点</b>生成一次、全班复用，
            而不是每个学生调一次 —— 这一条就把 40 人班的调用量从约 40 次压到 3 次。
          </p>
        </div>

        <div className="rounded-xl border border-[var(--line)] bg-[var(--panel)] p-5">
          <h2 className="m-0 mb-2.5 text-[14px] font-semibold">切换服务商</h2>
          <pre className="m-0 overflow-x-auto rounded-lg border border-[var(--line)] bg-[var(--panel-2)] p-3.5 font-mono text-[11.5px] leading-relaxed text-[var(--tx-2)]">{`LLM_PROVIDER=deepseek
LLM_API_KEY=sk-...
# 可选，覆盖默认值
LLM_BASE_URL=https://api.deepseek.com/v1
LLM_TEXT_MODEL=deepseek-chat
LLM_VISION_MODEL=`}</pre>
          <p className="mb-0 mt-3 text-[11.5px] leading-relaxed text-[var(--tx-3)]">
            只在服务端读取，永不下发到浏览器。表中价格是配置里的估算值，
            <b className="text-[var(--tx-2)]">请以各服务商官网为准</b>；改一处即可全站生效。
          </p>
        </div>
      </div>
    </div>
  );
}
