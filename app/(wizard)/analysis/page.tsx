"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useSession } from "@/lib/store";
import { SUBJECTS } from "@/lib/subjects";
import { analyse, teachingFocus, itemAnalysis, flaggedItems, deriveScores } from "@/lib/analysis";
import { Card, Button, PageHead, Pill, Stat, Note } from "@/components/ui";
import { HardestQuestions, CategoryRates, Heatmap, RampLegend, Distribution } from "@/components/charts/Charts";

export default function AnalysisPage() {
  const { subject, questions, students, taxonomy, meta } = useSession();
  const pack = SUBJECTS[subject];

  // Scores come from the roster when given, and are derived from question points
  // when not — so 班级分析 works without asking the teacher to type them twice.
  const scored = useMemo(
    () => deriveScores(questions, students, meta.totalMarks),
    [questions, students, meta.totalMarks],
  );
  const analysis = useMemo(
    () => analyse(questions, scored, taxonomy, { totalMarks: meta.totalMarks }),
    [questions, scored, taxonomy, meta.totalMarks],
  );
  const items = useMemo(() => itemAnalysis(questions, scored), [questions, scored]);
  const flagged = useMemo(() => flaggedItems(items), [items]);

  const cs = analysis.classStats;
  const catName = (id: string) => taxonomy.find((c) => c.id === id)?.nameZh ?? id;
  const focus = teachingFocus(analysis);

  if (!students.length || !questions.length) {
    return (
      <>
        <PageHead title="班级分析" sub="还没有可分析的数据" />
        <Card>
          <p className="m-0 py-8 text-center text-[13px] text-[var(--tx-3)]">
            先在 <Link href="/paper" className="text-[var(--cyan)]">第 1 步</Link> 载入试卷，
            并在 <Link href="/wrong" className="text-[var(--cyan)]">第 3 步</Link> 录入错题号。
          </p>
        </Card>
      </>
    );
  }

  return (
    <>
      <PageHead
        title="班级分析"
        sub={`${cs.studentCount} 份卷面 · ${cs.questionCount} 题 · ${analysis.byCategory.filter(c => c.questionCount > 0).length} 个知识点 —— 全部为本地计算，可复现，不经过模型`}
        actions={<Link href="/export"><Button variant="primary">生成文档 →</Button></Link>}
      />

      {/* Scores are optional — a roster pasted as names + wrong numbers carries none.
          Rather than render a row of em-dashes, fall back to wrong-count statistics,
          which are always available. */}
      <div className="mb-3.5 grid grid-cols-2 gap-3.5 md:grid-cols-3 xl:grid-cols-5">
        {cs.meanScore !== undefined ? (
          <>
            <Stat label="班级平均" value={cs.meanScore.toFixed(1)} unit={` /${meta.totalMarks}`}
                  detail={`中位数 ${cs.medianScore} · σ ${cs.sdScore?.toFixed(1)}`} />
            <Stat label="最高 / 最低" value={cs.maxScore!} unit={` / ${cs.minScore}`}
                  detail={`极差 ${(cs.maxScore! - cs.minScore!).toFixed(0)} 分`} />
            <Stat label="及格率" value={Math.round((cs.passCount ?? 0) / cs.studentCount * 100)} unit="%"
                  detail={`${cs.passCount} / ${cs.studentCount} 人 ≥ ${meta.totalMarks * 0.6}`} />
          </>
        ) : (
          <>
            <Stat label="人均错题" value={cs.meanWrong.toFixed(1)} unit=" 题"
                  detail={`中位数 ${cs.medianWrong} · σ ${cs.sdWrong.toFixed(1)}`} />
            <Stat label="错得最多 / 最少" value={Math.max(...analysis.byStudent.map(s => s.wrongCount))}
                  unit={` / ${Math.min(...analysis.byStudent.map(s => s.wrongCount))}`} detail="题" />
            <Stat label="全对人数"
                  value={analysis.byStudent.filter(s => s.wrongCount === 0).length} unit=" 人"
                  detail={`共 ${cs.studentCount} 人`} />
          </>
        )}
        <Stat label={cs.meanScore !== undefined ? "人均错题" : "全卷题量"}
              value={cs.meanScore !== undefined ? cs.meanWrong.toFixed(1) : cs.questionCount} unit=" 题"
              detail={cs.meanScore !== undefined ? `全卷 ${cs.questionCount} 题` : `${analysis.byCategory.filter(c => c.questionCount > 0).length} 个知识点`} />
        <Stat label="需重点关注" value={cs.atRiskCount} unit=" 人" detail="错题数超过均值 1σ" tone="var(--crit)" />
      </div>

      {cs.meanScore === undefined && (
        <Note>
          名单里没有分数，所以这里显示的是错题数统计。想看平均分与及格率，
          在录入时给每人加上一段 <b className="text-[var(--tx-2)]">| 分 84.5</b> 即可。
        </Note>
      )}

      <div className="grid gap-3.5 lg:grid-cols-2">
        <Card title="错误率最高的 12 题" right="红线 = 半数以上学生做错">
          <HardestQuestions analysis={analysis} catName={catName} />
        </Card>
        <Card title="各知识点错误率" right="按题数归一，非原始错题数">
          <CategoryRates analysis={analysis} />
        </Card>
      </div>

      <div className="mt-3.5 grid gap-3.5 lg:grid-cols-2">
        <Card title="错题数分布">
          <Distribution analysis={analysis} />
        </Card>
        <Card title="教学建议" right="依据上方计算结果">
          <div className="border-l-2 border-[var(--cyan)] pl-4">
            <h4 className="m-0 mb-2 text-[13.5px] font-semibold">下周优先重教这三项</h4>
            {focus.map((c, i) => (
              <p key={c.categoryId} className="mb-2.5 text-[12.5px] leading-relaxed text-[var(--tx-2)] last:mb-0">
                <b className="text-[var(--tx)]">{i + 1} · {c.nameZh}（错误率 {Math.round(c.errorRate * 100)}%）</b>
                {" — "}
                {c.subjective
                  ? `本卷 ${c.questionCount} 题为主观题，失分按你记录的扣分点归类，不做逐题判分。`
                  : `本卷 ${c.questionCount} 题，全班共 ${c.wrongCount} 次失分。`}
              </p>
            ))}
            {pack.neverAutoGrade && (
              <Note>主观题的扣分点来自你的批改记录，砺知只做归类与统计，不替你判分。</Note>
            )}
          </div>
        </Card>
      </div>

      <div className="mt-3.5">
        <Card title="试题质量 · 难度系数与区分度"
              right={flagged.length ? `${flagged.length} 题建议复核` : "全部达标"}>
          <p className="mb-3 mt-0 text-[12px] leading-relaxed text-[var(--tx-3)]">
            难度系数 = 答对比例，越高越简单。区分度 = 前 27% 与后 27% 学生的答对率之差，
            衡量这道题能不能把水平不同的学生分开。<b className="text-[var(--tx-2)]">区分度低于 0.2、
            或几乎全对 / 全错的题，出题价值不高</b>；区分度为负通常意味着题干有歧义或答案标错。
            这两个数字全部本地算出，不消耗任何 API。
          </p>
          <div className="-mx-5 -mb-5 max-h-[300px] overflow-auto">
            <table className="w-full text-[12.5px]">
              <thead>
                <tr>
                  {["题号", "知识点", "难度系数", "区分度", "评价", "最多人选的干扰项"].map((h) => (
                    <th key={h} className="sticky top-0 whitespace-nowrap border-b border-[var(--line)] bg-[var(--panel)] px-3.5 pb-2 pt-1 text-left font-mono text-[9.5px] font-semibold uppercase tracking-[0.13em] text-[var(--tx-3)]">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...items].sort((a, b) => a.discrimination - b.discrimination).slice(0, 25).map((it) => {
                  const bad = it.discrimination < 0.2;
                  const tone = it.quality === "excellent" ? "ok" : it.quality === "good" ? "ok"
                             : it.quality === "marginal" ? "warn" : "crit";
                  const label = { excellent: "优秀", good: "良好", marginal: "勉强", poor: "建议复核" }[it.quality];
                  return (
                    <tr key={it.number} className={bad ? "bg-[color-mix(in_srgb,var(--warn)_6%,transparent)]" : ""}>
                      <td className="border-b border-[var(--line)] px-3.5 py-2 font-mono tabular-nums text-[var(--tx)]">{it.number}</td>
                      <td className="border-b border-[var(--line)] px-3.5 py-2 text-[var(--tx-2)]">{catName(it.categoryId)}</td>
                      <td className="border-b border-[var(--line)] px-3.5 py-2 font-mono tabular-nums text-[var(--tx)]">{it.difficulty.toFixed(2)}</td>
                      <td className="border-b border-[var(--line)] px-3.5 py-2 font-mono tabular-nums text-[var(--tx)]">{it.discrimination.toFixed(2)}</td>
                      <td className="border-b border-[var(--line)] px-3.5 py-2"><Pill tone={tone as "ok" | "warn" | "crit"}>{label}</Pill></td>
                      <td className="border-b border-[var(--line)] px-3.5 py-2 text-[var(--tx-2)]">
                        {it.topDistractor ? `${it.topDistractor.option} · ${it.topDistractor.count} 人` : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      <div className="mt-3.5">
        <Card title="学生 × 知识点 热力图" right="按学生总分排序 · 悬停查看明细">
          <Heatmap analysis={analysis} />
          <RampLegend />
        </Card>
      </div>
    </>
  );
}
