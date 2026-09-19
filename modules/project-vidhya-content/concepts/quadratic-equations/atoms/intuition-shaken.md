---
id: quadratic-equations.intuition-shaken
concept_id: quadratic-equations
atom_type: intuition
variant_of: quadratic-equations.intuition
for_stance: shaken
bloom_level: 2
difficulty: 0.1
exam_ids: ["*"]
---

Take $y = x^2-5x+6$. This is a bowl-shaped curve, opening upward since the coefficient of $x^2$ is positive.

Compute $D = b^2-4ac = 25-24 = 1$. Since $D>0$, the curve crosses the axis at two separate points. Solve $x^2-5x+6=0$: it factors as $(x-2)(x-3)=0$, giving roots $x=2$ and $x=3$ — two distinct crossing points, matching $D>0$.

Now check the sum and product without solving again. Sum of roots: $2+3=5$. Compare to $-b/a = -(-5)/1 = 5$. Matches. Product of roots: $2 \times 3 = 6$. Compare to $c/a = 6/1 = 6$. Matches. Both formulas work without ever factoring — read $-b/a$ and $c/a$ straight off the coefficients $a=1, b=-5, c=6$.

If instead $D$ had come out negative, the curve would never touch the axis at all — no real roots, only a complex-conjugate pair.
