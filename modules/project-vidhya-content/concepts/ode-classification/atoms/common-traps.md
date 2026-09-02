---
id: ode-classification.common-traps
concept_id: ode-classification
atom_type: common_traps
bloom_level: 3
difficulty: 0.35
exam_ids: ["*"]
tested_by_atom: ode-classification.micro-exercise
---

**Trap 1 — Reading degree before clearing the equation.** Students see $\sqrt{y'}$ or $1/y''$ and assign a degree by squinting at the visible exponent, instead of first checking whether the equation is polynomial in its derivatives at all. A root or a derivative-in-denominator must be cleared by legal algebra (isolate, then raise both sides to a power) *before* degree can be read off — and sometimes clearing is impossible, which means degree is undefined, not $1$.

**Trap 2 — Conflating order with degree.** "Second order" and "degree two" sound similar and are answered by completely different questions: order asks *which* derivative is highest; degree asks what *power* that specific derivative carries. An equation can be order $4$, degree $1$, or order $1$, degree $5$ — the two numbers are independent.

**Trap 3 — Judging linearity from the highest-order term alone.** A leading term like $y''$ appearing to the first power looks linear, but a lower-order term such as $y\,y'$, $y^2$, or $\sin y$ elsewhere in the same equation is enough to make the whole thing non-linear. Every term must be checked, not just the one with the biggest derivative.
