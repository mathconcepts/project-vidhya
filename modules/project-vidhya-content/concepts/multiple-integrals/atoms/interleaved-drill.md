---
id: multiple-integrals.interleaved_drill
concept_id: multiple-integrals
atom_type: interleaved_drill
bloom_level: 4
difficulty: 0.65
exam_ids: ["*"]
modality: drill
---

**Cross-concept check: multivariable-calculus → multiple-integrals.**

**Q1 (multivariable calculus).** For $f(x,y)=x^2y$, find $\partial f/\partial x$ at $(1,2)$.

**A1.** $\partial f/\partial x=2xy$. At $(1,2)$: $2(1)(2)=4$.

**Q2 (multiple integrals).** Now integrate the SAME function over the unit square: $\int_0^1\int_0^1 x^2y\,dy\,dx$.

**A2.** Inner, over $y$: $\int_0^1 x^2y\,dy=x^2\left[\tfrac{y^2}2\right]_0^1=\tfrac{x^2}2$. Outer, over $x$: $\int_0^1\tfrac{x^2}2\,dx=\tfrac12\cdot\tfrac13=\tfrac16$.
$$
\boxed{\int_0^1\int_0^1 x^2y\,dy\,dx=\frac16}
$$

**Why this drill exists.** The two questions ask opposite things about the exact same expression: a LOCAL rate at one point (differentiate, freeze, read a slope) versus a GLOBAL total over a whole region (integrate, freeze, read an accumulation). Reaching for the wrong operation under time pressure — integrating when a rate was asked, or differentiating when a total was asked — produces an answer of the right general shape but the wrong meaning entirely.
