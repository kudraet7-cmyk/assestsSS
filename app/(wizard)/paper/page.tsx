"use client";

import { useSession } from "@/lib/store";
import { SUBJECTS } from "@/lib/subjects";
import { buildDemoExam } from "@/lib/demo-data";
import { Card, Button, PageHead, Pill, Note } from "@/components/ui";
import { useRouter } from "next/navigation";
import { useState } from "react";

const SUBJECT_NOTE: Record<string, [string, string]> = {
  chinese: ["语文卷的特别之处",
    "语文的失分大量落在主观题——赏析、概括、习作，这些没有唯一答案。砺知不去替你判分，而是把你给的扣分点按知识点归类，再统计全班的共性问题。默写与字词这类客观题才做逐题错误率。"],
  math: ["数学卷的特别之处",
    "数学的题干含公式与图形，识别难度最高。砺知把公式转成 LaTeX 再排版，避免截图糊掉；数值型答案会被程序复核——模型给出的解如果算不平，直接标红，不等你去发现。"],
  english: ["英语卷的特别之处",
    "英语的失分高度集中在成组的搭配——介词、动词短语、连词。这类错误单看一题看不出规律，放到全班的错误分布里就非常明显。砺知会把同一族的搭配聚成一个知识点。"],
};

export default function PaperPage() {
  const router = useRouter();
  const { subject, meta, setMeta, setQuestions, setTaxonomy, setStudents, questions } = useSession();
  const [busy, setBusy] = useState(false);
  const pack = SUBJECTS[subject];
  const [noteTitle, noteBody] = SUBJECT_NOTE[subject];

  function loadSample() {
    setBusy(true);
    const demo = buildDemoExam(subject);
    setTaxonomy(demo.taxonomy);
    setQuestions(demo.questions);
    setStudents(demo.students);
    setMeta({ ...demo.meta });
    setBusy(false);
    router.push("/answers");
  }

  return (
    <>
      <PageHead
        title="上传试卷原卷"
        sub="先只上传空白卷或学生卷面 —— 答案下一步再传，两者分开更不容易传错"
        actions={
          <>
            <Button onClick={loadSample} disabled={busy}>载入示例卷</Button>
            <Button variant="primary" disabled title="接入 Gemini API 后启用">解析原卷 →</Button>
          </>
        }
      />

      <div className="grid gap-3.5 lg:grid-cols-2">
        <Card>
          <div className="mb-4 flex gap-1 border-b border-[var(--line)]">
            {["拍照 / PDF", "粘贴文本", "手动录入"].map((t, i) => (
              <button key={t} aria-selected={i === 0} role="tab"
                className={`-mb-px border-b-2 px-3.5 py-2 text-[13px] transition ${
                  i === 0 ? "border-[var(--cyan)] font-semibold text-[var(--tx)]"
                          : "border-transparent text-[var(--tx-3)] hover:text-[var(--tx-2)]"}`}>
                {t}
              </button>
            ))}
          </div>

          <div className="rounded-xl border border-dashed border-[var(--line-2)] bg-[var(--panel-2)] px-6 py-8 text-center transition hover:border-[color-mix(in_srgb,var(--cyan)_45%,transparent)]">
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" className="mx-auto mb-2.5 text-[var(--cyan)]" aria-hidden>
              <path d="M12 16V4m0 0L7.5 8.5M12 4l4.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M3.5 15v3.5a1.5 1.5 0 0 0 1.5 1.5h14a1.5 1.5 0 0 0 1.5-1.5V15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <div className="mb-1 text-[14.5px] font-semibold">把试卷原卷拖到这里</div>
            <div className="text-[12px] text-[var(--tx-3)]">支持 JPG / PNG / PDF · 可多页 · 手机直接拍也行</div>
          </div>

          <Note>
            上传解析要等 <code className="font-mono">GEMINI_API_KEY</code> 配好才能启用。
            现在点「载入示例卷」可以走完整条流程，所有统计都是真算的。
          </Note>
        </Card>

        <div className="flex flex-col gap-3.5">
          <Card title="试卷信息" right="自动识别，可改">
            <table className="w-full text-[12.5px]">
              <tbody>
                {[
                  ["学科", pack.nameZh],
                  ["年级", meta.grade || "—"],
                  ["题量", questions.length ? `${questions.length} 题` : "—"],
                  ["总分", `${meta.totalMarks} 分`],
                  ["公式识别", pack.needsLatex ? "已启用 · LaTeX" : "本科目不需要"],
                  ["数值复核", pack.supportsNumericCheck ? "已启用" : "本科目不适用"],
                ].map(([k, v]) => (
                  <tr key={k} className="border-b border-[var(--line)] last:border-0">
                    <td className="w-[88px] py-2 text-[var(--tx-2)]">{k}</td>
                    <td className="py-2 text-[var(--tx)]">{v}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {pack.neverAutoGrade && (
              <div className="mt-3"><Pill tone="warn">主观题不自动判分</Pill></div>
            )}
          </Card>

          <Card title={noteTitle}>
            <p className="m-0 text-[12.5px] leading-relaxed text-[var(--tx-2)]">{noteBody}</p>
          </Card>
        </div>
      </div>
    </>
  );
}
