---
# Alternative body for line-integrals.worked-example, served when the learner stance is
# `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
id: line-integrals.worked_example.assured
concept_id: line-integrals
atom_type: worked_example
bloom_level: 3
difficulty: 0.40
exam_ids: ["*"]
scaffold_fade: true
variant_of: line-integrals.worked_example
for_stance: assured
---

$\int_C(2x+y)\,ds$, $\mathbf r(t)=(t,t)$, $t\in[0,1]$: $|\mathbf r'(t)|=\sqrt2$, and on the path $2x+y=3t$, so $\int_0^13t\sqrt2\,dt=\sqrt2\cdot\frac32=\frac{3\sqrt2}{2}$.

Worth noticing: this is a scalar line integral — $ds$, not $d\mathbf r\cdot\mathbf F$ — so there is no conservative-field shortcut available here regardless of what $2x+y$ looks like; $ds$ is always positive, and the answer would be identical for the reverse parametrization $t\mapsto1-t$. That shortcut only exists for the vector form $\int_C\mathbf F\cdot d\mathbf r$, and only when $\mathbf F$ is a gradient. Confusing which form you are holding is the actual risk here, not the arithmetic.

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: Line integral on a straight segment","steps":[{"prompt":"Given the parametrization $\\mathbf{r}(t) = (t, t)$, what is the derivative $\\frac{d\\mathbf{r}}{dt}$?","hint":"Component-wise: $\\frac{dx}{dt} = 1$ and $\\frac{dy}{dt} = 1$.","answer":"$\\frac{d\\mathbf{r}}{dt} = (1, 1)$"},{"prompt":"What is the magnitude $\\left|\\frac{d\\mathbf{r}}{dt}\\right|$?","hint":"Use the distance formula: $\\sqrt{(1)^2 + (1)^2}$.","answer":"$\\sqrt{2}$"},{"prompt":"Substitute the parametrization into $f(x,y) = 2x + y$ to get $f(x(t), y(t))$.","hint":"When $x = t$ and $y = t$, the function becomes $2t + t$.","answer":"$3t$"},{"prompt":"Now integrate: $\\int_0^1 3t \\cdot \\sqrt{2} \\, dt$. What is the result?","hint":"Pull out the constant $\\sqrt{2}$ and integrate $3t$.","answer":"$\\frac{3\\sqrt{2}}{2}$"}],"caption":"Master line integral evaluation: parametrize → differentiate → substitute → integrate."}
```
