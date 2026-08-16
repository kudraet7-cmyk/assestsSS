"use client";

import { useState } from "react";
import Link from "next/link";
import { useSession } from "@/lib/store";
import { SUBJECTS } from "@/lib/subjects";
import { REVIEW_THRESHOLD } from "@/lib/types";
import { Card, Button, PageHead, Pill, Note } from "@/components/ui";

const SOURCES = [
  ["上传答案文件", "标准答案、评分标准或答题卡。与原卷逐题比对后自动配对。"],
  ["粘贴答案", "如 1.B 2.C 3.A …，主观题可留空。"],
  ["让模型拟答案", "没有答案时用。全部标为「待核对」，逐题确认前不允许导出答案解析。"],
];

export default function AnswersPage() {
  const { subject, questions, taxonomy, verifyQuestion } = useSession();
  const [src, setSrc] = useState(0);
  const pack = SUBJECTS[subject];

  const catName = (id: string) => taxonomy.find((c) => c.id === id)?.nameZh ?? id;
  const unverified = questions.filter((q) => !q.verified);
  const lowConfidence = questions.filter((q) => q.confidence < REVIEW_THRESHOLD);
  const needsReview = questions.filter((q) => !q.verified || q.confidence < REVIEW_THRESHOLD);

  return (
    <>
      <PageHead
        title="上传答案"
        sub={questions.length
          ? <>{questions.length} 题已配对 · <span className="text-[var(--warn)]">{unverified.length} 题待你确认</span> —— 只需看下面标黄的行</>
          : <>还没有试卷。先回到 <Link href="/paper" className="text-[var(--cyan)]">上传试卷原卷</Link>。</>}
        actions={
          <Link href="/wrong">
            <Button variant="primary" disabled={!questions.length}>确认答案 →</Button>
          </Link>
        }
      />

      <div className="mb-3.5 grid gap-3.5 lg:grid-cols-2">
        <Card title="答案来源" right="三选一">
          <div className="flex flex-col gap-2.5">
            {SOURCES.map(([t, h], i) => (
              <button key={t} onClick={() => setSrc(i)}
                className={`flex items-start gap-3 rounded-lg border px-3.5 py-3 text-left transition ${
                  src === i
                    ? "border-[color-mix(in_srgb,var(--cyan)_55%,transparent)] bg-[color-mix(in_srgb,var(--cyan)_7%,transparent)]"
                    : "border-[var(--line)] bg-[var(--panel-2)] hover:border-[var(--line-2)]"}`}>
                <span className={`mt-0.5 grid h-[15px] w-[15px] shrink-0 place-items-center rounded-full border-[1.5px] ${
                  src === i ? "border-[var(--cyan)]" : "border-[var(--line-2)]"}`}>
                  {src === i && <span className="h-[7px] w-[7px] rounded-full bg-[var(--cyan)]" />}
                </span>
                <span>
                  <span className="block text-[13px] font-medium">{t}</span>
                  <span className="mt-0.5 block text-[11.5px] leading-relaxed text-[var(--tx-3)]">{h}</span>
                </span>
              </button>
            ))}
          </div>
        </Card>

        <Card title="配对结果" right={`${pack.nameZh}卷`}>
          <table className="w-full text-[12.5px]">
            <tbody>
              {[
                ["已自动配对", `${questions.length - needsReview.length} 题`],
                ["置信度偏低", `${lowConfidence.length} 题`],
                ["数值复核", pack.supportsNumericCheck ? "已启用" : "本科目不适用"],
                ["公式排版", pack.needsLatex ? "LaTeX" : "本科目不需要"],
              ].map(([k, v]) => (
                <tr key={k} className="border-b border-[var(--line)]">
                  <td className="w-[118px] py-2 text-[var(--tx-2)]">{k}</td>
                  <td className="py-2 text-[var(--tx)]">{v}</td>
                </tr>
              ))}
              <tr>
                <td className="py-2 text-[var(--tx-2)]">待核对</td>
                <td className="py-2">
                  {unverified.length
                    ? <Pill tone="warn">{unverified.length} 题</Pill>
                    : <Pill tone="ok">✓ 已清零</Pill>}
                </td>
              </tr>
            </tbody>
          </table>
          <Note>
            <b className="text-[var(--tx-2)]">答案解析 PDF 在所有「待核对」清零前不允许导出。</b>
            一份错的答案发给 40 个家庭，是这个产品最坏的失败方式，所以这里是硬性拦截，不是提示条。
          </Note>
        </Card>
      </div>

      <Card title="题目与答案核对" right="知识点由模型提议，点击标签可改">
        {questions.length === 0 ? (
          <p className="m-0 py-6 text-center text-[13px] text-[var(--tx-3)]">
            还没有题目。回到第 1 步载入示例卷或上传试卷。
          </p>
        ) : (
          <div className="-mx-5 -mb-5 overflow-x-auto">
            <table className="w-full text-[12.5px]">
              <thead>
                <tr>
                  {["题号", "题干", "类型", "正确答案", "知识点", "置信度", ""].map((h) => (
                    <th key={h} className="whitespace-nowrap border-b border-[var(--line)] px-3.5 pb-2 text-left font-mono text-[9.5px] font-semibold uppercase tracking-[0.13em] text-[var(--tx-3)]">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {questions.slice(0, 40).map((q) => {
                  const flag = !q.verified || q.confidence < REVIEW_THRESHOLD;
                  return (
                    <tr key={q.number}
                        className={flag ? "bg-[color-mix(in_srgb,var(--warn)_7%,transparent)]" : "hover:bg-[var(--panel-2)]"}>
                      <td className="border-b border-[var(--line)] px-3.5 py-2.5 font-mono tabular-nums text-[var(--tx)]">{q.number}</td>
                      <td className="border-b border-[var(--line)] px-3.5 py-2.5 text-[var(--tx)]">{q.text}</td>
                      <td className="border-b border-[var(--line)] px-3.5 py-2.5 text-[var(--tx-2)]">{q.type}</td>
                      <td className="border-b border-[var(--line)] px-3.5 py-2.5 font-mono text-[var(--tx)]">{q.correctAnswer ?? "—"}</td>
                      <td className="border-b border-[var(--line)] px-3.5 py-2.5">
                        <span className="cursor-pointer whitespace-nowrap rounded border border-dashed border-[var(--line-2)] bg-[var(--panel-2)] px-2 py-0.5 text-[11px] text-[var(--tx-2)] hover:border-[var(--cyan)] hover:text-[var(--tx)]">
                          {catName(q.categoryId)}
                        </span>
                      </td>
                      <td className="border-b border-[var(--line)] px-3.5 py-2.5">
                        <span className={`flex items-center gap-1.5 font-mono text-[11px] ${
                          q.confidence < REVIEW_THRESHOLD ? "text-[var(--warn)]" : "text-[var(--tx-2)]"}`}>
                          <span className="h-[3px] w-[34px] overflow-hidden rounded-sm bg-[var(--line-2)]">
                            <span className="block h-full"
                              style={{ width: `${Math.round(q.confidence * 100)}%`,
                                       background: q.confidence < REVIEW_THRESHOLD ? "var(--warn)" : "var(--ok)" }} />
                          </span>
                          {Math.round(q.confidence * 100)}%
                        </span>
                      </td>
                      <td className="border-b border-[var(--line)] px-3.5 py-2.5">
                        {q.verified
                          ? <Pill tone="ok">✓</Pill>
                          : <button onClick={() => verifyQuestion(q.number)}
                              className="rounded border border-[var(--line-2)] px-2 py-0.5 text-[11px] text-[var(--tx-2)] hover:border-[var(--cyan)] hover:text-[var(--tx)]">
                              确认
                            </button>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Note>知识点体系按学科分别保存，下次同科目考试直接复用 —— 到第三份卷子，你基本只是在确认，不是在录入。</Note>
    </>
  );
}
