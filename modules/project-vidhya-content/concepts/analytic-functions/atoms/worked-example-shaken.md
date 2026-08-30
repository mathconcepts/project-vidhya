---
# Alternative body for analytic-functions.worked_example, served when the learner stance is
# `shaken`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who is low on this concept and low on confidence:
# smallest true first step, concrete numbers before symbols, picture before
# formula, and the check made explicit. No praise, no reassurance, and no
# mention of how the reader might be feeling — a small win is what steadies
# someone, not being told they are struggling.
id: analytic-functions.worked-example.shaken
concept_id: analytic-functions
atom_type: worked_example
bloom_level: 3
difficulty: 0.40
exam_ids: [gate-ma]
scaffold_fade: 1
variant_of: analytic-functions-worked-example
for_stance: shaken
---

Take $z=1+2i$, so $x=1,y=2$. Then $f(z)=z^2=(1+2i)^2=1+4i+4i^2=-3+4i$ — real part $-3$, imaginary part $4$, one concrete value before any symbols.

Now write it in general: $z=x+iy$, $f(z)=z^2=(x^2-y^2)+i(2xy)$, so $u=x^2-y^2$, $v=2xy$.

**Step 1 — the four partials.** $u_x=2x$, $u_y=-2y$, $v_x=2y$, $v_y=2x$.

**Step 2 — check both CR equations.** $u_x=v_y$: $2x=2x$, holds. $u_y=-v_x$: $-2y=-2y$, holds. Both hold for every $(x,y)$, and each partial is a polynomial — continuous everywhere, which the check needs, not just the two equalities.

**Step 3 — conclude.** $f$ is analytic at every point of $\mathbb{C}$: entire. The derivative $f'(z)=u_x+iv_x=2x+i(2y)=2z$ matches direct complex differentiation.

The two things the check actually needs: both CR equalities holding, and continuous partials — on an open set, not one point.

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: verifying Cauchy-Riemann equations for f(z) = e^z","steps":[{"prompt":"For f(z) = e^z, write u and v in terms of x and y, then state ∂u/∂x.","hint":"e^z = e^(x+iy) = e^x · e^(iy) = e^x(cos y + i sin y). So u = e^x cos y and v = e^x sin y. Differentiate u with respect to x.","answer":"∂u/∂x = e^x cos y"},{"prompt":"Now verify the first Cauchy-Riemann equation ∂u/∂x = ∂v/∂y for e^z.","hint":"Compute ∂v/∂y = ∂(e^x sin y)/∂y = e^x cos y.","answer":"∂u/∂x = e^x cos y = ∂v/∂y ✓. The CR equation holds for all (x,y), confirming e^z is entire."}]}
```
