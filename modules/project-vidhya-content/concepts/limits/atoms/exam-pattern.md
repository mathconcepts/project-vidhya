---
id: limits.exam_pattern
concept_id: limits
atom_type: exam_pattern
bloom_level: 3
difficulty: 0.4
exam_ids: ["*"]
modality: text
---

**How GATE actually asks this.**

- **NAT questions** typically give a single limit expression and want the numeric value — indeterminate-form recognition plus one or two L'Hôpital passes, or a standard trig/exponential limit identity, resolves most of them. Example: $\lim_{x\to0}\dfrac{e^{2x}-1}{x}=2$ (a direct application of the standard limit $\lim_{u\to0}\frac{e^u-1}{u}=1$ with $u=2x$).
- **MCQ/MSQ "which statement is true" questions** target one-sided limits and existence directly: "the limit exists at every point where the function is continuous" (true, trivially) versus "the limit exists only where the function is defined" (false — a removable hole is the standard counterexample).
- **Piecewise-function questions** ask for a constant that makes a two-sided limit exist — set the left-hand and right-hand expressions equal at the join point and solve; this is algebra, not calculus, once the two one-sided limits are written down.
- **Time budget:** a single-application L'Hôpital problem should resolve in well under a minute. If a first pass leaves the form still indeterminate, budget for a second pass rather than guessing — but never more than two or three passes for a GATE-level problem; more than that usually signals a faster identity was available.
