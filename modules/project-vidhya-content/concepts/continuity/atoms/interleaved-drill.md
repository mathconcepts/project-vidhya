---
id: continuity.interleaved_drill
concept_id: continuity
atom_type: interleaved_drill
bloom_level: 4
difficulty: 0.6
exam_ids: ["*"]
modality: drill
tested_by_atom: continuity.micro-exercise
---

**Cross-concept check: continuity → differentiability.**

Let $f(x)=x^{2/3}$.

**Question 1 (continuity):** Is $f$ continuous at $x=0$?

*Answer:* Yes — $f(0)=0$, $\lim_{x\to0}x^{2/3}=0$, and they match. All three conditions hold; there is no gap in the curve at all.

**Question 2 (differentiability):** Is $f$ differentiable at $x=0$?

*Answer:* No. $f'(x)=\dfrac23 x^{-1/3}$, which blows up to $\infty$ as $x\to0$ from either side — the tangent line at $x=0$ would have to be vertical, and a vertical "slope" is not a real number. Differentiability fails even though continuity holds.

**Why this drill exists:** continuity being unbroken tells you nothing about whether a tangent line exists — this pair is the standard counterexample showing continuity is *necessary* for differentiability but nowhere near *sufficient*, distinct from a corner (like $|x|$) where continuity also holds but the failure mode is mismatched slopes rather than a vertical one.
