---
id: improper-integrals.interleaved_drill
concept_id: improper-integrals
atom_type: interleaved_drill
bloom_level: 4
difficulty: 0.6
exam_ids: ["*"]
modality: drill
---

**Cross-concept check: definite-integrals → improper-integrals.**

**Q1 (definite integrals).** Evaluate the ordinary definite integral $\int_2^4 \frac{1}{x^2}\,dx$.

**A1.** Antiderivative $-x^{-1}$: $\left[-\tfrac1x\right]_2^4=-\tfrac14-\left(-\tfrac12\right)=\tfrac14$.

**Q2 (improper integrals).** Now push the lower bound down to $0$: evaluate $\int_0^4 \frac{1}{x^2}\,dx$.

**A2.** The integrand blows up at $x=0$, which now sits at the boundary — this is Type II. Point-singularity test: $p=2>1$ means DIVERGENT (the direction that converges at infinity is the wrong direction at a point). Confirm directly: $\int_\varepsilon^4 x^{-2}dx=\tfrac1\varepsilon-\tfrac14\to\infty$ as $\varepsilon\to0^+$.

**Why this drill exists.** The exact same integrand, $1/x^2$, is perfectly ordinary over $[2,4]$ and genuinely divergent over $[0,4]$ — the only thing that changed is whether a bound sits at the singularity. Students who verify convergence once for a family of integrals sometimes stop checking whether a NEW bound has moved onto the trouble spot.
