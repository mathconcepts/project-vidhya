---
id: random-variables.common-traps
concept_id: random-variables
atom_type: common_traps
bloom_level: 3
difficulty: 0.5
exam_ids: ["*"]
---

**Trap 1 — Squaring in the wrong order.** $\text{Var}(X)=E[X^2]-(E[X])^2$, never $E[(X^2-X)]$ or $(E[X^2]-E[X])^2$. Compute both expectations separately before subtracting.

**Trap 2 — A PMF that doesn't sum to 1.** If given probabilities look like a PMF but sum to $0.9$ or $1.1$, the question has an error or a missing value — check the sum before computing anything downstream.

**Trap 3 — Confusing $f(x)$ with $P(X=x)$ for continuous variables.** A PDF's value at a point is not a probability; only $\int_a^b f(x)dx$ over an interval is. $P(X=a)=0$ for any single point of a continuous variable.

**Trap 4 — Reading the CDF at the wrong point.** $F(x)=P(X\le x)$ includes $x$ itself for a discrete variable — using a strict $<$ silently drops that value's probability.
