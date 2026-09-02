---
id: continuous-distributions.common-traps
concept_id: continuous-distributions
atom_type: common_traps
bloom_level: 3
difficulty: 0.5
exam_ids: ["*"]
---

**Trap 1 — Treating a point probability as nonzero.** $P(X=a)=0$ for any continuous variable at any single point; only interval probabilities are meaningful.

**Trap 2 — Sign errors on $\Phi(-z)$.** $\Phi(-z)=1-\Phi(z)$, not $-\Phi(z)$; dropping the "$1-$" silently produces a negative or nonsensical probability.

**Trap 3 — Applying memorylessness outside Exponential.** Normal, Uniform, and Gamma (for $k>1$) all carry history; only Exponential satisfies $P(X>s+t\mid X>s)=P(X>t)$.

**Trap 4 — Confusing variance with standard deviation in the $z$-formula.** If a problem states $\text{Var}(X)=100$, then $\sigma=10$ (the square root), not $100$ — using variance directly in $z=(x-\mu)/\sigma$ scales every z-score by a factor of 10 too small.
