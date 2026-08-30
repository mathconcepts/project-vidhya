---
# Alternative body for multiple-integrals.worked_example, served when the
# learner stance is `shaken`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who is low on this concept and low on confidence:
# smallest true first step, concrete numbers before symbols, picture before
# formula, and the check made explicit. No praise, no reassurance, and no
# mention of how the reader might be feeling — a small win is what steadies
# someone, not being told they are struggling.
id: multiple-integrals.worked_example.shaken
concept_id: multiple-integrals
atom_type: worked_example
bloom_level: 3
difficulty: 0.40
exam_ids: ["*"]
scaffold_fade: true
variant_of: multiple-integrals.worked-example
for_stance: shaken
---

**Given:** $\iint_R e^{-(x^2+y^2)}\,dA$, $R$ the unit disk $x^2+y^2\le1$.

**Step 1.** Notice the integrand depends only on $r=\sqrt{x^2+y^2}$ — switch to polar.

**Step 2.** Substitute $x^2+y^2=r^2$ and $dA=r\,dr\,d\theta$.

**Step 3.** Rewrite the region: the disk becomes $0\le r\le1$, $0\le\theta\le2\pi$.

**Step 4.** Set up the new integral: $\int_0^{2\pi}\int_0^1 e^{-r^2}\cdot r\,dr\,d\theta$.

**Step 5.** Do the inner integral only. Let $u=-r^2$, $du=-2r\,dr$: $\int_0^1 re^{-r^2}dr=\frac12(1-e^{-1})$.

**Step 6.** Do the outer integral: $\int_0^{2\pi}\frac12(1-e^{-1})\,d\theta=\frac12(1-e^{-1})\cdot2\pi=\pi(1-e^{-1})$.

**Answer:** $\pi(1-e^{-1})$.

**Check it:** $e^{-1}\approx0.368$, so the answer is about $\pi(0.632)\approx1.98$ — less than the disk's own area $\pi\approx3.14$, which makes sense since the pillars shrink toward the edge.

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: Double integral in polar coordinates","steps":[{"prompt":"Step 1: What symmetry do you notice in $e^{-(x^2+y^2)}$?","hint":"The exponent involves $x^2 + y^2$. What does this quantity represent geometrically?","answer":"The integrand depends only on distance from the origin: $r = \\sqrt{x^2+y^2}$. This suggests using polar coordinates."},{"prompt":"Step 2: Write the Jacobian for the transformation from Cartesian to polar coordinates.","hint":"Remember: $x = r\\cos\\theta$, $y = r\\sin\\theta$. The area element changes by a factor equal to the absolute value of the determinant of the Jacobian matrix.","answer":"$dA = r \\, dr \\, d\\theta$ (the Jacobian factor is $r$)"},{"prompt":"Step 3: Set up the bounds. For the unit disk $x^2+y^2 \\leq 1$, what are the limits on $r$ and $\\theta$?","hint":"The radius ranges from the center to the boundary circle. The angle sweeps all the way around.","answer":"$0 \\leq r \\leq 1$ and $0 \\leq \\theta \\leq 2\\pi$"}],"caption":"Master polar coordinates: the key to solving radially symmetric integrals efficiently."}
```
