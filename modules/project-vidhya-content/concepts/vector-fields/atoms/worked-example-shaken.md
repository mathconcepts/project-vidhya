---
# Alternative body for vector-fields.worked-example, served when the learner stance is
# `shaken`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who is low on this concept and low on confidence:
# smallest true first step, concrete numbers before symbols, picture before
# formula, and the check made explicit. No praise, no reassurance, and no
# mention of how the reader might be feeling — a small win is what steadies
# someone, not being told they are struggling.
id: vector-fields.worked_example.shaken
concept_id: vector-fields
atom_type: worked_example
bloom_level: 3
difficulty: 0.40
exam_ids: [gate-ma]
scaffold_fade: 1
variant_of: vector-fields-worked-example
for_stance: shaken
---

$\mathbf F=(2xy,\,x^2-y^2)$. First the check: $P=2xy,\,Q=x^2-y^2$. $\partial Q/\partial x=2x$. $\partial P/\partial y=2x$. Equal, so $\mathbf F$ is conservative on all of $\mathbb R^2$, a domain with no holes to worry about.

Build $\phi$ one piece at a time. Integrate $\partial\phi/\partial x=2xy$ over $x$: $\phi=x^2y+g(y)$. Differentiate that with respect to $y$: $x^2+g'(y)$, and match it to $\partial\phi/\partial y=x^2-y^2$, giving $g'(y)=-y^2$, so $g(y)=-\frac{y^3}{3}$. So $\phi=x^2y-\frac{y^3}{3}$.

Evaluate along $y=x$ from $(0,0)$ to $(1,1)$: since $\mathbf F$ is conservative, the path itself does not matter — $\int_C\mathbf F\cdot d\mathbf r=\phi(1,1)-\phi(0,0)=\left(1-\frac13\right)-0=\frac23$.

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: is F = (2xy, x²-y²) conservative? Evaluate ∫_C F·dr","steps":[{"prompt":"For F = (2xy, x² − y²), compute ∂Q/∂x where Q = x² − y².","hint":"Differentiate x² − y² with respect to x, treating y as constant.","answer":"∂Q/∂x = 2x"},{"prompt":"Now compute ∂P/∂y where P = 2xy, and state whether F is conservative.","hint":"Differentiate 2xy with respect to y, treating x as constant. Then compare with ∂Q/∂x.","answer":"∂P/∂y = 2x. Since ∂Q/∂x = ∂P/∂y = 2x, F is conservative."},{"prompt":"Using the scalar potential φ = x²y − y³/3, evaluate ∫_C F·dr from (0,0) to (1,1).","hint":"For a conservative field, ∫_C F·dr = φ(endpoint) − φ(startpoint). Plug in (1,1) and (0,0).","answer":"φ(1,1) − φ(0,0) = (1 − 1/3) − 0 = 2/3"}]}
```
