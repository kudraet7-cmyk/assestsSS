"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useSession } from "@/lib/store";
import { analyse } from "@/lib/analysis";
import { Card, Button, PageHead, Pill, Note } from "@/components/ui";
import { LimitNotice } from "@/components/Paywall";
import { checkLimits, watermarked, PLANS } from "@/lib/plans";

const DOCS = [
  { key: "student", title: "个人诊断报告", per: true, tone: "cyan",
    desc: "第 1 页诊断，第 2 页是可撕下的练习卷。含错因分析、干扰项讲解与三级梯度练习。" },
  { key: "class", title: "班级分析报告", per: false, tone: "cyan",
    desc: "错误率分布、知识点归一化对比、学生 × 知识点热力图、分数直方图与教学重点。" },
  { key: "parent", title: "家长沟通话术", per: true, tone: "violet",
    desc: "150–250 字，无术语。语气可调（温和 / 中性 / 直接），可加署名。" },
  { key: "key", title: "答案解析", per: false, tone: "violet",
    desc: "逐题答案、讲解、知识点标签，每题旁标注本班错误率 —— 批改参考与讲评稿同一份。" },
] as const;

export default function ExportPage() {
  const { questions, students, taxonomy, meta, plan, examsThisMonth } = useSession();
  const analysis = useMemo(
    () => analyse(questions, students, taxonomy, { totalMarks: meta.totalMarks }),
    [questions, students, taxonomy, meta.totalMarks],
  );

  const unverified = questions.filter((q) => !q.verified).length;
  const ready = students.length > 0 && questions.length > 0;
  const breaches = checkLimits(plan, {
    studentCount: students.length, examsThisMonth, classCount: 1,
  });
  const overLimit = breaches.length > 0;

  if (!ready) {
    return (
      <>
        <PageHead title="导出文档" sub="还没有可导出的内容" />
        <Card>
          <p className="m-0 py-8 text-center text-[13px] text-[var(--tx-3)]">
            先完成 <Link href="/paper" className="text-[var(--cyan)]">第 1 步</Link> 到{" "}
            <Link href="/wrong" className="text-[var(--cyan)]">第 3 步</Link>。
          </p>
        </Card>
      </>
    );
  }

  return (
    <>
      <PageHead
        title="导出文档"
        sub={`四类文档 · 共 ${students.length * 2 + 2} 个文件`}
        actions={<Button variant="primary" disabled title="PDF 引擎在 Phase 3">打包下载 .zip</Button>}
      />

      {overLimit && <div className="mb-3.5"><LimitNotice breaches={breaches} /></div>}
      {!overLimit && watermarked(plan) && (
        <div className="mb-3.5">
          <Note>
            当前为{PLANS[plan].nameZh}，导出的 PDF 会带水印。
            升级到个人版即可去除 —— <a href="/pricing" className="text-[var(--cyan)]">查看套餐</a>。
          </Note>
        </div>
      )}

      <div className="grid gap-3.5 lg:grid-cols-2">
        <div className="flex flex-col gap-3.5">
          {DOCS.map((d) => {
            const blocked = (d.key === "key" && unverified > 0) || overLimit;
            return (
              <Card key={d.key}>
                <div className="flex items-start gap-3">
                  <span className="grid h-[34px] w-[34px] shrink-0 place-items-center rounded-[9px]"
                    style={{ background: `color-mix(in srgb, var(--${d.tone}) 13%, transparent)`, color: `var(--${d.tone})` }}>
                    <svg width="17" height="17" viewBox="0 0 16 16" fill="none" aria-hidden>
                      <path d="M3.5 1.5h6l3 3v10h-9z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
                      <path d="M5.5 8h5M5.5 10.5h3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                    </svg>
                  </span>
                  <div>
                    <h3 className="m-0 text-[14.5px] font-semibold">{d.title}</h3>
                    <div className="mt-0.5 font-mono text-[10.5px] tracking-[0.03em] text-[var(--tx-3)]">
                      {d.per ? `× ${students.length}` : "× 1"}
                    </div>
                  </div>
                  {blocked && (
                    <span className="ml-auto">
                      <Pill tone="crit">{overLimit ? "超出额度" : "已锁定"}</Pill>
                    </span>
                  )}
                </div>
                <p className="mt-2.5 mb-0 text-[12.5px] leading-relaxed text-[var(--tx-2)]">{d.desc}</p>
                {blocked && !overLimit && (
                  <Note>
                    还有 <b className="text-[var(--tx-2)]">{unverified} 题</b>未核对答案。
                    请回到 <Link href="/answers" className="text-[var(--cyan)]">第 2 步</Link> 逐题确认 ——
                    一份错的答案发给全班家庭是这个产品最坏的失败方式，所以这里是硬拦截。
                  </Note>
                )}
                <div className="mt-3 flex gap-2">
                  <Button disabled title="PDF 引擎在 Phase 3">预览</Button>
                  <Button disabled={blocked} title="PDF 引擎在 Phase 3">下载</Button>
                </div>
              </Card>
            );
          })}
        </div>

        <Card title="学生名单" right={`${students.length} 人`}>
          <div className="-mx-5 -mb-5 max-h-[560px] overflow-auto">
            <table className="w-full text-[12.5px]">
              <thead>
                <tr>
                  {["学生", "得分", "全卷错题", "首要薄弱点"].map((h) => (
                    <th key={h} className="sticky top-0 whitespace-nowrap border-b border-[var(--line)] bg-[var(--panel)] px-3.5 pb-2 pt-1 text-left font-mono text-[9.5px] font-semibold uppercase tracking-[0.13em] text-[var(--tx-3)]">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...analysis.byStudent].sort((a, b) => (b.score ?? 0) - (a.score ?? 0)).map((s) => (
                  <tr key={s.studentId} className="hover:bg-[var(--panel-2)]">
                    <td className="border-b border-[var(--line)] px-3.5 py-2.5 text-[var(--tx)]">{s.name}</td>
                    <td className="border-b border-[var(--line)] px-3.5 py-2.5 font-mono tabular-nums text-[var(--tx)]">{s.score ?? "—"}</td>
                    <td className="border-b border-[var(--line)] px-3.5 py-2.5 font-mono tabular-nums text-[var(--tx)]">{s.wrongCount}</td>
                    <td className="border-b border-[var(--line)] px-3.5 py-2.5 text-[var(--tx-2)]">
                      {s.weakCategories[0]
                        ? `${s.weakCategories[0].nameZh} ${s.weakCategories[0].wrong}/${s.weakCategories[0].total}`
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </>
  );
}
