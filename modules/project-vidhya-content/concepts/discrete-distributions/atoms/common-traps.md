---
id: discrete-distributions.common-traps
concept_id: discrete-distributions
atom_type: common_traps
bloom_level: 3
difficulty: 0.5
exam_ids: ["*"]
---

**Trap 1 — Binomial where Hypergeometric belongs.** Sampling without replacement from a small, finite population changes the success probability every draw; using the Binomial formula there is a genuinely different (and wrong) computation, not just an approximation.

**Trap 2 — Off-by-one in Geometric.** $(1-p)^{k-1}p$ counts trials *up to and including* the first success ($k\ge1$); some sources define it as failures *before* the first success ($k\ge0$, exponent $k$) — check which convention a problem uses before substituting.

**Trap 3 — Poisson approximation misapplied.** Using $\lambda=np$ as a Poisson stand-in for Binomial only holds up when $n$ is large and $p$ is small; for moderate $p$ (like $0.3$), the two distributions diverge and the approximation silently loses accuracy.

**Trap 4 — Mean and variance mixed up.** Binomial's mean is $np$; its variance is $np(1-p)$ — not $np$ again. Confusing the two under time pressure produces a variance that's too large.
