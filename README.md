# 砺知 · Lì Zhī

多学科试卷分析 —— 上传试卷与答案，录入错题号，生成四类文档。

A teacher uploads an exam paper and a list of who missed what. 砺知 returns a
per-student diagnostic PDF, a class-wide analysis PDF, a WeChat-ready parent
message per student, and an annotated answer key.

Supports **语文 / 数学 / 英语**.

## Run it

```sh
npm install
npm run dev        # http://localhost:3000
npm test           # analysis engine + roster parser
npm run build
```

There is no API key needed to try it: press **载入示例卷** on step 1 to walk the
whole flow on sample data. Every statistic on the analysis screen is really
computed — nothing on that page is mocked.

## Workflow

| | Step | What happens |
|---|---|---|
| 1 | 上传试卷原卷 | Photo / PDF / pasted text / manual entry |
| 2 | 上传答案 | Answer file, pasted key, or model-drafted. Paired, then confirmed question by question |
| 3 | 录入错题号 | Names + wrong question numbers, parsed live |
| 4 | 班级分析 | Error distribution, category rates, heatmap — **computed locally, no model involved** |
| 5 | 导出文档 | Four documents, individually or as one zip |

## Layout

```
app/(wizard)/       the five steps, one route each
components/         shell, UI primitives, SVG charts
lib/analysis.ts     the analysis engine — pure, deterministic, tested
lib/roster.ts       the forgiving 错题号 parser — pure, tested
lib/subjects/       one pack per subject: taxonomy, question types, scoring model
lib/store.ts        session state (Zustand) persisted to IndexedDB
docs/               PLAN.md and design samples
legacy-game/        an unrelated earlier project, kept intact
```

## Two rules the code enforces

**Student names never reach the model.** Names live in browser state. Requests
carry anonymised error patterns only; names are written back locally at render
time.

**The analysis engine is AI-free.** Numbers that end up on a document a parent
reads have to be reproducible and explainable, so `lib/analysis.ts` is pure
TypeScript with unit tests, not a model call.

## Configuration

| Variable | Purpose |
|---|---|
| `GEMINI_API_KEY` | Server-side only. Set it in the Vercel dashboard, never in this repo. |

`GET /api/ping` reports whether the key is configured.

Not yet wired up: paper parsing, practice generation, parent-message drafting and
the PDF engine — see `docs/PLAN.md` for the phase plan.
