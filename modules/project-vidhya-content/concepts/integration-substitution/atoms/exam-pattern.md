---
id: integration-substitution.exam-pattern
concept_id: integration-substitution
atom_type: exam_pattern
bloom_level: 3
difficulty: 0.40
exam_ids: ["*"]
modality: text
---

**How GATE actually asks this.**

- **NAT questions usually ask for a definite integral**, which means the substitution must also convert the bounds — evaluating in terms of $u$ against the substituted $u$-bounds, or converting back to $x$ before plugging in the original bounds, but never mixing the two conventions.

  Example: $\int_0^1 2x\cos(x^2)\,dx$ with $u=x^2$ converts the bounds to $u=0$ and $u=1$: $\int_0^1\cos u\,du=[\sin u]_0^1=\sin(1)-\sin(0)=\sin(1)$.

- **MCQ questions test whether you can spot the correct $u$** among several plausible choices — usually offering the outer function, the inner function, and the whole integrand as tempting wrong picks alongside the correct inner-function choice.

- **A missing constant factor is the signature GATE twist:** an integrand like $\sin(3x+1)$ has shadow $3$, not $1$ — the correction factor $\frac13$ must be pulled out explicitly, and it is the single most common place a mark is dropped on this pattern.

- **Time budget:** spotting the substitution should take under 20 seconds once the shadow-matching habit is automatic; the algebra afterward rarely exceeds a minute for a GATE-level integrand.
