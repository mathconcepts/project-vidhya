---
id: z-transform.exam-pattern
concept_id: z-transform
atom_type: exam_pattern
bloom_level: 2
difficulty: 0.35
exam_ids: ["*"]
modality: text
---

**How GATE actually asks this.**

- **NAT (numeric answer):** given $X(z)$, evaluate it (or the recovered sequence $x[n]$) at a specific point. Example: $x[n] = \delta[n] - 0.5\,\delta[n-1]$ has $X(z) = 1 - 0.5z^{-1}$; evaluated at $z=1$, $X(1) = 1-0.5 = 0.5$.
- **MCQ:** given $X(z)$ and its ROC, pick the correct $x[n]$ from options that differ in whether the sequence is causal or anti-causal — the algebraic form $\frac{z}{z-a}$ alone is not enough to decide, and that ambiguity is exactly what the distractors exploit.
- **MSQ:** identify which statements about pole location and stability are correct, including the boundary case — a pole exactly on the unit circle is neither a stable decay nor an unstable blow-up.

**Time budget:** a direct table-pair match (recognising $z/(z-a)$ or $1/(1-az^{-1})$) should take under a minute. A partial-fraction decomposition for a higher-order $X(z)$ typically costs two to three minutes, and always finish by stating the ROC explicitly — an answer without it is an incomplete answer, not a rounding-off detail.
