"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useSession } from "@/lib/store";
import { SUBJECTS } from "@/lib/subjects";
import { parseRoster } from "@/lib/roster";
import { Card, Button, PageHead, Pill, Note } from "@/components/ui";

export default function WrongPage() {
  const { subject, questions, rosterText, setRosterText, setStudents } = useSession();
  const pack = SUBJECTS[subject];
  const maxQuestion = questions.length ? Math.max(...questions.map((q) => q.number)) : undefined;

  // Parsed live as you type — a typo surfaces here, not inside a finished PDF.
  const result = useMemo(
    () => parseRoster(rosterText, { maxQuestion }),
    [rosterText, maxQuestion],
  );

  const errors = result.issues.filter((i) => i.level === "error");
  const warnings = result.issues.filter((i) => i.level === "warning");
  const issuesByLine = useMemo(() => {
    const m = new Map<number, string[]>();
    for (const i of result.issues) m.set(i.line, [...(m.get(i.line) ?? []), i.message]);
    return m;
  }, [result.issues]);

  function commit() {
    setStudents(result.students.map((s) => ({
      id: s.id, name: s.name, wrongQuestions: s.wrongQuestions,
      chosenOptions: s.chosenOptions, subjectiveDeduction: s.subjectiveDeduction,
      score: s.score,
    })));
  }

  return (
    <>
      <PageHead
        title="录入错题号"
        sub="一行一个学生。分隔符随便用 —— 中英文冒号、逗号、顿号、空格都认"
        actions={
          <>
            <Button disabled title="Phase 6">导入 Excel</Button>
            <Link href="/analysis">
              <Button variant="primary" onClick={commit} disabled={!result.students.length}>
                开始分析 →
              </Button>
            </Link>
          </>
        }
      />

      <div className="grid gap-3.5 lg:grid-cols-2">
        <Card title="粘贴名单" right="可选：在题号后加上他选的选项">
          <textarea
            value={rosterText}
            onChange={(e) => setRosterText(e.target.value)}
            spellCheck={false}
            aria-label="名单"
            placeholder={`陈嘉禾: 3,7,12 | 分 88\n李思远：2、3、15\n张伟 3 7 9\n浦绎心: 30B,62C | 主观 13.5 | 分 84.5\n刘可欣: 无\n孙悦: 3-5,12 | 主观 6.5`}
            className="min-h-[220px] w-full resize-y rounded-xl border border-[var(--line)] bg-[var(--panel-2)] p-3.5 font-mono text-[12.5px] leading-loose text-[var(--tx)] outline-none placeholder:text-[var(--tx-3)] focus:border-[color-mix(in_srgb,var(--cyan)_55%,transparent)]"
          />
          <Note>
            <b className="text-[var(--tx-2)]">30B</b> 表示第 30 题他选了 B ——
            多敲一个字母，报告就能针对他选的那个干扰项讲，而不只是复述正确答案。完全可选。
            <b className="text-[var(--tx-2)]"> 3-5</b> 自动展开；
            <b className="text-[var(--tx-2)]"> 无</b> / <b className="text-[var(--tx-2)]">满分</b> 记为零错题；
            结尾加 <b className="text-[var(--tx-2)]">| 主观 6.5</b> 记录主观失分（本科目每题约 {pack.subjectiveMarksPerQuestion} 分），
            加 <b className="text-[var(--tx-2)]">| 分 84.5</b> 记录总分。
          </Note>
        </Card>

        <Card
          title="实时校验"
          right={
            result.students.length
              ? `${result.students.length} 名已录入${errors.length ? ` · ${errors.length} 处待修正` : ""}`
              : "等待输入"
          }
        >
          {!maxQuestion && (
            <Note>还没有试卷题号范围，超范围的题号暂时无法校验。先在第 1–2 步载入试卷。</Note>
          )}
          {result.students.length === 0 ? (
            <p className="m-0 py-6 text-center text-[13px] text-[var(--tx-3)]">
              在左边粘贴名单，这里会实时显示解析结果。
            </p>
          ) : (
            <div className="-mx-5 -mb-5 max-h-[420px] overflow-auto">
              <table className="w-full text-[12.5px]">
                <thead>
                  <tr>
                    {["学生", "错题", "题号", "校验"].map((h) => (
                      <th key={h} className="sticky top-0 whitespace-nowrap border-b border-[var(--line)] bg-[var(--panel)] px-3.5 pb-2 pt-1 text-left font-mono text-[9.5px] font-semibold uppercase tracking-[0.13em] text-[var(--tx-3)]">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {result.students.map((s) => {
                    const msgs = issuesByLine.get(s.line) ?? [];
                    const bad = result.issues.some((i) => i.line === s.line && i.level === "error");
                    return (
                      <tr key={s.line} className={bad ? "bg-[color-mix(in_srgb,var(--crit)_8%,transparent)]" : ""}>
                        <td className="border-b border-[var(--line)] px-3.5 py-2.5 text-[var(--tx)]">{s.name}</td>
                        <td className="border-b border-[var(--line)] px-3.5 py-2.5 font-mono tabular-nums text-[var(--tx)]">
                          {s.wrongQuestions.length}
                        </td>
                        <td className="max-w-[190px] truncate border-b border-[var(--line)] px-3.5 py-2.5 font-mono text-[11px] text-[var(--tx-3)]">
                          {s.wrongQuestions.join(",") || "—"}
                        </td>
                        <td className="border-b border-[var(--line)] px-3.5 py-2.5">
                          {msgs.length === 0
                            ? <Pill tone="ok">已校验</Pill>
                            : <span className="flex flex-col gap-1">
                                {msgs.map((m, k) => (
                                  <Pill key={k} tone={bad ? "crit" : "warn"}>{m}</Pill>
                                ))}
                              </span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          {warnings.length > 0 && errors.length === 0 && (
            <Note>{warnings.length} 条提醒，不影响继续。</Note>
          )}
        </Card>
      </div>
    </>
  );
}
