---
id: multiple-integrals.intuition
concept_id: multiple-integrals
atom_type: intuition
bloom_level: 2
difficulty: 0.3
exam_ids: ["*"]
---

Integrate a function of two variables over a two-dimensional region the same way you'd integrate one variable, just twice, in sequence. Freeze the outer variable — exactly the same freezing move a partial derivative uses — and integrate over the inner variable first, as an ordinary single-variable integral. Whatever comes out is a function of the (still-frozen) outer variable; integrate THAT normally to finish.

As a sanity check, integrating the constant function $1$ over a region just recovers its plain area: $\int_0^1\int_0^2 1\,dy\,dx=\int_0^1 2\,dx=2$ — base times height, exactly as expected for a $1\times2$ rectangle.

A genuinely two-variable example: $\int_0^1\int_0^2 xy\,dy\,dx$. Inner integral (over $y$, $x$ frozen): $\int_0^2 xy\,dy=x\cdot\left[\tfrac{y^2}{2}\right]_0^2=2x$. Outer integral: $\int_0^1 2x\,dx=\left[x^2\right]_0^1=1$. The whole computation never handles both variables at once — it's two ordinary single-variable integrals, run back to back.
