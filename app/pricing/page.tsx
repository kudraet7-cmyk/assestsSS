"use client";

import Link from "next/link";
import { useState } from "react";
import { PLANS, PLAN_ORDER, formatLimit, yearlyDiscount } from "@/lib/plans";
import { useSession } from "@/lib/store";

export default function PricingPage() {
  const [yearly, setYearly] = useState(false);
  const plan = useSession((s) => s.plan);
  const setPlan = useSession((s) => s.setPlan);

  return (
    <div className="relative mx-auto max-w-6xl px-5 py-14">
      <div className="mb-10 text-center">
        <Link href="/paper" className="mb-6 inline-block font-mono text-[11px] uppercase tracking-[0.16em] text-[var(--tx-3)] no-underline hover:text-[var(--tx-2)]">
          ← 返回砺知
        </Link>
        <h1 className="m-0 text-[34px] font-semibold tracking-[-0.02em]">选择适合你的套餐</h1>
        <p className="mx-auto mt-3 max-w-[46ch] text-[15px] leading-relaxed text-[var(--tx-2)]">
          先用体验版把自己的一份真卷子跑完，再决定要不要付费。所有统计功能在体验版里都是完整的。
        </p>

        <div className="mt-7 inline-flex rounded-full border border-[var(--line)] bg-[var(--panel)] p-1">
          {[["按月", false], ["按年 · 省 2 个月", true]].map(([label, val]) => (
            <button key={String(val)} onClick={() => setYearly(val as boolean)}
              aria-pressed={yearly === val}
              className={`rounded-full px-4 py-1.5 text-[12.5px] transition ${
                yearly === val
                  ? "font-semibold text-[var(--on-accent)] [background:var(--grad)]"
                  : "text-[var(--tx-3)] hover:text-[var(--tx-2)]"}`}>
              {label as string}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {PLAN_ORDER.map((id) => {
          const p = PLANS[id];
          const featured = id === "individual";
          const price = yearly && p.priceYearly ? p.priceYearly : p.priceMonthly;
          const unit = p.priceMonthly === 0 ? "" : yearly ? "/年" : "/月";
          const off = yearlyDiscount(p);

          return (
            <div key={id}
              className={`relative flex flex-col rounded-2xl border p-6 ${
                featured
                  ? "border-[color-mix(in_srgb,var(--cyan)_45%,transparent)] bg-[var(--panel)] shadow-[0_0_40px_-20px_rgba(34,211,238,0.6)]"
                  : "border-[var(--line)] bg-[var(--panel)]"}`}>
              {featured && (
                <span className="absolute -top-3 left-6 rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--on-accent)] [background:var(--grad)]">
                  最常选择
                </span>
              )}

              <h2 className="m-0 text-[18px] font-semibold">{p.nameZh}</h2>

              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-[15px] text-[var(--tx-3)]">{p.priceMonthly === 0 ? "" : "¥"}</span>
                <span className="text-[38px] font-semibold leading-none tracking-[-0.03em] tabular-nums">
                  {p.priceMonthly === 0 ? "免费" : price.toLocaleString("zh-CN")}
                </span>
                <span className="text-[14px] text-[var(--tx-3)]">{unit}</span>
              </div>
              {yearly && off ? (
                <div className="mt-1.5 text-[11.5px] text-[var(--ok)]">较按月省 {off}%</div>
              ) : <div className="mt-1.5 h-[17px]" />}

              <dl className="mt-5 grid grid-cols-2 gap-y-2.5 border-y border-[var(--line)] py-4 text-[12px]">
                {[
                  ["学生 / 场", formatLimit(p.maxStudents)],
                  ["考试 / 月", formatLimit(p.maxExamsPerMonth)],
                  ["班级", formatLimit(p.maxClasses)],
                  ["团队协作", p.team ? "支持" : "—"],
                ].map(([k, v]) => (
                  <div key={k}>
                    <dt className="font-mono text-[9.5px] uppercase tracking-[0.12em] text-[var(--tx-3)]">{k}</dt>
                    <dd className="m-0 mt-0.5 text-[14px] font-semibold tabular-nums">{v}</dd>
                  </div>
                ))}
              </dl>

              <ul className="mt-4 mb-0 list-none space-y-2 p-0">
                {p.features.map((f) => (
                  <li key={f} className="flex gap-2 text-[12.5px] leading-relaxed text-[var(--tx-2)]">
                    <span className="mt-0.5 shrink-0 text-[var(--ok)]">✓</span>{f}
                  </li>
                ))}
                {p.limitations.map((l) => (
                  <li key={l} className="flex gap-2 text-[12.5px] leading-relaxed text-[var(--tx-3)]">
                    <span className="mt-0.5 shrink-0">·</span>{l}
                  </li>
                ))}
              </ul>

              <div className="mt-6 pt-2">
                {plan === id ? (
                  <span className="block rounded-lg border border-[var(--line-2)] py-2.5 text-center text-[13px] text-[var(--tx-3)]">
                    当前套餐
                  </span>
                ) : (
                  <button onClick={() => setPlan(id)}
                    className={`w-full rounded-lg py-2.5 text-center text-[13px] font-semibold transition ${
                      featured || id === "enterprise"
                        ? "text-[var(--on-accent)] [background:var(--grad)] hover:brightness-110"
                        : "border border-[var(--line-2)] text-[var(--tx)] hover:border-[var(--tx-3)]"}`}>
                    {id === "enterprise" ? "联系我们" : id === "trial" ? "切换到体验版" : `选择${p.nameZh}`}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <p className="mt-8 text-center text-[11.5px] leading-relaxed text-[var(--tx-3)]">
        企业版支持对公转账与开票，按学年签约。<br />
        支付接入尚未完成 —— 现在点击只会在本地切换套餐，方便你查看各档的限制表现。
      </p>
    </div>
  );
}
