"use client";

import { useState, type ReactNode } from "react";
import type { Analysis } from "@/lib/analysis";

const pct = (v: number) => `${Math.round(v * 100)}%`;

/* Sequential ramp, one hue, validated against both surfaces (see PLAN.md §8). */
const RAMP = ["--s1", "--s2", "--s3", "--s4", "--s5"];
const step = (r: number) =>
  r <= 0.001 ? "var(--panel-2)" : `var(${RAMP[Math.min(4, Math.floor(r * 4.999))]})`;

function useTip() {
  const [tip, setTip] = useState<{ x: number; y: number; body: ReactNode } | null>(null);
  const bind = (body: ReactNode) => ({
    onMouseEnter: (e: React.MouseEvent) => setTip({ x: e.clientX, y: e.clientY, body }),
    onMouseMove: (e: React.MouseEvent) => setTip({ x: e.clientX, y: e.clientY, body }),
    onMouseLeave: () => setTip(null),
  });
  const node = tip ? (
    <div role="status"
      className="pointer-events-none fixed z-50 max-w-[240px] rounded-lg border border-[var(--line-2)] bg-[var(--panel)] px-3 py-2 text-[12px] text-[var(--tx)] shadow-[0_10px_30px_-8px_rgba(0,0,0,0.6)]"
      style={{ left: Math.min(tip.x + 14, (globalThis.innerWidth ?? 1200) - 250), top: tip.y - 56 }}>
      {tip.body}
    </div>
  ) : null;
  return { bind, node };
}

const AXIS = "font-mono text-[9.5px] fill-[var(--tx-3)]";
const LBL = "text-[11.5px] fill-[var(--tx-2)]";

/** Error rate by question — single series, threshold line at 50%. */
export function HardestQuestions({ analysis, catName }: { analysis: Analysis; catName: (id: string) => string }) {
  const { bind, node } = useTip();
  const rows = [...analysis.byQuestion].sort((a, b) => b.errorRate - a.errorRate).slice(0, 12);
  const n = analysis.classStats.studentCount;
  const W = 420, rowH = 22, padL = 46, padR = 40, top = 6;
  const H = top + rows.length * rowH + 16, w = W - padL - padR;

  return (
    <>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} role="img"
           aria-label="错误率最高的题目" style={{ overflow: "visible" }}>
        {rows.map((q, i) => {
          const y = top + i * rowH;
          return (
            <g key={q.number}>
              <text x={padL - 8} y={y + 12} textAnchor="end" className={LBL}>第{q.number}题</text>
              <rect x={padL} y={y + 4} width={w} height={10} rx={4} className="fill-[var(--line)]" />
              <rect x={padL} y={y + 4} width={Math.max(4, w * q.errorRate)} height={10} rx={4}
                    className="fill-[var(--mark)] hover:fill-[var(--s4)]"
                    {...bind(<><b className="mb-0.5 block">第 {q.number} 题</b>
                      <span className="block font-mono text-[11px] text-[var(--tx-3)]">{catName(q.categoryId)}</span>
                      <span className="block font-mono text-[11px] text-[var(--tx-3)]">{q.wrongCount} / {n} 人做错 · {pct(q.errorRate)}</span></>)} />
              <text x={padL + w + 7} y={y + 12} className={AXIS}>{pct(q.errorRate)}</text>
            </g>
          );
        })}
        <line x1={padL + w * 0.5} y1={top - 2} x2={padL + w * 0.5} y2={top + rows.length * rowH}
              stroke="var(--crit)" strokeWidth={1} strokeDasharray="3 3" opacity={0.8} />
        <text x={padL + w * 0.5} y={H - 4} textAnchor="middle" className="font-mono text-[9px] fill-[var(--crit)]">
          50% 半数以上
        </text>
      </svg>
      {node}
    </>
  );
}

/** Error rate by category, normalised by question count. */
export function CategoryRates({ analysis }: { analysis: Analysis }) {
  const { bind, node } = useTip();
  const rows = [...analysis.byCategory].filter((c) => c.questionCount > 0)
    .sort((a, b) => b.errorRate - a.errorRate);
  const W = 420, rowH = 30, padL = 118, padR = 42, top = 4;
  const H = top + rows.length * rowH, w = W - padL - padR;

  return (
    <>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} role="img"
           aria-label="各知识点错误率" style={{ overflow: "visible" }}>
        {rows.map((c, i) => {
          const y = top + i * rowH;
          return (
            <g key={c.categoryId}>
              <text x={padL - 10} y={y + 12} textAnchor="end" className={LBL}>{c.nameZh}</text>
              <text x={padL - 10} y={y + 23} textAnchor="end" className={AXIS}>
                {c.questionCount} 题{c.subjective ? " · 主观" : ""}
              </text>
              <rect x={padL} y={y + 4} width={w} height={11} rx={4} className="fill-[var(--line)]" />
              <rect x={padL} y={y + 4} width={Math.max(4, w * c.errorRate)} height={11} rx={4}
                    className="fill-[var(--mark)] hover:fill-[var(--s4)]"
                    {...bind(<><b className="mb-0.5 block">{c.nameZh}</b>
                      <span className="block font-mono text-[11px] text-[var(--tx-3)]">本卷 {c.questionCount} 题 · 错误率 {pct(c.errorRate)}</span>
                      <span className="block font-mono text-[11px] text-[var(--tx-3)]">共 {c.wrongCount} 次失分 / {c.attemptCount} 次作答</span></>)} />
              <text x={padL + w + 7} y={y + 13} className={AXIS}>{pct(c.errorRate)}</text>
            </g>
          );
        })}
      </svg>
      {node}
    </>
  );
}

/** Student × category heatmap. */
export function Heatmap({ analysis }: { analysis: Analysis }) {
  const { bind, node } = useTip();
  const students = [...analysis.byStudent].sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
  const cats = analysis.byCategory.filter((c) => c.questionCount > 0);
  const W = 900, padL = 96, padR = 52, padT = 52, ch = 15, gap = 3;
  const cw = (W - padL - padR) / Math.max(1, cats.length);
  const H = padT + students.length * (ch + gap);

  return (
    <>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} role="img"
           aria-label="学生与知识点错误率热力图" style={{ overflow: "visible" }}>
        {cats.map((c, j) => (
          <g key={c.categoryId}>
            <text x={padL + j * cw + cw / 2} y={padT - 12} textAnchor="middle" className={LBL}>{c.nameZh}</text>
            <text x={padL + j * cw + cw / 2} y={padT - 1} textAnchor="middle" className={AXIS}>{c.questionCount} 题</text>
          </g>
        ))}
        {students.map((s, i) => {
          const y = padT + i * (ch + gap);
          return (
            <g key={s.studentId}>
              <text x={padL - 12} y={y + 11} textAnchor="end" className={LBL}>{s.name}</text>
              {cats.map((c, j) => {
                const cell = s.cells.find((x) => x.categoryId === c.categoryId)!;
                return (
                  <rect key={c.categoryId} x={padL + j * cw + 1} y={y} width={cw - gap} height={ch} rx={3}
                        fill={step(cell.rate)} stroke="var(--panel)" strokeWidth={2}
                        {...bind(<><b className="mb-0.5 block">{s.name} · {c.nameZh}</b>
                          <span className="block font-mono text-[11px] text-[var(--tx-3)]">错 {cell.wrong} / {cell.total} 题 · {pct(cell.rate)}</span></>)} />
                );
              })}
              {s.score !== undefined && (
                <text x={W - padR + 10} y={y + 11} className={AXIS}>{s.score} 分</text>
              )}
            </g>
          );
        })}
      </svg>
      {node}
    </>
  );
}

export function RampLegend() {
  return (
    <div className="mt-3 flex flex-wrap items-center gap-3.5 text-[11px] text-[var(--tx-3)]">
      <span>单元格 = 该学生在该知识点上的错误率</span>
      <span className="inline-flex items-center gap-1.5">
        <span className="h-[11px] w-[11px] rounded-[3px] border border-[var(--line-2)] bg-[var(--panel-2)]" />全对
      </span>
      <span className="flex gap-0.5">
        {RAMP.map((v) => <span key={v} className="h-[9px] w-[17px] rounded-sm" style={{ background: `var(${v})` }} />)}
      </span>
      <span className="font-mono text-[10.5px]">低 → 高</span>
    </div>
  );
}

/** Distribution of wrong-answer counts. */
export function Distribution({ analysis }: { analysis: Analysis }) {
  const { bind, node } = useTip();
  const vals = analysis.byStudent.map((s) => s.wrongCount);
  if (!vals.length) return null;
  const lo = Math.floor(Math.min(...vals) / 4) * 4, hi = Math.max(...vals);
  const size = Math.max(2, Math.ceil((hi - lo + 1) / 6));
  const bins = Array.from({ length: 6 }, (_, i) => [lo + i * size, lo + (i + 1) * size - 1] as [number, number]);
  bins[5][1] = Number.MAX_SAFE_INTEGER;
  const counts = bins.map(([a, b]) => vals.filter((v) => v >= a && v <= b).length);
  const max = Math.max(...counts, 1);

  const W = 420, H = 132, padL = 26, padB = 30, bw = (W - padL - 10) / bins.length, h = H - padB - 10;

  return (
    <>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} role="img" aria-label="错题数分布" style={{ overflow: "visible" }}>
        {[0, 0.5, 1].map((f) => (
          <g key={f}>
            <line x1={padL} y1={10 + h * (1 - f)} x2={W - 10} y2={10 + h * (1 - f)} stroke="var(--line)" strokeWidth={1} />
            <text x={padL - 7} y={10 + h * (1 - f) + 3} textAnchor="end" className={AXIS}>{Math.round(max * f)}</text>
          </g>
        ))}
        {counts.map((c, i) => {
          const bh = Math.max(2, h * (c / max));
          const label = bins[i][1] === Number.MAX_SAFE_INTEGER ? `${bins[i][0]}+` : `${bins[i][0]}–${bins[i][1]}`;
          return (
            <g key={i}>
              <rect x={padL + i * bw + 4} y={10 + h - bh} width={bw - 10} height={bh} rx={4}
                    className="fill-[var(--mark)] hover:fill-[var(--s4)]"
                    {...bind(<><b className="mb-0.5 block">错 {label} 题</b>
                      <span className="block font-mono text-[11px] text-[var(--tx-3)]">{c} 人</span></>)} />
              <text x={padL + i * bw + bw / 2} y={H - 14} textAnchor="middle" className={AXIS}>{label}</text>
            </g>
          );
        })}
        <text x={W / 2} y={H - 1} textAnchor="middle" className={AXIS}>错题数区间（人数）</text>
      </svg>
      {node}
    </>
  );
}
