# Available Examinations

> **Status:** canonical inventory · last reviewed 2026-04-24
> **Source of truth:** `src/exams/adapters/` (code) + `src/samples/` (content)
> **Related:**
> - [`DEMO.md`](./DEMO.md) — running the product locally
> - [`agents/ORG-CHART.md`](./agents/ORG-CHART.md) — `curriculum-manager` owns this surface
> - [`FEATURES.md`](./FEATURES.md) — shipping ledger

This document answers: **"which examinations does Vidhya support today,
and what are their characteristics?"**

Every exam listed here ships as a registered adapter at backend start-up,
loaded via `src/exams/adapters/index.ts` and surfaced to students in the
exam-profile picker at `/gate/exam-profile`.

---

## Three bundled mathematics exams

All three are currently mathematics-only. They target Indian
undergraduate-entrance testing. The adapter interface is generic — a
new exam requires adding one content file + one adapter file; the
orchestrator, planner, feedback surface, and content engine know
nothing exam-specific.

| # | Exam ID | Code | Level | Country | Issuing body |
|---|---|---|---|---|---|
| 1 | `EXM-BITSAT-MATH-SAMPLE` | BITSAT-MATH-2026 | Entrance | India | BITS Pilani |
| 2 | `EXM-JEEMAIN-MATH-SAMPLE` | JEEMAIN-MATH-2026 | Entrance | India | National Testing Agency (NTA) |
| 3 | `EXM-UGEE-MATH-SAMPLE` | UGEE-MATH-2026 | Entrance | India | IIIT Hyderabad |
| 4 | `EXM-NEET-BIO-SAMPLE` | NEET-BIO-2026 | Entrance | India | National Testing Agency (NTA) |
| 5 | `EXM-NEET-PHYS-SAMPLE` | NEET-PHYS-2026 | Entrance | India | National Testing Agency (NTA) |
| 6 | `EXM-NEET-CHEM-SAMPLE` | NEET-CHEM-2026 | Entrance | India | National Testing Agency (NTA) |
| 7 | `EXM-GATE-MATH-SAMPLE` | GATE-MATH-2026 | Postgraduate | India | IISc Bangalore + 7 IITs |

---

## 1. BITSAT Mathematics 2026

```
Id:             EXM-BITSAT-MATH-SAMPLE
Code:           BITSAT-MATH-2026
File:           src/exams/adapters/bitsat-mathematics.ts
Content:        src/samples/bitsat-mathematics.ts
Official URL:   https://www.bitsadmission.com
```

Mathematics section of the **BITSAT** (Birla Institute of Technology and
Science Admission Test), used for admission to BITS Pilani, Goa, and
Hyderabad campuses. NCERT Class 11-12 base with JEE Main-level difficulty.
Speed and accuracy are decisive; the adapter is calibrated to that reality.

### Structure

| Property | Value |
|---|---|
| Duration | 180 min (full paper; student manages math timing internally) |
| Total marks | 120 (40 questions × 3 marks) |
| Scoring | **+3** correct, **-1** wrong, **0** unattempted |
| Question mix | 100% single-correct MCQ |

### Topic weights — from analysis of past 5 years of BITSAT papers

| Topic | Weight | Approx. questions |
|---|---:|---:|
| Calculus | 27.5% | ~11 |
| Coordinate geometry | 17.5% | ~7 |
| Algebra | 17.5% | ~7 |
| Vectors / 3-D | 12.5% | ~5 |
| Trigonometry | 10.0% | ~4 |
| Probability & statistics | 7.5% | ~3 |
| Sets & relations | 5.0% | ~2 |
| Matrices & determinants | 2.5% | ~1 |

Calculus-heavy. The -1 negative marking makes **selective attempting** a
strategy the planner surfaces early.

---

## 2. JEE Main Mathematics 2026

```
Id:             EXM-JEEMAIN-MATH-SAMPLE
Code:           JEEMAIN-MATH-2026
File:           src/exams/adapters/jee-main-mathematics.ts
Content:        src/samples/jee-main-mathematics.ts
Official URL:   https://jeemain.nta.nic.in
```

Mathematics section of **JEE Main**, India's national entrance exam for
the NITs, IIITs, and the qualifier for JEE Advanced (the IIT entrance).
Two sessions per year (January and April); the better score counts.

### Structure

| Property | Value |
|---|---|
| Duration | 60 min (math section; 1/3 of 180-min full paper) |
| Total marks | 120 (30 questions × 4 marks) |
| Scoring (MCQ) | **+4** correct, **-1** wrong, 0 unattempted |
| Scoring (NAT) | **+4** correct, **0** wrong, 0 unattempted |
| Question mix | 20 MCQs + 10 NAT (numerical-answer-type) |

### Three characteristics the adapter captures

1. **Mixed question types.** `defaultGenerationSections` asks for MCQs
   and NATs in the exam's 20:10 ratio.
2. **Negative-marking asymmetry.** MCQs carry -1 for wrong; NATs carry 0.
   Downstream scoring branches on `question_kind`.
3. **Calculus-heavy.** Priority concepts lead with calculus, vectors, and
   differential equations — harder weighting than BITSAT.

### Priority concepts (in planner order)

`calculus` → `linear-algebra` → `vector-calculus` → `differential-equations`
→ `complex-variables`

---

## 3. UGEE IIIT Hyderabad Mathematics 2026

```
Id:             EXM-UGEE-MATH-SAMPLE
Code:           UGEE-MATH-2026
File:           src/exams/adapters/ugee-mathematics.ts
Content:        src/samples/ugee-mathematics.ts
Official URL:   https://ugadmissions.iiit.ac.in/ugee/
```

SUPR mathematics portion of the **UGEE** (Undergraduate Entrance
Examination) conducted by IIIT Hyderabad for dual-degree
B.Tech + MS-by-research programs. Class 11-12 CBSE / state-board base,
JEE-level difficulty, with UGEE-distinctive emphasis on discrete
mathematics and mathematical reasoning. Rewards conceptual depth over
raw speed — the exam is designed to identify future researchers, not
just fast solvers. **No calculator permitted.**

### Structure

| Property | Value |
|---|---|
| Duration | 60 min SUPR window (math is ~24 min of it) |
| Total marks | 20 (20 questions × 1 mark, SUPR scheme) |
| Scoring | **+1** correct, **−0.25** wrong, 0 unattempted |
| Question mix | ~85% MCQ + ~15% numerical-answer |

### What makes UGEE different

- **Lower time pressure** but **higher accuracy expectation** (−0.25 is
  milder than BITSAT's −1 but still significant given small marks-total).
- **Discrete-math emphasis** — graph theory, combinatorics, logic appear
  more than on BITSAT/JEE Main where continuous math dominates.
- **Qualitative-over-quantitative** tilt — expect "prove/argue/reason"
  prompts in MCQ form.

---

## Exam comparison at a glance

| Dimension | BITSAT | JEE Main | UGEE |
|---|---|---|---|
| Question count | 40 | 30 | 20 |
| Time (math) | ~90 min (self-managed) | 60 min | ~24 min |
| Time per question | ~2.25 min | 2.0 min | ~1.2 min |
| Marks per correct | +3 | +4 | +1 |
| Penalty per wrong | -1 | -1 (MCQ) / 0 (NAT) | -0.25 |
| Speed vs depth | **Speed** | Balanced | **Depth** |
| Calculus weight | 27.5% | Highest-priority concept | Included |
| Distinctive emphasis | Negative-marking decision-making | Two question kinds, different penalties | Discrete maths, reasoning |

---

## How the demo uses these exams

The demo seed (`demo/seed.ts`) registers exam profiles against these
real adapter IDs:

| Demo student | Registered exams |
|---|---|
| **Priya (active)** | `EXM-BITSAT-MATH-SAMPLE` (7 days out) + `EXM-JEEMAIN-MATH-SAMPLE` (90 days out) — showcases multi-exam planner |
| **Rahul (light)** | `EXM-BITSAT-MATH-SAMPLE` (30 days out) |
| **Aditya (new)** | none — first-time UX |

Because the demo uses real adapter IDs, every downstream surface
(session planner, trailing stats, template presets, exam-profile
picker, content resolver) works correctly for demo testers. When a
tester hits `/gate/planned`, the planner reads the real BITSAT
topic-weight table and proximity-weights the close exam over the far
one exactly as it would for a production student.

---

## How to add a new exam

The adapter pattern is designed so a new exam requires **zero** changes
to orchestrator code.

```bash
# 1. Content: the syllabus, strategies, lesson manifest, sample mock
#    exam. One file under src/samples/
cp src/samples/bitsat-mathematics.ts src/samples/neet-biology.ts
# edit the copy with the new exam's metadata

# 2. Adapter: the wiring file that calls registerExamAdapter()
cp src/exams/adapters/bitsat-mathematics.ts src/exams/adapters/neet-biology.ts
# update imports and the adapter block

# 3. Register: one line in the aggregator
echo "import './neet-biology';" >> src/exams/adapters/index.ts
```

That's it. On next backend start:
- `/api/student/exams` returns the new exam
- Students see it in `/gate/exam-profile` picker
- The planner auto-routes to it when students register
- The feedback + content surfaces pick up the new syllabus topics

This is the agent boundary the `curriculum-manager` owns — adding an
exam is one of its shipped skills. See
[`agents/managers/curriculum-manager.yaml`](./agents/managers/curriculum-manager.yaml).

---

## Legacy / reference exam

For historical reference only — not currently loaded at startup:

| Id | Name | Location | Status |
|---|---|---|---|
| GATE MA | GATE Mathematics | *legacy content, not registered as adapter* | Referenced in FEATURES.md |

Re-enabling it requires writing an adapter file like the three above.
Nothing in production code depends on GATE MA; mentioning it is for
readers who may see it in old commit messages or older documentation.

---

## Constitutionally relevant notes

The four product promises apply to every exam equally:

- **Strategy** — the planner's proximity-weighting (close exam gets more
  minutes than far one in multi-exam sessions) is exam-agnostic. All
  three shipped exams get the same treatment.
- **Focus** — the content engine's tier cascade (bundle → local cache
  → IndexedDB → network) is exam-agnostic. BITSAT Priya, JEE Main
  Rahul, and UGEE Aditya all benefit equally from the four-tier serving.
- **Compounding** — practice minutes are cross-exam. A student taking
  BITSAT and JEE Main both sees the trailing-stats badge counting union
  minutes; switching exams does not reset the compounding moment.
- **Calm** — none of the three exam adapters implements streaks, loss-
  aversion mechanics, or urgency-based guilt pings. These are
  constitutionally banned at the agent-org level (see
  `agents/_shared/constitution.md`); no per-exam override can
  reintroduce them.
