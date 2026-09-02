---
id: differentiability.exam_pattern
concept_id: differentiability
atom_type: exam_pattern
bloom_level: 3
difficulty: 0.4
exam_ids: ["*"]
modality: text
---

**How GATE actually asks this.**

- **NAT questions** commonly give a piecewise function with unknown constants and ask for the value(s) that make it differentiable at the join point — this always decomposes into a continuity equation and a matching-derivatives equation, solved together. Example: $f(x)=x^2$ ($x<1$), $ax+b$ ($x\ge1$) gives $a=2,\ b=-1$.
- **MCQ/MSQ "which statement is true" questions** target the continuity/differentiability direction directly: "differentiable $\Rightarrow$ continuous" (true) and "continuous $\Rightarrow$ differentiable" (false, with $|x|$ or $x^{1/3}$ as the standard counterexample offered among the options).
- **"Check differentiability of $|x|$-style functions at a specific point" questions** want the left-hand and right-hand derivatives computed explicitly and compared — not a visual judgment about whether the graph "looks smooth."
- **Time budget:** a two-equation constant-finding problem should resolve in about a minute once both conditions are written down; most of the time cost is remembering to write down *both* equations rather than the algebra itself.
