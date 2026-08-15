# 试卷分析助手 · Exam Insight

**Build plan v1 — 2026-08-15**

A teacher uploads an exam paper and a list of who missed what. The app returns four
finished documents: a per-student diagnostic PDF, a class-wide analysis PDF, a
WeChat-ready parent message per student, and an annotated answer key.

---

## 1. The product in one screen

```
  ┌─ 1 UPLOAD ──┐  ┌─ 2 REVIEW ──┐  ┌─ 3 SCORES ──┐  ┌─ 4 ANALYZE ─┐  ┌─ 5 EXPORT ──┐
  │ photo / PDF │→ │ questions + │→ │ paste names │→ │ error       │→ │ 4 documents │
  │ paste text  │  │ answers +   │  │ + wrong Q#  │  │ distribution│  │ + .zip      │
  │ manual form │  │ categories  │  │             │  │ + practice  │  │             │
  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘
        AI                YOU              YOU              AI              AI
```

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
| Charts | Hand-rolled SVG inside react-pdf | Chart libraries don't render into PDF primitives; bar/heatmap are simple enough |
| Zip | `client-zip` | Bundle 40 student PDFs + 40 `.txt` files into one download |

**No database in v1.** The whole session lives in the browser and exports as a
single `.json` file you can re-import later. This removes an entire class of
privacy, cost, and ops problems. If you later want cross-exam progress tracking
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
  practiceBank: Record<string /* categoryId */, Exercise[]>
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

type Student = { id: string; name: string; wrongQuestions: number[]; absent?: boolean }

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
Saved taxonomies are reusable — by your third exam in a subject you'll mostly be
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

---

## 6. The four documents

### 6.1 Per-student diagnostic PDF (~3–4 pages)

- **Cover:** name, exam, date, score summary, and a category radar chart — one
  glance tells a parent where their child stands.
- **Missed questions:** each question in full, the student's error, the correct
  answer, a short explanation, and the category tag.
- **Weakness summary:** categories ranked by how many of that category's
  questions the student missed — not raw counts, which unfairly punish
  well-represented topics.
- **Targeted practice:** 3–6 exercises per weak category from the practice bank,
  difficulty-laddered.
- **Answer page:** practice answers, last page, so the sheet can be handed over
  intact and the answers torn off.

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

## 7. Visual design

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

## 8. Phases

Each phase ends with something deployed and usable. Nothing is a big-bang.

| Phase | Scope | Ends with |
|-------|-------|-----------|
| **0 · Foundation** | Move ISKANDER to `/legacy-game`, scaffold Next.js at repo root, design system, Vercel deploy, env-var wiring, health-check on `/api/ping` | A live URL with the shell UI and a verified Gemini connection |
| **1 · Ingestion** | Three input modes, upload pipeline, vision parsing, review/edit table with confidence flags | You can upload a real paper and see it correctly parsed |
| **2 · Categorize + score** | Taxonomy generation and editing, roster parser with live preview, deterministic analysis engine + unit tests | Real numbers on screen for a real class — already useful with zero PDFs |
| **3 · PDF engine** | react-pdf setup, CJK font pipeline, shared document chrome, **Answer key PDF** + **Class analysis PDF** with charts | Two of four documents shipping |
| **4 · Practice** | Practice-bank generation, difficulty laddering, teacher review screen, **Per-student PDF**, zip export | Three of four |
| **5 · Parent messages** | Message generation, tone control, signature, copy buttons, `.txt` + zip export | All four documents complete |
| **6 · Hardening** | Session save/load `.json`, error and retry handling, rate limiting, cost guard, empty/edge states, mobile layout, print QA on a real printer | Ready to use for a real exam |

Phases 3 and 4 are the heavy ones. Phase 2 is where the app first becomes useful
to you — worth stopping there and running a real exam through it before we build
any PDFs, because what you learn will change what goes into them.

---

## 9. Risks, and what we do about them

| Risk | Mitigation |
|------|-----------|
| **CJK fonts in PDFs.** Chinese needs an embedded font; the full Noto Sans SC is ~10MB. | Pre-subset to GB2312 + Latin + punctuation at build time (~3MB), served from `/public`, fetched once and cached. react-pdf subsets again per document, so the PDFs themselves stay small. Budgeted as real Phase 3 work, not an afterthought. |
| **OCR accuracy** on phone photos, especially handwriting and maths notation. | Confidence scoring per question, amber-flagged review rows, and the manual builder always available as an escape hatch. We test with your actual papers in Phase 1 — this is the assumption most worth validating early. |
| **Vercel function timeout** (60s on Hobby). | No long call. Parsing is chunked by page, generation is batched and streamed. The practice-bank design in §3.2 exists partly for this reason. |
| **Hallucinated practice questions or explanations.** | Nothing reaches a PDF without passing through a teacher review screen. For maths, we ask for worked solutions and verify numeric answers programmatically where the form allows. |
| **API cost drift.** | Per-session token accounting displayed in the UI, and a configurable per-session ceiling. Rough estimate: a 30-question paper for a 40-student class should land in the low tens of US cents. I'll measure and report real numbers at the end of Phase 4 rather than promising them now. |
| **Gemini rate limits.** | Exponential backoff, request queueing, partial-result recovery so a rate limit late in a batch doesn't discard the work already done. |
| **The paper arrives with no answer key.** | Answers drafted and marked `unverified`; the answer-key PDF is gated until you confirm them. |

---

## 10. Open questions — not blocking, worth answering by Phase 2

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

## 11. What I need from you to start Phase 0

- A Gemini API key (from Google AI Studio) — added to Vercel as `GEMINI_API_KEY`.
  Set it in the Vercel dashboard, **not** in a file in this repo.
- Confirmation that moving ISKANDER to `/legacy-game` is fine.
- Ideally: one real exam paper (photo or PDF) and one real wrong-answer list,
  anonymized if you prefer. Phase 1 is much better work with a real artifact than
  with a synthetic one.
