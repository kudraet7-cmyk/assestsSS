# 砺知 · Lì Zhī

**Build plan v3 — 2026-08-15**

多学科试卷分析 · 语文 / 数学 / 英语

A teacher uploads an exam paper and a list of who missed what. The app returns four
finished documents: a per-student diagnostic PDF, a class-wide analysis PDF, a
WeChat-ready parent message per student, and an annotated answer key.

---

## 1. The product in one screen

```
 ┌ 1 上传试卷原卷 ┐ ┌ 2 上传答案 ─┐ ┌ 3 录入错题号 ┐ ┌ 4 班级分析 ─┐ ┌ 5 导出文档 ─┐
 │ 拍照 / PDF     │→│ 答案文件    │→│ 姓名 + 错题号│→│ 错误率分布  │→│ 四类文档    │
 │ 粘贴文本       │ │ 粘贴答案    │ │ 可加所选选项 │ │ 知识点归一  │ │ + .zip      │
 │ 手动录入       │ │ 模型拟答案  │ │              │ │ 练习生成    │ │             │
 └────────────────┘ └─────────────┘ └──────────────┘ └─────────────┘ └─────────────┘
        AI               AI + 你          你              本地计算          AI
```

**Paper and answer key are uploaded separately.** They arrive at different times in
real life — the key is often a separate handout, or doesn't exist yet — and pairing
them as an explicit step is where the confirmation gate belongs. Step 2 is also where
question review lives: once the key is paired, the merged 题目 + 答案 + 知识点 table
is the thing you confirm, in one pass rather than two.

Every AI step lands in an editable table before it becomes a PDF. The teacher is
always the last edit, never the AI.

### The four deliverables

| # | Output | Format | Per |
|---|--------|--------|-----|
| 1 | Diagnostic report — missed questions, mapped categories, targeted practice set | PDF | student |
| 2 | Class analysis — error distribution, error rate by category, hardest questions | PDF | class |
| 3 | Parent feedback message — warm, jargon-free, paste into WeChat | `.txt` | student |
| 4 | Answer key — correct answers, explanations, category tags, class error rate | PDF | class |

All four bilingual: Simplified Chinese first, English below, per your choice.

---

## 2. Architecture

```
Browser (Next.js client)                     Vercel Edge/Node functions
┌──────────────────────────────┐            ┌────────────────────────────┐
│ Wizard UI                    │            │ /api/parse-exam            │
│ Session state (Zustand)      │  ────────▶ │ /api/categorize            │  ──▶ Gemini API
│ IndexedDB persistence        │  ◀────────  │ /api/practice              │      (key server-side
│ PDF rendering (react-pdf)    │            │ /api/parent-notes          │       only, never
│ Student names — NEVER leave  │            │ (stateless, no DB)         │       shipped to client)
└──────────────────────────────┘            └────────────────────────────┘
```

### Stack

| Layer | Choice | Why |
|-------|--------|-----|
| Framework | Next.js 15, App Router, TypeScript | First-class Vercel target, route handlers give us a safe server side for the API key |
| Styling | Tailwind CSS v4 + CSS custom properties | Fast to build the futuristic system, no runtime cost |
| Motion | Framer Motion | Step transitions, chart reveals — restrained, not decorative |
| State | Zustand + IndexedDB (`idb-keyval`) | One session object, survives refresh, no backend needed |
| AI | Google Gemini via `@google/genai` | Vision for photographed papers, structured JSON output for everything else |
| PDF | `@react-pdf/renderer`, client-side | Real vector PDFs, full layout control, no headless Chrome on Vercel |
| Maths | KaTeX → PDF primitives | Typeset formulas rather than pasted screenshots; see §6.5 |
| Charts | Hand-rolled SVG inside react-pdf | Chart libraries don't render into PDF primitives; bar/heatmap are simple enough |
| Zip | `client-zip` | Bundle 40 student PDFs + 40 `.txt` files into one download |

**No database in v1.** The whole session lives in the browser and exports as a
single `.json` file you can re-import later. This removes an entire class of
privacy, cost, and ops problems. (The past-paper bank of §7 is the one long-lived
store — it persists across sessions in IndexedDB and exports the same way.) If you later want cross-exam progress tracking
across a semester, that's when we add Postgres — see §8.

### Gemini model selection

Two tiers, picked per task:

- **Pro tier** — reading the photographed exam paper (vision + layout reasoning)
  and writing explanations. Accuracy matters more than cost here.
- **Flash tier** — categorization, practice-exercise generation, parent messages.
  High volume, well-constrained by schema.

I'll pin exact model IDs against Google's current model list when we start
Phase 1 rather than hardcoding them now — the lineup moves quickly, and the
right call in October may not be the right call today. All calls use
**structured output** (`responseSchema`) so we get typed JSON, never prose we
have to regex.

---

## 3. The two design decisions that matter most

### 3.1 Student names never reach the AI

Names stay in browser memory. Every request to Gemini carries anonymized error
patterns — `student_07 missed Q3, Q7, Q12` — or, more often, no student
reference at all. Names are stitched back in locally when the PDF renders.

This isn't just hygiene. It means you can use this app with real class rosters
without a data-handling conversation with your school, and it costs us nothing
architecturally.

### 3.2 Practice exercises are generated per *category*, not per *student*

The naive build calls Gemini once per student — 40 students, 40 calls, slow and
expensive, and two students with identical weaknesses get different worksheets
for no reason.

Instead: after analysis we know the full set of weak categories across the class,
say 14 of them. We generate a **practice bank** — 6 exercises per category, one
batched call — then assemble each student's PDF locally by pulling the exercises
matching *their* weak categories. Difficulty is tiered within each category so a
student who missed one question in a category gets the reinforcement item and a
student who missed four gets the full ladder.

**40 students goes from ~40 API calls to ~3.** Generation drops from minutes to
seconds, cost drops by more than an order of magnitude, and the worksheets become
consistent across the class — which is what you actually want when parents compare
notes.

---

## 4. Data model

```ts
type Session = {
  id: string
  meta: { title: string; subject: string; grade: string; examDate: string; teacher: string }
  questions: Question[]
  students: Student[]
  taxonomy: Category[]
  practiceBank: Record<string /* categoryId */, Exercise[]>   // generated
  bankItems:   Record<string /* categoryId */, BankItem[]>    // retrieved from past papers, §7
  analysis: Analysis | null      // derived, recomputed on any edit
}

type Question = {
  number: number
  text: string
  type: 'choice' | 'fill' | 'short' | 'essay' | 'calculation'
  options?: string[]
  correctAnswer?: string         // optional — paper may arrive without a key
  explanation?: string           // AI-drafted, teacher-editable
  categoryIds: string[]          // 1–2, from taxonomy
  points?: number
  aiConfidence: number           // surfaces low-confidence rows for review
}

type Category = {
  id: string
  nameZh: string; nameEn: string
  kind: 'knowledge' | 'skill'    // 知识点 vs 能力类型
  parentId?: string              // two-level tree
}

type Student = {
  id: string; name: string
  wrongQuestions: number[]
  chosenOptions?: Record<number, string>   // { 30: 'B' } — powers distractor analysis
  subjectiveDeduction?: number             // marks lost on essay/short answer
  absent?: boolean
}

type Analysis = {
  byQuestion:  { number: number; wrongCount: number; errorRate: number }[]
  byCategory:  { categoryId: string; wrongCount: number; attemptCount: number; errorRate: number }[]
  byStudent:   { studentId: string; wrongCount: number; weakCategories: WeakCategory[] }[]
  classStats:  { meanWrong: number; median: number; stdDev: number; hardestQuestions: number[] }
  heatmap:     number[][]        // students × categories, for the class PDF
}
```

`Analysis` is pure TypeScript — no AI, fully deterministic, unit-testable. That
matters: the numbers on a document you send to a parent should be reproducible
and explainable, not the output of a language model.

### Category taxonomy

Two levels, e.g. for maths: `代数 Algebra ▸ 一元二次方程 Quadratic equations`.
Each question also carries a skill tag (`计算 Computation`, `概念理解
Conceptual`, `应用 Application`, `审题 Reading the problem`).

Gemini proposes the taxonomy from the paper itself, then you edit it in Step 2.
Taxonomies are saved **per subject** — 语文, 数学 and 英语 never share one — and reused — by your third exam in a subject you'll mostly be
confirming, not authoring. That reuse is also what makes cross-exam comparison
possible later.

---

## 5. Input formats

### Exam paper — three routes, all landing in the same review table

1. **Photo / PDF upload.** Drag in phone photos or a scanned PDF. Multi-page,
   multi-image. Gemini vision extracts question number, text, options, and the
   answer if the key is printed on the paper. Each extracted row carries a
   confidence score; anything below threshold is flagged amber in the review
   table so you check the three rows that need it, not all forty.
2. **Paste plain text.** For papers you already have digitally. Cheapest and
   most accurate path.
3. **Manual builder.** A form, question by question. Also the edit layer for
   routes 1 and 2 — so it's built once and used everywhere.

**If the paper has no answer key**, Gemini drafts answers and flags them
`unverified`; they render with a review marker until you confirm. The answer-key
PDF refuses to export while unverified answers remain — a wrong answer key sent
to forty families is the worst failure mode this app has, so it gets a hard gate
rather than a warning banner.

### Scores — paste roster + numbers

```
王小明: 3,7,12,15
李思思: 2,3,15
张伟 3 7 9 21
陈静：4、11、23        ← full-width colon and 、 both accepted
刘洋: 无               ← "none" / "满分" / "-" all mean zero wrong
```

The parser is deliberately forgiving: any of `:` `：` `,` `，` `、` `空格` as
separators, tolerant of trailing punctuation. It validates that every number is
within the paper's question range and shows a live preview table as you type, so
a typo like `Q47` on a 30-question paper surfaces immediately rather than in a
PDF. Ranges (`3-5`) expand. Duplicate names get flagged.

**Optional but high-value — record which wrong option they chose:**

```
王小明: 3B,7C,12A,15D
```

Appending the chosen letter costs you one keystroke per question and unlocks the
single biggest jump in report quality. Knowing only *that* Q30 was missed gets
you "the answer is `connect with`". Knowing the student chose **B. to** gets you
"you picked `to`, which is for connecting *devices* — `connect the printer to the
computer`; people take `with`." That's the difference between a restatement and a
correction, and it also lets the class report surface *which distractor* the class
fell for — often the most useful single fact from an exam.

Fully optional, per-question. `3B,7,12A` is valid; questions without a letter
simply get the shorter treatment.

### Subjective vs objective loss

The sample report tracks 2 objective misses against a 84.5/100 score — leaving
13.5 points of subjective loss invisible. So the session records a per-student
subjective deduction alongside the wrong-question list, and the report names it.
Otherwise the document quietly implies a student's only problem is two multiple
choice questions when most of their lost marks are elsewhere.

---

## 6. The four documents

### 6.0 Density rules — every document obeys these

Page space is the scarcest resource in a printed report, and the surest way to
make one feel unserious is to fill it with air. Every layout follows:

- **No full-width color section bars.** A hairline rule with a small-caps label
  reads as more considered and costs a fifth of the height.
- **One accent color plus semantic red/green/amber.** Not a different color per
  section — arbitrary color changes carry no information.
- **Two columns wherever items are short.** Single-column full-width lines for
  four-word exercises waste over half the page.
- **Never state the same number twice.** If the score strip shows 84.5 / 74.8 /
  +9.7 / rank 3, the teacher comment must not repeat them in prose — it should
  spend its space on diagnosis instead.
- **Every section must be worth its header.** A "tip" dressed up as a numbered
  exercise, or a generic answer-key dump not filtered to this student, is padding.
- **Fill the last page or drop it.** A page that's 20% full is the format failing.
  Layouts reflow to fit, and orphaned trailing blocks pair up into side-by-side
  columns.

A worked example of these rules — the same student, same exam as your reference
PDF — is in `docs/samples/`. It carries about three times the content in one page.

### 6.1 Per-student diagnostic PDF (1–3 pages, density-fit)

- **Masthead + stat strip:** score, class mean, delta, rank, objective misses,
  subjective loss, and a distribution track showing where the student actually
  sits in the class — all in one band, not four large tiles.
- **Weak-point chips:** each with `错 1 / 共 6 题`, so a single miss in a
  well-covered category isn't overstated.
- **Teacher comment:** diagnosis and next action only — no restated numbers.
- **错题精讲, two columns.** Per question: the stem, **the student's own wrong
  answer beside the correct one**, an error-cause tag (搭配混淆 / 短语未成组掌握 /
  审题失误 / 计算失误), the explanation, and a **distractor analysis** saying why
  the option they picked is wrong. The reference report showed only the correct
  answer — which tells a student nothing about the mistake they actually made.
- **Three-tier practice ladder** per weak category: 基础巩固 (★☆☆) → 同类变式
  (★★☆) → 中考/高考衔接 (★★★), each tier time-budgeted. Tier 3 comes from the
  past-paper bank — see §7.
- **主观题订正,** filtered to only the items this student lost marks on, each with
  the specific defect named (漏主语 / 时态不一致 / 答句不完整).
- **答案 + 本周任务** side by side on the last page: answers with one-line
  reasoning, and three dated, minute-budgeted tasks with checkboxes a parent can
  tick.

One rule underpins all of it: **practice items must never be the missed question
with the names changed.** The reference report re-asked `connect ___ each other`
verbatim as practice, which tests recall of that one sentence rather than the
underlying distinction. Ours pairs it against `connect the printer ___ the
computer` — the contrast is what teaches the rule.

### 6.2 Class analysis PDF (~4–5 pages)

- Error rate by question — horizontal bar chart, sorted, with a threshold line
  marking questions more than half the class missed.
- Error rate by category — the headline chart, with attempt-count normalization
  so a category with two questions isn't compared naively against one with nine.
- Student × category heatmap — clusters of struggling students become visible.
- Distribution histogram of wrong-answer counts, with mean/median/σ.
- **Teaching focus** — a short AI-written section naming the three categories
  most worth re-teaching and why, grounded strictly in the computed numbers.

### 6.3 Parent message (`.txt`)

Per student, ~150–250 Chinese characters plus English. Structure: a genuine
opening about the child, what went well, one or two concrete areas to work on in
plain language (no `知识点编码`, no jargon), what practice was sent home, and a
warm close. Tone-tunable — a `Warm / Neutral / Direct` control — and there's a
teacher-signature field.

Downloadable individually, as a zip, and with a per-student **Copy** button since
you'll often just paste straight into WeChat from the browser.

### 6.4 Answer key PDF

Every question, correct answer, explanation, category tags, and the class error
rate beside each one — so the same document works as your marking reference and
as your post-exam review script.

---

## 6.5 Three subjects, one engine — 语文 / 数学 / 英语

The app is not English-only. Each subject plugs in a **subject pack**; everything
downstream — analysis, charts, practice, the four documents — is subject-agnostic
and reads from that pack.

```ts
type SubjectPack = {
  key: 'chinese' | 'math' | 'english'
  taxonomy: Category[]              // 知识点体系, saved and reused per subject
  questionTypes: string[]           // 选择/填空/计算/解答/默写/作文 …
  answerCheck?: (q, a) => boolean   // programmatic verification where possible
  render: { math?: 'latex'; figures?: boolean }
}
```

### What actually differs per subject

| | 语文 | 数学 | 英语 |
|---|---|---|---|
| **Taxonomy** | 字词与拼音 · 病句与标点 · 古诗文默写 · 文言文阅读 · 现代文（信息提取／赏析）· 习作 | 分数四则运算 · 比与比例 · 圆的周长与面积 · 百分数应用 · 位置与方向 · 解决问题 | 固定搭配与连词 · 短语辨析 · 时态与语态 · 阅读（细节／主旨）· 词汇语法 · 书面表达 |
| **Hardest input** | 手写批注、主观题扣分点 | **公式与图形** | 手写作答 |
| **Parsing need** | 竖排／古文标点 | 公式转 **LaTeX**，几何图裁切保留 | 常规 OCR |
| **Answer checking** | 人工为主，默写可比对 | **数值可程序复核** | 客观题可比对 |
| **Subjective share** | 最高（习作 40 分） | 中（解答题过程分） | 低 |

### The three that matter most

**数学 needs formula rendering, and it's not optional.** A screenshot of a formula
pasted into a PDF looks terrible next to typeset text and can't be re-flowed.
Questions get converted to **LaTeX** at parse time and typeset on output; geometry
figures are kept as cropped images from the original paper.

**数学 also gets programmatic answer verification.** Where a question has a numeric
answer, the model's proposed answer is recomputed and checked. If it doesn't
reconcile, the row is flagged before you ever see it. This is the strongest
hallucination guard in the product and it exists only for maths — worth building
precisely because that's the subject where a wrong answer key is most damaging.

**语文 needs a different scoring model entirely.** A large share of the marks are
subjective — 赏析, 概括, 习作 — with no single right answer. The app does **not**
attempt to grade these. It takes the deduction points you recorded, files them by
knowledge point, and reports the class-wide pattern. Only 默写 and 字词 get
per-question error rates. Pretending otherwise would produce confident nonsense.

---

## 7. The past-paper bank — 上海中考 / 高考真题

This is the largest content upgrade available to the product, and it changes the
AI's job from **generation** to **retrieval**.

### Why it matters

An AI-invented practice question is plausible-sounding and unaccountable. A real
上海中考 question carries authentic phrasing, calibrated difficulty, and — critically
— **provenance**: `2021 · 上海中考 · 第 32 题` on the page. That single label changes
how a student and a parent treat the worksheet, and it removes hallucination risk
from the highest-stakes part of the document. It also means the exercises get
*better* over time as the bank grows, rather than being re-invented every run.

### How it works

```
真题 PDFs  ──▶  same vision parser as §5  ──▶  auto-tag against your taxonomy
   (yours)          (built in Phase 1)              ──▶  dedupe  ──▶  review once
                                                                        │
                                                                        ▼
                                                          item bank (local, reusable)
                                                                        │
   student's weak categories ────────── retrieve, difficulty-matched ───┘
```

```ts
type BankItem = {
  id: string
  source: { exam: '中考' | '高考' | '一模' | '二模'; region: string; year: number; number?: number }
  section: '词汇与语法' | '完形填空' | '阅读理解' | '翻译' | '写作'
  stem: string; options?: string[]; answer: string; explanation?: string
  categoryIds: string[]        // same taxonomy as the exam — that's what makes retrieval work
  difficulty: 1 | 2 | 3
  gradeFloor: number           // lowest grade that can reasonably attempt it
}
```

The ingestion pipeline is **the Phase 1 parser pointed at a different input**, so
this costs far less to build than it looks — the expensive part (vision extraction
plus taxonomy tagging) already exists by then.

### Difficulty matching — the part that needs care

Your reference report is a **Grade 6** paper. Handing a 六年级 student raw 高考
questions would be discouraging and pedagogically useless. So retrieval is gated
on `gradeFloor`, and past-paper items are positioned as the **top tier of a ladder**,
never the whole worksheet:

| Student level | Tier 1 基础 | Tier 2 变式 | Tier 3 衔接 |
|---|---|---|---|
| 预初 / 初一 | generated from their own error | generated variant | 中考 单选/词汇, `gradeFloor ≤ 7` only |
| 初二 / 初三 | 中考 basic items | 中考 mid items | 中考 完形 / 阅读 |
| 高中 | 中考 items as warm-up | 高考 单项 / 语法填空 | 高考 阅读 / 翻译 |

In the sample report, exactly 4 of 20 items are 中考-tier, all on the *same*
knowledge points the student actually missed (`put off`, `connect with`,
concessive `although`). That ratio is a setting, not a constant.

### What I can and can't supply

**I can build:** the ingestion pipeline, the tagging, the dedupe, the retrieval,
the difficulty gating, and the provenance stamping.

**I can't ship you the corpus.** I don't have a licensed, verified set of 上海中考 /
高考 past papers, and inventing citations — printing `2019·上海中考·第 38 题` on a
question that isn't one — would be worse than having no citation at all. Papers you
already own are the input; the app turns them into a reusable bank in one pass.

So in the sample report those items are marked `中考题型` (中考-style), not given a
fake year and number. Once your papers are ingested, that tag is replaced
automatically by the real source line. If you'd rather not ingest anything, the
tier-3 slot falls back to AI-written 中考-style items and stays honestly labelled
as such.

Copyright, briefly: using past papers as teaching material for your own students
is ordinary practice, and the bank stays local to you — nothing is published or
redistributed. Worth knowing rather than worrying about.

---

## 8. Visual design

Futuristic, but a teacher has to use it at 10pm on a Sunday — so: clean,
high-contrast, quiet.

- **Dark-first.** Near-black `#0A0C10` ground, elevated glass panels
  (`rgba(255,255,255,0.04)` + 1px hairline border), a faint grid backdrop.
  Light mode is a real second theme, not an afterthought — you may want to
  present this on a classroom projector.
- **One accent gradient**, cyan `#22D3EE` → violet `#8B5CF6`, used for progress,
  primary actions, and data emphasis. Everything else is neutral. A single accent
  in a restrained field is what reads as "futuristic"; five accents read as a
  toy.
- **Data colors are a separate, accessible palette** — the error-rate charts have
  to be legible printed in black and white, since half of these PDFs will come
  out of a school laser printer. Sequential ramps, not rainbow.
- **Type:** Inter for Latin, Noto Sans SC for Chinese, JetBrains Mono for
  question numbers and figures. Tabular numerals throughout the tables.
- **Motion:** step transitions and chart draw-on only. 200–300ms, ease-out.
  Nothing loops, nothing pulses.
- **The wizard rail** is persistent on the left — you can always jump back to
  Step 2 and fix a category without losing anything downstream; analysis
  recomputes automatically.

---

## 9. Phases

Each phase ends with something deployed and usable. Nothing is a big-bang.

| Phase | Scope | Ends with |
|-------|-------|-----------|
| **0 · Foundation** | Move ISKANDER to `/legacy-game`, scaffold Next.js at repo root, design system, Vercel deploy, env-var wiring, health-check on `/api/ping` | A live URL with the shell UI and a verified Gemini connection |
| **1 · Ingestion** | Three input modes, upload pipeline, vision parsing, review/edit table with confidence flags | You can upload a real paper and see it correctly parsed |
| **2 · Categorize + score** | Per-subject taxonomy packs, roster parser with live preview, deterministic analysis engine + unit tests, maths LaTeX + numeric verification | Real numbers on screen for a real class — already useful with zero PDFs |
| **3 · PDF engine** | react-pdf setup, CJK font pipeline, shared document chrome, **Answer key PDF** + **Class analysis PDF** with charts | Two of four documents shipping |
| **4 · Practice** | Practice-bank generation, three-tier difficulty ladder, distractor analysis, teacher review screen, **Per-student PDF**, zip export | Three of four |
| **5 · Past-paper bank** | Ingest your 中考/高考 papers through the Phase 1 parser, auto-tag, dedupe, `gradeFloor` gating, provenance stamping, retrieval into tier 3 | Practice items become real past-paper questions with citations |
| **6 · Parent messages** | Message generation, tone control, signature, copy buttons, `.txt` + zip export | All four documents complete |
| **7 · Hardening** | Session save/load `.json`, error and retry handling, rate limiting, cost guard, empty/edge states, mobile layout, print QA on a real printer | Ready to use for a real exam |

Phases 3 and 4 are the heavy ones. Phase 2 is where the app first becomes useful
to you — worth stopping there and running a real exam through it before we build
any PDFs, because what you learn will change what goes into them.

Phase 5 is deliberately placed *after* a working per-student PDF exists. The bank
makes good reports better; it can't rescue a report whose layout and explanations
aren't right yet, and building it earlier would just mean rebuilding retrieval
once the document design settled.

---

## 10. Risks, and what we do about them

| Risk | Mitigation |
|------|-----------|
| **CJK fonts in PDFs.** Chinese needs an embedded font; the full Noto Sans SC is ~10MB. | Pre-subset to GB2312 + Latin + punctuation at build time (~3MB), served from `/public`, fetched once and cached. react-pdf subsets again per document, so the PDFs themselves stay small. Budgeted as real Phase 3 work, not an afterthought. |
| **OCR accuracy** on phone photos, especially handwriting and maths notation. | Confidence scoring per question, amber-flagged review rows, and the manual builder always available as an escape hatch. We test with your actual papers in Phase 1 — this is the assumption most worth validating early. |
| **Vercel function timeout** (60s on Hobby). | No long call. Parsing is chunked by page, generation is batched and streamed. The practice-bank design in §3.2 exists partly for this reason. |
| **Hallucinated practice questions or explanations.** | Nothing reaches a PDF without passing through a teacher review screen. For maths, we ask for worked solutions and verify numeric answers programmatically where the form allows. |
| **API cost drift.** | Per-session token accounting displayed in the UI, and a configurable per-session ceiling. Rough estimate: a 30-question paper for a 40-student class should land in the low tens of US cents. I'll measure and report real numbers at the end of Phase 4 rather than promising them now. |
| **Mis-tagged bank items.** A past-paper question filed under the wrong category surfaces as irrelevant practice. | Tagging is reviewed once at ingestion, in bulk, with the same confidence flags as exam parsing — and a wrong tag is fixable in one click forever after, unlike a bad AI-generated question that regenerates differently each run. |
| **Maths formula OCR.** Handwritten fractions, radicals and geometry are the hardest input in the product. | LaTeX round-trip shown back to you in the review table, numeric verification on every answer that has one, and the manual builder as the escape hatch. Expect this to need the most Phase 1 tuning of the three subjects. |
| **语文 subjective grading.** No model should be assigning marks to a 习作. | The app never grades subjective work. It files the deductions *you* recorded by knowledge point and reports the class pattern. Scope limit, not a mitigation. |
| **Gemini rate limits.** | Exponential backoff, request queueing, partial-result recovery so a rate limit late in a batch doesn't discard the work already done. |
| **The paper arrives with no answer key.** | Answers drafted and marked `unverified`; the answer-key PDF is gated until you confirm them. |

---

## 11. Open questions — not blocking, worth answering by Phase 2

1. **Subject and grade.** The taxonomy quality depends on it. A sample paper from
   you in Phase 1 is worth more than any amount of guessing here.
2. **Class size and exam frequency.** Drives whether Phase 6 needs bulk workflows.
3. **Do you want partial credit?** Right now a question is right or wrong. Essay
   and calculation questions often aren't. Adding per-question scores is a
   contained change if you want it — but it makes score entry meaningfully slower,
   so it should be a deliberate choice, not a default.
4. **Cross-exam progress tracking.** Explicitly out of scope for v1, and the
   single most likely v2. The data model above is shaped so that adding it later
   means adding a store, not a rewrite.

---

## 12. What I need from you to start Phase 0

- A Gemini API key (from Google AI Studio) — added to Vercel as `GEMINI_API_KEY`.
  Set it in the Vercel dashboard, **not** in a file in this repo.
- Confirmation that moving ISKANDER to `/legacy-game` is fine.
- Which subject you want Phase 1 built against first. I would start with **语文 or 英语** and add 数学 in Phase 2 — the formula pipeline is the single largest unknown, and it is much cheaper to build once the rest of the flow is proven.
- Ideally: one real exam paper (photo or PDF) and one real wrong-answer list,
  anonymized if you prefer. Phase 1 is much better work with a real artifact than
  with a synthetic one.
- For Phase 5, whatever 上海中考 / 高考 past papers you already have, in any format.
  Quantity matters more than tidiness — the parser handles the mess.
