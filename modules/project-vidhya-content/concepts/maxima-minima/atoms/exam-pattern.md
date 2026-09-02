---
id: maxima-minima.exam-pattern
concept_id: maxima-minima
atom_type: exam_pattern
bloom_level: 3
difficulty: 0.45
exam_ids: ["*"]
modality: text
---

**How GATE actually asks this.**

- **NAT questions ask for the extremum's location, its value, or both** — read the question carefully, since "find the minimum value of $f$" and "find where $f$ is minimized" want different numbers from the same computation.

  Example: for $f(x) = x^2 - 4x + 7$, $f'(x) = 2x-4=0$ gives $x=2$, and $f(2) = 4-8+7=3$. "Where" wants $2$; "value" wants $3$ — both come from the same working, but only one is the requested entry.

- **MCQ/MSQ questions on a closed interval test whether endpoints were checked at all.** A critical point inside the interval is not automatically the global extremum; the standard distractor set omits one endpoint's value from the comparison.

- **Word-problem optimization (maximize area/volume, minimize cost/material) hides the function inside a constraint** — the real first step is expressing the target quantity as a single-variable function using the constraint, before any derivative is taken at all.

- **Time budget:** a direct critical-point-and-classify question should take under ninety seconds; a closed-interval or word-problem version, two to three minutes, most of it spent setting up the right function rather than differentiating it.
