---
id: improper-integrals.common_traps
concept_id: improper-integrals
atom_type: common_traps
bloom_level: 3
difficulty: 0.4
exam_ids: ["*"]
tested_by_atom: improper-integrals.micro-exercise
---

**Trap 1 — Plugging FTC across the bad endpoint directly.** Writing $\left[F(x)\right]_a^\infty$ and substituting $\infty$ as if it were a number, or evaluating $F$ at a point where the integrand is undefined, skips the limiting process entirely — it can produce a finite-looking number even for a genuinely divergent integral.

**Trap 2 — Missing an interior singularity.** $\int_{-1}^1 x^{-2}\,dx$ is improper at $x=0$ even though $0$ sits inside the interval, not at an endpoint; treating only the endpoints as suspect misses it, and this particular one diverges once caught.

**Trap 3 — Flipping the $p$-test direction.** The threshold $p=1$ works oppositely depending on where the singularity sits: $p>1$ converges at infinity, $p<1$ converges at a point. Applying the wrong direction misclassifies almost every borderline case.
