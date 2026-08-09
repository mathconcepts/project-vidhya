# GATE EM Content Readiness Runbook
**Date:** 2026-08-09  
**Author:** Content Operations (Claude Code session)  
**Branch:** `claude/gate-engineering-math-content-tdjrb6`

---

## Purpose

This runbook defines the full end-to-end content generation plan for GATE Engineering Mathematics on the Vidhya platform. It codifies scope, format contracts, quality floors, and the generation pipeline so that any future session can pick up exactly where this one left off.

---

## Scope: 82 Concepts across 10 Topic Areas

Content is generated at **concept level** (not topic level). Topic-level files (`lecture-notes.md`, `formula-sheet.md`, `mcqs.json`, `teaching-tips.md`) already exist in `data/courses/gate-em/topics/`. This runbook governs the NEW concept-level content in `data/courses/gate-em/concepts/`.

### Topic → Concept Map

| # | Topic | Folder | Concepts |
|---|-------|--------|---------|
| 1 | Linear Algebra | `linear-algebra` | matrix-operations, determinants, matrix-inverse, systems-of-equations, rank-nullity, vector-spaces, linear-transformations, eigenvalues, diagonalization, cayley-hamilton, orthogonality |
| 2 | Calculus | `calculus` | sequences, series, limits, continuity, differentiability, derivatives-basic, chain-rule, product-quotient-rule, implicit-differentiation, maxima-minima, mean-value-theorems, integration-basics, integration-substitution, integration-by-parts, partial-fractions, definite-integrals, improper-integrals, multivariable-calculus, multiple-integrals |
| 3 | Differential Equations | `differential-equations` | ode-first-order, ode-bernoulli, ode-exact, ode-second-order-homo, ode-second-order-nonhomo, ode-higher-order, pde-basics |
| 4 | Complex Variables | `complex-variables` | complex-numbers, analytic-functions, complex-integration, taylor-laurent, residue-calculus, conformal-mapping |
| 5 | Probability & Statistics | `probability-statistics` | counting-principles, probability-basics, random-variables, discrete-distributions, continuous-distributions, joint-distributions, hypothesis-testing, regression-correlation |
| 6 | Numerical Methods | `numerical-methods` | root-finding, interpolation, numerical-integration, numerical-ode, numerical-linear-algebra |
| 7 | Transform Theory | `transform-theory` | laplace-transform, inverse-laplace, laplace-applications, fourier-series, fourier-transform, z-transform |
| 8 | Vector Calculus | `vector-calculus` | vector-fields, divergence-curl, line-integrals, surface-integrals, greens-theorem, stokes-theorem, gauss-divergence |
| 9 | Discrete Mathematics | `discrete-mathematics` | propositional-logic, sets-relations, functions-combinatorics, recurrence-relations, boolean-algebra, group-theory-basics |
| 10 | Graph Theory | `graph-theory` | graph-basics, graph-connectivity, trees, euler-hamilton, graph-coloring, planar-graphs, shortest-paths |

**Total: 82 concepts**

---

## Content Format Contract (per concept)

Each concept lives at `data/courses/gate-em/concepts/{concept-id}/` with exactly 3 files:

### 1. `explainer.md` — Visual analogy → Definition → Worked example

```markdown
# {Concept Label}
> GATE Engineering Mathematics | {Topic} | {gate_frequency} frequency

## Intuition First
[1–2 sentence visual/physical analogy — no jargon]

## Core Definition
[Formal definition with LaTeX. State the named theorem/property FIRST (bold).]

## What Happens (Worked Example)
[Concrete numeric example. Label steps clearly.]

## Why It Works
[Formal justification in 2–4 sentences]

## GATE MA Relevance
> [One-line callout: weightage, question type, problem pattern]
```

### 2. `mcqs.json` — 5 practice questions

```json
{
  "concept_id": "...",
  "topic": "...",
  "gate_frequency": "high|medium|low",
  "questions": [5 questions, mix of easy/medium/hard, with full step-by-step explanations]
}
```

Question schema (per item):
- `id`: `{concept-abbrev}-{nn}` (e.g. `eig-01`)
- `question`: string (LaTeX allowed)
- `options`: `{A, B, C, D}`
- `correct_answer`: `"A"|"B"|"C"|"D"`
- `explanation`: full step-by-step workthrough
- `difficulty`: `"easy"|"medium"|"hard"`
- `marks`: `1` or `2`
- `negative_marks`: `-0.33` (1-mark) or `-0.67` (2-mark)
- `tags`: array of concept/subtopic tags

### 3. `tips.md` — Strategy card

```markdown
# Teaching Tips: {Concept Label}

## Common Student Errors
## GATE Question Pattern
## Speed Tricks for MCQs
## Must-Memorize Formulas / Results
```

---

## Quality Rules (from `data/registry/rulesets/gate-ma.yml`)

All generated content MUST follow these rules:

1. **Property-first**: Named theorem/property in the FIRST sentence, bold.
2. **Worked-before-abstract**: Concrete numeric example BEFORE abstract symbols.
3. **Dual-track for linear algebra**: Every algebraic step gets a geometric interpretation.
4. **GATE relevance callout**: End every explainer with "Why it matters in GATE MA."

---

## Floor Contract (from `data/curriculum/gate-ma.floor.yml`)

| Asset | Floor | Notes |
|-------|-------|-------|
| explainer.md | 1 per concept | Must be non-placeholder |
| MCQs | 5 per concept (3 for abstract topics) | Verified or template-certified |
| tips.md | 1 per concept | Skipped for vector-spaces, linear-transformations, pde-basics, recurrence-relations, boolean-algebra, group-theory-basics, planar-graphs, euler-hamilton, graph-coloring |

---

## Output Directory

```
data/courses/gate-em/concepts/
  {concept-id}/
    explainer.md
    mcqs.json
    tips.md
```

---

## Generation Pipeline

```
gate-ma.yml (concept graph)
  → concept-level agents (one per topic, parallel)
  → write explainer.md + mcqs.json + tips.md per concept
  → git commit batch by batch
  → upload-gate-em-materials.ts bundles into frontend/public/data/content-bundle.json
```

---

## Progress Tracking

| Topic | Concepts | explainer | mcqs | tips | Status |
|-------|---------|-----------|------|------|--------|
| Linear Algebra | 11 | 11/11 | 11/11 | 11/11 | ✅ complete |
| Calculus | 19 | 19/19 | 19/19 | 19/19 | ✅ complete |
| Differential Equations | 7 | 7/7 | 7/7 | 7/7 | ✅ complete |
| Complex Variables | 6 | 6/6 | 6/6 | 6/6 | ✅ complete |
| Probability & Statistics | 8 | 8/8 | 8/8 | 8/8 | ✅ complete |
| Numerical Methods | 5 | 5/5 | 5/5 | 5/5 | ✅ complete |
| Transform Theory | 6 | 6/6 | 6/6 | 6/6 | ✅ complete |
| Vector Calculus | 7 | 7/7 | 7/7 | 7/7 | ✅ complete |
| Discrete Mathematics | 6 | 6/6 | 6/6 | 6/6 | ✅ complete |
| Graph Theory | 7 | 7/7 | 7/7 | 7/7 | ✅ complete |
| **TOTAL** | **82** | **82/82** | **82/82** | **82/82** | **100%** |

**Generation completed: 2026-08-09** — 246 files, 410 MCQ questions, ALL CLEAR (zero JSON errors).

---

## Session Resume Protocol

If DB is unavailable, content is stored locally in `data/courses/gate-em/concepts/`. The upload script (`scripts/upload-gate-em-materials.ts`) bundles these into `frontend/public/data/content-bundle.json` for the static demo deploy. Run:

```bash
npx tsx scripts/upload-gate-em-materials.ts
```

After DB is restored, load via the content studio API or the seed scripts.

---

*Runbook version 1.0 — 2026-08-09 — Project Vidhya*
