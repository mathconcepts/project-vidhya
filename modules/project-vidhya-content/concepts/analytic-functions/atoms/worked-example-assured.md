---
# Alternative body for analytic-functions.worked_example, served when the learner stance is
# `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
id: analytic-functions.worked-example.assured
concept_id: analytic-functions
atom_type: worked_example
bloom_level: 3
difficulty: 0.40
exam_ids: [gate-ma]
scaffold_fade: 1
variant_of: analytic-functions-worked-example
for_stance: assured
---

$f(z)=z^2$: $u=x^2-y^2$, $v=2xy$ gives $u_x=v_y=2x$, $u_y=-v_x=-2y$ everywhere, all four partials polynomial hence continuous — CR plus continuity holds on all of $\mathbb C$, so $f$ is entire, $f'(z)=2z$.

CR alone is necessary but never sufficient by itself, and this is where marks go missing: $g(z)=|z|^2$ has $u_x=2x=v_y=0$ only on the line $x=0$ — a curve, not an open set — so $g$ is analytic nowhere despite CR holding there.

Faster route for "find analytic $f=u+iv$ given $u$": integrate $v_y=u_x$ in $y$ to get $v$ up to a function of $x$, then fix it using $v_x=-u_y$ — solving CR forward is self-checking; never guess $v$ and verify after.

Polar shortcut when $f$ is naturally radial: $u_r=\frac1rv_\theta$, $v_r=-\frac1ru_\theta$ skip the Cartesian split entirely.

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: verifying Cauchy-Riemann equations for f(z) = e^z","steps":[{"prompt":"For f(z) = e^z, write u and v in terms of x and y, then state ∂u/∂x.","hint":"e^z = e^(x+iy) = e^x · e^(iy) = e^x(cos y + i sin y). So u = e^x cos y and v = e^x sin y. Differentiate u with respect to x.","answer":"∂u/∂x = e^x cos y"},{"prompt":"Now verify the first Cauchy-Riemann equation ∂u/∂x = ∂v/∂y for e^z.","hint":"Compute ∂v/∂y = ∂(e^x sin y)/∂y = e^x cos y.","answer":"∂u/∂x = e^x cos y = ∂v/∂y ✓. The CR equation holds for all (x,y), confirming e^z is entire."}]}
```
