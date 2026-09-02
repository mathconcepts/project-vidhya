---
id: differentiability.interleaved_drill
concept_id: differentiability
atom_type: interleaved_drill
bloom_level: 4
difficulty: 0.6
exam_ids: ["*"]
modality: drill
tested_by_atom: differentiability.micro-exercise
---

**Cross-concept check: differentiability → continuity.**

Let $f(x)=|x|$.

**Question 1 (differentiability):** Is $f$ differentiable at $x=0$?

*Answer:* No — the left-hand derivative is $-1$ and the right-hand derivative is $+1$. They disagree, so no single derivative exists at $x=0$.

**Question 2 (continuity):** Is $f$ continuous at $x=0$?

*Answer:* Yes. $f(0)=0$, $\lim_{x\to0}|x|=0$, and they match — all three conditions for continuity hold, even though differentiability just failed.

**Why this drill exists:** this is the standard pairing that proves continuity is necessary but not sufficient for differentiability — a student who has just correctly shown non-differentiability sometimes over-generalizes and reports the function as discontinuous too, when the two verdicts are entirely independent here.
