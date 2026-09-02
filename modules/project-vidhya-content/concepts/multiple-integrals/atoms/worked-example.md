---
id: multiple-integrals.worked_example
concept_id: multiple-integrals
atom_type: worked_example
bloom_level: 3
difficulty: 0.35
exam_ids: ["*"]
scaffold_fade: true
---

**Problem.** Evaluate $\displaystyle\int_0^1\!\!\int_0^2 xy\,dy\,dx$.

**Step 1 — Inner integral (hold $x$ fixed, integrate over $y$).**
$$
\int_0^2 xy\,dy=x\left[\frac{y^2}{2}\right]_0^2=2x.
$$

**Step 2 — Outer integral (integrate the result over $x$).**
$$
\int_0^1 2x\,dx=\left[x^2\right]_0^1=1.
$$

**Step 3 — Box the result.**
$$
\boxed{\int_0^1\!\!\int_0^2 xy\,dy\,dx=1}
$$

**Step 4 — Verify by swapping the order (Fubini).** Integrate over $x$ first instead:
$$
\int_0^1 xy\,dx=y\left[\frac{x^2}{2}\right]_0^1=\frac{y}{2},
\qquad
\int_0^2 \frac{y}{2}\,dy=\left[\frac{y^2}{4}\right]_0^2=1.
$$
Both orders give the same value — exactly what Fubini guarantees for a continuous integrand on a rectangle, and a live check that neither pass of arithmetic went wrong.
