"use client";

import type { ReactNode } from "react";

export function Card({ title, right, children, className = "" }: {
  title?: string; right?: ReactNode; children: ReactNode; className?: string;
}) {
  return (
    <div className={`rounded-xl border border-[var(--line)] bg-[var(--panel)] p-5 ${className}`}>
      {title && (
        <div className="mb-3.5 flex items-baseline gap-2.5 font-mono text-[10px] uppercase tracking-[0.15em] text-[var(--tx-3)]">
          <span>{title}</span>
          {right && <span className="ml-auto normal-case tracking-normal text-[10.5px]">{right}</span>}
        </div>
      )}
      {children}
    </div>
  );
}

export function Button({ variant = "ghost", children, ...rest }:
  { variant?: "ghost" | "primary" } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const base = "inline-flex items-center gap-2 rounded-lg px-4 py-2 text-[13px] font-medium transition disabled:opacity-40 disabled:cursor-not-allowed";
  const styles = variant === "primary"
    ? "border border-transparent text-[var(--on-accent)] font-semibold [background:var(--grad)] hover:brightness-110 shadow-[0_3px_18px_-6px_rgba(34,211,238,0.7)]"
    : "border border-[var(--line-2)] bg-[var(--panel)] text-[var(--tx)] hover:border-[var(--tx-3)]";
  return <button className={`${base} ${styles}`} {...rest}>{children}</button>;
}

export function Pill({ tone = "muted", children }: {
  tone?: "muted" | "ok" | "warn" | "crit"; children: ReactNode;
}) {
  const tones = {
    muted: "border-[var(--line-2)] text-[var(--tx-2)]",
    ok: "border-[color-mix(in_srgb,var(--ok)_40%,transparent)] text-[var(--ok)]",
    warn: "border-[color-mix(in_srgb,var(--warn)_40%,transparent)] text-[var(--warn)]",
    crit: "border-[color-mix(in_srgb,var(--crit)_45%,transparent)] text-[var(--crit)]",
  }[tone];
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border bg-[var(--panel-2)] px-2.5 py-0.5 text-[11px] ${tones}`}>
      {children}
    </span>
  );
}

export function PageHead({ title, sub, actions }: {
  title: string; sub?: ReactNode; actions?: ReactNode;
}) {
  return (
    <div className="mb-5 flex items-end gap-4">
      <div>
        <h1 className="m-0 text-[21px] font-semibold tracking-[-0.015em]">{title}</h1>
        {sub && <div className="mt-1 text-[12.5px] text-[var(--tx-2)]">{sub}</div>}
      </div>
      {actions && <div className="ml-auto flex gap-2.5">{actions}</div>}
    </div>
  );
}

export function Stat({ label, value, unit, detail, tone }: {
  label: string; value: string | number; unit?: string; detail?: string; tone?: string;
}) {
  return (
    <div className="rounded-xl border border-[var(--line)] bg-[var(--panel)] px-4 py-3.5">
      <div className="font-mono text-[9.5px] uppercase tracking-[0.13em] text-[var(--tx-3)]">{label}</div>
      <div className="mt-1.5 text-[25px] font-semibold leading-none tracking-[-0.02em] tabular-nums"
           style={tone ? { color: tone } : undefined}>
        {value}
        {unit && <small className="text-[12px] font-normal text-[var(--tx-3)]">{unit}</small>}
      </div>
      {detail && <div className="mt-1.5 text-[11px] text-[var(--tx-3)]">{detail}</div>}
    </div>
  );
}

export function Note({ children }: { children: ReactNode }) {
  return (
    <div className="mt-3 flex gap-2 text-[11.5px] leading-relaxed text-[var(--tx-3)]">
      <svg width="13" height="13" viewBox="0 0 16 16" fill="none" className="mt-0.5 shrink-0" aria-hidden>
        <circle cx="8" cy="8" r="6.6" stroke="currentColor" strokeWidth="1.2" />
        <path d="M8 7.2v4M8 4.9v.9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
      <span>{children}</span>
    </div>
  );
}
