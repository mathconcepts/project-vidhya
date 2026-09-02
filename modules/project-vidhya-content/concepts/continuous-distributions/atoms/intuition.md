---
id: continuous-distributions.intuition
concept_id: continuous-distributions
atom_type: intuition
bloom_level: 2
difficulty: 0.15
exam_ids: ["*"]
---

A continuous distribution's PDF $f(x)$ is a curve, not a list of weights — the height at any single $x$ isn't a probability at all (it can even exceed 1). What matters is *area*: $P(a<X<b)$ is the area under $f(x)$ between $a$ and $b$, and the total area under the whole curve is exactly 1.

The Normal distribution's curve is the familiar bell — symmetric, centered at $\mu$, spread controlled by $\sigma$. Standardizing with $z=(x-\mu)/\sigma$ converts *any* normal curve into the one standard curve every z-table already has memorized, so a single table serves every mean and spread.

The Exponential distribution models waiting times between rare events — its curve decays fastest right at $x=0$ and never touches zero. Its defining trait, memorylessness, means a component that has already survived 5 years has exactly the same remaining-lifetime distribution as a brand-new one — history doesn't matter, only the rate does.

Uniform spreads probability evenly across an interval; Gamma generalizes Exponential to "waiting for the $k$-th event," not just the first.
