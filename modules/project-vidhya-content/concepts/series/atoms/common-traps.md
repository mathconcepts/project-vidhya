---
id: series.common_traps
concept_id: series
atom_type: common_traps
bloom_level: 3
difficulty: 0.3
exam_ids: ["*"]
tested_by_atom: series.micro-exercise
---

**Trap 1 — Treating "$L=1$" as a verdict.** The ratio test at $L=1$ is **inconclusive**, not a proof of divergence or convergence — $\sum \dfrac1n$ (diverges) and $\sum \dfrac1{n^2}$ (converges) both give $L=1$. A different test (comparison, integral, $p$-series) is required whenever the ratio test lands here.

**Trap 2 — Assuming convergence means absolute convergence.** $\sum \dfrac{(-1)^{n+1}}{n}$ converges but $\sum \dfrac1n$ (its absolute-value series) diverges — "convergent" and "absolutely convergent" are different claims, and only the second permits freely reordering terms.

**Trap 3 — Applying the ratio/root test to a series with terms that don't shrink geometrically at all.** For $\sum \dfrac1n$, the ratio test gives $L=1$ every time — reaching for it here wastes a step; the direct $p$-series comparison ($p=1$, diverges) is faster and decisive.
