# Journey map — every student touchpoint

Grounded in `docs/USER-JOURNEY.md` (stages, pains, and the principle
"minimum effort, maximum competency") and `docs/TEACHER-JOURNEY.md` in
`mathconcepts/project-vidhya`. Each touchpoint below names the screen a student
actually sees, the one job that screen has, and the components it is built from.

**The rule that governs all of them: one focal block per screen.** Everything
else is plain text and hairline-separated rows on the canvas. A screen with three
cards has three things competing to be read; a screen with one card and two lines
of text has one.

---

## Stage 1 — Discovery (0–60s, no account)

| Touchpoint | One job | Built from |
|---|---|---|
| Landing / first open | Prove value before asking for anything | Three `ListRow`s on the canvas, no card |
| "Build my plan" link | Offer structure without demanding it | Plain link in body text |

- No sign-in wall, no form, no card stack. Three things to try, each one tap.
- Copy is a question, not an instruction: "Stuck on something?" not "Set up your study plan."
- The exam countdown is hidden here — it means nothing yet and adds noise.
- *Answers pains 1.1–1.4.*

## Stage 2 — First use (1–10 min)

| Touchpoint | One job | Built from |
|---|---|---|
| Tutor thread | Answer the question in plain language | `ChatBubble` |
| Verified answer | Show that this one is backed | `ReceiptBadge` — the only decorated surface in the thread |
| Next step | Offer exactly one | A single sentence with one link |
| Composer | Stay out of the way | Capsule field on `--surface-fill` |

- One suggestion per answer, phrased as a question ("Want to try one yourself?"), always ignorable. Never a row of three suggestion cards.
- *Answers pains 2.1 (verified signal) and 2.2 (next step); 2.3 remains open upstream.*

## Stage 3 — Habitual use (week 1–4)

| Touchpoint | One job | Built from |
|---|---|---|
| Today | Say what to study next, and why | `TaskCard` — the single focal block |
| Rate / skip | Close the loop in one tap | Three 36px buttons + skip |
| Later today | Reassure without demanding | Two hairline rows, no card |
| Tutor FAB | Be one tap from anywhere | `TutorFab` |
| Notes | Return to anything already asked | Filter pills + hairline rows |

- The syllabus grid, streak badge, announcement strip and digest chip from the current build are **not** on this screen. They are three extra blocks for information the student did not come for.
- "Why" is a sentence, not a score: "Biggest area to grow. Twenty minutes."
- Skipping is first-class and produces no red, no guilt.

## Stage 4 — Mastery arc (week 4+)

| Touchpoint | One job | Built from |
|---|---|---|
| Progress | One number and one sentence explaining it | `MasteryRing` in the focal block |
| Where you stand | Rank topics weakest-first | Hairline rows with status dots |
| Catch-up nudge | One recovery action | Plain sentence with a link |
| Day complete | Name the specific win | Full ring, title, two quiet links |

- The five-factor readiness breakdown collapses into one sentence by default; the bars are one tap away, not on the surface.
- Celebration names what was actually cracked ("You cracked eigenvalues"), never a streak, never confetti. Two exits, both quiet — no dead end.
- *Answers pains 4.2 (readiness meter) and 4.3 (milestone) in the theme's own terms.*

---

## Density budget (enforce this)

| Screen | Cards allowed | Rows before it needs a filter | Body size |
|---|---|---|---|
| Any screen | **1** | 6 | 17px |
| Tutor thread | 0 (bubbles only) | — | 17px |
| Terminal states | 0 | — | 17px |

- **17px is the floor for anything a student reads.** 15px for supporting lines,
  13px only for timestamps and metadata. The old 10–13px UI text is gone.
- Line height 1.5 on every paragraph; measure never wider than the 350px screen column.
- Secondary text is grey, not small. Reduce contrast before reducing size.
- Two accents on screen at most. If green and indigo both appear, nothing else may.
- Gaps do the grouping: 20px between sections, 30px before a section label. Boxes
  are the last resort, not the first.

## Not yet designed
Camera scan capture, mock exam runner, teacher cohort view, admin dashboard.
Each is a separate journey with its own touchpoint list.
