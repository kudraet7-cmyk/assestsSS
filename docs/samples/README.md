# Sample documents

## `student-report-redesign.html` / `.pdf`

A rebuild of the reference per-student report (2026 暑 预初卓越英语, 卷面第 20 份),
using the same student and the same two missed questions, applied against the
density and content rules in `../PLAN.md` §6.0 and §6.1.

| | Reference | Rebuild |
|---|---|---|
| Pages | 1 | 1 |
| Practice items | 7 | 20, across 3 difficulty tiers |
| Reading practice | none (a study tip in a numbered slot) | 105-word passage + 4 questions |
| Student's own wrong answer shown | no | yes, with distractor analysis |
| Error-cause tags | no | yes |
| Subjective loss (13.5 marks) | not mentioned | surfaced and itemised |
| Answer key | blanket, same for everyone | filtered to this student's losses |

Regenerate the PDF:

```sh
node render.js     # see PLAN.md — Chromium print pipeline
```

### Two caveats on this sample

1. **The student's chosen wrong options (B, C) are invented for the demo.** The
   source report only recorded *which* questions were missed, not what was picked.
   Capturing the chosen letter is a new, optional input — see `PLAN.md` §5.
2. **The 中考-tier items are labelled `中考题型` (中考-style), not real citations.**
   No fabricated year/number is printed. Real provenance appears once actual past
   papers are ingested — see `PLAN.md` §7.

Fonts here are WenQuanYi Zen Hei (the container's CJK font). Production uses a
subset Noto Sans SC — see `PLAN.md` §10.
