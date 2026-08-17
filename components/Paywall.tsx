"use client";

import Link from "next/link";
import { PLANS, type LimitBreach } from "@/lib/plans";

/**
 * Shown inline where the limit actually bites, never as a modal over the whole
 * app. It states the number, names the plan that lifts it, and says what that
 * costs — a paywall that explains itself converts; a greyed-out button does not.
 */
export function LimitNotice({ breaches }: { breaches: LimitBreach[] }) {
  if (!breaches.length) return null;
  const target = breaches.find((b) => b.upgradeTo)?.upgradeTo;
  const plan = target ? PLANS[target] : null;

  return (
    <div className="rounded-xl border border-[color-mix(in_srgb,var(--warn)_45%,transparent)] bg-[color-mix(in_srgb,var(--warn)_8%,transparent)] p-4">
      <div className="mb-2 flex items-center gap-2 text-[13px] font-semibold text-[var(--warn)]">
        <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden>
          <path d="M4.5 7V5a3.5 3.5 0 1 1 7 0v2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
          <rect x="3" y="7" width="10" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
        </svg>
        超出当前套餐额度
      </div>
      <ul className="m-0 mb-3 list-none space-y-1.5 p-0">
        {breaches.map((b) => (
          <li key={b.code} className="text-[12.5px] leading-relaxed text-[var(--tx-2)]">· {b.message}</li>
        ))}
      </ul>
      {plan ? (
        <Link href="/pricing">
          <span className="inline-flex items-center gap-2 rounded-lg border border-transparent px-4 py-2 text-[13px] font-semibold text-[var(--on-accent)] [background:var(--grad)]">
            升级到{plan.nameZh} · ¥{plan.priceMonthly}/月 →
          </span>
        </Link>
      ) : (
        <Link href="/pricing" className="text-[12.5px] text-[var(--cyan)]">查看套餐 →</Link>
      )}
    </div>
  );
}

/** Small always-on indicator in the top bar. */
export function PlanBadge({ planId }: { planId: keyof typeof PLANS }) {
  const plan = PLANS[planId];
  const paid = planId !== "trial";
  return (
    <Link href="/pricing"
      className={`rounded-full border px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.1em] no-underline transition ${
        paid
          ? "border-[color-mix(in_srgb,var(--cyan)_40%,transparent)] text-[var(--cyan)]"
          : "border-[var(--line-2)] text-[var(--tx-3)] hover:text-[var(--tx-2)]"}`}>
      {plan.nameZh}
    </Link>
  );
}
