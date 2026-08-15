# Sample documents

## `student-report-redesign.html` / `.pdf`

A rebuild of the reference per-student report (2026 暑 预初卓越英语, 卷面第 20 份),
using the same student and the same two missed questions, applied against the
density and content rules in `../PLAN.md` §6.0 and §6.1.

| | Reference | Rebuild |
|---|---|---|
| Pages | 1 (≈40% air) | 2, both ~95% full |
| Practice items | 7 | 20, across 3 difficulty tiers |
| Reading practice | none (a study tip in a numbered slot) | 105-word passage + 4 questions |
| Student's own wrong answer shown | no | yes, with distractor analysis |
| Error-cause tags | no | yes |
| Subjective loss (13.5 marks) | not mentioned | surfaced and itemised |
| Answer key | blanket, same for everyone | filtered to this student's losses |

Page 1 is the diagnosis; page 2 is a detachable worksheet the student can work on
directly, with the answer key at the foot. Splitting it that way lets both pages
breathe instead of cramming one page and half-filling a second.

Regenerate the PDF with Chromium's print pipeline (see `PLAN.md` §10 for the
production font path — this sample uses the container's WenQuanYi Zen Hei).

## `ui-demo.html`

A clickable mockup of 砺知: the five workflow steps (上传试卷原卷 → 上传答案 →
录入错题号 → 班级分析 → 导出文档), a **subject switcher** for 语文 / 数学 / 英语,
a working dark/light toggle, and hover tooltips on every chart.

Each subject is a full pack — its own taxonomy, question types, sample rows, score
distribution, teaching advice and parent message. Switching subject rebuilds the whole
dataset, so the maths view really is maths (LaTeX-set formulas, a numeric-recheck
step) and the 语文 view really is 语文 (subjective-heavy, no per-question rate on 习作).

The dashboard runs on generated data for 22 students, but the generator is a real
model — per-student difficulty multipliers normalised to mean 1 — so the KPI tiles,
the category chart, the heatmap, the histogram and the teaching-advice block are all
computed from one dataset and cannot disagree with each other. 浦绎心's figures are
pinned to the sample report above.

Chart marks deliberately use a separate validated blue ramp rather than the product's
cyan→violet accent, so data never competes with UI chrome.

### Two caveats on this sample

1. **The student's chosen wrong options (B, C) are invented for the demo.** The
   source report only recorded *which* questions were missed, not what was picked.
   Capturing the chosen letter is a new, optional input — see `PLAN.md` §5.
2. **The 中考-tier items are labelled `中考题型` (中考-style), not real citations.**
   No fabricated year/number is printed. Real provenance appears once actual past
   papers are ingested — see `PLAN.md` §7.

Fonts here are WenQuanYi Zen Hei (the container's CJK font). Production uses a
subset Noto Sans SC — see `PLAN.md` §10.
