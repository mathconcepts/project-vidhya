---
# Alternative body for ode-exact-worked-example, served when the learner
# stance is `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
#
# The fenced interactive block below is copied verbatim from the base
# atom so the widget cannot drift between variants; only prose differs.
id: ode-exact.worked-example.assured
concept_id: ode-exact
atom_type: worked_example
bloom_level: 3
difficulty: 0.40
exam_ids: [gate-ma]
scaffold_fade: 1
variant_of: ode-exact-worked-example
for_stance: assured
---

## $(2xy+3x^2)\,dx+(x^2+4y^3)\,dy=0$: check exactness before anything else

$M_y=2x=N_x$, so the equation is exact — confirm this first, since applying the potential-function method to a non-exact equation produces an $F$ that fails its own check later, not an error you catch up front.

Integrate $M$ in $x$: $F=x^2y+x^3+g(y)$. Fix $g$ from $F_y\overset{!}{=}N$: $g'(y)=4y^3$, so $g=y^4$.

$$\boxed{x^2y+x^3+y^4=C}$$

The mark-costing trap: integrating $N$ in $y$ separately and adding it to the $x$-integral double-counts $x^2y$, since that term is visible to both integrations. $g(y)$ exists precisely to hold only what the $x$-integration missed.

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: solving the exact ODE (2xy+3x²)dx + (x²+4y³)dy = 0","steps":[{"prompt":"What is the exactness condition that must hold for M dx + N dy = 0 to be exact?","hint":"It relates a partial derivative of M to a partial derivative of N. Think about mixed second-order partials of the potential function F.","answer":"∂M/∂y = ∂N/∂x. This ensures the mixed partials of F are equal, so F exists."},{"prompt":"After integrating M = 2xy + 3x² with respect to x, we get F = x²y + x³ + g(y). How do we find g(y)?","hint":"Differentiate F with respect to y and set the result equal to N = x² + 4y³.","answer":"∂F/∂y = x² + g′(y) = x² + 4y³, so g′(y) = 4y³ and g(y) = y⁴. The general solution is x²y + x³ + y⁴ = C."}]}
```
