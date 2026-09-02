---
id: series.exam_pattern
concept_id: series
atom_type: exam_pattern
bloom_level: 3
difficulty: 0.4
exam_ids: ["*"]
modality: text
---

**How GATE actually asks this.**

- **NAT questions on geometric or telescoping series** usually want the numeric sum itself, computed from a closed form — $\sum_{n=0}^{\infty} ar^n = \dfrac{a}{1-r}$ for $|r|<1$. Example: $\sum_{n=0}^{\infty}\dfrac{3}{4^n} = \dfrac{3}{1-1/4}=4$, a one-line substitution once the series is recognized as geometric.
- **NAT/MCQ questions on convergence alone** (no sum required) usually hinge on a named test applied once: ratio test for factorial/exponential terms, $p$-series comparison ($\sum 1/n^p$ converges iff $p>1$) for polynomial terms.
- **MCQ/MSQ "which is true" questions** target the absolute-vs-conditional distinction directly: "if $\sum a_n$ converges, then $\sum |a_n|$ converges" (false — the alternating harmonic series is the standard counterexample) and "if $\sum |a_n|$ converges, then $\sum a_n$ converges" (true — absolute convergence is the stronger claim).
- **Time budget:** a ratio-test convergence check on a factorial/exponential term should resolve in under a minute — it's one limit. Reserve time for series where the ratio test returns $L=1$; that's the sign a second test is needed, not a sign to keep re-checking the same limit.
