---
# Alternative body for vector-fields.worked-example, served when the learner stance is
# `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
id: vector-fields.worked_example.assured
concept_id: vector-fields
atom_type: worked_example
bloom_level: 3
difficulty: 0.40
exam_ids: [gate-ma]
scaffold_fade: 1
variant_of: vector-fields-worked-example
for_stance: assured
---

$\mathbf F=(2xy,x^2-y^2)$: $\partial Q/\partial x=\partial P/\partial y=2x$, conservative on all of $\mathbb R^2$; $\phi=x^2y-\frac{y^3}{3}$, integrating $P$ in $x$ then fixing the leftover $y$-function against $Q$; $\int_C\mathbf F\cdot d\mathbf r=\phi(1,1)-\phi(0,0)=\frac23$ along any path from $(0,0)$ to $(1,1)$, $y=x$ included.

The step not to skip is the equality check itself: without confirming $\partial Q/\partial x=\partial P/\partial y$ first, $\phi$ might not exist at all, and building one anyway — integrating $P$, differentiating, matching — simply fails at the matching step, leaving an $x$-term where only a function of $y$ should remain. That failure, not a separately memorized rule, is the real test for whether the potential-function shortcut was ever available.

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: is F = (2xy, x²-y²) conservative? Evaluate ∫_C F·dr","steps":[{"prompt":"For F = (2xy, x² − y²), compute ∂Q/∂x where Q = x² − y².","hint":"Differentiate x² − y² with respect to x, treating y as constant.","answer":"∂Q/∂x = 2x"},{"prompt":"Now compute ∂P/∂y where P = 2xy, and state whether F is conservative.","hint":"Differentiate 2xy with respect to y, treating x as constant. Then compare with ∂Q/∂x.","answer":"∂P/∂y = 2x. Since ∂Q/∂x = ∂P/∂y = 2x, F is conservative."},{"prompt":"Using the scalar potential φ = x²y − y³/3, evaluate ∫_C F·dr from (0,0) to (1,1).","hint":"For a conservative field, ∫_C F·dr = φ(endpoint) − φ(startpoint). Plug in (1,1) and (0,0).","answer":"φ(1,1) − φ(0,0) = (1 − 1/3) − 0 = 2/3"}]}
```
