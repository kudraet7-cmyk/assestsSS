"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useSession } from "@/lib/store";
import { SUBJECT_ORDER, SUBJECTS } from "@/lib/subjects";
import { PlanBadge } from "@/components/Paywall";

export const STEPS = [
  { href: "/paper",    zh: "上传试卷原卷", en: "Paper" },
  { href: "/answers",  zh: "上传答案",     en: "Answer key" },
  { href: "/wrong",    zh: "录入错题号",   en: "Wrong Q nos." },
  { href: "/analysis", zh: "班级分析",     en: "Analyze" },
  { href: "/export",   zh: "导出文档",     en: "Export" },
];

function Mark() {
  return (
    <span className="grid h-[26px] w-[26px] shrink-0 place-items-center rounded-[7px] [background:var(--grad)] shadow-[0_0_18px_-4px_rgba(34,211,238,0.55)]">
      <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden>
        <path d="M2.5 13 L13 3" stroke="var(--on-accent)" strokeWidth="1.9" strokeLinecap="round" />
        <path d="M2.5 13 L6.6 12.2 L13 3 L10.4 2.2 Z" fill="var(--on-accent)" opacity=".45" />
        <circle cx="11.7" cy="4.3" r="1.35" fill="var(--on-accent)" />
      </svg>
    </span>
  );
}

function ThemeToggle() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  useEffect(() => {
    const t = document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark";
    setTheme(t);
  }, []);
  const apply = (t: "dark" | "light") => {
    setTheme(t);
    document.documentElement.setAttribute("data-theme", t);
    try { localStorage.setItem("lizhi-theme", t); } catch {}
  };
  return (
    <div className="flex rounded-full border border-[var(--line)] bg-[var(--panel)] p-0.5" role="group" aria-label="主题">
      {(["dark", "light"] as const).map((t) => (
        <button key={t} onClick={() => apply(t)} aria-pressed={theme === t}
          className={`rounded-full px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.1em] transition ${
            theme === t ? "bg-[var(--panel-2)] text-[var(--tx)]" : "text-[var(--tx-3)] hover:text-[var(--tx-2)]"}`}>
          {t}
        </button>
      ))}
    </div>
  );
}

export function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const subject = useSession((s) => s.subject);
  const setSubject = useSession((s) => s.setSubject);
  const meta = useSession((s) => s.meta);
  const students = useSession((s) => s.students);
  const plan = useSession((s) => s.plan);

  const current = Math.max(0, STEPS.findIndex((s) => pathname.startsWith(s.href)));

  return (
    <div className="relative grid min-h-screen grid-cols-1 grid-rows-[auto_1fr] md:grid-cols-[218px_1fr]">
      {/* top bar */}
      <header className="col-span-full flex h-[58px] items-center gap-4 border-b border-[var(--line)] px-5 backdrop-blur-md"
              style={{ background: "color-mix(in srgb, var(--bg) 82%, transparent)" }}>
        <Link href="/paper" className="flex items-center gap-2.5 no-underline text-inherit">
          <Mark />
          <span>
            <span className="block text-[15px] font-semibold tracking-[-0.01em]">砺知</span>
            <span className="-mt-px block font-mono text-[9.5px] uppercase tracking-[0.16em] text-[var(--tx-3)]">Lì Zhī</span>
          </span>
        </Link>
        <div className="ml-3 hidden border-l border-[var(--line)] pl-4 text-[12.5px] text-[var(--tx-2)] lg:block">
          {meta.title || "未命名试卷"}
          {students.length > 0 && <> · <b className="font-medium text-[var(--tx)]">{students.length} 份卷面</b></>}
        </div>
        <div className="ml-auto flex items-center gap-2.5">
          <div className="flex rounded-full border border-[var(--line)] bg-[var(--panel)] p-0.5" role="group" aria-label="学科">
            {SUBJECT_ORDER.map((k) => (
              <button key={k} onClick={() => setSubject(k)} aria-pressed={subject === k}
                className={`rounded-full px-3 py-1 text-[12px] transition ${
                  subject === k
                    ? "font-semibold text-[var(--on-accent)] [background:var(--grad)]"
                    : "text-[var(--tx-3)] hover:text-[var(--tx-2)]"}`}>
                {SUBJECTS[k].nameZh}
              </button>
            ))}
          </div>
          <PlanBadge planId={plan} />
          <ThemeToggle />
        </div>
      </header>

      {/* rail */}
      <nav className="hidden border-r border-[var(--line)] py-5 md:block" aria-label="流程">
        <div className="px-5 pb-3.5 font-mono text-[9.5px] uppercase tracking-[0.18em] text-[var(--tx-3)]">
          流程 / workflow
        </div>
        <div className="relative">
          <span className="absolute left-[37px] top-5 bottom-5 w-px bg-[var(--line)]" aria-hidden />
          {STEPS.map((s, i) => {
            const on = i === current, done = i < current;
            return (
              <Link key={s.href} href={s.href}
                className="relative flex w-full items-start gap-3 py-2.5 pl-5 pr-4 no-underline text-inherit group">
                {on && <span className="absolute left-0 top-2 bottom-2 w-0.5 rounded-r-sm [background:var(--grad)]" aria-hidden />}
                <span className={`relative z-10 grid h-[27px] w-[27px] shrink-0 place-items-center rounded-full border font-mono text-[11px] transition ${
                  on ? "border-transparent font-bold text-[var(--on-accent)] [background:var(--grad)] shadow-[0_0_0_4px_color-mix(in_srgb,var(--cyan)_12%,transparent)]"
                     : done ? "border-[color-mix(in_srgb,var(--cyan)_40%,transparent)] bg-[var(--panel-2)] text-[var(--cyan)]"
                            : "border-[var(--line-2)] bg-[var(--panel)] text-[var(--tx-3)]"}`}>
                  {i + 1}
                </span>
                <span className={`pt-0.5 text-[13.5px] transition ${on ? "font-semibold text-[var(--tx)]" : "text-[var(--tx-2)] group-hover:text-[var(--tx)]"}`}>
                  {s.zh}
                  <small className="block font-mono text-[10.5px] tracking-[0.04em] text-[var(--tx-3)]">{s.en}</small>
                </span>
              </Link>
            );
          })}
        </div>
        <div className="mt-5 border-t border-[var(--line)] px-5 pt-4">
          <div className="flex gap-2 text-[11px] leading-snug text-[var(--tx-3)]">
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none" className="mt-0.5 shrink-0" aria-hidden>
              <path d="M8 1.5 L13.5 4 V8 C13.5 11.2 11 13.7 8 14.5 C5 13.7 2.5 11.2 2.5 8 V4 Z"
                    stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
            </svg>
            <span><b className="font-semibold text-[var(--tx-2)]">学生姓名不出本机。</b>发送给模型的只有匿名错题模式，姓名在本地写回文档。</span>
          </div>
        </div>
      </nav>

      <main className="min-h-0 overflow-y-auto px-5 pb-16 pt-6 md:px-7">{children}</main>
    </div>
  );
}
